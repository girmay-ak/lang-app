import { createClient } from '../../../lib/supabase'

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  full_name: string
  phone?: string
}

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error
    return data
  },

  /**
   * Sign up new user
   */
  async signUp(credentials: SignUpCredentials) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.full_name,
          phone: credentials.phone,
        },
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'langexchange://reset-password',
    })
    if (error) throw error
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  },
}

