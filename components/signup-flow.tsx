"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SignupFlowProps {
  onComplete: () => void
}

type Language = {
  code: string
  name: string
  flag: string
}

const LANGUAGES: Language[] = [
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
  { code: "gd", name: "Scottish Gaelic", flag: "🏴" },
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
  { code: "cy", name: "Welsh", flag: "🏴" },
  { code: "xh", name: "Xhosa", flag: "🇿🇦" },
  { code: "yi", name: "Yiddish", flag: "🇮🇱" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", flag: "🇿🇦" },
].sort((a, b) => a.name.localeCompare(b.name))

const STEP_META = [
  {
    id: 1,
    label: "Basics",
    title: "Set up your account",
    description: "Share a friendly name and secure your login in under a minute.",
  },
  {
    id: 2,
    label: "Languages",
    title: "Pick your languages",
    description: "Let us know what you speak and what you’d love to learn. We’ll take care of the matching.",
  },
  {
    id: 3,
    label: "Location",
    title: "Share your location",
    description: "Let us place you on the Den Haag map so we can surface language partners nearby.",
  },
  {
    id: 4,
    label: "Finish",
    title: "Ready to explore",
    description: "Review everything at a glance and dive straight into the community.",
  },
] as const

const TOTAL_STEPS = STEP_META.length

export function SignupFlow({ onComplete }: SignupFlowProps) {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [speakLanguages, setSpeakLanguages] = useState<Language[]>([])
  const [learnLanguages, setLearnLanguages] = useState<Language[]>([])
  const [speakOpen, setSpeakOpen] = useState(false)
  const [learnOpen, setLearnOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle")
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const isValidEmail = (value: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value)

  const isStrongPassword = (value: string) => {
    if (value.length < 6) return false
    const hasLetter = /[A-Za-z]/.test(value)
    const hasNumber = /\d/.test(value)
    return hasLetter && hasNumber
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("signup_location")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.latitude && parsed?.longitude) {
          setLocationCoords(parsed)
          setLocationStatus("granted")
          setLocationMessage("Location ready — we’ll show partners that are close by.")
        }
      }
    } catch (err) {
      console.warn("[SignupFlow] Failed to read saved signup location:", err)
    }
  }, [])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addLanguage = (code: string, type: "speak" | "learn") => {
    const language = LANGUAGES.find((item) => item.code === code)
    if (!language) return

    if (type === "speak") {
      setSpeakLanguages((prev) => (prev.some((item) => item.code === code) ? prev : [...prev, language]))
      setSpeakOpen(false)
    } else {
      setLearnLanguages((prev) => (prev.some((item) => item.code === code) ? prev : [...prev, language]))
      setLearnOpen(false)
    }
  }

  const removeLanguage = (code: string, type: "speak" | "learn") => {
    if (type === "speak") {
      setSpeakLanguages((prev) => prev.filter((item) => item.code !== code))
    } else {
      setLearnLanguages((prev) => prev.filter((item) => item.code !== code))
    }
  }

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("denied")
      setLocationMessage("Location services aren’t available in this browser. Try switching browsers or enabling them in your settings.")
      return
    }

    setLocationStatus("loading")
    setLocationMessage("Requesting your location…")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const coords = {
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
        }
        setLocationCoords(coords)
        setLocationStatus("granted")
        setLocationMessage("Location enabled! We’ll show partners near you in Den Haag.")
        try {
          localStorage.setItem("signup_location", JSON.stringify(coords))
        } catch (error) {
          console.warn("[SignupFlow] Failed to persist signup_location:", error)
        }
      },
      (geoError) => {
        console.warn("[SignupFlow] Geolocation error:", geoError)
        setLocationStatus("denied")
        setLocationCoords(null)
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationMessage("We couldn’t access your location. Please allow location sharing in your browser to continue.")
        } else {
          setLocationMessage("We couldn’t determine your location just yet. Try again or adjust your browser settings.")
        }
        try {
          localStorage.removeItem("signup_location")
        } catch {}
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    )
  }

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setShowSuccess(false)
    setSuccessMessage(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            full_name: name,
          },
        },
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error("Failed to create account")

      let { session } = data
      if (!session) {
        await new Promise((resolve) => setTimeout(resolve, 1400))
        const { data: sessionData } = await supabase.auth.getSession()
        session = sessionData.session
      }

      if (!session) {
        localStorage.setItem(
          "pending_user_profile",
          JSON.stringify({
            id: data.user.id,
            name,
            email,
            photo,
            speakLanguages,
            learnLanguages,
            location: locationCoords,
          }),
        )
        localStorage.setItem("onboarding_completed", "true")
        setSuccessMessage("Check your email to activate your account. Taking you to the status screen…")
        setShowSuccess(true)
        setTimeout(() => {
          onComplete()
        }, 2000)
        return
      }

      const profilePayload = {
        full_name: name,
        avatar_url: photo,
        languages_speak: speakLanguages.map((item) => item.code),
        languages_learn: learnLanguages.map((item) => item.code),
        is_available: true,
        latitude: locationCoords?.latitude ?? null,
        longitude: locationCoords?.longitude ?? null,
      }

      const { error: updateError } = await supabase.from("users").update(profilePayload).eq("id", data.user.id)

      if (updateError) {
        await supabase.from("users").insert({
          id: data.user.id,
          email,
          ...profilePayload,
          bio: "",
          latitude: null,
          longitude: null,
          city: null,
        })
      }

      localStorage.setItem(
        "user_profile",
        JSON.stringify({
          id: data.user.id,
          name,
          email,
          photo,
          speakLanguages,
          learnLanguages,
        }),
      )
      localStorage.setItem("onboarding_completed", "true")
      localStorage.setItem("user_id", data.user.id)

      setSuccessMessage("Your account is ready! Redirecting you to your map…")
      setShowSuccess(true)
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
      setIsLoading(false)
      setShowSuccess(false)
      setSuccessMessage(null)
    }
  }

  const handleBack = () => {
    if (step === 1) {
      router.back()
      return
    }
    setStep((prev) => Math.max(1, prev - 1))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0 && isValidEmail(email) && isStrongPassword(password)
      case 2:
        return speakLanguages.length > 0 || learnLanguages.length > 0
      case 3:
        return locationStatus === "granted" && !!locationCoords
      default:
        return true
    }
  }

  const progressPercentage = ((step - 1) / (TOTAL_STEPS - 1 || 1)) * 100
  const activeStepMeta = useMemo(() => STEP_META[step - 1], [step])
  const nextStepLabel =
    step === TOTAL_STEPS ? "Ready to launch" : STEP_META[Math.min(step, STEP_META.length - 1)].label

  if (showSuccess && successMessage) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#050618] text-white">
        <BackgroundGlow />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md rounded-[32px] border border-white/12 bg-white/10 p-8 text-center shadow-[0_45px_120px_rgba(8,11,34,0.55)] backdrop-blur-[32px]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white">All set!</h1>
            <p className="mt-3 text-base text-white/75">{successMessage}</p>
            <p className="mt-10 text-sm text-white/50">Hang tight—this will only take a moment.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050618] text-white">
      <BackgroundGlow />

      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col items-center px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex w-full max-w-4xl items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-11 w-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex w-full flex-1 items-center gap-3 px-6">
            <div className="h-[5px] flex-1 rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#6366f1] to-[#3b82f6]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-white/70">
              {step}/{TOTAL_STEPS}
            </span>
          </div>
        </header>

        <main className="mt-10 flex w-full max-w-4xl flex-1 flex-col gap-8 rounded-[32px] border border-white/12 bg-white/8 px-6 py-8 shadow-[0_45px_120px_rgba(8,11,34,0.55)] backdrop-blur-[32px] sm:px-10 lg:flex-row lg:items-start lg:gap-12">
          <aside className="lg:w-72">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/75">
              <Sparkles className="h-4 w-4" />
              Step {step} · {activeStepMeta.label}
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight">{activeStepMeta.title}</h1>
            <p className="mt-3 text-sm text-white/70">{activeStepMeta.description}</p>

            <div className="mt-10 space-y-3">
              {STEP_META.map((meta) => {
                const isActive = meta.id === step
                const isDone = meta.id < step
                return (
                  <div
                    key={meta.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-white/70 bg-white/15 text-white"
                        : isDone
                          ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                          : "border-white/10 bg-white/5 text-white/55"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-white text-slate-900"
                          : isDone
                            ? "bg-emerald-400 text-slate-900"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : meta.id}
                    </span>
                    {meta.label}
                  </div>
                )
              })}
            </div>
          </aside>

          <section className="flex flex-1 flex-col gap-6">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <div className="relative">
                    <Avatar className="h-28 w-28 border-4 border-white/25 shadow-[0_25px_70px_rgba(76,81,205,0.45)]">
                      {photo ? (
                        <AvatarImage src={photo || "/placeholder.svg"} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] text-3xl font-semibold text-white">
                          {name.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <label
                      htmlFor="photo-upload"
                      className="absolute -bottom-2 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white text-[#4338ca] shadow-xl transition hover:scale-105 hover:bg-slate-50 active:scale-95"
                    >
                      <Upload className="h-5 w-5" />
                    </label>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>

                  <div className="w-full space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                        Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-14 rounded-2xl border border-white/15 bg-black/10 px-5 text-base text-white placeholder:text-white/40 focus:border-[#7c3aed]/70 focus:ring-4 focus:ring-[#7c3aed]/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        className="h-14 rounded-2xl border border-white/15 bg-black/10 px-5 text-base text-white placeholder:text-white/40 focus:border-[#7c3aed]/70 focus:ring-4 focus:ring-[#7c3aed]/30"
                      />
                      {emailTouched && !isValidEmail(email) && (
                        <p className="text-sm text-rose-200/90">Please enter a valid email address.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters with letters and numbers"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        className="h-14 rounded-2xl border border-white/15 bg-black/10 px-5 text-base text-white placeholder:text-white/40 focus:border-[#7c3aed]/70 focus:ring-4 focus:ring-[#7c3aed]/30"
                      />
                      <p className="text-sm text-white/55">
                        {passwordTouched && !isStrongPassword(password)
                          ? "Try a mix of letters and numbers with at least 6 characters."
                          : "You can update this later from your profile settings."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fade-in">
                <LanguagePicker
                  title="Languages you speak"
                  description="Let others know what you can help them with."
                  placeholder="Search languages..."
                  open={speakOpen}
                  setOpen={setSpeakOpen}
                  selected={speakLanguages}
                  onAdd={(code) => addLanguage(code, "speak")}
                  onRemove={(code) => removeLanguage(code, "speak")}
                  emptyLabel="Add at least one language to teach or support."
                />

                <LanguagePicker
                  title="Languages you’re learning"
                  description="Pick everything you’re excited to practise."
                  placeholder="Search languages..."
                  open={learnOpen}
                  setOpen={setLearnOpen}
                  selected={learnLanguages}
                  onAdd={(code) => addLanguage(code, "learn")}
                  onRemove={(code) => removeLanguage(code, "learn")}
                  emptyLabel="Optional, but helps us tailor recommendations."
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div className="rounded-3xl border border-white/12 bg-white/10 p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 text-left">
                      <h3 className="text-xl font-semibold text-white">Unlock nearby partners</h3>
                      <p className="text-sm leading-relaxed text-white/70">
                        We use your device location to surface people who are practising languages around Den Haag, suggest pop-up meetups,
                        and give your exchanges a head start. You can switch this off later in settings.
                      </p>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li>• See who’s practising within walking distance.</li>
                        <li>• Get alerts about Dutch Language Café meetups nearby.</li>
                        <li>• Control your visibility at any time.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/12 bg-white/5 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {locationStatus === "granted" ? "Location enabled" : "Share your live location"}
                      </p>
                      <p className="mt-1 text-sm text-white/65">
                        {locationStatus === "granted"
                          ? "Great! We’ll match you with partners closest to you."
                          : "Tap the button to allow location access. We only use it to help you connect faster."}
                      </p>
                      {locationCoords && (
                        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/40">
                          {locationCoords.latitude.toFixed(4)}° N · {locationCoords.longitude.toFixed(4)}° E
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={requestLocation}
                      disabled={locationStatus === "loading"}
                      className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/90 px-6 text-sm font-semibold text-slate-900 transition hover:bg-white"
                    >
                      {locationStatus === "loading" ? (
                        "Requesting..."
                      ) : locationStatus === "granted" ? (
                        <>
                          Location added
                          <Check className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5" />
                        </>
                      ) : (
                        <>
                          Enable location
                          <LocateFixed className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {locationMessage && (
                    <div
                      className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                        locationStatus === "denied"
                          ? "border-rose-400/40 bg-rose-500/12 text-rose-100"
                          : "border-emerald-400/40 bg-emerald-500/15 text-emerald-50"
                      }`}
                    >
                      {locationMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white">Account snapshot</h3>
                  <div className="mt-4 space-y-2 text-sm text-white/75">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Name:</span>
                      <span>{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Email:</span>
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Location sharing:</span>
                      <span>{locationStatus === "granted" ? "Enabled" : "Pending"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryCard title="You speak" items={speakLanguages} placeholder="Add a language in the previous step." />
                  <SummaryCard title="You’re learning" items={learnLanguages} placeholder="Set this anytime later." />
                </div>

                <p className="text-sm text-white/65">
                  When you finish, we’ll set up your space and suggest partners that fit your goals. You can tweak your
                  preferences, languages, and location sharing any time from the dashboard.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
          </section>
        </main>

        <footer className="mt-8 flex w-full max-w-4xl flex-col gap-4 rounded-[26px] border border-white/12 bg-white/8 px-6 py-5 backdrop-blur-[28px] sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">{nextStepLabel}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-12 rounded-full border border-white/12 bg-white/5 px-7 text-sm font-medium text-white hover:bg-white/15"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-r from-[#8b5cf6] via-[#6366f1] to-[#3b82f6] px-8 text-sm font-semibold text-white shadow-[0_20px_55px_rgba(59,130,246,0.35)] transition hover:shadow-[0_26px_80px_rgba(59,130,246,0.45)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-10"
            >
              {isLoading ? (
                "Creating account..."
              ) : step === TOTAL_STEPS ? (
                <>
                  Dive in
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function LanguagePicker({
  title,
  description,
  placeholder,
  open,
  setOpen,
  selected,
  onAdd,
  onRemove,
  emptyLabel,
}: {
  title: string
  description: string
  placeholder: string
  open: boolean
  setOpen: (value: boolean) => void
  selected: Language[]
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  emptyLabel: string
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/12 bg-white/8 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/65">{description}</p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-2xl border border-white/15 bg-black/10 px-4 text-sm text-white/80 hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(380px,90vw)] overflow-hidden rounded-xl border border-white/10 bg-[#040720]/95 p-0 shadow-2xl backdrop-blur-xl">
          <Command>
            <CommandInput placeholder="Search languages..." className="border-b border-white/10" />
            <CommandList className="max-h-64">
              <CommandEmpty className="py-5 text-sm text-white/60">No language found.</CommandEmpty>
              <CommandGroup>
                {LANGUAGES.map((language) => (
                  <CommandItem
                    key={language.code}
                    value={language.name}
                    onSelect={() => onAdd(language.code)}
                    className="flex items-center gap-4 px-5 py-3 text-white/85"
                  >
                    <span className="text-xl">{language.flag}</span>
                    <span className="flex-1 text-sm">{language.name}</span>
                    {selected.some((item) => item.code === language.code) && <Check className="h-4 w-4 text-emerald-400" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((language) => (
            <div
              key={language.code}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white transition hover:border-white/30 hover:bg-white/15"
            >
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
              <button
                onClick={() => onRemove(language.code)}
                className="rounded-full bg-white/0 p-1 text-white/60 transition group-hover:bg-white/15 group-hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/55">{emptyLabel}</p>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  items,
  placeholder,
}: {
  title: string
  items: Language[]
  placeholder: string
}) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/8 p-6">
      <h4 className="text-base font-semibold text-white">{title}</h4>
      {items.length > 0 ? (
        <div className="mt-4 space-y-2 text-sm text-white/75">
          {items.map((language) => (
            <div key={language.code} className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/55">{placeholder}</p>
      )}
    </div>
  )
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-44 -left-32 h-96 w-96 rounded-full bg-[#6366f1]/45 blur-[170px]" />
      <div className="absolute top-[22%] right-[-140px] h-80 w-80 rounded-full bg-[#ec4899]/35 blur-[150px]" />
      <div className="absolute bottom-[-160px] left-[18%] h-[420px] w-[420px] rounded-full bg-[#0ea5e9]/25 blur-[180px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(129,140,248,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_95%_0%,rgba(244,114,182,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.65)_0%,rgba(3,5,24,0.92)_60%)]" />
    </div>
  )
}
