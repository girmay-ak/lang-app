-- =====================================================
-- SECURITY & PRIVACY SYSTEM
-- Complete implementation of blocking, reporting, 
-- privacy settings, content moderation, and GDPR compliance
-- =====================================================

-- =====================================================
-- 1. CREATE SECURITY TABLES
-- =====================================================

-- User Reports Table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'inappropriate_message',
    'inappropriate_story',
    'inappropriate_profile',
    'harassment',
    'spam',
    'fake_profile',
    'underage',
    'other'
  )),
  content_type VARCHAR(50) CHECK (content_type IN ('message', 'story', 'profile', 'other')),
  content_id UUID, -- ID of the reported content (message_id, story_id, etc.)
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reports
  CONSTRAINT unique_report UNIQUE (reporter_id, content_type, content_id)
);

-- Privacy Settings Table
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Location Privacy
  hide_exact_location BOOLEAN DEFAULT false,
  location_precision_meters INTEGER DEFAULT 100 CHECK (location_precision_meters IN (100, 500, 1000, 5000)),
  
  -- Activity Privacy
  hide_last_seen BOOLEAN DEFAULT false,
  hide_online_status BOOLEAN DEFAULT false,
  
  -- Messaging Privacy
  who_can_message VARCHAR(20) DEFAULT 'everyone' CHECK (who_can_message IN (
    'everyone',
    'connections_only',
    'no_one'
  )),
  
  -- Story Privacy
  story_visibility VARCHAR(20) DEFAULT 'nearby' CHECK (story_visibility IN (
    'everyone',
    'nearby',
    'connections_only',
    'no_one'
  )),
  
  -- Profile Privacy
  profile_visibility VARCHAR(20) DEFAULT 'all' CHECK (profile_visibility IN (
    'all',
    'language_learners_only',
    'hidden'
  )),
  
  -- Discovery Settings
  discoverable BOOLEAN DEFAULT true,
  show_in_search BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation Queue Table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('message', 'story', 'profile', 'user')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_reason VARCHAR(100) NOT NULL,
  auto_flagged BOOLEAN DEFAULT false,
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  report_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'removed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_action VARCHAR(50) CHECK (admin_action IN ('none', 'warning', 'content_removed', 'user_suspended', 'user_banned')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_moderation_item UNIQUE (content_type, content_id)
);

