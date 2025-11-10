import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Heart, MapPin, Zap } from "lucide-react"
import { useSwipeable } from "react-swipeable"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export interface ProfileLanguageCard {
  flag: string
  language: string
  level: string
  progress?: number
  description?: string
  variant?: "teach" | "learn"
}

export interface ProfileStatCard {
  label: string
  value: string
  icon?: string
  tooltip?: string
}

export interface ProfileReview {
  author: string
  text: string
  stars: number
  timeAgo: string
}

export interface ProfileAvailabilityInfo {
  headline: string
  subtitle?: string
  schedule?: string
  locations?: string
}

export interface ProfileCardProfile {
  id: number | string
  username: string
  displayName: string
  distance: string
  timeLeft: string
  language: string
  languageLevel?: string
  flag: string
  status: string
  description: string
  location: string
  avatar?: string
  avatarUrl?: string
  languagePairLabel?: string
  isOnline?: boolean
  compatibilityScore?: number
  compatibilityBlurb?: string
  levelBadge?: { title: string; tier: string }
  teaches?: ProfileLanguageCard[]
  learns?: ProfileLanguageCard[]
  stats?: ProfileStatCard[]
  availabilityInfo?: ProfileAvailabilityInfo
  reviews?: ProfileReview[]
  totalReviews?: number
}

const SAMPLE_PROFILES: ProfileCardProfile[] = [
  {
    id: 1,
    username: "@baraki",
    displayName: "baraki",
    distance: "2.5km",
    timeLeft: "30m left",
    language: "English",
    languageLevel: "Native",
    flag: "🇬🇧",
    status: "On for 30 min",
    description: "Japanese speaker learning English and Dutch. Beginner level! 🇯🇵 🇳🇱",
    location: "Unknown location",
    avatar: "👤",
    languagePairLabel: "🇬🇧 🇳🇱 Language Trader",
    isOnline: true,
    compatibilityScore: 95,
    compatibilityBlurb: "Perfect language match!",
    levelBadge: { title: "Language Enthusiast", tier: "Level 12" },
    teaches: [
      { flag: "🇬🇧", language: "English", level: "Native", progress: 100, description: "Business English, Tech vocabulary, Pronunciation coaching", variant: "teach" },
    ],
    learns: [
      { flag: "🇳🇱", language: "Dutch", level: "Intermediate", progress: 65, description: "Daily conversations, work situations, Dutch culture & idioms", variant: "learn" },
    ],
    stats: [
      { label: "Trades", value: "47" },
      { label: "Rating", value: "4.8★" },
      { label: "Streak", value: "🔥30" },
      { label: "Hours", value: "⏱245" },
    ],
    availabilityInfo: {
      headline: "⚡ Available for practice",
      subtitle: "Next 30 minutes",
      schedule: "📅 Usually active: Evenings (6pm-9pm) & Weekends",
      locations: "☕ Preferred locations: Coffee shops, Libraries, Parks",
    },
    reviews: [
      {
        author: "Sarah • 2 days ago",
        stars: 5,
        text: "Amazing teacher! Very patient with my Dutch mistakes. Would practice again!",
        timeAgo: "2 days ago",
      },
      {
        author: "Mike • 1 week ago",
        stars: 5,
        text: "Great conversation partner. Helped me improve pronunciation!",
        timeAgo: "1 week ago",
      },
    ],
    totalReviews: 47,
  },
  {
    id: 2,
    username: "@sarah",
    displayName: "Sarah",
    distance: "1.2km",
    timeLeft: "15m left",
    language: "Spanish",
    languageLevel: "Native",
    flag: "🇪🇸",
    status: "On for 15 min",
    description: "Native Spanish speaker teaching Spanish and learning Korean! 🇰🇷",
    location: "City Center",
    avatar: "👩",
    languagePairLabel: "🇪🇸 🇰🇷 Language Buddy",
    isOnline: true,
    compatibilityScore: 88,
    compatibilityBlurb: "Great overlap with your interests",
    levelBadge: { title: "Community Host", tier: "Level 9" },
    teaches: [
      { flag: "🇪🇸", language: "Spanish", level: "Native", progress: 100, description: "Latin American expressions, travel Spanish", variant: "teach" },
    ],
    learns: [
      { flag: "🇰🇷", language: "Korean", level: "Beginner", progress: 35, description: "Casual chats, K-drama language", variant: "learn" },
    ],
    stats: [
      { label: "Trades", value: "32" },
      { label: "Rating", value: "4.9★" },
      { label: "Streak", value: "🔥12" },
      { label: "Hours", value: "⏱168" },
    ],
    availabilityInfo: {
      headline: "⚡ Available for practice",
      subtitle: "Next 15 minutes",
      schedule: "📅 Usually active: Lunch breaks & Saturday mornings",
      locations: "🍵 Preferred: Tea rooms, Online video calls",
    },
    reviews: [
      {
        author: "Lina • 3 days ago",
        stars: 5,
        text: "Sarah makes grammar fun! Learned so many idioms.",
        timeAgo: "3 days ago",
      },
    ],
    totalReviews: 32,
  },
  {
    id: 3,
    username: "@yuki",
    displayName: "Yuki",
    distance: "1.1km",
    timeLeft: "30m left",
    language: "English",
    languageLevel: "Native",
    flag: "🇬🇧",
    status: "On for 30 min",
    description: "Japanese speaker learning English and Dutch. Beginner level! 🇯🇵 🇳🇱",
    location: "Den Haag Centrum",
    avatar: "👨",
    languagePairLabel: "🇬🇧 🇯🇵 Culture Swap",
    isOnline: false,
    compatibilityScore: 82,
    compatibilityBlurb: "Strong fit for cultural exchange",
    levelBadge: { title: "Conversation Pro", tier: "Level 10" },
    teaches: [
      { flag: "🇯🇵", language: "Japanese", level: "Native", progress: 100, description: "Casual slang, anime discussion, travel tips", variant: "teach" },
    ],
    learns: [
      { flag: "🇳🇱", language: "Dutch", level: "Beginner", progress: 45, description: "Shopping phrases, commuting small-talk", variant: "learn" },
      { flag: "🇬🇧", language: "English", level: "Advanced", progress: 80, description: "Business writing, presentation practice", variant: "learn" },
    ],
    stats: [
      { label: "Trades", value: "54" },
      { label: "Rating", value: "4.7★" },
      { label: "Streak", value: "🔥8" },
      { label: "Hours", value: "⏱212" },
    ],
    availabilityInfo: {
      headline: "☕ Coffee chat preferred",
      subtitle: "Usually weekday evenings",
      schedule: "📅 Active during: Weeknights & Sunday afternoons",
      locations: "🏙 Preferred: City center cafés, Hybrid sessions",
    },
    reviews: [
      {
        author: "Noor • 5 days ago",
        stars: 5,
        text: "Loved swapping cultural stories with Yuki!",
        timeAgo: "5 days ago",
      },
    ],
    totalReviews: 58,
  },
  {
    id: 4,
    username: "@marie",
    displayName: "Marie",
    distance: "3.8km",
    timeLeft: "45m left",
    language: "French",
    languageLevel: "Native",
    flag: "🇫🇷",
    status: "On for 45 min",
    description: "French teacher looking to practice English and German. Intermediate level! 🇩🇪",
    location: "Scheveningen",
    avatar: "👧",
    languagePairLabel: "🇫🇷 🇩🇪 Polyglot",
    isOnline: true,
    compatibilityScore: 90,
    compatibilityBlurb: "Ideal partner for structured study",
    levelBadge: { title: "Grammar Mentor", tier: "Level 14" },
    teaches: [
      { flag: "🇫🇷", language: "French", level: "Native", progress: 100, description: "Exam prep, pronunciation drills, business etiquette", variant: "teach" },
    ],
    learns: [
      { flag: "🇩🇪", language: "German", level: "Intermediate", progress: 55, description: "Work scenarios, travel tips", variant: "learn" },
      { flag: "🇬🇧", language: "English", level: "Advanced", progress: 85, description: "Pitch practice, storytelling", variant: "learn" },
    ],
    stats: [
      { label: "Trades", value: "61" },
      { label: "Rating", value: "4.9★" },
      { label: "Streak", value: "🔥22" },
      { label: "Hours", value: "⏱312" },
    ],
    availabilityInfo: {
      headline: "⚡ Available for practice",
      subtitle: "Next 45 minutes",
      schedule: "📅 Usually active: Early mornings & late evenings",
      locations: "📚 Preferred: Libraries, online workshops",
    },
    reviews: [
      {
        author: "Jonas • Yesterday",
        stars: 5,
        text: "Her feedback is precise and motivating. Great for advanced learners.",
        timeAgo: "1 day ago",
      },
    ],
    totalReviews: 61,
  },
]

