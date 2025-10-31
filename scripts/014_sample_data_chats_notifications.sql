-- =====================================================
-- SAMPLE DATA FOR CHATS AND NOTIFICATIONS
-- =====================================================
-- This script creates sample conversations, messages, and notifications
-- for testing the chat and notification features

-- Note: This assumes you have at least one user in the database
-- The script uses the first user it finds as the current user
-- You may need to adjust user IDs to match your actual users

-- =====================================================
-- 1. PREPARE: Ensure conversations and messages tables exist
-- =====================================================
-- These tables should already exist from previous scripts.
-- If not, make sure to run scripts/005_realtime_chat_system.sql first

-- =====================================================
-- 2. INSERT SAMPLE CONVERSATIONS AND MESSAGES
-- =====================================================
-- Get the current user (first user in the database)
DO $$
DECLARE
  current_user_id UUID;
  user2_id UUID;
  user3_id UUID;
  user4_id UUID;
  user5_id UUID;
  conv1_id UUID;
  conv2_id UUID;
  conv3_id UUID;
  conv4_id UUID;
  msg_id UUID;
BEGIN
  -- Get the current user (you can replace this with a specific user ID)
  SELECT id INTO current_user_id FROM users ORDER BY created_at LIMIT 1;
  
  -- If no users exist, exit
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user first.';
    RETURN;
  END IF;
  
  -- Create or get sample users for conversations
  -- Check if we have at least 5 users, otherwise we'll create conversations with the same user
  SELECT COUNT(*) INTO user2_id FROM users WHERE id != current_user_id LIMIT 1;
  
  -- Get other users for conversations (or use the same user if only one exists)
  SELECT id INTO user2_id FROM users WHERE id != current_user_id ORDER BY created_at LIMIT 1;
  SELECT id INTO user3_id FROM users WHERE id != current_user_id AND id != COALESCE(user2_id, current_user_id) ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO user4_id FROM users WHERE id != current_user_id AND id != COALESCE(user2_id, current_user_id) AND id != COALESCE(user3_id, current_user_id) ORDER BY created_at OFFSET 2 LIMIT 1;
  SELECT id INTO user5_id FROM users WHERE id != current_user_id AND id != COALESCE(user2_id, current_user_id) AND id != COALESCE(user3_id, current_user_id) AND id != COALESCE(user4_id, current_user_id) ORDER BY created_at OFFSET 3 LIMIT 1;
  
  -- Use current user as fallback if we don't have enough users
  user2_id := COALESCE(user2_id, current_user_id);
  user3_id := COALESCE(user3_id, current_user_id);
  user4_id := COALESCE(user4_id, current_user_id);
  user5_id := COALESCE(user5_id, current_user_id);
  
  -- Create conversation 1: Peter Orlický
  INSERT INTO conversations (user1_id, user2_id, last_message, last_message_at, user2_unread_count)
  VALUES (current_user_id, user2_id, 'Great! Let''s practice German tomorrow at 3pm...', NOW() - INTERVAL '45 minutes', 1)
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET
    last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at,
    user2_unread_count = EXCLUDED.user2_unread_count
  RETURNING id INTO conv1_id;
  
  -- Get conversation ID if it already existed
  IF conv1_id IS NULL THEN
    SELECT id INTO conv1_id FROM conversations WHERE (user1_id = current_user_id AND user2_id = user2_id) OR (user1_id = user2_id AND user2_id = current_user_id) LIMIT 1;
  END IF;
  
  -- Add messages to conversation 1
  INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
    (conv1_id, user2_id, 'Hi! I saw you''re learning German. Want to practice together?', NOW() - INTERVAL '2 hours'),
    (conv1_id, current_user_id, 'Yes, that sounds great! When are you available?', NOW() - INTERVAL '1 hour 50 minutes'),
    (conv1_id, user2_id, 'I''m free tomorrow afternoon. How about 3pm?', NOW() - INTERVAL '1 hour 30 minutes'),
    (conv1_id, current_user_id, 'Perfect! Let''s meet at the café downtown.', NOW() - INTERVAL '1 hour'),
    (conv1_id, user2_id, 'Great! Let''s practice German tomorrow at 3pm...', NOW() - INTERVAL '45 minutes')
  ON CONFLICT DO NOTHING;
  
  -- Create conversation 2: Jovana Rikalo
  INSERT INTO conversations (user1_id, user2_id, last_message, last_message_at, user2_unread_count)
  VALUES (current_user_id, user3_id, 'Thanks for the Spanish lesson! Same time next week?', NOW() - INTERVAL '33 minutes', 0)
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET
    last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at
  RETURNING id INTO conv2_id;
  
  IF conv2_id IS NULL THEN
    SELECT id INTO conv2_id FROM conversations WHERE (user1_id = current_user_id AND user2_id = user3_id) OR (user1_id = user3_id AND user2_id = current_user_id) LIMIT 1;
  END IF;
  
  INSERT INTO messages (conversation_id, sender_id, content, created_at, is_read) VALUES
    (conv2_id, user3_id, 'Thanks for the Spanish lesson! Same time next week?', NOW() - INTERVAL '33 minutes', true)
  ON CONFLICT DO NOTHING;
  
  -- Create conversation 3: Carsten Meyerdierks
  INSERT INTO conversations (user1_id, user2_id, last_message, last_message_at, user2_unread_count)
  VALUES (current_user_id, user4_id, 'Can you help me with French pronunciation?', NOW() - INTERVAL '15 minutes', 1)
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET
    last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at,
    user2_unread_count = EXCLUDED.user2_unread_count
  RETURNING id INTO conv3_id;
  
  IF conv3_id IS NULL THEN
    SELECT id INTO conv3_id FROM conversations WHERE (user1_id = current_user_id AND user2_id = user4_id) OR (user1_id = user4_id AND user2_id = current_user_id) LIMIT 1;
  END IF;
  
  INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
    (conv3_id, user4_id, 'Can you help me with French pronunciation?', NOW() - INTERVAL '15 minutes')
  ON CONFLICT DO NOTHING;
  
  -- Create conversation 4: Phila Broich
  INSERT INTO conversations (user1_id, user2_id, last_message, last_message_at, user2_unread_count)
  VALUES (current_user_id, user5_id, 'I''m free for Dutch practice this afternoon!', NOW() - INTERVAL '33 minutes', 0)
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET
    last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at
  RETURNING id INTO conv4_id;
  
  IF conv4_id IS NULL THEN
    SELECT id INTO conv4_id FROM conversations WHERE (user1_id = current_user_id AND user2_id = user5_id) OR (user1_id = user5_id AND user2_id = current_user_id) LIMIT 1;
  END IF;
  
  INSERT INTO messages (conversation_id, sender_id, content, created_at, is_read) VALUES
    (conv4_id, user5_id, 'I''m free for Dutch practice this afternoon!', NOW() - INTERVAL '33 minutes', true)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample conversations created successfully for user %', current_user_id;
