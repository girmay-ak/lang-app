"use client"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  CalendarCheck,
  Filter,
  MessageCircle,
  Smile,
  Users,
  Zap,
  X,
} from "lucide-react"
import { MapboxMap, type MapFilter, type MapPoi } from "./mapbox-map"
import {
  ProfileCard,
  type ProfileAvailabilityInfo,
  type ProfileCardProfile,
  type ProfileLanguageCard,
  type ProfileStatCard,
} from "./profile-card"
import { FilterPanel } from "./filter-panel"
import { useMap } from "@/hooks/use-map"
import { userService, type UserRecord } from "@/lib/services/user-service"
import { chatService } from "@/lib/services/chat-service"
import { connectionService } from "@/lib/services/connection-service"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

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
  primaryLanguage?: string
  secondaryLanguage?: string
  primaryFlag?: string
  secondaryFlag?: string
  matchScore?: number
  statusIcon?: string
  statusText?: string
  levelGradient: { from: string; to: string; label: string }
  languagePairLabel?: string
  teaches?: ProfileLanguageCard[]
  learns?: ProfileLanguageCard[]
  stats?: ProfileStatCard[]
  availabilityInfo?: ProfileAvailabilityInfo
  pairFlags?: string[]
  isFallbackLocation?: boolean
  availabilityMessage?: string | null
  availabilityEmoji?: string | null
  isViewer?: boolean
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

const AVAILABILITY_EMOJIS = ["☕", "🧋", "💬", "🎧", "🏖"] as const

const MAP_FILTERS: Array<{ id: MapFilter; icon: string; label: string; hint: string }> = [
  { id: "people", icon: "👥", label: "People", hint: "Nearby language partners" },
  { id: "places", icon: "🏪", label: "Places", hint: "Cafés & schools" },
  { id: "events", icon: "📅", label: "Events", hint: "Pop-up exchange sessions" },
  { id: "highlights", icon: "⭐", label: "Highlights", hint: "Live meetups & available friends" },
]

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

const LEVEL_ALIAS: Record<string, string> = {
  native: "native",
  fluent: "advanced",
  proficient: "advanced",
  advanced: "advanced",
  upper_intermediate: "intermediate",
  intermediate: "intermediate",
  elementary: "beginner",
  beginner: "beginner",
  novice: "beginner",
  learning: "beginner",
  basic: "beginner",
}

const LEVEL_PRIORITY: Record<string, number> = {
  native: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
}

const LEVEL_GRADIENT: Record<string, { from: string; to: string; label: string }> = {
  native: { from: "#a855f7", to: "#6366f1", label: "Native" },
  advanced: { from: "#f43f5e", to: "#be123c", label: "Advanced" },
  intermediate: { from: "#facc15", to: "#f97316", label: "Intermediate" },
  beginner: { from: "#34d399", to: "#10b981", label: "Beginner" },
}

const DEFAULT_LEVEL_GRADIENT = { from: "#64748b", to: "#1e293b", label: "Explorer" }

const normalizeLevelKey = (value?: string | null) => {
  if (!value) return "beginner"
  const normalized = value.toString().toLowerCase().replace(/\s+/g, "_")
  return LEVEL_ALIAS[normalized] ?? normalized
}

const resolveLevelGradient = (level?: string | null) => {
  const key = normalizeLevelKey(level)
  return LEVEL_GRADIENT[key] ?? DEFAULT_LEVEL_GRADIENT
}

const computeMatchScore = (
  userLanguages: Array<{ language: string; levelKey: string }>,
  viewerLanguages: Array<{ language: string }>,
  distance?: number | null,
) => {
  const userSet = new Set(userLanguages.map((badge) => badge.language.toLowerCase()))
  const viewerSet = new Set(viewerLanguages.map((badge) => badge.language.toLowerCase()))

  const overlapCount = [...userSet].filter((language) => viewerSet.has(language)).length

  const distanceScore =
    typeof distance === "number" && Number.isFinite(distance)
      ? Math.max(0, 18 - Math.min(distance, 18))
      : 8

  let score = 52 + Math.round(distanceScore)
  if (overlapCount > 0) {
    score += overlapCount * 12
  } else {
    score -= Math.max(0, viewerSet.size - overlapCount) * 4
  }

  const nativeOverlap = userLanguages.some(
    (badge) => badge.levelKey === "native" && viewerSet.has(badge.language.toLowerCase()),
  )
  if (nativeOverlap) {
    score += 6
  }

  return Math.min(97, Math.max(40, score))
}

