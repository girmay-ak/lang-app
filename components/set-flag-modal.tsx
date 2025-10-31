"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { MapPin, Clock, Globe } from "lucide-react"

const languages = [
  { value: "spanish", label: "Spanish", flag: "🇪🇸" },
  { value: "japanese", label: "Japanese", flag: "🇯🇵" },
  { value: "french", label: "French", flag: "🇫🇷" },
  { value: "german", label: "German", flag: "🇩🇪" },
  { value: "chinese", label: "Chinese", flag: "🇨🇳" },
  { value: "korean", label: "Korean", flag: "🇰🇷" },
  { value: "italian", label: "Italian", flag: "🇮🇹" },
  { value: "portuguese", label: "Portuguese", flag: "🇵🇹" },
]

const timeOptions = [
  { value: "15", label: "15 minutes - Quick chat" },
  { value: "30", label: "30 minutes - Short session" },
  { value: "60", label: "1 hour - Full session" },
  { value: "90", label: "1.5 hours - Extended practice" },
  { value: "120", label: "2 hours - Deep dive" },
]

interface SetFlagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetFlagModal({ open, onOpenChange }: SetFlagModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [currentLocation, setCurrentLocation] = useState("")
  const [availableNow, setAvailableNow] = useState(true)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  const handleGoAvailable = () => {
    console.log("Going available:", {
      selectedLanguage,
      selectedTime,
      currentLocation,
      availableNow,
      useCurrentLocation,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Set My Flag
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2 text-base font-semibold">
              <Globe className="h-4 w-4 text-purple-600" />
              Language to Practice
            </Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language" className="h-12 border-2 border-purple-200">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-purple-600" />
              How Long Can You Practice?
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger id="time" className="h-12 border-2 border-purple-200">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    <span className="font-medium">{time.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-purple-600" />
              Current Location
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                <span className="text-sm font-medium">Use my exact location</span>
                <Switch checked={useCurrentLocation} onCheckedChange={setUseCurrentLocation} />
              </div>
              {!useCurrentLocation && (
                <Input
                  id="location"
                  placeholder="e.g., Starbucks on Main St, Central Park..."
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="h-12 border-2 border-purple-200"
                />
              )}
              {useCurrentLocation && (
                <p className="text-xs text-muted-foreground px-1">
                  Your exact GPS location will be shared with nearby users
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Availability Status</Label>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <div>
                <p className="font-semibold text-foreground">Available Now</p>
                <p className="text-xs text-muted-foreground">Others can see you're ready to practice</p>
              </div>
              <Switch checked={availableNow} onCheckedChange={setAvailableNow} />
            </div>
          </div>

          <Button
            onClick={handleGoAvailable}
            disabled={!selectedLanguage || !selectedTime || (!useCurrentLocation && !currentLocation)}
            className="w-full h-12 text-base font-bold shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            Go Available
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
