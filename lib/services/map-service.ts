"use client"

import { createClient } from "@/lib/supabase/client"
import type { UserRecord } from "@/lib/services/user-service"

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

export const mapService = {
  async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    filters?: FindNearbyFilters,
  ): Promise<NearbyUser[]> {
    try {
      const supabase = createClient()

      // Check if Supabase is configured
      if (!supabase) {
        console.error("[mapService] Supabase client not available")
        return []
      }

      let rpcUsers: NearbyUser[] = []
      
      try {
        const { data, error } = await supabase.rpc("find_nearby_users", {
          user_lat: latitude,
          user_lng: longitude,
          radius_km: radiusKm,
        })

        if (error) {
          console.warn("[mapService] find_nearby_users RPC unavailable, falling back to query.", error)
          return this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
        }

        rpcUsers = applyFilters(Array.isArray(data) ? data : [], filters)
      } catch (rpcError: any) {
        console.warn("[mapService] RPC call failed, using fallback:", rpcError.message)
        // Continue to fallback
      }

      // Always try fallback method
      const fallbackUsers = await this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
      
      if (!fallbackUsers.length && !rpcUsers.length) {
        return []
      }

      if (!fallbackUsers.length) {
        return rpcUsers
      }

      // Merge results
      const merged = new Map<string, NearbyUser>()
      for (const user of [...rpcUsers, ...fallbackUsers]) {
        merged.set(user.id, { ...merged.get(user.id), ...user })
      }

      return Array.from(merged.values())
    } catch (error: any) {
      console.error("[mapService] findNearbyUsers error:", error)
      
      // More detailed error logging
      if (error.message?.includes('Failed to fetch')) {
        console.error("[mapService] Network error - check:")
        console.error("  1. NEXT_PUBLIC_SUPABASE_URL is set correctly")
        console.error("  2. NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly")
        console.error("  3. Supabase project is accessible")
        console.error("  4. Internet connection is working")
      }
      
      // Try fallback as last resort
      try {
        return await this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
      } catch (fallbackError) {
        console.error("[mapService] Fallback also failed:", fallbackError)
        return []
      }
    }
  },

  async findNearbyUsersFallback(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    filters?: FindNearbyFilters,
  ): Promise<NearbyUser[]> {
    try {
      const supabase = createClient()
      
      if (!supabase) {
        console.error("[mapService] Supabase client not available in fallback")
        return []
      }
      
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
      if (error.message?.includes('Failed to fetch')) {
        console.error("[mapService] Network error in fallback query:")
        console.error("  - Check internet connection")
        console.error("  - Check Supabase project status")
        console.error("  - Verify NEXT_PUBLIC_SUPABASE_URL is correct")
      }
      return []
    }
    
    // Handle case where data is null or undefined
    if (!data) {
      console.warn("[mapService] No data returned from fallback query")
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

    return applyFilters(withinRadius, filters)
    } catch (fallbackError: any) {
      console.error("[mapService] findNearbyUsersFallback unexpected error:", fallbackError)
      if (fallbackError.message?.includes('Failed to fetch')) {
        console.error("[mapService] Network error in fallback:")
        console.error("  Error details:", fallbackError.message)
        console.error("  Check Supabase connection and environment variables")
      }
      return []
    }
  },
}


