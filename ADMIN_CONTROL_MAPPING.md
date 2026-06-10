# Admin Control Center - Explorer Data Mapping

## Overview
This document maps all data points on the Explorer page that admins can control, and defines the Supabase tables and RLS policies needed for admin management.

---

## EXPLORER PAGE - CONTROLLABLE DATA POINTS

### 1. **MARKET TAB - Tokens List**
**What's displayed:**
- Token rank
- Token name & symbol
- Price (in PI)
- 24h change percentage
- Volume
- Liquidity
- Trustlines/Holders
- Verified badge
- Token icon/color
- Category

**Admin Control:**
- ✅ Add/Edit/Delete tokens
- ✅ Set token rank/order
- ✅ Mark token as verified
- ✅ Set token category
- ✅ Upload token icon
- ✅ Set token color
- ✅ Link to liquidity pool
- ✅ Enable/Disable token display

**Data Source:** `tokens_metadata` table (admin-controlled)

---

### 2. **MARKET TAB - Token Details (Dialog)**
**What's displayed:**
- Current price
- Liquidity
- High/Low prices
- Trustlines count
- Holders count
- Trading volume
- Supply info
- Links (Trade, Watchlist, App, About)

**Admin Control:**
- ✅ Edit token name/symbol
- ✅ Update price manually (if override needed)
- ✅ Set liquidity data
- ✅ Set high/low prices
- ✅ Add trading links
- ✅ Add about/info URLs
- ✅ Update category

**Data Source:** `tokens_metadata` table + `token_links` table

---

### 3. **LIQUIDITY POOLS TAB - Pools List**
**What's displayed:**
- Pool rank
- Pool name
- Token pair (token1, token2)
- Total liquidity
- 24h volume
- APR (Annual Percentage Rate)
- Fees earned 24h
- Pool icons
- Pool color

**Admin Control:**
- ✅ Add/Edit/Delete liquidity pools
- ✅ Set pool rank/order
- ✅ Configure token pairs
- ✅ Set liquidity amounts
- ✅ Set 24h volume
- ✅ Set APR percentage
- ✅ Set fees earned
- ✅ Upload pool icons
- ✅ Set pool color
- ✅ Enable/Disable pool display

**Data Source:** `liquidity_pools_metadata` table (admin-controlled)

---

### 4. **LIQUIDITY POOLS TAB - Pool Details (Expanded)**
**What's displayed:**
- Total token locked amount
- All Pools section:
  - Pair information
  - Locked amounts
  - Fees
  - Links

**Admin Control:**
- ✅ Update locked amounts per token
- ✅ Update fee information
- ✅ Add/Edit pool links
- ✅ Set individual pool status

**Data Source:** `liquidity_pools_metadata` table + `pool_pairs` table

---

### 5. **MARKET STATS SECTION (Top of page)**
**What's displayed:**
- Total liquidity
- Liquidity 24h change
- Total token count
- Token count change
- Active pools count
- Largest pool name & liquidity
- Network info

**Admin Control:**
- ✅ Set total liquidity amount
- ✅ Set liquidity change %
- ✅ Override token count (if manual)
- ✅ Set token count change %
- ✅ Set active pools count
- ✅ Set largest pool info
- ✅ Set network name/info

**Data Source:** `market_stats_override` table (admin-controlled)

---

### 6. **DOMAINS TAB**
**What's displayed:**
- Domain rank
- Domain name
- Registrar
- Price
- Registration date
- Expiration date
- Verified badge
- Domain icon
- Color

**Admin Control:**
- ✅ Add/Edit/Delete domains
- ✅ Set domain rank/order
- ✅ Mark as verified
- ✅ Set registrar
- ✅ Update pricing
- ✅ Set registration dates
- ✅ Set expiration dates
- ✅ Upload domain icon
- ✅ Set domain color

**Data Source:** `domains_metadata` table (admin-controlled)

---

## SUPABASE TABLE STRUCTURE

### Core Admin Tables

