-- =====================================================
-- COMPREHENSIVE NOTIFICATION SYSTEM
-- =====================================================
-- Complete notification system with preferences, batching,
-- rate limiting, push notifications, and auto-triggers

-- =====================================================
-- 1. NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Chat notifications
  chat_new_message BOOLEAN DEFAULT true,
  chat_typing BOOLEAN DEFAULT true,
  chat_message_read BOOLEAN DEFAULT false,
  
  -- Social notifications
  social_story_view BOOLEAN DEFAULT true,
  social_story_reaction BOOLEAN DEFAULT true,
  social_story_reply BOOLEAN DEFAULT true,
  social_friend_request BOOLEAN DEFAULT true,
  social_friend_accepted BOOLEAN DEFAULT true,
  social_favorited BOOLEAN DEFAULT true,
  
  -- Activity notifications
  activity_nearby_user BOOLEAN DEFAULT true,
  activity_challenge_completed BOOLEAN DEFAULT true,
  activity_achievement BOOLEAN DEFAULT true,
  activity_level_up BOOLEAN DEFAULT true,
  activity_streak_milestone BOOLEAN DEFAULT true,
  
  -- System notifications
  system_welcome BOOLEAN DEFAULT true,
  system_streak_reminder BOOLEAN DEFAULT true,
  system_inactivity_reminder BOOLEAN DEFAULT true,
  system_announcements BOOLEAN DEFAULT true,
  
  -- Delivery preferences
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sound_enabled BOOLEAN DEFAULT true,
  
  -- Quiet hours (24-hour format)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_notification_prefs_user ON user_notification_preferences(user_id);

-- =====================================================
-- 2. NOTIFICATION BATCHING TABLE
-- =====================================================
-- Track recent notifications to prevent spam

CREATE TABLE IF NOT EXISTS notification_batch_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  related_user_id UUID, -- The user who triggered the notification
  last_sent_at TIMESTAMPTZ DEFAULT NOW(),
  count INTEGER DEFAULT 1,
  
  UNIQUE(user_id, notification_type, related_user_id)
);

