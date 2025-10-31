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

  return (
    <div className="h-full overflow-y-auto bg-slate-950 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-8">
        <button className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Your Profile</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("settings")}
            className="h-10 w-10 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-slate-800/70 transition-colors"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={async () => {
              try {
                setIsLoggingOut(true)
                const { error } = await supabase.auth.signOut()
                if (error) throw error
                localStorage.removeItem("onboarding_completed")
                localStorage.removeItem("user_profile")
                localStorage.removeItem("user_id")
                localStorage.removeItem("pending_user_profile")
                localStorage.removeItem("signup_location")
                localStorage.removeItem("resume_signup_step")
                window.location.href = "/auth/login"
              } catch (err) {
                console.error("[v0] Logout error:", err)
                setIsLoggingOut(false)
              }
            }}
            disabled={isLoggingOut}
            className="h-10 px-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-semibold">{isLoggingOut ? "Logging out..." : "Log Out"}</span>
          </button>
        </div>
      </div>

      {/* Profile Avatar & Info */}
      <div className="flex flex-col items-center px-6 mb-8">
        <Avatar className="h-32 w-32 border-4 border-white/20 mb-4">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name || "Profile"} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-5xl font-semibold">
              {userInitials}
            </AvatarFallback>
          )}
        </Avatar>
        <h2 className="text-2xl font-bold text-white mb-2">{user.full_name || "User"}</h2>
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{user.city || user.email}</span>
        </div>
        <div className="w-full max-w-sm mt-5">
          <button
            onClick={async () => {
              try {
                setIsLoggingOut(true)
                const { error } = await supabase.auth.signOut()
                if (error) throw error
                localStorage.removeItem("onboarding_completed")
                localStorage.removeItem("user_profile")
                localStorage.removeItem("user_id")
                localStorage.removeItem("pending_user_profile")
                localStorage.removeItem("signup_location")
                localStorage.removeItem("resume_signup_step")
                window.location.href = "/auth/login"
              } catch (err) {
                console.error("[v0] Logout error:", err)
                setIsLoggingOut(false)
              }
            }}
            disabled={isLoggingOut}
            className="w-full mt-4 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-3 rounded-2xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            {isLoggingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-3 bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">0</div>
            <div className="text-xs text-gray-400">Chats</div>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="text-3xl font-bold text-white mb-1">0</div>
            <div className="text-xs text-gray-400">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">5.0</div>
            <div className="text-xs text-gray-400">Rating</div>
          </div>
        </div>
      </div>

      {/* Learning Section */}
      {user.languages_learn && user.languages_learn.length > 0 && (
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Learning</h3>
          </div>
          <div className="space-y-3">
            {user.languages_learn.map((lang) => (
              <div
                key={lang}
                className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4"
              >
                <span className="text-3xl">{getLanguageFlag(lang)}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">{lang}</div>
                </div>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                  LEARNING
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Can Teach Section */}
      {user.languages_speak && user.languages_speak.length > 0 && (
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-green-400" />
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Can Teach</h3>
          </div>
          <div className="space-y-3">
            {user.languages_speak.map((lang) => (
              <div
                key={lang}
                className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4"
              >
                <span className="text-3xl">{getLanguageFlag(lang)}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">{lang}</div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                  CAN TEACH
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-6 mb-6 space-y-3">
        <button
          onClick={() => setActiveTab("progress")}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <Trophy className="h-5 w-5" />
          View Progress & Achievements
        </button>
        <button
          onClick={() => setActiveTab("challenges")}
          className="w-full bg-slate-800/50 backdrop-blur-xl border border-white/10 hover:bg-slate-800/70 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <Target className="h-5 w-5" />
          Daily Challenges
        </button>
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
