"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Filter, Users, Zap } from "lucide-react"
import { MapboxMap } from "./mapbox-map"
import { FilterPanel } from "./filter-panel"

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

const mockUsers: User[] = [
  {
    id: "1",
    name: "Maria",
    language: "Spanish",
    flag: "🇪🇸",
    distance: "0.3 km",
    lat: 52.0705,
    lng: 4.3007,
    bio: "Native Spanish speaker 🇪🇸 learning Dutch 🇳🇱. Love practicing over coffee!",
    availableFor: "30 min",
    image: "/diverse-woman-smiling.png",
    isOnline: true,
    rating: 4.9,
    responseTime: "2 min",
    currentLocation: "Starbucks, Spui",
    availableNow: true,
    timePreference: "30-60 min sessions",
    languagesSpoken: [
      { language: "Spanish", flag: "🇪🇸", level: "Native" },
      { language: "English", flag: "🇺🇸", level: "Fluent" },
      { language: "Dutch", flag: "🇳🇱", level: "Learning" },
    ],
  },
  {
    id: "2",
    name: "Yuki",
    language: "Japanese",
    flag: "🇯🇵",
    distance: "0.5 km",
    lat: 52.0715,
    lng: 4.3017,
    bio: "Native Japanese speaker 🇯🇵 teaching Japanese, learning English 🇬🇧",
    availableFor: "1 hr",
    image: "/serene-asian-woman.png",
    isOnline: true,
    rating: 5.0,
    responseTime: "1 min",
    currentLocation: "Haagse Bos Park",
    availableNow: true,
    timePreference: "1-2 hour sessions",
    languagesSpoken: [
      { language: "Japanese", flag: "🇯🇵", level: "Native" },
      { language: "English", flag: "🇺🇸", level: "Learning" },
      { language: "Dutch", flag: "🇳🇱", level: "Beginner" },
    ],
  },
  {
    id: "3",
    name: "Pierre",
    language: "French",
    flag: "🇫🇷",
    distance: "0.8 km",
    lat: 52.0695,
    lng: 4.3027,
    bio: "French teacher 🇫🇷 helping with French, learning Dutch 🇳🇱",
    availableFor: "15 min",
    image: "/french-man.png",
    isOnline: false,
    rating: 4.7,
    responseTime: "5 min",
    currentLocation: "KB National Library",
    availableNow: false,
    timePreference: "15-30 min quick chats",
    languagesSpoken: [
      { language: "French", flag: "🇫🇷", level: "Native" },
      { language: "English", flag: "🇺🇸", level: "Fluent" },
      { language: "Dutch", flag: "🇳🇱", level: "Learning" },
    ],
  },
  {
    id: "4",
    name: "Anna",
    language: "German",
    flag: "🇩🇪",
    distance: "1.2 km",
    lat: 52.0725,
    lng: 4.2997,
    bio: "German native 🇩🇪 teaching German, learning Spanish 🇪🇸",
    availableFor: "30 min",
    image: "/german-woman.jpg",
    isOnline: true,
    rating: 4.8,
    responseTime: "3 min",
    currentLocation: "Plein Café",
    availableNow: true,
    timePreference: "30-45 min sessions",
    languagesSpoken: [
      { language: "German", flag: "🇩🇪", level: "Native" },
      { language: "English", flag: "🇺🇸", level: "Fluent" },
      { language: "Spanish", flag: "🇪🇸", level: "Learning" },
    ],
  },
  {
    id: "5",
    name: "Sophie",
    language: "Dutch",
    flag: "🇳🇱",
    distance: "0.6 km",
    lat: 52.071,
    lng: 4.304,
    bio: "Native Dutch speaker 🇳🇱 teaching Dutch, learning French 🇫🇷",
    availableFor: "45 min",
    image: "/diverse-person-smiling.png",
    isOnline: true,
    rating: 4.9,
    responseTime: "2 min",
    currentLocation: "Binnenhof",
    availableNow: true,
    timePreference: "30-60 min sessions",
    languagesSpoken: [
      { language: "Dutch", flag: "🇳🇱", level: "Native" },
      { language: "English", flag: "🇺🇸", level: "Fluent" },
      { language: "French", flag: "🇫🇷", level: "Learning" },
    ],
  },
]

interface MapViewProps {
  onSetFlag: () => void
  onProfileModalChange?: (isOpen: boolean) => void
}

