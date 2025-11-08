CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

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

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'banned', 'deleted', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_last_seen BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS radius_preference INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'offline' CHECK (availability_status IN ('available', 'busy', 'offline'));
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

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_typing BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_typing BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_last_read_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_last_read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'updated_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
  END IF;
END $$;

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

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'is_read'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
  END IF;
END $$;

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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can manage own languages" ON user_languages;
CREATE POLICY "Users can manage own languages"
  ON user_languages FOR ALL
  USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

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
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'is_read'
    ) THEN
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id;
    END IF;
  ELSE
    UPDATE conversations
    SET user2_last_read_at = NOW(),
        user2_unread_count = 0
    WHERE id = p_conversation_id;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'is_read'
    ) THEN
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'updated_at'
  ) THEN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  
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

