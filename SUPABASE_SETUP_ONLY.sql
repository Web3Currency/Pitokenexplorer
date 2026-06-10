-- ADMIN CONTROL CENTER - SUPABASE SETUP SCRIPT
-- This is the ONLY SQL you need to paste into Supabase
-- It sets up ONLY what's actually implemented: Token & Pool visibility control

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: ADMIN TOKENS (What admins can control)
-- ============================================================================
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

-- ============================================================================
-- TABLE 2: ADMIN POOLS (What admins can control)
-- ============================================================================
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

-- ============================================================================
-- TABLE 3: ADMIN AUDIT LOG (Track all admin changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id TEXT NOT NULL,
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_admin_tokens_is_hidden ON public.admin_tokens(is_hidden);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_verified ON public.admin_tokens(verified);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_symbol ON public.admin_tokens(symbol);
CREATE INDEX IF NOT EXISTS idx_admin_pools_is_hidden ON public.admin_pools(is_hidden);
CREATE INDEX IF NOT EXISTS idx_admin_pools_token_code ON public.admin_pools(token_code);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON public.admin_audit_log(timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Enforce admin-only access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICY 1: Users can only see visible tokens
-- ============================================================================
DROP POLICY IF EXISTS "Users view only visible tokens" ON public.admin_tokens;
CREATE POLICY "Users view only visible tokens"
  ON public.admin_tokens
  FOR SELECT
  USING (
    is_hidden = FALSE 
    OR 
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICY 2: Only admins can modify tokens
-- ============================================================================
DROP POLICY IF EXISTS "Only admins modify tokens" ON public.admin_tokens;
CREATE POLICY "Only admins modify tokens"
  ON public.admin_tokens
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICY 3: Users can only see visible pools
-- ============================================================================
DROP POLICY IF EXISTS "Users view only visible pools" ON public.admin_pools;
CREATE POLICY "Users view only visible pools"
  ON public.admin_pools
  FOR SELECT
  USING (
    is_hidden = FALSE 
    OR 
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICY 4: Only admins can modify pools
-- ============================================================================
DROP POLICY IF EXISTS "Only admins modify pools" ON public.admin_pools;
CREATE POLICY "Only admins modify pools"
  ON public.admin_pools
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICY 5: Only admins can view audit log
-- ============================================================================
DROP POLICY IF EXISTS "Only admins view audit log" ON public.admin_audit_log;
CREATE POLICY "Only admins view audit log"
  ON public.admin_audit_log
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICY 6: System can insert audit logs
-- ============================================================================
DROP POLICY IF EXISTS "System inserts audit logs" ON public.admin_audit_log;
CREATE POLICY "System inserts audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your admin control center is ready!
--
-- Next steps:
-- 1. In Supabase Auth > Users, add this to ADMIN user metadata:
--    {"role": "admin"}
--
-- 2. Update your API endpoints to use these tables instead of JSON files
--
-- 3. Regular users will only see is_hidden = false items
--    Admins will see everything and can edit
