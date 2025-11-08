"use client"

import { createClient } from "@/lib/supabase/client"

export interface UserRecord {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  availability_status: "available" | "busy" | "offline" | null
  is_online: boolean | null
  last_active_at: string | null
  languages_speak?: string[]
  languages_learn?: string[]
}

interface UserLanguageRow {
  language_code: string
  language_type: "native" | "learning"
  proficiency_level: "beginner" | "elementary" | "intermediate" | "advanced" | "native"
}

export const userService = {
  async getCurrentUser(): Promise<UserRecord | null> {
    const supabase = createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[userService] auth.getUser error:", authError)
      throw authError
    }

    if (!authUser) return null

    const { data, error } = await supabase
      .from("users")
      .select(
        `
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
        `,
      )
      .eq("id", authUser.id)
      .single()

    if (error) {
      console.error("[userService] getCurrentUser error:", error)
      throw error
    }

    const languages_speak =
      data?.user_languages
        ?.filter((ul: UserLanguageRow) => ul.language_type === "native")
        .map((ul: UserLanguageRow) => ul.language_code) ?? []

    const languages_learn =
      data?.user_languages
        ?.filter((ul: UserLanguageRow) => ul.language_type === "learning")
        .map((ul: UserLanguageRow) => ul.language_code) ?? []

    return {
      ...data,
      languages_speak,
      languages_learn,
    }
  },

  async updateLocation(userId: string, latitude: number, longitude: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("users")
      .update({
        latitude,
        longitude,
        location_updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("[userService] updateLocation error:", error)
      throw error
    }
  },
}


