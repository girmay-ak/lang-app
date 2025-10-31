import { createClient } from "./client"

export interface NearbyUser {
  user_id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  city: string | null
  languages_speak: string[]
  languages_learn: string[]
  distance_meters: number
  distance_km: number
  last_active_at: string
  is_available: boolean
  language_match_score: number
}

export interface LocationUpdate {
  latitude: number
  longitude: number
  accuracy: number
  updated_at: string
}

export interface GeolocationPosition {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

/**
 * Update user's current location with privacy protection
 * Coordinates are rounded to ~100m precision
 */
export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy = 0,
): Promise<LocationUpdate | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("update_user_location", {
    p_user_id: userId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_accuracy: accuracy,
  })

  if (error) {
    console.error("[v0] Location update error:", error)
    return null
  }

  return data as LocationUpdate
}

/**
 * Find nearby language exchange partners
 * @param userId - Current user's ID
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @param radiusKm - Search radius in kilometers (0.5, 1, 2, 5, 10)
 * @param limit - Maximum number of results (default 50)
 */
export async function findNearbyUsers(
  userId: string,
  latitude: number,
  longitude: number,
  radiusKm = 5.0,
  limit = 50,
): Promise<NearbyUser[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("find_nearby_users", {
    p_user_id: userId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
    p_limit: limit,
  })

  if (error) {
    console.error("[v0] Find nearby users error:", error)
    return []
  }

  return data as NearbyUser[]
}

/**
 * Get count of nearby users without full data
 */
export async function countNearbyUsers(
  userId: string,
  latitude: number,
  longitude: number,
  radiusKm = 5.0,
): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("count_nearby_users", {
    p_user_id: userId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
  })

  if (error) {
    console.error("[v0] Count nearby users error:", error)
    return 0
  }

  return data as number
}

/**
 * Toggle ghost mode (hide from discovery)
 */
export async function toggleGhostMode(
  userId: string,
  enabled: boolean,
): Promise<{ ghost_mode: boolean; message: string } | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("toggle_ghost_mode", {
    p_user_id: userId,
    p_enabled: enabled,
  })

  if (error) {
    console.error("[v0] Toggle ghost mode error:", error)
    return null
  }

  return data
}

/**
 * Update last active timestamp
 * Call this periodically (every 5 minutes) to keep user discoverable
 */
export async function updateLastActive(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc("update_last_active", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Update last active error:", error)
  }
}

/**
 * Get user's current location from browser
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  })
}

/**
 * Watch user's location and update periodically
 * Returns a cleanup function to stop watching
 */
export function watchUserLocation(userId: string, onUpdate?: (location: LocationUpdate) => void): () => void {
  if (!navigator.geolocation) {
    console.error("[v0] Geolocation not supported")
    return () => {}
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords

      const result = await updateUserLocation(userId, latitude, longitude, accuracy)

      if (result && onUpdate) {
        onUpdate(result)
      }
    },
    (error) => {
      console.error("[v0] Location watch error:", error)
    },
    {
      enableHighAccuracy: false, // Use less battery
      timeout: 30000,
      maximumAge: 60000, // Accept 1-minute old location
    },
  )

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Block a user
 */
export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  })

  if (error) {
    console.error("[v0] Block user error:", error)
    return false
  }

  return true
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("user_blocks").delete().match({
    blocker_id: blockerId,
    blocked_id: blockedId,
  })

  if (error) {
    console.error("[v0] Unblock user error:", error)
    return false
  }

  return true
}
