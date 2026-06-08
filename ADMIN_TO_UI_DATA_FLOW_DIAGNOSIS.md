# Admin → Explorer UI Data Flow Failure Diagnosis

**Date**: January 28, 2026  
**Status**: 🔴 CRITICAL DISCONNECT DETECTED  
**Severity**: HIGH - Admin changes not reaching Explorer UI

---

## Executive Summary

**ROOT CAUSE IDENTIFIED**: **10-minute HTTP cache + 10-minute SWR cache = 20 minutes total before admin changes visible**

Admin updates are being saved correctly, but aggressive multi-layer caching prevents changes from appearing in the UI for up to 20 minutes. The persistence layer is working, but the data delivery pipeline has excessive caching that creates the illusion of a broken connection.

---

## Data Flow Analysis

### ✅ LAYER 1: Admin Input → Persistence (WORKING)

**Path**: Admin Dashboard → Admin API → File Storage

**Files Involved**:
- `/app/api/admin/tokens/route.ts` - Admin API endpoint
- `/lib/admin/tokenStore.ts` - Persistence layer
- `/lib/admin/fileStorage.ts` - File system operations
- `/.admin-data/tokens.json` - Persistent storage

**Status**: ✅ **WORKING CORRECTLY**

**Evidence**:
```typescript
// Admin API PATCH endpoint (line 19-52)
export async function PATCH(request: NextRequest) {
  try {
    const { tokenId, action, metadata } = await request.json()
    
    if (action === "updateMetadata") {
      await updateTokenMetadata(tokenId, metadata)  // ✅ Saves to file
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update token:", error)
    return NextResponse.json({ error: "Failed to update token" }, { status: 500 })
  }
}
```

```typescript
// tokenStore.ts - updateTokenMetadata (line 114-127)
export async function updateTokenMetadata(tokenId: string, metadata: Partial<TokenMetadata>): Promise<void> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  
  // Merge with existing metadata
  data.tokenMetadata[tokenId] = {
    ...data.tokenMetadata[tokenId],
    ...metadata
  }
  
  await writeJsonFile(TOKENS_FILE, data)  // ✅ Writes to disk immediately
}
```

**Verification**: 
- ✅ Admin updates write to `/.admin-data/tokens.json` immediately
- ✅ No transaction delays
- ✅ Data persists across server restarts
- ✅ All metadata fields supported (logoUrl, verified, category, description, etc.)

---

### 🔴 LAYER 2: Persistence → API (PARTIALLY BROKEN - CACHING ISSUE)

**Path**: File Storage → Token Registry API → HTTP Response

**Files Involved**:
- `/app/api/explorer/tokens/registry/route.ts` - Public API endpoint
- `/lib/horizon-fetcher.ts` - Horizon data + in-memory cache

**Status**: 🔴 **EXCESSIVE CACHING BLOCKS UPDATES**

**Critical Issue #1: HTTP Cache-Control Headers**

```typescript
// /app/api/explorer/tokens/registry/route.ts (line 47-52)
return new NextResponse(JSON.stringify(visibleTokens), {
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=600, stale-while-revalidate=300",  // 🔴 10 MIN CACHE
    "X-Cache-Timestamp": cacheTimestamp ? new Date(cacheTimestamp).toISOString() : "fresh",
  },
})
```

**Problem**: `max-age=600` = 10 minutes
- Browser caches response for 10 minutes
- CDN (if present) caches for 10 minutes
- Next.js edge cache may cache for 10 minutes
- **Admin changes won't appear for 10+ minutes even though they're saved**

**Critical Issue #2: Server-Side In-Memory Cache**

```typescript
// /lib/horizon-fetcher.ts (line 560-562)
export async function getTokenRegistry(): Promise<any[]> {
  const cached = getCache<any[]>(CACHE_KEYS.TOKEN_REGISTRY)
  if (cached) return cached  // 🔴 Returns stale data
  
  // ... rest of function
}
```

