# Admin Control Center - Quick Start Setup

## Step 1: Create Tables in Supabase

1. Go to your Supabase Dashboard
2. Open the **SQL Editor**
3. Copy the entire content from: `ADMIN_SUPABASE_SCHEMA.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute

This will create:
- ✅ 7 admin data tables
- ✅ All RLS policies for admin-only access
- ✅ Audit logging table
- ✅ All necessary indexes

---

## Step 2: Set Admin Role for Users

To make a user an admin, update their metadata in Supabase Auth:

```sql
-- In Supabase SQL Editor, run:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

Or via the Supabase Auth Dashboard:
1. Go to **Authentication > Users**
2. Select the user
3. Click **User Metadata** (JSON tab)
4. Add: `{"role": "admin"}`
5. Save

---

## Step 3: What Admins Can Control

### MARKET TAB - Tokens
Admins can:
- Add new tokens with name, symbol, issuer
- Set token rank (display order)
- Mark tokens as verified
- Upload token icons & colors
- Set token category
- Link to liquidity pool
- Show/hide tokens with `enabled` flag

**Table:** `tokens_metadata`

### LIQUIDITY POOLS TAB
Admins can:
- Create liquidity pools
- Configure token pairs
- Set pool liquidity amounts
- Set 24h volume
- Set APR percentage
- Set fees earned
- Upload pool icons
- Set pool rank/order
- Show/hide pools with `enabled` flag

**Tables:** `liquidity_pools_metadata`, `pool_pairs`

### MARKET STATS (Top section)
Admins can:
- Override total liquidity
- Set liquidity 24h change %
- Set token count
- Set token count change %
- Set active pools count
- Designate largest pool
- Toggle between calculated vs manual stats

**Table:** `market_stats_override`

### DOMAINS TAB
Admins can:
- Add new domains
- Set registrar info
- Set pricing
- Set registration/expiration dates
- Mark as verified
- Upload icons & colors
- Set rank/order

**Table:** `domains_metadata`

### TOKEN & POOL LINKS
Admins can:
- Add trade, app, watchlist, about links for tokens
- Add info & analytics links for pools
- Toggle links on/off with `enabled` flag

**Tables:** `token_links`, `pool_links`

---

## Step 4: Data Flow

```
Frontend (Explorer Page)
    ↓
API Endpoints (fetch data)
    ↓
Admin Tables (via RLS policies)
    ↓
Display to Users/Admins
```

### For Users:
- Can only see records where `enabled = TRUE`
- Cannot edit or delete

### For Admins:
- Can see ALL records (including disabled)
- Can CREATE new records
- Can UPDATE any record
- Cannot DELETE (soft delete via `enabled = FALSE`)
- All changes logged in `admin_audit_log`

---

## Step 5: Example Admin Operations

### Add a new token
```json
{
  "code": "USDC",
  "issuer": "GBUQWP3BOUZX34HHYVSL42FGLVS5YKQVJ3U4VJ3KQH2P3XMXZYW4NZ",
  "name": "USD Coin",
  "symbol": "USDC",
  "icon_url": "https://...",
  "color": "#2775CA",
  "category": "stablecoin",
  "verified": true,
  "rank": 1,
  "enabled": true
}
```

### Update market stats
```json
{
  "network": "Pi Testnet",
  "total_liquidity": "1,245,890.50",
  "liquidity_change_percent": "+5.23%",
  "total_tokens": 150,
  "token_count_change_percent": "+12%",
  "active_pools_count": 45,
  "use_overrides": true
}
```

### Create a liquidity pool
```json
{
  "name": "PI/USDC",
  "token1_id": "uuid-of-pi-token",
  "token2_id": "uuid-of-usdc-token",
  "total_liquidity": "500,000.00",
  "volume_24h": "125,000.00",
  "apr_percentage": 12.50,
  "fees_24h": "1,250.00",
  "rank": 1,
  "enabled": true
}
```

---

## Step 6: Security Features

✅ **Row Level Security (RLS):**
- Public users can only READ enabled data
- Admins can CRUD all data
- Access checked via `auth.users` role metadata

✅ **Audit Logging:**
- Every admin change is logged
- Includes: admin_id, table, action, old_values, new_values, timestamp

✅ **Soft Deletes:**
- Records are never truly deleted
- Admins set `enabled = FALSE` to hide
- Data remains in audit log for compliance

✅ **Data Validation:**
- UUID foreign keys ensure referential integrity
- Unique constraints prevent duplicates
- Timestamps auto-populate

---

## Step 7: Next - Frontend Integration

After tables are created, you need to:

1. Update API endpoints to read from `tokens_metadata` instead of mock data
2. Create admin CRUD endpoints
3. Build admin dashboard UI
4. Update explorer to fetch from real tables

Example API route:
```typescript
// app/api/explorer/tokens/registry
const { data } = await supabase
  .from('tokens_metadata')
  .select('*')
  .eq('enabled', true)
  .order('rank', { ascending: true })
```

---

## Troubleshooting

**Problem:** Admin can't see records  
**Solution:** Check user's metadata has `{"role": "admin"}`

**Problem:** RLS policies reject requests  
**Solution:** Ensure user is authenticated with correct role

**Problem:** Can't create new records  
**Solution:** Verify foreign key references (token_ids, pool_ids) exist first

**Problem:** Performance is slow  
**Solution:** Check indexes are created - they're built automatically with the SQL script

---

## Support

For detailed info about:
- All admin control points → See `ADMIN_CONTROL_MAPPING.md`
- All table structures → See `ADMIN_SUPABASE_SCHEMA.sql`
- RLS policy logic → See inline comments in SQL script
