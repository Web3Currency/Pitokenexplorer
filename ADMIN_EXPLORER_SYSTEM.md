# Admin Explorer Control System

## Overview
Complete admin control over token and liquidity pool visibility with metadata management for a curated, monetizable explorer.

## File Structure

```
lib/admin/
├── tokenStore.ts          # Token visibility, verification, and metadata
├── poolStore.ts           # Pool visibility and cascade hiding
├── questStore.ts          # Quest management (existing)
├── sessionStore.ts        # Admin sessions (existing)
└── fileStorage.ts         # JSON file operations (existing)

app/api/admin/
├── tokens/route.ts        # Token CRUD: hide/show/verify/updateMetadata
├── pools/route.ts         # Pool CRUD: hide/show
├── quests/route.ts        # Quest management (existing)
└── login/route.ts         # Admin authentication (existing)

app/api/explorer/
├── tokens/registry/route.ts   # Public token list (filtered + metadata)
└── pools/route.ts             # Public pool list (filtered by token/pool)

app/admin/explorer/
└── page.tsx               # Admin UI with Tokens | Pools tabs

admin-data/                # Git-ignored JSON storage
├── tokens.json           # { hiddenTokenIds: [], tokenMetadata: {} }
├── pools.json            # { hiddenPoolIds: [] }
└── quests.json           # Quest data (existing)
```

## Key Features

### Token Management
- **Hide/Show**: Control visibility in public explorer
- **Verify/Unverify**: Mark tokens as verified with badge
- **Metadata**: Edit logo URL, category, description
- **Cascade**: Hiding a token auto-hides all pools using it

### Pool Management
- **Hide/Show**: Control pool visibility
- **Auto-filter**: Pools hidden when token is hidden
- **Independent**: Can also hide pools manually

### Public APIs
- `/api/explorer/tokens/registry`: Returns filtered tokens with admin metadata
- `/api/explorer/pools`: Returns filtered pools (excludes hidden tokens/pools)

## Admin UI

### Tokens Tab
| Token | Verification | Status | Actions |
|-------|--------------|--------|---------|
| W3C   | ✓ Verified   | Visible| Edit / Hide |
| SCAM  | ✗ Unverified | Hidden | Edit / Show |

Actions:
- **Edit**: Opens dialog to update logo URL, category, description
- **Verify/Unverify**: Toggle verification badge
- **Hide/Show**: Toggle visibility (cascade to pools)

### Pools Tab
| Pool | Status | Action |
|------|--------|--------|
| W3C/PI | Visible | Hide |
| SCAM/PI | Hidden | Show |

Note: Pools auto-hide when their token is hidden.

## Data Flow

### Hiding a Token
1. Admin clicks "Hide" on token
2. `hideToken(tokenId)` called
3. Token added to `hiddenTokenIds[]`
4. `hidePoolsByToken(tokenId)` cascades
5. Public APIs filter out token + all its pools

### Updating Metadata
1. Admin clicks "Edit" on token
2. Dialog opens with current values
3. Admin updates logo/category/description
4. `updateTokenMetadata(tokenId, metadata)` called
5. Metadata stored in `tokenMetadata[tokenId]`
6. Public API merges metadata into token response

### Verifying a Token
1. Admin clicks "Verified" button
2. `verifyToken(tokenId)` called
3. `tokenMetadata[tokenId].verified = true`
4. Public sees verification badge

## Integration Points

### Token Registry API (`/api/explorer/tokens/registry`)
```typescript
// Returns tokens with admin overrides applied
{
  id: "W3C:GAB...",
  symbol: "W3C",
  verified: true,        // From admin metadata
  logoUrl: "https://...", // From admin metadata
  category: "Social",     // From admin metadata
  description: "...",     // From admin metadata
  // ... other horizon data
}
```

### Explorer Components
- Uses `/api/explorer/tokens/registry` for token list
- Uses `/api/explorer/pools` for pool list
- Both automatically filtered and enriched

## Monetization Ready

### Listing Fees
Future: Add `listingFee` and `expiresAt` to token metadata
- Creators pay to list tokens
- Admin approves and sets expiry
- Auto-hide when expired

### Featured Placement
Future: Add `featured` flag to token metadata
- Premium placement in explorer
- Highlighted badges and positioning

### Verification Badges
Current: Admin-controlled verification
- Builds trust and value
- Can charge for verification services

## Security

- All admin routes check session (via `sessionStore.ts`)
- File-based storage (JSON) - simple, no DB needed
- Git-ignored data files prevent accidental commits
- Cascade hiding prevents orphaned visibility

## Future Enhancements

1. **Analytics**: Track views per token/pool
2. **Bulk Actions**: Hide/show multiple tokens at once
3. **History**: Audit log of admin actions
4. **Automation**: Auto-hide low-liquidity pools
5. **Categories**: Custom category management
6. **Import/Export**: Bulk metadata updates via CSV
