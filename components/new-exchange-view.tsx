"use client"

import type React from "react"

import { useState } from "react"
import { X, Globe, MapPin, Calendar, Clock, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NewExchangeViewProps {
  onClose: () => void
}

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
]

export function NewExchangeView({ onClose }: NewExchangeViewProps) {
  const [speakLanguage, setSpeakLanguage] = useState("")
  const [learnLanguage, setLearnLanguage] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("[v0] New exchange request:", {
      speakLanguage,
      learnLanguage,
      location,
      date,
      time,
      message,
    })
    onClose()
  }

  return (
    <div className="h-screen bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">New Exchange</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-32">
        {/* Language Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="speak-language" className="text-white text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />I speak
            </Label>
            <select
              id="speak-language"
              value={speakLanguage}
              onChange={(e) => setSpeakLanguage(e.target.value)}
              className="w-full bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select language</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learn-language" className="text-white text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />I want to learn
            </Label>
            <select
              id="learn-language"
              value={learnLanguage}
              onChange={(e) => setLearnLanguage(e.target.value)}
              className="w-full bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select language</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-white text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Meeting Location
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., Central Café, Harvard Square"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-slate-800/50 backdrop-blur-xl border-white/10 text-white placeholder:text-slate-400 rounded-2xl"
            required
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-white text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-800/50 backdrop-blur-xl border-white/10 text-white rounded-2xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-white text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-slate-800/50 backdrop-blur-xl border-white/10 text-white rounded-2xl"
              required
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-white text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Message (Optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Tell potential partners what you'd like to practice or any specific topics you want to discuss..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-slate-800/50 backdrop-blur-xl border-white/10 text-white placeholder:text-slate-400 rounded-2xl min-h-[120px] resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-semibold py-6 rounded-2xl shadow-lg"
        >
          Create Exchange Request
        </Button>
      </form>
    </div>
  )
}
