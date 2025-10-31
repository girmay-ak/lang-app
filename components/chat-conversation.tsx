"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Mic, Play } from "lucide-react"

interface Message {
  id: string
  text?: string
  type: "text" | "voice"
  sender: "me" | "them"
  timestamp: string
  voiceDuration?: string
}

interface ChatConversationProps {
  chat: {
    id: string
    name: string
    avatar: string
    online: boolean
  }
  onBack: () => void
}

export function ChatConversation({ chat, onBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I saw you're learning Spanish 🇪🇸",
      type: "text",
      sender: "them",
      timestamp: "10:28",
    },
    {
      id: "2",
      text: "How can I help you today?",
      type: "text",
      sender: "them",
      timestamp: "10:29",
    },
    {
      id: "3",
      text: "I'm good thanks for asking",
      type: "text",
      sender: "me",
      timestamp: "10:31",
    },
    {
      id: "4",
      type: "voice",
      sender: "me",
      timestamp: "10:34",
      voiceDuration: "00:04",
    },
    {
      id: "5",
      text: "Thanks buddy, you too as well",
      type: "text",
      sender: "them",
      timestamp: "10:45",
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        type: "text",
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10 rounded-xl h-12 w-12"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                <AvatarFallback className="bg-slate-600 text-white">{getInitials(chat.name)}</AvatarFallback>
              </Avatar>
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{chat.name}</h2>
              <p className="text-sm text-white/70">{chat.online ? "Online" : "Offline"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Date separator */}
        <div className="flex justify-center">
          <span className="text-sm text-slate-400">10 March 2022</span>
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.sender === "me" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <Avatar className={`h-10 w-10 flex-shrink-0 ${message.sender === "me" ? "bg-pink-500" : "bg-indigo-500"}`}>
              <AvatarFallback className="text-white font-medium">{message.sender === "me" ? "R" : "A"}</AvatarFallback>
            </Avatar>

            {/* Message content */}
            <div className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"}`}>
              {message.type === "text" ? (
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[280px] ${
                    message.sender === "me"
                      ? "bg-slate-800 text-white rounded-tr-sm"
                      : "bg-slate-100 text-slate-900 rounded-tl-sm"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{message.text}</p>
                </div>
              ) : (
                // Voice message
                <div
                  className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
                    message.sender === "me"
                      ? "bg-slate-800 text-white rounded-tr-sm"
                      : "bg-slate-100 text-slate-900 rounded-tl-sm"
                  }`}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 rounded-full flex-shrink-0 ${
                      message.sender === "me"
                        ? "bg-white/20 hover:bg-white/30 text-white"
                        : "bg-slate-800/10 hover:bg-slate-800/20 text-slate-900"
                    }`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-0.5 rounded-full ${message.sender === "me" ? "bg-white/40" : "bg-slate-400"}`}
                          style={{ height: `${Math.random() * 16 + 8}px` }}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${message.sender === "me" ? "text-white/70" : "text-slate-500"}`}>
                      {message.voiceDuration}
                    </span>
                  </div>
                </div>
              )}
              <span className="text-xs text-slate-400 mt-1 px-1">{message.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-10 w-10 flex-shrink-0"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Enter your message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-100 border-0 text-slate-900 placeholder:text-slate-400 rounded-full px-5 h-12 focus-visible:ring-1 focus-visible:ring-slate-300"
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-10 w-10 flex-shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