const PROFILE_TOKENS: Record<string, string> = {
  "--profile-bg": "220 20% 16%",
  "--profile-card": "220 18% 20%",
  "--profile-card-hover": "220 18% 22%",
  "--glow-cyan": "189 85% 55%",
  "--glow-purple": "260 80% 65%",
  "--button-match": "142 76% 56%",
  "--button-message": "210 85% 58%",
  "--button-tertiary": "220 15% 30%",
  "--status-active": "189 85% 65%",
}

function injectProfileStyles() {
  if (typeof window === "undefined") return
  const STYLE_ID = "profile-card-theme"
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.innerHTML = `
    @keyframes profile-card-enter {
      0% { transform: translateY(32px) scale(0.95); opacity: 0; }
      60% { transform: translateY(-4px) scale(1.01); opacity: 0.9; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes profile-heart-bounce {
      0% { transform: scale(1); }
      35% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }
    @keyframes profile-bounce-left {
      0% { transform: translateX(0); }
      35% { transform: translateX(-20px); }
      100% { transform: translateX(0); }
    }
    @keyframes profile-bounce-right {
      0% { transform: translateX(0); }
      35% { transform: translateX(20px); }
      100% { transform: translateX(0); }
    }
    @keyframes profile-avatar-glow {
      0% { box-shadow: 0 0 0 rgba(59, 244, 255, 0.35); }
      50% { box-shadow: 0 0 40px rgba(59, 244, 255, 0.55); }
      100% { box-shadow: 0 0 0 rgba(59, 244, 255, 0.35); }
    }
    .profile-card-enter { animation: profile-card-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
    .animate-bounce-left { animation: profile-bounce-left 0.55s ease; }
    .animate-bounce-right { animation: profile-bounce-right 0.55s ease; }
    .animate-heart-bounce { animation: profile-heart-bounce 0.6s ease; }
    .avatar-glow::before {
      content: "";
      position: absolute;
      inset: -8px;
      border-radius: 9999px;
      border: 3px solid hsla(var(--glow-cyan), 0.35);
      animation: profile-avatar-glow 3s ease-in-out infinite;
      filter: blur(1px);
    }
  `
  document.head.appendChild(style)
}

