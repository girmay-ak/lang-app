"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const [distance, setDistance] = useState([5])
  const [availableNow, setAvailableNow] = useState(true)
  const [today, setToday] = useState(false)
  const [thisWeek, setThisWeek] = useState(false)
  const [beginner, setBeginner] = useState(false)
  const [intermediate, setIntermediate] = useState(true)
  const [advanced, setAdvanced] = useState(false)

  const handleClearAll = () => {
    setDistance([5])
    setAvailableNow(false)
    setToday(false)
    setThisWeek(false)
    setBeginner(false)
    setIntermediate(false)
    setAdvanced(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] animate-fade-in" onClick={onClose} />

      {/* Filter panel sliding from left */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-[2001] animate-slide-in-left overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
            >
              Clear All
            </Button>
          </div>

          {/* Distance Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distance</h3>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-blue-600">{distance[0]} km</span>
            </div>
            <Slider value={distance} onValueChange={setDistance} max={20} min={1} step={1} className="w-full" />
          </div>

          {/* Availability Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Availability</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  availableNow ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <Checkbox
                  checked={availableNow}
                  onCheckedChange={(checked) => setAvailableNow(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="font-medium text-gray-900">Available Now</span>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  today ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <Checkbox
                  checked={today}
                  onCheckedChange={(checked) => setToday(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="font-medium text-gray-900">Today</span>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  thisWeek ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <Checkbox
                  checked={thisWeek}
                  onCheckedChange={(checked) => setThisWeek(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="font-medium text-gray-900">This Week</span>
              </label>
            </div>
          </div>

          {/* Skill Level Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Skill Level</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  beginner ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <Checkbox
                  checked={beginner}
                  onCheckedChange={(checked) => setBeginner(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="font-medium text-gray-900">Beginner</span>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  intermediate ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <Checkbox
                  checked={intermediate}
                  onCheckedChange={(checked) => setIntermediate(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="font-medium text-gray-900">Intermediate</span>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  advanced ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <Checkbox
                  checked={advanced}
                  onCheckedChange={(checked) => setAdvanced(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="font-medium text-gray-900">Advanced</span>
              </label>
            </div>
          </div>

          {/* Practice Type Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Practice Type</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer bg-gray-50 border-2 border-transparent">
                <Checkbox className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <span className="font-medium text-gray-900">Conversation</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer bg-gray-50 border-2 border-transparent">
                <Checkbox className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <span className="font-medium text-gray-900">Grammar Help</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
