# Admin Control Matrix - What Admins Control

## Visual Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPLORER PAGE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║         MARKET TAB - TOKENS (tokens_metadata table)              ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                   ║  │
│  ║  👤 User sees:        Admin can change:         Database field:  ║  │
│  ║  ─────────────────────────────────────────────────────────────   ║  │
│  ║  📊 Token Rank        Set display order    →    rank             ║  │
│  ║  🔤 Token Name        Edit name            →    name             ║  │
│  ║  💱 Symbol            Edit symbol          →    symbol           ║  │
│  ║  💰 Price            Read from explorer   →    (from API)        ║  │
│  ║  📈 24h Change        Read from explorer   →    (from API)        ║  │
│  ║  💧 Liquidity         Read from explorer   →    (from API)        ║  │
│  ║  ✅ Verified Badge   Mark verified        →    verified          ║  │
│  ║  🎨 Icon/Color       Upload & set color   →    icon_url, color   ║  │
│  ║  🏷️ Category          Set category         →    category          ║  │
│  ║  👥 Trustlines/Holders Read from explorer →    (from API)        ║  │
│  ║  🔗 Related Pool      Link to pool        →    liquidity_pool_id ║  │
│  ║  👁️ Show/Hide         Toggle display      →    enabled          ║  │
│  ║                                                                   ║  │
│  ║  ➕ Admin can ADD new tokens                                      ║  │
│  ║  ✏️ Admin can EDIT all fields                                     ║  │
│  ║  ❌ Admin can DISABLE (not delete)                                ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║      LIQUIDITY POOLS TAB (liquidity_pools_metadata + pool_pairs)  ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                   ║  │
│  ║  👤 User sees:        Admin can change:         Database field:  ║  │
│  ║  ─────────────────────────────────────────────────────────────   ║  │
│  ║  📊 Pool Rank         Set display order    →    rank             ║  │
│  ║  🏊 Pool Name         Edit name            →    name             ║  │
│  ║  💱 Token Pair        Select tokens        →    token1_id,       ║  ║
│  ║                                                 token2_id        ║  │
│  ║  💧 Total Liquidity   Set amount           →    total_liquidity  ║  │
│  ║  📊 24h Volume        Set volume           →    volume_24h       ║  │
│  ║  📈 APR %             Set percentage       →    apr_percentage   ║  │
│  ║  💰 Fees 24h          Set fee amount       →    fees_24h         ║  │
│  ║  🎨 Icons/Color       Upload & colors      →    icon1_url,       ║  │
│  ║                                                 icon2_url, color  ║  │
│  ║  💾 Token Locked      Set locked amount    →    pool_pairs.      ║  │
│  ║                                                 locked_amount     ║  │
│  ║  💰 Fees Earned       Set fee amount       →    pool_pairs.      ║  │
│  ║                                                 fees_earned       ║  │
│  ║  👁️ Show/Hide         Toggle display      →    enabled          ║  │
│  ║                                                                   ║  │
│  ║  ➕ Admin can ADD new pools                                       ║  │
│  ║  ✏️ Admin can EDIT all pool data                                  ║  │
│  ║  ✏️ Admin can EDIT each token's locked amount                     ║  │
│  ║  ❌ Admin can DISABLE pools (not delete)                          ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║      DOMAINS TAB (domains_metadata table)                          ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                   ║  │
│  ║  👤 User sees:        Admin can change:         Database field:  ║  │
│  ║  ─────────────────────────────────────────────────────────────   ║  │
│  ║  📊 Domain Rank       Set display order    →    rank             ║  │
│  ║  🌐 Domain Name       Edit name            →    name             ║  │
│  ║  🏛️ Registrar         Set registrar        →    registrar        ║  │
│  ║  💰 Price             Set price            →    price            ║  │
│  ║  📅 Registered Date   Set date             →    registered_date  ║  │
│  ║  ⏰ Expiration Date   Set date             →    expiration_date  ║  │
│  ║  ✅ Verified Badge   Mark verified        →    verified          ║  │
│  ║  🎨 Icon/Color       Upload & set color   →    icon_url, color   ║  │
│  ║  🏷️ Category          Set category         →    category         ║  │
│  ║  👁️ Show/Hide         Toggle display      →    enabled          ║  │
│  ║                                                                   ║  │
│  ║  ➕ Admin can ADD new domains                                     ║  │
│  ║  ✏️ Admin can EDIT all fields                                     ║  │
│  ║  ❌ Admin can DISABLE (not delete)                                ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║    MARKET STATS SECTION (market_stats_override table)            ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                   ║  │
│  ║  👤 User sees:        Admin can change:         Database field:  ║  │
│  ║  ─────────────────────────────────────────────────────────────   ║  │
│  ║  💰 Total Liquidity   Set amount           →    total_liquidity  ║  │
│  ║  📈 Liquidity 24h %   Set change %         →    liquidity_change_║  │
│  ║                                                 percent           ║  │
│  ║  🔢 Token Count       Set count            →    total_tokens     ║  │
│  ║  📈 Token Count %     Set change %         →    token_count_     ║  │
│  ║                                                 change_percent    ║  │
│  ║  🏊 Active Pools      Set count            →    active_pools_    ║  │
│  ║                                                 count             ║  │
│  ║  🎯 Largest Pool      Select pool          →    largest_pool_id  ║  │
│  ║  🌐 Network Name      Set network name     →    network          ║  │
│  ║  🔄 Use Overrides     Toggle auto/manual   →    use_overrides    ║  │
│  ║                                                                   ║  │
│  ║  ➕ Admin can CREATE market stats records                        ║  │
│  ║  ✏️ Admin can EDIT all stats                                     ║  │
│  ║  🔄 Admin can TOGGLE between calculated vs manual values         ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  TOKEN LINKS (token_links table)                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                   ║  │
│  ║  Link Types: trade, watchlist, app, about                        ║  │
│  ║                                                                   ║  │
│  ║  ➕ Admin can ADD new links to tokens                            ║  │
│  ║  ✏️ Admin can EDIT link URL & label                              ║  │
│  ║  👁️ Admin can TOGGLE link visibility (enabled)                  ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  POOL LINKS (pool_links table)                                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════╣  │
│  ║                                                                   ║  │
│  ║  Link Types: trade, info, analytics                              ║  │
│  ║                                                                   ║  │
│  ║  ➕ Admin can ADD new links to pools                             ║  │
│  ║  ✏️ Admin can EDIT link URL & label                              ║  │
│  ║  👁️ Admin can TOGGLE link visibility (enabled)                  ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Summary Count

