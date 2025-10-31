-- =====================================================
-- RATING & REVIEW SYSTEM
-- Complete implementation with validation, caching, and anti-abuse
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. RATING STATS CACHE TABLE
-- Stores pre-calculated rating statistics for performance
-- =====================================================

CREATE TABLE IF NOT EXISTS rating_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Aggregate stats
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  
  -- Star distribution
  five_star_count INTEGER DEFAULT 0,
  four_star_count INTEGER DEFAULT 0,
  three_star_count INTEGER DEFAULT 0,
  two_star_count INTEGER DEFAULT 0,
  one_star_count INTEGER DEFAULT 0,
  
  -- Percentages (for quick display)
  five_star_percent DECIMAL(5,2) DEFAULT 0.00,
  four_star_percent DECIMAL(5,2) DEFAULT 0.00,
  three_star_percent DECIMAL(5,2) DEFAULT 0.00,
  two_star_percent DECIMAL(5,2) DEFAULT 0.00,
  one_star_percent DECIMAL(5,2) DEFAULT 0.00,
  
  -- Timestamps
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_rating_stats_user ON rating_stats(user_id);
CREATE INDEX idx_rating_stats_average ON rating_stats(average_rating DESC);

-- =====================================================
-- 2. RATING REPORTS TABLE
-- For reporting inappropriate reviews
-- =====================================================

CREATE TABLE IF NOT EXISTS rating_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating_id UUID NOT NULL REFERENCES user_ratings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  UNIQUE(rating_id, reporter_id) -- One report per user per rating
);

CREATE INDEX idx_rating_reports_rating ON rating_reports(rating_id);
CREATE INDEX idx_rating_reports_status ON rating_reports(status);
CREATE INDEX idx_rating_reports_created ON rating_reports(created_at DESC);

-- =====================================================
-- 3. PRACTICE SESSION TRACKING
-- Track chat duration for rating eligibility
-- =====================================================

CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

CREATE INDEX idx_practice_sessions_conversation ON practice_sessions(conversation_id);
CREATE INDEX idx_practice_sessions_users ON practice_sessions(user1_id, user2_id);
CREATE INDEX idx_practice_sessions_date ON practice_sessions(created_at DESC);

-- =====================================================
-- 4. FUNCTION: Check if user can rate another user
-- Validates: chat duration, daily limit, self-rating
-- =====================================================

CREATE OR REPLACE FUNCTION can_rate_user(
  p_rater_id UUID,
  p_rated_user_id UUID
)
RETURNS TABLE (
  can_rate BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_chat_duration INTEGER;
  v_rating_today INTEGER;
  v_has_chatted BOOLEAN;
BEGIN
  -- Cannot rate yourself
  IF p_rater_id = p_rated_user_id THEN
    RETURN QUERY SELECT FALSE, 'Cannot rate yourself';
    RETURN;
  END IF;
  
  -- Check if users have chatted
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE (user1_id = p_rater_id AND user2_id = p_rated_user_id)
       OR (user1_id = p_rated_user_id AND user2_id = p_rater_id)
  ) INTO v_has_chatted;
  
  IF NOT v_has_chatted THEN
    RETURN QUERY SELECT FALSE, 'You must chat with this user before rating';
    RETURN;
  END IF;
  
  -- Check chat duration (must be 10+ minutes)
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO v_chat_duration
  FROM practice_sessions
  WHERE (user1_id = LEAST(p_rater_id, p_rated_user_id) 
     AND user2_id = GREATEST(p_rater_id, p_rated_user_id));
  
  IF v_chat_duration < 10 THEN
    RETURN QUERY SELECT FALSE, 'Must chat for at least 10 minutes before rating';
    RETURN;
  END IF;
  
  -- Check if already rated today
  SELECT COUNT(*)
  INTO v_rating_today
  FROM user_ratings
  WHERE rater_id = p_rater_id
    AND rated_user_id = p_rated_user_id
    AND created_at >= CURRENT_DATE;
  
  IF v_rating_today > 0 THEN
    RETURN QUERY SELECT FALSE, 'You can only rate this user once per day';
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT TRUE, 'Can rate user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNCTION: Add new rating with validation
-- =====================================================

CREATE OR REPLACE FUNCTION add_rating(
  p_rater_id UUID,
  p_rated_user_id UUID,
  p_rating INTEGER,
  p_review TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  rating_id UUID
) AS $$
DECLARE
  v_can_rate BOOLEAN;
  v_reason TEXT;
  v_new_rating_id UUID;
  v_review_length INTEGER;
