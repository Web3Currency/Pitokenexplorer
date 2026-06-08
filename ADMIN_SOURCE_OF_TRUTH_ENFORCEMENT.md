# Admin Dashboard → Explorer Control Settings Enforcement

## Objective
Enforce Admin Dashboard as the **single source of truth** for all Explorer UI display logic.  
Explorer UI is now a **pure renderer** that displays only what admin provides.

---

## Issues Fixed

### 1. **Token Logo - Admin Only, No Fallbacks**

**Previous Behavior:**
- Hardcoded gradient backgrounds (`from-purple-500 to-purple-700`)
- Generated icons from first character (`token.icon`)
- NO admin logo URL used

**New Behavior:**
- Logo displays **ONLY** if admin sets `logoUrl` in token metadata
- No fallback gradients or generated icons
- If no logoUrl provided: shows neutral placeholder with first letter
- If admin logoUrl fails to load: falls back to placeholder

**Files Changed:**
- `/components/explore-section.tsx` (lines 730-753)

**Code:**
```tsx
{/* ENFORCE: Logo from admin ONLY */}
{(token as any).logoUrl ? (
  <img src={(token as any).logoUrl} alt={token.symbol} 
       className="w-10 h-10 rounded-full" />
) : (
  <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground">
    {token.symbol[0]}
  </div>
)}
```

---

### 2. **Verification Badge - Admin Decision Only**

**Previous Behavior:**
- Complex 5-condition heuristic checking:
  - Price exists
  - Liquidity exists
  - Circulating supply defined
  - Holders count > 0
  - Pool ID exists
- Auto-verification based on data completeness
- External domain verification checks

**New Behavior:**
- Badge shows **ONLY** if admin sets `verified: true` in token metadata
- No heuristics, no auto-verify, no data-based inference
- Simple boolean check: `token.verified === true`

**Files Changed:**
- `/components/explore-section.tsx` (lines 751-756)
- `/lib/token-verification.ts` (DELETED)
- `/components/token-dialog.tsx` (removed verification logic)

**Code:**
```tsx
{/* ENFORCE: Verification badge from admin ONLY */}
{token.verified === true && (
  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
    Verified
  </span>
)}
```

---

### 3. **Category Filter - Admin-Defined Categories Only**

**Previous Behavior:**
- Hardcoded category registry in `lib/horizon-fetcher.ts`:
  ```ts
  const categoryRegistry: Record<string, string> = {
    PI: "Utilities",
    W3C: "Social",
    ARC: "Finance",
    BAL: "Travel",
    PIZ: "Commerce",
    SHR: "Entertainment"
  }
  ```
- Fallback to "Utilities" if not in registry
- Client-side category inference

**New Behavior:**
- **NO** hardcoded category mappings
- Category comes **ONLY** from admin metadata
- If admin doesn't set category: shows as `null` (uncategorized)
- Filter reads directly from admin-provided categories

**Files Changed:**
- `/lib/horizon-fetcher.ts` (lines 592-614, removed registry)
- `/app/api/explorer/tokens/registry/route.ts` (enforced metadata priority)

**Code:**
```ts
// REMOVED: Hardcoded category registry
// Admin defines all categories via tokenStore metadata
.map((t, index) => ({
  // ...
  category: null, // Set by admin only
  verified: false, // Set by admin only
  logoUrl: null, // Set by admin only
}))
```

---

### 4. **Verified Tokens Count - Admin Source**

**Previous Behavior:**
- Complex calculation checking ALL tokens against 5 criteria:
  1. Verified trustline holders
  2. Valid issuer accounts
  3. Active liquidity pools
  4. Circulating supply defined
  5. Linked domain with price
- External API calls to domain service
- Heuristic-based verification

**New Behavior:**
- Simple count: `tokens.filter(t => t.verified === true).length`
- Reads **ONLY** from admin tokenStore
- No external checks, no heuristics