END $$;

-- =====================================================
-- 3. INSERT SAMPLE NOTIFICATIONS
-- =====================================================
DO $$
DECLARE
  current_user_id UUID;
  other_user1_id UUID;
  other_user2_id UUID;
  other_user3_id UUID;
BEGIN
  -- Get the current user
  SELECT id INTO current_user_id FROM users ORDER BY created_at LIMIT 1;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No users found for notifications.';
    RETURN;
  END IF;
  
  -- Get other users for notifications
  SELECT id INTO other_user1_id FROM users WHERE id != current_user_id ORDER BY created_at LIMIT 1;
  SELECT id INTO other_user2_id FROM users WHERE id != current_user_id AND id != COALESCE(other_user1_id, current_user_id) ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO other_user3_id FROM users WHERE id != current_user_id AND id != COALESCE(other_user1_id, current_user_id) AND id != COALESCE(other_user2_id, current_user_id) ORDER BY created_at OFFSET 2 LIMIT 1;
  
  -- Use current user as fallback
  other_user1_id := COALESCE(other_user1_id, current_user_id);
  other_user2_id := COALESCE(other_user2_id, current_user_id);
  other_user3_id := COALESCE(other_user3_id, current_user_id);
  
  -- Insert sample notifications
  INSERT INTO notifications (user_id, notification_type, title, body, data, is_read, created_at) VALUES
    -- Likes notification
    (current_user_id, 'social_favorited', 'Sandra B. and 2,355 others loved your post', 'Sandra B. and Christian Wig loved your language practice post', 
     jsonb_build_object('users', ARRAY[other_user1_id, other_user2_id], 'type', 'likes'), false, NOW() - INTERVAL '54 seconds'),
    
    -- Comment notification
    (current_user_id, 'social_story_reply', 'Maria Garcia commented on your post', 'Maria Garcia commented: Look so cool! 😎', 
     jsonb_build_object('user_id', other_user1_id, 'type', 'comment', 'comment', 'Look so cool! 😎'), false, NOW() - INTERVAL '2 minutes'),
    
    -- Follow notification
    (current_user_id, 'social_friend_request', 'Peter Orlický started following you!', 'Peter Orlický wants to connect with you', 
     jsonb_build_object('user_id', other_user2_id, 'type', 'follow'), false, NOW() - INTERVAL '5 minutes'),
    
    -- Another comment
    (current_user_id, 'social_story_reply', 'Christian Wig commented on your post', 'Christian Wig commented: Awesome as always!', 
     jsonb_build_object('user_id', other_user3_id, 'type', 'comment', 'comment', 'Awesome as always!'), false, NOW() - INTERVAL '1 hour'),
    
    -- Older likes notification
    (current_user_id, 'social_favorited', 'Emma Wilson and 1,877 others loved your post', 'Emma Wilson and Lucas Chen loved your coffee meetup post', 
     jsonb_build_object('users', ARRAY[other_user1_id, other_user2_id], 'type', 'likes'), false, NOW() - INTERVAL '7 days'),
    
    -- Older comment
    (current_user_id, 'social_story_reply', 'Sophie Martin commented on your post', 'Sophie Martin commented: Loved this so much 😍', 
     jsonb_build_object('user_id', other_user3_id, 'type', 'comment', 'comment', 'Loved this so much 😍'), false, NOW() - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample notifications created successfully for user %', current_user_id;
END $$;

-- =====================================================
-- 4. UPDATE USER ONLINE STATUS (for chat indicators)
-- =====================================================
-- Mark some users as online
UPDATE users 
SET is_online = true, last_seen_at = NOW()
WHERE id IN (
  SELECT id FROM users WHERE id != (SELECT id FROM users ORDER BY created_at LIMIT 1)
  ORDER BY created_at LIMIT 2
);

-- =====================================================
-- 5. CREATE INDEXES IF THEY DON'T EXIST
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Sample data insertion complete!