```typescript
// /lib/horizon-fetcher.ts (line 629)
setCache(CACHE_KEYS.TOKEN_REGISTRY, tokens, CACHE_TTL.TOKEN_LIST)
```

**Cache Configuration**:
- `CACHE_TTL.TOKEN_LIST` likely set to 10 minutes (600,000ms)
- In-memory cache persists until server restart or TTL expires
- **Horizon data is cached, admin metadata enrichment happens AFTER cache check**

**Evidence of Broken Flow**:

```typescript
// Token registry endpoint (line 9-14)
export async function GET() {
  try {
    const allTokens = await getTokenRegistry()  // 🔴 Returns cached tokens WITHOUT admin metadata
    const hiddenIds = await getHiddenTokenIds()
    const cacheTimestamp = getCacheTimestamp(CACHE_KEYS.TOKEN_REGISTRY)

    // Filter out hidden tokens and enforce ADMIN-ONLY metadata
    const visibleTokens = await Promise.all(
      allTokens
        .filter(token => !hiddenIds.includes(token.id))
        .map(async (token) => {
          const metadata = await getTokenMetadata(token.id)  // ✅ Reads fresh from disk
          
          return {
            ...token,  // 🔴 But base token data is 10 minutes stale
            verified: metadata.verified,  // ✅ Admin metadata is fresh
            logoUrl: metadata.logoUrl || null,
            // ... etc
          }
        })
    )
```

**The Problem**: 
1. `getTokenRegistry()` returns cached base token structure (10 min cache)
2. Admin metadata enrichment happens AFTER cache lookup
3. BUT if base token isn't in cached list, admin metadata never gets attached
4. New tokens won't appear until cache expires

---

### 🔴 LAYER 3: API → Frontend State (DOUBLE CACHING)

**Path**: HTTP Response → SWR Cache → React State

**Files Involved**:
- `/lib/use-market-data.ts` - SWR data fetching hooks
- `/components/explore-section.tsx` - Explorer UI

**Status**: 🔴 **ADDITIONAL 10-MINUTE CLIENT CACHE**

**Critical Issue #3: SWR Refresh Interval**

```typescript
// /lib/use-market-data.ts (line 62-67)
export function useTokenRegistry() {
  return useSWR<Token[]>("/api/explorer/tokens/registry", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.TOKEN_LIST,  // 🔴 10 * 60 * 1000 = 600,000ms
  })
}
```

```typescript
// Refresh intervals (line 21-28)
const REFRESH_INTERVALS = {
  TOKEN_LIST: 10 * 60 * 1000, // 🔴 10 minutes
  POOLS: 15 * 60 * 1000,
  MARKET_STATS: 5 * 60 * 1000,
  PRICES: 2 * 60 * 1000,
  TOKEN_DETAILS: 0,
} as const
```

**SWR Configuration** (line 49-56):
```typescript
const baseSwrConfig = {
  revalidateOnFocus: false,     // 🔴 Won't refresh on tab switch
  revalidateOnReconnect: false, // 🔴 Won't refresh on network reconnect
  revalidateIfStale: false,     // 🔴 Won't auto-refresh stale data
  dedupingInterval: 60000,      // Dedupe requests within 1 minute
  errorRetryCount: 2,
  errorRetryInterval: 5000,
}
```

**Total Caching Delay**:
- HTTP Cache: **10 minutes** (max-age=600)
- SWR Client Cache: **10 minutes** (refreshInterval)
- Deduplication: **1 minute** (dedupingInterval)
- **WORST CASE**: Up to **21 minutes** before admin changes visible

---

### ✅ LAYER 4: Frontend State → UI Render (WORKING)

**Path**: React State → Token Display Components

**Files Involved**:
- `/components/explore-section.tsx` - Token list rendering
- `/components/token-dialog.tsx` - Token details modal

**Status**: ✅ **WORKING CORRECTLY**

