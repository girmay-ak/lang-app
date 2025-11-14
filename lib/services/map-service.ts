"use client"

import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { UserLanguageRecord, UserRecord } from "@/lib/services/user-service"

export interface NearbyUser extends UserRecord {
  distance?: number
  distanceFormatted?: string
}

interface FindNearbyFilters {
  availableNow?: boolean
  languages?: string[]
  skillLevel?: string[]
}

const toRad = (degrees: number) => degrees * (Math.PI / 180)

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatDistance = (km: number): string => {
  if (Number.isNaN(km)) return "—"
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

const applyFilters = (users: NearbyUser[], filters?: FindNearbyFilters) => {
  let filtered = users

  if (filters?.availableNow) {
    filtered = filtered.filter((u) => u.availability_status === "available")
  }

  if (filters?.languages?.length) {
    filtered = filtered.filter((u) => {
      const userLanguages = [...(u.languages_speak ?? []), ...(u.languages_learn ?? [])]
      return filters.languages!.some((lang) => userLanguages.includes(lang))
    })
  }

  if (filters?.skillLevel?.length) {
    filtered = filtered.filter((u) => {
      const languageRows = (u as any).user_languages ?? []
      return languageRows.some((row: any) => filters.skillLevel!.includes(row.proficiency_level))
    })
  }

  return filtered
}

const hydrateUserLanguages = async (supabase: SupabaseClient, users: NearbyUser[]): Promise<NearbyUser[]> => {
  if (!users.length) {
    return users
  }

  const usersNeedingLanguages = users.filter((user) => {
    const languageRows = (user as any).user_languages as UserLanguageRecord[] | undefined
    const hasLanguageRows = Array.isArray(languageRows) && languageRows.length > 0
    const hasLanguageArrays =
      (Array.isArray(user.languages_speak) && user.languages_speak.length > 0) ||
      (Array.isArray(user.languages_learn) && user.languages_learn.length > 0)
    return !hasLanguageRows || !hasLanguageArrays
  })

  if (usersNeedingLanguages.length === 0) {
    return users
  }

  const userIds = usersNeedingLanguages.map((user) => user.id)
  if (userIds.length === 0) {
    return users
  }

  const { data, error } = await supabase
    .from("user_languages")
    .select("user_id, language_code, language_type, proficiency_level")
    .in("user_id", userIds)

  if (error) {
    console.warn("[mapService] hydrateUserLanguages error:", error)
    return users
  }

  const grouped = new Map<string, UserLanguageRecord[]>()
  for (const row of data ?? []) {
    if (!row?.user_id) continue
    const existing = grouped.get(row.user_id) ?? []
    existing.push({
      user_id: row.user_id,
      language_code: row.language_code,
      language_type: row.language_type as UserLanguageRecord["language_type"],
      proficiency_level: row.proficiency_level,
    })
    grouped.set(row.user_id, existing)
  }

  if (grouped.size === 0) {
    return users
  }

  return users.map((user) => {
    const languageRows = grouped.get(user.id)
    if (!languageRows?.length) {
      return user
    }

    const languages_speak = languageRows
      .filter((row) => row.language_type === "native")
      .map((row) => row.language_code)
    const languages_learn = languageRows
      .filter((row) => row.language_type === "learning")
      .map((row) => row.language_code)

    return {
      ...user,
      user_languages: languageRows,
      languages_speak: languages_speak.length ? languages_speak : user.languages_speak ?? [],
      languages_learn: languages_learn.length ? languages_learn : user.languages_learn ?? [],
    }
  })
}

export const mapService = {
  async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    filters?: FindNearbyFilters,
  ): Promise<NearbyUser[]> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.rpc("find_nearby_users", {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm,
      })

      if (error) {
        console.warn("[mapService] find_nearby_users RPC unavailable, falling back to query.", error)
        return this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
      }

      const rawRpcUsers = Array.isArray(data) ? data : []
      const fallbackUsers = await this.findNearbyUsersFallback(latitude, longitude, radiusKm)
      if (!fallbackUsers.length) {
        const hydratedRpcUsers = await hydrateUserLanguages(supabase, rawRpcUsers)
        return applyFilters(hydratedRpcUsers, filters)
      }

      const merged = new Map<string, NearbyUser>()
      for (const user of [...rawRpcUsers, ...fallbackUsers]) {
        merged.set(user.id, { ...merged.get(user.id), ...user })
      }

      const mergedUsers = Array.from(merged.values())
      const hydrated = await hydrateUserLanguages(supabase, mergedUsers)
      return applyFilters(hydrated, filters)
    } catch (error) {
      console.error("[mapService] findNearbyUsers error:", error)
      return this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
    }
  },

  async findNearbyUsersFallback(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    filters?: FindNearbyFilters,
  ): Promise<NearbyUser[]> {
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    let query = supabase
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
      .eq("account_status", "active")

    if (authUser) {
      query = query.neq("id", authUser.id)
    }

    const { data, error } = await query

    if (error) {
      console.error("[mapService] findNearbyUsersFallback query error:", error)
      return []
    }

    const enriched: NearbyUser[] = (data ?? []).map((user: any) => {
      const distance =
        typeof user.latitude === "number" && typeof user.longitude === "number"
          ? calculateDistanceKm(latitude, longitude, user.latitude, user.longitude)
          : Number.NaN

      const languageRows: Array<{
        language_code: string
        language_type: "native" | "learning"
        proficiency_level: string
      }> = user.user_languages ?? []

      const languages_speak = languageRows
        .filter((row) => row.language_type === "native")
        .map((row) => row.language_code)

      const languages_learn = languageRows
        .filter((row) => row.language_type === "learning")
        .map((row) => row.language_code)

      return {
        ...user,
        languages_speak,
        languages_learn,
        distance,
        distanceFormatted: formatDistance(distance),
      }
    })

    const withinRadius = enriched
      .filter((user) => (Number.isFinite(user.distance) ? (user.distance ?? Infinity) <= radiusKm : true))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    const withLanguages = await hydrateUserLanguages(supabase, withinRadius)
    return applyFilters(withLanguages, filters)
  },
}


