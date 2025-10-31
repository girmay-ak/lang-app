"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, MapPin, MessageCircle, ThumbsUp, ThumbsDown, Clock, Users } from "lucide-react"
import { Input } from "@/components/ui/input"

interface User {
  id: string
  name: string
  username: string
  avatar: string
  mutualInterests: number
  distance: string
  bio: string
  interests: { emoji: string; name: string }[]
  flag: string
  online: boolean
}

interface Conversation {
  id: string
  user: User
  timeAgo: string
  content: string
  image?: string
  replies: number
  distance: string
  upvotes: number
  downvotes: number
}

interface Community {
  id: string
  name: string
  image: string
  members: number
  distance: string
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Sandra B.",
    username: "@sandra.b",
    avatar: "/diverse-woman-portrait.png",
    mutualInterests: 23,
    distance: "200m away",
    bio: "Speaks Dutch 🇳🇱 — Learning English 🇬🇧. Looking for someone to practice English over coffee ☕",
    interests: [
      { emoji: "🇳🇱", name: "Dutch" },
      { emoji: "🇬🇧", name: "English" },
      { emoji: "☕", name: "Coffee Chats" },
      { emoji: "📚", name: "Reading" },
    ],
    flag: "🇳🇱",
    online: true,
  },
  {
    id: "2",
    name: "Chris M.",
    username: "@chris",
    avatar: "/man-with-stylish-glasses.png",
    mutualInterests: 5,
    distance: "450m away",
    bio: "Speaks English 🇬🇧 — Learning Spanish 🇪🇸. Available for language exchange!",
    interests: [
      { emoji: "🇬🇧", name: "English" },
      { emoji: "🇪🇸", name: "Spanish" },
    ],
    flag: "🇬🇧",
    online: true,
  },
  {
    id: "3",
    name: "Jessica R.",
    username: "@jessica",
    avatar: "/woman-pink.jpg",
    mutualInterests: 18,
    distance: "800m away",
    bio: "Speaks French 🇫🇷 — Learning Dutch 🇳🇱. Let's practice together!",
    interests: [
      { emoji: "🇫🇷", name: "French" },
      { emoji: "🇳🇱", name: "Dutch" },
    ],
    flag: "🇫🇷",
    online: false,
  },
]

const mockConversations: Conversation[] = [
  {
    id: "1",
    user: mockUsers[0],
    timeAgo: "6 hrs",
    content: "Anyone want to practice Dutch conversation this weekend? I can help with English too! ☕",
    image: "/happy-golden-retriever.png",
    replies: 12,
    distance: "20ft",
    upvotes: 25,
    downvotes: 0,
  },
  {
    id: "2",
    user: mockUsers[1],
    timeAgo: "8 hrs",
    content: "Looking for Spanish conversation partner! I'm intermediate level. Can meet at Cambridge Commons café.",
    replies: 12,
    distance: "20ft",
    upvotes: 2359,
    downvotes: 39,
  },
]

const mockCommunities: Community[] = [
  {
    id: "1",
    name: "Spanish Learners",
    image: "/volleyball-game.png",
    members: 25,
    distance: "20ft",
  },
  {
    id: "2",
    name: "French Conversation",
    image: "/colorful-bird-perched.png",
    members: 43,
    distance: "55ft",
  },
  {
    id: "3",
    name: "Dutch Practice Group",
    image: "/chess-game.png",
    members: 67,
    distance: "100ft",
  },
]

export function FeedView() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Nearby Language Partners</h1>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* People Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">People</h2>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {mockUsers.map((user) => (
              <Card
                key={user.id}
                className="flex-shrink-0 w-[280px] bg-slate-800/50 backdrop-blur-xl border-white/10 p-4 rounded-3xl hover:bg-slate-800/70 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{user.name}</h3>
                      <MessageCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-white/60">{user.username}</p>
                    <p className="text-xs text-white/50">{user.mutualInterests} mutual interests</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-green-400 text-sm mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{user.distance}</span>
                </div>

                <p className="text-sm text-white/70 mb-3 line-clamp-2">{user.bio}</p>

                <div className="flex flex-wrap gap-2">
                  {user.interests.slice(0, 3).map((interest, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-slate-700/50 text-white/80 border-white/10">
                      <span className="mr-1">{interest.emoji}</span>
                      {interest.name}
                    </Badge>
                  ))}
                  {user.interests.length > 3 && (
                    <Badge variant="secondary" className="bg-slate-700/50 text-white/80 border-white/10">
                      +{user.interests.length - 3}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Language Meetups Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Language Exchanges Nearby</h2>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="bg-slate-800/50 backdrop-blur-xl border-white/10 p-4 rounded-3xl hover:bg-slate-800/70 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-white/50" />
                  <span className="text-sm text-white/60">{conversation.timeAgo}</span>
                </div>

                {conversation.image && (
                  <div className="mb-3 rounded-2xl overflow-hidden">
                    <img
                      src={conversation.image || "/placeholder.svg"}
                      alt="Post"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                <p className="text-white mb-3">{conversation.content}</p>

                <div className="flex items-center justify-between text-sm text-white/60">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{conversation.replies} replies</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{conversation.distance}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-white/80">{conversation.upvotes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-white/80">{conversation.downvotes}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Communities Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Communities</h2>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {mockCommunities.map((community) => (
              <Card
                key={community.id}
                className="flex-shrink-0 w-[180px] bg-slate-800/50 backdrop-blur-xl border-white/10 rounded-3xl overflow-hidden hover:bg-slate-800/70 transition-all cursor-pointer"
              >
                <div className="relative h-32">
                  <img
                    src={community.image || "/placeholder.svg"}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    <Badge className="bg-yellow-500/90 text-yellow-900 border-0">
                      <Users className="h-3 w-3 mr-1" />
                      {community.members}
                    </Badge>
                    <Badge className="bg-yellow-500/90 text-yellow-900 border-0">
                      <MapPin className="h-3 w-3 mr-1" />
                      {community.distance}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-white">{community.name}</h3>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
