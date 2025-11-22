'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Calendar, MessageCircle, Shield, Zap, Globe, Trophy, Star, CheckCircle, ArrowRight, Sparkles, Heart, Coffee, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Ignore refresh token errors - user is just not logged in
      if (error && error.message.includes('Refresh Token')) {
        setIsCheckingAuth(false)
        return
      }
      
      // If user is logged in, redirect to dashboard
      if (session?.user) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      // Silently fail - just show landing page
      console.warn('Auth check skipped:', error)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Video Background Effect */}
      <AnimatedVideoBackground />
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-purple-50/30 via-cyan-50/30 to-teal-100/50 animate-gradient">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-50 border-b border-pink-200/30 bg-white/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/taalmeet-icon.svg" alt="TaalMeet" className="w-12 h-12 group-hover:scale-110 transition-transform" />
            <div className="text-3xl font-bold">
              <span className="text-pink-500">Taal</span>
              <span className="text-teal-500">Meet</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Features</Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">How It Works</Link>
            <Link href="#testimonials" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Testimonials</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-800 hover:bg-pink-100">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-pink-500 to-teal-500 hover:from-pink-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Logo with animation */}
            <div className="flex justify-center mb-8 animate-in fade-in zoom-in duration-1000">
              <img src="/taalmeet-icon.svg" alt="TaalMeet" className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl hover:scale-110 transition-transform" />
            </div>

            {/* Brand name */}
            <div className="text-7xl md:text-8xl lg:text-9xl font-bold mb-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
              <span className="text-pink-500">Taal</span>
              <span className="text-teal-500">Meet</span>
            </div>
            
            {/* Main headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-800 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              Meet Language Partners
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500">
                Near You
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-1000 delay-400">
              Connect with language learners in your area. Practice together, share cultures, and make meaningful friendships.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-teal-500 hover:from-pink-600 hover:to-teal-600 text-white text-lg h-16 px-10 group shadow-2xl hover:shadow-pink-300/50 transition-all">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-16 px-10 border-2 border-gray-300 hover:bg-white/80 text-gray-700 hover:border-pink-300 transition-all">
                  How It Works
                </Button>
              </Link>
            </div>

            {/* Feature icons with emojis */}
            <div className="flex flex-wrap justify-center gap-8 pt-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-600">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <div className="text-3xl">👋</div>
                <span className="font-semibold text-gray-700">Meet Locally</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <div className="text-3xl">🗣️</div>
                <span className="font-semibold text-gray-700">Practice Together</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <div className="text-3xl">🌍</div>
                <span className="font-semibold text-gray-700">Share Cultures</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              Why <span className="text-pink-500">Taal</span><span className="text-teal-500">Meet</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The best way to learn a language is through real conversations with real people
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-8 h-8" />,
                title: "Find Nearby Partners",
                description: "Discover language learners in your area, see them on the map, and connect instantly",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Smart Matching",
                description: "Get matched with partners based on your languages, interests, and availability",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: "Chat & Video Calls",
                description: "Message partners, schedule meetings, and practice through video calls",
                color: "from-teal-500 to-cyan-500"
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Easy Scheduling",
                description: "Set your availability and find partners who match your free time",
                color: "from-blue-500 to-purple-500"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Safe & Verified",
                description: "All users are verified. Meet in public places or practice online safely",
                color: "from-green-500 to-teal-500"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Track Progress",
                description: "Log practice sessions, earn badges, and see your language skills grow",
                color: "from-orange-500 to-pink-500"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start practicing in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: "✍️", title: "Sign Up", description: "Create your profile and tell us what languages you speak and want to learn" },
              { step: "2", icon: "🔍", title: "Find Partners", description: "Browse nearby language learners on the map or get smart matches" },
              { step: "3", icon: "💬", title: "Connect", description: "Send a message and schedule your first language exchange" },
              { step: "4", icon: "🎯", title: "Practice", description: "Meet in person or online and improve together!" }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-teal-500 flex items-center justify-center text-4xl shadow-2xl">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center font-bold text-2xl text-pink-500">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Ready to Start Learning?
          </h2>
          <p className="text-2xl text-white/90 mb-12">
            Join thousands of language learners already practicing together
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 text-xl h-16 px-12 shadow-2xl hover:shadow-white/30 transition-all">
              Sign Up Free
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/taalmeet-icon.svg" alt="TaalMeet" className="w-10 h-10" />
            <div className="text-2xl font-bold">
              <span className="text-pink-500">Taal</span>
              <span className="text-teal-500">Meet</span>
            </div>
          </div>
          <p className="text-gray-400 mb-6">Where Languages Meet</p>
          <div className="flex justify-center gap-6 text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-gray-500 mt-8">© 2024 TaalMeet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Animated Video Background - Dynamic canvas-based video effect
function AnimatedVideoBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      alpha: number
      pulse: number
    }

    const particles: Particle[] = []
    const numParticles = 80
    const colors = [
      'rgba(255, 107, 157', // Pink
      'rgba(52, 211, 153', // Green
      'rgba(167, 139, 250', // Purple
      'rgba(79, 209, 197'   // Teal
    ]

    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
        pulse: Math.random() * Math.PI * 2
      })
    }

    function animate() {
      if (!ctx || !canvas) return

      // Create trailing effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Update pulse for glow effect
        particle.pulse += 0.02

        // Boundary checking with wrap-around
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Pulsing alpha
        const pulseAlpha = particle.alpha + Math.sin(particle.pulse) * 0.2

        // Draw particle glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        )
        gradient.addColorStop(0, `${particle.color}, ${pulseAlpha})`)
        gradient.addColorStop(0.5, `${particle.color}, ${pulseAlpha * 0.5})`)
        gradient.addColorStop(1, `${particle.color}, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections between nearby particles
        particles.forEach((otherParticle, j) => {
          if (i === j) return
          
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            const lineAlpha = (1 - distance / 150) * 0.15
            ctx.strokeStyle = `${particle.color}, ${lineAlpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 z-[0] opacity-40"
      style={{ 
        filter: 'blur(1px)',
        mixBlendMode: 'screen'
      }}
    />
  )
}
