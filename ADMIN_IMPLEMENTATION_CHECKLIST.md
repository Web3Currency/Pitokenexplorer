# Admin Control Center - Implementation Checklist

## Phase 1: Database Setup (Do This First)

- [ ] **Step 1: Copy SQL Schema**
  - Open `ADMIN_SUPABASE_SCHEMA.sql`
  - Copy entire content

- [ ] **Step 2: Execute in Supabase**
  - Go to Supabase Dashboard
  - Navigate to SQL Editor
  - Paste the SQL
  - Click Run
  - Verify no errors

- [ ] **Step 3: Verify Tables Created**
  - Go to Table Editor in Supabase
  - Confirm these 7 tables exist:
    - [ ] tokens_metadata
    - [ ] liquidity_pools_metadata
    - [ ] pool_pairs
    - [ ] market_stats_override
    - [ ] domains_metadata
    - [ ] token_links
    - [ ] pool_links
    - [ ] admin_audit_log

- [ ] **Step 4: Set Admin Users**
  - Go to Authentication > Users
  - For each admin user:
    - [ ] Click the user
    - [ ] Go to "User Metadata" tab
    - [ ] Add: `{"role": "admin"}`
    - [ ] Save

- [ ] **Step 5: Test RLS Policies**
  - [ ] Log in as regular user - should see only `enabled = true` records
  - [ ] Log in as admin - should see all records
  - [ ] Try to insert as regular user - should be denied
  - [ ] Try to insert as admin - should succeed

---

## Phase 2: Seed Initial Data (Optional but Recommended)

- [ ] **Step 1: Add Sample Tokens**
  - Open Supabase Table Editor
  - Go to `tokens_metadata`
  - Insert sample tokens (PI, USDC, etc.)
  - Set `verified = true` for major tokens
  - Set `enabled = true`

- [ ] **Step 2: Add Sample Liquidity Pools**
  - Go to `liquidity_pools_metadata`
  - Create pools linking token pairs
  - Set realistic liquidity & APR values
  - Set `enabled = true`

- [ ] **Step 3: Add Pool Pairs**
  - Go to `pool_pairs`
  - For each pool, add each token pair
  - Set locked amounts & fees

- [ ] **Step 4: Set Market Stats**
  - Go to `market_stats_override`
  - Create one record for your network
  - Set `use_overrides = false` initially (use calculated values)

- [ ] **Step 5: Add Sample Domains**
  - Go to `domains_metadata`
  - Add domain entries
  - Set registration/expiration dates

---

## Phase 3: API Integration (Connect Tables to Explorer)

- [ ] **Step 1: Update Token Fetch Endpoint**
  - [ ] Create/update `app/api/explorer/tokens/registry`
  - [ ] Query from `tokens_metadata` where `enabled = true`
  - [ ] Join with token prices from live API
  - [ ] Return combined data

```typescript
// Example:
const { data } = await supabase
  .from('tokens_metadata')
  .select('*')
  .eq('enabled', true)
  .order('rank', { ascending: true })
```

- [ ] **Step 2: Update Pool Fetch Endpoint**
  - [ ] Create/update `app/api/explorer/pools`
  - [ ] Query from `liquidity_pools_metadata` where `enabled = true`
  - [ ] Join with `pool_pairs` for each token
  - [ ] Return structured pool data

- [ ] **Step 3: Update Market Stats Endpoint**
  - [ ] Create/update `app/api/explorer/market-stats/instant`
  - [ ] Query from `market_stats_override`
  - [ ] If `use_overrides = true`, return admin values
  - [ ] If `use_overrides = false`, calculate from tokens/pools

- [ ] **Step 4: Update Domain Fetch Endpoint**
  - [ ] Create/update `app/api/explorer/domains`
  - [ ] Query from `domains_metadata` where `enabled = true`
  - [ ] Order by rank

- [ ] **Step 5: Update Token Details Endpoint**
  - [ ] Create/update `app/api/explorer/tokens/[code]/details`
  - [ ] Query from `tokens_metadata`
  - [ ] Include `token_links` data
  - [ ] Join trustlines from live API

- [ ] **Step 6: Add Links Endpoints**
  - [ ] Create `app/api/explorer/tokens/[id]/links`
  - [ ] Create `app/api/explorer/pools/[id]/links`

---

## Phase 4: Admin CRUD Endpoints (Update/Create/Delete)

