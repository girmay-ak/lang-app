-- =====================================================
-- CLEANUP SCRIPT
-- Remove tables that are not needed for language exchange app
-- =====================================================

-- Drop tables that were created for other purposes
DROP TABLE IF EXISTS email_accounts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE; -- Redundant with users table
DROP TABLE IF EXISTS posts CASCADE; -- Replaced by stories table

-- Note: Run this script only if you want to remove these tables
-- Make sure to backup any important data first