CREATE INDEX idx_batch_tracker_user ON notification_batch_tracker(user_id, notification_type);
CREATE INDEX idx_batch_tracker_time ON notification_batch_tracker(last_sent_at);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_in_quiet_hours(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_current_time TIME;
BEGIN
  SELECT quiet_hours_enabled, quiet_hours_start, quiet_hours_end
  INTO v_prefs
  FROM user_notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR NOT v_prefs.quiet_hours_enabled THEN
    RETURN false;
  END IF;
  
  v_current_time := CURRENT_TIME;
  
  -- Handle quiet hours that span midnight
  IF v_prefs.quiet_hours_start > v_prefs.quiet_hours_end THEN
    RETURN v_current_time >= v_prefs.quiet_hours_start OR v_current_time <= v_prefs.quiet_hours_end;
  ELSE
    RETURN v_current_time >= v_prefs.quiet_hours_start AND v_current_time <= v_prefs.quiet_hours_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if notification type is enabled for user
CREATE OR REPLACE FUNCTION is_notification_enabled(
  p_user_id UUID,
  p_notification_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT %I FROM user_notification_preferences WHERE user_id = $1',
    p_notification_type
  ) INTO v_enabled USING p_user_id;
  
  RETURN COALESCE(v_enabled, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limiting (max 1 notification per type per user per 5 minutes)
CREATE OR REPLACE FUNCTION should_batch_notification(
  p_user_id UUID,
  p_notification_type VARCHAR(50),
  p_related_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_sent TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT last_sent_at, count
  INTO v_last_sent, v_count
  FROM notification_batch_tracker
  WHERE user_id = p_user_id
    AND notification_type = p_notification_type
    AND (related_user_id = p_related_user_id OR (related_user_id IS NULL AND p_related_user_id IS NULL));
  
  -- If no recent notification, allow it
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If last notification was within 5 minutes, batch it
  IF v_last_sent > NOW() - INTERVAL '5 minutes' THEN
    -- Update the batch tracker
    UPDATE notification_batch_tracker
    SET count = count + 1,
        last_sent_at = NOW()
    WHERE user_id = p_user_id
      AND notification_type = p_notification_type
      AND (related_user_id = p_related_user_id OR (related_user_id IS NULL AND p_related_user_id IS NULL));
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE NOTIFICATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_notification_type VARCHAR(50),
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_related_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_should_batch BOOLEAN;
BEGIN
  -- Check if notification type is enabled
  IF NOT is_notification_enabled(p_user_id, p_notification_type) THEN
    RETURN NULL;
  END IF;
  
  -- Check if in quiet hours
  IF is_in_quiet_hours(p_user_id) THEN
    RETURN NULL;
  END IF;
  
  -- Check rate limiting
  v_should_batch := should_batch_notification(p_user_id, p_notification_type, p_related_user_id);
  
  IF v_should_batch THEN
    -- Don't create a new notification, it's being batched
    RETURN NULL;
  END IF;
  
  -- Create the notification
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    body,
    data,
    is_read
  ) VALUES (
    p_user_id,
    p_notification_type,
    p_title,
    p_body,
    p_data,
    false
  ) RETURNING id INTO v_notification_id;
  
  -- Update batch tracker
  INSERT INTO notification_batch_tracker (
    user_id,
    notification_type,
    related_user_id,
    last_sent_at,
    count
  ) VALUES (
    p_user_id,
    p_notification_type,
    p_related_user_id,
    NOW(),
    1
  )
  ON CONFLICT (user_id, notification_type, related_user_id)
  DO UPDATE SET
    last_sent_at = NOW(),
    count = 1;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. NOTIFICATION MANAGEMENT FUNCTIONS
-- =====================================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW()
  WHERE user_id = auth.uid()
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = auth.uid()
      AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count by type
CREATE OR REPLACE FUNCTION get_unread_count_by_type()
RETURNS TABLE(notification_type VARCHAR(50), count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT n.notification_type, COUNT(*)
  FROM notifications n
  WHERE n.user_id = auth.uid()
    AND n.is_read = false
  GROUP BY n.notification_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete old notifications (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH ranked_notifications AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM notifications
  )
  DELETE FROM notifications
  WHERE id IN (
    SELECT id FROM ranked_notifications WHERE rn > 100
  );
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. AUTO-NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger: New message notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_conversation RECORD;
BEGIN
  -- Get conversation details
  SELECT user1_id, user2_id INTO v_conversation
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Determine recipient
  IF NEW.sender_id = v_conversation.user1_id THEN
    v_recipient_id := v_conversation.user2_id;
  ELSE
    v_recipient_id := v_conversation.user1_id;
  END IF;
  
  -- Get sender name
  SELECT full_name INTO v_sender_name
  FROM users
  WHERE id = NEW.sender_id;
  
  -- Create notification
  PERFORM create_notification(
    v_recipient_id,
    'chat_new_message',
    'New message from ' || v_sender_name,
    CASE 
      WHEN NEW.message_type = 'text' THEN LEFT(NEW.content, 100)
      WHEN NEW.message_type = 'voice' THEN '🎤 Voice message'
      WHEN NEW.message_type = 'image' THEN '📷 Image'
      ELSE 'New message'
    END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    ),
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.is_deleted = false)
EXECUTE FUNCTION notify_new_message();

-- Trigger: Achievement unlocked notification
CREATE OR REPLACE FUNCTION notify_achievement_unlocked()
RETURNS TRIGGER AS $$
DECLARE
  v_achievement_name TEXT;
BEGIN
  -- Get achievement name
  SELECT name INTO v_achievement_name
  FROM achievements
  WHERE id = NEW.achievement_id;
  
  -- Create notification
  PERFORM create_notification(
    NEW.user_id,
    'activity_achievement',
    '🏆 Achievement Unlocked!',
    'You earned: ' || v_achievement_name,
    jsonb_build_object(
      'achievement_id', NEW.achievement_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_achievement
AFTER INSERT ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION notify_achievement_unlocked();

-- Trigger: Level up notification
CREATE OR REPLACE FUNCTION notify_level_up()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    PERFORM create_notification(
      NEW.user_id,
      'activity_level_up',
      '🎉 Level Up!',
      'Congratulations! You reached level ' || NEW.level,
      jsonb_build_object(
        'new_level', NEW.level,
        'old_level', OLD.level
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_level_up
AFTER UPDATE ON user_gamification
FOR EACH ROW
WHEN (NEW.level > OLD.level)
EXECUTE FUNCTION notify_level_up();

-- Trigger: Streak milestone notification
CREATE OR REPLACE FUNCTION notify_streak_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_milestones INTEGER[] := ARRAY[7, 30, 60, 100, 365];
  v_milestone INTEGER;
BEGIN
  IF NEW.current_streak > OLD.current_streak THEN
    FOREACH v_milestone IN ARRAY v_milestones
    LOOP
      IF NEW.current_streak = v_milestone THEN
        PERFORM create_notification(
          NEW.user_id,
          'activity_streak_milestone',
          '🔥 Streak Milestone!',
          'Amazing! You reached a ' || v_milestone || '-day streak!',
          jsonb_build_object(
            'streak_days', v_milestone
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_streak_milestone
AFTER UPDATE ON user_gamification
FOR EACH ROW
WHEN (NEW.current_streak > OLD.current_streak)
EXECUTE FUNCTION notify_streak_milestone();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_batch_tracker ENABLE ROW LEVEL SECURITY;

-- Notification preferences policies
CREATE POLICY "Users can view their own preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Batch tracker policies (admin only)
CREATE POLICY "Only system can manage batch tracker"
  ON notification_batch_tracker FOR ALL
  USING (false);

-- =====================================================
-- 8. INITIALIZE DEFAULT PREFERENCES
-- =====================================================

-- Trigger to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_default_notification_prefs
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- 9. SCHEDULED CLEANUP JOB
-- =====================================================
-- Run this via pg_cron or external scheduler

-- Clean up old notifications (keep last 100 per user)
-- Schedule: Daily at 3 AM
-- SELECT cron.schedule('cleanup-old-notifications', '0 3 * * *', 'SELECT cleanup_old_notifications()');

-- Clean up old batch tracker entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_batch_tracker()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notification_batch_tracker
  WHERE last_sent_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Every hour
-- SELECT cron.schedule('cleanup-batch-tracker', '0 * * * *', 'SELECT cleanup_batch_tracker()');

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, notification_type, created_at DESC);
