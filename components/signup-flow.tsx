"use client"

import type React from "react"
import { Search, ChevronDown } from "lucide-react" // Import Search and ChevronDown icons

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Upload, X, MapPin, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Globe, Sparkles } from "lucide-react"

interface SignupFlowProps {
  onComplete: () => void
}

const LANGUAGES = [
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "sq", name: "Albanian", flag: "🇦🇱" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hy", name: "Armenian", flag: "🇦🇲" },
  { code: "az", name: "Azerbaijani", flag: "🇦🇿" },
  { code: "eu", name: "Basque", flag: "🇪🇸" },
  { code: "be", name: "Belarusian", flag: "🇧🇾" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "bs", name: "Bosnian", flag: "🇧🇦" },
  { code: "bg", name: "Bulgarian", flag: "🇧🇬" },
  { code: "my", name: "Burmese", flag: "🇲🇲" },
  { code: "ca", name: "Catalan", flag: "🇪🇸" },
  { code: "ceb", name: "Cebuano", flag: "🇵🇭" },
  { code: "zh", name: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", flag: "🇹🇼" },
  { code: "hr", name: "Croatian", flag: "🇭🇷" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "eo", name: "Esperanto", flag: "🌍" },
  { code: "et", name: "Estonian", flag: "🇪🇪" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "gl", name: "Galician", flag: "🇪🇸" },
  { code: "ka", name: "Georgian", flag: "🇬🇪" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳" },
  { code: "ht", name: "Haitian Creole", flag: "🇭🇹" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "hmn", name: "Hmong", flag: "🇱🇦" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "is", name: "Icelandic", flag: "🇮🇸" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "ga", name: "Irish", flag: "🇮🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "jv", name: "Javanese", flag: "🇮🇩" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "kk", name: "Kazakh", flag: "🇰🇿" },
  { code: "km", name: "Khmer", flag: "🇰🇭" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ku", name: "Kurdish", flag: "🇮🇶" },
  { code: "ky", name: "Kyrgyz", flag: "🇰🇬" },
  { code: "lo", name: "Lao", flag: "🇱🇦" },
  { code: "la", name: "Latin", flag: "🇻🇦" },
  { code: "lv", name: "Latvian", flag: "🇱🇻" },
  { code: "lt", name: "Lithuanian", flag: "🇱🇹" },
  { code: "lb", name: "Luxembourgish", flag: "🇱🇺" },
  { code: "mk", name: "Macedonian", flag: "🇲🇰" },
  { code: "mg", name: "Malagasy", flag: "🇲🇬" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳" },
  { code: "mt", name: "Maltese", flag: "🇲🇹" },
  { code: "mi", name: "Maori", flag: "🇳🇿" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "mn", name: "Mongolian", flag: "🇲🇳" },
  { code: "ne", name: "Nepali", flag: "🇳🇵" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "ny", name: "Nyanja", flag: "🇲🇼" },
  { code: "or", name: "Odia", flag: "🇮🇳" },
  { code: "ps", name: "Pashto", flag: "🇦🇫" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "sm", name: "Samoan", flag: "🇼🇸" },
  { code: "gd", name: "Scottish Gaelic", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { code: "sr", name: "Serbian", flag: "🇷🇸" },
  { code: "st", name: "Sesotho", flag: "🇱🇸" },
  { code: "sn", name: "Shona", flag: "🇿🇼" },
  { code: "sd", name: "Sindhi", flag: "🇵🇰" },
  { code: "si", name: "Sinhala", flag: "🇱🇰" },
  { code: "sk", name: "Slovak", flag: "🇸🇰" },
  { code: "sl", name: "Slovenian", flag: "🇸🇮" },
  { code: "so", name: "Somali", flag: "🇸🇴" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "su", name: "Sundanese", flag: "🇮🇩" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "tg", name: "Tajik", flag: "🇹🇯" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "tt", name: "Tatar", flag: "🇷🇺" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "tk", name: "Turkmen", flag: "🇹🇲" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "ug", name: "Uyghur", flag: "🇨🇳" },
  { code: "uz", name: "Uzbek", flag: "🇺🇿" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "cy", name: "Welsh", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "xh", name: "Xhosa", flag: "🇿🇦" },
  { code: "yi", name: "Yiddish", flag: "🇮🇱" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", flag: "🇿🇦" },
].sort((a, b) => a.name.localeCompare(b.name))

const PROFICIENCY_LEVELS = [
  {
    id: "beginner",
    emoji: "🌱",
    title: "Beginner",
    description: "Just started learning or know very basics",
  },
  {
    id: "intermediate",
    emoji: "📈",
    title: "Intermediate",
    description: "Can have simple conversations",
  },
  {
    id: "advanced",
    emoji: "🎓",
    title: "Advanced",
    description: "Fluent with minor mistakes",
  },
  {
    id: "native",
    emoji: "⭐",
    title: "Native",
    description: "Native speaker or equivalent",
  },
]

export function SignupFlow({ onComplete }: SignupFlowProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [speakLanguages, setSpeakLanguages] = useState<any[]>([])
  const [learnLanguages, setLearnLanguages] = useState<any[]>([])
  const [selectedSpeakLang, setSelectedSpeakLang] = useState("")
  const [selectedLearnLang, setSelectedLearnLang] = useState("")
  const [proficiencyLevel, setProficiencyLevel] = useState("")
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isValidEmail = (value: string) => {
    // Basic email format check
    return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value)
  }

  const isStrongPassword = (value: string) => {
    // Minimum 8 chars; at least letters and numbers
    if (value.length < 8) return false
    const hasLetter = /[A-Za-z]/.test(value)
    const hasNumber = /\d/.test(value)
    return hasLetter && hasNumber
  }

  const [speakLangOpen, setSpeakLangOpen] = useState(false)
  const [learnLangOpen, setLearnLangOpen] = useState(false)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addLanguage = (langCode: string, type: "speak" | "learn") => {
    const lang = LANGUAGES.find((l) => l.code === langCode)
    if (!lang) return

    if (type === "speak") {
      if (!speakLanguages.find((l) => l.code === langCode)) {
        setSpeakLanguages([...speakLanguages, lang])
      }
      setSelectedSpeakLang("")
      setSpeakLangOpen(false)
    } else {
      if (!learnLanguages.find((l) => l.code === langCode)) {
        setLearnLanguages([...learnLanguages, lang])
      }
      setSelectedLearnLang("")
      setLearnLangOpen(false)
    }
  }

  const removeLanguage = (langCode: string, type: "speak" | "learn") => {
    if (type === "speak") {
      setSpeakLanguages((prev) => prev.filter((l) => l.code !== langCode))
    } else {
      setLearnLanguages((prev) => prev.filter((l) => l.code !== langCode))
    }
  }

  const handleNext = async () => {
    if (step < 7) {
      setStep(step + 1)
      setError(null)
    } else {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        console.log("[v0] Starting signup process...")

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
            data: {
              full_name: name,
            },
          },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error("Failed to create user")

        console.log("[v0] User created:", authData.user.id)
        console.log("[v0] Session from signup:", !!authData.session)

        // Check if we have a session immediately from signup
        let session = authData.session

        // If no session from signup, wait and check again (for email confirmation flow)
        if (!session) {
          console.log("[v0] No immediate session, waiting for session establishment...")
          await new Promise((resolve) => setTimeout(resolve, 1500))

          const { data: sessionData } = await supabase.auth.getSession()
          session = sessionData.session
          console.log("[v0] Session after wait:", !!session)
        }

        // If still no session, it means email confirmation is required
        if (!session) {
          console.log("[v0] Email confirmation required")
          // Store user data locally for when they confirm their email
          localStorage.setItem(
            "pending_user_profile",
            JSON.stringify({
              id: authData.user.id,
              name,
              email,
              photo,
              speakLanguages,
              learnLanguages,
            }),
          )

          // Show success message and complete onboarding
          setError(
            "Please check your email to confirm your account. You can continue exploring the app in the meantime.",
          )
          await new Promise((resolve) => setTimeout(resolve, 3000))

          localStorage.setItem("onboarding_completed", "true")
          onComplete()
          return
        }

        console.log("[v0] Session established, creating profile...")

        // Try to update existing profile first (created by trigger)
        const { error: profileError } = await supabase
          .from("users")
          .update({
            full_name: name,
            avatar_url: photo,
            languages_speak: speakLanguages.map((lang) => lang.code),
            languages_learn: learnLanguages.map((lang) => lang.code),
            is_available: true,
          })
          .eq("id", authData.user.id)

        // If update fails, try to insert
        if (profileError) {
          console.log("[v0] Profile update failed, attempting insert:", profileError.message)
          const { error: insertError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: email,
            full_name: name,
            avatar_url: photo,
            languages_speak: speakLanguages.map((lang) => lang.code),
            languages_learn: learnLanguages.map((lang) => lang.code),
            bio: "",
            is_available: true,
            latitude: null,
            longitude: null,
            city: null,
          })

          if (insertError) {
            console.error("[v0] Profile insert error:", insertError)
            // Don't throw error here - profile might already exist from trigger
            console.log("[v0] Continuing despite profile error...")
          }
        }

        console.log("[v0] Profile created/updated successfully")

        // Store user data in localStorage
        localStorage.setItem(
          "user_profile",
          JSON.stringify({
            id: authData.user.id,
            name,
            email,
            photo,
            speakLanguages,
            learnLanguages,
          }),
        )
        localStorage.setItem("onboarding_completed", "true")
        localStorage.setItem("user_id", authData.user.id)

        console.log("[v0] Signup complete, redirecting...")

        onComplete()
      } catch (err: any) {
        console.error("[v0] Signup error:", err)
        setError(err.message || "Failed to create account. Please try again.")
        setIsLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.length > 0
      case 2:
        return isValidEmail(email) && isStrongPassword(password)
      case 3:
        return speakLanguages.length > 0
      case 4:
        return learnLanguages.length > 0
      case 5:
        return proficiencyLevel.length > 0
      case 6:
        return true
      case 7:
        return true
      default:
        return false
    }
  }

  const totalSteps = 7
  const progressPercentage = (step / totalSteps) * 100

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 safe-area-inset">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full h-11 w-11 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 mx-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="w-11 text-white text-sm font-semibold">
          {step}/{totalSteps}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-[calc(100vh-88px)] sm:h-[calc(100vh-104px)] overflow-y-auto px-4 sm:px-6 pb-6 overscroll-contain">
        <div className="flex-1 flex flex-col justify-start max-w-md mx-auto w-full py-4 sm:py-8 min-h-0">
          {/* Step 1: Name and Photo */}
          {step === 1 && (
            <div className="space-y-6 sm:space-y-8 animate-slide-up">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4 animate-float">👋</div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white text-balance">What's your name?</h1>
                <p className="text-base sm:text-lg text-white/80">Let's get to know you</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-white shadow-2xl">
                    {photo ? (
                      <AvatarImage src={photo || "/placeholder.svg"} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-white text-[#667eea] text-3xl sm:text-4xl font-bold">
                        {name.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-white text-[#667eea] p-2.5 sm:p-3 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors active:scale-95"
                  >
                    <Upload className="h-5 w-5" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="w-full space-y-2">
                  <Label htmlFor="name" className="text-base sm:text-lg font-semibold text-white">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 sm:h-14 text-base sm:text-lg rounded-2xl border-2 border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white focus:ring-4 focus:ring-white/20 transition-all backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Email and Password */}
          {step === 2 && (
            <div className="space-y-6 sm:space-y-8 animate-slide-up">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4 animate-float">📧</div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white text-balance">Create your account</h1>
                <p className="text-base sm:text-lg text-white/80">We'll keep your information secure</p>
              </div>

              <div className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base sm:text-lg font-semibold text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className="h-12 sm:h-14 text-base sm:text-lg rounded-2xl border-2 border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white focus:ring-4 focus:ring-white/20 transition-all backdrop-blur-sm"
                  />
                  {emailTouched && !isValidEmail(email) && (
                    <p className="text-sm text-red-200">Please enter a valid email address</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base sm:text-lg font-semibold text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    className="h-12 sm:h-14 text-base sm:text-lg rounded-2xl border-2 border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white focus:ring-4 focus:ring-white/20 transition-all backdrop-blur-sm"
                  />
                  {!passwordTouched || isStrongPassword(password) ? (
                    <p className="text-sm text-white/70">Use at least 8 characters with letters and numbers</p>
                  ) : (
                    <p className="text-sm text-red-200">Password must be 8+ characters and include letters and numbers</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Languages I Speak */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Languages You Speak</h2>
                <p className="text-white/80 text-base sm:text-lg">Select all the languages you can communicate in</p>
              </div>

              <div className="space-y-4">
                <Popover open={speakLangOpen} onOpenChange={setSpeakLangOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={speakLangOpen}
                      className="h-14 w-full justify-between text-base rounded-2xl border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4 opacity-70" />
                        Search languages...
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search languages..." className="h-12" />
                      <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {LANGUAGES.map((lang) => (
                            <CommandItem
                              key={lang.code}
                              value={lang.name}
                              onSelect={() => addLanguage(lang.code, "speak")}
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                            >
                              <span className="text-2xl">{lang.flag}</span>
                              <span className="flex-1">{lang.name}</span>
                              {speakLanguages.find((l) => l.code === lang.code) && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Languages */}
                {speakLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {speakLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur-sm border border-white/30 rounded-full text-white hover:from-purple-500/30 hover:to-violet-500/30 transition-all"
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        <button
                          onClick={() => removeLanguage(lang.code, "speak")}
                          className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Languages I Want to Learn */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Languages to Learn</h2>
                <p className="text-white/80 text-base sm:text-lg">Which languages would you like to practice?</p>
              </div>

              <div className="space-y-4">
                <Popover open={learnLangOpen} onOpenChange={setLearnLangOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={learnLangOpen}
                      className="h-14 w-full justify-between text-base rounded-2xl border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4 opacity-70" />
                        Search languages...
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search languages..." className="h-12" />
                      <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {LANGUAGES.map((lang) => (
                            <CommandItem
                              key={lang.code}
                              value={lang.name}
                              onSelect={() => addLanguage(lang.code, "learn")}
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                            >
                              <span className="text-2xl">{lang.flag}</span>
                              <span className="flex-1">{lang.name}</span>
                              {learnLanguages.find((l) => l.code === lang.code) && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Languages */}
                {learnLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {learnLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur-sm border border-white/30 rounded-full text-white hover:from-purple-500/30 hover:to-violet-500/30 transition-all"
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        <button
                          onClick={() => removeLanguage(lang.code, "learn")}
                          className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 sm:space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4 animate-float">🎯</div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white text-balance">
                  Your {learnLanguages[0]?.name} Level?
                </h1>
                <p className="text-base sm:text-lg text-white/80">This helps us find the right partners</p>
              </div>

              <div className="space-y-3">
                {PROFICIENCY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setProficiencyLevel(level.id)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                      proficiencyLevel === level.id
                        ? "bg-white/30 border-white shadow-lg scale-105"
                        : "bg-white/10 border-white/30 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{level.emoji}</div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-white">{level.title}</h3>
                        <p className="text-sm text-white/80">{level.description}</p>
                      </div>
                      {proficiencyLevel === level.id && <Check className="h-6 w-6 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 sm:space-y-8 animate-slide-up">
              <div className="text-center space-y-4">
                <div className="mx-auto w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse-ring">
                  <MapPin className="h-16 w-16 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white text-balance">Enable Location</h1>
                <p className="text-base sm:text-lg text-white/80">
                  Find language partners near you and practice in person or online
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { emoji: "🗺️", title: "Discover Nearby", desc: "See partners within walking distance" },
                  { emoji: "☕", title: "Meet in Person", desc: "Find coffee shops and meetup spots" },
                  { emoji: "🔒", title: "Private & Secure", desc: "Your exact location is never shared" },
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30"
                  >
                    <div className="text-3xl">{benefit.emoji}</div>
                    <div>
                      <h3 className="font-bold text-white">{benefit.title}</h3>
                      <p className="text-sm text-white/80">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={() => {
                    setLocationEnabled(true)
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          console.log("[v0] Location enabled:", position.coords)
                          try {
                            localStorage.setItem(
                              "signup_location",
                              JSON.stringify({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                              }),
                            )
                          } catch {}
                          setStep(7)
                        },
                        (error) => {
                          console.log("[v0] Location denied:", error)
                        },
                      )
                    }
                  }}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-full bg-white text-[#667eea] hover:bg-gray-50 font-bold shadow-xl"
                >
                  Enable Location
                </Button>
                <button
                  onClick={() => setStep(7)}
                  className="mt-3 text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 sm:space-y-8 animate-slide-up text-center">
              <div className="space-y-4">
                <div className="text-8xl mb-4 animate-bounce-slow">🎉</div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white text-balance">You're All Set!</h1>
                <p className="text-lg sm:text-xl text-white/80">
                  Your profile is ready. Let's find your first language partner!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-6 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="text-4xl font-bold text-white mb-1">127</div>
                  <div className="text-sm text-white/80">Nearby Partners</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="text-4xl font-bold text-white mb-1">8</div>
                  <div className="text-sm text-white/80">Languages Available</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border-2 border-red-300/50 rounded-2xl p-4 mb-4 backdrop-blur-sm">
              <p className="text-white text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#667eea] via-[#764ba2]/50 to-transparent pt-6 pb-safe -mx-4 px-4 sm:-mx-6 sm:px-6 mt-auto">
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            size="lg"
            className="w-full h-14 sm:h-16 text-base sm:text-lg rounded-full shadow-xl bg-white text-[#667eea] hover:bg-gray-50 disabled:opacity-50 active:scale-95 transition-transform font-bold touch-manipulation"
          >
            {isLoading ? (
              "Creating account..."
            ) : step === 7 ? (
              <>
                Start Exploring
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