BEGIN
  -- Validate rating value
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT FALSE, 'Rating must be between 1 and 5', NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate review length
  IF p_review IS NOT NULL THEN
    v_review_length := LENGTH(p_review);
    IF v_review_length > 500 THEN
      RETURN QUERY SELECT FALSE, 'Review must be 500 characters or less', NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- Check if user can rate
  SELECT cr.can_rate, cr.reason
  INTO v_can_rate, v_reason
  FROM can_rate_user(p_rater_id, p_rated_user_id) cr;
  
  IF NOT v_can_rate THEN
    RETURN QUERY SELECT FALSE, v_reason, NULL::UUID;
    RETURN;
  END IF;
  
  -- Insert rating
  INSERT INTO user_ratings (rater_id, rated_user_id, rating, review)
  VALUES (p_rater_id, p_rated_user_id, p_rating, p_review)
  RETURNING id INTO v_new_rating_id;
  
  -- Update cached stats (will be handled by trigger)
  
  RETURN QUERY SELECT TRUE, 'Rating added successfully', v_new_rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCTION: Calculate and cache rating stats
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_rating_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_avg DECIMAL(3,2);
  v_total INTEGER;
  v_five INTEGER;
  v_four INTEGER;
  v_three INTEGER;
  v_two INTEGER;
  v_one INTEGER;