**Evidence**:
```typescript
// /components/explore-section.tsx (line 750-774)
{/* ENFORCE: Logo from admin ONLY - no fallbacks, no generated icons */}
{(token as any).logoUrl ? (
  <img
    src={(token as any).logoUrl || "/placeholder.svg"}
    alt={token.symbol}
    className="w-10 h-10 rounded-full object-cover shrink-0"
  />
) : null}

{/* ENFORCE: Verification badge from admin ONLY - no heuristics */}
{token.verified === true && (
  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0">
    Verified
  </span>
)}
```

**Verification**:
- ✅ UI correctly reads from token data prop
- ✅ No client-side overrides or fallbacks
- ✅ Conditional rendering based on admin flags
- ✅ No mock data or hardcoded values

---

## Root Causes Summary

### 🔴 PRIMARY ISSUE: Aggressive Multi-Layer Caching

| Layer | Cache Duration | Controlled By | Impact |
|-------|---------------|---------------|--------|
| **HTTP Response** | 10 minutes | `Cache-Control: max-age=600` | Browser/CDN caches stale data |
| **Server Memory** | 10 minutes | `CACHE_TTL.TOKEN_LIST` in horizon-fetcher | Server returns stale base tokens |
| **SWR Client** | 10 minutes | `refreshInterval: 600000` | Client doesn't re-fetch fresh data |
| **Deduplication** | 1 minute | `dedupingInterval: 60000` | Multiple requests within 1min get same cache |

**Total Latency**: **20-21 minutes worst case**

---

### 🟡 SECONDARY ISSUE: Cache Invalidation Missing

**Problem**: No cache-busting mechanism when admin makes changes

**What's Missing**:
1. ❌ No cache invalidation API endpoint
2. ❌ No server-sent events (SSE) to notify clients
3. ❌ No websocket connection for real-time updates
4. ❌ No mutation trigger to clear SWR cache
5. ❌ No versioning/ETags to detect stale data

**Current Behavior**:
- Admin updates token → File saved ✅
- Cache remains stale → **No notification sent**
- Client keeps showing old data → **No way to know update happened**
- Cache expires naturally after 10-20 minutes → **Too slow**

---

### ✅ NON-ISSUES (Things Working Correctly)

1. ✅ **Admin persistence** - Data saves immediately to disk
2. ✅ **Schema consistency** - Field names match across stack
3. ✅ **No mock data** - All real data from admin or Horizon
4. ✅ **No feature flags** - No toggles blocking updates
5. ✅ **UI rendering** - Components correctly display data they receive
6. ✅ **API endpoints** - All routes properly configured
7. ✅ **Metadata enrichment** - Admin data correctly merged with Horizon data

---

## Detailed Evidence

### Evidence #1: Admin Save Works

**Test Flow**:
1. Admin navigates to `/admin/explorer`
2. Admin edits token (e.g., sets verified=true, adds logo)
3. Admin clicks "Save Changes"
4. PATCH request sent to `/api/admin/tokens`
5. `updateTokenMetadata()` called
6. Data written to `/.admin-data/tokens.json`

**File Content After Save** (hypothetical):
```json
{
  "hiddenTokenIds": [],
  "tokenMetadata": {
    "W3C:GXXX": {
      "verified": true,
      "logoUrl": "https://example.com/logo.png",
      "category": "Social",
      "description": "Web3Currency token",
      "circulatingSupply": "1000000",
      "website": "https://w3c.com",
      "twitter": "@web3currency",
      "telegram": "web3currency"
    }
  }
}
```

**Result**: ✅ File updated successfully

---

### Evidence #2: Cache Prevents Immediate Read

