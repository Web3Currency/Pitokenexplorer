# ADMIN ACTUAL CONTROLS - What's REALLY Implemented

## Overview
This document shows ONLY the admin controls that are actually implemented and working in the codebase right now. These are NOT theoretical - these are the features you've already built.

---

## EXPLORER - TOKEN MANAGEMENT

### What Admin Can Control:

1. **Token Visibility (Hide/Show)**
   - Admin can hide tokens from the public Explorer
   - When hidden, tokens don't appear in Market tab
   - When hidden, all pools using that token are also hidden (cascade)
   - When shown, token reappears

2. **Token Verification (Verified Badge)**
   - Admin can mark tokens as verified/unverified
   - Verified tokens show a checkmark badge on Explorer
   - Users see which tokens are officially verified

3. **Token Metadata** (11 editable fields)
   - `logoUrl` - Token logo/icon image
   - `category` - Token category/type
   - `description` - Token description text
   - `tradeUrl` - Link to trade the token
   - `appUrl` - Link to token app/website
   - `circulatingSupply` - Circulating supply amount
   - `totalSupply` - Total supply amount
   - `marketCap` - Market capitalization
   - `website` - Token website link
   - `twitter` - Token Twitter handle
   - `telegram` - Token Telegram link

### Data Storage:
- File: `tokens.json` (currently using file storage, needs Supabase migration)
- API: `GET /api/admin/tokens` - Get all tokens with metadata
- API: `PATCH /api/admin/tokens` - Update visibility, verification, or metadata

### How It Connects to Explorer:
- Explorer fetches tokens from API
- Checks if `isHidden = true` → doesn't display
- Shows `verified` badge if `verified = true`
- Shows all metadata fields (logo, description, links, etc.)

---

## EXPLORER - POOL MANAGEMENT

### What Admin Can Control:

1. **Pool Visibility (Hide/Show)**
   - Admin can hide liquidity pools from public Explorer
   - When hidden, pool doesn't appear in Liquidity Pools tab
   - Cascades: when token is hidden, all its pools auto-hide

### Data Storage:
- File: `pools.json` (currently using file storage, needs Supabase migration)
- API: `GET /api/admin/pools` - Get all pools with visibility
- API: `PATCH /api/admin/tokens` - Hiding a token hides its pools

### How It Connects to Explorer:
- Explorer fetches pools from API
- Checks if `isHidden = true` → doesn't display
- Filters out pools whose tokens are hidden

---

## WHAT IS NOT YET IMPLEMENTED (Don't Add These):

- Pool metadata editing (APR, volume, etc.) - NOT implemented
- Pool creation - NOT implemented
- Domain management - NOT implemented
- Quest admin controls - NOT implemented
- User enrollment management - NOT implemented
- Task completion auditing - NOT implemented

---

## DATABASE MAPPING

### Current Implementation:
- Using JSON files for persistence (temporary solution)
- Files: `tokens.json`, `pools.json`
- Stored in application directory

### What Needs Migration to Supabase:

**1. Tokens Table:**
```
- token_id (primary key)
- symbol
- issuer
- is_hidden (boolean)
- verified (boolean)
- logo_url
- category
- description
- trade_url
- app_url
- circulating_supply
- total_supply
- market_cap
- website
- twitter
- telegram
- updated_at (timestamp)
- updated_by (admin user id)
```

**2. Pools Table:**
```
- pool_id (primary key)
- token_code
- token_issuer
- main_pair
- is_hidden (boolean)
- updated_at (timestamp)
- updated_by (admin user id)
```

---

## COMPLETE SQL SCHEMA FOR SUPABASE

