-- ============================================================================
-- SCHEDULED JOBS SYSTEM (pg_cron) - BASIC VERSION
-- ============================================================================
-- Cron jobs for existing tables only
-- Additional jobs can be enabled after creating feature tables
-- ============================================================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- 1. JOB LOGGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- running, success, failed
  error_message TEXT,
  rows_affected INTEGER,
  execution_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_job_logs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_job_logs(status, started_at DESC);

-- ============================================================================
-- 2. ACTIVE JOBS (For existing tables only)
-- ============================================================================

-- Function: Clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
  v_rows_affected INTEGER := 0;
BEGIN
  v_start_time := NOW();
  
  INSERT INTO cron_job_logs (job_name, status)
  VALUES ('cleanup_typing_indicators', 'running')
  RETURNING id INTO v_log_id;

  -- Delete typing indicators older than 10 seconds
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'success',
      rows_affected = v_rows_affected,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'failed',
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;
  
  RAISE NOTICE 'Error in cleanup_typing_indicators: %', SQLERRM;
END;
$$;

-- Function: Update user online status
CREATE OR REPLACE FUNCTION update_user_online_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
  v_rows_affected INTEGER := 0;
BEGIN
  v_start_time := NOW();
  
  INSERT INTO cron_job_logs (job_name, status)
  VALUES ('update_user_online_status', 'running')
  RETURNING id INTO v_log_id;

  -- Mark users as offline if inactive for 5 minutes
  UPDATE users
  SET is_online = false
  WHERE is_online = true
    AND last_active_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'success',
      rows_affected = v_rows_affected,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'failed',
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;
END;
$$;

-- Function: Clean up old deleted messages
CREATE OR REPLACE FUNCTION cleanup_deleted_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
  v_rows_affected INTEGER := 0;
BEGIN
  v_start_time := NOW();
  
  INSERT INTO cron_job_logs (job_name, status)
  VALUES ('cleanup_deleted_messages', 'running')
  RETURNING id INTO v_log_id;

  -- Permanently delete messages that were soft-deleted over 30 days ago
  DELETE FROM messages
  WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'success',
      rows_affected = v_rows_affected,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'failed',
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;
END;
$$;

-- Function: Update discoverable users view
CREATE OR REPLACE FUNCTION refresh_discoverable_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
  v_rows_affected INTEGER := 0;
BEGIN
  v_start_time := NOW();
  
  INSERT INTO cron_job_logs (job_name, status)
  VALUES ('refresh_discoverable_users', 'running')
  RETURNING id INTO v_log_id;

  -- Delete old entries
  DELETE FROM discoverable_users;
  
  -- Repopulate with current active users
  INSERT INTO discoverable_users (
    id, full_name, avatar_url, bio, city,
    latitude, longitude, location_point,
    languages_speak, languages_learn,
    is_available, last_active_at
  )
  SELECT 
    id, full_name, avatar_url, bio, city,
    latitude, longitude, location_point,
    languages_speak, languages_learn,
    is_available, last_active_at
  FROM users
  WHERE is_available = true
    AND ghost_mode = false
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND last_active_at > NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'success',
      rows_affected = v_rows_affected,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'failed',
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;
END;
$$;

-- Function: Database maintenance
CREATE OR REPLACE FUNCTION database_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := NOW();
  
  INSERT INTO cron_job_logs (job_name, status)
  VALUES ('database_maintenance', 'running')
  RETURNING id INTO v_log_id;

  -- Vacuum and analyze main tables
  VACUUM ANALYZE users;
  VACUUM ANALYZE messages;
  VACUUM ANALYZE conversations;
  VACUUM ANALYZE message_reactions;
  VACUUM ANALYZE message_reads;

  -- Clean up old logs (keep last 90 days)
  DELETE FROM cron_job_logs
  WHERE started_at < NOW() - INTERVAL '90 days';

  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'success',
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;

EXCEPTION WHEN OTHERS THEN
  UPDATE cron_job_logs
  SET completed_at = NOW(),
      status = 'failed',
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER * 1000
  WHERE id = v_log_id;
