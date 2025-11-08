import { createClient } from '../../../lib/supabase'

export interface Notification {
  id: string
  user_id: string
  type: 'message' | 'friend_request' | 'like' | 'comment' | 'achievement' | 'challenge'
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[notificationService] getNotifications error:', error)
      return []
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('[notificationService] markAsRead error:', error)
      throw error
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('[notificationService] markAllAsRead error:', error)
      throw error
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('[notificationService] deleteNotification error:', error)
      throw error
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[notificationService] getUnreadCount error:', error)
      return 0
    }
  },
}

