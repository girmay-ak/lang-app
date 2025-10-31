"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface User {
  id: string
  name: string
  language: string
  flag: string
  distance: string
  bio: string
  availableFor: string
}

interface QuickChatModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickChatModal({ user, open, onOpenChange }: QuickChatModalProps) {
  const [message, setMessage] = useState("")

  if (!user) return null

  const handleSend = () => {
    if (!message.trim()) return
    console.log("Sending message:", message)
    setMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{user.flag}</span>
            <span>{user.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Language:</span>
              <span className="font-medium">{user.language}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available for:</span>
              <span className="font-medium">{user.availableFor}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Distance:</span>
              <span className="font-medium">{user.distance}</span>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{user.bio}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Send a quick message:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