END;
$$;

-- ============================================================================
-- 3. SCHEDULE ACTIVE JOBS
-- ============================================================================

-- Clean typing indicators every 5 minutes
SELECT cron.schedule(
  'cleanup-typing-indicators',
  '*/5 * * * *',
  'SELECT cleanup_typing_indicators()'
);

-- Update online status every 2 minutes
SELECT cron.schedule(
  'update-online-status',
  '*/2 * * * *',
  'SELECT update_user_online_status()'
);

-- Clean deleted messages daily at 2 AM
SELECT cron.schedule(
  'cleanup-deleted-messages',
  '0 2 * * *',
  'SELECT cleanup_deleted_messages()'
);

-- Refresh discoverable users every 15 minutes
SELECT cron.schedule(
  'refresh-discoverable-users',
  '*/15 * * * *',
  'SELECT refresh_discoverable_users()'
);

-- Database maintenance monthly on 1st at 3 AM
SELECT cron.schedule(
  'database-maintenance',
  '0 3 1 * *',
  'SELECT database_maintenance()'
);

-- ============================================================================
-- 4. MONITORING VIEWS
-- ============================================================================

-- View recent job executions
CREATE OR REPLACE VIEW v_recent_cron_jobs AS
SELECT 
  job_name,
  started_at,
  completed_at,
  status,
  execution_time_ms,
  rows_affected,
  error_message
FROM cron_job_logs
ORDER BY started_at DESC
LIMIT 100;

-- View job success rate
CREATE OR REPLACE VIEW v_cron_job_stats AS
SELECT 
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
  ROUND(AVG(execution_time_ms), 2) as avg_execution_time_ms,
  MAX(started_at) as last_run_at
FROM cron_job_logs
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY job_name
ORDER BY job_name;

-- ============================================================================
-- 5. HELPER FUNCTIONS FOR MANUAL TESTING
-- ============================================================================

-- Test all jobs manually
CREATE OR REPLACE FUNCTION test_all_cron_jobs()
RETURNS TABLE(job_name TEXT, status TEXT, execution_time_ms INTEGER, error_message TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH job_results AS (
    SELECT 'cleanup_typing_indicators'::TEXT as name, cleanup_typing_indicators() as result
    UNION ALL
    SELECT 'update_user_online_status'::TEXT, update_user_online_status()
    UNION ALL
    SELECT 'cleanup_deleted_messages'::TEXT, cleanup_deleted_messages()
    UNION ALL
    SELECT 'refresh_discoverable_users'::TEXT, refresh_discoverable_users()
  )
  SELECT 
    l.job_name,
    l.status,
    l.execution_time_ms,
    l.error_message
  FROM cron_job_logs l
  WHERE l.started_at >= NOW() - INTERVAL '1 minute'
  ORDER BY l.started_at DESC;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cron_job_logs IS 'Logs for all scheduled cron jobs with execution details';
COMMENT ON FUNCTION cleanup_typing_indicators() IS 'Every 5 min: Delete old typing indicators';
COMMENT ON FUNCTION update_user_online_status() IS 'Every 2 min: Mark inactive users as offline';
COMMENT ON FUNCTION cleanup_deleted_messages() IS 'Daily: Permanently delete old soft-deleted messages';
COMMENT ON FUNCTION refresh_discoverable_users() IS 'Every 15 min: Update discoverable users cache';
COMMENT ON FUNCTION database_maintenance() IS 'Monthly: Vacuum, analyze, and optimize database';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- 
-- Active jobs are now scheduled for existing tables.
-- 
-- To enable additional jobs, first create the required tables by running:
-- - scripts/007_gamification_system.sql (for streaks, challenges, achievements)
-- - scripts/010_stories_feed_system.sql (for stories cleanup)
-- - scripts/009_notification_system.sql (for notification cleanup)
-- - scripts/011_analytics_admin_system.sql (for daily metrics)
-- - scripts/012_security_privacy_system.sql (for moderation queue)
-- 
-- Then uncomment and schedule the additional jobs in this file.
-- ============================================================================
