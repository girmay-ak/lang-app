"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Filter, Users, Zap, X } from "lucide-react"
import { MapboxMap } from "./mapbox-map"
import { FilterPanel } from "./filter-panel"
import { useMap } from "@/hooks/use-map"
import { userService } from "@/lib/services/user-service"
import { createClient } from "@/lib/supabase/client"

interface MapUser {
  id: string
  name: string
  language: string
  flag: string
  distance: string
  lat: number
  lng: number
  bio: string
  availableFor: string
  image: string
  isOnline: boolean
  rating: number
  responseTime: string
  currentLocation: string
  availableNow: boolean
  timePreference: string
  languagesSpoken: { language: string; flag: string; level: string }[]
  isFallbackLocation?: boolean
}

const FALLBACK_CITY_CENTER = {
  latitude: 52.0705,
  longitude: 4.3007,
}

const DEN_HAAG_BOUNDS = {
  north: 52.125,
  south: 52.025,
  east: 4.41,
  west: 4.235,
}

const toPositiveHash = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const generateDenHaagCoordinate = (userId: string, axis: "lat" | "lng", offset: number) => {
  const hash = toPositiveHash(`${userId}-${axis}-${offset}`)
  const normalized = (hash % 10000) / 10000

  if (axis === "lat") {
    return DEN_HAAG_BOUNDS.south + (DEN_HAAG_BOUNDS.north - DEN_HAAG_BOUNDS.south) * normalized
  }

  return DEN_HAAG_BOUNDS.west + (DEN_HAAG_BOUNDS.east - DEN_HAAG_BOUNDS.west) * normalized
}

const resolveUserCoordinates = (userId: string, latitude?: number | null, longitude?: number | null) => {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude, isFallback: false }
  }

  return {
    latitude: generateDenHaagCoordinate(userId, "lat", 1),
    longitude: generateDenHaagCoordinate(userId, "lng", 2),
    isFallback: true,
  }
}

const LANGUAGE_FLAG_MAP: Record<string, string> = {
  af: "🇿🇦",
  ar: "🇸🇦",
  de: "🇩🇪",
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  it: "🇮🇹",
  ja: "🇯🇵",
  nl: "🇳🇱",
  pt: "🇵🇹",
  ru: "🇷🇺",
  sv: "🇸🇪",
  zh: "🇨🇳",
  "zh-tw": "🇹🇼",
  japanese: "🇯🇵",
  spanish: "🇪🇸",
  french: "🇫🇷",
  german: "🇩🇪",
  english: "🇬🇧",
  dutch: "🇳🇱",
  portuguese: "🇵🇹",
  italian: "🇮🇹",
  arabic: "🇸🇦",
  swedish: "🇸🇪",
}

const LANGUAGE_NAME_MAP: Record<string, string> = {
  af: "Afrikaans",
  ar: "Arabic",
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  ja: "Japanese",
  nl: "Dutch",
  pt: "Portuguese",
  ru: "Russian",
  sv: "Swedish",
  zh: "Chinese",
  "zh-tw": "Chinese (Traditional)",
}

const getLanguageFlag = (language: string): string => {
  if (!language) return "🌍"
  const key = language.toLowerCase()
  return LANGUAGE_FLAG_MAP[key] || LANGUAGE_FLAG_MAP[key.slice(0, 2)] || "🌍"
}

const getLanguageName = (language: string): string => {
  if (!language) return "Language"
  const key = language.toLowerCase()
  return LANGUAGE_NAME_MAP[key] || language.charAt(0).toUpperCase() + language.slice(1)
}

