"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Globe2, MessageSquare, Sparkles, UsersRound, Play, Check, Star, Download, MapPin, Coffee, Trophy, Zap, TrendingUp, Radio, Map, Gamepad2, Camera, Gift, X, MessageCircle, Award, Shield, Clock, Smartphone, Languages, MessageSquareText } from "lucide-react"

import { AnimatedBeam } from "@/components/ui/animated-beam"

const HyperspeedBackground = dynamic(
  () =>
    import("@/components/marketing/hyperspeed-background").then(
      (mod) => mod.HyperspeedBackground,
    ),
  { ssr: false },
)

const hyperspeedEffectOptions = {
  distortion: "lightTunnel",
  lanesPerRoad: 3,
  roadWidth: 8,
  islandWidth: 1,
  totalSideLightSticks: 30,
  lightPairsPerRoadWay: 36,
  carLightsFade: 0.45,
  colors: {
    roadColor: 0x0f172a,
    islandColor: 0x111827,
    background: 0x1e293b,
    shoulderLines: 0x7c3aed,
    brokenLines: 0xa855f7,
    leftCars: [0x7c3aed, 0x9333ea, 0xf472b6],
    rightCars: [0x38bdf8, 0x22d3ee, 0xa855f7],
    sticks: 0xa855f7,
  },
}


const heroMapNodes = [
  {
    id: "nyc",
    flag: "🇺🇸",
    city: "New York",
    pairing: "Jess • Carlos",
    languages: "English ↔ Spanish",
    top: "18%",
    left: "18%",
    gradient: ["#22d3ee", "#38bdf8"],
  },
  {
    id: "lisbon",
    flag: "🇵🇹",
    city: "Lisbon",
    pairing: "Rita • Kenji",
    languages: "Portuguese ↔ Japanese",
    top: "32%",
    left: "46%",
    gradient: ["#ec4899", "#f97316"],
  },
  {
    id: "nairobi",
    flag: "🇰🇪",
    city: "Nairobi",
    pairing: "Amina • Luca",
    languages: "Swahili ↔ Italian",
    top: "55%",
    left: "54%",
    gradient: ["#fbbf24", "#22d3ee"],
  },
  {
    id: "dubai",
    flag: "🇦🇪",
    city: "Dubai",
    pairing: "Omar • Elena",
    languages: "Arabic ↔ Russian",
    top: "28%",
    left: "70%",
    gradient: ["#a855f7", "#9333ea"],
  },
  {
    id: "seoul",
    flag: "🇰🇷",
    city: "Seoul",
    pairing: "Minji • Theo",
    languages: "Korean ↔ French",
    top: "48%",
    left: "80%",
    gradient: ["#38bdf8", "#c084fc"],
  },
  {
    id: "sao-paulo",
    flag: "🇧🇷",
    city: "São Paulo",
    pairing: "Luiza • Sam",
    languages: "Portuguese ↔ English",
    top: "68%",
    left: "34%",
    gradient: ["#22c55e", "#10b981"],
  },
]

const connectionColors = ["#38bdf8", "#a855f7", "#f472b6", "#22d3ee", "#fbbf24", "#10b981"]

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const startValue = 0

          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const current = Math.floor(startValue + (end - startValue) * easeOutQuart)
            setCount(current)

            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setCount(end)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [end, duration, hasAnimated])

  return <span ref={ref}>{count.toLocaleString()}+</span>
}