**Files Changed:**
- `/lib/horizon-fetcher.ts` (lines 1577-1593, simplified function)
- `/lib/horizon-fetcher.ts` (deleted `checkTokenVerification` function)

**Code:**
```ts
async function calculateVerifiedTokensCount(pools: PoolData[]): Promise<number> {
  const { getTokensWithVisibility } = await import("@/lib/admin/tokenStore")
  const tokensWithMetadata = await getTokensWithVisibility()
  
  // Count only tokens where admin explicitly set verified=true
  return tokensWithMetadata.filter(token => token.verified === true).length
}
```

---

## API Layer Enforcement

### `/app/api/explorer/tokens/registry/route.ts`

**Previous:**
```ts
verified: metadata.verified || token.verified || false
category: metadata.category || token.category
logoUrl: metadata.logoUrl
```

**Now:**
```ts
// ENFORCE: Admin Dashboard is the ONLY source of truth
verified: metadata.verified  // No fallbacks
category: metadata.category || null  // No default
logoUrl: metadata.logoUrl || null  // No generation
```

---

## Deleted Files

1. **`/lib/token-verification.ts`** - Entire file deleted
   - Contained 5-condition verification heuristics
   - External domain verification
   - Complex auto-verify logic

---

## Admin Panel Integration

The Admin Dashboard at `/app/admin/explorer/page.tsx` remains the **control center**:

- Admins set `verified` flag manually
- Admins upload/set `logoUrl` manually
- Admins choose `category` from dropdown
- Admins define all metadata fields

**No automatic verification, inference, or fallbacks exist.**

---

## Data Flow (Enforced)

```
Admin Dashboard
    ↓ (sets metadata)
Token Store (.admin-data/tokens.json)
    ↓ (reads metadata)
API Layer (/api/explorer/tokens/registry)
    ↓ (returns ONLY admin data)
Explorer UI (components/explore-section.tsx)
    ↓ (renders as-is, no logic)
User View
```

**No side paths. No fallbacks. No inference.**

---

## Filter System Enforcement

### Verification Filter

**Previous:**
```ts
const tokenIsVerified = isTokenVerified({
  token, trustlines, holders, liquidity, 
  circulatingSupply, poolId
}, domains)
```

**Now:**
```ts
// ENFORCE: Read ONLY from admin verified flag
const tokenIsVerified = token.verified === true
```

### Category Filter

- Reads directly from `token.category` (set by admin)
- No hardcoded category list
- If category is `null`, token is uncategorized

---

## Testing the Enforcement

1. **Logo Test:**
   - Set logoUrl in admin → logo appears
   - Remove logoUrl → neutral placeholder appears
   - NO purple gradient should ever appear

2. **Verification Test:**
   - Set verified=false in admin → NO badge
   - Set verified=true in admin → badge appears
   - Data completeness should NOT affect badge

3. **Category Test:**
   - Set category in admin → filter works
   - Remove category → token shows as uncategorized
   - Hardcoded "Utilities" should NOT appear

4. **Verified Count Test:**
   - Count in stats matches number of tokens with verified=true
   - NOT based on data completeness

---

## Migration Notes

**For existing tokens:**
- All tokens start with `verified: false`, `category: null`, `logoUrl: null`
- Admins must manually review and set metadata
- NO automatic migration of old verification heuristics

**For new tokens:**
- Discovered from Horizon API as usual
- Appear in Explorer with default admin metadata (all false/null)
- Admins must manually configure display properties

---

## Summary

Explorer UI is now a **dumb renderer**:
- Displays what admin provides
- No logic, no inference, no fallbacks
- Pure visualization layer

Admin Dashboard is the **brain**:
- Single source of truth
- All display decisions made here
- Full control over user experience

This enforces:
- ✅ Consistent token display
- ✅ No rogue auto-verification
- ✅ Clear data ownership
- ✅ Audit-friendly verification process
