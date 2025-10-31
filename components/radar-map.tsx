"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
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
}

interface RadarMapProps {
  users: User[]
  onUserClick: (user: User) => void
}

export function RadarMap({ users, onUserClick }: RadarMapProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)

  // Position users in a circular pattern
  const positions = [
    { top: "15%", left: "50%", transform: "translate(-50%, -50%)" }, // Michael - top
    { top: "40%", left: "15%", transform: "translate(-50%, -50%)" }, // Alicja - left
    { top: "50%", left: "85%", transform: "translate(-50%, -50%)" }, // Richard - right
    { top: "70%", left: "50%", transform: "translate(-50%, -50%)" }, // Emily - bottom
    { top: "75%", left: "25%", transform: "translate(-50%, -50%)" }, // Jessica - bottom left
  ]

  return (
    <div className="radar-container">
      {/* Radar circles */}
      <div className="radar-circles">
        {[200, 300, 400, 500].map((size, i) => (
          <div
            key={i}
            className="radar-circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        ))}
      </div>

      {/* Radar lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <div
            key={i}
            className="radar-line"
            style={{
              transform: `rotate(${angle}deg)`,
            }}
          />
        ))}
      </div>

      {/* Radar sweep effect */}
      <div className="radar-sweep" />

      {/* Center point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse" />

      {/* User avatars */}
      {users.slice(0, 5).map((user, index) => (
        <button
          key={user.id}
          onClick={() => onUserClick(user)}
          onMouseEnter={() => setHoveredUser(user.id)}
          onMouseLeave={() => setHoveredUser(null)}
          className="absolute transition-all duration-300 hover:scale-110"
          style={positions[index]}
        >
          <div className="relative flex flex-col items-center gap-1">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white shadow-2xl ring-4 ring-blue-500/30">
                <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-xl">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-gray-800 flex items-center justify-center text-lg shadow-lg">
                {user.flag}
              </div>
              {/* End of flag badge */}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow-lg">{user.name}</span>
            <span className="text-white/80 text-xs drop-shadow-lg">{user.distance}</span>
            {/* End of name and distance */}
          </div>
        </button>
      ))}

      {/* Blue location pins scattered around */}
      {[
        { top: "25%", left: "30%" },
        { top: "35%", left: "70%" },
        { top: "60%", left: "40%" },
        { top: "80%", left: "60%" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-8 h-8 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center animate-pulse"
          style={pos}
        >
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      ))}
    </div>
  )
}
