import { createBrowserClient } from "./client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: "text" | "voice" | "image" | "system"
  media_url: string | null
  voice_duration: number | null
  is_deleted: boolean
  created_at: string
  reply_to_id: string | null
  sender?: {
    id: string
    full_name: string
    avatar_url: string
  }
  reactions?: MessageReaction[]
  is_read?: boolean
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message: string | null
  last_message_at: string | null
  unread_count_user1: number
  unread_count_user2: number
  user1_typing: boolean
  user2_typing: boolean
  other_user?: {
    id: string
    full_name: string
    avatar_url: string
    is_online: boolean
    last_seen_at: string
  }
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  reaction_type: "like" | "love" | "laugh" | "wow" | "sad" | "angry"
  created_at: string
}

export interface ChatListItem {
  conversation_id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string
  other_user_online: boolean
  last_message: string
  last_message_at: string
  unread_count: number
  is_typing: boolean
}

/**
 * Get all conversations for the current user
 */
export async function getChatList(userId: string): Promise<ChatListItem[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("get_user_chat_list", { p_user_id: userId })

  if (error) {
    console.error("[v0] Error fetching chat list:", error)
    throw error
  }

  return data || []
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  const supabase = createBrowserClient()

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
    .single()

  if (existing) {
    return existing.id
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      user1_id: userId,
      user2_id: otherUserId,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[v0] Error creating conversation:", error)
    throw error
  }

  return newConv.id
}

/**
 * Load messages for a conversation with pagination
 */
export async function loadMessages(conversationId: string, limit = 50, before?: string): Promise<Message[]> {
  const supabase = createBrowserClient()

  let query = supabase
    .from("messages")
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url)
    `)
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt("created_at", before)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error loading messages:", error)
    throw error
  }

  // Reverse to show oldest first
  return (data || []).reverse()
}

/**
 * Send a new message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: "text" | "voice" | "image" = "text",
  mediaUrl?: string,
  voiceDuration?: number,
): Promise<Message> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      voice_duration: voiceDuration,
    })
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error("[v0] Error sending message:", error)
    throw error
  }

  return data
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase.rpc("mark_conversation_as_read", {
    p_conversation_id: conversationId,
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error marking conversation as read:", error)
    throw error
  }
}

/**
 * Set typing indicator
 */
export async function setTypingIndicator(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
  const supabase = createBrowserClient()

  if (isTyping) {
    await supabase.from("typing_indicators").upsert({
      conversation_id: conversationId,
      user_id: userId,
      is_typing: true,
      updated_at: new Date().toISOString(),
    })
  } else {
    await supabase.from("typing_indicators").delete().eq("conversation_id", conversationId).eq("user_id", userId)
  }
}

/**
 * Add reaction to message
 */
export async function addMessageReaction(
  messageId: string,
  userId: string,
  reactionType: MessageReaction["reaction_type"],
): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase.from("message_reactions").insert({
    message_id: messageId,
    user_id: userId,
    reaction_type: reactionType,
  })

  if (error) {
    console.error("[v0] Error adding reaction:", error)
    throw error
  }
}

/**
 * Remove reaction from message
 */
export async function removeMessageReaction(
  messageId: string,
  userId: string,
  reactionType: MessageReaction["reaction_type"],
): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType)

  if (error) {
    console.error("[v0] Error removing reaction:", error)
    throw error
  }
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from("messages")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      content: null,
      media_url: null,
    })
    .eq("id", messageId)

  if (error) {
    console.error("[v0] Error deleting message:", error)
    throw error
  }
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(conversationId: string, onMessage: (message: Message) => void): RealtimeChannel {
  const supabase = createBrowserClient()

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch full message with sender info
        const { data } = await supabase
          .from("messages")
          .select(`
            *,
            sender:users!sender_id(id, full_name, avatar_url)
          `)
          .eq("id", payload.new.id)
          .single()

        if (data) {
          onMessage(data)
        }
      },
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTyping(
  conversationId: string,
  onTypingChange: (userId: string, isTyping: boolean) => void,
): RealtimeChannel {
  const supabase = createBrowserClient()

  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "typing_indicators",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          onTypingChange(payload.new.user_id, payload.new.is_typing)
        } else if (payload.eventType === "DELETE") {
          onTypingChange(payload.old.user_id, false)
        }
      },
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to conversation updates (for chat list)
 */
export function subscribeToConversations(userId: string, onUpdate: () => void): RealtimeChannel {
  const supabase = createBrowserClient()

  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`,
      },
      () => {
        onUpdate()
      },
    )
    .subscribe()

  return channel
}

/**
 * Update user online status
 */
export async function updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase.rpc("update_user_online_status", {
    p_user_id: userId,
    p_is_online: isOnline,
  })

  if (error) {
    console.error("[v0] Error updating online status:", error)
  }
}
