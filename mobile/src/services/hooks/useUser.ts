import { useState, useEffect } from 'react'
import { userService, User } from '../api/user.service'
import { useAuth } from './useAuth'

export function useUser() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = async () => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const userData = await userService.getCurrentUser()
      setUser(userData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user')
      setError(error)
      console.error('[useUser] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [authUser])

  const updateProfile = async (updates: Partial<User>) => {
    if (!authUser || !user) throw new Error('User not authenticated')
    
    try {
      const updated = await userService.updateProfile(user.id, updates)
      setUser(updated)
      return updated
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile')
      setError(error)
      throw error
    }
  }

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!authUser || !user) return
    
    try {
      await userService.updateLocation(user.id, latitude, longitude)
      setUser({ ...user, latitude, longitude })
    } catch (err) {
      console.error('[useUser] updateLocation error:', err)
    }
  }

  const updateAvailability = async (
    status: 'available' | 'busy' | 'offline',
    duration?: number
  ) => {
    if (!authUser || !user) return
    
    try {
      await userService.updateAvailability(user.id, status, duration)
      setUser({ ...user, availability_status: status })
    } catch (err) {
      console.error('[useUser] updateAvailability error:', err)
    }
  }

  return {
    user,
    loading,
    error,
    updateProfile,
    updateLocation,
    updateAvailability,
    refetch: fetchUser,
  }
}

