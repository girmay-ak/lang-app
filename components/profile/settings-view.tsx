"use client"

import { useState } from "react"
import { ChevronLeft, Settings, MapPinIcon, Moon, Volume2, Edit3, Lock, Ban, HelpCircle, Mail, Scale, Info, LogOut, Loader2, Bell, Users, Crown, Star } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

interface SettingsViewProps {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null
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
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-green-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Privacy & Safety</span>
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <Ban className="h-6 w-6 text-red-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Blocked Users</span>
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
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
          <ChevronLeft className="h-5 w-5 text-yellow-400 rotate-180" />
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
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-purple-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Contact Us</span>
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Scale className="h-6 w-6 text-cyan-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Terms & Privacy</span>
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
          </button>

          <button className="w-full bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-gray-500/20 flex items-center justify-center">
              <Info className="h-6 w-6 text-gray-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">About</span>
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
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

