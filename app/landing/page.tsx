/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import CountUp from "react-countup"

import { Button } from "@/components/ui/button"
import { LaserFlowBackground } from "@/components/marketing/laser-flow"
import { NetworkVisual } from "@/components/marketing/network-visual"

const heroStats = [
  { label: "Active learners", value: 127000, suffix: "+", description: "Real conversation partners" },
  { label: "Countries", value: 150, suffix: "+", description: "Cultures sharing stories" },
  { label: "Exchanges", value: 2500000, suffix: "+", description: "Moments captured every year" },
]

const mapHighlights = [
  { icon: "🌍", title: "Global pulses", description: "Connections surge the moment a new partner taps ‘Start conversation’." },
  { icon: "🗺️", title: "City heatmaps", description: "Tokyo, Nairobi, São Paulo, Amsterdam – see who’s meeting up tonight." },
  { icon: "⚡", title: "Realtime sync", description: "Supabase realtime keeps chats, meetups, and streaks in lockstep." },
]

const mapStats = [
  { value: 70, suffix: "+", label: "Cities with weekly meetups" },
  { value: 120, suffix: "+", label: "Language pairs thriving" },
  { value: 46, suffix: "K", label: "Matches sparked last month" },
]

interface OrbitUser {
  id: string
  name: string
  flag: string
  color: string
  radius: number
  angle: number
}

const orbitUsers: OrbitUser[] = [
  { id: "tokyo", name: "Hana", flag: "🇯🇵", color: "#38bdf8", radius: 150, angle: 12 },
  { id: "amsterdam", name: "Ava", flag: "🇳🇱", color: "#a855f7", radius: 130, angle: 78 },
  { id: "nairobi", name: "Kioni", flag: "🇰🇪", color: "#f97316", radius: 165, angle: 140 },
  { id: "lisbon", name: "Mateo", flag: "🇵🇹", color: "#22d3ee", radius: 115, angle: 205 },
  { id: "seoul", name: "Min", flag: "🇰🇷", color: "#60a5fa", radius: 175, angle: 252 },
  { id: "lagos", name: "Ada", flag: "🇳🇬", color: "#34d399", radius: 150, angle: 312 },
]

function AmbientParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <LaserFlowBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,19,32,0.6),_rgba(9,11,18,1))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,11,18,0.4),rgba(9,12,18,0.92))]" />
      <motion.span
        className="absolute left-[12%] top-[18%] h-40 w-40 rounded-full bg-sky-500/20 blur-[90px]"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute bottom-12 right-[20%] h-44 w-44 rounded-full bg-purple-500/25 blur-[110px]"
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.05, 0.95] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute left-[45%] top-[60%] h-32 w-32 rounded-full bg-cyan-400/20 blur-[80px]"
        animate={{ opacity: [0.2, 0.6, 0.3], scale: [0.8, 1.1, 0.9] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

function HeroOrbit() {
  const size = 380
  const center = size / 2

  const positions = useMemo(
    () =>
      orbitUsers.map((user) => {
        const radians = (user.angle * Math.PI) / 180
        const x = center + user.radius * Math.cos(radians)
        const y = center + user.radius * Math.sin(radians)
        return { ...user, x, y }
      }),
    [center],
  )

  return (
    <div className="relative h-[380px] w-[380px] max-w-full">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/20 via-transparent to-purple-500/20 blur-3xl" />
      <div className="absolute inset-6 rounded-full border border-white/10" />
      <div className="absolute inset-16 rounded-full border border-white/10" />
      <div className="absolute inset-[84px] rounded-full border border-white/10" />

      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50% 50%" }}
      >
        <defs>
          <linearGradient id="orbitLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(148, 163, 255, 0.0)" />
            <stop offset="100%" stopColor="rgba(148, 163, 255, 0.45)" />
          </linearGradient>
        </defs>
        {positions.map((node) => (
          <motion.line
            key={`line-${node.id}`}
            x1={center}
            y1={center}
            x2={node.x}
            y2={node.y}
            stroke="url(#orbitLine)"
            strokeWidth={1}
            strokeLinecap="round"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.svg>

      <motion.div
        className="absolute inset-0"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50% 50%" }}
      >
        {positions.map((user) => (
          <motion.div
            key={user.id}
            className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[11px] font-medium text-white backdrop-blur-xl shadow-[0_0_30px_rgba(130,88,255,0.35)]"
            style={{ left: user.x, top: user.y }}
            whileHover={{ scale: 1.1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-base" role="img" aria-label={user.name}>
              {user.flag}
            </span>
            <span className="text-white/70">{user.name}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-[28px] border border-white/20 bg-white/10 text-center backdrop-blur-xl shadow-[0_0_40px_rgba(130,88,255,0.35)]">
        <span className="text-4xl">🌍</span>
        <span className="text-xs uppercase tracking-[0.3em] text-white/70">LangEx</span>
        <span className="text-[11px] text-white/60">Live network</span>
      </div>

      <motion.div
        className="absolute inset-0 rounded-full border border-sky-300/30"
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.98] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 0 35px rgba(94, 234, 212, 0.3))" }}
      />
    </div>
  )
}

function AmbientSoundToggle() {
  const [enabled, setEnabled] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const ctx = new window.AudioContext()
    audioContextRef.current = ctx

    const playPing = () => {
      if (!audioContextRef.current) return
      const oscillator = audioContextRef.current.createOscillator()
      const gain = audioContextRef.current.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = 880
      gain.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      gain.gain.linearRampToValueAtTime(0.06, audioContextRef.current.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.00001, audioContextRef.current.currentTime + 0.3)
      oscillator.connect(gain)
      gain.connect(audioContextRef.current.destination)
      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + 0.4)
    }

    ctx.resume().catch(() => {})
    playPing()
    intervalRef.current = setInterval(playPing, 9000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      ctx.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [enabled])

  return (
    <button
      type="button"
      onClick={() => setEnabled((state) => !state)}
      className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.32em] text-white/60 transition hover:border-white/30 hover:text-white"
    >
      <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] transition group-hover:bg-emerald-300" />
      Ambient match pings
      <span className="ml-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.3em] text-white/70">
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const statsRef = useRef<HTMLDivElement | null>(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.5 })
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInView = useInView(mapRef, { once: true, amount: 0.4 })

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: "radial-gradient(ellipse at center, #0b0f19 0%, #090b12 100%)" }}
    >
      <AmbientParticles />

      <header className="relative z-10 px-6 pb-16 pt-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 lg:flex-row lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl space-y-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              Live language mesh
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Learn Languages Through
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Real Connections
              </span>
            </h1>
            <p className="text-lg text-white/70">
              Connect with native speakers nearby. Exchange stories, swap cultures, and grow together through immersive local
              experiences.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                onClick={() => router.push("/auth/signup")}
                className="h-12 rounded-full bg-gradient-to-r from-sky-500 via-purple-500 to-fuchsia-500 px-8 text-sm font-semibold shadow-[0_0_32px_rgba(130,88,255,0.35)] transition hover:scale-[1.02]"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/landing#map")}
                className="h-12 rounded-full border-white/30 bg-transparent px-8 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Demo Map
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6" ref={statsRef}>
              {heroStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: statsInView ? 1 : 0, y: statsInView ? 0 : 24 }}
                  transition={{ delay: 0.2 * index, duration: 0.6, ease: "easeOut" }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md"
                >
                  <div className="text-2xl font-semibold text-white">
                    {statsInView ? <CountUp end={stat.value} duration={1.8} separator="," suffix={stat.suffix} /> : `0${stat.suffix}`}
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{stat.label}</p>
                  <p className="mt-2 text-sm text-white/60">{stat.description}</p>
                </motion.div>
              ))}
            </div>
            <div className="pt-4">
              <AmbientSoundToggle />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            className="relative flex flex-1 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-[48px] bg-white/5 blur-[90px]" />
            <div className="relative rounded-[40px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_45px_120px_rgba(14,19,32,0.65)]">
              <HeroOrbit />
            </div>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 space-y-24 pb-28" id="map">
        <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-12 px-6 sm:px-10 lg:flex-row lg:items-center">
          <motion.div
            ref={mapRef}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: mapInView ? 1 : 0, y: mapInView ? 0 : 32 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl space-y-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
              Live map preview
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">See the LangEx map come alive</h2>
            <p className="text-white/65">
              Watch mentors and learners orbit each other as meetups form across the globe. Every line pulses the moment two people
              match for a new conversation.
            </p>
            <div className="space-y-4">
              {mapHighlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: mapInView ? 1 : 0, x: mapInView ? 0 : -20 }}
                  transition={{ delay: 0.15 * index, duration: 0.5, ease: "easeOut" }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
                >
                  <span className="text-xl" role="img" aria-hidden>
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-white/60">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: mapInView ? 1 : 0, scale: mapInView ? 1 : 0.92 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="relative flex flex-1 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-[48px] bg-white/5 blur-[100px]" />
            <div className="relative w-full rounded-[40px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_45px_120px_rgba(14,19,32,0.55)]">
              <NetworkVisual className="h-[520px]" />
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-6 sm:px-10">
          <div className="grid gap-6 sm:grid-cols-3">
            {mapStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.6 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl shadow-[0_30px_70px_rgba(14,19,32,0.45)]"
              >
                <div className="text-3xl font-semibold text-white">
                  <CountUp end={stat.value} duration={1.6} suffix={stat.suffix} />
                </div>
                <p className="mt-3 text-sm text-white/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

