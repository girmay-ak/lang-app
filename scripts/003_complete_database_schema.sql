-- =====================================================
-- LANGUAGE EXCHANGE APP - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This script creates a production-ready database schema
-- with proper indexes, RLS policies, and triggers
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- 1. LANGUAGES TABLE
-- Master list of all supported languages
-- =====================================================
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL, -- ISO 639-1 code (e.g., 'en', 'es')
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100), -- Language name in its own script
  flag_emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_active ON languages(is_active);

-- =====================================================
-- 2. ENHANCED USERS TABLE
-- Update existing users table with additional fields
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'banned', 'deleted', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_last_seen BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS radius_preference INTEGER DEFAULT 50; -- km
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'offline' CHECK (availability_status IN ('available', 'busy', 'offline'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_availability ON users(availability_status);
CREATE INDEX idx_users_last_active ON users(last_active_at);
-- PostGIS spatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (
  ST_MakePoint(longitude, latitude)::geography
);

-- =====================================================
-- 3. USER_LANGUAGES TABLE
-- Junction table for user languages with proficiency
-- =====================================================
CREATE TABLE IF NOT EXISTS user_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  language_type VARCHAR(20) NOT NULL CHECK (language_type IN ('native', 'learning')),
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'native')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, language_code, language_type)
);

CREATE INDEX idx_user_languages_user ON user_languages(user_id);
CREATE INDEX idx_user_languages_code ON user_languages(language_code);
CREATE INDEX idx_user_languages_type ON user_languages(language_type);

-- =====================================================
-- 4. USER_CONNECTIONS TABLE
-- Favorites, blocks, reports, friend requests
-- =====================================================
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('favorite', 'block', 'report', 'friend_request', 'friend')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'resolved')),
  reason TEXT, -- For reports
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(user_id, target_user_id, connection_type)
);

CREATE INDEX idx_connections_user ON user_connections(user_id);
CREATE INDEX idx_connections_target ON user_connections(target_user_id);
CREATE INDEX idx_connections_type ON user_connections(connection_type);
CREATE INDEX idx_connections_status ON user_connections(status);

-- =====================================================
-- 5. ENHANCED CONVERSATIONS TABLE
-- Update existing conversations with metadata
-- =====================================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_typing BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_typing BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_last_read_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_last_read_at TIMESTAMPTZ;

CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- =====================================================
-- 6. ENHANCED MESSAGES TABLE
-- Update existing messages with additional features
-- =====================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'system'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = false;

-- =====================================================
-- 7. MESSAGE_REACTIONS TABLE
-- Reactions/likes on messages
-- =====================================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(50) NOT NULL, -- emoji or reaction type
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_reactions_user ON message_reactions(user_id);

-- =====================================================
-- 8. USER_GAMIFICATION TABLE
-- XP, levels, streaks for each user
-- =====================================================
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_practice_minutes INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_connections INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gamification_level ON user_gamification(level DESC);
CREATE INDEX idx_gamification_xp ON user_gamification(xp_points DESC);
CREATE INDEX idx_gamification_streak ON user_gamification(current_streak DESC);

-- =====================================================
-- 9. ACHIEVEMENTS TABLE
-- Master list of all achievements
-- =====================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  category VARCHAR(50), -- 'social', 'practice', 'streak', etc.
  xp_reward INTEGER DEFAULT 0,
  requirement_type VARCHAR(50), -- 'message_count', 'streak_days', etc.
  requirement_value INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active);

-- =====================================================
-- 10. USER_ACHIEVEMENTS TABLE
-- Achievements earned by users
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- =====================================================
-- 11. POINTS_HISTORY TABLE
-- Track when and why points were earned
-- =====================================================
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  reference_id UUID, -- ID of related entity (message, session, etc.)
  reference_type VARCHAR(50), -- 'message', 'practice_session', 'achievement', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_history_user ON points_history(user_id, created_at DESC);
CREATE INDEX idx_points_history_created ON points_history(created_at DESC);

-- =====================================================
-- 12. PRACTICE_SESSIONS TABLE
-- Track language practice sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  language_code VARCHAR(10) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_type VARCHAR(50), -- 'chat', 'video', 'voice'
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id, created_at DESC);
CREATE INDEX idx_practice_sessions_partner ON practice_sessions(partner_id);
CREATE INDEX idx_practice_sessions_language ON practice_sessions(language_code);

-- =====================================================
-- 13. USER_RATINGS TABLE
-- 5-star ratings between users
-- =====================================================
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, session_id)
);

CREATE INDEX idx_ratings_rated_user ON user_ratings(rated_user_id);
CREATE INDEX idx_ratings_rater ON user_ratings(rater_id);
CREATE INDEX idx_ratings_created ON user_ratings(created_at DESC);

