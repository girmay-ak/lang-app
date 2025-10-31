"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface OnboardingCarouselProps {
  onComplete: () => void
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      title: "Connect. Practice. Master.",
      description: "Find language partners nearby and practice in real life or online",
      bgColor: "bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea]",
      textColor: "text-white",
      buttonStyle: "bg-white text-[#667eea] hover:bg-gray-50",
      isWelcome: true,
      illustration: (
        <div className="relative w-full h-80 sm:h-96 flex flex-col items-center justify-center px-4">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float" />
            <div
              className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "1s" }}
            />
          </div>

          {/* Main logo/emoji */}
          <div className="relative z-10 mb-6 sm:mb-8 animate-bounce-slow">
            <div className="text-7xl sm:text-9xl">🌍</div>
          </div>

          {/* App name */}
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">LangEx</h1>

          {/* Feature highlights */}
          <div className="flex flex-col gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-sm">
            {[
              { icon: "🗺️", text: "Find partners nearby" },
              { icon: "💬", text: "Practice in real life" },
              { icon: "🎯", text: "Learn faster together" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  {feature.icon}
                </div>
                <span className="text-white font-medium text-base sm:text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Find language partners nearby",
      description: "Connect with people learning your language or speaking the language you want to practice",
      bgColor: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600",
      textColor: "text-white",
      buttonStyle: "bg-white text-emerald-600 hover:bg-gray-100",
      illustration: (
        <div className="relative w-full h-80 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 to-blue-200/40 rounded-[3rem] backdrop-blur-sm mx-4" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Floating avatars with language flags */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              <div className="absolute top-0 left-8 sm:left-12 animate-float">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">🇬🇧</span>
                </div>
              </div>
              <div className="absolute top-8 right-4 sm:right-8 animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">🇪🇸</span>
                </div>
              </div>
              <div className="absolute bottom-12 left-2 sm:left-4 animate-float" style={{ animationDelay: "1s" }}>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">🇫🇷</span>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 sm:right-12 animate-float" style={{ animationDelay: "1.5s" }}>
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">🇩🇪</span>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl">📍</span>
                </div>
              </div>
            </div>
            {/* Floating labels */}
            <div className="absolute top-12 sm:top-16 left-2 sm:left-4 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg animate-float">
              <span className="text-xs sm:text-sm font-semibold text-emerald-600">2.5 km away</span>
            </div>
            <div
              className="absolute bottom-16 sm:bottom-20 right-2 sm:right-4 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg animate-float"
              style={{ animationDelay: "0.7s" }}
            >
              <span className="text-xs sm:text-sm font-semibold text-emerald-600">Available now</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Practice languages in real life",
      description: "Meet at cafés, parks, or chat online. Choose what works best for you",
      bgColor: "bg-gradient-to-br from-purple-300 via-purple-200 to-blue-200",
      textColor: "text-slate-900",
      buttonStyle: "bg-slate-900 text-white hover:bg-slate-800",
      illustration: (
        <div className="relative w-full h-80 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-300/60 to-blue-300/60 rounded-[3rem] backdrop-blur-sm mx-4" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Chat bubbles with flags */}
            <div className="relative w-64 sm:w-72 h-64">
              <div className="absolute top-8 left-2 sm:left-4 bg-white p-3 sm:p-4 rounded-3xl rounded-tl-sm shadow-xl animate-slide-up max-w-[180px] sm:max-w-none">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl sm:text-2xl">🇬🇧</span>
                  <span className="text-xs font-semibold">→</span>
                  <span className="text-xl sm:text-2xl">🇳🇱</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700">Want to practice Dutch?</p>
              </div>
              <div
                className="absolute top-32 right-2 sm:right-4 bg-slate-900 p-3 sm:p-4 rounded-3xl rounded-tr-sm shadow-xl animate-slide-up max-w-[180px] sm:max-w-none"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl sm:text-2xl">🇳🇱</span>
                  <span className="text-xs font-semibold text-white">→</span>
                  <span className="text-xl sm:text-2xl">🇬🇧</span>
                </div>
                <p className="text-xs sm:text-sm text-white">Yes! Coffee tomorrow?</p>
              </div>
              <div className="absolute bottom-4 left-4 sm:left-8 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg animate-float">
                <span className="text-xs font-semibold text-purple-600">☕ Meet at café</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "See who speaks what",
      description: "Language flags show what people speak and want to learn at a glance",
      bgColor: "bg-gradient-to-br from-amber-100 via-yellow-100 to-lime-100",
      textColor: "text-slate-900",
      buttonStyle: "bg-slate-900 text-white hover:bg-slate-800",
      illustration: (
        <div className="relative w-full h-80 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 to-lime-200/50 rounded-[3rem] backdrop-blur-sm mx-4" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Profile cards with flag exchanges */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl animate-scale-in">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 mx-auto mb-2" />
                <div className="flex items-center justify-center gap-1 text-xl sm:text-2xl">
                  <span>🇬🇧</span>
                  <span className="text-xs">→</span>
                  <span>🇪🇸</span>
                </div>
                <p className="text-xs text-center mt-2 font-semibold">Sarah</p>
              </div>
              <div
                className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl animate-scale-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-400 mx-auto mb-2" />
                <div className="flex items-center justify-center gap-1 text-xl sm:text-2xl">
                  <span>🇫🇷</span>
                  <span className="text-xs">→</span>
                  <span>🇩🇪</span>
                </div>
                <p className="text-xs text-center mt-2 font-semibold">Marc</p>
              </div>
              <div
                className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl animate-scale-in"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 mx-auto mb-2" />
                <div className="flex items-center justify-center gap-1 text-xl sm:text-2xl">
                  <span>🇯🇵</span>
                  <span className="text-xs">→</span>
                  <span>🇬🇧</span>
                </div>
                <p className="text-xs text-center mt-2 font-semibold">Yuki</p>
              </div>
              <div
                className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl animate-scale-in"
                style={{ animationDelay: "0.6s" }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 mx-auto mb-2" />
                <div className="flex items-center justify-center gap-1 text-xl sm:text-2xl">
                  <span>🇮🇹</span>
                  <span className="text-xs">→</span>
                  <span>🇫🇷</span>
                </div>
                <p className="text-xs text-center mt-2 font-semibold">Luca</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Start your language journey",
      description: "Join thousands of language learners connecting and practicing together",
      bgColor: "bg-gradient-to-br from-rose-300 via-pink-200 to-purple-200",
      textColor: "text-slate-900",
      buttonStyle: "bg-slate-900 text-white hover:bg-slate-800",
      illustration: (
        <div className="relative w-full h-80 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-200/60 to-purple-200/60 rounded-[3rem] backdrop-blur-sm mx-4" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Network of connected users */}
            <div className="relative w-64 sm:w-72 h-64">
              {/* Center user */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-2xl flex items-center justify-center animate-pulse-slow">
                  <span className="text-3xl sm:text-4xl">👤</span>
                </div>
              </div>
              {/* Connected users */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute animate-float"
                  style={{
                    top: `${50 + 35 * Math.sin((i * 2 * Math.PI) / 5)}%`,
                    left: `${50 + 35 * Math.cos((i * 2 * Math.PI) / 5)}%`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 0.2}s`,
                  }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-xl flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">{["🇬🇧", "🇪🇸", "🇫🇷", "🇩🇪", "🇯🇵"][i]}</span>
                  </div>
                  {/* Connection line */}
                  <svg
                    className="absolute top-1/2 left-1/2 -z-10"
                    width="100"
                    height="100"
                    style={{ transform: "translate(-50%, -50%)" }}
                  >
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="50"
                      stroke="#e879f9"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              ))}
            </div>
            <div className="absolute bottom-8 bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-xl animate-bounce-slow">
              <span className="text-xs sm:text-sm font-bold text-rose-600">🌍 Connect Worldwide</span>
            </div>
          </div>
        </div>
      ),
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

  const handleLogin = () => {
    router.push("/auth/login")
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className={`fixed inset-0 z-50 ${currentSlideData.bgColor} transition-colors duration-500 safe-area-inset`}>
      {/* Skip Button */}
      {currentSlide < slides.length - 1 && (
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className={`${currentSlideData.textColor} hover:bg-white/20 rounded-full touch-manipulation`}
          >
            Skip
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col h-full px-4 sm:px-6 pt-12 sm:pt-16 pb-6 sm:pb-8 overflow-y-auto overscroll-contain">
        {/* Illustration */}
        <div className="flex-1 flex items-center justify-center min-h-0" key={`illustration-${currentSlide}`}>
          {currentSlideData.illustration}
        </div>

        {/* Text Content */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-shrink-0">
          <h1
            className={`text-3xl sm:text-4xl font-bold text-center ${currentSlideData.textColor} leading-tight animate-slide-up px-4`}
            key={`title-${currentSlide}`}
          >
            {currentSlideData.title}
          </h1>
          <p
            className={`text-base sm:text-lg text-center ${currentSlideData.textColor} opacity-90 leading-relaxed animate-slide-up px-4`}
            key={`desc-${currentSlide}`}
            style={{ animationDelay: "0.1s" }}
          >
            {currentSlideData.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-4 sm:mb-6 flex-shrink-0">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? `w-8 ${currentSlideData.textColor === "text-white" ? "bg-white" : "bg-slate-900"}`
                  : `w-2 ${currentSlideData.textColor === "text-white" ? "bg-white/40" : "bg-slate-900/40"}`
              }`}
            />
          ))}
        </div>

        {/* Next/Get Started Button */}
        <Button
          onClick={handleNext}
          size="lg"
          className={`w-full h-12 sm:h-14 text-base sm:text-lg rounded-full shadow-xl ${currentSlideData.buttonStyle} touch-manipulation flex-shrink-0`}
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Log in link */}
        <div className="text-center mt-3 sm:mt-4 flex-shrink-0">
          <button
            onClick={handleLogin}
            className={`text-sm ${currentSlideData.textColor} opacity-80 hover:opacity-100 transition-opacity touch-manipulation min-h-[44px] flex items-center justify-center`}
          >
            Already have an account? <span className="font-semibold underline ml-1">Log in</span>
          </button>
        </div>
      </div>
    </div>
  )
}
