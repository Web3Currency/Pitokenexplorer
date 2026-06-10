# Admin Control Center - Data Flow Diagrams

## 1. OVERALL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         W3C EXPLORER APP                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PUBLIC USERS                          ADMINS                            │
│  ────────────────────────────────────────────────────────────────────   │
│                                                                           │
│  🌐 Explorer Page                      🔐 Admin Dashboard                │
│  ├─ Market (Tokens)                    ├─ Token Management               │
│  ├─ Liquidity Pools                    ├─ Pool Management                │
│  ├─ Market Stats                       ├─ Market Stats Override          │
│  ├─ Domains                            ├─ Domain Management              │
│  └─ Read-Only View                     ├─ Link Management                │
│                                        ├─ Audit Logs                     │
│                                        └─ Settings                       │
│                                                                           │
│  ↓ (fetch data)                        ↓ (read/write data)               │
│                                                                           │
│  API ENDPOINTS (READ)                  API ENDPOINTS (READ/WRITE)        │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                           │
│  GET /api/explorer/tokens              POST/PUT /api/admin/tokens        │
│  GET /api/explorer/pools               POST/PUT /api/admin/pools         │
│  GET /api/explorer/market-stats        POST/PUT /api/admin/market-stats  │
│  GET /api/explorer/domains             POST/PUT /api/admin/domains       │
│                                        POST/PUT /api/admin/[x]/links     │
│                                        GET /api/admin/audit-logs         │
│                                                                           │
│  ↓ (query with RLS)                    ↓ (query with RLS)                │
│                                                                           │
│  SUPABASE TABLES (with RLS POLICIES)                                    │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                           │
│  RLS Policy:                           RLS Policy:                       │
│  "Public Read"                         "Admin Full Access"               │
│  └─ SELECT where enabled = true        ├─ SELECT all                     │
│                                        ├─ INSERT new                     │
│                                        ├─ UPDATE existing                │
│                                        └─ Soft delete (enabled = false)  │
│                                                                           │
│  ├─ tokens_metadata                    ├─ admin_audit_log                │
│  ├─ liquidity_pools_metadata           │  (auto-logged changes)           │
│  ├─ pool_pairs                         │                                  │
│  ├─ market_stats_override              │                                  │
│  ├─ domains_metadata                   │                                  │
│  ├─ token_links                        │                                  │
│  └─ pool_links                         │                                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TOKEN FLOW (User Viewing Tokens)

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER VIEWS EXPLORER PAGE                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Page loads                                                    │
│     └─ useTokenRegistry() hook called                            │
│        └─ Fetches from /api/explorer/tokens/registry            │
│                                                                   │
│  2. API Endpoint receives request                                │
│     ├─ Check user authentication ✓                              │
│     ├─ Query tokens_metadata table                              │
│     └─ RLS Policy: SELECT where enabled = true                  │
│                                                                   │
│  3. Supabase executes query                                      │
│     ├─ SELECT * FROM tokens_metadata                            │
│     ├─ WHERE enabled = true                                     │
│     ├─ ORDER BY rank ASC                                        │
│     └─ Return results                                            │
│                                                                   │
│  4. API formats & returns data                                   │
│     ├─ Join with live price data (from Stellar)                │
│     ├─ Format prices & liquidity                                │
│     └─ Return JSON response                                      │
│                                                                   │
│  5. Frontend renders tokens                                      │
│     ├─ Token name, symbol (from DB)                            │
│     ├─ Icon, color (from DB)                                   │
│     ├─ Verified badge (from DB)                                │
│     ├─ Price, volume (from live API)                           │
│     ├─ Rank (from DB - display order)                          │
│     └─ Category (from DB)                                       │
│                                                                   │
│  6. User sees: Clean token list with admin-managed metadata     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. ADMIN EDIT FLOW (Admin Updates Token)