export interface ProfileCardProps {
  profiles?: ProfileCardProfile[]
  initialIndex?: number
  onClose?: () => void
  onActiveIndexChange?: (index: number, profile: ProfileCardProfile) => void
  onAddNote?: (profile: ProfileCardProfile) => void | Promise<void>
  onAskToMatch?: (profile: ProfileCardProfile) => void | Promise<void>
  onSendMessage?: (profile: ProfileCardProfile) => void | Promise<void>
  onInviteToEvent?: (profile: ProfileCardProfile) => void | Promise<void>
  onFavoriteChange?: (profile: ProfileCardProfile, isFavorited: boolean) => void | Promise<void>
  favoriteIds?: Array<ProfileCardProfile["id"]>
  loopNavigation?: boolean
  isMatchPending?: boolean
  isMessagePending?: boolean
  isInvitePending?: boolean
}

export function ProfileCard({
  profiles = SAMPLE_PROFILES,
  initialIndex = 0,
  onClose,
  onActiveIndexChange,
  onAddNote,
  onAskToMatch,
  onSendMessage,
  onInviteToEvent,
  onFavoriteChange,
  favoriteIds,
  loopNavigation = false,
  isMatchPending = false,
  isMessagePending = false,
  isInvitePending = false,
}: ProfileCardProps) {
  const { toast } = useToast()
  const modalRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (profiles.length === 0) return 0
    return Math.min(Math.max(initialIndex, 0), profiles.length - 1)
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [showBoundaryFeedback, setShowBoundaryFeedback] = useState<"left" | "right" | null>(null)
  const [favorites, setFavorites] = useState<Set<ProfileCardProfile["id"]>>(
    () => new Set(favoriteIds ?? []),
  )
  const [justLiked, setJustLiked] = useState(false)
  useEffect(() => {
    const modal = modalRef.current
    const scrollContainer = scrollContainerRef.current
    if (!modal || !scrollContainer) return

    const focusTarget = scrollContainer
    const raf = requestAnimationFrame(() => {
      modal.focus({ preventScroll: true })
      focusTarget.focus({ preventScroll: true })
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!scrollContainer.contains(document.activeElement)) return

      const step = event.key === "PageDown" || event.key === "PageUp" ? 240 : 80
      if (event.key === "ArrowDown") {
        event.preventDefault()
        scrollContainer.scrollBy({ top: step, behavior: "smooth" })
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        scrollContainer.scrollBy({ top: -step, behavior: "smooth" })
      } else if (event.key === "PageDown") {
        event.preventDefault()
        scrollContainer.scrollBy({ top: step * 2, behavior: "smooth" })
      } else if (event.key === "PageUp") {
        event.preventDefault()
        scrollContainer.scrollBy({ top: -step * 2, behavior: "smooth" })
      } else if (event.key === "Home") {
        event.preventDefault()
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" })
      } else if (event.key === "End") {
        event.preventDefault()
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" })
      }
    }

    modal.addEventListener("keydown", handleKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      modal.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentIndex, profiles.length])

  useEffect(() => {
    injectProfileStyles()
  }, [])

  useEffect(() => {
    if (!justLiked) return
    const timeout = window.setTimeout(() => setJustLiked(false), 600)
    return () => window.clearTimeout(timeout)
  }, [justLiked])

  useEffect(() => {
    if (!favoriteIds) return
    setFavorites(new Set(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    if (profiles.length === 0) {
      setCurrentIndex(0)
      return
    }
    setCurrentIndex((prev) => {
      const next = Math.min(Math.max(prev, 0), profiles.length - 1)
      return prev === next ? prev : next
    })
  }, [profiles.length])

  useEffect(() => {
    if (profiles.length === 0) return
    const nextIndex = Math.min(Math.max(initialIndex, 0), profiles.length - 1)
    setCurrentIndex((prev) => (prev === nextIndex ? prev : nextIndex))
  }, [initialIndex, profiles.length])

  useEffect(() => {
    if (profiles.length === 0) return
    const clampedIndex = Math.min(Math.max(currentIndex, 0), profiles.length - 1)
    const profile = profiles[clampedIndex]
    if (profile) {
      onActiveIndexChange?.(clampedIndex, profile)
    }
  }, [currentIndex, profiles, onActiveIndexChange])

  // Compute activeIndex and activeProfile safely (before hooks)
  const activeIndex = profiles.length > 0 ? Math.min(Math.max(currentIndex, 0), profiles.length - 1) : 0
  const activeProfile = profiles[activeIndex] ?? profiles[0]

  const handlePrevious = () => {
    if (isAnimating || profiles.length === 0) return
    if (activeIndex === 0) {
      if (loopNavigation && profiles.length > 1) {
        setIsAnimating(true)
        setCurrentIndex(profiles.length - 1)
        window.setTimeout(() => setIsAnimating(false), 320)
      } else {
        setShowBoundaryFeedback("left")
        window.setTimeout(() => setShowBoundaryFeedback(null), 420)
      }
        return
    }
    setIsAnimating(true)
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
    window.setTimeout(() => setIsAnimating(false), 320)
      }

  const handleNext = () => {
    if (isAnimating || profiles.length === 0) return
    if (activeIndex === profiles.length - 1) {
      if (loopNavigation && profiles.length > 1) {
      setIsAnimating(true)
        setCurrentIndex(0)
        window.setTimeout(() => setIsAnimating(false), 320)
      } else {
        setShowBoundaryFeedback("right")
        window.setTimeout(() => setShowBoundaryFeedback(null), 420)
      }
      return
    }
    setIsAnimating(true)
    setCurrentIndex((prev) => Math.min(prev + 1, profiles.length - 1))
    window.setTimeout(() => setIsAnimating(false), 320)
  }

  const handleJumpToProfile = (index: number) => {
    if (isAnimating || index === activeIndex) return
    if (index < 0 || index >= profiles.length) return
      setIsAnimating(true)
    setCurrentIndex(index)
    window.setTimeout(() => setIsAnimating(false), 320)
  }

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
      window.setTimeout(() => {
      onClose?.()
      setIsClosing(false)
    }, 400)
  }

  const toggleFavorite = () => {
    const wasFavorited = favorites.has(activeProfile.id)
    const willBeFavorited = !wasFavorited

    setFavorites((prev) => {
      const next = new Set(prev)
      if (willBeFavorited) {
        next.add(activeProfile.id)
      } else {
        next.delete(activeProfile.id)
      }
      return next
    })

    if (willBeFavorited) {
      setJustLiked(true)
    }

    if (onFavoriteChange) {
      Promise.resolve(onFavoriteChange(activeProfile, willBeFavorited)).catch((error) => {
        console.error("[ProfileCard] Failed to update favorites:", error)
    setFavorites((prev) => {
      const next = new Set(prev)
          if (willBeFavorited) {
        next.delete(activeProfile.id)
      } else {
        next.add(activeProfile.id)
      }
      return next
    })
        setJustLiked(false)
        toast({
          title: "Favorite update failed",
          description: "Please try again.",
        })
      })
    } else {
      toast({
        title: willBeFavorited ? "Added to favorites ❤️" : "Removed from favorites",
        description: willBeFavorited
          ? `${activeProfile.displayName} has been added to your favorites.`
          : `${activeProfile.displayName} has been removed from your favorites.`,
      })
    }
  }

  const handleAddNoteClick = () => {
    if (onAddNote) {
      Promise.resolve(onAddNote(activeProfile)).catch((error) => {
        console.error("[ProfileCard] Failed to add note:", error)
        toast({
          title: "Note action failed",
          description: "Please try again.",
        })
      })
      return
    }

    toast({
      title: "Saved to notes",
      description: `We’ll keep a note slot ready for ${activeProfile.displayName}.`,
    })
  }

  const handleAskToMatchClick = () => {
    if (isMatchPending) return
    if (onAskToMatch) {
      Promise.resolve(onAskToMatch(activeProfile)).catch((error) => {
        console.error("[ProfileCard] Failed to trigger ask-to-match:", error)
        toast({
          title: "Match request failed",
          description: "Please try again.",
        })
      })
      return
    }

    toast({
      title: "Match request sent",
      description: `We let ${activeProfile.displayName} know you'd like to match.`,
    })
  }

  const handleSendMessageClick = () => {
    if (isMessagePending) return
    if (onSendMessage) {
      Promise.resolve(onSendMessage(activeProfile)).catch((error) => {
        console.error("[ProfileCard] Failed to open chat:", error)
        toast({
          title: "Unable to start chat",
          description: "Please try again.",
        })
      })
      return
    }

    toast({
      title: "Message",
      description: `Starting chat with ${activeProfile.displayName}.`,
    })
  }

  const handleInviteToEventClick = () => {
    if (isInvitePending) return
    if (onInviteToEvent) {
      Promise.resolve(onInviteToEvent(activeProfile)).catch((error) => {
        console.error("[ProfileCard] Failed to send invite:", error)
        toast({
          title: "Invite failed",
          description: "Please try again.",
        })
      })
      return
    }

    toast({
      title: "Invite sent",
      description: `Invite ${activeProfile.displayName} to your next event.`,
    })
  }

  // All hooks must be called before any early returns
  const adjacentProfiles = useMemo(() => {
    if (!profiles.length) return []
    const safeActiveIndex = Math.min(Math.max(currentIndex, 0), profiles.length - 1)
    return [1, 2].flatMap((offset) => {
      const items: Array<{ profile: ProfileCardProfile; index: number; side: "left" | "right"; offset: number }> = []

      if (loopNavigation || safeActiveIndex - offset >= 0) {
        const leftIndex = loopNavigation
          ? (safeActiveIndex - offset + profiles.length) % profiles.length
          : safeActiveIndex - offset
        if (leftIndex !== safeActiveIndex && leftIndex >= 0 && leftIndex < profiles.length) {
          items.push({ profile: profiles[leftIndex], index: leftIndex, side: "left", offset })
        }
      }

      if (loopNavigation || safeActiveIndex + offset < profiles.length) {
        const rightIndex = loopNavigation
          ? (safeActiveIndex + offset) % profiles.length
          : safeActiveIndex + offset
        if (rightIndex !== safeActiveIndex && rightIndex >= 0 && rightIndex < profiles.length) {
          items.push({ profile: profiles[rightIndex], index: rightIndex, side: "right", offset })
        }
      }

      return items
    })
  }, [currentIndex, profiles, loopNavigation])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (profiles.length === 0) return
      const safeActiveIndex = Math.min(Math.max(currentIndex, 0), profiles.length - 1)
      if (safeActiveIndex < profiles.length - 1) {
        setIsAnimating(true)
        setCurrentIndex((prev) => Math.min(prev + 1, profiles.length - 1))
        window.setTimeout(() => setIsAnimating(false), 320)
      }
      setSwipeDirection(null)
      setSwipeOffset(0)
    },
    onSwipedRight: () => {
      if (profiles.length === 0) return
      const safeActiveIndex = Math.min(Math.max(currentIndex, 0), profiles.length - 1)
      if (safeActiveIndex > 0) {
        setIsAnimating(true)
        setCurrentIndex((prev) => Math.max(prev - 1, 0))
        window.setTimeout(() => setIsAnimating(false), 320)
      }
      setSwipeDirection(null)
      setSwipeOffset(0)
    },
    onSwipedDown: () => {
      if (verticalOffset > 100 && onClose) {
        setIsClosing(true)
        window.setTimeout(() => {
          onClose()
          setIsClosing(false)
        }, 400)
      }
      setVerticalOffset(0)
    },
    onSwiped: () => {
      setSwipeDirection(null)
      setSwipeOffset(0)
      if (verticalOffset < 100) {
        setVerticalOffset(0)
      }
    },
    onSwiping: (event) => {
      const targetNode = (event.event?.target as Node | null) ?? null
      if (targetNode && scrollContainerRef.current?.contains(targetNode)) {
        return
      }

      if (event.dir === "Down" && event.deltaY > 0) {
        const offset = Math.min(300, event.deltaY * 0.5)
        setVerticalOffset(offset)
      } else if (event.dir === "Left" || event.dir === "Right") {
        const maxOffset = 100
        const offset = Math.max(-maxOffset, Math.min(maxOffset, event.deltaX * 0.3))
        setSwipeOffset(offset)
        if (Math.abs(event.deltaX) > 20) {
          setSwipeDirection(event.deltaX < 0 ? "left" : "right")
        }
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: false,
  })

  useEffect(() => {
    if (profiles.length === 0) return
    const handleKeyDown = (event: KeyboardEvent) => {
      const safeActiveIndex = Math.min(Math.max(currentIndex, 0), profiles.length - 1)
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        if (safeActiveIndex > 0) {
          setIsAnimating(true)
          setCurrentIndex((prev) => Math.max(prev - 1, 0))
          window.setTimeout(() => setIsAnimating(false), 320)
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        if (safeActiveIndex < profiles.length - 1) {
          setIsAnimating(true)
          setCurrentIndex((prev) => Math.min(prev + 1, profiles.length - 1))
          window.setTimeout(() => setIsAnimating(false), 320)
        }
      } else if (event.key === "Escape" && onClose) {
        event.preventDefault()
        setIsClosing(true)
        window.setTimeout(() => {
          onClose()
          setIsClosing(false)
        }, 400)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, profiles, onClose])

  // Early return after all hooks
  if (profiles.length === 0) {
    return null
  }

  const isFavorited = favorites.has(activeProfile.id)

  const containerTransform = isClosing
    ? "translateY(100vh) scale(0.9)"
    : `translateX(${swipeOffset}px) translateY(${verticalOffset}px) rotate(${swipeOffset * 0.05}deg)`
  const containerOpacity = verticalOffset > 0 ? Math.max(0.45, 1 - verticalOffset / 260) : 1

  const compatibilityScore = Math.min(Math.max(activeProfile.compatibilityScore ?? 85, 0), 100)
  const compatibilityLabel = activeProfile.compatibilityBlurb ?? "Great language synergy"
  const levelBadge =
    activeProfile.levelBadge ?? ({ title: "Language Explorer", tier: "Level 6" } as { title: string; tier: string })
  const teaches =
    activeProfile.teaches ??
    [
      { flag: activeProfile.flag, language: activeProfile.language, level: activeProfile.languageLevel ?? "Native", progress: 100, description: activeProfile.description, variant: "teach" },
    ]
  const learns =
    activeProfile.learns ??
    [
      { flag: "🌍", language: "Global Practice", level: "Intermediate", progress: 60, description: "Casual chats and cultural sharing", variant: "learn" },
    ]
  const stats =
    activeProfile.stats ??
    [
      { label: "Trades", value: "25" },
      { label: "Rating", value: "4.7★" },
      { label: "Streak", value: "🔥12" },
      { label: "Hours", value: "⏱143" },
    ]
  const availabilityInfo =
    activeProfile.availabilityInfo ??
    ({
      headline: "⚡ Available for practice",
      subtitle: activeProfile.timeLeft || "Next 30 minutes",
      schedule: "📅 Usually active: Weekday evenings & weekends",
      locations: "☕ Preferred locations: Cozy cafés, video calls",
    } as ProfileAvailabilityInfo)
  const reviews = activeProfile.reviews ?? []
  const totalReviews = activeProfile.totalReviews ?? reviews.length
  const languagePairLabel =
    activeProfile.languagePairLabel ??
    `${activeProfile.flag} ${activeProfile.languageLevel ?? "Language"} Partner`
  const isOnline = activeProfile.isOnline ?? true

  const ratingStat = stats.find((stat) => stat.label.toLowerCase() === "rating")
  const ratingValue = ratingStat?.value ?? ""
  const reviewCountLabel =
    (activeProfile as any)?.reviewCount ?? (activeProfile.reviews ? activeProfile.reviews.length : undefined)
  const distanceLabel = activeProfile.distance ?? "Nearby"
  const timeToMeetLabel = activeProfile.timeLeft || "Available now"
  const rawLocation =
    activeProfile.location ??
    (availabilityInfo.locations
      ? availabilityInfo.locations.replace(/^[^:]+:\s*/i, "")
      : (activeProfile as any)?.currentLocation ?? "")

  const scheduleItems = availabilityInfo.schedule
    ? availabilityInfo.schedule
        .replace(/^[^:]+:\s*/i, "")
        .split(/[•,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : []
  const locationItems = availabilityInfo.locations
    ? availabilityInfo.locations
        .replace(/^[^:]+:\s*/i, "")
        .split(/[•,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : rawLocation
    ? [rawLocation]
    : []

  const cardBase =
    "rounded-2xl border border-white/10 bg-[#2d2d2d]/95 shadow-[0_8px_26px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.5)] p-5 sm:p-6"
  const sectionTitle =
    "text-xs font-semibold uppercase tracking-[0.3em] text-white/60 sm:text-sm flex items-center gap-2"
  const bodyText = "text-sm sm:text-base text-white/80"

  return (
    <div
      className="fixed inset-0 z-[2600] flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "hsla(var(--profile-bg),0.92)", backdropFilter: "blur(24px)", ...PROFILE_TOKENS }}
      onClick={handleClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, hsla(var(--glow-cyan),0.22), transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, hsla(var(--glow-purple),0.22), transparent 70%)", filter: "blur(110px)" }} />
      </div>

      <div
        {...swipeHandlers}
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        ref={modalRef}
        className={`relative grid w-full max-w-6xl grid-rows-[auto,1fr] overflow-hidden rounded-[36px] border border-white/10 bg-[rgba(27,27,35,0.95)] shadow-[0_60px_180px_rgba(5,8,25,0.75)] backdrop-blur-[32px] transition-all duration-300 ease-out focus:outline-none lg:grid-cols-[360px,1fr] lg:grid-rows-[auto] lg:max-h-[88vh] ${
          isClosing ? "opacity-0" : "profile-card-enter"
        } ${showBoundaryFeedback === "left" ? "animate-bounce-left" : ""} ${showBoundaryFeedback === "right" ? "animate-bounce-right" : ""}`}
        style={{ transform: containerTransform, opacity: containerOpacity }}
      >
        <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-[0.18]" />

        <div className="relative flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8 lg:col-span-2 lg:sticky lg:top-0 lg:z-10 lg:bg-[rgba(27,27,35,0.95)] lg:backdrop-blur-[32px]">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevious}
            disabled={isAnimating}
            className="h-12 w-12 rounded-full border border-white/15 bg-[#21212c]/70 text-white transition hover:bg-[#2d2d38]/80 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={handleAddNoteClick}
              className="rounded-full border border-white/10 bg-[#2d2d35]/80 px-4 py-1 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(10,10,20,0.4)] transition hover:bg-[#34343f]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60"
            >
              Add Note
            </button>
            <span className="mt-1 text-xs font-medium text-white/55">
              {activeIndex + 1} / {profiles.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFavorite}
              className={`h-12 w-12 rounded-full border border-white/15 text-white transition ${
                isFavorited ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-[#21212c]/70 hover:bg-[#2d2d38]/80"
              } ${justLiked ? "animate-heart-bounce" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNext}
              disabled={isAnimating}
              className="h-12 w-12 rounded-full border border-[#00d9ff]/40 bg-[#0f1b25]/70 text-[#7bdefd] transition hover:bg-[#112433]/80 disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          tabIndex={0}
          className="relative flex-1 overflow-y-auto pt-2 focus:outline-none lg:max-h-[calc(88vh-96px)] lg:pt-4"
        >
          <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 gap-12 text-white lg:grid-cols-[360px,1fr] lg:items-start lg:gap-16">
              <div className="flex flex-col items-center text-center lg:sticky lg:top-24 lg:mt-4 lg:items-start lg:space-y-6 lg:text-left">
                <div className="relative flex flex-col items-center lg:items-start">
                  <div className="relative mb-10">
                    <div
                      className="absolute inset-0 rounded-full blur-3xl"
                      style={{ background: "radial-gradient(circle, rgba(0,217,255,0.25) 0%, rgba(14,23,36,0.05) 65%)" }}
                    />
                    <div className="relative flex h-32 w-32 items-center justify-center shadow-[0_16px_36px_rgba(8,14,45,0.55)]">
                      <div
                        className="absolute inset-0 rounded-full opacity-90"
                        style={{ background: "linear-gradient(135deg, #00D9FF, #667EEA)" }}
                      />
                      <div className="absolute inset-[6px] rounded-full bg-[#13141d] p-[4px]">
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          {activeProfile.avatarUrl ? (
                            <img
                              src={activeProfile.avatarUrl}
                              alt={activeProfile.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700/40 to-slate-900/60 text-4xl font-semibold">
                              {activeProfile.avatar ?? activeProfile.displayName.charAt(0)}
                            </div>
                          )}
                        </div>
                        {isOnline && (
                          <span className="absolute -bottom-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#11121c] bg-[#00FF88] shadow-[0_0_16px_rgba(0,255,136,0.75)]" />
                        )}
                      </div>
                    </div>

                    <div className="absolute inset-x-0 -bottom-9 flex justify-center lg:justify-start">
                      <span className="flex items-center gap-2 rounded-full bg-[#2b2b36]/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#c7d3ff] shadow-[0_14px_36px_rgba(10,12,28,0.55)]">
                        {languagePairLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
                    Handle
                  </div>
                  <div className="mt-1 text-sm text-white/65">{activeProfile.username}</div>
                  <h2 className="mt-3 text-[28px] font-semibold text-white sm:text-[30px]">
            {activeProfile.displayName}
          </h2>
                  <div className="mt-3 flex items-center gap-3 text-sm text-white/75 sm:text-base">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-white/60" />
                      {distanceLabel}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="flex items-center gap-1 text-[#00FF88]">
                      <Zap className="h-4 w-4" />
                      {timeToMeetLabel}
                    </span>
                  </div>
                  {(ratingValue || typeof reviewCountLabel === "number") && (
                    <div className="mt-5 flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm text-white/80 lg:items-start">
                      {ratingValue && (
                        <span className="text-base font-semibold text-white">
                          ⭐ {ratingValue}
                        </span>
                      )}
                      {typeof reviewCountLabel === "number" && (
                        <span className="text-xs uppercase tracking-[0.25em] text-white/45">
                          Based on {reviewCountLabel} review{reviewCountLabel === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              </div>
              <div className="flex w-full flex-col gap-10 text-left lg:pr-3">
                <section>
                  <h3 className={sectionTitle}>📊 STATS</h3>
                  <div className={`${cardBase} mt-4`}>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {stats.map((stat, idx) => (
                        <div
                          key={`stat-${stat.label}-${idx}`}
                          className="rounded-xl bg-[#3a3a3a]/85 px-4 py-4 text-center shadow-inner shadow-black/20"
                        >
                          <p className="text-2xl font-semibold text-white">{stat.value}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>🎯 MATCH SCORE</h3>
                  <div className={`${cardBase} mt-4 space-y-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-white">
                      <span className="text-xl font-semibold sm:text-2xl">
                        {compatibilityScore}% compatibility
                      </span>
                      <span className="text-sm font-semibold text-[#5eead4]">
                        {compatibilityLabel}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#3a3a3a]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00FF88] via-[#00f0cc] to-[#00D9FF]"
                        style={{ width: `${compatibilityScore}%` }}
                      />
                    </div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                      {timeToMeetLabel}
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>🗣️ LANGUAGES</h3>
                  <div className={`${cardBase} mt-4 space-y-8`}>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/45">Can teach</p>
                      <div className="mt-3 space-y-4">
                        {teaches.map((card, idx) => (
                          <div
                            key={`teach-${card.language}-${idx}`}
                            className="rounded-2xl border border-white/10 bg-[#3a3a3a]/90 p-5"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{card.flag}</span>
                              <div className="flex-1">
                                <p className="text-lg font-semibold text-white sm:text-xl">
                                  {card.language}
                                </p>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                                  {card.level}
                                </p>
                              </div>
                              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
                                Native
          </span>
                            </div>
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1d1d25]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D9FF]"
                                style={{ width: `${card.progress ?? 100}%` }}
                              />
                            </div>
                            {card.description && (
                              <p className="mt-4 text-sm text-white/70">“{card.description}”</p>
                            )}
                          </div>
                        ))}
                      </div>
        </div>

                    {learns.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Wants to learn</p>
                        <div className="mt-3 space-y-4">
                          {learns.map((card, idx) => (
                            <div
                              key={`learn-${card.language}-${idx}`}
                              className="rounded-2xl border border-white/10 bg-[#2e2e48]/90 p-5"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{card.flag}</span>
                                <div className="flex-1">
                                  <p className="text-lg font-semibold text-white sm:text-xl">
                                    {card.language}
                                  </p>
                                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                                    {card.level}
                                  </p>
                                </div>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
                                  Learning
                                </span>
                              </div>
                              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1e1f2d]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#667EEA] to-[#9F7AEA]"
                                  style={{ width: `${card.progress ?? 55}%` }}
                                />
                              </div>
                              {card.description && (
                                <p className="mt-4 text-sm text-white/70">“{card.description}”</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {activeProfile.description && (
                  <section>
                    <h3 className={sectionTitle}>💬 ABOUT</h3>
                    <div className={`${cardBase} mt-4`}>
                      <p className="text-base leading-relaxed text-white/80">
                        “{activeProfile.description}”
                      </p>
                    </div>
                  </section>
                )}

                <section>
                  <h3 className={sectionTitle}>📍 LOCATION & AVAILABILITY</h3>
                  <div className={`${cardBase} mt-4 space-y-4`}>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Distance</p>
                        <p className="mt-2 text-base font-semibold text-white">{distanceLabel}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Time to meet</p>
                        <p className="mt-2 text-base font-semibold text-[#00FF88]">{timeToMeetLabel}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">City</p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {locationItems[0] ?? "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#1f1f29]/80 px-5 py-4 text-sm text-white/80">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Status</p>
                      <p className="mt-2 flex items-center gap-2 text-base font-semibold text-[#00FF88]">
              <Zap className="h-4 w-4" />
                        {availabilityInfo.headline}
                      </p>
                      {availabilityInfo.subtitle && (
                        <p className="mt-1 text-sm text-white/70">{availabilityInfo.subtitle}</p>
                      )}
            </div>
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>🗓️ SCHEDULE</h3>
                  <div className={`${cardBase} mt-4 space-y-5`}>
                    {scheduleItems.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Usually active</p>
                        <ul className="mt-3 space-y-2 text-sm text-white/75">
                          {scheduleItems.map((item, idx) => (
                            <li key={`schedule-${idx}`} className="flex items-center gap-2">
                              <span className="text-xs text-white/35">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {locationItems.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Preferred locations</p>
                        <ul className="mt-3 space-y-2 text-sm text-white/75">
                          {locationItems.map((item, idx) => (
                            <li key={`pref-${idx}`} className="flex items-center gap-2">
                              <span className="text-xs text-white/35">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className={sectionTitle}>💬 REVIEWS</h3>
                  <div className={`${cardBase} mt-4 space-y-4`}>
                    {reviews.length > 0 ? (
                      reviews.map((review, idx) => (
                        <div
                          key={`review-${idx}`}
                          className="rounded-2xl border border-[#FFD700]/40 bg-[#2d2d37]/95 px-5 py-4 text-sm text-white/80"
                        >
                          <div className="flex items-center gap-1 text-[#FFD700]">
                            {Array.from({ length: review.stars }).map((_, starIdx) => (
                              <span key={`star-${starIdx}`} className="text-base leading-none">
                                ★
              </span>
                            ))}
            </div>
                          <p className="mt-3 text-sm text-white">{review.text}</p>
                          <p className="mt-3 text-xs text-white/55">{review.author}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-[#242430]/85 px-5 py-6 text-center text-sm text-white/70">
                        No reviews yet. Start the first conversation!
                        <p className="mt-3 text-xs text-white/45">
                          Be the first to practice with {activeProfile.displayName.split(" ")[0] ?? activeProfile.displayName}.
                        </p>
                      </div>
                    )}
                    {totalReviews > reviews.length && (
                      <button
                        type="button"
                        className="text-sm font-semibold text-[#667EEA] underline-offset-4 hover:underline sm:text-base"
                      >
                        View all {totalReviews} reviews →
                      </button>
                    )}
                  </div>
                </section>
          </div>

            <div className="mt-10 space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <Button
                  onClick={handleAskToMatchClick}
                  disabled={isMatchPending}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#00FF88] via-[#00E0AF] to-[#00D9FF] text-base sm:text-lg md:text-xl font-semibold text-slate-900 shadow-[0_14px_45px_rgba(0,255,136,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(0,255,136,0.45)] disabled:translate-y-0 disabled:opacity-60"
                >
                  <span className="text-xl">🤝</span>
                  <span>{isMatchPending ? "PROPOSING TRADE..." : "PROPOSE LANGUAGE TRADE"}</span>
                </Button>
                <Button
                  onClick={handleSendMessageClick}
                  disabled={isMessagePending}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#667EEA] text-base sm:text-lg md:text-xl font-semibold text-white shadow-[0_14px_45px_rgba(102,126,234,0.4)] transition hover:-translate-y-0.5 hover:bg-[#7b8dff] disabled:translate-y-0 disabled:opacity-60"
                >
                  <span className="text-xl">💬</span>
                  <span>{isMessagePending ? "OPENING CHAT..." : "START CONVERSATION"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleInviteToEventClick}
                  disabled={isInvitePending}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/20 bg-transparent text-base sm:text-lg md:text-xl font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:shadow-[0_18px_50px_rgba(102,126,234,0.35)] disabled:translate-y-0 disabled:opacity-60"
                >
                  <span className="text-xl">🎉</span>
                  <span>{isInvitePending ? "SENDING INVITE..." : "INVITE TO PRACTICE EVENT"}</span>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="flex h-12 items-center justify-center gap-3 rounded-xl border border-white/20 bg-transparent text-sm sm:text-base font-semibold text-white/75 transition hover:-translate-y-0.5 hover:border-white/40 hover:text-white"
                >
                  <span className="text-lg">⭐</span>
                  SAVE
                </Button>
                <Button
                  variant="outline"
                  className="flex h-12 items-center justify-center gap-3 rounded-xl border border-white/20 bg-transparent text-sm sm:text-base font-semibold text-white/75 transition hover:-translate-y-0.5 hover:border-white/40 hover:text-white"
                >
                  <span className="text-lg">📤</span>
                  SHARE PROFILE
                </Button>
              </div>

              <p className="text-center text-xs sm:text-sm text-white/55">
                Swipe sideways to peek other profiles • Drag down to close
              </p>
            </div>
          </div>

          <div
            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
              swipeDirection === "right" ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="rounded-full border border-[#00d9ff]/40 bg-[#102231]/80 p-3 backdrop-blur-sm">
              <ArrowLeft className="h-5 w-5 text-[#7bdcff]" />
            </div>
          </div>
          <div
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
              swipeDirection === "left" ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="rounded-full border border-[#00d9ff]/40 bg-[#102231]/80 p-3 backdrop-blur-sm">
              <ArrowRight className="h-5 w-5 text-[#7bdcff]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard
