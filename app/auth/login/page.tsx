"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const particleConfigs = [
  { left: "8%", top: "16%", size: 14, duration: "26s", delay: "0s", color: "rgba(236, 72, 153, 0.45)" },
  { left: "18%", top: "68%", size: 10, duration: "22s", delay: "1.5s", color: "rgba(139, 92, 246, 0.4)" },
  { left: "28%", top: "32%", size: 18, duration: "28s", delay: "2.5s", color: "rgba(96, 165, 250, 0.35)" },
  { left: "42%", top: "74%", size: 12, duration: "24s", delay: "0.75s", color: "rgba(56, 189, 248, 0.4)" },
  { left: "56%", top: "18%", size: 8, duration: "20s", delay: "3s", color: "rgba(255, 255, 255, 0.45)" },
  { left: "68%", top: "58%", size: 16, duration: "30s", delay: "1.25s", color: "rgba(59, 130, 246, 0.35)" },
  { left: "74%", top: "26%", size: 11, duration: "23s", delay: "2.75s", color: "rgba(236, 72, 153, 0.4)" },
  { left: "82%", top: "64%", size: 9, duration: "21s", delay: "0.5s", color: "rgba(34, 197, 94, 0.35)" },
  { left: "12%", top: "82%", size: 7, duration: "18s", delay: "4s", color: "rgba(59, 130, 246, 0.3)" },
  { left: "48%", top: "12%", size: 13, duration: "25s", delay: "3.5s", color: "rgba(255, 255, 255, 0.35)" },
  { left: "64%", top: "86%", size: 17, duration: "32s", delay: "1.9s", color: "rgba(96, 165, 250, 0.35)" },
  { left: "90%", top: "38%", size: 9, duration: "24s", delay: "2.1s", color: "rgba(236, 72, 153, 0.35)" },
] as const

const avatarConfigs = [
  { bg: "bg-[#ec4899]/90", Icon: Users },
  { bg: "bg-white/90", Icon: MessageCircle, iconClass: "text-[#7c3aed]" },
  { bg: "bg-[#34d399]/90", Icon: Users },
] as const

function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particleConfigs.map((particle, index) => (
        <span
          key={index}
          className="absolute rounded-full blur-[1px] opacity-50 animate-float-up"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setInfo(null)

    try {
      const supabase = createClient()
      if (useMagicLink) {
        const { error: magicError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          },
        })

        if (magicError) throw magicError
        setInfo("Magic link sent! Check your inbox to continue.")
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.session) {
          router.replace("/app")
          router.refresh()
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: socialError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (socialError) throw socialError
    } catch (err: any) {
      setError(err.message || "Failed to log in with social provider")
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f172a] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.2),transparent_55%)]" />
      <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-[#8b5cf6]/35 blur-[160px]" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#ec4899]/30 blur-[140px]" />
      <ParticleField />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-12 w-12 rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="mt-8 flex flex-1 justify-center pb-10">
          <div className="w-full max-w-xl space-y-10">
            <header className="space-y-8 text-center">
              <div className="flex items-center justify-center gap-6">
                {avatarConfigs.map(({ bg, Icon, iconClass }, index) => (
                  <div
                    key={index}
                    className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/20 shadow-[0_18px_40px_rgba(15,23,42,0.35)] ${bg}`}
                  >
                    <Icon className={`h-9 w-9 text-white ${iconClass ?? "text-white"}`} />
                  </div>
                ))}
              </div>

              <div className="mx-auto w-fit rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-medium text-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
                Let&apos;s practice!
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Let&apos;s get you signed in!</h1>
                <p className="text-base text-slate-300">Pick up your language exchange journey right where you left off.</p>
              </div>
            </header>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-200">
              <span>You don&apos;t have an account yet?</span>
              <Link href="/auth/signup" className="font-semibold text-sky-300 transition hover:text-white">
                Sign up
              </Link>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-10">
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <div className="group relative flex items-center rounded-2xl border border-white/10 bg-white/5 pr-3 transition focus-within:border-sky-400/60 focus-within:bg-white/10">
                    <Mail className="ml-4 h-5 w-5 text-slate-200/70 transition group-focus-within:text-sky-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      disabled={isLoading}
                      className="h-14 border-0 bg-transparent pl-4 text-base text-white placeholder:text-slate-400 focus-visible:border-0 focus-visible:ring-0 disabled:text-white/40"
                    />
                  </div>
                </div>

                {!useMagicLink && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium text-slate-200">
                        Password
                      </label>
                      <Link href="/auth/reset-password" className="text-sm font-medium text-sky-300 hover:text-white">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="group relative flex items-center rounded-2xl border border-white/10 bg-white/5 pr-3 transition focus-within:border-sky-400/60 focus-within:bg-white/10">
                      <Lock className="ml-4 h-5 w-5 text-slate-200/70 transition group-focus-within:text-sky-300" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 border-0 bg-transparent pl-4 pr-12 text-base text-white placeholder:text-slate-400 focus-visible:border-0 focus-visible:ring-0 disabled:text-white/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {info && (
                  <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                    {info}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email || (!useMagicLink && !password)}
                  className="group relative w-full overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#8b5cf6] via-[#6366f1] to-[#3b82f6] py-3.5 text-base font-semibold text-white shadow-[0_20px_55px_rgba(59,130,246,0.35)] transition hover:shadow-[0_24px_70px_rgba(59,130,246,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>{useMagicLink ? "Sending magic link..." : "Signing you in..."}</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {useMagicLink ? "Send Magic Link" : "Sign In"}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>

                <div className="text-center text-sm text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setUseMagicLink((prev) => !prev)
                      setError(null)
                      setInfo(null)
                    }}
                    className="font-semibold text-sky-300 transition hover:text-white"
                  >
                    {useMagicLink ? "Use password instead" : "Use magic link instead"}
                  </button>
                </div>

                <div className="space-y-5 pt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-px w-full bg-white/10" />
                    </div>
                    <span className="relative mx-auto flex w-fit items-center justify-center rounded-full bg-white/10 px-5 py-1 text-xs font-medium uppercase tracking-[0.35em] text-slate-200/80">
                      or continue with
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleSocialLogin("google")}
                      disabled={isLoading}
                      className="glass-button h-12 rounded-2xl border border-white/10 bg-white/10 text-sm font-medium text-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleSocialLogin("facebook")}
                      disabled={isLoading}
                      className="glass-button h-12 rounded-2xl border border-white/10 bg-white/10 text-sm font-medium text-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleSocialLogin("apple")}
                      disabled={isLoading}
                      className="glass-button h-12 rounded-2xl border border-white/10 bg-white/10 text-sm font-medium text-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
