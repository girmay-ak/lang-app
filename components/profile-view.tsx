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
  const supabase = createClient()

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true)

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

function ProgressView({ onBack, user }: { onBack: () => void; user: User | null }) {
  return (
    <div className="h-full overflow-y-auto bg-slate-950 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-8">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Your Progress</h1>
        <button className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors">
          <Users className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Level Card */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-center">
          <div className="text-7xl font-bold text-white mb-2">Level 17</div>
          <div className="text-xl text-white/90 mb-6">Language Master</div>
          <div className="bg-white/20 rounded-full h-3 mb-3 overflow-hidden">
            <div className="bg-white h-full rounded-full" style={{ width: "67%" }} />
          </div>
          <div className="text-sm text-white/80">2,340 / 3,500 XP to Level 18</div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-center">
          <Flame className="h-20 w-20 text-white mx-auto mb-4" />
          <div className="text-6xl font-bold text-white mb-2">24</div>
          <div className="text-xl text-white/90">Day Streak</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">127</div>
            <div className="text-sm text-gray-400">Total Chats</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">48h</div>
            <div className="text-sm text-gray-400">Practice Time</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">4.9</div>
            <div className="text-sm text-gray-400">Avg Rating</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">32</div>
            <div className="text-sm text-gray-400">Partners Met</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Achievements</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-3">💬</div>
            <div className="text-sm font-semibold text-white mb-1">First Chat</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-3">🔥</div>
            <div className="text-sm font-semibold text-white mb-1">7 Day Streak</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-3">💯</div>
            <div className="text-sm font-semibold text-white mb-1">100 Chats</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <div className="text-sm font-semibold text-white mb-1">5-Star Teacher</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <div className="text-sm font-semibold text-white mb-1">Globe Trotter</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center opacity-50">
            <div className="text-4xl mb-3">👑</div>
            <div className="text-sm font-semibold text-gray-500 mb-1">Language King</div>
          </div>
        </div>
      </div>

      {/* This Week */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">This Week</h3>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white">Monday</span>
            <span className="text-green-400 flex items-center gap-1">
              <span className="text-lg">✓</span> 45 min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white">Tuesday</span>
            <span className="text-green-400 flex items-center gap-1">
              <span className="text-lg">✓</span> 30 min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white">Wednesday</span>
            <span className="text-green-400 flex items-center gap-1">
              <span className="text-lg">✓</span> 1h 15min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white">Thursday</span>
            <span className="text-gray-500 flex items-center gap-1">
              <span className="text-lg">○</span> Not yet
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChallengesView({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full overflow-y-auto bg-slate-950 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-8">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Daily Challenges</h1>
        <button className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors">
          <Clock className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Today's Challenges */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Today's Challenges</h3>
        </div>
        <div className="space-y-3">
          {/* Chat for 15 Minutes */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💬</div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Chat for 15 Minutes</h4>
                  <p className="text-sm text-gray-400">Have a conversation with a language partner</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                +20 XP
              </span>
            </div>
            <div className="bg-slate-700/30 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: "60%" }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">9 of 15 minutes</span>
              <span className="text-gray-400">60% complete</span>
            </div>
          </div>

          {/* Meet Someone New - Completed */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🤝</div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Meet Someone New</h4>
                  <p className="text-sm text-green-300">Start a conversation with a new language partner</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-500/30 text-green-300 text-xs font-semibold rounded-full flex items-center gap-1">
                ✓ Completed
              </span>
            </div>
            <div className="bg-green-500/30 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-green-400 h-full rounded-full" style={{ width: "100%" }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-300">1 of 1 partners</span>
              <span className="text-green-300">+25 XP Earned!</span>
            </div>
          </div>

          {/* Post a Story */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📸</div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Post a Story</h4>
                  <p className="text-sm text-gray-400">Share your language learning journey</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                +10 XP
              </span>
            </div>
            <div className="text-sm text-gray-500">Not started • 0% complete</div>
          </div>
        </div>
      </div>

      {/* Weekly Challenges */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Weekly Challenges</h3>
        </div>
        <div className="space-y-3">
          {/* Practice 5 Days */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔥</div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Practice 5 Days This Week</h4>
                  <p className="text-sm text-gray-400">Keep your streak alive and chat 5 different days</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                +100 XP
              </span>
            </div>
            <div className="bg-slate-700/30 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: "60%" }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">3 of 5 days</span>
              <span className="text-gray-400">2 days remaining</span>
            </div>
          </div>

          {/* Try a New Language */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🌍</div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Try a New Language</h4>
                  <p className="text-sm text-gray-400">Practice a language you haven't tried before</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                +150 XP
              </span>
            </div>
            <div className="text-sm text-gray-500">Not started</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsView({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear all localStorage data
      localStorage.removeItem("onboarding_completed")
      localStorage.removeItem("user_profile")
      localStorage.removeItem("user_id")
      localStorage.removeItem("pending_user_profile")
      localStorage.removeItem("signup_location")
      localStorage.removeItem("resume_signup_step")

      // Force a full page reload to ensure clean state
      window.location.href = "/auth/login"
    } catch (err: any) {
      console.error("[v0] Logout error:", err)
      alert("Failed to log out. Please try again.")
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-950 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-8">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <div className="w-10" />
      </div>

      {/* General Section */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">General</h3>
        </div>
        <div className="space-y-3">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Bell className="h-6 w-6 text-blue-400" />
            </div>
            <span className="flex-1 text-white font-medium">Notifications</span>
            <Switch defaultChecked className="data-[state=checked]:bg-green-500" />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <MapPinIcon className="h-6 w-6 text-red-400" />
            </div>
            <span className="flex-1 text-white font-medium">Location Services</span>
            <Switch defaultChecked className="data-[state=checked]:bg-green-500" />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Moon className="h-6 w-6 text-purple-400" />
            </div>
            <span className="flex-1 text-white font-medium">Dark Mode</span>
            <Switch defaultChecked className="data-[state=checked]:bg-green-500" />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <Volume2 className="h-6 w-6 text-orange-400" />
            </div>
            <span className="flex-1 text-white font-medium">Sound Effects</span>
            <Switch className="data-[state=checked]:bg-green-500" />
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account</h3>
        </div>
        <div className="space-y-3">
          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
              <Edit3 className="h-6 w-6 text-yellow-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Edit Languages</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-green-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Privacy & Safety</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <Ban className="h-6 w-6 text-red-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Blocked Users</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Premium Section */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-yellow-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Premium</h3>
        </div>
        <button className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4 hover:from-yellow-500/30 hover:to-orange-500/30 transition-colors">
          <div className="h-12 w-12 rounded-2xl bg-yellow-500/30 flex items-center justify-center">
            <Star className="h-6 w-6 text-yellow-400" />
          </div>
          <span className="flex-1 text-left text-white font-medium">Upgrade to Premium</span>
          <ChevronRight className="h-5 w-5 text-yellow-400" />
        </button>
      </div>

      {/* Support Section */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Support</h3>
        </div>
        <div className="space-y-3">
          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-blue-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Help Center</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-purple-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Contact Us</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Scale className="h-6 w-6 text-cyan-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Terms & Privacy</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-gray-500/20 flex items-center justify-center">
              <Info className="h-6 w-6 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">About</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Log Out Button */}
      <div className="px-6 mb-6">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full bg-slate-800/30 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-5 w-5 text-red-400 animate-spin" />
              <span className="text-red-400 font-semibold">Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-semibold">Log Out</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