Copy and paste this into Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth role for admin checks
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Tokens table - what admin controls
CREATE TABLE IF NOT EXISTS public.admin_tokens (
  id TEXT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  logo_url VARCHAR(500),
  category VARCHAR(100),
  description TEXT,
  trade_url VARCHAR(500),
  app_url VARCHAR(500),
  circulating_supply VARCHAR(100),
  total_supply VARCHAR(100),
  market_cap VARCHAR(100),
  website VARCHAR(500),
  twitter VARCHAR(255),
  telegram VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pools table - what admin controls
CREATE TABLE IF NOT EXISTS public.admin_pools (
  id TEXT PRIMARY KEY,
  token_code VARCHAR(20) NOT NULL,
  token_issuer VARCHAR(255) NOT NULL,
  main_pair VARCHAR(255) NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin audit log - track all changes
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'hide_token', 'show_token', 'verify_token', 'unverify_token', 'update_metadata', 'hide_pool', 'show_pool'
  table_name VARCHAR(50) NOT NULL, -- 'tokens' or 'pools'
  record_id TEXT NOT NULL,
  changes JSONB, -- what changed
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_tokens_is_hidden ON public.admin_tokens(is_hidden);
CREATE INDEX idx_admin_tokens_verified ON public.admin_tokens(verified);
CREATE INDEX idx_admin_tokens_symbol ON public.admin_tokens(symbol);
CREATE INDEX idx_admin_pools_is_hidden ON public.admin_pools(is_hidden);
CREATE INDEX idx_admin_pools_token_code ON public.admin_pools(token_code);
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_timestamp ON public.admin_audit_log(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE public.admin_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Regular users can only READ non-hidden tokens/pools
CREATE POLICY "Users view only visible tokens"
  ON public.admin_tokens
  FOR SELECT
  USING (is_hidden = FALSE OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policy: Only admins can INSERT, UPDATE, DELETE
CREATE POLICY "Only admins modify tokens"
  ON public.admin_tokens
  FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policy: Regular users can only READ non-hidden pools
CREATE POLICY "Users view only visible pools"
  ON public.admin_pools
  FOR SELECT
  USING (is_hidden = FALSE OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policy: Only admins can modify pools
CREATE POLICY "Only admins modify pools"
  ON public.admin_pools
  FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policy: Only admins can view audit log
CREATE POLICY "Only admins view audit log"
  ON public.admin_audit_log
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- RLS Policy: System can insert audit logs
CREATE POLICY "System inserts audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (TRUE);
```

---

## HOW TO USE THIS

### Step 1: Set Up Admin Role
Go to Supabase Auth > Users, and for each admin user, add this to metadata:
```json
{
  "role": "admin"
}
```

### Step 2: Run the SQL
Copy the SQL schema above into Supabase SQL Editor and execute it.

### Step 3: Update API Endpoints
Change the API endpoints from file storage to Supabase:
- Update `/api/admin/tokens` to query `admin_tokens` table
- Update `/api/admin/pools` to query `admin_pools` table
- Add logging to `admin_audit_log` for every change

### Step 4: Update Explorer Display Logic
The Explorer fetches data and:
- Only shows tokens where `is_hidden = false`
- Only shows pools where `is_hidden = false`
- Shows verified badge if `verified = true`
- Displays all metadata fields

---

## SUMMARY OF ACTUAL ADMIN CONTROL

### Admins Can Control:
✓ Token visibility (hide/show)
✓ Token verification badge
✓ 11 token metadata fields
✓ Pool visibility (hide/show)
✓ See audit log of all changes

### Data Affected on Explorer:
✓ Which tokens appear in Market tab
✓ Which pools appear in Liquidity Pools tab
✓ Token metadata display (icon, description, links)
✓ Verified badge display

### Scope:
- 5 administrative actions (hide, show, verify, unverify, update metadata)
- 2 data tables (tokens, pools)
- 1 audit log table

---

## NEXT STEPS

1. Execute the SQL schema in Supabase
2. Set admin users with role metadata
3. Update API endpoints to use Supabase instead of JSON files
4. Test: Hide a token → verify it disappears from Explorer
5. Test: Verify a token → verify badge appears on Explorer
6. Test: Edit token metadata → verify changes appear on Explorer
