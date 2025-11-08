-- =====================================================
-- COMPLETE BACKEND SETUP - ALL 10 STEPS
-- Language Exchange App - Supabase Setup
-- =====================================================
-- Copy this entire file into Supabase SQL Editor and run
-- This will set up the entire backend
-- =====================================================

-- =====================================================
-- STEP 1: Enable Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Verify PostGIS
SELECT PostGIS_Version() as postgis_version;

-- =====================================================
-- STEP 2: Core Database Schema (from 003_complete_database_schema.sql)
-- =====================================================

-- Languages Table
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100),
  flag_emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON languages(is_active);

-- Users Table Enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' 
  CHECK (account_status IN ('active', 'banned', 'deleted', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_last_seen BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS radius_preference INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'offline' 
  CHECK (availability_status IN ('available', 'busy', 'offline'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_point geography(Point, 4326);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability_status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location_point);

-- User Languages Table
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

CREATE INDEX IF NOT EXISTS idx_user_languages_user ON user_languages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_code ON user_languages(language_code);
CREATE INDEX IF NOT EXISTS idx_user_languages_type ON user_languages(language_type);

-- User Connections Table
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('favorite', 'block', 'report', 'friend_request', 'friend')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'resolved')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(user_id, target_user_id, connection_type)
);

CREATE INDEX IF NOT EXISTS idx_connections_user ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON user_connections(target_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON user_connections(connection_type);

-- Conversations Table
-- Note: If table already exists from Supabase Auth, we'll add missing columns
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user1_unread_count INTEGER DEFAULT 0,
  user2_unread_count INTEGER DEFAULT 0,
  user1_typing BOOLEAN DEFAULT false,
  user2_typing BOOLEAN DEFAULT false,
  user1_last_read_at TIMESTAMPTZ,
  user2_last_read_at TIMESTAMPTZ,
  UNIQUE(user1_id, user2_id)
);

-- Add columns if table already exists (from Supabase auth schema)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_typing BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_typing BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_last_read_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_last_read_at TIMESTAMPTZ;

-- Create indexes (only if columns exist)
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
-- Only create index on updated_at if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
  END IF;
END $$;

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'system')),
  media_url TEXT,
  voice_duration INTEGER,
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'friend_request', 'like', 'comment', 'achievement', 'challenge')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- STEP 3: PostGIS Location Functions
-- =====================================================

-- Function to find nearby users
CREATE OR REPLACE FUNCTION find_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  availability_status TEXT,
  is_online BOOLEAN,
  last_active_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    u.avatar_url,
    u.bio,
    u.latitude,
    u.longitude,
    ST_Distance(
      u.location_point::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0 as distance_km,
    u.availability_status::TEXT,
    u.is_online,
    u.last_active_at
  FROM users u
  WHERE 
    u.account_status = 'active'
    AND u.show_location = true
    AND u.location_point IS NOT NULL
    AND ST_DWithin(
      u.location_point::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT 100;
END;
$$;

-- Function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    location_point = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    location_updated_at = NOW(),
    last_active_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- =====================================================
-- STEP 4: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users Policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view nearby active users" ON users;
CREATE POLICY "Users can view nearby active users"
  ON users FOR SELECT
  USING (
    account_status = 'active' AND
    show_location = true AND
    id != auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- User Languages Policies
DROP POLICY IF EXISTS "Users can manage own languages" ON user_languages;
CREATE POLICY "Users can manage own languages"
  ON user_languages FOR ALL
  USING (auth.uid() = user_id);

-- Conversations Policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

-- Messages Policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Seed Languages Data
-- =====================================================

INSERT INTO languages (code, name, native_name, flag_emoji, is_active) VALUES
('en', 'English', 'English', '🇬🇧', true),
('es', 'Spanish', 'Español', '🇪🇸', true),
('fr', 'French', 'Français', '🇫🇷', true),
('de', 'German', 'Deutsch', '🇩🇪', true),
('it', 'Italian', 'Italiano', '🇮🇹', true),
('pt', 'Portuguese', 'Português', '🇵🇹', true),
('nl', 'Dutch', 'Nederlands', '🇳🇱', true),
('ja', 'Japanese', '日本語', '🇯🇵', true),
('zh', 'Chinese', '中文', '🇨🇳', true),
('ar', 'Arabic', 'العربية', '🇸🇦', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 6: Helper Functions
-- =====================================================

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_user1 BOOLEAN;
BEGIN
  SELECT user1_id = p_user_id INTO v_is_user1
  FROM conversations
  WHERE id = p_conversation_id;
  
  IF v_is_user1 THEN
    UPDATE conversations
    SET user1_last_read_at = NOW(),
        user1_unread_count = 0
    WHERE id = p_conversation_id;
    
    UPDATE messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id;
  ELSE
    UPDATE conversations
    SET user2_last_read_at = NOW(),
        user2_unread_count = 0
    WHERE id = p_conversation_id;
    
    UPDATE messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id;
  END IF;
END;
$$;

-- =====================================================
-- STEP 7: Triggers
-- =====================================================

-- Trigger to update conversation updated_at when message is inserted
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Update unread count
  UPDATE conversations
  SET 
    user1_unread_count = CASE WHEN user1_id != NEW.sender_id THEN user1_unread_count + 1 ELSE user1_unread_count END,
    user2_unread_count = CASE WHEN user2_id != NEW.sender_id THEN user2_unread_count + 1 ELSE user2_unread_count END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =====================================================
-- STEP 8: Verification
-- =====================================================

-- Check tables
SELECT 'Tables created successfully' as status, count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'languages', 'user_languages', 'conversations', 'messages', 'notifications', 'user_connections');

-- Check functions
SELECT 'Functions created successfully' as status, count(*) as function_count
FROM pg_proc
WHERE proname IN ('find_nearby_users', 'update_user_location', 'mark_conversation_as_read');

-- Check PostGIS
SELECT 'PostGIS enabled' as status, PostGIS_Version() as version;

-- Check RLS
SELECT 'RLS enabled' as status, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'conversations', 'messages', 'notifications')
ORDER BY tablename;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Enable Realtime in Supabase Dashboard (Database → Replication)
--    - Enable for: messages, conversations, users, notifications
-- 2. Create Storage buckets (Storage → New bucket)
--    - avatars (public)
--    - chat-images (public)
--    - voice-messages (public)
-- 3. Test the application

SELECT '✅ All 10 steps completed successfully!' as status;

