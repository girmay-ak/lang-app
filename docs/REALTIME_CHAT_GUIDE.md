# Real-Time Chat System Guide

## Overview

This guide explains how to use the real-time chat system built with Supabase Realtime.

## Features

- **Message Types**: Text, voice, image, and system messages
- **Real-time Updates**: Messages appear instantly using Supabase Realtime
- **Typing Indicators**: See when someone is typing
- **Read Receipts**: Track when messages are read
- **Message Reactions**: Like, love, and other reactions
- **Online Status**: See who's online
- **Unread Counts**: Track unread messages per conversation
- **Message Deletion**: Soft delete messages
- **Pagination**: Load messages in batches of 50

## Database Schema

### Tables

1. **conversations** - Stores conversation metadata
2. **messages** - Stores all messages
3. **message_reads** - Tracks read receipts
4. **message_reactions** - Stores message reactions
5. **typing_indicators** - Temporary typing state
6. **user_blocks** - Prevents messaging blocked users

### Key Functions

- `get_user_chat_list(user_id)` - Get all conversations with metadata
- `mark_conversation_as_read(conversation_id, user_id)` - Mark messages as read
- `update_user_online_status(user_id, is_online)` - Update online status
- `is_user_blocked(user_id, other_user_id)` - Check if users are blocked

## Usage Examples

### 1. Load Chat List

\`\`\`typescript
import { getChatList } from '@/lib/supabase/chat'

const chatList = await getChatList(userId)
\`\`\`

### 2. Send a Message

\`\`\`typescript
import { sendMessage } from '@/lib/supabase/chat'

await sendMessage(
  conversationId,
  senderId,
  'Hello!',
  'text'
)
\`\`\`

### 3. Subscribe to New Messages

\`\`\`typescript
import { subscribeToMessages } from '@/lib/supabase/chat'

const channel = subscribeToMessages(conversationId, (message) => {
  console.log('New message:', message)
  // Update UI with new message
})

// Cleanup when done
channel.unsubscribe()
\`\`\`

### 4. Show Typing Indicator

\`\`\`typescript
import { setTypingIndicator, subscribeToTyping } from '@/lib/supabase/chat'

// Set typing status
await setTypingIndicator(conversationId, userId, true)

// Subscribe to typing changes
const channel = subscribeToTyping(conversationId, (userId, isTyping) => {
  console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`)
})
\`\`\`

### 5. Mark Messages as Read

\`\`\`typescript
import { markConversationAsRead } from '@/lib/supabase/chat'

await markConversationAsRead(conversationId, userId)
\`\`\`

### 6. Add Message Reaction

\`\`\`typescript
import { addMessageReaction } from '@/lib/supabase/chat'

await addMessageReaction(messageId, userId, 'like')
\`\`\`

## Performance Optimization

### Pagination

Messages are loaded in batches of 50:

\`\`\`typescript
import { loadMessages } from '@/lib/supabase/chat'

// Load first 50 messages
const messages = await loadMessages(conversationId, 50)

// Load next 50 before oldest message
const olderMessages = await loadMessages(
  conversationId,
  50,
  messages[0].created_at
)
\`\`\`

### Indexes

The system includes optimized indexes for:
- Fast conversation lookups by user
- Efficient message queries by conversation
- Quick unread count calculations
- Fast typing indicator cleanup

### Cleanup

Old typing indicators (>10 seconds) are automatically cleaned up.

## Security

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only see their own conversations
- Users can only send messages in their conversations
- Users can only read messages they're part of
- Blocked users cannot message each other

### Rate Limiting

Consider implementing rate limiting on:
- Message sending (e.g., 10 messages per minute)
- Typing indicator updates (e.g., once per second)
- Image uploads (e.g., 5 per minute)

## Real-time Subscriptions

### Best Practices

1. **Subscribe on mount, unsubscribe on unmount**
\`\`\`typescript
useEffect(() => {
  const channel = subscribeToMessages(conversationId, handleNewMessage)
  return () => channel.unsubscribe()
}, [conversationId])
\`\`\`

2. **Limit active subscriptions**
   - Only subscribe to the active conversation
   - Unsubscribe when switching conversations

3. **Handle connection errors**
\`\`\`typescript
channel.on('system', {}, (payload) => {
  if (payload.status === 'error') {
    console.error('Realtime error:', payload)
  }
})
\`\`\`

## Testing Checklist

- [ ] Send text message
- [ ] Send voice message (with URL)
- [ ] Send image message (with URL)
- [ ] Receive messages in real-time
- [ ] Typing indicators work
- [ ] Read receipts update
- [ ] Unread counts are accurate
- [ ] Message reactions work
- [ ] Online status updates
- [ ] Pagination loads older messages
- [ ] Blocked users cannot message
- [ ] Messages can be deleted
- [ ] Subscriptions cleanup properly

## Common Queries

### Get unread message count

\`\`\`sql
SELECT 
  CASE WHEN user1_id = $1 THEN unread_count_user1 
       ELSE unread_count_user2 
  END as unread_count
FROM conversations
WHERE id = $2;
\`\`\`

### Search messages

\`\`\`sql
SELECT * FROM messages
WHERE conversation_id = $1
  AND content ILIKE '%' || $2 || '%'
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 50;
\`\`\`

### Get message reactions

\`\`\`sql
SELECT 
  reaction_type,
  COUNT(*) as count,
  ARRAY_AGG(user_id) as user_ids
FROM message_reactions
WHERE message_id = $1
GROUP BY reaction_type;
