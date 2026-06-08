# Admin Explorer Control - Quick Start

## What You Can Control

### Tokens
✅ **Hide/Show** - Control visibility in public explorer  
✅ **Verify/Unverify** - Add verification badge  
✅ **Edit Metadata** - Logo URL, category, description  
✅ **Auto-cascade** - Hiding token hides all its pools  

### Pools
✅ **Hide/Show** - Control pool visibility  
✅ **Auto-filter** - Pools hidden when token is hidden  

## Admin UI

Navigate to: `/admin/explorer`

### Tokens Tab
- Search and filter tokens by visibility
- Click **Verify** button to toggle verification badge
- Click **Edit** to update logo, category, description
- Click **Hide** to remove from public explorer (cascades to pools)
- Click **Show** to make visible again

### Pools Tab
- View all liquidity pools
- Pools automatically hidden when their token is hidden
- Can also manually hide/show individual pools

## API Endpoints

### Admin APIs (Protected)
```
GET  /api/admin/tokens       - List all tokens with metadata
PATCH /api/admin/tokens      - Update token (hide/show/verify/updateMetadata)

GET  /api/admin/pools        - List all pools with visibility
PATCH /api/admin/pools       - Update pool (hide/show)
```

### Public APIs (Filtered)
```
GET /api/explorer/tokens/registry  - Filtered tokens with admin metadata
GET /api/explorer/pools            - Filtered pools (excludes hidden)
```

## Token Metadata Fields

```typescript
{
  verified: boolean        // Show verification badge
  logoUrl?: string        // Custom token logo
  category?: string       // Token category
  description?: string    // Token description
}
```

## Cascade Behavior

When you **hide a token**:
1. Token removed from public explorer
2. All pools using that token automatically hidden
3. Both token and pools filtered from public APIs

When you **show a token**:
1. Token becomes visible in explorer
2. Pools remain hidden until manually shown
3. This prevents accidental exposure

## Data Storage

All settings stored in:
```
admin-data/
├── tokens.json  # { hiddenTokenIds: [], tokenMetadata: {} }
└── pools.json   # { hiddenPoolIds: [] }
```

These files are git-ignored and managed by the admin system.

## Common Tasks

### Curate the Explorer
1. Go to `/admin/explorer`
2. Review tokens in Tokens tab
3. Hide scam/spam tokens
4. Verify legitimate projects
5. Switch to Pools tab to manage pools

### Add Token Metadata
1. Find token in Tokens tab
2. Click **Edit** button
3. Add logo URL, select category, add description
4. Click **Save Changes**
5. Public explorer now shows enhanced info

### Feature a Token
1. Click **Verify** to add verification badge
2. Edit metadata to add professional description
3. Token appears more trustworthy to users

## Future Monetization

The system is ready for:
- **Listing fees** - Charge creators to list tokens
- **Verification fees** - Paid verification service
- **Featured placement** - Premium positioning
- **Expiring listings** - Time-based visibility

Add these by extending token metadata with fields like:
```typescript
{
  listingFee?: number
  expiresAt?: string
  featured?: boolean
}
```

## Integration with Explorer

The public explorer automatically:
- Fetches filtered token list from `/api/explorer/tokens/registry`
- Applies admin metadata (verified badge, logo, category)
- Filters out hidden tokens and pools
- Shows curated, high-quality content to users

No changes needed to explorer UI - it just works!
