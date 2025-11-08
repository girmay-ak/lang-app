-- =====================================================
-- MASTER BACKEND SETUP SCRIPT
-- Language Exchange App - Complete Supabase Setup
-- =====================================================
-- This script sets up the entire backend in the correct order
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Verify PostGIS
SELECT PostGIS_Version();

-- =====================================================
-- PHASE 1: Core Database Schema
-- =====================================================
-- Run: scripts/003_complete_database_schema.sql
\i scripts/003_complete_database_schema.sql

-- =====================================================
-- PHASE 2: PostGIS Location Functions
-- =====================================================
-- Run: scripts/006_postgis_location_discovery.sql
\i scripts/006_postgis_location_discovery.sql

-- =====================================================
-- PHASE 3: Real-time Chat System
-- =====================================================
-- Run: scripts/005_realtime_chat_system.sql
\i scripts/005_realtime_chat_system.sql

-- =====================================================
-- PHASE 4: Notification System
-- =====================================================
-- Run: scripts/009_notification_system.sql
\i scripts/009_notification_system.sql

-- =====================================================
-- PHASE 5: Gamification System
-- =====================================================
-- Run: scripts/007_gamification_system.sql
\i scripts/007_gamification_system.sql

-- =====================================================
-- PHASE 6: Rating & Review System
-- =====================================================
-- Run: scripts/008_rating_review_system.sql
\i scripts/008_rating_review_system.sql

-- =====================================================
-- PHASE 7: Stories System
-- =====================================================
-- Run: scripts/010_stories_feed_system.sql
\i scripts/010_stories_feed_system.sql

-- =====================================================
-- PHASE 8: Security & Privacy
-- =====================================================
-- Run: scripts/012_security_privacy_system.sql
\i scripts/012_security_privacy_system.sql

-- =====================================================
-- PHASE 9: Analytics & Admin
-- =====================================================
-- Run: scripts/011_analytics_admin_system.sql
\i scripts/011_analytics_admin_system.sql

-- =====================================================
-- PHASE 10: Scheduled Jobs
-- =====================================================
-- Run: scripts/013_scheduled_jobs_system.sql
\i scripts/013_scheduled_jobs_system.sql

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check PostGIS version
SELECT PostGIS_Version();

-- Check extensions
SELECT * FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp', 'pg_trgm', 'pg_cron');

-- =====================================================
-- COMPLETE!
-- =====================================================
-- All backend setup is complete!
-- Next steps:
-- 1. Enable Realtime in Supabase Dashboard
-- 2. Create Storage buckets
-- 3. Set up Storage policies
-- 4. Test the application

