import { createClient } from '../../../lib/supabase'
import { User } from './user.service'

export interface NearbyUser extends User {
  distance?: number
  distanceFormatted?: string
}

export const mapService = {
  /**
   * Find nearby users using PostGIS function
   */
  async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    filters?: {
      availableNow?: boolean
      languages?: string[]
      skillLevel?: string[]
    }
  ): Promise<NearbyUser[]> {
    try {
      const supabase = createClient()

      // Call the database function
      const { data, error } = await supabase.rpc('find_nearby_users', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm,
      })

      if (error) {
        console.warn('[mapService] find_nearby_users function not found, using fallback query')
        // Fallback to regular query if function doesn't exist
        return this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
      }

      let users = data || []

      // Apply filters
      if (filters?.availableNow) {
        users = users.filter((u: NearbyUser) => u.availability_status === 'available')
      }

      if (filters?.languages && filters.languages.length > 0) {
        users = users.filter((u: NearbyUser) => {
          const userLanguages = [
            ...(u.languages_speak || []),
            ...(u.languages_learn || []),
          ]
          return filters.languages!.some((lang) => userLanguages.includes(lang))
        })
      }

      return users
    } catch (error) {
      console.error('[mapService] findNearbyUsers error:', error)
      // Fallback to regular query
      return this.findNearbyUsersFallback(latitude, longitude, radiusKm, filters)
    }
  },

  /**
   * Fallback method using regular query (if PostGIS function not available)
   */
  async findNearbyUsersFallback(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    filters?: {
      availableNow?: boolean
      languages?: string[]
      skillLevel?: string[]
    }
  ): Promise<NearbyUser[]> {
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
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
        .eq('account_status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      // Exclude current user
      if (currentUser) {
        query = query.neq('id', currentUser.id)
      }

      // Filter by availability
      if (filters?.availableNow) {
        query = query.eq('availability_status', 'available')
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate distances and filter by radius
      const usersWithDistance = (data || [])
        .map((user: any) => {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            user.latitude,
            user.longitude
          )
          return {
            ...user,
            distance,
            distanceFormatted: this.formatDistance(distance),
            languages_speak: user.user_languages
              ?.filter((ul: any) => ul.language_type === 'native')
              .map((ul: any) => ul.language_code) || [],
            languages_learn: user.user_languages
              ?.filter((ul: any) => ul.language_type === 'learning')
              .map((ul: any) => ul.language_code) || [],
          }
        })
        .filter((user: NearbyUser) => user.distance! <= radiusKm)
        .sort((a: NearbyUser, b: NearbyUser) => (a.distance || 0) - (b.distance || 0))

      return usersWithDistance
    } catch (error) {
      console.error('[mapService] findNearbyUsersFallback error:', error)
      return []
    }
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  /**
   * Convert degrees to radians
   */
  toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  },

  /**
   * Format distance for display
   */
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`
    }
    return `${km.toFixed(1)}km`
  },
}

