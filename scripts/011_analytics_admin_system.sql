-- =====================================================
-- ANALYTICS & ADMIN REPORTING SYSTEM
-- =====================================================
-- Complete analytics infrastructure for tracking user behavior,
-- engagement metrics, and generating admin dashboard reports.
-- Optimized for 100k+ users with millions of events.
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 1. ANALYTICS EVENTS TABLE
-- =====================================================
-- Raw event tracking for all user actions

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'signup', 'login', 'message_sent', 'story_posted', etc.
  event_category TEXT NOT NULL, -- 'auth', 'engagement', 'social', 'feature_usage'
  event_data JSONB DEFAULT '{}', -- Additional event metadata
  session_id UUID, -- Link to user session
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category, created_at DESC);
CREATE INDEX idx_analytics_events_date ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- Partition by month for better performance (optional but recommended)
-- This keeps queries fast as data grows
CREATE INDEX idx_analytics_events_created_month ON analytics_events(DATE_TRUNC('month', created_at));

-- =====================================================
-- 2. USER SESSIONS TABLE
-- =====================================================
-- Track user session duration and activity

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  platform TEXT, -- 'ios', 'android', 'web'
  app_version TEXT,
  events_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_sessions_date ON user_sessions(started_at DESC);
CREATE INDEX idx_user_sessions_duration ON user_sessions(duration_seconds);

-- =====================================================
-- 3. DAILY METRICS TABLE
-- =====================================================
-- Aggregated daily statistics for fast dashboard queries

CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL UNIQUE,
  
  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  daily_active_users INTEGER DEFAULT 0,
  weekly_active_users INTEGER DEFAULT 0,
  monthly_active_users INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,
  avg_messages_per_user NUMERIC(10,2) DEFAULT 0,
  avg_practice_minutes_per_user NUMERIC(10,2) DEFAULT 0,
  
  -- Social metrics
  stories_posted INTEGER DEFAULT 0,
  stories_viewed INTEGER DEFAULT 0,
  reactions_given INTEGER DEFAULT 0,
  
  -- Feature usage
  voice_messages INTEGER DEFAULT 0,
  text_messages INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_session_duration_seconds INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date DESC);

-- =====================================================
-- 4. MATERIALIZED VIEWS FOR FAST QUERIES
-- =====================================================

