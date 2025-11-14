"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  ChevronLeft,
  Settings,
  MapPin,
  MessageCircle,
  Flame,
  Star,
  ChevronRight,
  Trophy,
  Target,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Crown,
  Bell,
  MapPinIcon,
  Moon,
  Volume2,
  Edit3,
  Lock,
  Ban,
  HelpCircle,
  Mail,
  Scale,
  Info,
  LogOut,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ProgressView } from "./profile/progress-view"
import { ChallengesView } from "./profile/challenges-view"
import { SettingsView } from "./profile/settings-view"

type ProfileTab = "profile" | "progress" | "challenges" | "settings"

interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  languages_speak: string[]
  languages_learn: string[]
  city: string | null
  latitude: number | null
  longitude: number | null
  is_available: boolean
  created_at: string
}

export function ProfileView() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        if (!session) {
          console.log("[v0] Auth session missing!")
          setError("Please log in to view your profile")
          setIsLoading(false)
          return
        }

        console.log("[v0] Active session found:", session.user.id)

        const authUser = session.user

        console.log("[v0] Fetching user data for:", authUser.id)

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (userError) {
          console.error("[v0] Error fetching user data:", userError)
          throw userError
        }

        console.log("[v0] User data fetched:", userData)
        setUser(userData)
        setError(null)
      } catch (err: any) {
        console.error("[v0] Profile fetch error:", err)
        setError(err.message || "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      localStorage.removeItem("onboarding_completed")
      localStorage.removeItem("user_profile")
      localStorage.removeItem("user_id")
      localStorage.removeItem("pending_user_profile")
      localStorage.removeItem("signup_location")
      localStorage.removeItem("resume_signup_step")
      window.location.href = "/auth/login"
    } catch (logoutError) {
      console.error("[v0] Logout error:", logoutError)
      setIsLoggingOut(false)
    }
  }

  if (activeTab === "progress") {
    return <ProgressView onBack={() => setActiveTab("profile")} user={user} />
  }

  if (activeTab === "challenges") {
    return <ChallengesView onBack={() => setActiveTab("profile")} />
  }

  if (activeTab === "settings") {
    return <SettingsView onBack={() => setActiveTab("profile")} />
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 px-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Profile</h3>
          <p className="text-gray-400 mb-6">{error || "Please try logging in again"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const userInitials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  const speakLanguages = Array.isArray(user.languages_speak) ? user.languages_speak : []
  const learnLanguages = Array.isArray(user.languages_learn) ? user.languages_learn : []
  const joinDate = user.created_at ? new Date(user.created_at) : null

  const achievementBadges = [
    {
      icon: <Trophy className="h-5 w-5 text-amber-300" />,
      title: "Language Café Member",
      subtitle: "Active in Den Haag community",
    },
    {
      icon: <Flame className="h-5 w-5 text-orange-400" />,
      title: "Consistency Spark",
      subtitle: "Keep your streak alive",
    },
    {
      icon: <Star className="h-5 w-5 text-cyan-300" />,
      title: "Top Rated Exchange",
      subtitle: "Great sessions build trust",
    },
  ]

  const statCards = [
    { value: "0", label: "Chats", accent: "from-sky-400/30 to-sky-500/20" },
    { value: "0", label: "Streak", accent: "from-violet-400/30 to-violet-500/20" },
    { value: "5.0", label: "Rating", accent: "from-emerald-400/30 to-emerald-500/20" },
  ]

  return (
    <div className="relative min-h-full overflow-y-auto bg-[#050618] text-white pb-36">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b122a] via-[#101836] to-[#050618]" />
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#6366f1]/30 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-[#ec4899]/20 blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[#38bdf8]/20 blur-[140px]" />
        {[...Array(28)].map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-white/30 animate-float-up"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.6}s`,
              opacity: 0.2 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-6 pt-8 lg:px-10">
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition hover:bg-white/15"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5 text-white transition group-hover:-translate-x-0.5" />
          </button>
          <h1 className="text-lg font-semibold uppercase tracking-[0.4em] text-white/60">Profile</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("progress")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition hover:bg-white/15"
              aria-label="Progress"
            >
              <Crown className="h-5 w-5 text-white/80" />
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition hover:bg-white/15"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-white/80" />
            </button>
          </div>
        </header>

        <section className="rounded-[32px] border border-white/15 bg-white/10 p-8 shadow-[0_24px_80px_rgba(14,22,54,0.55)] backdrop-blur-[32px] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-6">
              <div className="relative">
                <Avatar className="h-28 w-28 rounded-3xl border-4 border-white/25 shadow-[0_18px_55px_rgba(88,101,242,0.45)]">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name || "Profile"} />
                  ) : (
                    <AvatarFallback className="rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-4xl font-semibold text-white">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-lg">
                  Available
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-white">{user.full_name || "Language Explorer"}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {user.city || "Den Haag"}
                  </span>
                  {joinDate && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {joinDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-56">
              <button
                onClick={() => setActiveTab("progress")}
                className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#ec4899] px-5 py-4 text-left shadow-[0_22px_60px_rgba(96,119,255,0.45)] transition hover:shadow-[0_28px_80px_rgba(96,119,255,0.55)]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Progress</p>
                  <p className="text-base font-semibold text-white">Level up journey</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/80 transition group-hover:translate-x-1" />
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} px-4 py-5 text-center shadow-inner`}
              >
                <div className="text-3xl font-semibold text-white">{card.value}</div>
                <div className="text-xs uppercase tracking-[0.35em] text-white/50">{card.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/7 p-7 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
                  <MessageCircle className="h-4 w-4 text-emerald-300" />
                  Languages you speak
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">Help others with your strengths</h3>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {speakLanguages.length > 0 ? (
                speakLanguages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100"
                  >
                    <span>{getLanguageFlag(language)}</span>
                    {language}
                  </span>
                ))
              ) : (
                <p className="text-sm text-white/50">Add the languages you feel confident teaching.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/7 p-7 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
                  <Sparkles className="h-4 w-4 text-sky-300" />
                  Languages you’re learning
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">Practise what excites you</h3>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {learnLanguages.length > 0 ? (
                learnLanguages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100"
                  >
                    <span>{getLanguageFlag(language)}</span>
                    {language}
                  </span>
                ))
              ) : (
                <p className="text-sm text-white/50">Pick at least one language to start receiving tailored matches.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-7 backdrop-blur-2xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                  <Clock className="h-4 w-4 text-amber-300" />
                  Today’s rhythm
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Let friends know when you’re free</h3>
                <p className="mt-2 text-sm text-white/65">
                  Toggling availability helps nearby learners spot you on the map instantly.
                </p>
              </div>
              <Switch checked disabled className="scale-110" aria-readonly />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-3xl font-semibold text-white">30m</p>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Ideal session</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-3xl font-semibold text-white">Evenings</p>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Best time</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-3xl font-semibold text-white">Centrum</p>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Preferred spot</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-7 backdrop-blur-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
              <Star className="h-4 w-4 text-amber-300" />
              Highlights
            </p>
            <div className="mt-4 space-y-3">
              {achievementBadges.map((badge) => (
                <div
                  key={badge.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">{badge.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{badge.title}</p>
                    <p className="text-xs text-white/60">{badge.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab("challenges")}
            className="group flex items-center justify-between rounded-[26px] border border-white/12 bg-white/7 px-6 py-5 text-left backdrop-blur-xl transition hover:bg-white/12"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">Daily flow</p>
              <p className="text-lg font-semibold text-white">Explore challenges</p>
            </div>
            <Target className="h-6 w-6 text-white/75 transition group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className="group flex items-center justify-between rounded-[26px] border border-white/12 bg-white/7 px-6 py-5 text-left backdrop-blur-xl transition hover:bg-white/12"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">Growth</p>
              <p className="text-lg font-semibold text-white">Review progress</p>
            </div>
            <Trophy className="h-6 w-6 text-white/75 transition group-hover:translate-x-1" />
          </button>
        </section>

        <section className="mb-12 rounded-[28px] border border-white/10 bg-white/8 p-7 backdrop-blur-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
            <HelpCircle className="h-4 w-4 text-sky-300" />
            Need a hand?
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/75 transition hover:bg-white/10">
              <MessageCircle className="h-4 w-4 text-sky-300" />
              Contact support
            </button>
            <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/75 transition hover:bg-white/10">
              <Scale className="h-4 w-4 text-emerald-300" />
              Community guidelines
            </button>
            <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/75 transition hover:bg-white/10">
              <Info className="h-4 w-4 text-indigo-300" />
              FAQ & updates
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function getLanguageFlag(language: string): string {
  const flagMap: Record<string, string> = {
    English: "🇬🇧",
    Spanish: "🇪🇸",
    French: "🇫🇷",
    German: "🇩🇪",
    Italian: "🇮🇹",
    Portuguese: "🇵🇹",
    Dutch: "🇳🇱",
    Japanese: "🇯🇵",
    Korean: "🇰🇷",
    Chinese: "🇨🇳",
    Russian: "🇷🇺",
    Arabic: "🇸🇦",
  }
  return flagMap[language] || "🌍"
}

// ProgressView, ChallengesView, and SettingsView are now in separate files:
// - components/profile/progress-view.tsx
// - components/profile/challenges-view.tsx
// - components/profile/settings-view.tsx
