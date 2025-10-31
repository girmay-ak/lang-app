-- =====================================================
-- REAL-TIME CHAT SYSTEM FOR LANGUAGE EXCHANGE APP
-- =====================================================
-- This script creates a complete real-time chat system with:
-- - Message types (text, voice, image, system)
-- - Typing indicators
-- - Read receipts
-- - Message reactions
-- - Online/offline status
-- - Unread counts
-- - Performance optimizations

-- =====================================================
-- 1. DROP EXISTING TABLES (if recreating)
-- =====================================================

DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS user_blocks CASCADE;

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Update conversations table with more fields
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count_user1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_user2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user1_typing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user2_typing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user1_last_read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user2_last_read_at TIMESTAMP WITH TIME ZONE;

-- Update messages table with more fields
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'system')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS voice_duration INTEGER, -- in seconds
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);

-- Update users table for online status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 3. CREATE NEW TABLES
-- =====================================================

-- User blocks table (prevent messaging blocked users)
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Message reads table (track who read what)
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Message reactions table (like, love, etc.)
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Typing indicators table (temporary state)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted) WHERE is_deleted = FALSE;

-- Message reads indexes
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- Message reactions indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- User blocks indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated ON typing_indicators(updated_at);

-- Users online status index
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online) WHERE is_online = TRUE;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Message reads policies
DROP POLICY IF EXISTS "Users can view message reads" ON message_reads;
CREATE POLICY "Users can view message reads" ON message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_reads.message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can mark messages as read" ON message_reads;
CREATE POLICY "Users can mark messages as read" ON message_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Message reactions policies
DROP POLICY IF EXISTS "Users can view reactions" ON message_reactions;
CREATE POLICY "Users can view reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_reactions.message_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON message_reactions;
CREATE POLICY "Users can remove their reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Typing indicators policies
DROP POLICY IF EXISTS "Users can view typing indicators" ON typing_indicators;
CREATE POLICY "Users can view typing indicators" ON typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = typing_indicators.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their typing status" ON typing_indicators;
CREATE POLICY "Users can update their typing status" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- User blocks policies
DROP POLICY IF EXISTS "Users can view their blocks" ON user_blocks;
CREATE POLICY "Users can view their blocks" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON user_blocks;
CREATE POLICY "Users can block others" ON user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON user_blocks;
CREATE POLICY "Users can unblock others" ON user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating last message
DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Determine recipient
  SELECT CASE 
    WHEN user1_id = NEW.sender_id THEN user2_id
    ELSE user1_id
  END INTO recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Increment unread count for recipient
  UPDATE conversations
  SET 
    unread_count_user1 = CASE WHEN user1_id = recipient_id THEN unread_count_user1 + 1 ELSE unread_count_user1 END,
    unread_count_user2 = CASE WHEN user2_id = recipient_id THEN unread_count_user2 + 1 ELSE unread_count_user2 END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for incrementing unread count
DROP TRIGGER IF EXISTS trigger_increment_unread ON messages;
CREATE TRIGGER trigger_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Function to mark messages as read and reset unread count
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update conversation unread count
  UPDATE conversations
  SET 
    unread_count_user1 = CASE WHEN user1_id = p_user_id THEN 0 ELSE unread_count_user1 END,
    unread_count_user2 = CASE WHEN user2_id = p_user_id THEN 0 ELSE unread_count_user2 END,
    user1_last_read_at = CASE WHEN user1_id = p_user_id THEN NOW() ELSE user1_last_read_at END,
    user2_last_read_at = CASE WHEN user2_id = p_user_id THEN NOW() ELSE user2_last_read_at END
  WHERE id = p_conversation_id;
  
  -- Insert read receipts for unread messages
  INSERT INTO message_reads (message_id, user_id)
  SELECT m.id, p_user_id
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_reads mr 
      WHERE mr.message_id = m.id AND mr.user_id = p_user_id
    )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS VOID AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user online status
CREATE OR REPLACE FUNCTION update_user_online_status(
  p_user_id UUID,
  p_is_online BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET 
    is_online = p_is_online,
    last_seen_at = CASE WHEN p_is_online = FALSE THEN NOW() ELSE last_seen_at END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get chat list with last message and unread count
CREATE OR REPLACE FUNCTION get_user_chat_list(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  other_user_online BOOLEAN,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  is_typing BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    CASE WHEN c.user1_id = p_user_id THEN c.user2_id ELSE c.user1_id END AS other_user_id,
    u.full_name AS other_user_name,
    u.avatar_url AS other_user_avatar,
    u.is_online AS other_user_online,
    c.last_message,
    c.last_message_at,
    CASE WHEN c.user1_id = p_user_id THEN c.unread_count_user1 ELSE c.unread_count_user2 END AS unread_count,
    CASE WHEN c.user1_id = p_user_id THEN c.user2_typing ELSE c.user1_typing END AS is_typing
  FROM conversations c
  JOIN users u ON u.id = CASE WHEN c.user1_id = p_user_id THEN c.user2_id ELSE c.user1_id END
  WHERE c.user1_id = p_user_id OR c.user2_id = p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = p_user_id AND blocked_id = p_other_user_id)
       OR (blocker_id = p_other_user_id AND blocked_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. REALTIME PUBLICATION
-- =====================================================

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_reads TO authenticated;
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON user_blocks TO authenticated;