export function MapView({ onSetFlag, onProfileModalChange }: MapViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityDuration, setAvailabilityDuration] = useState<string | null>(null)

  const handleUserSelect = (user: User | null) => {
    setSelectedUser(user)
    onProfileModalChange?.(user !== null)
  }

  const handleAvailabilityToggle = (duration: string) => {
    setIsAvailable(true)
    setAvailabilityDuration(duration)
    setIsAvailabilityModalOpen(false)
  }

  const handleAvailabilityOff = () => {
    setIsAvailable(false)
    setAvailabilityDuration(null)
    setIsAvailabilityModalOpen(false)
  }

  if (selectedUser) {
    return (
      <div className="h-full relative bg-gray-900">
        <div className="absolute inset-0 opacity-30">
          <MapboxMap users={mockUsers} onUserClick={() => {}} />
        </div>

        <div className="absolute inset-0 flex items-center justify-end animate-slide-in-right">
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUserSelect(null)}
                className="h-12 w-12 rounded-full bg-green-100 hover:bg-green-200 text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>

              <div className="flex items-center gap-2 text-orange-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-semibold text-sm">02:03:48</span>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={selectedUser.image || "/placeholder.svg"} alt={selectedUser.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                    {selectedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-gray-500 text-sm">@{selectedUser.name.toLowerCase()}</p>
                  <p className="text-gray-600 text-sm mt-1">5 mutual interests</p>
                </div>
              </div>

              <Card className="p-5 mb-6 bg-gray-50 border-gray-200 rounded-2xl">
                <p className="text-gray-800 mb-4 leading-relaxed">
                  Looking for someone to practice Spanish with! I'm intermediate level and would love to meet for
                  conversation practice. I can help you with Dutch in exchange. Let's meet at a café this weekend!
                </p>

                <div className="flex items-center gap-2 mb-4 bg-green-50 rounded-xl px-3 py-2 w-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">00:45 sec</span>
                  <button className="ml-2 text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-1.5">
                    🇪🇸 <span className="text-gray-700">Spanish</span>
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-1.5">
                    🇳🇱 <span className="text-gray-700">Dutch</span>
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-1.5">
                    ☕ <span className="text-gray-700">Coffee Chats</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-gray-600 hover:text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                      <span className="font-semibold">2,359</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-600 hover:text-red-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                      <span className="font-semibold">39</span>
                    </button>
                  </div>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold">
                    Share
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                </div>
              </Card>

              <div className="mb-6">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Location</p>
                <div className="flex items-center gap-2 text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="font-medium">Mill Road, Cambridge CB1 2EW, UK</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-4">23 responses</p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src="/woman-pink.jpg" alt="Sandra B." />
                      <AvatarFallback className="bg-pink-200 text-pink-700">S</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">Sandra B.</span>
                        <span className="text-gray-500 text-xs">@sandra.b</span>
                      </div>
                      <p className="text-gray-800 text-sm leading-relaxed mb-2">
                        I'd love to join! I'm also learning Spanish and looking for practice partners. Count me in! 🇪🇸
                      </p>
                      <span className="text-gray-400 text-xs">Jan 25 10:32</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Message"
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                  />
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="You" />
                    <AvatarFallback className="bg-blue-500 text-white text-xs">Y</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAvailabilityModalOpen(false)}
          />

          <Card className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Available for Practice</h3>
              <p className="text-gray-600 text-sm">Let others know you're ready for language exchange!</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleAvailabilityToggle("15 min")}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 hover:border-green-300 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-green-700">Quick Chat</p>
                    <p className="text-sm text-gray-600">15 minutes</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    15
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAvailabilityToggle("30 min")}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700">Standard Session</p>
                    <p className="text-sm text-gray-600">30 minutes</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    30
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAvailabilityToggle("1 hour")}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 hover:border-purple-300 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-purple-700">Deep Dive</p>
                    <p className="text-sm text-gray-600">1 hour</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    1h
                  </div>
                </div>
              </button>
            </div>

            {isAvailable && (
              <Button
                onClick={handleAvailabilityOff}
                variant="outline"
                className="w-full h-12 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold bg-transparent"
              >
                Turn Off Availability
              </Button>
            )}

            {!isAvailable && (
              <Button
                onClick={() => setIsAvailabilityModalOpen(false)}
                variant="ghost"
                className="w-full h-12 rounded-2xl text-gray-600 hover:bg-gray-100 font-semibold"
              >
                Cancel
              </Button>
            )}
          </Card>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <Button
          size="icon"
          className="glass-button rounded-full h-12 w-12 pointer-events-auto"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter className="h-5 w-5 text-white" />
        </Button>

        <div className="glass-button rounded-full px-4 py-2 pointer-events-auto flex items-center gap-2">
          <Users className="h-4 w-4 text-white" />
          <span className="text-white font-semibold text-sm">{mockUsers.length} nearby</span>
        </div>

        <Button
          size="icon"
          className={`rounded-full h-12 w-12 pointer-events-auto transition-all shadow-lg ${
            isAvailable
              ? "bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 animate-pulse-slow"
              : "glass-button"
          }`}
          onClick={() => setIsAvailabilityModalOpen(true)}
        >
          <Zap className={`h-5 w-5 ${isAvailable ? "text-white" : "text-white"}`} />
        </Button>
      </div>

      <div className="absolute inset-0">
        <MapboxMap users={mockUsers} onUserClick={handleUserSelect} />
      </div>
    </div>
  )
}
