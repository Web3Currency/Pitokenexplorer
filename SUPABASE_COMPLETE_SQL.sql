-- ============================================================================
-- COMPLETE SUPABASE SETUP FOR EXPLORER WITH ADMIN CONTROL
-- Copy and paste this ENTIRE file into your new Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE ADMIN_TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_tokens (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  issuer TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  description TEXT,
  trade_url TEXT,
  app_url TEXT,
  circulating_supply DECIMAL,
  total_supply DECIMAL,
  market_cap DECIMAL,
  website TEXT,
  twitter TEXT,
  telegram TEXT,
  verified BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,
  CONSTRAINT token_symbol_issuer_unique UNIQUE (symbol, issuer)
);

-- Create indexes for performance
CREATE INDEX idx_admin_tokens_symbol ON admin_tokens(symbol);
CREATE INDEX idx_admin_tokens_issuer ON admin_tokens(issuer);
CREATE INDEX idx_admin_tokens_is_hidden ON admin_tokens(is_hidden);
CREATE INDEX idx_admin_tokens_verified ON admin_tokens(verified);

-- ============================================================================
-- 2. CREATE ADMIN_POOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_pools (
  id TEXT PRIMARY KEY,
  token_code TEXT NOT NULL,
  token_issuer TEXT NOT NULL,
  main_pair TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,
  FOREIGN KEY (token_code, token_issuer) REFERENCES admin_tokens(symbol, issuer) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_admin_pools_token_code ON admin_pools(token_code);
CREATE INDEX idx_admin_pools_token_issuer ON admin_pools(token_issuer);
CREATE INDEX idx_admin_pools_is_hidden ON admin_pools(is_hidden);

-- ============================================================================
-- 3. CREATE ADMIN_AUDIT_LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE admin_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES FOR ADMIN_TOKENS
-- ============================================================================

-- Admin can see all tokens
CREATE POLICY admin_tokens_admin_select ON admin_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can insert tokens
CREATE POLICY admin_tokens_admin_insert ON admin_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can update tokens
CREATE POLICY admin_tokens_admin_update ON admin_tokens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can delete tokens
CREATE POLICY admin_tokens_admin_delete ON admin_tokens
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Regular users can only see visible tokens
CREATE POLICY admin_tokens_users_select ON admin_tokens
  FOR SELECT
  USING (is_hidden = false AND verified = true);

-- ============================================================================
-- 6. RLS POLICIES FOR ADMIN_POOLS
-- ============================================================================

-- Admin can see all pools
CREATE POLICY admin_pools_admin_select ON admin_pools
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can insert pools
CREATE POLICY admin_pools_admin_insert ON admin_pools
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can update pools
CREATE POLICY admin_pools_admin_update ON admin_pools
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can delete pools
CREATE POLICY admin_pools_admin_delete ON admin_pools
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Regular users can only see visible, verified pools
CREATE POLICY admin_pools_users_select ON admin_pools
  FOR SELECT
  USING (
    is_hidden = false AND 
    EXISTS (
      SELECT 1 FROM admin_tokens
      WHERE admin_tokens.symbol = admin_pools.token_code
      AND admin_tokens.issuer = admin_pools.token_issuer
      AND admin_tokens.verified = true
      AND admin_tokens.is_hidden = false
    )
  );

-- ============================================================================
-- 7. RLS POLICIES FOR ADMIN_AUDIT_LOG
-- ============================================================================

-- Admin can see audit logs
CREATE POLICY admin_audit_log_admin_select ON admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- Admin can insert audit logs
CREATE POLICY admin_audit_log_admin_insert ON admin_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- ============================================================================
-- 8. AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_tokens_timestamp
  BEFORE UPDATE ON admin_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_admin_pools_timestamp
  BEFORE UPDATE ON admin_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 9. GRANT PERMISSIONS TO SERVICE ROLE
-- ============================================================================
GRANT ALL ON admin_tokens TO service_role;
GRANT ALL ON admin_pools TO service_role;
GRANT ALL ON admin_audit_log TO service_role;
GRANT USAGE ON SEQUENCE admin_tokens_id_seq TO service_role;
GRANT USAGE ON SEQUENCE admin_pools_id_seq TO service_role;
GRANT USAGE ON SEQUENCE admin_audit_log_id_seq TO service_role;

-- ============================================================================
-- SETUP COMPLETE
-- Tables created: admin_tokens, admin_pools, admin_audit_log
-- RLS policies: Admin full access, Users see only verified visible items
-- Ready to use with your application
-- ============================================================================