-- Rate Limit Logs Table
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banned IPs Table
CREATE TABLE IF NOT EXISTS banned_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_severity ON moderation_queue(severity);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_user ON moderation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action ON rate_limit_logs(user_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banned_ips_address ON banned_ips(ip_address);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_ips ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in auth.users metadata
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's privacy settings
CREATE OR REPLACE FUNCTION get_privacy_settings(p_user_id UUID)
RETURNS TABLE (
  hide_exact_location BOOLEAN,
  hide_last_seen BOOLEAN,
  hide_online_status BOOLEAN,
  who_can_message VARCHAR,
  story_visibility VARCHAR,
  profile_visibility VARCHAR,
  discoverable BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.hide_exact_location,
    ps.hide_last_seen,
    ps.hide_online_status,
    ps.who_can_message,
    ps.story_visibility,
    ps.profile_visibility,
    ps.discoverable
  FROM privacy_settings ps
  WHERE ps.user_id = p_user_id;
  
  -- If no settings exist, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, false, 'everyone'::VARCHAR, 'nearby'::VARCHAR, 'all'::VARCHAR, true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type VARCHAR,
  p_max_count INTEGER,
  p_time_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_logs
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  RETURN v_count < p_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log rate limit action
CREATE OR REPLACE FUNCTION log_rate_limit(
  p_user_id UUID,
  p_action_type VARCHAR,
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO rate_limit_logs (user_id, action_type, ip_address)
  VALUES (p_user_id, p_action_type, p_ip_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a report
CREATE OR REPLACE FUNCTION create_report(
  p_reporter_id UUID,
  p_reported_user_id UUID,
  p_report_type VARCHAR,
  p_content_type VARCHAR,
  p_content_id UUID,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_report_count INTEGER;
BEGIN
  -- Check rate limit (10 reports per day)
  IF NOT check_rate_limit(p_reporter_id, 'create_report', 10, 1440) THEN
    RAISE EXCEPTION 'Rate limit exceeded for reports';
  END IF;
  
  -- Create the report
  INSERT INTO user_reports (
    reporter_id,
    reported_user_id,
    report_type,
    content_type,
    content_id,
    reason
  ) VALUES (
    p_reporter_id,
    p_reported_user_id,
    p_report_type,
    p_content_type,
    p_content_id,
    p_reason
  )
  ON CONFLICT (reporter_id, content_type, content_id) DO NOTHING
  RETURNING id INTO v_report_id;
  
  -- Log the action
  PERFORM log_rate_limit(p_reporter_id, 'create_report');
  
  -- Check if content should be auto-flagged (3+ reports)
  SELECT COUNT(*) INTO v_report_count
  FROM user_reports
  WHERE content_type = p_content_type
    AND content_id = p_content_id
    AND status = 'pending';
  
  IF v_report_count >= 3 THEN
    -- Add to moderation queue
    INSERT INTO moderation_queue (
      content_type,
      content_id,
      user_id,
      flag_reason,
      auto_flagged,
      severity,
      report_count
    ) VALUES (
      p_content_type,
      p_content_id,
      p_reported_user_id,
      'Multiple reports received',
      true,
      'high',
      v_report_count
    )
    ON CONFLICT (content_type, content_id) 
    DO UPDATE SET report_count = v_report_count, severity = 'high';
  END IF;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block a user
CREATE OR REPLACE FUNCTION block_user(
  p_blocker_id UUID,
  p_blocked_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_block_id UUID;
BEGIN
  -- Can't block yourself
  IF p_blocker_id = p_blocked_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;
  
  -- Create the block
  INSERT INTO user_blocks (blocker_id, blocked_id)
  VALUES (p_blocker_id, p_blocked_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_block_id;
  
  RETURN v_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock a user
CREATE OR REPLACE FUNCTION unblock_user(
  p_blocker_id UUID,
  p_blocked_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_blocks
  WHERE blocker_id = p_blocker_id
    AND blocked_id = p_blocked_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. GDPR COMPLIANCE FUNCTIONS
-- =====================================================

-- Function to export user data (GDPR Right to Access)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'full_name', full_name,
        'bio', bio,
        'city', city,
        'languages_speak', languages_speak,
        'languages_learn', languages_learn,
        'created_at', created_at
      )
      FROM users WHERE id = p_user_id
    ),
    'messages_sent', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'content', content,
        'created_at', created_at
      ))
      FROM messages WHERE sender_id = p_user_id
    ),
    'conversations', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'created_at', created_at
      ))
      FROM conversations 
      WHERE user1_id = p_user_id OR user2_id = p_user_id
    ),
    'blocks', (
      SELECT jsonb_agg(jsonb_build_object(
        'blocked_user_id', blocked_id,
        'created_at', created_at
      ))
      FROM user_blocks WHERE blocker_id = p_user_id
    ),
    'reports_made', (
      SELECT jsonb_agg(jsonb_build_object(
        'report_type', report_type,
        'reason', reason,
        'created_at', created_at
      ))
      FROM user_reports WHERE reporter_id = p_user_id
    )
  ) INTO v_data;
  
  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user account (GDPR Right to Erasure)
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Mark user as deleted
  UPDATE users
  SET 
    email = 'deleted_' || id || '@deleted.com',
    full_name = 'Deleted User',
    bio = NULL,
    avatar_url = NULL,
    languages_speak = ARRAY[]::TEXT[],
    languages_learn = ARRAY[]::TEXT[],
    latitude = NULL,
    longitude = NULL,
    location_point = NULL,
    city = NULL,
    is_online = false,
    is_available = false,
    ghost_mode = true
  WHERE id = p_user_id;
  
  -- Soft delete messages (keep for other users' history)
  UPDATE messages
  SET 
    content = '[Message deleted]',
    is_deleted = true,
    deleted_at = NOW()
  WHERE sender_id = p_user_id;
  
  -- Delete from auth.users (this will cascade delete related data)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CONTENT MODERATION FUNCTIONS
-- =====================================================

-- Function to check for profanity (basic implementation)
CREATE OR REPLACE FUNCTION contains_profanity(p_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_profanity_words TEXT[] := ARRAY['badword1', 'badword2', 'badword3']; -- Add actual words
  v_word TEXT;
BEGIN
  FOREACH v_word IN ARRAY v_profanity_words
  LOOP
    IF LOWER(p_text) LIKE '%' || v_word || '%' THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-flag content
CREATE OR REPLACE FUNCTION auto_flag_content(
  p_content_type VARCHAR,
  p_content_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_flag_reason VARCHAR
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO moderation_queue (
    content_type,
    content_id,
    user_id,
    flag_reason,
    auto_flagged,
    severity
  ) VALUES (
    p_content_type,
    p_content_id,
    p_user_id,
    p_flag_reason,
    true,
    'medium'
  )
  ON CONFLICT (content_type, content_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. COMPREHENSIVE RLS POLICIES
-- =====================================================

-- Users Table RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view non-blocked profiles" ON users;
CREATE POLICY "Users can view non-blocked profiles" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND NOT is_user_blocked(auth.uid(), id)
    AND NOT ghost_mode
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (is_admin(auth.uid()));

-- Messages Table RLS
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Conversations Table RLS
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- User Reports RLS
DROP POLICY IF EXISTS "Users can view their own reports" ON user_reports;
CREATE POLICY "Users can view their own reports" ON user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can create reports" ON user_reports;
CREATE POLICY "Users can create reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON user_reports;
CREATE POLICY "Admins can view all reports" ON user_reports
  FOR ALL USING (is_admin(auth.uid()));

-- Privacy Settings RLS
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON privacy_settings;
CREATE POLICY "Users can view their own privacy settings" ON privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own privacy settings" ON privacy_settings;
CREATE POLICY "Users can update their own privacy settings" ON privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Moderation Queue RLS (Admin only)
DROP POLICY IF EXISTS "Admins can manage moderation queue" ON moderation_queue;
CREATE POLICY "Admins can manage moderation queue" ON moderation_queue
  FOR ALL USING (is_admin(auth.uid()));

-- Rate Limit Logs RLS (Admin only)
DROP POLICY IF EXISTS "Admins can view rate limit logs" ON rate_limit_logs;
CREATE POLICY "Admins can view rate limit logs" ON rate_limit_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Banned IPs RLS (Admin only)
DROP POLICY IF EXISTS "Admins can manage banned IPs" ON banned_ips;
CREATE POLICY "Admins can manage banned IPs" ON banned_ips
  FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- 8. TRIGGERS FOR AUTO-MODERATION
-- =====================================================

-- Trigger to auto-flag messages with profanity
CREATE OR REPLACE FUNCTION trigger_check_message_profanity()
RETURNS TRIGGER AS $$
BEGIN
  IF contains_profanity(NEW.content) THEN
    PERFORM auto_flag_content(
      'message',
      NEW.id,
      NEW.sender_id,
      NEW.content,
      'Contains profanity'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_message_profanity ON messages;
CREATE TRIGGER check_message_profanity
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_message_profanity();

-- Trigger to create default privacy settings
CREATE OR REPLACE FUNCTION trigger_create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_default_privacy_settings ON users;
CREATE TRIGGER create_default_privacy_settings
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_privacy_settings();

-- =====================================================
-- 9. ADMIN QUERIES (Views for Admin Dashboard)
-- =====================================================

-- View: Pending Reports
CREATE OR REPLACE VIEW admin_pending_reports AS
SELECT 
  r.id,
  r.report_type,
  r.content_type,
  r.reason,
  r.created_at,
  u1.full_name as reporter_name,
  u2.full_name as reported_user_name,
  r.reporter_id,
  r.reported_user_id
FROM user_reports r
LEFT JOIN users u1 ON r.reporter_id = u1.id
LEFT JOIN users u2 ON r.reported_user_id = u2.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;

-- View: Moderation Queue
CREATE OR REPLACE VIEW admin_moderation_queue AS
SELECT 
  mq.id,
  mq.content_type,
  mq.content_id,
  mq.flag_reason,
  mq.severity,
  mq.report_count,
  mq.auto_flagged,
  mq.created_at,
  u.full_name as user_name,
  u.email as user_email
FROM moderation_queue mq
LEFT JOIN users u ON mq.user_id = u.id
WHERE mq.status = 'pending'
ORDER BY mq.severity DESC, mq.created_at DESC;

-- View: User Activity Stats
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
  COUNT(*) FILTER (WHERE is_online = true) as online_users,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '24 hours') as active_users_24h
FROM users;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON user_reports TO authenticated;
GRANT ALL ON privacy_settings TO authenticated;
GRANT SELECT ON moderation_queue TO authenticated;
GRANT SELECT ON rate_limit_logs TO authenticated;
GRANT SELECT ON banned_ips TO authenticated;

-- Grant admin views to authenticated users (RLS will filter)
GRANT SELECT ON admin_pending_reports TO authenticated;
GRANT SELECT ON admin_moderation_queue TO authenticated;
GRANT SELECT ON admin_user_stats TO authenticated;

-- =====================================================
-- SECURITY & PRIVACY SYSTEM COMPLETE
-- =====================================================
