"use client"

import { X, User, Settings, Globe, Heart, HelpCircle, LogOut, Award, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isPermanent?: boolean
}

export function Sidebar({ isOpen, onClose, isPermanent = false }: SidebarProps) {
  return (
    <>
      {isOpen && !isPermanent && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <div
        className={`${isPermanent ? "relative" : "fixed"} top-0 left-0 h-full w-80 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-xl border-r-2 border-purple-200 ${isPermanent ? "" : "z-50"} transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen || isPermanent ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Menu</h2>
              {!isPermanent && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-foreground hover:bg-purple-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-3 border-white shadow-lg">
                    <AvatarImage src="/diverse-person-smiling.png" />
                    <AvatarFallback className="bg-white text-purple-600 text-xl font-bold">JD</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                    <span className="text-lg">🇺🇸</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">John Doe</p>
                  <p className="text-sm text-white/90">Learning Spanish</p>
                  <Badge className="mt-1 bg-white/20 text-white border-white/30 text-xs">Level 3</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">7 day streak</span>
                  <span className="font-bold">70%</span>
                </div>
                <Progress value={70} className="h-2 bg-white/20" />
              </div>
            </div>
          </div>

          <Separator className="bg-purple-200" />

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <User className="h-5 w-5 text-purple-600" />
              <span>My Profile</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <Globe className="h-5 w-5 text-blue-600" />
              <span>Languages</span>
              <Badge className="ml-auto bg-blue-100 text-blue-700 border-0">3</Badge>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <Heart className="h-5 w-5 text-pink-600" />
              <span>Favorites</span>
              <Badge className="ml-auto bg-pink-100 text-pink-700 border-0">12</Badge>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <Award className="h-5 w-5 text-yellow-600" />
              <span>Achievements</span>
              <Badge className="ml-auto bg-yellow-100 text-yellow-700 border-0">8</Badge>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Progress</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Community</span>
            </Button>

            <Separator className="my-4 bg-purple-200" />

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <span>Settings</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-foreground hover:bg-purple-100 rounded-xl font-medium"
            >
              <HelpCircle className="h-5 w-5 text-gray-600" />
              <span>Help & Support</span>
            </Button>
          </nav>

          <Separator className="bg-purple-200" />

          {/* Footer */}
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-red-600 hover:bg-red-50 rounded-xl font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