const formatDistance = (km?: number): string => {
  if (typeof km !== "number" || Number.isNaN(km)) return "—"
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

interface MapViewProps {
  onSetFlag: () => void
  onProfileModalChange?: (isOpen: boolean) => void
  onRegisterAvailabilityToggle?: (toggle: (() => void) | null) => void
}

export function MapView({ onSetFlag, onProfileModalChange, onRegisterAvailabilityToggle }: MapViewProps) {
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityDuration, setAvailabilityDuration] = useState<number>(60)
  const [tempIsAvailable, setTempIsAvailable] = useState(false)
  const [tempAvailabilityDuration, setTempAvailabilityDuration] = useState<number>(60)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [filterDistance, setFilterDistance] = useState(25)
  const [filterAvailableNow, setFilterAvailableNow] = useState(false)
  const [filterSkillLevel, setFilterSkillLevel] = useState<string[]>([])

  const {
    users: nearbyUsers,
    userLocation,
    loading: isLoading,
    error: loadError,
    refetch,
  } = useMap({
    distance: filterDistance,
    availableNow: filterAvailableNow,
    languages: [],
    skillLevel: filterSkillLevel,
  })

  const mapUsers = useMemo<MapUser[]>(() => {
    return nearbyUsers.map((dbUser) => {
      const coordinates = resolveUserCoordinates(dbUser.id, dbUser.latitude, dbUser.longitude)
      const primaryLanguageCode = dbUser.languages_speak?.[0] ?? dbUser.languages_learn?.[0] ?? "en"
      const languageName = getLanguageName(primaryLanguageCode)
      const flag = getLanguageFlag(primaryLanguageCode)

      const spoken = (dbUser.languages_speak ?? []).map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Native",
      }))

      const learning = (dbUser.languages_learn ?? []).map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Learning",
      }))

      const languagesSpoken = [...spoken, ...learning]

      return {
        id: dbUser.id,
        name: dbUser.full_name ?? "Language Explorer",
        language: languageName,
        flag,
        distance: dbUser.distanceFormatted ?? formatDistance(dbUser.distance),
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        bio: dbUser.bio ?? "Language enthusiast ready to connect.",
        availableFor: "30 min",
        image: dbUser.avatar_url ?? "/placeholder-user.jpg",
        isOnline: Boolean(dbUser.is_online),
        rating: 4.8,
        responseTime: "2 min",
        currentLocation: dbUser.city ?? "Unknown location",
        availableNow: dbUser.availability_status === "available",
        timePreference: dbUser.availability_status === "available" ? "Available now" : "Flexible schedule",
        languagesSpoken:
          languagesSpoken.length > 0
            ? languagesSpoken
            : [
                {
                  language: languageName,
                  flag,
                  level: "Native",
                },
              ],
        isFallbackLocation: coordinates.isFallback,
      }
    })
  }, [nearbyUsers])

  useEffect(() => {
    if (!selectedUser) return
    const stillExists = mapUsers.some((user) => user.id === selectedUser.id)
    if (!stillExists) {
      setSelectedUser(null)
      onProfileModalChange?.(false)
    }
  }, [mapUsers, onProfileModalChange, selectedUser])

  useEffect(() => {
    setIsAvailable(filterAvailableNow)
  }, [filterAvailableNow])

  const nearbyCount = mapUsers.length
  const effectiveUserLocation = userLocation ?? {
    lat: FALLBACK_CITY_CENTER.latitude,
    lng: FALLBACK_CITY_CENTER.longitude,
  }

  useEffect(() => {
    if (!onRegisterAvailabilityToggle) return

    const openAvailability = () => {
      setIsAvailabilityModalOpen(true)
    }

    onRegisterAvailabilityToggle(openAvailability)

    return () => {
      onRegisterAvailabilityToggle(null)
    }
  }, [onRegisterAvailabilityToggle])

  useEffect(() => {
    if (isAvailabilityModalOpen) {
      setAvailabilityError(null)
      setTempIsAvailable(isAvailable)
      setTempAvailabilityDuration(availabilityDuration)
    }
  }, [isAvailabilityModalOpen, isAvailable, availabilityDuration])

  const handleRefresh = () => {
    refetch().catch((error) => {
      console.error("[MapView] Refresh failed:", error)
    })
  }

  const handleUserSelect = (user: MapUser | null) => {
    setSelectedUser(user)
    onProfileModalChange?.(user !== null)
  }

  const durationOptions = [30, 60, 90, 120] as const

  const handleSaveAvailability = async () => {
    setAvailabilityError(null)
    setIsSavingAvailability(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      const userId = session?.user?.id
      if (!userId) throw new Error("Please sign in again to update availability.")

      await userService.updateAvailability(userId, tempIsAvailable ? "available" : "offline")

      setIsAvailable(tempIsAvailable)
      setAvailabilityDuration(tempAvailabilityDuration)
      setFilterAvailableNow(tempIsAvailable)
      setIsAvailabilityModalOpen(false)
      await refetch()
    } catch (error: any) {
      console.error("[MapView] Availability update error:", error)
      setAvailabilityError(error?.message ?? "Failed to update availability. Please try again.")
    } finally {
      setIsSavingAvailability(false)
    }
  }

  if (selectedUser) {
    return (
      <div className="h-full relative bg-gray-900">
        <div className="absolute inset-0 opacity-30">
          <MapboxMap users={mapUsers} onUserClick={() => {}} currentUserLocation={effectiveUserLocation} />
        </div>

        <div className="absolute inset-0 flex items-center justify-end animate-slide-in-right">
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUserSelect(null)}
                className="h-12 w-12 rounded-full bg-green-100 hover:bg-green-200 text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>

              <div className="flex items-center gap-2 text-orange-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-semibold text-sm">02:03:48</span>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={selectedUser.image || "/placeholder.svg"} alt={selectedUser.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                    {selectedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-gray-500 text-sm">@{selectedUser.name.toLowerCase().replace(/\s+/g, "")}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedUser.distance} · {selectedUser.timePreference}
                  </p>
                </div>
              </div>

              <Card className="p-5 mb-6 bg-gray-50 border-gray-200 rounded-2xl">
                <p className="text-gray-800 mb-4 leading-relaxed">{selectedUser.bio}</p>

                <div className="flex items-center gap-2 mb-4 bg-green-50 rounded-xl px-3 py-2 w-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">{selectedUser.availableFor}</span>
                  <button className="ml-2 text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedUser.languagesSpoken.map((lang, index) => (
                    <span
                      key={`${lang.language}-${index}`}
                      className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-1.5"
                    >
                      {lang.flag} <span className="text-gray-700">{lang.language}</span>
                      <span className="text-xs uppercase tracking-wide text-gray-500">{lang.level}</span>
                  </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-gray-600 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                      <span className="font-semibold">2,359</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-600 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                      <span className="font-semibold">39</span>
                    </button>
                  </div>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold">
                    Share
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                </div>
              </Card>

              <div className="mb-6">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Location</p>
                <div className="flex items-center gap-2 text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="font-medium">
                    {selectedUser.currentLocation || "Location shared after matching"}
                  </span>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Message"
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                  />
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="You" />
                    <AvatarFallback className="bg-blue-500 text-white text-xs">Y</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {isLoading && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            <p className="text-sm text-slate-200/80">Scanning for nearby partners...</p>
          </div>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="absolute inset-x-4 top-20 z-[1200]">
          <div className="rounded-2xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-100 shadow-xl backdrop-blur">
            <p className="font-semibold">We couldn&apos;t load nearby partners.</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && nearbyCount === 0 && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="pointer-events-auto max-w-sm rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center text-white backdrop-blur-2xl shadow-2xl">
            <h3 className="text-lg font-semibold">No partners nearby yet</h3>
            <p className="mt-2 text-sm text-white/70">Adjust your availability window or refresh to widen the search.</p>
            <Button
              onClick={handleRefresh}
              className="mt-4 rounded-full bg-white/90 text-slate-900 hover:bg-white"
            >
              Refresh search
            </Button>
          </div>
        </div>
      )}

      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={() => setIsAvailabilityModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#0b122a]/95 px-6 py-7 text-white shadow-[0_45px_120px_rgba(5,6,24,0.65)] backdrop-blur-[32px] sm:px-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Set Availability</p>
                <h3 className="mt-2 text-2xl font-semibold">Let friends know you’re free</h3>
                <p className="mt-1 text-sm text-white/60">
                  Toggle your availability to show up for nearby learners in Den Haag.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Zap className="h-4 w-4 text-emerald-300" />
                    Available Now
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    When enabled, other users can see you’re available for language exchange.
                  </p>
                </div>
                <Switch
                  checked={tempIsAvailable}
                  onCheckedChange={setTempIsAvailable}
                  disabled={isSavingAvailability}
                />
              </div>
            </div>

            {tempIsAvailable ? (
              <>
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Duration</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {durationOptions.map((minutes) => (
              <button
                        type="button"
                        key={minutes}
                        onClick={() => setTempAvailabilityDuration(minutes)}
                        disabled={isSavingAvailability}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          tempAvailabilityDuration === minutes
                            ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {minutes}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Location</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {effectiveUserLocation
                        ? `${effectiveUserLocation.lat.toFixed(3)}° N, ${effectiveUserLocation.lng.toFixed(3)}° E`
                        : "Location unavailable"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-white/10"
                  >
                    Change
                  </button>
                  </div>

                <div className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
                  You’ll be visible to nearby users for {tempAvailabilityDuration} minutes.
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/60">
                You&apos;re currently unavailable
            </div>
            )}

            {availabilityError && (
              <p className="mt-4 text-sm text-rose-300">{availabilityError}</p>
            )}

              <Button
              onClick={handleSaveAvailability}
              disabled={isSavingAvailability}
              className={`mt-8 h-12 w-full rounded-full text-sm font-semibold shadow-lg transition ${
                tempIsAvailable
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-70 disabled:hover:from-emerald-400 disabled:hover:to-emerald-500"
                  : "bg-white/10 text-white hover:bg-white/15 disabled:opacity-70"
              }`}
            >
              {isSavingAvailability
                ? "Saving..."
                : tempIsAvailable
                  ? "Set as Available"
                  : "Set as Unavailable"}
              </Button>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <Button
          size="icon"
          className="glass-button rounded-full h-12 w-12 pointer-events-auto"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter className="h-5 w-5 text-white" />
        </Button>

        <div className="glass-button rounded-full px-4 py-2 pointer-events-auto flex items-center gap-2">
          <Users className="h-4 w-4 text-white" />
          <span className="text-white font-semibold text-sm">{nearbyCount} nearby</span>
        </div>

        <Button
          size="icon"
          className={`rounded-full h-12 w-12 pointer-events-auto transition-all shadow-lg ${
            isAvailable
              ? "bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 animate-pulse-slow"
              : "glass-button"
          }`}
          onClick={() => setIsAvailabilityModalOpen(true)}
        >
          <Zap className={`h-5 w-5 ${isAvailable ? "text-white" : "text-white"}`} />
        </Button>
      </div>

      <div className="absolute inset-0">
        <MapboxMap users={mapUsers} onUserClick={handleUserSelect} currentUserLocation={effectiveUserLocation} />
      </div>
    </div>
  )
}
