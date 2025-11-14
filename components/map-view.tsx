"use client"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Bell,
  CalendarCheck,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Compass,
  Heart,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Smile,
  Star,
  Users,
  Zap,
  X,
  Clock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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

const SIDEBAR_SAMPLE_MESSAGES = [
  {
    id: "msg-1",
    name: "Carlos",
    languagePair: "EN ↔ ES",
    preview: "Want to grab coffee at Café Esperanto later today?",
    time: "2m ago",
    status: "typing…",
  },
  {
    id: "msg-2",
    name: "Anna",
    languagePair: "DE ↔ NL",
    preview: "I found a Dutch pronunciation workshop this weekend!",
    time: "12m ago",
    status: "replied",
  },
  {
    id: "msg-3",
    name: "Yuki",
    languagePair: "EN ↔ JP",
    preview: "Thanks for the vocabulary list. Shall we practice on Thursday?",
    time: "1h ago",
    status: "delivered",
  },
]

const SIDEBAR_HOME_SPOTLIGHTS = [
  { id: "spot-1", title: "14 live partners", subtitle: "Around Den Haag", accent: "from-[#8EC5FC] to-[#E0C3FC]" },
  { id: "spot-2", title: "3 new events", subtitle: "This weekend", accent: "from-[#F9D423] to-[#FF4E50]" },
  { id: "spot-3", title: "You’re on a 7 day streak", subtitle: "Keep the flow going!", accent: "from-[#6EE7B7] to-[#3B82F6]" },
]