BEGIN
  -- Get counts
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1)
  INTO v_avg, v_total, v_five, v_four, v_three, v_two, v_one
  FROM user_ratings
  WHERE rated_user_id = p_user_id;
  
  -- Upsert stats
  INSERT INTO rating_stats (
    user_id,
    average_rating,
    total_ratings,
    five_star_count,
    four_star_count,
    three_star_count,
    two_star_count,
    one_star_count,
    five_star_percent,
    four_star_percent,
    three_star_percent,
    two_star_percent,
    one_star_percent,
    last_calculated_at
  ) VALUES (
    p_user_id,
    v_avg,
    v_total,
    v_five,
    v_four,
    v_three,
    v_two,
    v_one,
    CASE WHEN v_total > 0 THEN ROUND((v_five::decimal / v_total * 100), 2) ELSE 0 END,
    CASE WHEN v_total > 0 THEN ROUND((v_four::decimal / v_total * 100), 2) ELSE 0 END,
    CASE WHEN v_total > 0 THEN ROUND((v_three::decimal / v_total * 100), 2) ELSE 0 END,
    CASE WHEN v_total > 0 THEN ROUND((v_two::decimal / v_total * 100), 2) ELSE 0 END,
    CASE WHEN v_total > 0 THEN ROUND((v_one::decimal / v_total * 100), 2) ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    five_star_count = EXCLUDED.five_star_count,
    four_star_count = EXCLUDED.four_star_count,
    three_star_count = EXCLUDED.three_star_count,
    two_star_count = EXCLUDED.two_star_count,
    one_star_count = EXCLUDED.one_star_count,
    five_star_percent = EXCLUDED.five_star_percent,
    four_star_percent = EXCLUDED.four_star_percent,
    three_star_percent = EXCLUDED.three_star_percent,
    two_star_percent = EXCLUDED.two_star_percent,
    one_star_percent = EXCLUDED.one_star_percent,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCTION: Get rating breakdown
-- =====================================================

CREATE OR REPLACE FUNCTION get_rating_breakdown(p_user_id UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_ratings INTEGER,
  five_stars INTEGER,
  five_stars_percent DECIMAL(5,2),
  four_stars INTEGER,
  four_stars_percent DECIMAL(5,2),
  three_stars INTEGER,
  three_stars_percent DECIMAL(5,2),
  two_stars INTEGER,
  two_stars_percent DECIMAL(5,2),
  one_star INTEGER,
  one_stars_percent DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.average_rating,
    rs.total_ratings,
    rs.five_star_count,
    rs.five_star_percent,
    rs.four_star_count,
    rs.four_star_percent,
    rs.three_star_count,
    rs.three_star_percent,
    rs.two_star_count,
    rs.two_star_percent,
    rs.one_star_count,
    rs.one_star_percent
  FROM rating_stats rs
  WHERE rs.user_id = p_user_id;
  
  -- If no stats exist, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0.00::DECIMAL(3,2), 0, 0, 0.00::DECIMAL(5,2), 
                        0, 0.00::DECIMAL(5,2), 0, 0.00::DECIMAL(5,2),
                        0, 0.00::DECIMAL(5,2), 0, 0.00::DECIMAL(5,2);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNCTION: Get recent reviews for a user
-- =====================================================

CREATE OR REPLACE FUNCTION get_recent_reviews(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  rating_id UUID,
  rater_name TEXT,
  rater_avatar TEXT,
  rating INTEGER,
  review TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.id,
    u.full_name,
    u.avatar_url,
    ur.rating,
    ur.review,
    ur.created_at
  FROM user_ratings ur
  JOIN users u ON u.id = ur.rater_id
  WHERE ur.rated_user_id = p_user_id
    AND ur.review IS NOT NULL
    AND ur.review != ''
  ORDER BY ur.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCTION: Report inappropriate review
-- =====================================================

CREATE OR REPLACE FUNCTION report_rating(
  p_rating_id UUID,
  p_reporter_id UUID,
  p_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Check if rating exists
  IF NOT EXISTS (SELECT 1 FROM user_ratings WHERE id = p_rating_id) THEN
    RETURN QUERY SELECT FALSE, 'Rating not found';
    RETURN;
  END IF;
  
  -- Insert report
  INSERT INTO rating_reports (rating_id, reporter_id, reason)
  VALUES (p_rating_id, p_reporter_id, p_reason)
  ON CONFLICT (rating_id, reporter_id) DO NOTHING;
  
  RETURN QUERY SELECT TRUE, 'Report submitted successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Failed to submit report';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNCTION: Track practice session
-- =====================================================

CREATE OR REPLACE FUNCTION track_practice_session(
  p_conversation_id UUID,
  p_user1_id UUID,
  p_user2_id UUID,
  p_duration_minutes INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_ordered_user1 UUID;
  v_ordered_user2 UUID;
BEGIN
  -- Ensure consistent ordering
  IF p_user1_id < p_user2_id THEN
    v_ordered_user1 := p_user1_id;
    v_ordered_user2 := p_user2_id;
  ELSE
    v_ordered_user1 := p_user2_id;
    v_ordered_user2 := p_user1_id;
  END IF;
  
  INSERT INTO practice_sessions (
    conversation_id,
    user1_id,
    user2_id,
    duration_minutes,
    ended_at
  ) VALUES (
    p_conversation_id,
    v_ordered_user1,
    v_ordered_user2,
    p_duration_minutes,
    NOW()
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. FUNCTION: Get rating analytics
-- =====================================================

CREATE OR REPLACE FUNCTION get_rating_analytics(p_user_id UUID)
RETURNS TABLE (
  user_average DECIMAL(3,2),
  city_average DECIMAL(3,2),
  global_average DECIMAL(3,2),
  percentile INTEGER,
  trend TEXT
) AS $$
DECLARE
  v_user_avg DECIMAL(3,2);
  v_city_avg DECIMAL(3,2);
  v_global_avg DECIMAL(3,2);
  v_percentile INTEGER;
  v_user_city TEXT;
  v_recent_avg DECIMAL(3,2);
  v_older_avg DECIMAL(3,2);
  v_trend TEXT;
BEGIN
  -- Get user's average
  SELECT average_rating INTO v_user_avg
  FROM rating_stats
  WHERE user_id = p_user_id;
  
  -- Get user's city
  SELECT city INTO v_user_city
  FROM users
  WHERE id = p_user_id;
  
  -- Get city average
  SELECT COALESCE(AVG(rs.average_rating), 0)
  INTO v_city_avg
  FROM rating_stats rs
  JOIN users u ON u.id = rs.user_id
  WHERE u.city = v_user_city
    AND rs.total_ratings >= 5;
  
  -- Get global average
  SELECT COALESCE(AVG(average_rating), 0)
  INTO v_global_avg
  FROM rating_stats
  WHERE total_ratings >= 5;
  
  -- Calculate percentile
  SELECT COALESCE(
    ROUND(
      (COUNT(*) FILTER (WHERE average_rating < v_user_avg)::decimal / 
       NULLIF(COUNT(*), 0) * 100)
    ), 0
  )::INTEGER
  INTO v_percentile
  FROM rating_stats
  WHERE total_ratings >= 5;
  
  -- Calculate trend (last 10 vs previous 10)
  SELECT COALESCE(AVG(rating), 0)
  INTO v_recent_avg
  FROM (
    SELECT rating FROM user_ratings
    WHERE rated_user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) recent;
  
  SELECT COALESCE(AVG(rating), 0)
  INTO v_older_avg
  FROM (
    SELECT rating FROM user_ratings
    WHERE rated_user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 10 OFFSET 10
  ) older;
  
  IF v_recent_avg > v_older_avg + 0.3 THEN
    v_trend := 'improving';
  ELSIF v_recent_avg < v_older_avg - 0.3 THEN
    v_trend := 'declining';
  ELSE
    v_trend := 'stable';
  END IF;
  
  RETURN QUERY SELECT v_user_avg, v_city_avg, v_global_avg, v_percentile, v_trend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. TRIGGER: Auto-update rating stats on new rating
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate stats for the rated user
  PERFORM calculate_rating_stats(NEW.rated_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rating_stats_on_new_rating ON user_ratings;
CREATE TRIGGER update_rating_stats_on_new_rating
AFTER INSERT ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_rating_stats();

-- =====================================================
-- 13. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Rating Stats: Everyone can view
CREATE POLICY "Anyone can view rating stats" ON rating_stats
  FOR SELECT USING (true);

-- Rating Reports: Users can report and view their own reports
CREATE POLICY "Users can create reports" ON rating_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their reports" ON rating_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Practice Sessions: Users can view their own sessions
CREATE POLICY "Users can view their practice sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create practice sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =====================================================
-- 14. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_practice_sessions_duration ON practice_sessions(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_rating_reports_reporter ON rating_reports(reporter_id);

-- =====================================================
-- 15. INITIAL DATA MIGRATION
-- Calculate stats for existing users
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT DISTINCT rated_user_id FROM user_ratings
  LOOP
    PERFORM calculate_rating_stats(user_record.rated_user_id);
  END LOOP;
END $$;

-- =====================================================
-- RATING SYSTEM SETUP COMPLETE
-- =====================================================
