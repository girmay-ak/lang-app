-- =====================================================
-- CREATE SAMPLE CHAT DATA FOR TESTING
-- =====================================================
-- This script creates sample conversations and messages
-- for testing the chat functionality

-- First, ensure the conversations table has the required columns
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count_user1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_user2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON conversations FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert conversations they're part of" 
ON conversations FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own conversations" 
ON conversations FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
);

CREATE POLICY "Users can insert messages in their conversations" 
ON messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_id 
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
);

-- Function to create a sample conversation
CREATE OR REPLACE FUNCTION create_sample_conversation(
    p_user1_id UUID,
    p_user2_id UUID,
    p_last_message TEXT,
    p_unread_user1 INTEGER DEFAULT 0,
    p_unread_user2 INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    INSERT INTO conversations (
        user1_id,
        user2_id,
        last_message,
        last_message_at,
        unread_count_user1,
        unread_count_user2,
        user1_last_read_at,
        user2_last_read_at,
        created_at,
        updated_at
    ) VALUES (
        p_user1_id,
        p_user2_id,
        p_last_message,
        NOW() - (random() * interval '48 hours'),
        p_unread_user1,
        p_unread_user2,
        NOW() - (random() * interval '72 hours'),
        NOW() - (random() * interval '72 hours'),
        NOW() - (random() * interval '168 hours'),
        NOW() - (random() * interval '48 hours')
    )
    RETURNING id INTO v_conversation_id;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION add_sample_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_hours_ago NUMERIC DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        is_read,
        created_at
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_content,
        'text',
        CASE WHEN random() > 0.3 THEN true ELSE false END,
        NOW() - (p_hours_ago * interval '1 hour')
    )
    RETURNING id INTO v_message_id;
    
    -- Update conversation last message
    UPDATE conversations 
    SET 
        last_message = p_content,
        last_message_at = NOW() - (p_hours_ago * interval '1 hour'),
        updated_at = NOW() - (p_hours_ago * interval '1 hour')
    WHERE id = p_conversation_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Print instructions
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Sample Chat Data Script Loaded';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'To create sample conversations, run:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Get your user ID:';
    RAISE NOTICE '   SELECT id, email, full_name FROM users WHERE email = ''your@email.com'';';
    RAISE NOTICE '';
    RAISE NOTICE '2. Get another user ID for testing:';
    RAISE NOTICE '   SELECT id, email, full_name FROM users LIMIT 5;';
    RAISE NOTICE '';
    RAISE NOTICE '3. Create a conversation:';
    RAISE NOTICE '   SELECT create_sample_conversation(';
    RAISE NOTICE '       ''YOUR_USER_ID'',';
    RAISE NOTICE '       ''OTHER_USER_ID'',';
    RAISE NOTICE '       ''Hey! Want to practice some Spanish?'',';
    RAISE NOTICE '       2, -- unread count for user1';
    RAISE NOTICE '       0  -- unread count for user2';
    RAISE NOTICE '   );';
    RAISE NOTICE '';
    RAISE NOTICE '4. Add messages to the conversation:';
    RAISE NOTICE '   SELECT add_sample_message(';
    RAISE NOTICE '       ''CONVERSATION_ID'',';
    RAISE NOTICE '       ''SENDER_USER_ID'',';
    RAISE NOTICE '       ''Want to grab coffee at Café Esperanto later today?'',';
    RAISE NOTICE '       2 -- hours ago';
    RAISE NOTICE '   );';
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
END $$;