- [ ] **Step 1: Token Management**
  - [ ] POST `/api/admin/tokens` - Create new token
  - [ ] PUT `/api/admin/tokens/[id]` - Update token
  - [ ] PATCH `/api/admin/tokens/[id]` - Partial update (e.g., disable)
  - [ ] GET `/api/admin/tokens` - List all (admin view)

- [ ] **Step 2: Pool Management**
  - [ ] POST `/api/admin/pools` - Create new pool
  - [ ] PUT `/api/admin/pools/[id]` - Update pool
  - [ ] PATCH `/api/admin/pools/[id]` - Disable pool
  - [ ] GET `/api/admin/pools` - List all (admin view)
  - [ ] POST `/api/admin/pools/[id]/pairs` - Add token pair
  - [ ] PUT `/api/admin/pools/[id]/pairs/[pairId]` - Update pair

- [ ] **Step 3: Market Stats Management**
  - [ ] POST `/api/admin/market-stats` - Create/update stats
  - [ ] PUT `/api/admin/market-stats/[id]` - Update stats
  - [ ] PATCH `/api/admin/market-stats/[id]/toggle-override` - Toggle override mode

- [ ] **Step 4: Domain Management**
  - [ ] POST `/api/admin/domains` - Create new domain
  - [ ] PUT `/api/admin/domains/[id]` - Update domain
  - [ ] PATCH `/api/admin/domains/[id]` - Disable domain
  - [ ] GET `/api/admin/domains` - List all (admin view)

- [ ] **Step 5: Link Management**
  - [ ] POST `/api/admin/tokens/[id]/links` - Add token link
  - [ ] PUT `/api/admin/tokens/[id]/links/[linkId]` - Update token link
  - [ ] DELETE `/api/admin/tokens/[id]/links/[linkId]` - Remove token link
  - [ ] Similar for pool links

- [ ] **Step 6: Image Upload**
  - [ ] Create `app/api/admin/upload` endpoint
  - [ ] Use Supabase Storage for icons/images
  - [ ] Return public URLs

- [ ] **Step 7: Audit Log**
  - [ ] Create `app/api/admin/audit-logs` - Get admin changes
  - [ ] Optional: auto-log via triggers

---

## Phase 5: Admin Dashboard UI (Frontend)

- [ ] **Step 1: Create Admin Layout**
  - [ ] Create `app/admin` page with protected route
  - [ ] Add authentication check (role = admin)
  - [ ] Create sidebar navigation

- [ ] **Step 2: Token Management UI**
  - [ ] List all tokens (editable table)
  - [ ] Add token button (modal/form)
  - [ ] Edit token button (modal/form)
  - [ ] Disable/enable token toggle
  - [ ] Upload icon functionality
  - [ ] Sort by rank

- [ ] **Step 3: Pool Management UI**
  - [ ] List all pools (editable table)
  - [ ] Add pool button (modal/form)
  - [ ] Edit pool button (modal/form)
  - [ ] Manage pool pairs (add/edit locked amounts)
  - [ ] Disable/enable pool toggle

- [ ] **Step 4: Market Stats UI**
  - [ ] Display current stats
  - [ ] Edit stats form
  - [ ] Toggle override mode
  - [ ] Show calculated vs manual values

- [ ] **Step 5: Domain Management UI**
  - [ ] List all domains
  - [ ] Add/edit domain form
  - [ ] Disable/enable toggle

- [ ] **Step 6: Audit Log UI**
  - [ ] Display recent admin changes
  - [ ] Filter by table/admin/date
  - [ ] Show old vs new values

- [ ] **Step 7: Settings Page**
  - [ ] Manage admin users (in this app)
  - [ ] View system status
  - [ ] Test data endpoints

---

## Phase 6: Testing

- [ ] **Step 1: User Access Testing**
  - [ ] Log in as regular user
  - [ ] [ ] Can see only enabled tokens
  - [ ] [ ] Cannot see disabled tokens
  - [ ] [ ] Cannot edit data
  - [ ] [ ] Cannot access `/admin` route

- [ ] **Step 2: Admin Access Testing**
  - [ ] Log in as admin
  - [ ] [ ] Can see all tokens (enabled & disabled)
  - [ ] [ ] Can add new token
  - [ ] [ ] Can edit token properties
  - [ ] [ ] Can disable/enable token
  - [ ] [ ] Can upload token icon
  - [ ] [ ] Same tests for pools & domains