| Section | Controllable Fields | Admin Actions | Data Tables |
|---------|-------------------|--------------|------------|
| **Tokens** | 12 fields | ADD/EDIT/DISABLE | tokens_metadata |
| **Liquidity Pools** | 11 fields | ADD/EDIT/DISABLE | liquidity_pools_metadata + pool_pairs |
| **Domains** | 10 fields | ADD/EDIT/DISABLE | domains_metadata |
| **Market Stats** | 9 fields | ADD/EDIT/TOGGLE | market_stats_override |
| **Token Links** | 5 fields | ADD/EDIT/DISABLE | token_links |
| **Pool Links** | 5 fields | ADD/EDIT/DISABLE | pool_links |
| **TOTAL** | **52 controllable fields** | **6 operation types** | **7 tables** |

---

## What Regular Users Can See

✅ **Can READ:**
- All tokens (if `enabled = true`)
- All pools (if `enabled = true`)
- All domains (if `enabled = true`)
- All verified badges
- All prices, liquidity, APR data
- Market stats

❌ **Cannot:**
- Edit any data
- Create tokens/pools/domains
- Disable content
- See disabled records

---

## What Admins Can Do

✅ **Can READ:**
- ALL tokens (including `enabled = false`)
- ALL pools (including `enabled = false`)
- ALL domains (including `enabled = false`)
- Admin audit log

✅ **Can CREATE:**
- New tokens with custom metadata
- New liquidity pools
- New domains
- New links (token & pool)
- Market stats overrides

✅ **Can UPDATE:**
- All token properties
- All pool properties
- All domain properties
- Link visibility & URLs
- Market statistics

✅ **Can SOFT DELETE:**
- Hide tokens (`enabled = false`)
- Hide pools (`enabled = false`)
- Hide domains (`enabled = false`)
- Hide links (`enabled = false`)

✅ **Audit Trail:**
- All changes logged with timestamp
- Admin ID recorded
- Old & new values stored
- Compliance & accountability maintained

---

## Data Update Frequency

| Data Type | Update Frequency | Who Updates | Table |
|-----------|-----------------|------------|-------|
| Token metadata | Manual (admin) | Admin | tokens_metadata |
| Pool metadata | Manual (admin) | Admin | liquidity_pools_metadata |
| Pool pairs | Manual (admin) | Admin | pool_pairs |
| Domain metadata | Manual (admin) | Admin | domains_metadata |
| Market stats | Manual override (admin) | Admin | market_stats_override |
| Links | Manual (admin) | Admin | token_links, pool_links |
| Prices/Liquidity | From live API | System | (cached in tables as strings) |
| Audit log | On every change | System | admin_audit_log |

---

## Admin Access Control

All admin access is controlled through Supabase RLS:

```
User Authentication
    ↓
Check if authenticated
    ↓
Check user metadata: role = "admin"
    ↓
✅ If admin → Allow full access
❌ If user → Allow read-only (enabled = true only)
```

No user can delete records - only soft delete via `enabled = false` flag.
All changes are logged for compliance and audit purposes.
