-- ============================================================================
-- ADMIN CONTROL CENTER - SUPABASE SCHEMA
-- ============================================================================
-- 
-- Copy and paste this entire script into your Supabase SQL Editor
-- to create all tables with proper RLS policies
--
-- ============================================================================

-- Enable UUID and JSONB extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "jsonb";

-- ============================================================================
-- 1. TOKENS METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tokens_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  issuer TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  icon_url TEXT,
  color TEXT DEFAULT '#6366f1',
  category TEXT DEFAULT 'general',
  verified BOOLEAN DEFAULT FALSE,
  rank INTEGER,
  enabled BOOLEAN DEFAULT TRUE,
  liquidity_pool_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(code, issuer)
);

-- Indexes for performance
CREATE INDEX idx_tokens_code ON tokens_metadata(code);
CREATE INDEX idx_tokens_rank ON tokens_metadata(rank);
CREATE INDEX idx_tokens_enabled ON tokens_metadata(enabled);
CREATE INDEX idx_tokens_verified ON tokens_metadata(verified);

-- ============================================================================
-- 2. LIQUIDITY POOLS METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS liquidity_pools_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  token1_id UUID NOT NULL,
  token2_id UUID NOT NULL,
  total_liquidity TEXT DEFAULT '0',
  volume_24h TEXT DEFAULT '0',
  apr_percentage DECIMAL(5, 2) DEFAULT 0.00,
  fees_24h TEXT DEFAULT '0',
  icon1_url TEXT,
  icon2_url TEXT,
  color TEXT DEFAULT '#8b5cf6',
  rank INTEGER,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  FOREIGN KEY (token1_id) REFERENCES tokens_metadata(id) ON DELETE CASCADE,
  FOREIGN KEY (token2_id) REFERENCES tokens_metadata(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_liquidity_pools_token1 ON liquidity_pools_metadata(token1_id);
CREATE INDEX idx_liquidity_pools_token2 ON liquidity_pools_metadata(token2_id);
CREATE INDEX idx_liquidity_pools_rank ON liquidity_pools_metadata(rank);
CREATE INDEX idx_liquidity_pools_enabled ON liquidity_pools_metadata(enabled);

-- ============================================================================
-- 3. POOL PAIRS TABLE (Tokens within a pool)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pool_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL,
  token_id UUID NOT NULL,
  locked_amount TEXT DEFAULT '0',
  fees_earned TEXT DEFAULT '0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (pool_id) REFERENCES liquidity_pools_metadata(id) ON DELETE CASCADE,
  FOREIGN KEY (token_id) REFERENCES tokens_metadata(id) ON DELETE CASCADE,
  UNIQUE(pool_id, token_id)
);

-- Indexes
CREATE INDEX idx_pool_pairs_pool ON pool_pairs(pool_id);
CREATE INDEX idx_pool_pairs_token ON pool_pairs(token_id);