- [ ] **Step 3: RLS Policy Testing**
  - [ ] [ ] Admin INSERT succeeds
  - [ ] [ ] User INSERT fails
  - [ ] [ ] User SELECT shows only enabled
  - [ ] [ ] Admin SELECT shows all

- [ ] **Step 4: Data Integrity Testing**
  - [ ] [ ] Cannot create token without issuer
  - [ ] [ ] Cannot create pool without token IDs
  - [ ] [ ] Duplicate prevention works (unique constraints)
  - [ ] [ ] Foreign key constraints enforced

- [ ] **Step 5: Explorer Page Testing**
  - [ ] [ ] Tokens display with admin data
  - [ ] [ ] Pools display with admin data
  - [ ] [ ] Market stats reflect admin values
  - [ ] [ ] Disabling token hides it from explorer
  - [ ] [ ] Prices update independently

- [ ] **Step 6: Performance Testing**
  - [ ] [ ] Token list loads quickly
  - [ ] [ ] Pool list loads quickly
  - [ ] [ ] Admin dashboard loads quickly
  - [ ] [ ] Search/filter responds quickly

---

## Phase 7: Deployment

- [ ] **Step 1: Production Verification**
  - [ ] All tables created in production Supabase
  - [ ] RLS policies active
  - [ ] Admin users configured with role

- [ ] **Step 2: Data Migration** (if replacing mock data)
  - [ ] Migrate existing token data
  - [ ] Migrate existing pool data
  - [ ] Verify no data loss
  - [ ] Test thoroughly before cutting over

- [ ] **Step 3: Monitoring**
  - [ ] Set up alerts for failed admin operations
  - [ ] Monitor audit log for suspicious changes
  - [ ] Track explorer data freshness

---

## Phase 8: Documentation

- [ ] **Step 1: Admin User Guide**
  - [ ] How to add tokens
  - [ ] How to manage pools
  - [ ] How to view audit logs
  - [ ] Screenshots & examples

- [ ] **Step 2: Developer Guide**
  - [ ] API endpoint documentation
  - [ ] Database schema reference
  - [ ] RLS policy explanation
  - [ ] Code examples

- [ ] **Step 3: System Architecture**
  - [ ] Data flow diagram
  - [ ] Component architecture
  - [ ] Security model

---

## Phase 9: Support & Maintenance

- [ ] **Step 1: Backup Strategy**
  - [ ] Regular Supabase backups enabled
  - [ ] Export admin data regularly
  - [ ] Test backup restore process

- [ ] **Step 2: Monitoring**
  - [ ] Check audit logs regularly
  - [ ] Monitor explorer data updates
  - [ ] Verify RLS policies working

- [ ] **Step 3: Updates**
  - [ ] Document changes in audit log
  - [ ] Notify users of data changes
  - [ ] Track admin activities

---

## Quick Reference Links

- **SQL Schema:** `ADMIN_SUPABASE_SCHEMA.sql`
- **Control Mapping:** `ADMIN_CONTROL_MAPPING.md`
- **Control Matrix:** `ADMIN_CONTROL_MATRIX.md`
- **Quick Start:** `ADMIN_SETUP_QUICK_START.md`

---

## Troubleshooting

**RLS policies not working?**
- Verify user is authenticated
- Check user metadata has `{"role": "admin"}`
- Test with service_role key to bypass RLS

**Data not appearing on explorer?**
- Verify `enabled = true` for tokens/pools
- Check API endpoint is querying from tables, not mock data
- Verify foreign key references exist

**Can't upload icons?**
- Ensure Supabase Storage bucket exists
- Verify upload endpoint has proper permissions
- Check file size limits

**Performance issues?**
- Add missing indexes (done in SQL script)
- Consider pagination for large lists
- Use selective SELECT instead of *

---

## Status Checklist

```
Phase 1: Database Setup            [ ] In Progress [ ] Complete
Phase 2: Seed Data                 [ ] In Progress [ ] Complete
Phase 3: API Integration           [ ] In Progress [ ] Complete
Phase 4: Admin CRUD Endpoints      [ ] In Progress [ ] Complete
Phase 5: Admin Dashboard UI        [ ] In Progress [ ] Complete
Phase 6: Testing                   [ ] In Progress [ ] Complete
Phase 7: Deployment                [ ] In Progress [ ] Complete
Phase 8: Documentation             [ ] In Progress [ ] Complete
Phase 9: Support & Maintenance     [ ] In Progress [ ] Complete
```

---

**Last Updated:** 2026-06-10  
**Version:** 1.0
