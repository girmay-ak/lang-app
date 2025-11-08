import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// Get environment variables from Expo Constants or process.env
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  ''

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  ''

let supabase: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Supabase configuration missing. Please set environment variables.')
  }

  if (supabase) return supabase

  supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  return supabase
}

export const getSupabaseClient = createClient