-- =====================================================
-- 14. STORIES TABLE
-- 24-hour expiring posts
-- =====================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'text')),
  expires_at TIMESTAMPTZ NOT NULL,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_stories_created ON stories(created_at DESC);

-- =====================================================
-- 15. STORY_VIEWS TABLE
-- Track who viewed stories
-- =====================================================
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_story_views_viewer ON story_views(viewer_id);

-- =====================================================
-- 16. DAILY_CHALLENGES TABLE
-- Challenge definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(50) NOT NULL, -- 'message_count', 'practice_time', etc.
  target_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_active ON daily_challenges(is_active);

-- =====================================================
-- 17. USER_CHALLENGES TABLE
-- User's challenge progress
-- =====================================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_date ON user_challenges(challenge_date DESC);
CREATE INDEX idx_user_challenges_completed ON user_challenges(is_completed);

-- =====================================================
-- 18. NOTIFICATIONS TABLE
-- Notification history
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'message', 'friend_request', 'achievement', etc.
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB, -- Additional data
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  reference_id UUID, -- ID of related entity
  reference_type VARCHAR(50), -- Type of related entity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- =====================================================
-- 19. PUSH_TOKENS TABLE
-- For mobile push notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android', 'web')),
  device_id VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);

-- =====================================================
-- 20. LOCATION_HISTORY TABLE
-- Optional location tracking for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_history_user ON location_history(user_id, recorded_at DESC);
CREATE INDEX idx_location_history_location ON location_history USING GIST (
  ST_MakePoint(longitude, latitude)::geography
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- Languages: Public read access
CREATE POLICY "Languages are viewable by everyone" ON languages
  FOR SELECT USING (true);

-- User Languages: Users can manage their own languages
CREATE POLICY "Users can view their own languages" ON user_languages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own languages" ON user_languages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own languages" ON user_languages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own languages" ON user_languages
  FOR DELETE USING (auth.uid() = user_id);

-- User Connections: Users can manage their own connections
CREATE POLICY "Users can view their connections" ON user_connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections" ON user_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their connections" ON user_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Message Reactions: Users in conversation can view/add reactions
CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_reactions.message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Gamification: Users can view their own stats
CREATE POLICY "Users can view their gamification stats" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their gamification stats" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: Public read access
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

-- User Achievements: Users can view their own achievements
CREATE POLICY "Users can view their achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Points History: Users can view their own history
CREATE POLICY "Users can view their points history" ON points_history
  FOR SELECT USING (auth.uid() = user_id);

-- Practice Sessions: Users can view their own sessions
CREATE POLICY "Users can view their practice sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create practice sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Ratings: Users can view ratings about them and create ratings
CREATE POLICY "Users can view ratings" ON user_ratings
  FOR SELECT USING (auth.uid() = rated_user_id OR auth.uid() = rater_id);

CREATE POLICY "Users can create ratings" ON user_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Stories: Users can view non-expired stories from non-blocked users
CREATE POLICY "Users can view active stories" ON stories
  FOR SELECT USING (
    expires_at > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM user_connections
      WHERE user_id = auth.uid()
      AND target_user_id = stories.user_id
      AND connection_type = 'block'
    )
  );

CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story Views: Users can view who viewed their stories
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Daily Challenges: Public read access
CREATE POLICY "Challenges are viewable by everyone" ON daily_challenges
  FOR SELECT USING (true);

-- User Challenges: Users can view and update their own challenges
CREATE POLICY "Users can view their challenges" ON user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their challenges" ON user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their challenges" ON user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Push Tokens: Users can manage their own tokens
CREATE POLICY "Users can view their push tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create push tokens" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their push tokens" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their push tokens" ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Location History: Users can view their own history
CREATE POLICY "Users can view their location history" ON location_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create location history" ON location_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_languages_updated_at BEFORE UPDATE ON user_languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ratings_updated_at BEFORE UPDATE ON user_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message = NEW.content
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET user1_unread_count = CASE
      WHEN user2_id = NEW.sender_id THEN user1_unread_count + 1
      ELSE user1_unread_count
    END,
    user2_unread_count = CASE
      WHEN user1_id = NEW.sender_id THEN user2_unread_count + 1
      ELSE user2_unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_unread_on_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_unread_count();

-- Function to update story views count
CREATE OR REPLACE FUNCTION increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories
  SET views_count = views_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_story_views_on_view AFTER INSERT ON story_views
  FOR EACH ROW EXECUTE FUNCTION increment_story_views();

