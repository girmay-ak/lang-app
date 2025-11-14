"use client"

import { ChevronLeft, Flame, Trophy, Calendar, Users } from "lucide-react"

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

interface ProgressViewProps {
  onBack: () => void
  user: User | null
}

export function ProgressView({ onBack, user }: ProgressViewProps) {
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