const SIDEBAR_FAVORITES = [
  { id: "fav-1", name: "Emma", languages: "EN ↔ NL", availability: "Evenings • Scheveningen" },
  { id: "fav-2", name: "Ahmed", languages: "AR ↔ EN", availability: "Afternoons • City Centre" },
  { id: "fav-3", name: "Lisa", languages: "DE ↔ EN", availability: "Weekends • Delft" },
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
const RADAR_ANIMATION_STYLES = `
@keyframes pulseRing {
  0% { box-shadow: 0 0 0 0 rgba(125, 211, 252, 0.45); opacity: 0.6; }
  70% { box-shadow: 0 0 0 80px rgba(125, 211, 252, 0); opacity: 0; }
  100% { box-shadow: 0 0 0 0 rgba(125, 211, 252, 0); opacity: 0; }
}
@keyframes radarSweep {
  0% { transform: rotate(0deg); opacity: 0.8; }
  60% { opacity: 0.2; }
  100% { transform: rotate(360deg); opacity: 0.8; }
}
`

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
  const [activeLanguageChip, setActiveLanguageChip] = useState<string>("All")
  const [activePreviewUserId, setActivePreviewUserId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [sidebarTargetWidth, setSidebarTargetWidth] = useState(256)
  const [isSidebarOverlayOpen, setIsSidebarOverlayOpen] = useState(false)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState<"home" | "messages" | "discover" | "favorites" | "settings">(
    "discover",
  )
  const [isPeoplePanelOpen, setIsPeoplePanelOpen] = useState(false)
  const mapInstanceRef = useRef<any>(null)

  const isSidebarExpanded = !isSidebarCollapsed
  const { toast } = useToast()

  // Calculate center offset based on sidebar and panel widths
  const centerOffset = useMemo(() => {
    if (typeof window === "undefined") return undefined
    
    // Sidebar width: 256px (lg:w-64) when expanded on lg+, 224px (md:w-56) on md, 0 when collapsed
    let sidebarWidth = 0
    if (sidebarTargetWidth > 0) {
      sidebarWidth = isSidebarExpanded ? sidebarTargetWidth : 60
    }
    
    // Panel width: 520px when discover panel is open on xl screens
    const panelWidth =
      activeSidebarItem === "discover" && window.innerWidth >= 1280 && !isLeftPanelCollapsed ? 520 : 0
    
    // Offset map center to the left when sidebar/panels are open
    const totalOffset = (sidebarWidth + panelWidth) / 2
    
    return totalOffset > 0 ? { x: -totalOffset, y: 0 } : undefined
  }, [isSidebarExpanded, sidebarTargetWidth, activeSidebarItem, isLeftPanelCollapsed])

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

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateSidebarState = () => {
      const width = window.innerWidth
      const baseWidth = width >= 1024 ? 70 : width >= 768 ? 70 : 0
      setSidebarTargetWidth(baseWidth)
      setIsSidebarCollapsed((prev) => (width < 1024 ? true : prev))
      if (width >= 768) {
        setIsSidebarOverlayOpen(false)
      }
    }

    updateSidebarState()
    window.addEventListener("resize", updateSidebarState)
    return () => window.removeEventListener("resize", updateSidebarState)
  }, [])

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
      const primaryLanguageCode = dbUser.languages_speak?.[0] ?? dbUser.languages_learn?.[0] ?? ""

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
        const fallbackCode = primaryLanguageCode || "en"
        const gradient = resolveLevelGradient("native")
        detailedBadges.push({
          language: getLanguageName(fallbackCode),
          flag: getLanguageFlag(fallbackCode),
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
        detailedBadges[0]

      const secondaryBadge =
        detailedBadges.find(
          (badge) => badge !== primaryBadge && badge.language.toLowerCase() !== primaryBadge?.language.toLowerCase(),
        ) ?? detailedBadges[1] ?? primaryBadge

      const languageName = primaryBadge?.language ?? getLanguageName(primaryLanguageCode || "en")
      const flag = primaryBadge?.flag ?? getLanguageFlag(primaryLanguageCode || "en")

      const nativeBadge = detailedBadges.find((badge) => badge.levelKey === "native") ?? primaryBadge
      const learningBadge = detailedBadges.find((badge) => badge.levelKey !== "native") ?? secondaryBadge

      const secondaryLanguageName =
        learningBadge && learningBadge !== nativeBadge ? learningBadge.language : secondaryBadge?.language

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
        secondaryLanguage: secondaryLanguageName,
        primaryLanguage: languageName,
        timeLeftLabel,
      })

      const languageSummary = secondaryLanguageName ? `${languageName} • ${secondaryLanguageName}` : languageName

      const pairFlagSet = new Set<string>()
      if (primaryBadge?.flag) {
        pairFlagSet.add(primaryBadge.flag)
      }
      if (secondaryBadge?.flag && secondaryBadge.flag !== primaryBadge?.flag) {
        pairFlagSet.add(secondaryBadge.flag)
      }
      if (viewerLearning?.flag && !pairFlagSet.has(viewerLearning.flag)) {
        pairFlagSet.add(viewerLearning.flag)
      }
      if (pairFlagSet.size < 2 && viewerFallbackFlag && !pairFlagSet.has(viewerFallbackFlag)) {
        pairFlagSet.add(viewerFallbackFlag)
      }
      const pairFlags = Array.from(pairFlagSet).slice(0, 2)

      const pairLabelFlags = Array.from(
        new Set(
          [nativeBadge?.flag, learningBadge && learningBadge !== nativeBadge ? learningBadge.flag : undefined].filter(
            Boolean,
          ) as string[],
        ),
      )
      const languagePairLabel = pairLabelFlags.length
        ? `${pairLabelFlags.join(" ")} ${secondaryLanguageName ? `${languageName} ↔ ${secondaryLanguageName}` : languageName}`
        : undefined

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
        secondaryLanguage: secondaryLanguageName,
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
        languagePairLabel,
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

  const languageChipOptions = useMemo(() => {
    const languages = new Map<string, number>()
    mapUsers.forEach((user) => {
      user.languagesSpoken?.forEach((lang) => {
        const key = lang.language
        languages.set(key, (languages.get(key) ?? 0) + 1)
      })
    })
    return Array.from(languages.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language)
      .slice(0, 6)
  }, [mapUsers])

  const filteredUsers = useMemo(() => {
    if (activeLanguageChip === "All") {
      return mapUsers
    }
    const lower = activeLanguageChip.toLowerCase()
    return mapUsers.filter((user) =>
      user.languagesSpoken?.some((lang) => lang.language.toLowerCase() === lower),
    )
  }, [mapUsers, activeLanguageChip])

  const activePreviewUser = useMemo(() => {
    if (!activePreviewUserId) return null
    return filteredUsers.find((user) => user.id === activePreviewUserId) ?? null
  }, [filteredUsers, activePreviewUserId])

  useEffect(() => {
    if (!activePreviewUserId) return
    const stillExists = filteredUsers.some((user) => user.id === activePreviewUserId)
    if (!stillExists) {
      setActivePreviewUserId(null)
    }
  }, [filteredUsers, activePreviewUserId])

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
    return (
      userLocation ?? {
        lat: FALLBACK_CITY_CENTER.latitude,
        lng: FALLBACK_CITY_CENTER.longitude,
      }
    )
  }, [userLocation])

  // Recenter map function
  const recenterMap = useCallback(() => {
    if (!mapInstanceRef.current || !effectiveUserLocation) return

    const map = mapInstanceRef.current
    if (typeof map.easeTo === "function") {
      map.easeTo({
        center: [effectiveUserLocation.lng, effectiveUserLocation.lat],
        zoom: 13,
        duration: 500,
      })
    }
  }, [effectiveUserLocation])

  // Keyboard shortcut for recentering (R key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return // Don't trigger if typing in input
        }
        recenterMap()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [recenterMap])

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
      const secondaryLanguageBadge = user.languagesSpoken.find((lang) => lang.language !== user.primaryLanguage)
      const secondaryLanguageLabel = secondaryLanguageBadge?.language ?? user.secondaryLanguage ?? null
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
      const combinedLanguageLabel = secondaryLanguageLabel ? `${languageName} • ${secondaryLanguageLabel}` : languageName

      return {
        id: user.id,
        username: handle,
        displayName,
        distance: user.distance ?? "Nearby",
        timeLeft,
        language: combinedLanguageLabel,
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

  const previewProfile = activePreviewUser
    ? profileCardProfiles.find((profile) => String(profile.id) === activePreviewUser.id) ?? null
    : null

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
      if (activePreviewUser) {
        const previewIndex = mapUsers.findIndex((candidate) => candidate.id === activePreviewUser.id)
        return { user: activePreviewUser, index: previewIndex }
      }
      return null
    },
    [mapUsers, selectedUser, selectedUserIndex, activePreviewUser],
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
      activeMapFilter === "highlights"
        ? filteredUsers.filter((user) => user.availableNow)
        : filteredUsers
    return viewerMarker ? [viewerMarker, ...base] : base
  }, [activeMapFilter, viewerMarker, filteredUsers])

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
    if (!user || user.isViewer) {
      setActivePreviewUserId(null)
      closeProfileSheet()
      return
    }

    const filteredIndex = filteredUsers.findIndex((candidate) => candidate.id === user.id)
    if (filteredIndex === -1) {
      setActivePreviewUserId(null)
      return
    }

    setActiveSidebarItem("discover")
    setActivePreviewUserId(user.id)

      const fullIndex = mapUsers.findIndex((candidate) => candidate.id === user.id)
      if (selectedUserIndex !== null && fullIndex !== -1) {
        openProfileAtIndex(fullIndex)
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
          title: `${selectedEmoji} You're now live`,
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

  const handleAddNote = useCallback(
    (profile?: ProfileCardProfile) => {
      const name = profile?.displayName ?? selectedUser?.name
      if (!name) return
      const firstName = name.split(" ")[0]
      toast({
        title: "Saved to Notes",
        description: `We'll keep a note slot ready for ${firstName} soon.`,
      })
    },
    [selectedUser, toast],
  )

  const sidebarNavItems: Array<{
    id: "home" | "messages" | "discover" | "favorites" | "settings"
    label: string
    icon: LucideIcon
    gradient: string
  }> = [
    { id: "home", label: "Home", icon: Home, gradient: "from-[#ff9a9e] to-[#fad0c4]" },
    { id: "messages", label: "Messages", icon: MessageCircle, gradient: "from-[#a18cd1] to-[#fbc2eb]" },
    { id: "discover", label: "Discover", icon: Compass, gradient: "from-[#5ee7df] to-[#b490ca]" },
    { id: "favorites", label: "Favorites", icon: Heart, gradient: "from-[#f78ca0] to-[#f9748f]" },
    { id: "settings", label: "Settings", icon: Settings, gradient: "from-[#cfd9df] to-[#e2ebf0]" },
  ]

  const isPreviewFavorite =
    previewProfile && favoriteProfileIds.has(String(previewProfile.id))

  const handleTogglePreviewFavorite = () => {
    if (!previewProfile) return
    handleProfileFavoriteChange(previewProfile, !isPreviewFavorite)
  }

  const toggleSidebarOverlay = () => {
    setIsSidebarOverlayOpen((prev) => !prev)
  }

  const closeSidebarOverlay = () => setIsSidebarOverlayOpen(false)

  const viewerInitials = useMemo(() => {
    if (!currentUserProfile?.full_name) return "YOU"
    const parts = currentUserProfile.full_name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "YOU"
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")
    return initials || "YOU"
  }, [currentUserProfile?.full_name])

  const viewerDisplayName = currentUserProfile?.full_name ?? "Explorer"
  const viewerAvatarUrl = currentUserProfile?.avatar_url ?? "/placeholder-user.jpg"

  const handlePreviewChat = () => {
    if (!previewProfile) return
    handleOpenChat(previewProfile)
  }

  const sidebarContent = useMemo(() => {
    if (activeSidebarItem === "discover") {
      return (
        <>
          <div className="glass-panel p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45">Find Partners</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{nearbyCount} nearby language partners</h2>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                    <MapPin className="h-3.5 w-3.5 text-rose-300" />
                    {displayCity ?? "Den Haag"}, Netherlands
                </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white"
                  >
                    <Menu className="h-3.5 w-3.5" />
                    List
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-white"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Map
                  </button>
              </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <div className="relative flex-1 min-w-[220px]">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    value={displayCity ?? ""}
                    readOnly
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(20,20,30,0.6)] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/50 shadow-[0_4px_18px_rgba(0,0,0,0.4)] outline-none transition hover:bg-[rgba(20,20,30,0.72)] focus:border-white/20 focus:bg-[rgba(20,20,30,0.72)]"
                    placeholder="Search language partners or cities..."
                    aria-label="Search partners"
                  />
                </div>
                <Button
                  onClick={() => setIsFilterOpen(true)}
                  variant="outline"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(99,102,241,0.75)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[rgba(99,102,241,0.9)]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Filters
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveLanguageChip("All")}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:bg-white/10",
                    activeLanguageChip === "All" && "border-transparent bg-[rgba(103,114,255,0.22)] text-white shadow-[0_12px_35px_rgba(99,102,241,0.28)]",
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/70">
                    •
                  </span>
                  All
                </button>
                {languageChipOptions.map((language) => {
                  const isActive = activeLanguageChip === language
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => setActiveLanguageChip(language)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:bg-white/10",
                        isActive && "border-transparent bg-[rgba(103,114,255,0.22)] text-white shadow-[0_12px_35px_rgba(99,102,241,0.28)]",
                      )}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]">
                        {getLanguageFlag(language)}
                      </span>
                      {language}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setFilterAvailableNow((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:bg-white/10",
                    filterAvailableNow && "border-transparent bg-[rgba(16,185,129,0.2)] text-white shadow-[0_12px_35px_rgba(16,185,129,0.32)]",
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                    <Zap className="h-3 w-3" />
                  </span>
                  Live now
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-white/10 bg-white/6 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60 backdrop-blur-[14px] shadow-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#3CEAD7]" />
                  {filterAvailableNow ? "Showing available now" : "Showing all availability"}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[#7B42F6]" />
                  {filteredUsers.length || nearbyCount} live
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-[#3CEAD7]" />
                  Smart match score: active
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white">Nearby partners</div>
              <div className="text-xs font-semibold text-white/60">Sorted by distance</div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {filteredUsers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-2xl border border-dashed border-white/8 bg-[rgba(20,20,30,0.6)] p-6 text-center text-sm text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px]"
                >
                  No partners match your current filters. Try adjusting the language or availability chip.
                </motion.div>
              ) : (
                <div className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user) => {
                      const isActive = activePreviewUser?.id === user.id
                      const matchValue = Math.round(user.matchScore ?? 80)
                      const ratingValue = Number.isFinite(user.rating) ? user.rating.toFixed(1) : "4.8"
                      const exchangesStat =
                        user.stats?.find((stat) => /trade|exchange/i.test(stat.label))?.value ??
                        `${Math.max(1, Math.round((user.matchScore ?? 60) / 2))} exchanges`
                      const learnBadges = (user.learns ?? []).slice(0, 2)
                      const teachBadges = (user.teaches ?? []).slice(0, 2)

                      return (
                        <motion.button
                          key={user.id}
                          layout
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -16 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className={cn(
                            "w-full rounded-2xl border px-5 py-5 text-left transition-all mb-3",
                            isActive
                              ? "border-transparent bg-gradient-to-br from-[#2f1f57]/90 to-[#201742]/90 shadow-[0_18px_50px_rgba(0,0,0,0.6)]"
                              : "border-white/8 bg-[rgba(20,20,30,0.6)] hover:bg-[rgba(30,30,40,0.75)] hover:border-white/15 hover:-translate-y-0.5",
                          )}
                        >
                          <div className="flex gap-4">
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-lg font-semibold text-white shadow-lg shadow-indigo-500/40">
                              {(user.name ?? "L").slice(0, 1)}
                              {user.isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1b1b29] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                              )}
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-base font-semibold text-white">
                                    {user.name ?? "Language Explorer"}
                                    {user.isOnline && <span className="text-xs text-emerald-300">• Online now</span>}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/60">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-rose-300" />
                                      {user.distance}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Star className="h-3.5 w-3.5 text-amber-300" />
                                      {ratingValue}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-3.5 w-3.5 text-sky-300" />
                                      {exchangesStat}
                                    </span>
                                  </div>
                                </div>
                                <span className="rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-3 py-1 text-xs font-bold text-white">
                                  {matchValue}%
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed text-white/80">
                                {user.availabilityMessage ?? user.bio ?? "Ready to connect for a language exchange."}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {learnBadges.map((badge) => (
                                  <span
                                    key={`${user.id}-learn-${badge.language}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200"
                                  >
                                    {badge.flag} Learning {badge.language}
                                  </span>
                                ))}
                                {teachBadges.map((badge) => (
                                  <span
                                    key={`${user.id}-teach-${badge.language}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200"
                                  >
                                    {badge.flag} Teaching {badge.language}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </>
      )
    }

    if (activeSidebarItem === "home") {
      return (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7B42F6]">Today</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Keep the streak going, {viewerDisplayName.split(" ")[0] ?? "Explorer"}!
            </h2>
            <p className="mt-2 text-sm text-indigo-100/70">
              Join an event, start a chat, or flip your availability on for spontaneous exchanges.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {SIDEBAR_HOME_SPOTLIGHTS.map((spot) => (
                <div
                  key={spot.id}
                  className={cn(
                    "rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white shadow-inner shadow-black/30",
                    `bg-gradient-to-br ${spot.accent}`,
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{spot.title}</p>
                  <p className="text-xs text-slate-800/80">{spot.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A6A9B7]">Next steps</p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                    <Zap className="h-4 w-4" />
                </span>
                Ping a nearby partner who’s live right now.
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sky-300">
                    <CalendarCheck className="h-4 w-4" />
                </span>
                RSVP to Saturday’s Matcha &amp; Manuscripts meetup.
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-rose-300">
                    <Compass className="h-4 w-4" />
                </span>
                Update your goals to unlock personalised matches.
              </li>
            </ul>
          </div>
        </div>
      )
    }

    if (activeSidebarItem === "messages") {
      return (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A6A9B7]">Inbox</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Recent conversations</h2>
            </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
              variant="outline"
              className="rounded-full border border-white/8 bg-[rgba(99,102,241,0.8)] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[rgba(99,102,241,0.9)] hover:border-white/15"
            >
              Open full chat
            </Button>
            </motion.div>
          </div>
          <div className="mt-5 space-y-3">
            {SIDEBAR_SAMPLE_MESSAGES.map((message) => (
              <motion.button
                key={message.id}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveSidebarItem("discover")}
                className="glass-card w-full px-4 py-3 text-left text-sm text-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{message.name}</p>
                    <p className="text-xs text-white/60">{message.languagePair}</p>
                  </div>
                  <span className="text-xs text-white/40">{message.time}</span>
                </div>
                <p className="mt-2 text-sm text-white/70">{message.preview}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-300">{message.status}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )
    }

    if (activeSidebarItem === "favorites") {
      return (
        <div className="rounded-2xl border border-white/10 bg-[rgba(25,25,25,0.35)] p-6 shadow-xl backdrop-blur-[20px] transition-all hover:bg-[rgba(25,25,25,0.45)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Saved partners</h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="rounded-full border border-white/8 bg-[rgba(99,102,241,0.8)] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[rgba(99,102,241,0.9)] hover:border-white/15"
            >
              Manage favorites
            </Button>
            </motion.div>
          </div>
          <div className="mt-4 grid gap-3">
            {SIDEBAR_FAVORITES.map((fav) => (
              <motion.button
                key={fav.id}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  const target = mapUsers.find((candidate) =>
                    candidate.name?.toLowerCase().includes(fav.name.toLowerCase()),
                  )
                  if (target) {
                    handleUserSelect(target)
                  }
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{fav.name}</p>
                  <p className="text-xs text-white/60">{fav.languages}</p>
                  <p className="text-xs text-white/50">{fav.availability}</p>
                </div>
                <Heart className="h-4 w-4 text-rose-300" />
              </motion.button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Quick settings</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <p className="text-sm font-semibold text-white">Show me when I’m live</p>
            <p className="text-xs text-white/50">Toggle availability highlights on the map.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <p className="text-sm font-semibold text-white">Smart match boosts</p>
            <p className="text-xs text-white/50">
              Boost your profile to nearby partners when you’re on a streak.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <p className="text-sm font-semibold text-white">Weekly digest</p>
            <p className="text-xs text-white/50">Receive a Sunday snapshot of new partners and events.</p>
          </div>
        </div>
      </div>
    )
  }, [
    activeSidebarItem,
    activeLanguageChip,
    filterAvailableNow,
    filteredUsers,
    activePreviewUser?.id,
    displayCity,
    filterDistance,
    nearbyCount,
    viewerDisplayName,
    mapUsers,
    handleUserSelect,
    languageChipOptions,
  ])

  const renderSidebarNavItems = (showLabels: boolean, onItemClick?: () => void) =>
    sidebarNavItems.map((item) => {
      const Icon = item.icon
      const isActive = activeSidebarItem === item.id
      return (
        <motion.button
          key={item.id}
          type="button"
          aria-label={item.label}
          onClick={() => {
            setActiveSidebarItem(item.id)
            onItemClick?.()
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "group relative flex w-full items-center justify-center rounded-xl py-2.5 transition-all",
            isActive
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full bg-gradient-to-b from-[#7B42F6] to-[#5430F0]"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
              isActive
                ? "bg-gradient-to-br from-[#7B42F6] to-[#5430F0] text-white shadow-[0_0_12px_rgba(123,66,246,0.4)]"
                : "bg-transparent text-white/70 group-hover:text-white",
            )}
          >
            <Icon className={cn("h-5 w-5")} strokeWidth={isActive ? 2.5 : 2} />
          </span>
          <span className="pointer-events-none absolute left-full top-1/2 ml-3 flex -translate-y-1/2 translate-x-0 items-center whitespace-nowrap rounded-xl border border-white/10 bg-[rgba(10,10,20,0.95)] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[0_12px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all group-hover:translate-x-1 group-hover:opacity-100 z-50">
            {item.label}
          </span>
        </motion.button>
      )
    })

  const SidebarUserCard = ({ showLabels }: { showLabels: boolean }) => {
    return (
      <div className="flex flex-col items-center gap-3 px-2 pb-2">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7B42F6] to-[#5430F0] text-sm font-bold text-white shadow-[0_0_16px_rgba(123,66,246,0.3)]">
          {viewerInitials.slice(0, 2)}
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0B0F19] bg-[#3CEAD7] shadow-[0_0_8px_rgba(60,234,215,0.6)]" />
        </div>
      </div>
    )
  }


  return (
    <div className="app-background relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0B0F19] to-[#0F1421]">
      <style>{RADAR_ANIMATION_STYLES}</style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_55%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_60%)]" />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
      <AnimatePresence>
        {isFilterOpen && (
          <FilterPanel isOpen onClose={() => setIsFilterOpen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSidebarOverlayOpen && (
          <motion.div
            key="sidebar-overlay"
            className="fixed inset-0 z-[1500] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebarOverlay}
            />
            <motion.aside
              className="absolute left-0 top-0 flex h-full w-72 flex-col justify-between rounded-r-2xl border-r border-white/8 bg-[rgba(20,20,30,0.6)] px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5f6d] to-[#ffc371] text-sm font-semibold text-white shadow-md">
                      LF
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
                        LangExchange
                      </p>
                      <p className="text-sm font-semibold text-white">Discover</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeSidebarOverlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15"
                    aria-label="Close navigation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="space-y-2">
                  {renderSidebarNavItems(true, closeSidebarOverlay)}
                </nav>
              </div>
              <SidebarUserCard showLabels />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-slate-900/20 backdrop-blur">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            <p className="text-sm text-slate-600">Scanning for nearby partners...</p>
          </div>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="absolute inset-x-6 top-10 z-[1200]">
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200 shadow-lg shadow-rose-900/40 backdrop-blur">
            <p className="font-semibold">We couldn&apos;t load nearby partners.</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && nearbyCount === 0 && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-[#0b0f24]/80 backdrop-blur">
          <div className="pointer-events-auto max-w-sm rounded-3xl border border-white/10 bg-white/10 px-6 py-8 text-center text-slate-200 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold text-white">No partners nearby yet</h3>
            <p className="mt-2 text-sm text-slate-300">
              Adjust your availability window or refresh to widen the search.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-4 rounded-full bg-gradient-to-r from-[#ff5f6d] via-[#c850c0] to-[#4158d0] px-6 text-sm font-semibold text-white shadow-lg hover:opacity-90"
            >
              Refresh search
            </Button>
          </div>
        </div>
      )}

      {isAvailabilityModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAvailabilityModalOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-panel relative w-full max-w-md px-6 py-7 text-white sm:px-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Set Availability</p>
                <h3 className="mt-2 text-2xl font-semibold">Let friends know you're free</h3>
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
                    When enabled, other users can see you're available for language exchange.
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
                        : "We'll surface you to nearby explorers while you're open."}
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
          </motion.div>
        </motion.div>
      )}

      <div className="relative flex h-full w-full overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarTargetWidth > 0 && (
            <motion.aside
              initial={false}
              animate={{
                width: isSidebarExpanded ? sidebarTargetWidth : 60,
                paddingLeft: isSidebarExpanded ? 20 : 8,
                paddingRight: isSidebarExpanded ? 20 : 8,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              style={{
                width: 70,
              }}
              className="group/sidebar hidden h-full w-[70px] flex-shrink-0 flex-col justify-between border-r border-white/8 bg-white/[0.04] py-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-[18px] md:flex"
            >
              <div className="space-y-6 px-2">
                <div className="relative flex justify-center pt-2 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B42F6] to-[#5430F0] text-base font-bold uppercase tracking-wide text-white shadow-[0_0_16px_rgba(123,66,246,0.4)]">
                    P
                  </div>
                </div>
                <nav className="space-y-1">{renderSidebarNavItems(false)}</nav>
              </div>
              <SidebarUserCard showLabels={false} />
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-[1201] h-[72px] flex items-center border-b border-white/[0.06] bg-transparent px-8 shadow-sm backdrop-blur-[14px] transition-all">
          <div className="flex w-full items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-[14px] border border-white/8 bg-white/8 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-[10px] shadow-sm">
                <MapPin className="h-4 w-4 text-[#3CEAD7]" />
                <span>{displayCity ?? "Den Haag"}, Netherlands</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden lg:block">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  value={displayCity ?? ""}
                  readOnly
                  className="h-11 w-[360px] rounded-[16px] border border-white/6 bg-white/6 pl-11 pr-4 text-sm font-medium text-white placeholder:text-white/40 outline-none transition-all hover:bg-white/8 focus:border-white/12 focus:bg-white/8 backdrop-blur-[10px]"
                  placeholder="Search partners or cities…"
                  aria-label="Search partners"
                />
              </div>

              <Button
                onClick={() => setIsAvailabilityModalOpen(true)}
                className="hidden items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7B42F6] to-[#5430F0] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_8px_rgba(123,66,246,0.3)] transition-all hover:shadow-[0_0_16px_rgba(123,66,246,0.5)] hover:scale-[1.02] sm:inline-flex"
                title="Set availability"
              >
                <Zap className="h-4 w-4" />
                Set availability
              </Button>

              <Button
                onClick={() => setIsFilterOpen(true)}
                variant="outline"
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-[10px] transition-all hover:bg-white/12"
                title="Filters"
              >
                <Settings className="h-4 w-4" />
                Filters
              </Button>

              <button
                type="button"
                onClick={() => setActiveSidebarItem("settings")}
                className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/8 bg-white/8 text-white transition hover:bg-white/12 backdrop-blur-[10px]"
                aria-label="Open settings"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(20,20,30,0.6)] py-1 pl-1 pr-3 text-left text-xs text-white shadow-[0_4px_15px_rgba(0,0,0,0.35)] backdrop-blur-[12px] transition-all hover:bg-[rgba(20,20,30,0.75)]"
                      >
                  <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={viewerAvatarUrl} alt={viewerDisplayName} />
                    <AvatarFallback className="bg-white/10 text-white text-xs">
                            {viewerInitials.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden flex-col lg:flex">
                    <span className="text-xs font-semibold leading-tight">{viewerDisplayName}</span>
                    <span className="text-[10px] text-white/60">Active explorer</span>
                        </div>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-white/60 lg:block" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                className="w-48 border border-white/10 bg-[#1a1d32]/95 text-white shadow-xl shadow-black/40"
                    >
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Notifications</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem className="text-rose-400">Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
            </div>
          </div>
        </header>

          <div className="flex flex-1 flex-col gap-0 overflow-hidden">
            <div className="flex flex-1 flex-col xl:flex-row xl:overflow-hidden">
              <AnimatePresence initial={false}>
                {!isLeftPanelCollapsed && (
                  <motion.div
                    key="left-content-panel"
                    initial={{ x: -32, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -32, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative flex w-full flex-col gap-5 border-r border-white/8 bg-white/[0.02] px-6 py-6 xl:w-[30%] xl:flex-shrink-0 xl:overflow-hidden backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setIsLeftPanelCollapsed(true)}
                      className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:bg-white/10"
                      aria-label="Collapse left panel"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSidebarItem}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex h-full flex-col gap-6"
                  >
                    {sidebarContent}
                  </motion.div>
                </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex-1 xl:w-[70%] px-6 py-6">
                {isLeftPanelCollapsed && (
                  <button
                    type="button"
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    className="pointer-events-auto absolute top-6 left-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:bg-white/10"
                    aria-label="Expand left panel"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(12,15,34,0.78)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-[18px]">
                  <div className="absolute inset-0">
                    <MapboxMap
                      users={usersForMap}
                      pois={filteredPois}
                      activeFilter={activeMapFilter}
                      onUserClick={(user) => handleUserSelect(user as MapUser)}
                      onPoiClick={setSelectedPoi}
                      currentUserLocation={effectiveUserLocation}
                      centerOffset={centerOffset}
                      onMapReady={(map) => {
                        mapInstanceRef.current = map
                      }}
                    />
              </div>

                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2">
                    <div className="relative h-40 w-40">
                      <span className="absolute inset-0 rounded-full border border-sky-400/40 bg-sky-400/5" />
                      {[0, 1, 2].map((index) => (
                        <span
                          // eslint-disable-next-line react/no-array-index-key
                          key={index}
                          className={cn(
                            "absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/60",
                            "animate-[pulseRing_4s_linear_infinite]"
                          )}
                          style={{
                            animationDelay: `${index * 1.1}s`,
                          }}
                        />
                      ))}
                      <span className="absolute inset-0 h-full w-full rounded-full">
                        <span className="absolute left-1/2 top-1/2 h-[180%] w-[6px] -translate-x-1/2 -translate-y-[90%] origin-bottom rounded-full bg-gradient-to-b from-sky-300/0 via-sky-300/40 to-sky-500/70 blur-[1px] animate-[radarSweep_6s_linear_infinite]" />
                      </span>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 opacity-35"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 80px)",
                    }}
                  />

                  <div className="flex items-center justify-between px-8 pt-8">
                    <div className="pointer-events-auto inline-flex items-center gap-3 rounded-[14px] border border-white/8 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-[10px] transition-all hover:bg-white/12">
                      <MapPin className="h-4 w-4 text-[#3CEAD7]" />
                      <span>{displayCity}, Netherlands</span>
                    </div>
                    <div className="pointer-events-auto flex items-center gap-3">
                      <button className="glass-button flex h-10 w-10 items-center justify-center text-white">
                        <MapPin className="h-4 w-4" />
                      </button>
                      <button className="glass-button flex h-10 w-10 items-center justify-center text-white">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pointer-events-auto absolute top-14 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/8 bg-[rgba(20,20,30,0.6)] px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px] transition-all hover:bg-[rgba(20,20,30,0.7)]">
                    <Users className="h-4 w-4 text-indigo-300" />
                    <span>{nearbyCount} nearby</span>
                  </div>

                  <div className="pointer-events-none absolute top-32 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          {MAP_FILTERS.find((filter) => filter.id === activeMapFilter)?.hint}
                  </div>

                  <div className="pointer-events-auto absolute bottom-12 left-12 flex flex-col gap-2">
                    <button 
                      className="glass-button flex h-10 w-10 items-center justify-center text-white text-lg font-bold"
                      title="Zoom in"
                    >
                      +
                    </button>
                    <button 
                      className="glass-button flex h-10 w-10 items-center justify-center text-white text-lg font-bold"
                      title="Zoom out"
                    >
                      −
                    </button>
                  </div>
                  <div className="pointer-events-auto absolute bottom-12 right-12">
                    <motion.button
                      onClick={recenterMap}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[rgba(99,102,241,0.8)] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px] transition-all hover:bg-[rgba(99,102,241,0.9)] hover:border-white/15"
                      title="Recenter map (R)"
                    >
                      <Compass className="h-5 w-5" />
                    </motion.button>
                  </div>

                  {activeSidebarItem !== "discover" && (
                    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="max-w-sm rounded-2xl border border-white/8 bg-[rgba(20,20,30,0.6)] px-6 py-6 text-center text-sm text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px]">
                        <p className="text-sm font-semibold text-white">
                          Switch back to Discover to explore the map.
                        </p>
                        <p className="mt-2 text-xs text-white/80">
                          The map remains live in the background while you browse other sections.
                        </p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {activePreviewUser && (
                      <motion.div
                        key={activePreviewUser.id}
                        initial={{ x: 48, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 48, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="glass-card pointer-events-auto absolute bottom-10 right-10 w-[420px] max-w-[min(420px,calc(100vw-40px))] px-7 py-6 text-white"
                      >
                        <div className="absolute right-6 top-6 flex items-center gap-2">
                          <motion.button
                        type="button"
                            onClick={handleTogglePreviewFavorite}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20",
                              isPreviewFavorite && "text-rose-400",
                            )}
                        aria-label="Toggle favorite"
                      >
                            <Heart className={cn("h-5 w-5", isPreviewFavorite && "fill-current")} />
                          </motion.button>
                          <motion.button
                          type="button"
                            onClick={() => setActivePreviewUserId(null)}
                            whileTap={{ scale: 0.9 }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
                            aria-label="Close preview"
                          >
                            <X className="h-5 w-5" />
                          </motion.button>
                      </div>
                      <div className="flex gap-4">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-2xl font-semibold text-white shadow-lg shadow-rose-500/40">
                            {(activePreviewUser.name ?? "S").slice(0, 1)}
                            {activePreviewUser.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-black bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-semibold">{activePreviewUser.name ?? "Language Explorer"}</h3>
                              <p className="mt-1 text-sm text-white/60">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-rose-300" />
                                    {activePreviewUser.distance} •{" "}
                                    {activePreviewUser.availableNow ? "Online now" : "Responsive"}
                                </span>
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                                  {(activePreviewUser.learns ?? [])
                                  .slice(0, 2)
                                  .map((badge) => (
                                    <span
                                        key={`${activePreviewUser.id}-popup-learn-${badge.language}`}
                                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-1"
                                    >
                                      {badge.flag} Learning {badge.language}
                                    </span>
                                  ))}
                                  {(activePreviewUser.teaches ?? [])
                                  .slice(0, 2)
                                  .map((badge) => (
                                    <span
                                        key={`${activePreviewUser.id}-popup-teach-${badge.language}`}
                                      className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 py-1"
                                    >
                                      {badge.flag} Teaching {badge.language}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-white/70">
                              {activePreviewUser.availabilityMessage ??
                                activePreviewUser.bio ??
                                "Ready to connect for a language exchange."}
                          </p>
                        </div>
      </div>

                      <div className="mt-5 grid grid-cols-4 gap-4 border-y border-white/10 py-4 text-center text-sm">
                        <div>
                          <p className="text-lg font-bold text-indigo-300">
                              {Number.isFinite(activePreviewUser.rating) ? activePreviewUser.rating.toFixed(1) : "4.9"}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Rating</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-indigo-300">
                              {activePreviewUser.stats?.find((stat) => /trade|exchange/i.test(stat.label))?.value ?? "23"}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Exchanges</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-indigo-300">
                              {Math.round(activePreviewUser.matchScore ?? 85)}%
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Match</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-indigo-300">
                              {activePreviewUser.stats?.find((stat) => /streak/i.test(stat.label))?.value ?? "6mo"}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Member</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">About</p>
                        <p className="mt-2 text-sm text-white/80">
                            {activePreviewUser.bio ??
                            "Language enthusiast ready to connect. Coffee chats are my favourite way to practice!"}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-3">
                          <motion.button
                          type="button"
                            whileTap={{ scale: 0.97 }}
                          onClick={() => {
                              const mapIndex = mapUsers.findIndex((candidate) => candidate.id === activePreviewUser.id)
                            if (mapIndex !== -1) {
                              openProfileAtIndex(mapIndex)
                            }
                          }}
                          className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                          View Profile
                          </motion.button>
                          <motion.button
                          type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handlePreviewChat}
                          className="flex-1 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:opacity-90"
                        >
                          💬 Chat Now
                          </motion.button>
                      </div>
                      </motion.div>
                  )}
                  </AnimatePresence>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <motion.div
              initial={{ x: "100%", opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-full"
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
            <div className="pointer-events-auto mx-auto w-full max-w-md rounded-t-2xl border border-white/8 bg-[rgba(20,20,30,0.6)] px-6 py-6 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPoi.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedPoi.title}</h3>
                    {selectedPoi.subtitle && (
                      <p className="text-sm text-white/60">{selectedPoi.subtitle}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoi(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-[rgba(20,20,30,0.6)] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px] transition-all hover:bg-[rgba(20,20,30,0.7)] hover:border-white/15"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPoi.languages.map((language) => (
                  <span
                    key={`${selectedPoi.id}-${language}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70"
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
                  <CalendarCheck className="h-4 w-4 text-sky-300" />
                  <span>{selectedPoi.time}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="text-xs text-white/60">
                  <p>Tap Join to RSVP and notify your circle.</p>
                  <p className="mt-1 flex items-center gap-1 text-white/50">
                    <MessageCircle className="h-3.5 w-3.5 text-sky-300" />
                    <span>Chats unlock 30 minutes before start.</span>
                  </p>
                </div>
                <Button className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-sky-600">
                  Join
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* People Bottom Sheet */}
      <AnimatePresence>
        {isPeoplePanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2200] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsPeoplePanelOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-[2201] max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-white/8 bg-[rgba(20,20,30,0.6)] shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">People</h2>
                <button
                  type="button"
                  onClick={() => setIsPeoplePanelOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-[rgba(20,20,30,0.6)] text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px] transition-all hover:bg-[rgba(20,20,30,0.7)] hover:border-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredUsers.slice(0, 12).map((user) => {
                    const matchValue = Math.round(user.matchScore ?? 80)
                    const ratingValue = Number.isFinite(user.rating) ? user.rating.toFixed(1) : "4.8"
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          handleUserSelect(user)
                          setIsPeoplePanelOpen(false)
                        }}
                        className="glass-card cursor-pointer p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-lg font-semibold text-white shadow-lg shadow-indigo-500/40">
                            {(user.name ?? "L").slice(0, 1)}
                            {user.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1b1b29] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="truncate text-base font-semibold text-white">{user.name ?? "Language Explorer"}</h3>
                                <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
                                  <MapPin className="h-3 w-3 text-rose-300" />
                                  {user.distance}
                                </p>
                              </div>
                              <span className="rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-600 px-2 py-1 text-xs font-bold text-white">
                                {matchValue}%
                              </span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm text-white/70">
                              {user.availabilityMessage ?? user.bio ?? "Ready to connect for a language exchange."}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                              <Star className="h-3 w-3 text-amber-300" />
                              {ratingValue}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </div>
  )
}

