"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mic, Paperclip, Play } from "lucide-react"

const mockConversations = [
  {
    id: "1",
    name: "Richard Rentsch",
    flag: "🇺🇸",
    lastMessage: "Thanks buddy, you too as well",
    time: "10 March 2025",
    image: "/diverse-person-smiling.png",
    isOnline: true,
  },
]

const mockMessages = [
  {
    id: "1",
    text: "Hi Richard!",
    sender: "me",
    time: "10:30 AM",
  },
  {
    id: "2",
    text: "How can I help you today?",
    sender: "them",
    time: "10:31 AM",
    image: "/diverse-person-smiling.png",
  },
  {
    id: "3",
    text: "I'm good thanks for asking",
    sender: "me",
    time: "10:32 AM",
  },
  {
    id: "4",
    type: "voice",
    duration: "00:04",
    sender: "me",
    time: "10:33 AM",
  },
  {
    id: "5",
    type: "images",
    images: ["/diverse-woman-smiling.png", "/serene-asian-woman.png", "/french-man.png"],
    sender: "me",
    time: "10:34 AM",
  },
  {
    id: "6",
    text: "Thanks buddy, you too as well",
    sender: "them",
    time: "10:35 AM",
    image: "/diverse-person-smiling.png",
  },
]

export function MessagesView() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  if (selectedChat) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Dark header */}
        <div className="p-4 flex items-center gap-3 bg-gray-900 text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedChat(null)}
            className="text-white hover:bg-gray-800 rounded-full h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center">
            <h3 className="font-semibold text-lg">Richard Rentsch</h3>
            <p className="text-sm text-gray-400">Online</p>
          </div>
          <Avatar className="h-12 w-12 border-2 border-gray-700">
            <AvatarImage src="/diverse-person-smiling.png" alt="Richard Rentsch" />
            <AvatarFallback>RR</AvatarFallback>
          </Avatar>
        </div>

        {/* White chat area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {/* Date separator */}
          <div className="text-center">
            <span className="text-xs text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full">10 March 2022</span>
          </div>

          {/* Messages */}
          {mockMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.sender === "me" ? "justify-start" : "justify-end"}`}>
              {msg.sender === "me" && (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src="/diverse-person-smiling.png" alt="User" />
                  <AvatarFallback>RR</AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[70%] ${msg.sender === "me" ? "items-start" : "items-end"} flex flex-col gap-1`}>
                {msg.type === "voice" ? (
                  <div className="bg-gray-800 text-white px-4 py-3 rounded-3xl flex items-center gap-3 shadow-md">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-gray-700 hover:bg-gray-600">
                      <Play className="h-4 w-4 text-white" />
                    </Button>
                    <div className="flex-1 h-8 flex items-center gap-0.5">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white rounded-full"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs">{msg.duration}</span>
                  </div>
                ) : msg.type === "images" ? (
                  <div className="bg-gray-800 p-2 rounded-3xl flex gap-2 shadow-md">
                    {msg.images?.map((img, i) => (
                      <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden">
                        <img src={img || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`px-5 py-3 rounded-3xl shadow-sm ${
                      msg.sender === "me"
                        ? "bg-gray-800 text-white rounded-bl-md"
                        : "bg-white text-gray-900 border border-gray-200 rounded-br-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                )}
                <span className="text-xs text-gray-400 px-2">{msg.time}</span>
              </div>

              {msg.sender === "them" && (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src="/diverse-woman-smiling.png" alt="You" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
            <Button size="icon" variant="ghost" className="rounded-full text-gray-500 h-10 w-10">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-600 placeholder:text-gray-400"
            />
            <Button size="icon" variant="ghost" className="rounded-full text-gray-500 h-10 w-10">
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockConversations.map((conversation) => (
          <Card
            key={conversation.id}
            onClick={() => setSelectedChat(conversation.id)}
            className="p-4 cursor-pointer bg-white hover:bg-gray-50 transition-all border-2 rounded-3xl shadow-lg card-float"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                  <AvatarImage src={conversation.image || "/placeholder.svg"} alt={conversation.name} />
                  <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{conversation.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