const HeroWorldMap = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const nycRef = useRef<HTMLDivElement>(null)
  const lisbonRef = useRef<HTMLDivElement>(null)
  const nairobiRef = useRef<HTMLDivElement>(null)
  const dubaiRef = useRef<HTMLDivElement>(null)
  const seoulRef = useRef<HTMLDivElement>(null)
  const saoPauloRef = useRef<HTMLDivElement>(null)

  const nodes = [
    { ...heroMapNodes[0], ref: nycRef },
    { ...heroMapNodes[1], ref: lisbonRef },
    { ...heroMapNodes[2], ref: nairobiRef },
    { ...heroMapNodes[3], ref: dubaiRef },
    { ...heroMapNodes[4], ref: seoulRef },
    { ...heroMapNodes[5], ref: saoPauloRef },
  ]

  return (
    <div
      ref={containerRef}
      className="relative h-[360px] w-full overflow-hidden rounded-[3rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.3),rgba(8,12,24,0.9))] p-6 shadow-[0_32px_90px_rgba(56,189,248,0.25)] backdrop-blur"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(14,165,233,0.25),transparent_55%)] opacity-70" />
      <div className="absolute inset-4 rounded-[2.4rem] border border-white/10" />

      <div className="absolute inset-6 grid grid-cols-[repeat(28,1fr)] grid-rows-[repeat(14,1fr)] gap-[3px] opacity-40">
        {Array.from({ length: 28 * 14 }).map((_, index) => (
          <div
            key={index}
            className="size-[3px] rounded-full bg-white/40"
            style={{
              opacity: 0.2 + ((index % 7) / 14),
            }}
          />
        ))}
      </div>

      <div
        ref={hubRef}
        className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-[#7c3aed]/40 via-[#9333ea]/35 to-[#22d3ee]/30 text-center text-white shadow-[0_20px_60px_rgba(124,58,237,0.35)] backdrop-blur"
      >
        <p className="text-lg font-semibold">Taal Match</p>
        <p className="mt-2 text-xs text-white/80">Algorithm pairs you with native partners in real time.</p>
      </div>

      {nodes.map((node) => (
        <div
          key={node.id}
          ref={node.ref}
          className="absolute flex w-36 flex-col items-center text-center text-xs text-white"
          style={{ top: node.top, left: node.left }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-2xl shadow-lg shadow-[#38bdf8]/30"
            style={{
              background: "rgba(15,23,42,0.6)",
            }}
          >
            {node.flag}
          </span>
          <div className="mt-2 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-wide">{node.city}</div>
          <div className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] uppercase tracking-wide text-white/70">
            {node.languages}
          </div>
          <div className="mt-1 text-[11px] text-[#c4b5fd]">{node.pairing}</div>
        </div>
      ))}

      {nodes.map((node, index) => (
        <AnimatedBeam
          key={node.id}
          containerRef={containerRef}
          fromRef={node.ref}
          toRef={hubRef}
          curvature={index % 2 === 0 ? 60 : -70}
          pathWidth={3}
          gradientStartColor={connectionColors[index % connectionColors.length]}
          gradientStopColor={node.gradient[1]}
          pathOpacity={0.6}
          delay={index * 0.35}
        />
      ))}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-center text-xs text-white/70">
        <span className="text-sm font-semibold text-white">Live matches in your orbit</span>
        <span>Each beam shows a mutual interest that connected partners this minute.</span>
      </div>
    </div>
  )
}

const LanguageBeamShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const spanishRef = useRef<HTMLDivElement>(null)
  const koreanRef = useRef<HTMLDivElement>(null)
  const portugueseRef = useRef<HTMLDivElement>(null)
  const arabicRef = useRef<HTMLDivElement>(null)

  const circleClass =
    "flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 backdrop-blur"

  return (
    <div
      ref={containerRef}
      className="relative isolate mx-auto flex h-[320px] w-full max-w-4xl flex-col justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(99,102,241,0.35)] backdrop-blur"
    >
      <div className="flex h-full w-full items-center justify-between">
        <div className="flex h-full flex-col justify-between">
          <div ref={spanishRef} className={circleClass}>
            <span className="text-2xl">🇪🇸</span>
            <span>Madrid</span>
          </div>
          <div ref={koreanRef} className={circleClass}>
            <span className="text-2xl">🇰🇷</span>
            <span>Seoul</span>
          </div>
        </div>

        <div className="flex h-full flex-col justify-center">
          <div
            ref={hubRef}
            className="flex h-40 w-40 flex-col items-center justify-center rounded-[3rem] border border-white/20 bg-gradient-to-br from-[#7c3aed]/40 via-[#9333ea]/40 to-[#0ea5e9]/40 text-center text-white shadow-[0_20px_50px_rgba(124,58,237,0.35)] backdrop-blur"
          >
            <p className="text-lg font-semibold">Taal Matches</p>
            <p className="mt-1 text-xs text-white/80">Live matches & prompts</p>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between">
          <div ref={portugueseRef} className={circleClass}>
            <span className="text-2xl">🇵🇹</span>
            <span>Lisbon</span>
          </div>
          <div ref={arabicRef} className={circleClass}>
            <span className="text-2xl">🇦🇪</span>
            <span>Dubai</span>
          </div>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={spanishRef}
        toRef={hubRef}
        curvature={-80}
        pathWidth={3}
        gradientStartColor="#f97316"
        gradientStopColor="#f472b6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={koreanRef}
        toRef={hubRef}
        curvature={60}
        pathWidth={3}
        gradientStartColor="#22d3ee"
        gradientStopColor="#a855f7"
        delay={0.6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={portugueseRef}
        toRef={hubRef}
        curvature={-50}
        pathWidth={3}
        gradientStartColor="#38bdf8"
        gradientStopColor="#c084fc"
        delay={1.2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={arabicRef}
        toRef={hubRef}
        curvature={70}
        pathWidth={3}
        gradientStartColor="#ef4444"
        gradientStopColor="#fbbf24"
        delay={1.8}
      />

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-center text-xs text-white/70">
        <span className="text-sm font-semibold text-white">Lightspeed practice</span>
        <span>Beams represent conversation prompts traveling between live sessions.</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1120] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.35)_0%,rgba(15,23,42,0.9)_45%,rgba(8,12,24,1)_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-28 h-72 w-72 rounded-full bg-gradient-to-br from-[#a855f7] via-[#7c3aed] to-transparent opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-40 h-80 w-80 rounded-full bg-gradient-to-br from-[#22d3ee] via-[#6366f1] to-transparent opacity-30 blur-[140px]" />

      <header className="relative overflow-hidden pt-16 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b]" />
        <HyperspeedBackground
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
          effectOptions={hyperspeedEffectOptions}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0b1220] to-transparent" />

        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 md:px-10 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold shadow-lg shadow-[#7c3aed]/30">
              LF
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Language</span>
              <span className="text-lg font-semibold text-white">Flag Exchange</span>
            </div>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            <Link href="#features" className="transition hover:text-white">
              Features
            </Link>
            <Link href="#cta" className="transition hover:text-white">
              Join Us
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white md:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.35)] transition hover:bg-white/20"
            >
              Join waitlist
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto mt-12 flex max-w-7xl flex-col gap-14 px-6 md:mt-16 md:flex-row md:items-center md:gap-16 md:px-10 lg:px-12">
          <div className="flex-1 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-400 backdrop-blur">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Early Access Beta • Pricing Announced Soon
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
                Learn Languages with Real Partners{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
               
                </span>
            </h1>
              <p className="max-w-2xl text-lg md:text-xl text-slate-200 leading-relaxed">
                Meet native speakers within 500m. Practice over coffee. Track progress with gamification. Join{" "}
                <span className="font-semibold text-white">127,000+ learners</span>.
              </p>
              {/* Urgency Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-400/30 px-4 py-2 text-sm font-semibold text-orange-400">
                <Zap className="h-4 w-4" />
                🔥 127 people joined in the last hour
              </div>
            </div>

            {/* Bullet Points */}
            <div className="space-y-3 pt-2">
              {[
                { icon: MapPin, text: "Find perfect matches within walking distance (proximity alerts)" },
                { icon: Coffee, text: "Practice over coffee, not in boring classrooms" },
                { icon: Trophy, text: "Track progress with gamification (XP, streaks, badges)" },
                { icon: UsersRound, text: "Make international friends while learning" },
                { icon: Gift, text: "Founders access with flexible pricing coming soon" },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-base text-slate-200 md:text-lg">{benefit.text}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 px-8 md:px-12 py-4 md:py-5 text-base md:text-lg font-bold text-white shadow-[0_20px_60px_rgba(16,185,129,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(16,185,129,0.6)] hover:scale-105 w-full md:w-auto min-h-[56px] animate-pulse"
              >
                <Download className="h-5 w-5" />
                <span className="hidden sm:inline">📱 </span>Get the App - iOS & Android
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 opacity-0 blur-xl transition-opacity group-hover:opacity-50" />
              </Link>
              <Link
                href="#features"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-5 text-base font-semibold text-white/90 backdrop-blur transition hover:bg-white/20 hover:text-white hover:border-white/50"
              >
                <Play className="h-5 w-5" />
                Explore interactive tour
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">4.9/5</span>
                <span className="text-sm text-slate-400">(12,847 reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <UsersRound className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-white">127,000+</span> active learners
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Globe2 className="h-5 w-5 text-cyan-400" />
                Available in <span className="font-semibold text-white">150 countries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold text-emerald-400">Founders beta now open</span>
              </div>
            </div>

            {/* Social Proof Avatars */}
            <div className="flex flex-wrap items-center gap-5 pt-4">
              <div className="flex -space-x-3">
                {[
                  { emoji: "🌍", gradient: "from-emerald-500/40 to-cyan-500/40" },
                  { emoji: "🪷", gradient: "from-pink-500/40 to-purple-500/40" },
                  { emoji: "🧠", gradient: "from-blue-500/40 to-indigo-500/40" },
                  { emoji: "🎨", gradient: "from-rose-500/40 to-orange-500/40" },
                  { emoji: "🎧", gradient: "from-teal-500/40 to-emerald-500/40" },
                ].map((avatar, index) => (
                  <div
                    key={`${avatar.emoji}-${index}`}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-gradient-to-br ${avatar.gradient} shadow-lg shadow-emerald-500/30 animate-float`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <span className="text-2xl">{avatar.emoji}</span>
                  </div>
                ))}
              </div>
              <p className="text-base font-medium text-white/80">
                Join <span className="font-bold text-emerald-400">127,000+</span> language learners practicing daily
              </p>
            </div>
            </div>

          {/* Hero Visual with Floating Elements */}
          <div className="relative flex-1">
            <div className="relative">
              {/* Floating Elements */}
              <div className="absolute -top-8 -right-8 z-20 animate-float">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 backdrop-blur shadow-lg shadow-emerald-500/30">
                  <Trophy className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
              <div className="absolute top-1/4 -left-6 z-20 animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur shadow-lg shadow-purple-500/30">
                  <span className="text-2xl">🇪🇸</span>
                </div>
              </div>
              <div className="absolute bottom-1/4 -right-4 z-20 animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur shadow-lg shadow-blue-500/30">
                  <span className="text-xl">🇯🇵</span>
                </div>
              </div>
              <div className="absolute top-1/2 -left-4 z-20 animate-float" style={{ animationDelay: "1.5s" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 backdrop-blur shadow-lg shadow-yellow-500/30">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
            </div>
          </div>

              {/* Main Hero Visual */}
            <HeroWorldMap />
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-6 pb-12 md:px-10 lg:px-12">
        <LanguageBeamShowcase />
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
              <Zap className="h-4 w-4" />
              Unique Features
            </p>
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Everything You Need to Master Languages
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              We've built features that make language learning addictive, social, and worth every session.
            </p>
            </div>

          {/* Features Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: Proximity Alerts */}
            <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 shadow-lg shadow-emerald-500/10 backdrop-blur transition-all duration-300 hover:border-emerald-500/30 hover:shadow-emerald-500/20 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30">
                    <Radio className="h-8 w-8 text-emerald-400" />
                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-emerald-400" />
                    <div className="absolute inset-0 rounded-2xl animate-pulse opacity-30 bg-emerald-400" style={{ animationDelay: "0.5s" }} />
          </div>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                    World's First
                  </span>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Someone's Right Here!</h3>
                <p className="mb-4 text-slate-300 leading-relaxed">
                  Get instant alerts when language partners are at your cafe. No more scheduling—just spontaneous practice!
                </p>
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Zap className="h-4 w-4" />
                  <span className="font-semibold">Instant notifications</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Map View */}
            <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 shadow-lg shadow-blue-500/10 backdrop-blur transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-500/20 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                  <Map className="h-8 w-8 text-blue-400" />
          </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Find Partners Within 500m</h3>
                <p className="mb-4 text-slate-300 leading-relaxed">
                  See who's practicing nearby in real-time. Filter by language, level, and availability. Meet for coffee in 5 minutes!
                </p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Nearby partners</span>
                    <span className="font-bold text-blue-400">12 nearby</span>
        </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-300">Available now</span>
                    <span className="font-bold text-emerald-400">3 available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Gamification */}
            <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 shadow-lg shadow-purple-500/10 backdrop-blur transition-all duration-300 hover:border-purple-500/30 hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                  <Gamepad2 className="h-8 w-8 text-purple-400" />
          </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Level Up as You Learn</h3>
                <p className="mb-4 text-slate-300 leading-relaxed">
                  Earn XP, build streaks, unlock badges. Learning languages becomes addictive when it's a game!
                </p>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">XP Progress</span>
                    <span className="font-bold text-purple-400">2,450 / 3,000</span>
        </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[82%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    <span className="font-semibold text-purple-400">95%</span> of users maintain 7+ day streaks
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: Chat & Calls */}
            <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 shadow-lg shadow-cyan-500/10 backdrop-blur transition-all duration-300 hover:border-cyan-500/30 hover:shadow-cyan-500/20 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
                  <MessageCircle className="h-8 w-8 text-cyan-400" />
              </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Practice via Text, Voice & Video</h3>
                <p className="mb-4 text-slate-300 leading-relaxed">
                  Chat, send voice messages, make video calls. All in-app, on your schedule.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-400">
                    Built-in translation
                  </span>
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-400">
                    Voice messages
                  </span>
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-400">
                    Video calls
                  </span>
              </div>
            </div>
          </div>

            {/* Feature 5: Stories & Social */}
            <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 shadow-lg shadow-pink-500/10 backdrop-blur transition-all duration-300 hover:border-pink-500/30 hover:shadow-pink-500/20 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30">
                  <Camera className="h-8 w-8 text-pink-400" />
        </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Share Your Language Journey</h3>
                <p className="mb-4 text-slate-300 leading-relaxed">
                  Post 24-hour stories, react to others, join events. Make friends while learning!
                </p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 mt-4">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-pink-400">50,000+</span> stories posted daily
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 6: Founders Access */}
            <div className="group relative rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-8 shadow-lg shadow-emerald-500/20 backdrop-blur transition-all duration-300 hover:border-emerald-400 hover:shadow-emerald-500/30 hover:-translate-y-2">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent opacity-100" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 border-2 border-emerald-400/50">
                    <Gift className="h-8 w-8 text-emerald-300" />
              </div>
                  <span className="rounded-full bg-emerald-500/30 border-2 border-emerald-400/50 px-4 py-1 text-xs font-bold text-emerald-200 animate-pulse">
                    BEST VALUE
                  </span>
              </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Founders Access Perks</h3>
                <p className="mb-4 text-slate-200 leading-relaxed">
                  Early supporters lock in exclusive perks while we finalize transparent pricing plans.
                </p>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span>Founders-only rewards</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span>Pricing revealed soon</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span>Cancel anytime promise</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Social Proof Section */}
      <section id="social-proof" className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
        <div className="space-y-16">
          {/* User Count & Rating Header */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-5xl md:text-6xl font-black text-white">
                Join <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  <AnimatedCounter end={127000} />
                </span> Language Learners Worldwide
              </h2>
              <p className="text-lg text-slate-300">Trusted by language learners in 150+ countries</p>
            </div>
            
            {/* Rating Display */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-3xl font-bold text-white ml-2">4.9/5</span>
              </div>
              <p className="text-slate-300">
                Based on <span className="font-semibold text-white">12,847 reviews</span>
              </p>
              <Link
                href="#reviews"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-semibold"
              >
                Read reviews on App Store & Google Play
                <ArrowRight className="h-4 w-4" />
              </Link>
              </div>
              </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "127,000+", label: "Active Users", icon: UsersRound, color: "emerald" },
              { value: "2.5 Million", label: "Language Exchanges", icon: MessageSquare, color: "cyan" },
              { value: "4.9⭐", label: "Average Rating", icon: Star, color: "yellow" },
              { value: "150+", label: "Countries Worldwide", icon: Globe2, color: "blue" },
            ].map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-center backdrop-blur transition-all hover:border-white/20 hover:shadow-lg"
              >
                <div className={`mb-4 flex justify-center`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${stat.color}-500/20 border border-${stat.color}-400/30`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
            </div>
                </div>
                <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
                  </div>
                ))}
          </div>

          {/* Testimonials */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">What Our Users Say</h3>
              <p className="text-slate-300">Real stories from real language learners</p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Sarah",
                  age: 24,
                  location: "Amsterdam",
                  avatar: { emoji: "🌿", gradient: "from-emerald-500/30 to-blue-500/30" },
                  quote: "I moved to Netherlands and couldn't afford €600/month schools. Found LangEx and made 12 Dutch friends in 2 months! Now I'm fluent and it cost me ZERO.",
                  languages: ["🇳🇱 Dutch", "🇬🇧 English"],
                  badge: { text: "Saved €7,200", color: "emerald" },
                },
                {
                  name: "Mike",
                  age: 28,
                  location: "Berlin",
                  avatar: { emoji: "🎸", gradient: "from-purple-500/30 to-indigo-500/30" },
                  quote: "Better than my expensive school! The proximity alerts are genius—I met someone at my cafe and we practiced for an hour. So natural!",
                  languages: ["🇩🇪 German", "🇬🇧 English"],
                  badge: { text: "30-Day Streak", color: "purple" },
                },
                {
                  name: "Emma",
                  age: 22,
                  location: "Barcelona",
                  avatar: { emoji: "🎨", gradient: "from-rose-500/30 to-orange-500/30" },
                  quote: "Duolingo was boring. This is FUN! I practice daily now because it's like a game. Plus I made real friends!",
                  languages: ["🇪🇸 Spanish", "🇬🇧 English"],
                  badge: { text: "Level 15", color: "pink" },
                },
                {
                  name: "Tom",
                  age: 31,
                  location: "Paris",
                  avatar: { emoji: "🚀", gradient: "from-blue-500/30 to-cyan-500/30" },
                  quote: "Used it to prepare for my move to France. Started practicing 3 months before. By the time I arrived, I was already conversational!",
                  languages: ["🇫🇷 French", "🇬🇧 English"],
                  badge: { text: "5 Countries", color: "blue" },
                },
                {
                  name: "Lisa",
                  age: 26,
                  location: "Madrid",
                  avatar: { emoji: "📚", gradient: "from-yellow-500/30 to-amber-500/30" },
                  quote: "As a language teacher, I'm impressed! The gamification keeps students motivated. I recommend it to all my students.",
                  languages: ["Multiple"],
                  badge: { text: "Verified Teacher", color: "yellow" },
                },
                {
                  name: "Carlos",
                  age: 29,
                  location: "Lisbon",
                  avatar: { emoji: "🌊", gradient: "from-cyan-500/30 to-emerald-500/30" },
                  quote: "Saved me thousands! Plus the people I met became real friends. Can't recommend enough.",
                  languages: ["🇵🇹 Portuguese", "🇪🇸 Spanish"],
                  badge: { text: "47 Practices", color: "cyan" },
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 shadow-lg backdrop-blur transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br ${testimonial.avatar.gradient}`}
                      >
                        <span className="text-2xl">{testimonial.avatar.emoji}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-900">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white">{testimonial.name}</h4>
                        <span className="text-sm text-slate-400">• {testimonial.age}</span>
                      </div>
                      <p className="text-sm text-slate-400">{testimonial.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-slate-200 leading-relaxed mb-4 italic">&quot;{testimonial.quote}&quot;</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {testimonial.languages.map((lang, i) => (
                      <span key={i} className="text-xs text-slate-400">{lang}</span>
                    ))}
                  </div>

                  <div className={`inline-flex items-center gap-2 rounded-full bg-${testimonial.badge.color}-500/20 border border-${testimonial.badge.color}-400/30 px-3 py-1.5`}>
                    <Trophy className={`h-4 w-4 text-${testimonial.badge.color}-400`} />
                    <span className={`text-xs font-semibold text-${testimonial.badge.color}-400`}>
                      {testimonial.badge.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Stories */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Real Results from Real People</h3>
              <p className="text-slate-300">See how LangEx transformed their language journey</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "From Zero to Fluent in 6 Months",
                  before: "Couldn't order food in Dutch",
                  after: "Got a job that requires Dutch fluency",
                  time: "6 months",
                  cost: "€0",
                  visual: { icon: "🚀", gradient: "from-emerald-500/25 to-cyan-500/25" },
                },
                {
                  title: "Made 15 International Friends",
                  before: "Lonely expat in new city",
                  after: "Weekly meetups with language partners",
                  benefit: "Social life + language skills",
                  visual: { icon: "🤝", gradient: "from-purple-500/25 to-pink-500/25" },
                },
                {
                  title: "Career Boost",
                  before: "Monolingual",
                  after: "Promoted because of Spanish skills",
                  roi: "€10,000 salary increase",
                  visual: { icon: "💼", gradient: "from-amber-500/25 to-orange-500/25" },
                },
              ].map((story, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 shadow-lg backdrop-blur transition-all hover:border-white/20 hover:shadow-xl"
                >
                  <div className={`mb-4 flex h-32 w-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${story.visual.gradient}`}>
                    <span className="text-4xl">{story.visual.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{story.title}</h4>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300"><span className="font-semibold text-white">Before:</span> {story.before}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-200"><span className="font-semibold text-white">After:</span> {story.after}</p>
                    </div>
                    {story.time && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-slate-300">
                          <span className="font-semibold text-white">Time:</span> {story.time} | <span className="font-semibold text-white">Cost:</span> {story.cost}
                        </span>
                      </div>
                    )}
                    {story.benefit && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-slate-300">
                          <span className="font-semibold text-white">Benefit:</span> {story.benefit}
                        </span>
                      </div>
                    )}
                    {story.roi && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">
                          ROI: {story.roi}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { text: "App Store 4.9★", icon: Award, color: "blue" },
              { text: "Google Play 4.8★", icon: Award, color: "green" },
              { text: "Product Hunt #1", icon: Trophy, color: "orange" },
              { text: "100% Safe", icon: Shield, color: "emerald" },
            ].map((badge, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-full bg-${badge.color}-500/10 border border-${badge.color}-400/30 px-6 py-3 backdrop-blur transition-all hover:bg-${badge.color}-500/20`}
              >
                <badge.icon className={`h-5 w-5 text-${badge.color}-400`} />
                <span className={`text-sm font-semibold text-${badge.color}-400`}>{badge.text}</span>
          </div>
            ))}
          </div>
        </div>
      </section>


      <section id="cta" className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:px-10">
        <div className="rounded-[2.5rem] border border-white bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#ec4899] p-12 text-center shadow-[0_24px_80px_rgba(147,51,234,0.45)] text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/90">
            Made for curious travelers
          </div>
          <h2 className="mt-6 text-3xl font-semibold md:text-4xl">
            Your fluency era starts with one conversation.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
            Join linguists, expats, and remote workers building friendships that last longer than a translation. We'll
            handle the match--just bring your vibe.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#7c3aed] shadow-lg shadow-[#a855f7]/30 transition hover:-translate-y-1 hover:shadow-xl"
            >
              Get started
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
      </div>
      </section>
    </main>
  )
}

