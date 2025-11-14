"use client"

import { createClient } from "@/lib/supabase/client"

export type ChatMessageType = "text" | "voice" | "image" | "system"

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: ChatMessageType
  media_url: string | null
  voice_duration: number | null
  created_at: string
  is_read: boolean
}

export interface ConversationRecord {
  id: string
  user1_id: string
  user2_id: string
  user1_last_read_at: string | null
  user2_last_read_at: string | null
  unread_count_user1: number | null
  unread_count_user2: number | null
  last_message: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface ConversationSummary {
  conversationId: string
  otherUserId: string
  name: string
  avatar: string | null
  online: boolean
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  isRequest?: boolean
}

export const chatService = {
  async getCurrentUserId(): Promise<string | null> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user?.id ?? null
  },

  async getConversations(): Promise<ConversationRecord[]> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (error) throw error

      return data ?? []
    } catch (error) {
      console.error("[chatService] getConversations error:", error)
      return []
    }
  },

  async getConversationWithOtherUser(otherUserId: string): Promise<ConversationRecord | null> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`,
        )
        .maybeSingle()

      if (error) throw error

      return conversation ?? null
    } catch (error) {
      console.error("[chatService] getConversationWithOtherUser error:", error)
      return null
    }
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error

      return data ?? []
    } catch (error) {
      console.error("[chatService] getMessages error:", error)
      return []
    }
  },

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: ChatMessageType = "text",
    mediaUrl?: string,
    voiceDuration?: number,
  ): Promise<ChatMessage> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be signed in to send messages.")
    }

    const payload: Record<string, any> = {
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: messageType,
    }

    if (mediaUrl) payload.media_url = mediaUrl
    if (voiceDuration) payload.voice_duration = voiceDuration

    const { data, error } = await supabase.from("messages").insert(payload).select().single()

    if (error) throw error

    await supabase
      .from("conversations")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    return data as ChatMessage
  },

  async markConversationRead(conversationId: string) {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: conversation } = await supabase
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .maybeSingle()

      if (!conversation) return

      const isUser1 = conversation.user1_id === user.id
      const readField = isUser1 ? "user1_last_read_at" : "user2_last_read_at"
      const unreadField = isUser1 ? "unread_count_user1" : "unread_count_user2"

      await supabase
        .from("conversations")
        .update({
          [readField]: new Date().toISOString(),
          [unreadField]: 0,
        })
        .eq("id", conversationId)

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
    } catch (error) {
      console.error("[chatService] markConversationRead error:", error)
    }
  },

  subscribeToMessages(conversationId: string, onMessage: (message: ChatMessage) => void) {
    const supabase = createClient()
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          onMessage(newMessage)
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[chatService] Subscribed to conversation", conversationId)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },

  async createOrGetConversation(otherUserId: string): Promise<ConversationRecord> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be signed in to start a conversation.")
    }

    if (otherUserId === user.id) {
      throw new Error("You can’t start a conversation with yourself.")
    }

    const existing = await this.getConversationWithOtherUser(otherUserId)
    if (existing) {
      return existing
    }

    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user1_id: user.id,
        user2_id: otherUserId,
        user1_last_read_at: nowIso,
        user2_last_read_at: null,
        unread_count_user1: 0,
        unread_count_user2: 0,
        last_message: null,
        last_message_at: null,
      })
      .select("*")
      .single()

    if (error) {
      console.error("[chatService] createOrGetConversation error:", error)
      throw error
    }

    return data as ConversationRecord
  },

  async getConversationPreview(conversationId: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be signed in to view conversations.")
    }

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        user1_id,
        user2_id,
        last_message,
        last_message_at,
        user1_unread_count,
        user2_unread_count,
        user1:users!conversations_user1_id_fkey(id, full_name, avatar_url, is_online),
        user2:users!conversations_user2_id_fkey(id, full_name, avatar_url, is_online)
      `,
      )
      .eq("id", conversationId)
      .maybeSingle()

    if (error) {
      console.error("[chatService] getConversationPreview error:", error)
      throw error
    }

    if (!data) return null

    const otherUserId = data.user1_id === user.id ? data.user2_id : data.user1_id
    const otherUser = data.user1_id === user.id ? data.user2 : data.user1
    const unreadCount = data.user1_id === user.id ? data.user1_unread_count : data.user2_unread_count

    return {
      id: data.id,
      otherUserId,
      name: otherUser?.full_name || "New Partner",
      avatar: otherUser?.avatar_url || "/placeholder-user.jpg",
      online: otherUser?.is_online ?? false,
      lastMessage: data.last_message,
      lastMessageAt: data.last_message_at,
      unreadCount: unreadCount ?? 0,
    }
  },

  async getConversationSummaries(): Promise<ConversationSummary[]> {
    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("[chatService] Auth error:", authError)
        return []
      }

      if (!user) {
        console.log("[chatService] No authenticated user")
        return []
      }

      console.log("[chatService] Fetching conversations for user:", user.id)

      // First, try a simple query to check if the table exists
      const { data: simpleData, error: simpleError } = await supabase
        .from("conversations")
        .select("id, user1_id, user2_id, last_message, last_message_at, updated_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })
        .limit(10)

      if (simpleError) {
        console.error("[chatService] Simple query error:", {
          message: simpleError.message,
          details: simpleError.details,
          hint: simpleError.hint,
          code: simpleError.code,
        })
        return []
      }

      console.log("[chatService] Found conversations:", simpleData?.length ?? 0)

      if (!simpleData || simpleData.length === 0) {
        return []
      }

      // Now try the full query with joins
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at,
          unread_count_user1,
          unread_count_user2,
          user1:users!conversations_user1_id_fkey(id, full_name, avatar_url, is_online),
          user2:users!conversations_user2_id_fkey(id, full_name, avatar_url, is_online)
        `,
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("[chatService] Full query error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        // Fall back to simple data without user info
        return simpleData.map((record: any) => ({
          conversationId: record.id,
          otherUserId: record.user1_id === user.id ? record.user2_id : record.user1_id,
          name: "Language Partner",
          avatar: null,
          online: false,
          lastMessage: record.last_message,
          lastMessageAt: record.last_message_at,
          unreadCount: 0,
          isRequest: false,
        }))
      }

      return (data ?? []).map((record: any) => {
        const isUser1 = record.user1_id === user.id
        const otherUser = isUser1 ? record.user2 : record.user1
        const unreadCount = isUser1 ? record.unread_count_user1 : record.unread_count_user2

        return {
          conversationId: record.id,
          otherUserId: otherUser?.id ?? (isUser1 ? record.user2_id : record.user1_id),
          name: otherUser?.full_name ?? "Language Partner",
          avatar: otherUser?.avatar_url ?? null,
          online: Boolean(otherUser?.is_online),
          lastMessage: record.last_message,
          lastMessageAt: record.last_message_at,
          unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
          isRequest: false,
        } satisfies ConversationSummary
      })
    } catch (error) {
      console.error("[chatService] getConversationSummaries error:", error)
      if (error instanceof Error) {
        console.error("[chatService] Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }
      return []
    }
  },
}