-- View: User Growth (last 30 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_growth AS
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

CREATE UNIQUE INDEX idx_mv_user_growth_date ON mv_user_growth(signup_date);

-- View: Top Cities by User Count
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_cities AS
SELECT 
  city,
  COUNT(*) as user_count,
  COUNT(CASE WHEN last_active_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users
FROM users
WHERE city IS NOT NULL
GROUP BY city
ORDER BY user_count DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_cities_city ON mv_top_cities(city);

-- View: Language Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_language_stats AS
SELECT 
  'speak' as language_type,
  UNNEST(languages_speak) as language_code,
  COUNT(*) as user_count
FROM users
WHERE languages_speak IS NOT NULL
GROUP BY UNNEST(languages_speak)
UNION ALL
SELECT 
  'learn' as language_type,
  UNNEST(languages_learn) as language_code,
  COUNT(*) as user_count
FROM users
WHERE languages_learn IS NOT NULL
GROUP BY UNNEST(languages_learn);

CREATE INDEX idx_mv_language_stats_type ON mv_language_stats(language_type, user_count DESC);

-- View: Engagement Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_engagement_summary AS
SELECT 
  DATE(created_at) as activity_date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'message_sent' THEN 1 END) as messages_sent,
  COUNT(CASE WHEN event_type = 'story_posted' THEN 1 END) as stories_posted
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

CREATE UNIQUE INDEX idx_mv_engagement_date ON mv_engagement_summary(activity_date);

-- =====================================================
-- 5. FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function: Log an analytics event
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_session_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    user_id,
    event_type,
    event_category,
    event_data,
    session_id
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_category,
    p_event_data,
    p_session_id
  )
  RETURNING id INTO v_event_id;
  
  -- Update session events count
  IF p_session_id IS NOT NULL THEN
    UPDATE user_sessions
    SET events_count = events_count + 1
    WHERE id = p_session_id;
  END IF;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Start a user session
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_id UUID,
  p_device_type TEXT DEFAULT 'mobile',
  p_platform TEXT DEFAULT 'unknown',
  p_app_version TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO user_sessions (
    user_id,
    device_type,
    platform,
    app_version
  ) VALUES (
    p_user_id,
    p_device_type,
    p_platform,
    p_app_version
  )
  RETURNING id INTO v_session_id;
  
  -- Log session start event
  PERFORM log_analytics_event(
    p_user_id,
    'session_start',
    'engagement',
    jsonb_build_object('device_type', p_device_type, 'platform', p_platform),
    v_session_id
  );
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: End a user session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_started_at TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  SELECT user_id, started_at INTO v_user_id, v_started_at
  FROM user_sessions
  WHERE id = p_session_id;
  
  v_duration := EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER;
  
  UPDATE user_sessions
  SET 
    ended_at = NOW(),
    duration_seconds = v_duration
  WHERE id = p_session_id;
  
  -- Log session end event
  PERFORM log_analytics_event(
    v_user_id,
    'session_end',
    'engagement',
    jsonb_build_object('duration_seconds', v_duration),
    p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get real-time active users count
CREATE OR REPLACE FUNCTION get_active_users_count(p_minutes INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM analytics_events
    WHERE created_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate user retention
CREATE OR REPLACE FUNCTION calculate_retention(p_cohort_date DATE, p_days_after INTEGER)
RETURNS TABLE(
  cohort_date DATE,
  cohort_size INTEGER,
  retained_users INTEGER,
  retention_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH cohort AS (
    SELECT id
    FROM users
    WHERE DATE(created_at) = p_cohort_date
  )
  SELECT 
    p_cohort_date,
    COUNT(DISTINCT c.id)::INTEGER as cohort_size,
    COUNT(DISTINCT CASE 
      WHEN ae.created_at >= p_cohort_date + p_days_after 
        AND ae.created_at < p_cohort_date + p_days_after + 1
      THEN ae.user_id 
    END)::INTEGER as retained_users,
    ROUND(
      COUNT(DISTINCT CASE 
        WHEN ae.created_at >= p_cohort_date + p_days_after 
          AND ae.created_at < p_cohort_date + p_days_after + 1
        THEN ae.user_id 
      END)::NUMERIC / NULLIF(COUNT(DISTINCT c.id), 0) * 100,
      2
    ) as retention_rate
  FROM cohort c
  LEFT JOIN analytics_events ae ON ae.user_id = c.id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user growth rate
CREATE OR REPLACE FUNCTION get_growth_rate(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  period_start DATE,
  period_end DATE,
  users_at_start INTEGER,
  users_at_end INTEGER,
  new_users INTEGER,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH period_data AS (
    SELECT 
      (CURRENT_DATE - p_days)::DATE as start_date,
      CURRENT_DATE as end_date,
      COUNT(*) FILTER (WHERE created_at < CURRENT_DATE - p_days) as start_count,
      COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE) as end_count,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - p_days) as new_count
    FROM users
  )
  SELECT 
    start_date,
    end_date,
    start_count::INTEGER,
    end_count::INTEGER,
    new_count::INTEGER,
    ROUND(
      (new_count::NUMERIC / NULLIF(start_count, 0)) * 100,
      2
    ) as growth_rate
  FROM period_data;
END;
$$ LANGUAGE plpgsql;

-- Function: Get streak distribution
CREATE OR REPLACE FUNCTION get_streak_distribution()
RETURNS TABLE(
  streak_range TEXT,
  user_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN current_streak = 0 THEN '0 days'
      WHEN current_streak BETWEEN 1 AND 7 THEN '1-7 days'
      WHEN current_streak BETWEEN 8 AND 30 THEN '8-30 days'
      WHEN current_streak BETWEEN 31 AND 90 THEN '31-90 days'
      WHEN current_streak BETWEEN 91 AND 365 THEN '91-365 days'
      ELSE '365+ days'
    END as streak_range,
    COUNT(*)::INTEGER as user_count
  FROM user_gamification
  GROUP BY 
    CASE 
      WHEN current_streak = 0 THEN '0 days'
      WHEN current_streak BETWEEN 1 AND 7 THEN '1-7 days'
      WHEN current_streak BETWEEN 8 AND 30 THEN '8-30 days'
      WHEN current_streak BETWEEN 31 AND 90 THEN '31-90 days'
      WHEN current_streak BETWEEN 91 AND 365 THEN '91-365 days'
      ELSE '365+ days'
    END
  ORDER BY 
    MIN(current_streak);
END;
$$ LANGUAGE plpgsql;

-- Function: Aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
DECLARE
  v_total_users INTEGER;
  v_new_signups INTEGER;
  v_dau INTEGER;
  v_wau INTEGER;
  v_mau INTEGER;
  v_total_messages INTEGER;
  v_total_conversations INTEGER;
  v_total_practice_minutes INTEGER;
  v_stories_posted INTEGER;
  v_stories_viewed INTEGER;
  v_avg_session_duration INTEGER;
BEGIN
  -- Calculate metrics
  SELECT COUNT(*) INTO v_total_users FROM users WHERE created_at <= p_date;
  SELECT COUNT(*) INTO v_new_signups FROM users WHERE DATE(created_at) = p_date;
  
  SELECT COUNT(DISTINCT user_id) INTO v_dau 
  FROM analytics_events 
  WHERE DATE(created_at) = p_date;
  
  SELECT COUNT(DISTINCT user_id) INTO v_wau 
  FROM analytics_events 
  WHERE created_at >= p_date - 6 AND created_at <= p_date;
  
  SELECT COUNT(DISTINCT user_id) INTO v_mau 
  FROM analytics_events 
  WHERE created_at >= p_date - 29 AND created_at <= p_date;
  
  SELECT COUNT(*) INTO v_total_messages 
  FROM messages 
  WHERE DATE(created_at) = p_date;
  
  SELECT COUNT(DISTINCT conversation_id) INTO v_total_conversations 
  FROM messages 
  WHERE DATE(created_at) = p_date;
  
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_total_practice_minutes 
  FROM practice_sessions 
  WHERE DATE(created_at) = p_date;
  
  SELECT COUNT(*) INTO v_stories_posted 
  FROM stories 
  WHERE DATE(created_at) = p_date;
  
  SELECT COUNT(*) INTO v_stories_viewed 
  FROM story_views 
  WHERE DATE(created_at) = p_date;
  
  SELECT COALESCE(AVG(duration_seconds), 0)::INTEGER INTO v_avg_session_duration 
  FROM user_sessions 
  WHERE DATE(started_at) = p_date AND ended_at IS NOT NULL;
  
  -- Insert or update daily metrics
  INSERT INTO daily_metrics (
    metric_date,
    total_users,
    new_signups,
    daily_active_users,
    weekly_active_users,
    monthly_active_users,
    total_messages,
    total_conversations,
    total_practice_minutes,
    avg_messages_per_user,
    avg_practice_minutes_per_user,
    stories_posted,
    stories_viewed,
    avg_session_duration_seconds
  ) VALUES (
    p_date,
    v_total_users,
    v_new_signups,
    v_dau,
    v_wau,
    v_mau,
    v_total_messages,
    v_total_conversations,
    v_total_practice_minutes,
    CASE WHEN v_dau > 0 THEN ROUND(v_total_messages::NUMERIC / v_dau, 2) ELSE 0 END,
    CASE WHEN v_dau > 0 THEN ROUND(v_total_practice_minutes::NUMERIC / v_dau, 2) ELSE 0 END,
    v_stories_posted,
    v_stories_viewed,
    v_avg_session_duration
  )
  ON CONFLICT (metric_date) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_signups = EXCLUDED.new_signups,
    daily_active_users = EXCLUDED.daily_active_users,
    weekly_active_users = EXCLUDED.weekly_active_users,
    monthly_active_users = EXCLUDED.monthly_active_users,
    total_messages = EXCLUDED.total_messages,
    total_conversations = EXCLUDED.total_conversations,
    total_practice_minutes = EXCLUDED.total_practice_minutes,
    avg_messages_per_user = EXCLUDED.avg_messages_per_user,
    avg_practice_minutes_per_user = EXCLUDED.avg_practice_minutes_per_user,
    stories_posted = EXCLUDED.stories_posted,
    stories_viewed = EXCLUDED.stories_viewed,
    avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
    updated_at = NOW();
    
  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_growth;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_cities;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_language_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_engagement_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS FOR AUTO EVENT LOGGING
-- =====================================================

-- Trigger: Log message sent event
CREATE OR REPLACE FUNCTION trigger_log_message_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_analytics_event(
    NEW.sender_id,
    'message_sent',
    'engagement',
    jsonb_build_object(
      'message_type', NEW.message_type,
      'conversation_id', NEW.conversation_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_message_analytics ON messages;
CREATE TRIGGER trigger_message_analytics
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_message_event();

-- Trigger: Log story posted event
CREATE OR REPLACE FUNCTION trigger_log_story_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_analytics_event(
    NEW.user_id,
    'story_posted',
    'social',
    jsonb_build_object('story_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_story_analytics ON stories;
CREATE TRIGGER trigger_story_analytics
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_story_event();

-- =====================================================
-- 7. SCHEDULED JOBS (pg_cron)
-- =====================================================

-- Schedule daily metrics aggregation (runs at 1 AM daily)
SELECT cron.schedule(
  'aggregate-daily-metrics',
  '0 1 * * *',
  $$SELECT aggregate_daily_metrics(CURRENT_DATE - 1)$$
);

-- Schedule materialized view refresh (runs every hour)
SELECT cron.schedule(
  'refresh-analytics-views',
  '0 * * * *',
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_growth;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_cities;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_language_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_engagement_summary;
  $$
);

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view analytics (you'll need to create an admin role)
CREATE POLICY "Admins can view all analytics" ON analytics_events
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view daily metrics" ON daily_metrics
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own events
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 9. SAMPLE ADMIN DASHBOARD QUERIES
-- =====================================================

-- Query 1: Real-time active users (last 5 minutes)
-- SELECT get_active_users_count(5);

-- Query 2: User growth chart (last 30 days)
-- SELECT * FROM mv_user_growth ORDER BY signup_date DESC;

-- Query 3: Top 10 cities by user count
-- SELECT * FROM mv_top_cities LIMIT 10;

-- Query 4: Top 10 languages being learned
-- SELECT language_code, user_count 
-- FROM mv_language_stats 
-- WHERE language_type = 'learn' 
-- ORDER BY user_count DESC 
-- LIMIT 10;

-- Query 5: Average messages per user per day (last 7 days)
-- SELECT 
--   metric_date,
--   avg_messages_per_user,
--   daily_active_users
-- FROM daily_metrics
-- WHERE metric_date >= CURRENT_DATE - 7
-- ORDER BY metric_date DESC;

-- Query 6: Streak distribution
-- SELECT * FROM get_streak_distribution();

-- Query 7: Most active users (last 30 days)
-- SELECT 
--   u.id,
--   u.full_name,
--   COUNT(*) as event_count
-- FROM analytics_events ae
-- JOIN users u ON u.id = ae.user_id
-- WHERE ae.created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY u.id, u.full_name
-- ORDER BY event_count DESC
-- LIMIT 10;

-- Query 8: User retention (7-day cohort from 7 days ago)
-- SELECT * FROM calculate_retention(CURRENT_DATE - 7, 7);

-- Query 9: Daily active users trend (last 30 days)
-- SELECT 
--   metric_date,
--   daily_active_users,
--   weekly_active_users,
--   monthly_active_users
-- FROM daily_metrics
-- WHERE metric_date >= CURRENT_DATE - 30
-- ORDER BY metric_date DESC;

-- Query 10: Growth rate (last 30 days)
-- SELECT * FROM get_growth_rate(30);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Run this script to set up the complete analytics system.
-- Then use the TypeScript library to log events and fetch analytics.
-- =====================================================
