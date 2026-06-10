-- ============================================================================
-- SUPABASE ADMIN ROLE SETUP - Auto-Grant Admin Access
-- ============================================================================
-- This file sets up admin roles automatically without manual metadata editing
-- Execute this after creating the tables from SUPABASE_SETUP_ONLY.sql

-- OPTION 1: Grant admin role to specific user by email
-- Change 'admin@example.com' to the actual admin email
-- Run this once per admin user you want to add

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'::jsonb
)
WHERE email = 'admin@example.com';

-- ============================================================================
-- OPTION 2: Create multiple admins at once
-- Copy this block for each admin email, changing the email address each time

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'::jsonb
)
WHERE email = 'admin1@example.com';

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'::jsonb
)
WHERE email = 'admin2@example.com';

-- ============================================================================
-- OPTION 3: List all current admins
-- Run this to see who has admin role

SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';

-- ============================================================================
-- OPTION 4: Remove admin role from a user (if needed)

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"user"'::jsonb
)
WHERE email = 'admin@example.com';

-- ============================================================================
-- OPTION 5: Verify admin role was set correctly

SELECT 
  id, 
  email, 
  raw_user_meta_data->'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- HOW TO USE:
-- 
-- 1. Find which emails need admin access
-- 2. For each email, replace 'admin@example.com' with the actual email
-- 3. Run each UPDATE statement one at a time
-- 4. Run the verification query to confirm roles were set
--
-- That's it! Admin roles are now automatically set.
-- ============================================================================