```
┌──────────────────────────────────────────────────────────────────┐
│              ADMIN OPENS ADMIN DASHBOARD - TOKEN EDIT            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Admin navigates to /admin/tokens                            │
│     ├─ Page checks: auth.uid() exists? ✓                       │
│     ├─ Page checks: user.role === 'admin'? ✓                   │
│     └─ Page loads (else redirects to home)                     │
│                                                                   │
│  2. Admin dashboard fetches data                                │
│     └─ GET /api/admin/tokens                                    │
│        └─ RLS Policy: "Admin Read"                              │
│           └─ SELECT * FROM tokens_metadata (ALL records)        │
│                                                                   │
│  3. Supabase returns ALL tokens (enabled & disabled)            │
│     ├─ Token 1 (enabled = true)                                │
│     ├─ Token 2 (enabled = true)                                │
│     ├─ Token 3 (enabled = false) ← Also visible to admin       │
│     └─ Token 4 (enabled = false) ← Also visible to admin       │
│                                                                   │
│  4. Admin clicks "Edit Token"                                   │
│     ├─ Modal opens with token data                             │
│     ├─ Admin modifies fields:                                  │
│     │  ├─ Change name: "USD Coin" → "USDC Token"             │
│     │  ├─ Change rank: 5 → 2                                   │
│     │  ├─ Toggle verified: false → true                        │
│     │  └─ Change color: #2775CA                                │
│     └─ Admin clicks "Save"                                     │
│                                                                   │
│  5. Frontend sends update request                               │
│     └─ PUT /api/admin/tokens/[token-id]                        │
│        ├─ Body: { name, rank, verified, color, ... }          │
│        └─ Include: authorization header                         │
│                                                                   │
│  6. Backend validates request                                   │
│     ├─ Check: auth.uid() is admin? ✓                           │
│     ├─ Validate: fields match schema? ✓                        │
│     └─ Proceed with update                                      │
│                                                                   │
│  7. Supabase executes update with RLS                          │
│     ├─ RLS Policy: "Admin Update"                              │
│     │  └─ Check: auth.uid() in auth.users.id                  │
│     │  └─ Check: raw_user_meta_data->>'role' = 'admin'        │
│     ├─ If checks pass → ALLOW UPDATE                           │
│     ├─ UPDATE tokens_metadata                                  │
│     │  SET name = 'USDC Token',                                │
│     │      rank = 2,                                            │
│     │      verified = true,                                     │
│     │      color = '#2775CA',                                   │
│     │      updated_at = NOW(),                                  │
│     │      updated_by = auth.uid()                              │
│     │  WHERE id = [token-id]                                    │
│     └─ Return updated record                                    │
│                                                                   │
│  8. Audit log auto-records change                               │
│     ├─ Table: admin_audit_log                                  │
│     ├─ Record: {                                                │
│     │   admin_id: [user.id],                                    │
│     │   table_name: 'tokens_metadata',                          │
│     │   record_id: [token.id],                                  │
│     │   action: 'UPDATE',                                       │
│     │   old_values: { name, rank, verified, color },          │
│     │   new_values: { name, rank, verified, color },          │
│     │   created_at: NOW()                                       │
│     │ }                                                          │
│     └─ Stored for compliance                                    │
│                                                                   │
│  9. Frontend receives response                                  │
│     ├─ Close modal                                              │
│     ├─ Refresh token list                                       │
│     ├─ Show success toast                                       │
│     └─ Dashboard updated with new data                          │
│                                                                   │
│  10. Explorer page auto-updates                                 │
│      ├─ useTokenRegistry() hook revalidates                     │
│      ├─ SWR fetches fresh data (cache invalidated)             │
│      ├─ API returns updated token                               │
│      ├─ UI re-renders with new metadata                         │
│      └─ User sees updated token on explorer                     │
│                                                                   │
│  RESULT: Admin change → Immediate audit log → Explorer updates  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. DISABLE/HIDE FLOW (Admin Hides a Token)

```
┌──────────────────────────────────────────────────────────────────┐
│            ADMIN DISABLES TOKEN (Soft Delete)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Admin clicks "Disable" button on token                      │
│     └─ PATCH /api/admin/tokens/[token-id]/disable              │
│                                                                   │
│  2. Backend update request                                       │
│     └─ UPDATE tokens_metadata                                   │
│        SET enabled = false                                       │
│        WHERE id = [token-id]                                    │
│                                                                   │
│  3. Supabase RLS allows (admin check passes)                    │
│     └─ Record disabled but NOT deleted                          │
│                                                                   │
│  4. Audit log records the change                                │
│     ├─ admin_id: [admin user id]                               │
│     ├─ action: 'UPDATE'                                         │
│     ├─ old_values: { enabled: true }                            │
│     ├─ new_values: { enabled: false }                           │
│     └─ Stored for future recovery                               │
│                                                                   │
│  5. Impact on users                                             │
│     ├─ Regular users:                                           │
│     │  ├─ Next time they load explorer                         │
│     │  ├─ Query: SELECT * WHERE enabled = true                 │
│     │  └─ Token NOT in results (hidden)                        │
│     │                                                            │
│     └─ Admins:                                                  │
│        ├─ Still see disabled token in admin dashboard          │
│        ├─ Can re-enable it anytime                             │
│        └─ Audit log shows complete history                      │
│                                                                   │
│  6. Recovery possible                                           │
│     └─ Admin clicks "Enable"                                    │
│        └─ PATCH /api/admin/tokens/[id]/enable                  │
│           └─ UPDATE tokens_metadata                             │
│              SET enabled = true                                 │
│              └─ Token immediately re-appears for users          │
│                                                                   │
│  KEY: Data is never lost, always recoverable!                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. LIQUIDITY POOL FLOW (Complex Multi-Table)