const resolveStatusMeta = ({
  availableNow,
  availabilityEmoji,
  availabilityMessage,
  currentLocation,
  secondaryLanguage,
  primaryLanguage,
  timeLeftLabel,
}: {
  availableNow: boolean
  availabilityEmoji?: string | null
  availabilityMessage?: string | null
  currentLocation?: string | null
  secondaryLanguage?: string
  primaryLanguage?: string
  timeLeftLabel?: string
}) => {
  if (availableNow) {
    return {
      icon: "⚡",
      text: timeLeftLabel ? `Available now (${timeLeftLabel.replace(" left", "")})` : "Available now",
    }
  }

  const lowerMessage = availabilityMessage?.toLowerCase() ?? ""
  if (availabilityEmoji === "☕" || /cafe|coffee|espresso|tea|latte/.test(lowerMessage)) {
    return {
      icon: "☕",
      text: currentLocation ? `At ${currentLocation}` : "Cafe meetup",
    }
  }

  if (availabilityEmoji === "🧋") {
    return { icon: "🧋", text: "Bubble tea chat" }
  }

  if (availabilityEmoji === "🎧") {
    return { icon: "🎧", text: "Focus session" }
  }

  if (availabilityEmoji === "🏖") {
    return { icon: "🏖", text: "Chill vibes" }
  }

  const targetLanguage = secondaryLanguage ?? primaryLanguage ?? "practice"
  return {
    icon: "🎯",
    text: `Looking for ${targetLanguage}`,
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

const MAPBOX_STATIC_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  "pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA"

const formatDistance = (km?: number): string => {
  if (typeof km !== "number" || Number.isNaN(km)) return "—"
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

const getTimeLeftLabel = (availability?: string | null, fallback?: string | null) => {
  if (availability) {
    const minuteMatch = availability.match(/(\d+)\s?(?:m|min|minutes?)/i)
    if (minuteMatch) {
      return `${minuteMatch[1]}m left`
    }
  }

  if (fallback) {
    const minuteMatch = fallback.match(/(\d+)\s?(?:m|min|minutes?)/i)
    if (minuteMatch) {
      return `${minuteMatch[1]}m left`
    }
  }

  return "Available now"
}

interface MapViewProps {
  onSetFlag: () => void
  onProfileModalChange?: (isOpen: boolean) => void
  onRegisterAvailabilityToggle?: (toggle: (() => void) | null) => void
  onStartChat?: (chat: {
    conversationId: string
    otherUserId: string
    name: string
    avatar: string
    online: boolean
  }) => void
}

export function MapView({ onSetFlag, onProfileModalChange, onRegisterAvailabilityToggle, onStartChat }: MapViewProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityDuration, setAvailabilityDuration] = useState<number>(60)
  const [tempIsAvailable, setTempIsAvailable] = useState(false)
  const [tempAvailabilityDuration, setTempAvailabilityDuration] = useState<number>(60)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [isOpeningChat, setIsOpeningChat] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [filterDistance, setFilterDistance] = useState(25)
  const [filterAvailableNow, setFilterAvailableNow] = useState(false)
  const [filterSkillLevel, setFilterSkillLevel] = useState<string[]>([])
  const [currentCity, setCurrentCity] = useState<string | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState("")
  const [tempAvailabilityMessage, setTempAvailabilityMessage] = useState("")
  const [availabilityEmoji, setAvailabilityEmoji] =
    useState<(typeof AVAILABILITY_EMOJIS)[number]>("💬")
  const [tempAvailabilityEmoji, setTempAvailabilityEmoji] =
    useState<(typeof AVAILABILITY_EMOJIS)[number]>("💬")
  const [activeMapFilter, setActiveMapFilter] = useState<MapFilter>("people")
  const [selectedPoi, setSelectedPoi] = useState<MapPoi | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserRecord | null>(null)
  const [recentEventIds, setRecentEventIds] = useState<string[]>([])
  const previousEventIdsRef = useRef<Set<string>>(new Set())
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null)
  const [favoriteProfileIds, setFavoriteProfileIds] = useState<Set<string>>(new Set())

  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem("availability-meta")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.message) {
          setAvailabilityMessage(String(parsed.message).slice(0, 100))
        }
        if (parsed?.emoji && AVAILABILITY_EMOJIS.includes(parsed.emoji)) {
          setAvailabilityEmoji(parsed.emoji as (typeof AVAILABILITY_EMOJIS)[number])
        }
      }
    } catch (error) {
      console.warn("[MapView] Failed to restore availability meta:", error)
    }
  }, [])

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

  useEffect(() => {
    let isMounted = true
    userService
      .getCurrentUser()
      .then((user) => {
        if (!isMounted) return
        setCurrentUserProfile(user ?? null)
        const normalizedCity = user?.city?.trim()
        setCurrentCity(normalizedCity && normalizedCity.length > 0 ? normalizedCity : null)
        if (!availabilityMessage && user?.bio) {
          setAvailabilityMessage(user.bio.slice(0, 100))
        }
      })
      .catch((error) => {
        console.warn("[MapView] Failed to fetch current user:", error)
        if (isMounted) {
          setCurrentCity(null)
          setCurrentUserProfile(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [availabilityMessage])

  const viewerLanguages = useMemo(() => {
    const speak =
      currentUserProfile?.languages_speak?.map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Native",
      })) ?? []

    const learn =
      currentUserProfile?.languages_learn?.map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Learning",
      })) ?? []

    const combined = [...speak, ...learn]
    if (combined.length === 0) {
      return [
        {
          language: "English",
          flag: getLanguageFlag("en"),
          level: "Native",
        },
      ]
    }
    return combined
  }, [currentUserProfile])

  const mapUsers = useMemo<MapUser[]>(() => {
    const viewerLanguageSet = new Set(viewerLanguages.map((lang) => lang.language.toLowerCase()))
    const viewerNative = viewerLanguages.find((lang) => lang.level === "Native")
    const viewerLearning = viewerLanguages.find((lang) => lang.level !== "Native")
    const viewerFallbackFlag = viewerNative?.flag ?? viewerLanguages[0]?.flag ?? "🌍"
    const displayCityLabel = currentCity ?? "Den Haag"

    return nearbyUsers.map((dbUser) => {
      const coordinates = resolveUserCoordinates(dbUser.id, dbUser.latitude, dbUser.longitude)
      const primaryLanguageCode = dbUser.languages_speak?.[0] ?? dbUser.languages_learn?.[0] ?? "en"
      const languageName = getLanguageName(primaryLanguageCode)
      const flag = getLanguageFlag(primaryLanguageCode)

      const languageRows =
        ((dbUser as any).user_languages as
          | Array<{
              language_code: string
              language_type: "native" | "learning"
              proficiency_level?: string | null
            }>
          | undefined) ?? []

      const detailedBadges =
        languageRows.length > 0
          ? languageRows.map((row) => {
              const levelKey = normalizeLevelKey(row.proficiency_level ?? row.language_type)
              const gradient = resolveLevelGradient(levelKey)
              return {
                language: getLanguageName(row.language_code),
                flag: getLanguageFlag(row.language_code),
                levelKey,
                levelLabel: gradient.label,
              }
            })
          : [...(dbUser.languages_speak ?? []), ...(dbUser.languages_learn ?? [])].map((code, index) => {
              const isNative = index < (dbUser.languages_speak?.length ?? 0)
              const levelKey = isNative ? "native" : "beginner"
              const gradient = resolveLevelGradient(levelKey)
              return {
                language: getLanguageName(code),
                flag: getLanguageFlag(code),
                levelKey,
                levelLabel: gradient.label,
              }
            })

      if (detailedBadges.length === 0) {
        const gradient = resolveLevelGradient("native")
        detailedBadges.push({
          language: languageName,
          flag,
          levelKey: "native",
          levelLabel: gradient.label,
        })
      }

      const highestBadge = detailedBadges.reduce<{ levelKey: string; flag: string; language: string; levelLabel: string }>(
        (acc, badge) => {
          if (!acc) return badge
          const currentPriority = LEVEL_PRIORITY[badge.levelKey] ?? 0
          const accPriority = LEVEL_PRIORITY[acc.levelKey] ?? 0
          return currentPriority >= accPriority ? badge : acc
        },
        detailedBadges[0],
      )

      const primaryBadge =
        detailedBadges.find((badge) => badge.levelKey === "native") ??
        detailedBadges.find((badge) => badge.levelKey === highestBadge.levelKey) ??
        highestBadge

      const secondaryBadge =
        detailedBadges.find(
          (badge) => badge !== primaryBadge && badge.language.toLowerCase() !== primaryBadge?.language.toLowerCase(),
        ) ?? detailedBadges[1] ?? primaryBadge

      const levelGradient = resolveLevelGradient(highestBadge?.levelKey)

      const timeLeftLabel = dbUser.availability_status === "available" ? "30m left" : ""

      const availabilityMessage =
        dbUser.bio?.slice(0, 100) ??
        (dbUser.availability_status === "available"
          ? "Available for a quick conversation."
          : "Ping me to schedule a language exchange.")

      const availabilityEmoji =
        AVAILABILITY_EMOJIS.find((emoji) => availabilityMessage.includes(emoji)) ??
        (dbUser.availability_status === "available" ? "💬" : null)

      const { icon: statusIcon, text: statusText } = resolveStatusMeta({
        availableNow: dbUser.availability_status === "available",
        availabilityEmoji,
        availabilityMessage,
        currentLocation: dbUser.city ?? "Nearby cafe",
        secondaryLanguage: secondaryBadge?.language,
        primaryLanguage: primaryBadge?.language ?? languageName,
        timeLeftLabel,
      })

      const matchScore = computeMatchScore(
        detailedBadges.map((badge) => ({ language: badge.language, levelKey: badge.levelKey })),
        Array.from(viewerLanguageSet).map((language) => ({ language })),
        dbUser.distance,
      )

      const derivedTimePreference =
        (dbUser as any)?.timePreference ??
        (dbUser.availability_status === "available" ? "Available now" : "Evenings & weekends")
      const currentLocationLabel = dbUser.city ?? displayCityLabel
      const rawRating = Number((dbUser as any)?.rating ?? 4.8)
      const rawTrades = Number((dbUser as any)?.trades_completed ?? Math.max(18, Math.round((matchScore ?? 80) / 1.6)))
      const rawStreak = Number((dbUser as any)?.streak_days ?? 14)
      const rawMinutes = Number((dbUser as any)?.practice_minutes ?? 220)

      const teachesCards: ProfileLanguageCard[] = detailedBadges
        .filter((badge) => badge.levelKey === "native")
        .map((badge) => ({
          flag: badge.flag,
          language: badge.language,
          level: badge.levelLabel,
          progress: 100,
          description: `Sharing ${badge.language.toLowerCase()} confidently.`,
          variant: "teach",
        }))

      const learnsCards: ProfileLanguageCard[] = detailedBadges
        .filter((badge) => badge.levelKey !== "native")
        .map((badge) => ({
          flag: badge.flag,
          language: badge.language,
          level: badge.levelLabel,
          progress: badge.levelLabel === "Advanced" ? 80 : badge.levelLabel === "Intermediate" ? 60 : 45,
          description: `Practising ${badge.language.toLowerCase()} each week.`,
          variant: "learn",
        }))

      if (!teachesCards.length) {
        teachesCards.push({
          flag,
          language: primaryBadge?.language ?? languageName,
          level: primaryBadge?.levelLabel ?? "Native",
          progress: 100,
          description: dbUser.bio ?? "Happy to help others improve.",
          variant: "teach",
        })
      }

      if (!learnsCards.length) {
        learnsCards.push({
          flag: viewerLearning?.flag ?? viewerFallbackFlag,
          language: secondaryBadge?.language ?? "New language",
          level: secondaryBadge?.levelLabel ?? "Intermediate",
          progress: 55,
          description: "Open to casual meetups and practice sessions.",
          variant: "learn",
        })
      }

      const statCards: ProfileStatCard[] = [
        { label: "Trades", value: String(Math.max(12, Math.round(rawTrades))) },
        { label: "Rating", value: `${rawRating.toFixed(1)}★` },
        { label: "Streak", value: `🔥${Math.max(6, Math.round(rawStreak))}` },
        { label: "Hours", value: `⏱${Math.max(60, Math.round(rawMinutes))}` },
      ]

      const availabilityInfo: ProfileAvailabilityInfo = {
        headline: dbUser.availability_status === "available" ? "⚡ Available for practice" : "🎧 Scheduling sessions",
        subtitle:
          dbUser.availability_status === "available" ? `Next ${timeLeftLabel || "30 minutes"}` : derivedTimePreference,
        schedule: `📅 Usually active: ${derivedTimePreference}`,
        locations: `☕ Preferred locations: ${currentLocationLabel}`,
      }

      const pairFlags = Array.from(
        new Set(
          [
            primaryBadge?.flag,
            secondaryBadge?.flag,
            viewerLearning?.flag,
            viewerFallbackFlag,
          ].filter(Boolean) as string[],
        ),
      ).slice(0, 2)

      return {
        id: dbUser.id,
        name: dbUser.full_name ?? "Language Explorer",
        language: languageName,
        flag,
        distance: dbUser.distanceFormatted ?? formatDistance(dbUser.distance),
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        bio: dbUser.bio ?? "Language enthusiast ready to connect.",
        availableFor: timeLeftLabel || "30m left",
        image: dbUser.avatar_url ?? "/placeholder-user.jpg",
        isOnline: Boolean(dbUser.is_online),
        rating: Number.isFinite(rawRating) ? rawRating : 4.8,
        responseTime: "2 min",
        currentLocation: currentLocationLabel ?? "Unknown location",
        availableNow: dbUser.availability_status === "available",
        timePreference: typeof derivedTimePreference === "string" ? derivedTimePreference : "Flexible schedule",
        languagesSpoken: detailedBadges.map((badge) => ({
          language: badge.language,
          flag: badge.flag,
          level: badge.levelLabel,
        })),
        primaryLanguage: primaryBadge?.language ?? languageName,
        secondaryLanguage: secondaryBadge?.language,
        primaryFlag: primaryBadge?.flag ?? flag,
        secondaryFlag:
          secondaryBadge && secondaryBadge.flag !== primaryBadge?.flag ? secondaryBadge.flag : undefined,
        matchScore,
        statusIcon,
        statusText,
        levelGradient,
        pairFlags,
        isFallbackLocation: coordinates.isFallback,
        availabilityMessage,
        availabilityEmoji,
        isViewer: false,
        languagePairLabel: pairFlags.length ? `${pairFlags.join(" ")} Language Trader` : undefined,
        compatibilityScore: matchScore,
        compatibilityBlurb: statusText,
        levelBadge: { title: levelGradient.label ?? "Language Explorer", tier: statusText ?? "Active partner" },
        teaches: teachesCards,
        learns: learnsCards,
        stats: statCards,
        availabilityInfo,
      }
    })
  }, [nearbyUsers, viewerLanguages, currentCity])

  const closeProfileSheet = useCallback(() => {
    setSelectedUserIndex(null)
  }, [])

  const openProfileAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= mapUsers.length) return
      setSelectedUserIndex(index)
    },
    [mapUsers.length],
  )

  useEffect(() => {
    if (selectedUserIndex === null) return
    if (selectedUserIndex < 0 || selectedUserIndex >= mapUsers.length) {
      closeProfileSheet()
    }
  }, [mapUsers, selectedUserIndex, closeProfileSheet])

  useEffect(() => {
    onProfileModalChange?.(selectedUserIndex !== null)
  }, [selectedUserIndex, onProfileModalChange])

  useEffect(() => {
    setIsAvailable(filterAvailableNow)
  }, [filterAvailableNow])

  useEffect(() => {
    let isMounted = true
    connectionService
      .listFavoriteUserIds()
      .then((ids) => {
        if (!isMounted) return
        setFavoriteProfileIds(new Set(ids))
      })
      .catch((error) => {
        console.error("[MapView] Failed to load favorite users:", error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const effectiveUserLocation = useMemo(() => {
    return userLocation ?? {
      lat: FALLBACK_CITY_CENTER.latitude,
      lng: FALLBACK_CITY_CENTER.longitude,
    }
  }, [userLocation])
  const nearbyCount = nearbyUsers.length
  const displayCity = currentCity ?? "Den Haag"
  const mapPreviewUrl = useMemo(() => {
    if (!effectiveUserLocation || !MAPBOX_STATIC_TOKEN) return null
    const { lat, lng } = effectiveUserLocation
    const formattedLat = Number.isFinite(lat) ? lat.toFixed(6) : FALLBACK_CITY_CENTER.latitude.toFixed(6)
    const formattedLng = Number.isFinite(lng) ? lng.toFixed(6) : FALLBACK_CITY_CENTER.longitude.toFixed(6)
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+38bdf8(${formattedLng},${formattedLat})/${formattedLng},${formattedLat},13,0/480x240@2x?access_token=${MAPBOX_STATIC_TOKEN}`
  }, [effectiveUserLocation])

  const selectedUser =
    selectedUserIndex !== null && selectedUserIndex >= 0 && selectedUserIndex < mapUsers.length
      ? mapUsers[selectedUserIndex]
      : null

  const profileCardProfiles = useMemo<ProfileCardProfile[]>(() => {
    return mapUsers.map((user) => {
      const primaryLanguageBadge = user.languagesSpoken.find((lang) => lang.language === user.primaryLanguage)
      const fallbackLanguage = user.languagesSpoken[0]
      const languageName =
        user.primaryLanguage ?? primaryLanguageBadge?.language ?? fallbackLanguage?.language ?? user.language ?? "Language partner"
      const languageLevel =
        primaryLanguageBadge?.level ?? user.levelGradient.label ?? fallbackLanguage?.level ?? "Native"
      const flag =
        user.primaryFlag ?? primaryLanguageBadge?.flag ?? fallbackLanguage?.flag ?? user.flag ?? "🌍"
      const displayName = user.name ?? "Language Explorer"
      const handle = `@${displayName.toLowerCase().replace(/\s+/g, "")}`
      const description =
        user.availabilityMessage ??
        user.bio ??
        "Language enthusiast ready to connect."
      const timeLeft = user.availableFor || user.timePreference || "Available soon"

      return {
        id: user.id,
        username: handle,
        displayName,
        distance: user.distance ?? "Nearby",
        timeLeft,
        language: languageName,
        languageLevel,
        flag,
        status:
          user.availableFor && user.availableFor.length > 0
            ? `On for ${user.availableFor}`
            : user.availableNow
            ? "Available now"
            : user.timePreference || "Available soon",
        description,
        location: user.currentLocation ?? displayCity,
        avatar: displayName.charAt(0).toUpperCase(),
        avatarUrl: user.image || undefined,
        languagePairLabel: user.languagePairLabel,
        isOnline: user.isOnline,
        compatibilityScore: user.matchScore,
        compatibilityBlurb: user.statusText,
        levelBadge: { title: user.levelGradient?.label ?? "Language Explorer", tier: user.statusText ?? "Active partner" },
        teaches: user.teaches,
        learns: user.learns,
        stats: user.stats,
        availabilityInfo: user.availabilityInfo,
        reviews: [],
        totalReviews: undefined,
      }
    })
  }, [mapUsers, displayCity])

  const resolveProfileTarget = useCallback(
    (profile?: ProfileCardProfile) => {
      if (profile) {
        const targetIndex = mapUsers.findIndex((candidate) => candidate.id === String(profile.id))
        if (targetIndex !== -1) {
          return { user: mapUsers[targetIndex], index: targetIndex }
        }
      }
      if (selectedUser) {
        return { user: selectedUser, index: selectedUserIndex ?? -1 }
      }
      return null
    },
    [mapUsers, selectedUser, selectedUserIndex],
  )

  const viewerMarker = useMemo<MapUser | null>(() => {
    if (!effectiveUserLocation) return null
    const viewerPrimaryLanguage = viewerLanguages[0]?.language ?? "Any language"
    const viewerSecondaryLanguage = viewerLanguages[1]?.language
    const viewerPrimaryFlag = viewerLanguages[0]?.flag ?? "🌍"
    const viewerSecondaryFlag = viewerLanguages[1]?.flag
    const viewerPairFlags = Array.from(
      new Set([viewerPrimaryFlag, viewerSecondaryFlag].filter(Boolean) as string[]),
    ).slice(0, 2)
    const viewerLevelGradient = resolveLevelGradient(viewerLanguages[0]?.level ?? "native")
    const viewerTimeLeftLabel = getTimeLeftLabel(`${availabilityDuration} min`, isAvailable ? "Available now" : null)
    const viewerStatus = resolveStatusMeta({
      availableNow: isAvailable,
      availabilityEmoji,
      availabilityMessage,
      currentLocation: displayCity,
      primaryLanguage: viewerPrimaryLanguage,
      secondaryLanguage: viewerSecondaryLanguage,
      timeLeftLabel: viewerTimeLeftLabel,
    })

    return {
      id: "viewer",
      name: currentUserProfile?.full_name ?? "You",
      language: viewerPrimaryLanguage,
      flag: viewerPrimaryFlag,
      distance: "0m",
      lat: effectiveUserLocation.lat,
      lng: effectiveUserLocation.lng,
      bio: currentUserProfile?.bio ?? "Ready to meet nearby learners.",
      availableFor: `${availabilityDuration} min`,
      image: currentUserProfile?.avatar_url ?? "/placeholder-user.jpg",
    isOnline: true,
      rating: 5,
      responseTime: "Instant",
      currentLocation: displayCity,
      availableNow: isAvailable,
      timePreference: isAvailable ? "Available now" : "Offline",
      languagesSpoken: viewerLanguages,
      isFallbackLocation: false,
      availabilityMessage: availabilityMessage || "Ready to connect nearby.",
      availabilityEmoji: availabilityEmoji,
      isViewer: true,
      matchScore: 100,
      statusIcon: viewerStatus.icon,
      statusText: viewerStatus.text,
      levelGradient: viewerLevelGradient,
      primaryLanguage: viewerPrimaryLanguage,
      secondaryLanguage: viewerSecondaryLanguage,
      primaryFlag: viewerPrimaryFlag,
      secondaryFlag: viewerSecondaryFlag,
      pairFlags: viewerPairFlags,
    }
  }, [
    effectiveUserLocation,
    currentUserProfile,
    viewerLanguages,
    availabilityDuration,
    displayCity,
    isAvailable,
    availabilityMessage,
    availabilityEmoji,
  ])

  const basePois = useMemo<MapPoi[]>(() => {
    if (!effectiveUserLocation) return []
    const { lat, lng } = effectiveUserLocation
    return [
      {
        id: "cafe-esperanto",
        type: "cafe",
        title: "Café Esperanto",
        subtitle: "International coffee chat",
        languages: ["ES", "EN"],
        time: "Today • 17:30",
        emoji: "☕",
        lat: lat + 0.006,
        lng: lng + 0.004,
        description: "Sip espresso and trade idioms with local linguaphiles.",
      },
      {
        id: "school-polyglot",
        type: "school",
        title: "Polyglot Lab",
        subtitle: "Language studio",
        languages: ["NL", "EN", "FR"],
        time: "Weekdays • 09:00-18:00",
        emoji: "🏫",
        lat: lat - 0.004,
        lng: lng - 0.006,
        description: "Drop-in pronunciation booths and tutoring corners for immersive practice.",
      },
      {
        id: "event-tandem-sunset",
        type: "event",
        title: "Sunset Tandem",
        subtitle: "Beach walk & chats",
        languages: ["EN", "DE", "ES"],
        time: "Today • 19:00",
        emoji: "📅",
        lat: lat + 0.008,
        lng: lng - 0.003,
        description: "Evening stroll by the dunes with rotating partners every 10 minutes.",
      },
      {
        id: "event-silent-disco",
        type: "event",
        title: "Silent Disco Stories",
        subtitle: "Audio exchange",
        languages: ["EN", "KO", "JP"],
        time: "Tomorrow • 21:00",
        emoji: "🎧",
        lat: lat - 0.007,
        lng: lng + 0.005,
        description: "Pair up, plug in, and narrate your playlist picks in another language.",
      },
      {
        id: "cafe-matcha",
        type: "cafe",
        title: "Matcha & Manuscripts",
        subtitle: "Tea house micro-meet",
        languages: ["JP", "EN"],
        time: "Sat • 14:00",
        emoji: "🧋",
        lat: lat + 0.002,
        lng: lng + 0.007,
        description: "Guided kanji sketching over calming tea flights.",
      },
    ]
  }, [effectiveUserLocation])

  useEffect(() => {
    if (typeof window === "undefined") return
    const currentEventIds = basePois.filter((poi) => poi.type === "event").map((poi) => poi.id)
    const previousIds = previousEventIdsRef.current
    const newIds = currentEventIds.filter((id) => !previousIds.has(id))
    previousEventIdsRef.current = new Set(currentEventIds)
    if (newIds.length === 0) return
    setRecentEventIds((prev) => Array.from(new Set([...prev, ...newIds])))
    const timeout = window.setTimeout(() => {
      setRecentEventIds((prev) => prev.filter((id) => !newIds.includes(id)))
    }, 8000)
    return () => window.clearTimeout(timeout)
  }, [basePois])

  const poisForMap = useMemo<MapPoi[]>(() => {
    if (!recentEventIds.length) return basePois
    return basePois.map((poi) => ({
      ...poi,
      isNew: recentEventIds.includes(poi.id),
    }))
  }, [basePois, recentEventIds])

  const usersForMap = useMemo(() => {
    if (activeMapFilter === "places" || activeMapFilter === "events") {
      return viewerMarker ? [viewerMarker] : []
    }
    const base =
      activeMapFilter === "highlights" ? mapUsers.filter((user) => user.availableNow) : mapUsers
    return viewerMarker ? [viewerMarker, ...base] : base
  }, [activeMapFilter, viewerMarker, mapUsers])

  const filteredPois = useMemo(() => {
    switch (activeMapFilter) {
      case "places":
        return poisForMap.filter((poi) => poi.type === "cafe" || poi.type === "school")
      case "events":
        return poisForMap.filter((poi) => poi.type === "event")
      case "highlights":
        return poisForMap.filter((poi) => poi.type === "event")
      default:
        return []
    }
  }, [poisForMap, activeMapFilter])

  useEffect(() => {
    if (!selectedPoi) return
    const stillExists = filteredPois.some((poi) => poi.id === selectedPoi.id)
    if (!stillExists) {
      setSelectedPoi(null)
    }
  }, [filteredPois, selectedPoi])

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
      setTempAvailabilityMessage(availabilityMessage)
      setTempAvailabilityEmoji(availabilityEmoji)
    }
  }, [
    isAvailabilityModalOpen,
    isAvailable,
    availabilityDuration,
    availabilityMessage,
    availabilityEmoji,
  ])

  const handleRefresh = () => {
    refetch().catch((error) => {
      console.error("[MapView] Refresh failed:", error)
    })
  }

  const handleUserSelect = (user: MapUser | null) => {
    if (!user) {
      closeProfileSheet()
      return
    }

    if (user.isViewer) {
      closeProfileSheet()
      return
    }

    const index = mapUsers.findIndex((candidate) => candidate.id === user.id)
    if (index !== -1) {
      openProfileAtIndex(index)
    }
  }

  const durationOptions = [30, 60, 90, 120] as const

  const handleToggleAvailability = () => {
    if (isSavingAvailability) return
    setTempIsAvailable((prev) => !prev)
  }

  const handleSaveAvailability = async () => {
    const wasAvailable = isAvailable
    const trimmedMessage = tempAvailabilityMessage.trim().slice(0, 100)
    const selectedEmoji = tempAvailabilityEmoji

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
      setAvailabilityMessage(trimmedMessage)
      setAvailabilityEmoji(selectedEmoji)
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            "availability-meta",
            JSON.stringify({ message: trimmedMessage, emoji: selectedEmoji }),
          )
        } catch (storageError) {
          console.warn("[MapView] Failed to persist availability meta:", storageError)
        }
      }
    setIsAvailabilityModalOpen(false)
      if (tempIsAvailable && !wasAvailable) {
        toast({
          title: `${selectedEmoji} You’re now live`,
          description:
            trimmedMessage.length > 0
              ? `${trimmedMessage} • Visible in ${displayCity} for ${tempAvailabilityDuration} minutes.`
              : `Learners nearby in ${displayCity} can see you for the next ${tempAvailabilityDuration} minutes.`,
        })
      }
      await refetch()
    } catch (error: any) {
      console.error("[MapView] Availability update error:", error)
      setAvailabilityError(error?.message ?? "Failed to update availability. Please try again.")
    } finally {
      setIsSavingAvailability(false)
    }
  }

  const handleAskToMatch = useCallback(
    async (profile?: ProfileCardProfile) => {
      const target = resolveProfileTarget(profile)
      if (!target || isMatching) return

      const firstName = target.user.name.split(" ")[0] ?? target.user.name
      if (target.index !== -1 && target.index !== selectedUserIndex) {
        setSelectedUserIndex(target.index)
      }

      setIsMatching(true)
      try {
        const result = await connectionService.sendFriendRequest(
          target.user.id,
          currentUserProfile?.full_name ?? undefined,
        )

        toast({
          title: result?.alreadyPending ? "Request already sent" : "Match request sent",
          description: result?.alreadyPending
            ? `You already have a pending request with ${firstName}.`
            : `We let ${firstName} know you'd like to connect.`,
        })
      } catch (error: any) {
        console.error("[MapView] Failed to send match request:", error)
        toast({
          title: "Unable to send match request",
          description: error?.message ?? "Please try again in a moment.",
          variant: "destructive",
        })
      } finally {
        setIsMatching(false)
      }
    },
    [resolveProfileTarget, isMatching, selectedUserIndex, currentUserProfile?.full_name, toast],
  )

  const handleOpenChat = async (profile?: ProfileCardProfile) => {
    const target = resolveProfileTarget(profile)
    if (!target || isOpeningChat) return

    try {
      setIsOpeningChat(true)
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session?.user) {
        throw new Error("Please sign in again to start a conversation.")
      }

      const conversation = await chatService.createOrGetConversation(target.user.id)

      if (target.index !== -1 && target.index !== selectedUserIndex) {
        setSelectedUserIndex(target.index)
      }

      onStartChat?.({
        conversationId: conversation.id,
        otherUserId: target.user.id,
        name: target.user.name,
        avatar: target.user.image || "/placeholder-user.jpg",
        online: target.user.isOnline,
      })

      closeProfileSheet()
    } catch (error: any) {
      console.error("[MapView] Failed to open chat:", error)
      toast({
        title: "Unable to open chat",
        description: error?.message ?? "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsOpeningChat(false)
    }
  }

  const handleInviteToEvent = useCallback(
    async (profile?: ProfileCardProfile) => {
      const target = resolveProfileTarget(profile)
      if (!target || isInviting) return

      const firstName = target.user.name.split(" ")[0] ?? target.user.name
      if (target.index !== -1 && target.index !== selectedUserIndex) {
        setSelectedUserIndex(target.index)
      }

      setIsInviting(true)
      try {
        await connectionService.sendEventInvite(
          target.user.id,
          currentUserProfile?.full_name ?? undefined,
        )

        toast({
          title: "Invite sent",
          description: `We invited ${firstName} to meet up at the next event.`,
        })
      } catch (error: any) {
        console.error("[MapView] Failed to send event invite:", error)
        toast({
          title: "Unable to send invite",
          description: error?.message ?? "Please try again shortly.",
          variant: "destructive",
        })
      } finally {
        setIsInviting(false)
      }
    },
    [resolveProfileTarget, isInviting, selectedUserIndex, currentUserProfile?.full_name, toast],
  )

  const handleProfileFavoriteChange = useCallback(
    async (profile: ProfileCardProfile, shouldFavorite: boolean) => {
      const profileId = String(profile.id)
      let previousHadFavorite = false

      setFavoriteProfileIds((prev) => {
        previousHadFavorite = prev.has(profileId)
        const next = new Set(prev)
        if (shouldFavorite) {
          next.add(profileId)
        } else {
          next.delete(profileId)
        }
        return next
      })

      try {
        const result = await connectionService.setFavorite(
          profileId,
          shouldFavorite,
          currentUserProfile?.full_name ?? undefined,
        )

        if (shouldFavorite && result?.alreadyFavorited) {
          toast({
            title: "Already favorited",
            description: `${profile.displayName} is already in your favorites.`,
          })
          return
        }

        toast({
          title: shouldFavorite ? "Added to favorites ❤️" : "Removed from favorites",
          description: shouldFavorite
            ? `We'll keep ${profile.displayName} handy.`
            : `${profile.displayName} is no longer in favorites.`,
        })
      } catch (error: any) {
        console.error("[MapView] Failed to update favorites:", error)
        setFavoriteProfileIds((prev) => {
          const next = new Set(prev)
          if (previousHadFavorite) {
            next.add(profileId)
          } else {
            next.delete(profileId)
          }
          return next
        })

        toast({
          title: "Unable to update favorites",
          description: error?.message ?? "Please try again in a moment.",
          variant: "destructive",
        })
      }
    },
    [currentUserProfile?.full_name, toast],
  )

  const favoriteIdList = useMemo(() => Array.from(favoriteProfileIds), [favoriteProfileIds])
  const isProfileOpen = selectedUserIndex !== null && profileCardProfiles.length > 0

  const handleAddNote = useCallback(
    (profile?: ProfileCardProfile) => {
      const name = profile?.displayName ?? selectedUser?.name
      if (!name) return
      const firstName = name.split(" ")[0]
      toast({
        title: "Saved to Notes",
        description: `We’ll keep a note slot ready for ${firstName} soon.`,
      })
    },
    [selectedUser, toast],
  )

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
                  Toggle your availability to show up for nearby learners in {displayCity}.
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Zap className="h-4 w-4 text-emerald-300" />
                    Available Now
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    When enabled, other users can see you’re available for language exchange.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={isSavingAvailability}
                  className={`relative inline-flex h-11 w-20 items-center overflow-hidden rounded-full p-1 transition-colors duration-200 ${
                    tempIsAvailable
                      ? "justify-end bg-gradient-to-r from-emerald-400/80 via-emerald-500/80 to-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                      : "justify-start bg-white/10"
                  } ${isSavingAvailability ? "cursor-not-allowed opacity-60" : "hover:bg-white/15"}`}
                >
                  <span className="sr-only">Toggle availability</span>
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    initial={false}
                    animate={{
                      opacity: tempIsAvailable ? 0.45 : 0,
                      scale: tempIsAvailable ? 1.05 : 0.92,
                      background: tempIsAvailable
                        ? "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.55) 0%, rgba(16,185,129,0) 70%)"
                        : "transparent",
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg"
                  >
                    <motion.span
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500"
                      initial={false}
                      animate={{ opacity: tempIsAvailable ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    />
                    <motion.span
                      className="relative text-xs font-semibold"
                      initial={false}
                      animate={{
                        color: tempIsAvailable ? "#052e16" : "#0f172a",
                        scale: tempIsAvailable ? 1 : 0.95,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {tempIsAvailable ? "On" : "Off"}
                    </motion.span>
                  </motion.span>
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
            {tempIsAvailable ? (
                <motion.div
                  key="availability-on"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-6 space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                          Custom Message
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          Share what makes this availability window special.
                        </p>
                      </div>
                      <Textarea
                        value={tempAvailabilityMessage}
                        onChange={(event) =>
                          setTempAvailabilityMessage(event.target.value.slice(0, 100))
                        }
                        maxLength={100}
                        rows={3}
                        placeholder="e.g. ☕ Working from the café – open to conversation bursts!"
                        className="resize-none rounded-2xl border border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-emerald-400/50"
                      />
                      <div className="flex items-center justify-between text-[11px] text-white/50">
                        <span>{tempAvailabilityMessage.length}/100 characters</span>
                        <div className="flex items-center gap-1 text-white/60">
                          <Smile className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Pick a vibe</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {AVAILABILITY_EMOJIS.map((emoji) => {
                          const isActive = tempAvailabilityEmoji === emoji
                          return (
                            <motion.button
                              key={emoji}
                              type="button"
                              onClick={() => setTempAvailabilityEmoji(emoji)}
                              whileTap={{ scale: 0.92 }}
                              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                                isActive
                                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                                  : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-lg">{emoji}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Duration</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {durationOptions.map((minutes) => {
                        const isActive = tempAvailabilityDuration === minutes
                        return (
                          <motion.button
                        key={minutes}
                            type="button"
                        onClick={() => setTempAvailabilityDuration(minutes)}
                        disabled={isSavingAvailability}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                              isActive
                                ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-50"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                            } ${isSavingAvailability ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            <motion.span
                              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/50 via-emerald-500/20 to-emerald-400/0"
                              initial={false}
                              animate={{
                                opacity: isActive ? 1 : 0,
                                scale: isActive ? 1 : 0.9,
                                boxShadow: isActive ? "0 0 35px rgba(16,185,129,0.55)" : "0 0 0 rgba(0,0,0,0)",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                            <span className="relative z-10">{minutes}m</span>
                          </motion.button>
                        )
                      })}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <Slider
                        value={[tempAvailabilityDuration]}
                        min={30}
                        max={120}
                        step={15}
                        onValueChange={(value) => {
                          const [first] = value
                          if (typeof first === "number") {
                            setTempAvailabilityDuration(first)
                          }
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                        <span>Availability window</span>
                        <span>{tempAvailabilityDuration} minutes</span>
                      </div>
                  </div>
                </div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.25, ease: "easeOut" }}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Location</p>
                      <p className="mt-1 text-sm font-medium text-white">{displayCity}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {currentCity
                          ? "Updated automatically from your latest check-in."
                          : "Using your default meetup city for now."}
                    </p>
                  </div>
                  <button
                    type="button"
                      className="h-9 rounded-full border border-white/10 px-4 text-xs font-semibold text-sky-300 transition hover:bg-white/10"
                  >
                    Change
                  </button>
                  </motion.div>

                  {mapPreviewUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    >
                      <div className="relative h-40 w-full">
                        <Image
                          src={mapPreviewUrl}
                          alt={`Map preview of ${displayCity}`}
                          fill
                          sizes="(min-width: 640px) 480px, 100vw"
                          className="object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/10 to-transparent" />
                </div>
                      <div className="px-4 py-3 text-xs text-white/60">
                        Preview updates after you save your availability.
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.25, ease: "easeOut" }}
                    className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-[0_18px_35px_rgba(16,185,129,0.15)]"
                  >
                    <span className="font-semibold text-emerald-100">
                      {tempAvailabilityEmoji} {tempAvailabilityDuration} minutes live
                    </span>
                    <p className="mt-1 text-sm text-emerald-50/90">
                      {tempAvailabilityMessage
                        ? tempAvailabilityMessage
                        : "We’ll surface you to nearby explorers while you’re open."}
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="availability-off"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/60"
                >
                You&apos;re currently unavailable
                </motion.div>
            )}
            </AnimatePresence>

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

      <div
        className={`absolute top-4 left-4 right-4 z-[1000] pointer-events-none transition-opacity duration-300 ${
          isProfileOpen ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={isProfileOpen}
      >
        <div className="flex items-center justify-between">
        <Button
          size="icon"
            className="glass-button h-12 w-12 rounded-full pointer-events-auto"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter className="h-5 w-5 text-white" />
        </Button>

          <div className="glass-button pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2">
          <Users className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">{nearbyCount} nearby</span>
        </div>

        <Button
          size="icon"
            className={`pointer-events-auto h-12 w-12 rounded-full transition-all shadow-lg ${
            isAvailable
                ? "animate-pulse-slow bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600"
              : "glass-button"
          }`}
          onClick={() => setIsAvailabilityModalOpen(true)}
        >
            <Zap className="h-5 w-5 text-white" />
        </Button>
        </div>

        <div className="pointer-events-auto mt-4 flex justify-center">
          <LayoutGroup>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-2 backdrop-blur">
              {MAP_FILTERS.map((filter) => {
                const isActive = activeMapFilter === filter.id
                return (
                  <motion.button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveMapFilter(filter.id)}
                    className="relative flex flex-col items-center rounded-full px-3 py-1.5 text-center text-white/70 transition hover:text-white"
                    whileTap={{ scale: 0.9 }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="map-filter-pill"
                        className="absolute inset-0 rounded-full bg-white/15"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative text-lg leading-none">{filter.icon}</span>
                    <span className="relative mt-1 text-[10px] font-semibold uppercase tracking-[0.25em]">
                      {filter.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </LayoutGroup>
        </div>
        <p className="pointer-events-none mt-2 text-center text-[11px] text-white/55">
          {MAP_FILTERS.find((filter) => filter.id === activeMapFilter)?.hint}
        </p>
      </div>

      <div className="absolute inset-0">
        <MapboxMap
          users={usersForMap}
          pois={filteredPois}
          activeFilter={activeMapFilter}
          onUserClick={(user) => handleUserSelect(user as MapUser)}
          onPoiClick={setSelectedPoi}
          currentUserLocation={effectiveUserLocation}
        />
      </div>

      <AnimatePresence>
        {selectedUserIndex !== null && profileCardProfiles.length > 0 && (
          <motion.div
            key="profile-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2500]"
          >
            <ProfileCard
              profiles={profileCardProfiles}
              initialIndex={selectedUserIndex ?? 0}
              onClose={closeProfileSheet}
              onActiveIndexChange={(index) => setSelectedUserIndex(index)}
              onAddNote={handleAddNote}
              onAskToMatch={handleAskToMatch}
              onSendMessage={handleOpenChat}
              onInviteToEvent={handleInviteToEvent}
              onFavoriteChange={handleProfileFavoriteChange}
              favoriteIds={favoriteIdList}
              isMatchPending={isMatching}
              isMessagePending={isOpeningChat}
              isInvitePending={isInviting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPoi && (
          <motion.div
            key={selectedPoi.id}
            initial={{ opacity: 0, y: 160 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 160 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[2100] px-4 pb-6"
          >
            <div className="pointer-events-auto mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b122a]/95 px-6 py-6 text-white shadow-[0_40px_120px_rgba(5,6,24,0.75)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPoi.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPoi.title}</h3>
                    {selectedPoi.subtitle && (
                      <p className="text-sm text-white/60">{selectedPoi.subtitle}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoi(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPoi.languages.map((language) => (
                  <span
                    key={`${selectedPoi.id}-${language}`}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100"
                  >
                    {language}
                  </span>
                ))}
              </div>

              {selectedPoi.description && (
                <p className="mt-4 text-sm text-white/70">{selectedPoi.description}</p>
              )}

              {selectedPoi.time && (
                <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
                  <CalendarCheck className="h-4 w-4 text-emerald-300" />
                  <span>{selectedPoi.time}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="text-xs text-white/50">
                  <p>Tap Join to RSVP and notify your circle.</p>
                  <p className="mt-1 flex items-center gap-1 text-white/40">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Chats unlock 30 minutes before start.</span>
                  </p>
                </div>
                <Button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-400">
                  Join
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