-- Function to create gamification record for new users
CREATE OR REPLACE FUNCTION create_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_gamification (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_gamification_on_user_create AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_gamification();

-- Function to update user's last_active_at
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active_at = NOW()
  WHERE id = NEW.user_id OR id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_active_on_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_user_last_active();

-- =====================================================
-- HELPER FUNCTIONS FOR QUERIES
-- =====================================================

-- Function to find nearby users
CREATE OR REPLACE FUNCTION find_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(u.longitude, u.latitude)::geography
    ) / 1000 AS distance_km
  FROM users u
  WHERE u.account_status = 'active'
    AND u.show_location = true
    AND ST_DWithin(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(u.longitude, u.latitude)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user's average rating
CREATE OR REPLACE FUNCTION get_user_average_rating(user_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM user_ratings
    WHERE rated_user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA - LANGUAGES
-- =====================================================
INSERT INTO languages (code, name, native_name, flag_emoji) VALUES
  ('en', 'English', 'English', '🇬🇧'),
  ('es', 'Spanish', 'Español', '🇪🇸'),
  ('fr', 'French', 'Français', '🇫🇷'),
  ('de', 'German', 'Deutsch', '🇩🇪'),
  ('it', 'Italian', 'Italiano', '🇮🇹'),
  ('pt', 'Portuguese', 'Português', '🇵🇹'),
  ('ru', 'Russian', 'Русский', '🇷🇺'),
  ('ja', 'Japanese', '日本語', '🇯🇵'),
  ('ko', 'Korean', '한국어', '🇰🇷'),
  ('zh', 'Chinese', '中文', '🇨🇳'),
  ('ar', 'Arabic', 'العربية', '🇸🇦'),
  ('hi', 'Hindi', 'हिन्दी', '🇮🇳'),
  ('nl', 'Dutch', 'Nederlands', '🇳🇱'),
  ('pl', 'Polish', 'Polski', '🇵🇱'),
  ('tr', 'Turkish', 'Türkçe', '🇹🇷'),
  ('sv', 'Swedish', 'Svenska', '🇸🇪'),
  ('no', 'Norwegian', 'Norsk', '🇳🇴'),
  ('da', 'Danish', 'Dansk', '🇩🇰'),
  ('fi', 'Finnish', 'Suomi', '🇫🇮'),
  ('el', 'Greek', 'Ελληνικά', '🇬🇷')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED DATA - SAMPLE ACHIEVEMENTS
-- =====================================================
INSERT INTO achievements (code, name, description, icon, category, xp_reward, requirement_type, requirement_value) VALUES
  ('first_message', 'First Message', 'Send your first message', '💬', 'social', 10, 'message_count', 1),
  ('chatty', 'Chatty', 'Send 100 messages', '🗣️', 'social', 50, 'message_count', 100),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 100, 'streak_days', 7),
  ('month_streak', 'Month Master', 'Maintain a 30-day streak', '🏆', 'streak', 500, 'streak_days', 30),
  ('social_butterfly', 'Social Butterfly', 'Connect with 10 users', '🦋', 'social', 75, 'connection_count', 10),
  ('practice_hour', 'Practice Hour', 'Practice for 60 minutes', '⏰', 'practice', 50, 'practice_minutes', 60),
  ('polyglot', 'Polyglot', 'Learn 3 languages', '🌍', 'learning', 200, 'language_count', 3)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED DATA - SAMPLE DAILY CHALLENGES
-- =====================================================
INSERT INTO daily_challenges (code, name, description, challenge_type, target_value, xp_reward) VALUES
  ('daily_messages', 'Daily Chatter', 'Send 10 messages today', 'message_count', 10, 20),
  ('daily_practice', 'Daily Practice', 'Practice for 30 minutes', 'practice_time', 30, 30),
  ('daily_connection', 'Make a Friend', 'Connect with 1 new user', 'connection_count', 1, 25)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- VIEWS FOR LEADERBOARDS
-- =====================================================

-- Global XP Leaderboard
CREATE OR REPLACE VIEW leaderboard_global AS
SELECT
  u.id,
  u.full_name,
  u.avatar_url,
  ug.level,
  ug.xp_points,
  ug.current_streak,
  ROW_NUMBER() OVER (ORDER BY ug.xp_points DESC) as rank
FROM users u
JOIN user_gamification ug ON u.id = ug.user_id
WHERE u.account_status = 'active'
ORDER BY ug.xp_points DESC;

-- City-based Leaderboard
CREATE OR REPLACE VIEW leaderboard_by_city AS
SELECT
  u.id,
  u.full_name,
  u.avatar_url,
  u.city,
  ug.level,
  ug.xp_points,
  ROW_NUMBER() OVER (PARTITION BY u.city ORDER BY ug.xp_points DESC) as rank
FROM users u
JOIN user_gamification ug ON u.id = ug.user_id
WHERE u.account_status = 'active'
  AND u.city IS NOT NULL
ORDER BY u.city, ug.xp_points DESC;

-- =====================================================
-- COMPLETE!
-- =====================================================
-- This schema is production-ready with:
-- ✓ Proper indexes for performance
-- ✓ Row Level Security policies
-- ✓ Triggers for automation
-- ✓ Helper functions for common queries
-- ✓ Seed data for languages and achievements
-- ✓ Leaderboard views
-- =====================================================