-- ============================================================================
-- 4. MARKET STATS OVERRIDE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS market_stats_override (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network TEXT DEFAULT 'Pi Testnet',
  total_liquidity TEXT DEFAULT '0',
  liquidity_change_percent TEXT DEFAULT '0%',
  total_tokens INTEGER DEFAULT 0,
  token_count_change_percent TEXT DEFAULT '0%',
  active_pools_count INTEGER DEFAULT 0,
  largest_pool_id UUID,
  use_overrides BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  FOREIGN KEY (largest_pool_id) REFERENCES liquidity_pools_metadata(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_market_stats_network ON market_stats_override(network);

-- ============================================================================
-- 5. DOMAINS METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS domains_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  registrar TEXT,
  price TEXT DEFAULT '0',
  registered_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  icon_url TEXT,
  color TEXT DEFAULT '#ec4899',
  verified BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general',
  rank INTEGER,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- Indexes
CREATE INDEX idx_domains_name ON domains_metadata(name);
CREATE INDEX idx_domains_rank ON domains_metadata(rank);
CREATE INDEX idx_domains_enabled ON domains_metadata(enabled);

-- ============================================================================
-- 6. TOKEN LINKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS token_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'info',
  url TEXT NOT NULL,
  label TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (token_id) REFERENCES tokens_metadata(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_token_links_token ON token_links(token_id);
CREATE INDEX idx_token_links_type ON token_links(link_type);

-- ============================================================================
-- 7. POOL LINKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pool_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'info',
  url TEXT NOT NULL,
  label TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (pool_id) REFERENCES liquidity_pools_metadata(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_pool_links_pool ON pool_links(pool_id);
CREATE INDEX idx_pool_links_type ON pool_links(link_type);

-- ============================================================================
-- 8. ADMIN AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_table ON admin_audit_log(table_name);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tokens_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pools_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_stats_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TOKENS METADATA POLICIES
-- ============================================================================

-- Public can read all enabled tokens
CREATE POLICY "Tokens: Public Read" ON tokens_metadata
  FOR SELECT
  USING (enabled = TRUE);

-- Admins can read all tokens (including disabled)
CREATE POLICY "Tokens: Admin Read" ON tokens_metadata
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert
CREATE POLICY "Tokens: Admin Insert" ON tokens_metadata
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update
CREATE POLICY "Tokens: Admin Update" ON tokens_metadata
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- LIQUIDITY POOLS METADATA POLICIES
-- ============================================================================

-- Public can read all enabled pools
CREATE POLICY "Pools: Public Read" ON liquidity_pools_metadata
  FOR SELECT
  USING (enabled = TRUE);

-- Admins can read all pools
CREATE POLICY "Pools: Admin Read" ON liquidity_pools_metadata
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert
CREATE POLICY "Pools: Admin Insert" ON liquidity_pools_metadata
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update
CREATE POLICY "Pools: Admin Update" ON liquidity_pools_metadata
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- POOL PAIRS POLICIES
-- ============================================================================

-- Public can read all pool pairs
CREATE POLICY "Pool Pairs: Public Read" ON pool_pairs
  FOR SELECT
  USING (TRUE);

-- Admins can insert/update/delete
CREATE POLICY "Pool Pairs: Admin Insert" ON pool_pairs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Pool Pairs: Admin Update" ON pool_pairs
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- MARKET STATS OVERRIDE POLICIES
-- ============================================================================

-- Public can read market stats
CREATE POLICY "Market Stats: Public Read" ON market_stats_override
  FOR SELECT
  USING (TRUE);

-- Admins can insert/update
CREATE POLICY "Market Stats: Admin Insert" ON market_stats_override
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Market Stats: Admin Update" ON market_stats_override
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- DOMAINS METADATA POLICIES
-- ============================================================================

-- Public can read all enabled domains
CREATE POLICY "Domains: Public Read" ON domains_metadata
  FOR SELECT
  USING (enabled = TRUE);

-- Admins can read all domains
CREATE POLICY "Domains: Admin Read" ON domains_metadata
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert/update
CREATE POLICY "Domains: Admin Insert" ON domains_metadata
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Domains: Admin Update" ON domains_metadata
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- TOKEN LINKS POLICIES
-- ============================================================================

-- Public can read all enabled links
CREATE POLICY "Token Links: Public Read" ON token_links
  FOR SELECT
  USING (enabled = TRUE);

-- Admins can read all links
CREATE POLICY "Token Links: Admin Read" ON token_links
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert/update
CREATE POLICY "Token Links: Admin Insert" ON token_links
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Token Links: Admin Update" ON token_links
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- POOL LINKS POLICIES
-- ============================================================================

-- Public can read all enabled links
CREATE POLICY "Pool Links: Public Read" ON pool_links
  FOR SELECT
  USING (enabled = TRUE);

-- Admins can read all links
CREATE POLICY "Pool Links: Admin Read" ON pool_links
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert/update
CREATE POLICY "Pool Links: Admin Insert" ON pool_links
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Pool Links: Admin Update" ON pool_links
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- ADMIN AUDIT LOG POLICIES
-- ============================================================================

-- Only admins can read audit logs
CREATE POLICY "Audit Log: Admin Read" ON admin_audit_log
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "Audit Log: Admin Insert" ON admin_audit_log
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