#### 1. `tokens_metadata`
```
- id (UUID, PK)
- code (TEXT, unique) - Token code (e.g., "USDC")
- issuer (TEXT, unique per code) - Token issuer
- name (TEXT) - Display name
- symbol (TEXT) - Token symbol
- icon_url (TEXT) - URL to token icon
- color (TEXT) - Hex color code
- category (TEXT) - Token category
- verified (BOOLEAN) - Admin verified badge
- rank (INTEGER) - Display order
- enabled (BOOLEAN) - Show/hide on explorer
- liquidity_pool_id (UUID, FK) - Link to primary pool
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- updated_by (UUID, FK to users) - Admin who updated
```

#### 2. `liquidity_pools_metadata`
```
- id (UUID, PK)
- name (TEXT) - Pool display name
- token1_id (UUID, FK to tokens_metadata)
- token2_id (UUID, FK to tokens_metadata)
- total_liquidity (TEXT) - Formatted liquidity amount
- volume_24h (TEXT) - 24h volume
- apr_percentage (DECIMAL) - Annual percentage rate
- fees_24h (TEXT) - Fees earned in 24h
- icon1_url (TEXT) - Token1 icon
- icon2_url (TEXT) - Token2 icon
- color (TEXT) - Pool color
- rank (INTEGER) - Display order
- enabled (BOOLEAN) - Show/hide on explorer
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- updated_by (UUID, FK to users) - Admin who updated
```

#### 3. `pool_pairs`
```
- id (UUID, PK)
- pool_id (UUID, FK to liquidity_pools_metadata)
- token_id (UUID, FK to tokens_metadata)
- locked_amount (TEXT) - Amount locked in this pool
- fees_earned (TEXT) - Fees earned from this pair
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. `market_stats_override`
```
- id (UUID, PK)
- network (TEXT) - Network name (e.g., "Pi Testnet")
- total_liquidity (TEXT) - Override total liquidity
- liquidity_change_percent (TEXT) - 24h change %
- total_tokens (INTEGER) - Override token count
- token_count_change_percent (TEXT) - Token count change %
- active_pools_count (INTEGER) - Active pools count
- largest_pool_id (UUID, FK to liquidity_pools_metadata)
- use_overrides (BOOLEAN) - Use manual overrides vs calculated
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- updated_by (UUID, FK to users) - Admin who updated
```

#### 5. `domains_metadata`
```
- id (UUID, PK)
- name (TEXT, unique) - Domain name
- registrar (TEXT) - Domain registrar
- price (TEXT) - Domain price
- registered_date (TIMESTAMP) - Registration date
- expiration_date (TIMESTAMP) - Expiration date
- icon_url (TEXT) - Domain icon
- color (TEXT) - Domain color
- verified (BOOLEAN) - Admin verified badge
- category (TEXT) - Domain category
- rank (INTEGER) - Display order
- enabled (BOOLEAN) - Show/hide on explorer
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- updated_by (UUID, FK to users) - Admin who updated
```

#### 6. `token_links`
```
- id (UUID, PK)
- token_id (UUID, FK to tokens_metadata)
- link_type (ENUM: 'trade', 'watchlist', 'app', 'about') - Link type
- url (TEXT) - Link URL
- label (TEXT) - Display label
- enabled (BOOLEAN) - Show link
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 7. `pool_links`
```
- id (UUID, PK)
- pool_id (UUID, FK to liquidity_pools_metadata)
- link_type (ENUM: 'trade', 'info', 'analytics')
- url (TEXT) - Link URL
- label (TEXT) - Display label
- enabled (BOOLEAN) - Show link
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## RLS POLICIES

### Admin Role Requirements
- Admins have `role = 'admin'` in the `users` table
- Admins can CRUD all metadata tables
- Regular users can only READ (SELECT) from these tables
- No user can DELETE data (soft deletes via `enabled` field)

### Policy Rules
1. **Admins:** Full CRUD access to all metadata tables
2. **Public/Users:** SELECT only (read-only access)
3. **Audit Trail:** Track who updated each record via `updated_by`

---

## NEXT STEPS

1. Create the tables with SQL schema below
2. Enable RLS on all tables
3. Create policies for admin vs public access
4. Create API endpoints for admin CRUD operations
5. Update frontend to read from these tables
6. Create admin dashboard for managing these settings
