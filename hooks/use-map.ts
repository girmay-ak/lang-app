"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { mapService, type NearbyUser } from "@/lib/services/map-service"
import { userService } from "@/lib/services/user-service"

export interface MapFilters {
  distance: number
  availableNow: boolean
  languages: string[]
  skillLevel: string[]
}

const DEFAULT_LOCATION = {
  lat: 52.0705,
  lng: 4.3007,
}

export function useMap(
  filters: MapFilters = {
    distance: 50,
    availableNow: false,
    languages: [],
    skillLevel: [],
  },
) {
  const [users, setUsers] = useState<NearbyUser[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const filtersRef = useRef(filters)
  const isMountedRef = useRef(false)

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  const resolveLocation = useCallback(async (): Promise<{ lat: number; lng: number }> => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return DEFAULT_LOCATION
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          console.warn("[useMap] Geolocation error:", err)
          resolve(DEFAULT_LOCATION)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    })
  }, [])

  const fetchNearbyUsers = useCallback(
    async (coords: { lat: number; lng: number }) => {
      setLoading(true)
      setError(null)

      try {
        const result = await mapService.findNearbyUsers(coords.lat, coords.lng, filtersRef.current.distance, {
          availableNow: filtersRef.current.availableNow,
          languages: filtersRef.current.languages.length > 0 ? filtersRef.current.languages : undefined,
          skillLevel: filtersRef.current.skillLevel.length > 0 ? filtersRef.current.skillLevel : undefined,
        })

        setUsers(result)

        try {
          const currentUser = await userService.getCurrentUser()
          if (currentUser?.id) {
            await userService.updateLocation(currentUser.id, coords.lat, coords.lng)
          }
        } catch (locationSyncError) {
          console.warn("[useMap] Failed to sync location:", locationSyncError)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to load nearby users")
        setError(error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const initialize = useCallback(async () => {
    const coords = await resolveLocation()
    setUserLocation(coords)
    await fetchNearbyUsers(coords)
  }, [resolveLocation, fetchNearbyUsers])

  useEffect(() => {
    if (isMountedRef.current) {
      return
    }
    isMountedRef.current = true
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!userLocation) return
    fetchNearbyUsers(userLocation)
  }, [
    userLocation,
    filters.distance,
    filters.availableNow,
    JSON.stringify(filters.languages),
    JSON.stringify(filters.skillLevel),
    fetchNearbyUsers,
  ])

  const refetch = useCallback(async () => {
    const coords = await resolveLocation()
    setUserLocation(coords)
    await fetchNearbyUsers(coords)
  }, [resolveLocation, fetchNearbyUsers])

  return useMemo(
    () => ({
      users,
      userLocation,
      loading,
      error,
      refetch,
      refreshLocation: refetch,
    }),
    [users, userLocation, loading, error, refetch],
  )
}


