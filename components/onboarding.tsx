"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, MessageCircle, User, Globe } from "lucide-react"

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      icon: MapPin,
      title: "Find Language Partners Nearby",
      description:
        "Discover people learning your language or speaking the language you want to practice, right in your area.",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: Globe,
      title: "Set Your Language Flags",
      description: "Choose the languages you speak and want to learn. Set your availability and practice preferences.",
      color: "from-purple-400 to-purple-600",
    },
    {
      icon: MessageCircle,
      title: "Start Conversations",
      description:
        "Connect instantly with language learners. Chat, share voice messages, and practice together in real-time.",
      color: "from-pink-400 to-pink-600",
    },
    {
      icon: User,
      title: "Track Your Progress",
      description:
        "Build your profile, earn achievements, and watch your language skills grow with every conversation.",
      color: "from-teal-400 to-teal-600",
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const currentSlideData = slides[currentSlide]
  const Icon = currentSlideData.icon

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-10">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
        {/* Icon with gradient background */}
        <div
          className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentSlideData.color} flex items-center justify-center mb-8 animate-scale-in shadow-2xl`}
          key={currentSlide}
        >
          <Icon className="w-16 h-16 text-white" />
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-bold text-center mb-4 text-foreground animate-slide-up"
          key={`title-${currentSlide}`}
        >
          {currentSlideData.title}
        </h1>

        {/* Description */}
        <p
          className="text-lg text-center text-muted-foreground max-w-md leading-relaxed animate-slide-up"
          key={`desc-${currentSlide}`}
          style={{ animationDelay: "0.1s" }}
        >
          {currentSlideData.description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="pb-12 px-8">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Next/Get Started Button */}
        <Button onClick={handleNext} size="lg" className="w-full h-14 text-lg rounded-full shadow-lg">
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  )
}
