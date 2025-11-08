import { createClient } from '../../../lib/supabase'

export const storageService = {
  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    try {
      const supabase = createClient()

      // Convert image URI to blob
      const response = await fetch(imageUri)
      const blob = await response.blob()

      // Upload to Supabase Storage
      const fileExt = imageUri.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('[storageService] uploadAvatar error:', error)
      throw error
    }
  },

  /**
   * Upload chat image
   */
  async uploadChatImage(
    conversationId: string,
    imageUri: string
  ): Promise<string> {
    try {
      const supabase = createClient()

      const response = await fetch(imageUri)
      const blob = await response.blob()

      const fileExt = imageUri.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${conversationId}/${timestamp}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, blob, {
          cacheControl: '3600',
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('[storageService] uploadChatImage error:', error)
      throw error
    }
  },

  /**
   * Upload voice message
   */
  async uploadVoiceMessage(
    conversationId: string,
    audioUri: string
  ): Promise<string> {
    try {
      const supabase = createClient()

      const response = await fetch(audioUri)
      const blob = await response.blob()

      const timestamp = Date.now()
      const fileName = `${conversationId}/${timestamp}.m4a`
      const filePath = `voice-messages/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(filePath, blob, {
          cacheControl: '3600',
          contentType: 'audio/m4a',
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('[storageService] uploadVoiceMessage error:', error)
      throw error
    }
  },

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase.storage.from(bucket).remove([path])
      if (error) throw error
    } catch (error) {
      console.error('[storageService] deleteFile error:', error)
      throw error
    }
  },
}

