import { createClient } from '../../../lib/supabase'

export interface User {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  availability_status: 'available' | 'busy' | 'offline'
  is_online: boolean
  last_active_at: string | null
  languages_speak?: string[]
  languages_learn?: string[]
}

export interface UserLanguage {
  id: string
  user_id: string
  language_code: string
  language_type: 'native' | 'learning'
  proficiency_level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'native'
}

export const userService = {
  /**
   * Get current authenticated user with full profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) return null

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          bio,
          city,
          latitude,
          longitude,
          availability_status,
          is_online,
          last_active_at,
          user_languages (
            language_code,
            language_type,
            proficiency_level
          )
        `)
        .eq('id', authUser.id)
        .single()

      if (error) throw error

      // Transform user_languages into separate arrays
      const languages_speak = data.user_languages
        ?.filter((ul: UserLanguage) => ul.language_type === 'native')
        .map((ul: UserLanguage) => ul.language_code) || []

      const languages_learn = data.user_languages
        ?.filter((ul: UserLanguage) => ul.language_type === 'learning')
        .map((ul: UserLanguage) => ul.language_code) || []

      return {
        ...data,
        languages_speak,
        languages_learn,
      }
    } catch (error) {
      console.error('[userService] getCurrentUser error:', error)
      throw error
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          bio,
          city,
          latitude,
          longitude,
          availability_status,
          is_online,
          last_active_at,
          user_languages (
            language_code,
            language_type,
            proficiency_level
          )
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      const languages_speak = data.user_languages
        ?.filter((ul: UserLanguage) => ul.language_type === 'native')
        .map((ul: UserLanguage) => ul.language_code) || []

      const languages_learn = data.user_languages
        ?.filter((ul: UserLanguage) => ul.language_type === 'learning')
        .map((ul: UserLanguage) => ul.language_code) || []

      return {
        ...data,
        languages_speak,
        languages_learn,
      }
    } catch (error) {
      console.error('[userService] getUserById error:', error)
      throw error
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[userService] updateProfile error:', error)
      throw error
    }
  },

  /**
   * Update user location
   */
  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          latitude,
          longitude,
          location_updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('[userService] updateLocation error:', error)
      throw error
    }
  },

  /**
   * Update availability status
   */
  async updateAvailability(
    userId: string,
    status: 'available' | 'busy' | 'offline',
    duration?: number
  ): Promise<void> {
    try {
      const supabase = createClient()
      const updates: any = {
        availability_status: status,
        last_active_at: new Date().toISOString(),
      }

      if (status === 'available' && duration) {
        // Calculate expiration time
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + duration)
        updates.availability_expires_at = expiresAt.toISOString()
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('[userService] updateAvailability error:', error)
      throw error
    }
  },

  /**
   * Update user languages
   */
  async updateLanguages(
    userId: string,
    languages: {
      native?: string[]
      learning?: string[]
    }
  ): Promise<void> {
    try {
      const supabase = createClient()

      // Delete existing languages
      await supabase
        .from('user_languages')
        .delete()
        .eq('user_id', userId)

      // Insert new languages
      const toInsert: any[] = []

      if (languages.native) {
        languages.native.forEach((code) => {
          toInsert.push({
            user_id: userId,
            language_code: code,
            language_type: 'native',
            proficiency_level: 'native',
          })
        })
      }

      if (languages.learning) {
        languages.learning.forEach((code) => {
          toInsert.push({
            user_id: userId,
            language_code: code,
            language_type: 'learning',
            proficiency_level: 'beginner',
          })
        })
      }

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('user_languages')
          .insert(toInsert)

        if (error) throw error
      }
    } catch (error) {
      console.error('[userService] updateLanguages error:', error)
      throw error
    }
  },
}