```
┌──────────────────────────────────────────────────────────────────┐
│        ADMIN CREATES NEW LIQUIDITY POOL                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Admin fills pool creation form                              │
│     ├─ Pool Name: "PI/USDC"                                     │
│     ├─ Token 1: PI (select from dropdown)                       │
│     ├─ Token 2: USDC (select from dropdown)                     │
│     ├─ Total Liquidity: "500,000"                               │
│     ├─ 24h Volume: "125,000"                                    │
│     ├─ APR: "12.5%"                                             │
│     ├─ Fees 24h: "1,250"                                        │
│     └─ Clicks "Create"                                          │
│                                                                   │
│  2. Frontend validates form                                     │
│     ├─ All required fields filled? ✓                            │
│     ├─ Token IDs exist? ✓                                       │
│     └─ Values are valid? ✓                                      │
│                                                                   │
│  3. Frontend sends create request                               │
│     └─ POST /api/admin/pools                                    │
│        ├─ Body: { name, token1_id, token2_id, ... }           │
│        └─ With admin auth header                                │
│                                                                   │
│  4. Backend executes two operations in transaction              │
│                                                                   │
│     Operation A: Create pool record                             │
│     ──────────────────────────────────────────────────          │
│     INSERT INTO liquidity_pools_metadata (                       │
│       id, name, token1_id, token2_id,                           │
│       total_liquidity, volume_24h, apr_percentage, fees_24h,   │
│       rank, enabled, created_at, updated_by                     │
│     )                                                            │
│     VALUES (                                                     │
│       uuid_generate_v4(),                                        │
│       'PI/USDC', [pi-uuid], [usdc-uuid],                        │
│       '500000', '125000', 12.50, '1250',                        │
│       (SELECT MAX(rank) + 1 FROM liquidity_pools_metadata),     │
│       true, NOW(), [admin-id]                                   │
│     )                                                            │
│     RETURNING id                                                 │
│     → Result: pool_id = [new-uuid]                              │
│                                                                   │
│     Operation B: Create pool pairs                              │
│     ──────────────────────────────────────────────────          │
│     INSERT INTO pool_pairs (pool_id, token_id, ...)             │
│     VALUES                                                       │
│       ([pool-id], [pi-id], '500000 PI', '625 PI'),             │
│       ([pool-id], [usdc-id], '500000 USDC', '625 USDC')        │
│                                                                   │
│  5. Supabase RLS allows both (admin verified)                   │
│     └─ Both INSERT operations succeed                           │
│                                                                   │
│  6. Audit log records BOTH changes                              │
│     ├─ Entry 1: Table=liquidity_pools_metadata, Action=INSERT   │
│     ├─ Entry 2: Table=pool_pairs, Action=INSERT (token 1)       │
│     └─ Entry 3: Table=pool_pairs, Action=INSERT (token 2)       │
│                                                                   │
│  7. API returns success with pool data                          │
│     ├─ Pool ID, name, APR, liquidity                           │
│     └─ UI updates with new pool                                 │
│                                                                   │
│  8. Explorer page auto-updates                                  │
│     ├─ useLiquidityPools() hook revalidates                     │
│     ├─ New pool appears in "Liquidity Pools" tab                │
│     ├─ Shows pool with correct data                             │
│     └─ Users see new pool immediately                           │
│                                                                   │
│  9. When user opens pool details                                │
│     ├─ Total Locked section shows amounts per token             │
│     │  ├─ "500,000 PI locked"                                  │
│     │  └─ "500,000 USDC locked"                                │
│     ├─ From pool_pairs table                                    │
│     └─ Rendered perfectly                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. MARKET STATS OVERRIDE FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│        ADMIN TOGGLES BETWEEN CALCULATED VS MANUAL STATS         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  MODE 1: AUTOMATIC (use_overrides = false)                      │
│  ──────────────────────────────────────────────────────────────  │
│     GET /api/explorer/market-stats/instant                       │
│     └─ Backend calculates:                                       │
│        ├─ Count enabled tokens                                  │
│        ├─ Sum total liquidity                                   │
│        ├─ Count enabled pools                                   │
│        └─ Find largest pool                                     │
│     └─ Returns calculated stats                                 │
│                                                                   │
│  MODE 2: MANUAL OVERRIDE (use_overrides = true)                 │
│  ──────────────────────────────────────────────────────────────  │
│     1. Admin goes to market stats settings                       │
│     2. Admin toggles "Use Manual Override"                       │
│     3. Admin enters custom values:                               │
│        ├─ Total liquidity: "1,245,890.50"                       │
│        ├─ Liquidity change: "+5.23%"                            │
│        ├─ Token count: "150"                                    │
│        ├─ Token change: "+12%"                                  │
│        └─ Active pools: "45"                                    │
│     4. Admin clicks "Save"                                       │
│                                                                   │
│     5. Backend update:                                           │
│        ├─ PUT /api/admin/market-stats/[id]                      │
│        ├─ UPDATE market_stats_override                          │
│        │  SET total_liquidity = '1,245,890.50',                │
│        │      liquidity_change_percent = '+5.23%',             │
│        │      total_tokens = 150,                               │
│        │      token_count_change_percent = '+12%',             │
│        │      active_pools_count = 45,                          │
│        │      use_overrides = true,                             │
│        │      updated_at = NOW()                                │
│        ├─ RLS checks: admin? ✓ ALLOW                           │
│        └─ Update succeeds                                       │
│                                                                   │
│     6. Audit log records:                                        │
│        ├─ admin_id: [user]                                      │
│        ├─ action: 'UPDATE'                                      │
│        ├─ old_values: { use_overrides: false }                  │
│        ├─ new_values: { use_overrides: true, all_stats }       │
│        └─ timestamp: NOW()                                       │
│                                                                   │
│     7. Next explorer load:                                       │
│        ├─ GET /api/explorer/market-stats/instant               │
│        ├─ Query market_stats_override                          │
│        ├─ Check: use_overrides = true?                         │
│        ├─ YES → Return admin values                             │
│        └─ Market stats on explorer show custom values           │
│                                                                   │
│  TOGGLE BACK TO AUTO:                                           │
│  ──────────────────────────────────────────────────────────────  │
│     1. Admin unchecks "Use Manual Override"                      │
│     2. SET use_overrides = false                                │
│     3. Next load calculates from token/pool counts              │
│     4. Stats on explorer show calculated values                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. AUDIT LOG FLOW (Tracking All Changes)

```
┌──────────────────────────────────────────────────────────────────┐
│             EVERY ADMIN ACTION IS LOGGED                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  When admin CREATES a token:                                    │
│  ──────────────────────────────────────────────────────────────  │
│  INSERT INTO admin_audit_log {                                   │
│    id: uuid_generate_v4(),                                       │
│    admin_id: 'user-123',          ← Who did it                  │
│    table_name: 'tokens_metadata', ← What table                  │
│    record_id: 'token-456',        ← Which record                │
│    action: 'INSERT',              ← What action                 │
│    old_values: null,              ← N/A for inserts             │
│    new_values: {                  ← New data                    │
│      code: 'USDC',                                               │
│      issuer: 'GXXXXX...',                                        │
│      name: 'USD Coin',                                           │
│      ...                                                         │
│    },                                                            │
│    created_at: 2026-06-10 14:30:45  ← When                      │
│  }                                                               │
│                                                                   │
│  When admin UPDATES a token:                                    │
│  ──────────────────────────────────────────────────────────────  │
│  INSERT INTO admin_audit_log {                                   │
│    action: 'UPDATE',                                             │
│    old_values: {                  ← Previous values             │
│      rank: 5,                                                    │
│      verified: false,                                            │
│      enabled: true                                               │
│    },                                                            │
│    new_values: {                  ← New values                  │
│      rank: 2,                                                    │
│      verified: true,                                             │
│      enabled: true                                               │
│    }                                                             │
│  }                                                               │
│                                                                   │
│  When admin DISABLES a token:                                   │
│  ──────────────────────────────────────────────────────────────  │
│  INSERT INTO admin_audit_log {                                   │
│    action: 'UPDATE',                                             │
│    old_values: { enabled: true },                               │
│    new_values: { enabled: false }                               │
│  }                                                               │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  Admin views audit logs:                                        │
│  ──────────────────────────────────────────────────────────────  │
│  GET /api/admin/audit-logs                                       │
│  ├─ RLS Policy: Admin only                                      │
│  ├─ Query: SELECT * FROM admin_audit_log ORDER BY created_at  │
│  └─ Returns all admin changes                                   │
│                                                                   │
│  Admin can see:                                                 │
│  ├─ Who changed what (admin_id)                                │
│  ├─ What table was modified                                    │
│  ├─ Which record (record_id)                                   │
│  ├─ What action (INSERT/UPDATE/DELETE)                         │
│  ├─ Previous values vs new values                              │
│  ├─ Exact timestamp                                            │
│  └─ For compliance, audit, or recovery                         │
│                                                                   │
│  Recovery example:                                              │
│  "Oops, I disabled a token by mistake"                          │
│  ├─ Admin views audit log                                      │
│  ├─ Finds: enabled: true → enabled: false                      │
│  ├─ Clicks "Revert"                                            │
│  ├─ Sets enabled = true                                        │
│  └─ Token re-enabled, new audit entry created                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. RLS SECURITY POLICIES IN ACTION

