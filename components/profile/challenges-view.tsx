"use client"

import { ChevronLeft, Target, Calendar, Clock } from "lucide-react"

interface ChallengesViewProps {
  onBack: () => void
}

export function ChallengesView({ onBack }: ChallengesViewProps) {
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