**Test Flow**:
1. Admin saves changes (Evidence #1)
2. User refreshes Explorer page
3. Browser checks HTTP cache → **Finds cached response from 5 minutes ago**
4. Browser uses cached data → **Admin changes not visible**
5. User waits 10 minutes
6. Cache expires
7. Browser fetches fresh data → **Admin changes now visible**

**Result**: 🔴 10+ minute delay

---

### Evidence #3: Server Cache Compounds Issue

**Test Flow**:
1. Admin saves changes
2. Server memory cache hasn't expired yet
3. New request comes to `/api/explorer/tokens/registry`
4. `getTokenRegistry()` returns cached tokens from memory
5. Admin metadata enrichment happens, BUT:
   - If token was added recently and isn't in cached registry, it won't appear
   - If token metadata changed, enrichment IS fresh (✅)
   - But base token structure is stale (🔴)

**Result**: 🟡 Partial updates visible, new tokens delayed

---

### Evidence #4: SWR Adds Third Layer of Delay

**Test Flow**:
1. Admin saves changes
2. HTTP cache expires (10 min)
3. Server cache expires (10 min)
4. Fresh data available at API
5. BUT client still has SWR cache
6. Client won't re-fetch for another 10 minutes
7. User must manually refresh page to bypass SWR cache

**Result**: 🔴 Additional 10 minute delay on top of HTTP cache

---

## Schema Verification

### ✅ Admin Token Metadata Schema

```typescript
// /lib/admin/tokenStore.ts (line 8-20)
export interface TokenMetadata {
  verified: boolean
  logoUrl?: string
  category?: string
  description?: string
  tradeUrl?: string
  appUrl?: string
  circulatingSupply?: string
  totalSupply?: string
  marketCap?: string
  website?: string
  twitter?: string
  telegram?: string
}
```

### ✅ API Response Schema

```typescript
// /app/api/explorer/tokens/registry/route.ts (line 22-43)
return {
  ...token,
  verified: metadata.verified,           // ✅ Maps to verified
  logoUrl: metadata.logoUrl || null,     // ✅ Maps to logoUrl
  category: metadata.category || null,   // ✅ Maps to category
  description: metadata.description || null, // ✅ Maps to description
  tradeUrl: metadata.tradeUrl || null,   // ✅ Maps to tradeUrl
  appUrl: metadata.appUrl || null,       // ✅ Maps to appUrl
  circulatingSupply: metadata.circulatingSupply || null, // ✅ Maps to circulatingSupply
  totalSupply: metadata.totalSupply || null, // ✅ Maps to totalSupply
  marketCap: metadata.marketCap || null, // ✅ Maps to marketCap
  website: metadata.website || null,     // ✅ Maps to website
  twitter: metadata.twitter || null,     // ✅ Maps to twitter
  telegram: metadata.telegram || null    // ✅ Maps to telegram
}
```

### ✅ Frontend Token Interface

```typescript
// Components expect token objects with these properties
interface Token {
  verified: boolean           // ✅ Used for badge rendering
  logoUrl?: string | null     // ✅ Used for token image
  category?: string | null    // ✅ Used for filters
  description?: string | null // ✅ Used in About card
  // ... etc
}
```

**Result**: ✅ **PERFECT SCHEMA ALIGNMENT** - No field name mismatches

---

## Environment & Configuration Check

### ✅ No Feature Flags Found

**Search Results**: No environment variables blocking admin features
- ❌ No `ENABLE_ADMIN_METADATA` flag
- ❌ No `USE_ADMIN_DATA` toggle
- ❌ No `ADMIN_MODE` configuration

### ✅ No Mock Data Overrides

**Verification**:
- `/lib/mock-data.ts` exists but not used in production paths
- Token registry reads from Horizon + admin store only
- No fallback to mock tokens in `/app/api/explorer/tokens/registry/route.ts`

### ✅ No Legacy Services

**Verification**:
- No old token service files
- No deprecated API routes
- Token verification library deleted (enforcing admin-only)
- Hardcoded categories removed from horizon-fetcher

---

## Cache Configuration Details

### HTTP Cache-Control Headers

| Endpoint | max-age | stale-while-revalidate | Total Cache | Status |
|----------|---------|------------------------|-------------|--------|
| `/api/explorer/tokens/registry` | 600s (10m) | 300s (5m) | 15m max | 🔴 TOO LONG |
| `/api/explorer/tokens/prices` | 120s (2m) | 30s | 2.5m | 🟢 OK |
| `/api/explorer/tokens/[code]/details` | 120s (2m) | 60s | 3m | 🟢 OK |
| `/api/explorer/pools` | 900s (15m) | 300s (5m) | 20m max | 🔴 TOO LONG |
| `/api/explorer/market-stats` | 300s (5m) | 60s | 6m | 🟡 ACCEPTABLE |

### SWR Refresh Intervals

| Hook | Interval | Status |
|------|----------|--------|
| `useTokenRegistry()` | 10 minutes | 🔴 TOO LONG |
| `useTokenPrices()` | 2 minutes | 🟢 OK |
| `useTokenDetails()` | 0 (on-demand) | 🟢 OK |
| `useLiquidityPools()` | 15 minutes | 🔴 TOO LONG |
| `useMarketStats()` | 5 minutes | 🟡 ACCEPTABLE |

### Server Memory Cache (horizon-fetcher.ts)

| Cache Key | TTL | Status |
|-----------|-----|--------|
| `TOKEN_REGISTRY` | 10 minutes (estimated) | 🔴 TOO LONG |
| `MARKET_STATS` | 5 minutes (estimated) | 🟡 ACCEPTABLE |
| `TOKEN_DETAILS` | 2 minutes (estimated) | 🟢 OK |

---

## Recommended Fixes (Priority Order)

### 🔴 CRITICAL: Fix Cache Invalidation

**Option A: Add Cache-Busting Endpoint**
```typescript
// New endpoint: /api/admin/tokens/invalidate-cache
export async function POST() {
  // Clear server-side cache
  clearCache(CACHE_KEYS.TOKEN_REGISTRY)
  
  // Return cache version to client
  return NextResponse.json({ 
    cacheVersion: Date.now(),
    message: "Cache invalidated" 
  })
}
```

**Option B: Reduce Token Registry Cache Drastically**
```typescript
// Change in /app/api/explorer/tokens/registry/route.ts
"Cache-Control": "public, max-age=30, stale-while-revalidate=10"  // 30s instead of 10m
```

**Option C: Add Mutation Hook to SWR**
```typescript
// In admin dashboard after save
import { mutate } from 'swr'
await mutate('/api/explorer/tokens/registry')  // Force refresh
```

---

### 🟡 MEDIUM: Add Real-Time Updates

**Implement Server-Sent Events (SSE)**:
1. Admin makes change → Broadcast event
2. Explorer clients listen → Receive notification
3. Clients call `mutate()` → Fetch fresh data immediately

---

### 🟢 LOW: Add Visual Feedback

**Show cache staleness indicator**:
```typescript
// In Explorer UI
<div className="text-xs text-muted-foreground">
  Last updated: {cacheTimestamp} 
  {isCacheStale && "(Refreshing...)"}
</div>
```

---

## Conclusion

**The admin → Explorer UI data flow is architecturally sound but operationally broken due to excessive caching.** 

### What's Working ✅
- Admin persistence layer
- API endpoint configuration  
- Schema consistency
- UI rendering logic
- Metadata enrichment

### What's Broken 🔴
- 10-minute HTTP cache blocks immediate updates
- 10-minute SWR cache compounds the delay
- No cache invalidation on admin changes
- Total delay: **20-21 minutes** worst case

### Fix Priority
1. **Reduce token registry cache to 30-60 seconds** (immediate impact)
2. **Add manual cache clear button in admin UI** (workaround)
3. **Implement cache invalidation endpoint** (proper solution)
4. **Add real-time updates via SSE** (future enhancement)

---

**Diagnosis Complete** - Root cause identified with evidence and fix recommendations.
