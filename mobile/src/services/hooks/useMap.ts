import { useState, useEffect, useCallback, useRef } from 'react'
import { mapService, NearbyUser } from '../api/map.service'
import * as Location from 'expo-location'

export interface MapFilters {
  distance: number // km
  availableNow: boolean
  languages: string[]
  skillLevel: string[]
}

export function useMap(filters: MapFilters = {
  distance: 50,
  availableNow: false,
  languages: [],
  skillLevel: [],
}) {
  const [users, setUsers] = useState<NearbyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  // Use refs to avoid infinite loops
  const filtersRef = useRef(filters)
  const isInitializedRef = useRef(false)
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const watcherCleanupRef = useRef<(() => void) | null>(null)

  // Update filters ref when filters change
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Get user's current location
  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Location permission not granted')
      }

      const location = await Location.getCurrentPositionAsync({})
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      }
      setUserLocation(coords)
      lastLocationRef.current = coords
      return coords
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get location')
      setError(error)
      throw error
    }
  }, [])

  // Fetch nearby users (using ref for filters to avoid recreating callback)
  const fetchNearbyUsers = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true)
      setError(null)

      const currentFilters = filtersRef.current
      const nearbyUsers = await mapService.findNearbyUsers(
        lat,
        lng,
        currentFilters.distance,
        {
          availableNow: currentFilters.availableNow,
          languages: currentFilters.languages.length > 0 ? currentFilters.languages : undefined,
          skillLevel: currentFilters.skillLevel.length > 0 ? currentFilters.skillLevel : undefined,
        }
      )

      setUsers(nearbyUsers)
      console.log(`[useMap] Found ${nearbyUsers.length} nearby users`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch nearby users')
      setError(error)
      console.error('[useMap] Error:', error)
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies - uses refs instead

  // Store fetchNearbyUsers in ref to avoid dependency issues
  const fetchNearbyUsersRef = useRef(fetchNearbyUsers)
  useEffect(() => {
    fetchNearbyUsersRef.current = fetchNearbyUsers
  }, [fetchNearbyUsers])

  // Initialize: Get location and fetch users (only once)
  useEffect(() => {
    if (isInitializedRef.current) return
    
    async function initialize() {
      try {
        const coords = await getCurrentLocation()
        isInitializedRef.current = true
        await fetchNearbyUsers(coords.lat, coords.lng)
        
        // Start location watcher after we have location
        if (watcherCleanupRef.current) {
          watcherCleanupRef.current() // Clean up any existing watcher
        }

        let timeoutId: NodeJS.Timeout | null = null
        const subscriptionPromise = Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000,
            distanceInterval: 100,
          },
          (location) => {
            const newCoords = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            }
            
            // Check if location changed significantly
            const lastLoc = lastLocationRef.current
            if (lastLoc) {
              const latDiff = Math.abs(newCoords.lat - lastLoc.lat)
              const lngDiff = Math.abs(newCoords.lng - lastLoc.lng)
              if (latDiff < 0.001 && lngDiff < 0.001) {
                return
              }
            }

            // Debounce location updates
            if (timeoutId) {
              clearTimeout(timeoutId)
            }

            timeoutId = setTimeout(() => {
              setUserLocation(newCoords)
              lastLocationRef.current = newCoords
              fetchNearbyUsersRef.current(newCoords.lat, newCoords.lng)
            }, 1000)
          }
        )

        watcherCleanupRef.current = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          subscriptionPromise.then((sub) => sub.remove())
        }
      } catch (err) {
        console.error('[useMap] Initialize error:', err)
        isInitializedRef.current = false
      }
    }

    initialize()
    
    return () => {
      if (watcherCleanupRef.current) {
        watcherCleanupRef.current()
        watcherCleanupRef.current = null
      }
    }
  }, [getCurrentLocation, fetchNearbyUsers])

  // Refetch when filters change (but not when location changes)
  useEffect(() => {
    if (userLocation && isInitializedRef.current) {
      fetchNearbyUsers(userLocation.lat, userLocation.lng)
    }
  }, [filters.distance, filters.availableNow, JSON.stringify(filters.languages), JSON.stringify(filters.skillLevel), fetchNearbyUsers]) // Only depend on filter values, not userLocation

  return {
    users,
    userLocation,
    loading,
    error,
    refetch: () => userLocation && fetchNearbyUsers(userLocation.lat, userLocation.lng),
    refreshLocation: getCurrentLocation,
  }
}