```
┌──────────────────────────────────────────────────────────────────┐
│          RLS POLICIES - LINE-BY-LINE EXECUTION                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SCENARIO 1: Regular user tries SELECT                          │
│  ──────────────────────────────────────────────────────────────  │
│  User: john@example.com (role: user)                            │
│  Query: SELECT * FROM tokens_metadata                           │
│                                                                   │
│  RLS Evaluation:                                                 │
│  ├─ Policy: "Tokens: Public Read"                               │
│  │  USING (enabled = TRUE)                                      │
│  ├─ Check: enabled = TRUE?                                      │
│  ├─ Token 1: enabled=true  ✓ ALLOWED                            │
│  ├─ Token 2: enabled=true  ✓ ALLOWED                            │
│  ├─ Token 3: enabled=false ✗ FILTERED OUT                       │
│  ├─ Token 4: enabled=false ✗ FILTERED OUT                       │
│  └─ Result: SELECT returns only tokens 1 & 2                    │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  SCENARIO 2: Admin tries SELECT                                 │
│  ──────────────────────────────────────────────────────────────  │
│  User: admin@example.com (role: admin)                          │
│  Query: SELECT * FROM tokens_metadata                           │
│                                                                   │
│  RLS Evaluation:                                                 │
│  ├─ Policy 1: "Tokens: Public Read" (enabled = TRUE)            │
│  │  ├─ Token 1: enabled=true  ✓ ALLOWED by this policy         │
│  │  ├─ Token 2: enabled=true  ✓ ALLOWED by this policy         │
│  │  ├─ Token 3: enabled=false ✗ Not allowed by this            │
│  │  └─ Token 4: enabled=false ✗ Not allowed by this            │
│  │                                                               │
│  ├─ Policy 2: "Tokens: Admin Read"                              │
│  │  USING (                                                      │
│  │    auth.uid() IS NOT NULL AND                                │
│  │    EXISTS (SELECT 1 FROM auth.users                          │
│  │      WHERE auth.users.id = auth.uid()                        │
│  │      AND raw_user_meta_data->>'role' = 'admin')              │
│  │  )                                                            │
│  │                                                               │
│  │  ├─ Check: auth.uid() IS NOT NULL?                           │
│  │  │  └─ YES (user is logged in) ✓                             │
│  │  ├─ Check: User exists in auth.users?                        │
│  │  │  └─ YES (admin@example.com) ✓                             │
│  │  ├─ Check: role = 'admin'?                                   │
│  │  │  └─ YES (found in metadata) ✓                             │
│  │  ├─ All checks pass!                                          │
│  │  ├─ Token 1: ✓ ALLOWED by admin policy                       │
│  │  ├─ Token 2: ✓ ALLOWED by admin policy                       │
│  │  ├─ Token 3: ✓ ALLOWED by admin policy                       │
│  │  ├─ Token 4: ✓ ALLOWED by admin policy                       │
│  │  └─ Result: ALL tokens returned (with OR logic)              │
│  │                                                               │
│  └─ Final: SELECT returns ALL 4 tokens                          │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  SCENARIO 3: Regular user tries INSERT                          │
│  ──────────────────────────────────────────────────────────────  │
│  User: john@example.com (role: user)                            │
│  Query: INSERT INTO tokens_metadata (name, symbol, ...) VALUES  │
│                                                                   │
│  RLS Evaluation:                                                 │
│  ├─ Policy: "Tokens: Admin Insert"                              │
│  │  WITH CHECK (                                                 │
│  │    auth.uid() IS NOT NULL AND                                │
│  │    EXISTS (SELECT 1 FROM auth.users                          │
│  │      WHERE auth.users.id = auth.uid()                        │
│  │      AND raw_user_meta_data->>'role' = 'admin')              │
│  │  )                                                            │
│  │                                                               │
│  │  ├─ Check: auth.uid() IS NOT NULL?                           │
│  │  │  └─ YES (user is logged in) ✓                             │
│  │  ├─ Check: User role = 'admin'?                              │
│  │  │  └─ NO (role = 'user') ✗ DENIED                           │
│  │  │                                                            │
│  ├─ Result: INSERT fails - permission denied                    │
│  │          Error: "new row violates row-level security policy" │
│  │                                                               │
│  └─ Database rejects the insert automatically                   │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  SCENARIO 4: Admin tries INSERT                                 │
│  ──────────────────────────────────────────────────────────────  │
│  User: admin@example.com (role: admin)                          │
│  Query: INSERT INTO tokens_metadata (name='PI', symbol='π', ...) │
│                                                                   │
│  RLS Evaluation:                                                 │
│  ├─ Policy: "Tokens: Admin Insert" WITH CHECK                   │
│  │  ├─ Check: auth.uid() IS NOT NULL? ✓ YES                    │
│  │  ├─ Check: role = 'admin'? ✓ YES                             │
│  │  └─ All checks pass!                                          │
│  │                                                               │
│  ├─ Result: INSERT allowed                                      │
│  ├─ New token created                                           │
│  ├─ updated_by = admin.id (from auth context)                  │
│  └─ Audit log created automatically                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Summary

The complete data flow ensures:
- ✅ Users see only enabled content
- ✅ Admins have full control
- ✅ RLS enforces permissions at database level
- ✅ All changes audited automatically
- ✅ Data always recoverable (soft deletes)
- ✅ Scalable & performant (indexes everywhere)
