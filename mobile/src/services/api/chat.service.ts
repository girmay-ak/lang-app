import { createClient } from '../../../lib/supabase'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'voice' | 'image' | 'system'
  media_url?: string
  voice_duration?: number
  created_at: string
  is_read: boolean
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  user1_last_read_at: string | null
  user2_last_read_at: string | null
  unread_count_user1: number
  unread_count_user2: number
  created_at: string
  updated_at: string
  other_user?: {
    id: string
    full_name: string
    avatar_url: string | null
    is_online: boolean
  }
  last_message?: Message
}

export const chatService = {
  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      // Get conversations where user is user1 or user2
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          last_message:messages (
            id,
            content,
            message_type,
            created_at,
            sender_id
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Fetch other user info for each conversation
      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv: any) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
          
          const { data: otherUser } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, is_online')
            .eq('id', otherUserId)
            .single()

          return {
            ...conv,
            other_user: otherUser,
            last_message: conv.last_message?.[0] || null,
          }
        })
      )

      return conversationsWithUsers
    } catch (error) {
      console.error('[chatService] getConversations error:', error)
      return []
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[chatService] getMessages error:', error)
      return []
    }
  },

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'voice' | 'image' = 'text',
    mediaUrl?: string,
    voiceDuration?: number
  ): Promise<Message> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
      }

      if (mediaUrl) messageData.media_url = mediaUrl
      if (voiceDuration) messageData.voice_duration = voiceDuration

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return data
    } catch (error) {
      console.error('[chatService] sendMessage error:', error)
      throw error
    }
  },

  /**
   * Create or get existing conversation
   */
  async getOrCreateConversation(otherUserId: string): Promise<Conversation> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .single()

      if (existing) {
        return existing
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: otherUserId,
        })
        .select()
        .single()

      if (error) throw error
      return newConv
    } catch (error) {
      console.error('[chatService] getOrCreateConversation error:', error)
      throw error
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get conversation to determine which user we are
      const { data: conv } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single()

      if (!conv) return

      const isUser1 = conv.user1_id === user.id
      const updateField = isUser1 ? 'user1_last_read_at' : 'user2_last_read_at'

      await supabase
        .from('conversations')
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', conversationId)

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
    } catch (error) {
      console.error('[chatService] markAsRead error:', error)
    }
  },
}

