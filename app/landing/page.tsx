'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Calendar, MessageCircle, Shield, Trophy, Star, CheckCircle, ArrowRight, Sparkles, Globe, Video, Coffee, Play, Heart } from 'lucide-react'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Video Background Effect */}
      <AnimatedVideoBackground scrollY={scrollY} />
      
      {/* Animated Background Layers */}
      <AnimatedBackgroundOrbs scrollY={scrollY} />
      
      {/* Floating Wave Shapes */}
      <FloatingWaves scrollY={scrollY} />
      
      {/* Enhanced Background with Parallax */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          transform: `translateY(${scrollY * 0.15}px)`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <PulsingRingsBackground />
      </div>

      {/* Dynamic Gradient Overlay - Shifts on Scroll */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(${135 + scrollY / 10}deg, 
            rgba(255, 107, 157, ${Math.min(0.12, scrollY / 5000)}), 
            rgba(52, 211, 153, ${Math.min(0.08, scrollY / 6000)}), 
            rgba(167, 139, 250, ${Math.min(0.1, scrollY / 5500)}), 
            rgba(79, 209, 197, ${Math.min(0.08, scrollY / 6000)}))`,
          opacity: 0.6 + Math.min(0.4, scrollY / 4000),
          transition: 'background 0.3s ease-out, opacity 0.3s ease-out'
        }}
      />
      
      {/* Floating Particles Animation */}
      <FloatingParticles />

      {/* Navigation - Enhanced with Better Separation */}
      <nav className="relative z-50 border-b border-pink-200/20 bg-white/90 backdrop-blur-xl sticky top-0 shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3 group">
            <img src="/taalmeet-icon.svg" alt="TaalMeet" className="w-12 h-12 group-hover:scale-110 transition-transform" />
            <div className="text-3xl font-bold">
              <span className="text-pink-500">Taal</span>
              <span className="text-teal-500">Meet</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">Features</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">How It Works</Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-pink-600 transition-colors font-medium">Testimonials</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:bg-pink-50">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-pink-500 via-pink-600 to-teal-500 hover:from-pink-600 hover:via-pink-700 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dating App Inspired Dark Theme */}
      <section className="relative z-10 min-h-screen flex items-center justify-center py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Dark overlay for video background */}
        <div className="absolute inset-0 bg-black/40 z-0" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
            <div 
              className="space-y-6 lg:space-y-8 perspective-container"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              <div className="opacity-0 animate-slide-in-left">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500/20 backdrop-blur-sm border border-pink-400/30 rounded-full text-sm shadow-md smooth-hover-lift">
                  <Sparkles className="w-4 h-4 text-pink-400 animate-icon-pulse" />
                  <span className="text-white font-semibold">10,000+ learners connected worldwide</span>
                </div>
              </div>
              
              {/* Enhanced Hero Title - Dark Theme */}
              <div className="relative">
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.15] tracking-tight">
                  <span className="text-white block opacity-0 animate-reveal-blur delay-100">
                    When You Would Like To 
                    <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400">
                      Learn A Language?
                    </span>
                  </span>
                </h1>
              </div>
              
              <div className="opacity-0 animate-sequential-fade delay-400">
                <p className="text-[20px] md:text-[22px] text-gray-300 leading-relaxed max-w-xl pt-4">
                  Connect with native speakers in your city. Practice over coffee, explore cultures together, and make real friendships.
                </p>
              </div>

              <div className="opacity-0 animate-scale-up delay-600">
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <Link href="/auth/signup">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-teal-500 hover:from-pink-600 hover:to-teal-600 text-white text-xl font-bold h-[68px] px-14 group shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-500 ease-out smooth-hover-lift rounded-full"
                      onMouseEnter={(e) => e.currentTarget.classList.add('animate-micro-bounce')}
                      onMouseLeave={(e) => e.currentTarget.classList.remove('animate-micro-bounce')}
                    >
                      Get App
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Watch Intro Video Button */}
              <div className="opacity-0 animate-sequential-fade delay-700">
                <button className="flex items-center gap-3 mt-6 group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/50 group-hover:scale-110 transition-all duration-300">
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-lg">Watch</div>
                    <div className="text-gray-400 text-sm">Intro Video</div>
                  </div>
                </button>
              </div>

              <div className="opacity-0 animate-sequential-fade delay-800">
                <div className="flex items-center gap-8 pt-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-1">4.9</div>
                    <div className="flex gap-1 mb-2">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className="w-5 h-5 fill-yellow-400 text-yellow-400" 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">Rating on App Store</p>
                  </div>
                  <div className="h-16 w-px bg-gray-700" />
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-1">10k+</div>
                    <p className="text-sm text-gray-400 mt-2">Users in 50 countries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Mockup Cards - Dating App Style */}
            <div className="relative h-[650px] opacity-0 animate-parallax-zoom delay-300">
              {/* Left Phone Card */}
              <div 
                className="absolute left-0 top-10 w-[280px] transform -rotate-6 opacity-0 animate-slideshow-reveal delay-400"
                style={{
                  transform: `translateY(${scrollY * -0.1}px) rotate(-6deg)`,
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border-4 border-gray-700 shadow-2xl">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl aspect-[3/4] overflow-hidden relative">
                    <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold">Maria</span>
                          <span className="text-lg">🇧🇷</span>
                        </div>
                        <div className="text-sm opacity-90">Learning Dutch • Native Portuguese</div>
                        <div className="flex gap-2 mt-3">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">☕ Coffee</span>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">🎨 Art</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                      <span className="text-2xl">✕</span>
                    </button>
                    <button className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:scale-110 flex items-center justify-center transition-all shadow-lg">
                      <Heart className="w-6 h-6 text-white" fill="white" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Phone Card */}
              <div 
                className="absolute right-0 top-0 w-[280px] transform rotate-6 opacity-0 animate-slideshow-reveal delay-600"
                style={{
                  transform: `translateY(${scrollY * -0.12}px) rotate(6deg)`,
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border-4 border-gray-700 shadow-2xl">
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl aspect-[3/4] overflow-hidden relative">
                    <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold">James</span>
                          <span className="text-lg">🇺🇸</span>
                        </div>
                        <div className="text-sm opacity-90">Learning Spanish • Native English</div>
                        <div className="flex gap-2 mt-3">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">🎸 Music</span>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">⚽ Sports</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                      <span className="text-2xl">✕</span>
                    </button>
                    <button className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:scale-110 flex items-center justify-center transition-all shadow-lg">
                      <Heart className="w-6 h-6 text-white" fill="white" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating Match Notification */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 animate-scale-up delay-800 z-10">
                <div className="bg-white rounded-2xl p-6 shadow-2xl text-center min-w-[200px]">
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">It's a Match!</div>
                  <div className="text-sm text-gray-600">Start practicing together</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Down Indicator - Dark Theme */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-video-fade-through delay-1000">
            <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Scroll Down</span>
            <div className="w-6 h-10 border-2 border-pink-500 rounded-full flex items-start justify-center p-2 animate-scroll-down-bounce">
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Light Pink Background */}
      <section 
        className="relative z-10 py-32 bg-gradient-to-br from-pink-50 via-purple-50 to-teal-50 overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.04}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ScrollFadeIn animation="zoom">
            <div className="text-center mb-20">
              <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 text-gray-900">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Connect with language partners in 3 simple steps
              </p>
            </div>
          </ScrollFadeIn>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left - Phone Mockup */}
            <ScrollFadeIn animation="slideLeft">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative mx-auto w-[320px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-800">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10" />
                  
                  {/* Screen */}
                  <div className="bg-white rounded-[2.3rem] overflow-hidden relative aspect-[9/19]">
                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-between px-6 text-white text-xs z-10">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4">📶</div>
                        <div className="w-4 h-4">📡</div>
                        <div className="w-4 h-4">🔋</div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="absolute inset-0 pt-12">
                      <div className="h-full bg-gradient-to-br from-pink-500 via-purple-500 to-purple-600 p-6 flex flex-col">
                        {/* Profile Card */}
                        <div className="bg-white rounded-3xl p-4 shadow-xl flex-1 relative overflow-hidden">
                          <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Online
                          </div>
                          <div className="h-48 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-2xl mb-4" />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold">Yuki</div>
                              <div className="text-xl">🇯🇵</div>
                            </div>
                            <div className="text-sm text-gray-600">Learning English • Native Japanese</div>
                            <div className="flex gap-2 flex-wrap mt-3">
                              <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-semibold">🎌 Anime</span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold">🍱 Cooking</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-6 mt-6">
                          <button className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <span className="text-2xl">✕</span>
                          </button>
                          <button className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full shadow-xl flex items-center justify-center">
                            <Heart className="w-7 h-7 text-white" fill="white" />
                          </button>
                          <button className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Stats */}
                <div className="absolute -left-4 top-20 bg-white rounded-2xl p-4 shadow-xl opacity-0 animate-slide-in-left delay-400">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">📊</div>
                    <div>
                      <div className="text-sm text-gray-600">Match Activity</div>
                      <div className="text-lg font-bold text-gray-900">Active Now</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-4 bottom-32 bg-white rounded-2xl p-4 shadow-xl opacity-0 animate-slide-in-right delay-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">Carlos</div>
                      <div className="text-xs text-gray-600">Sent you a message</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFadeIn>

            {/* Right - Feature Circles */}
            <div className="space-y-8">
              {[
                {
                  icon: '👋',
                  title: 'Ideal Relationship',
                  description: 'Find partners with matching language goals and interests in your area'
                },
                {
                  icon: '💼',
                  title: 'Dating With Benefits',
                  description: 'Practice languages while making meaningful friendships and connections'
                },
                {
                  icon: '🎯',
                  title: 'Date Beautiful Peoples',
                  description: 'Meet verified native speakers who are excited to help you learn'
                }
              ].map((feature, i) => (
                <ScrollFadeIn key={i} animation="slideRight" delay={i * 200}>
                  <div className="flex items-start gap-6 group">
                    <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Parallax */}
      <section 
        className="relative z-10 bg-white/70 backdrop-blur-md py-24 mt-16 border-y border-pink-200/30 overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.05}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Floating gradient orbs in stats section */}
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400/15 to-transparent rounded-full"
          style={{
            filter: 'blur(80px)',
            transform: `translateY(${scrollY * 0.12}px) translateX(${Math.sin(scrollY * 0.003) * 30}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/15 to-purple-400/10 rounded-full"
          style={{
            filter: 'blur(80px)',
            transform: `translateY(${-scrollY * 0.1}px) translateX(${-Math.cos(scrollY * 0.002) * 30}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 perspective-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '10K+', label: 'Active Users', icon: Users, color: 'from-pink-500 via-pink-600 to-pink-700' },
              { number: '50+', label: 'Languages', icon: Globe, color: 'from-green-500 via-green-600 to-teal-600' },
              { number: '150+', label: 'Cities', icon: MapPin, color: 'from-teal-500 via-teal-600 to-cyan-600' },
              { number: '98%', label: 'Success Rate', icon: Trophy, color: 'from-purple-500 via-purple-600 to-pink-600' }
            ].map((stat, i) => (
              <ScrollFadeIn key={i} delay={i * 100}>
                <div 
                  className="text-center group cursor-pointer opacity-0 animate-stat-counter card-3d"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center transition-all duration-500 shadow-lg group-hover:shadow-2xl group-hover:scale-110 animate-icon-pulse`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color} mb-2 transition-transform duration-300 group-hover:scale-110`}>
                    {stat.number}
                  </div>
                  <div className="text-gray-800 font-semibold">{stat.label}</div>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Scroll Stack */}
      <section id="features" className="relative z-10 py-32 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollFadeIn animation="zoom">
            <div 
              className="text-center mb-20"
              style={{
                transform: `translateY(${scrollY * 0.03}px)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-green-500 via-purple-500 to-teal-500">
                Everything you need to connect
              </h2>
              <p className="text-xl text-gray-800 font-medium">Real connections. Real conversations. Real friendships.</p>
            </div>
          </ScrollFadeIn>

          <ScrollStack />
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className="relative z-10 py-32 mt-16 bg-white/50 backdrop-blur-sm overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.04}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Floating green gradient orb */}
        <div 
          className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full"
          style={{
            filter: 'blur(100px)',
            transform: `translateY(${scrollY * 0.15}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ScrollFadeIn animation="presentation">
            <div className="text-center mb-20">
              <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-green-500 via-purple-500 to-teal-500">
                Start in 3 simple steps
              </h2>
              <p className="text-xl text-gray-800 font-medium">From signup to first conversation in minutes</p>
            </div>
          </ScrollFadeIn>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection lines with green */}
            <div className="hidden md:block absolute top-32 left-1/4 right-1/4 h-1 bg-gradient-to-r from-pink-500 via-green-500 via-purple-500 to-teal-500 rounded-full" />
            
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                description: 'Share your native language, what you want to learn, interests, and neighborhood. Takes just 2 minutes to set up.',
                icon: '🎯',
                color: 'from-pink-500 to-pink-600'
              },
              {
                step: '02',
                title: 'Discover Partners',
                description: 'Explore an interactive map showing language learners near you. Filter by language, interests, and availability.',
                icon: '🗺️',
                color: 'from-green-500 to-teal-600'
              },
              {
                step: '03',
                title: 'Meet & Connect',
                description: 'Chat in-app, then meet for coffee, walks, or video calls. Practice languages while making real friends.',
                icon: '☕',
                color: 'from-teal-500 to-cyan-600'
              }
            ].map((step, i) => (
              <ScrollFadeIn key={i} delay={i * 200}>
                <div 
                  className="relative group cursor-pointer opacity-0 animate-card-lift-3d"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <div className="absolute -inset-4 bg-gradient-to-br from-pink-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
                  <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-3xl p-8 transition-all duration-500 ease-out card-3d smooth-hover-lift">
                    <div className="text-8xl mb-6 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 inline-block">{step.icon}</div>
                    <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-xl mb-6 shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:scale-105 animate-icon-pulse`}>
                      Step {step.step}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 transition-colors duration-300 group-hover:text-pink-600">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-700">{step.description}</p>
                  </div>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        className="relative z-10 py-32 mt-16 overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.03}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Floating gradient backgrounds */}
        <div 
          className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-full"
          style={{
            filter: 'blur(120px)',
            transform: `translateY(${scrollY * 0.1}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full"
          style={{
            filter: 'blur(120px)',
            transform: `translateY(${-scrollY * 0.08}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ScrollFadeIn animation="slideshow">
            <div className="text-center mb-20">
              <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-green-500 via-purple-500 to-teal-500">
                Loved by language learners
              </h2>
              <p className="text-xl text-gray-800 font-medium">Real stories from our global community</p>
            </div>
          </ScrollFadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Maria Santos',
                role: 'Learning Dutch • Native Portuguese',
                flag: '🇧🇷',
                content: 'I moved to Amsterdam 6 months ago and struggled with Dutch. Through TaalMeet, I found Anna who lives 3 streets away. We meet twice a week for coffee—I help her with Portuguese, she helps me with Dutch. My confidence has skyrocketed!',
                rating: 5,
                color: 'from-pink-500 to-pink-600'
              },
              {
                name: 'James Chen',
                role: 'Learning Spanish • Native English',
                flag: '🇺🇸',
                content: 'The map feature is brilliant! I found Carlos at my local coffee shop. We\'ve been meeting for 3 months now. My Spanish went from textbook phrases to actual conversations. Plus, I made a genuine friend.',
                rating: 5,
                color: 'from-green-500 to-teal-600'
              },
              {
                name: 'Yuki Tanaka',
                role: 'Learning English • Native Japanese',
                flag: '🇯🇵',
                content: 'I was scared to speak English before. TaalMeet connected me with Sarah, an American learning Japanese. We video call weekly and meet at parks on weekends. Now I feel confident speaking at work!',
                rating: 5,
                color: 'from-purple-500 to-pink-600'
              }
            ].map((testimonial, i) => (
              <ScrollFadeIn key={i} delay={i * 150}>
                <div 
                  className="group bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-3xl p-8 transition-all duration-500 ease-out opacity-0 animate-glass-morph-enter card-3d smooth-hover-lift cursor-pointer"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex gap-1 mb-6">
                    {Array(testimonial.rating).fill(0).map((_, idx) => (
                      <Star 
                        key={idx} 
                        className="w-5 h-5 fill-yellow-400 text-yellow-400 transition-all duration-300 hover:scale-125 animate-icon-pulse" 
                        style={{ animationDelay: `${idx * 100}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-lg mb-8 leading-relaxed text-gray-700 transition-colors duration-300 group-hover:text-gray-800">{testimonial.content}</p>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-3xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:rotate-6`}>
                      {testimonial.flag}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-800 transition-colors duration-300 group-hover:text-pink-600">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        className="relative z-10 py-32 mt-16 overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.03}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Floating gradient orbs */}
        <div 
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-pink-400/15 to-purple-400/10 rounded-full"
          style={{
            filter: 'blur(100px)',
            transform: `translateY(${scrollY * 0.15}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-green-400/15 to-teal-400/10 rounded-full"
          style={{
            filter: 'blur(100px)',
            transform: `translateY(${-scrollY * 0.12}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 perspective-container">
          <ScrollFadeIn>
            <div className="relative opacity-0 animate-layered-depth">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-green-500 via-purple-500 to-teal-500 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-gradient-to-br from-white/80 via-green-50/50 to-teal-50/50 backdrop-blur-md border-2 border-green-200/40 rounded-3xl p-12 md:p-16 shadow-2xl card-3d smooth-hover-lift">
                <div className="mb-8 opacity-0 animate-scale-up delay-100">
                  <img 
                    src="/taalmeet-icon.svg" 
                    alt="TaalMeet" 
                    className="w-24 h-24 mx-auto animate-logo-bounce transition-transform duration-300 hover:scale-110" 
                  />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-green-500 to-teal-500 opacity-0 animate-reveal-blur delay-200">
                  Start Speaking. Start Connecting.
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed font-semibold max-w-2xl mx-auto opacity-0 animate-sequential-fade delay-400">
                  Join 10,000+ language learners making real friends in 150+ cities worldwide
                </p>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto opacity-0 animate-sequential-fade delay-500">
                  Your perfect language partner is probably having coffee right now—just a few blocks away.
                </p>
                <div className="opacity-0 animate-scale-up delay-600">
                  <Link href="/auth/signup">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-pink-500 via-green-500 to-teal-500 hover:from-pink-600 hover:via-green-600 hover:to-teal-600 text-white text-xl font-bold h-[68px] px-14 group shadow-2xl shadow-green-400/30 hover:shadow-green-500/50 transition-all duration-500 ease-out smooth-hover-lift"
                      onMouseEnter={(e) => e.currentTarget.classList.add('animate-micro-bounce')}
                      onMouseLeave={(e) => e.currentTarget.classList.remove('animate-micro-bounce')}
                    >
                      Join TaalMeet Free
                      <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-6 items-center text-gray-700">
                  {[
                    { text: 'Free forever', delay: 700 },
                    { text: 'No credit card', delay: 750 },
                    { text: '2-minute setup', delay: 800 }
                  ].map((item, i) => (
                    <span 
                      key={i}
                      className="flex items-center gap-2 font-semibold opacity-0 animate-sequential-fade transition-all duration-300 hover:scale-110"
                      style={{ animationDelay: `${item.delay}ms` }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 animate-icon-pulse" /> {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-pink-200/30 bg-white/80 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/landing" className="flex items-center gap-3 mb-4 group">
                <img src="/taalmeet-icon.svg" alt="TaalMeet" className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold">
                  <span className="text-pink-500">Taal</span>
                  <span className="text-teal-500">Meet</span>
                </div>
              </Link>
              <p className="text-gray-600 leading-relaxed mb-3">
                Connect with native speakers in your neighborhood. Learn languages through real conversations.
              </p>
              <p className="text-sm text-gray-500">
                Available in 150+ cities worldwide
              </p>
            </div>
            
            {[
              {
                title: 'Platform',
                links: ['How It Works', 'Find Partners', 'Interactive Map', 'Mobile App', 'Safety Guidelines']
              },
              {
                title: 'Resources',
                links: ['Language Tips', 'Success Stories', 'Community Blog', 'Help Center', 'Contact Us']
              },
              {
                title: 'Company',
                links: ['About TaalMeet', 'Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Trust & Safety']
              }
            ].map((column, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4 text-gray-800">{column.title}</h3>
                <ul className="space-y-2">
                  {column.links.map(link => (
                    <li key={link}>
                      <Link href="#" className="text-gray-600 hover:text-pink-600 transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-pink-200/30 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <select className="bg-white/50 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 font-medium hover:border-pink-400 focus:outline-none focus:border-pink-500 transition-colors">
                  <option>English</option>
                  <option>Nederlands</option>
                  <option>Español</option>
                  <option>Français</option>
                  <option>Deutsch</option>
                  <option>日本語</option>
                  <option>中文</option>
                </select>
              </div>
              <div className="flex gap-6">
                {[
                  { name: 'Twitter', icon: '𝕏' },
                  { name: 'Instagram', icon: '📷' },
                  { name: 'LinkedIn', icon: '💼' },
                  { name: 'Facebook', icon: '👍' }
                ].map(social => (
                  <Link 
                    key={social.name} 
                    href="#" 
                    className="text-gray-600 hover:text-pink-600 transition-colors font-medium flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:scale-110 transition-transform">{social.icon}</span>
                    <span className="hidden sm:inline">{social.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                © 2025 TaalMeet. All rights reserved. Made with <span className="text-pink-500">♥</span> for language learners worldwide.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Connecting people through languages • Building friendships across cultures
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Animated "Near You" Component - Fade & Shimmer
function AnimatedNearYou() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span 
      className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-pink-600 to-teal-500 transition-all duration-1000 ease-out animate-gradient-shimmer"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        backgroundSize: '200% auto',
      }}
    >
      Near You
    </span>
  )
}

// Cinematic Scroll Reveal Component - Video/Slideshow style
function ScrollFadeIn({ 
  children, 
  delay = 0, 
  animation = 'fade' 
}: { 
  children: React.ReactNode
  delay?: number
  animation?: 'fade' | 'slideLeft' | 'slideRight' | 'zoom' | 'presentation' | 'slideshow'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.15, rootMargin: '-50px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay])

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0'
    
    switch (animation) {
      case 'slideLeft':
        return 'animate-cinematic-slide-left'
      case 'slideRight':
        return 'animate-cinematic-slide-right'
      case 'zoom':
        return 'animate-cinematic-zoom-in'
      case 'presentation':
        return 'animate-presentation-slide'
      case 'slideshow':
        return 'animate-slideshow-reveal'
      default:
        return 'animate-video-fade-through'
    }
  }

  return (
    <div
      ref={ref}
      className={`${getAnimationClass()} transition-all`}
    >
      {children}
    </div>
  )
}

// Animated Video Background - Dynamic canvas-based video effect
function AnimatedVideoBackground({ scrollY }: { scrollY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
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

// Animated Background Orbs - Morphing Gradient Blobs
function AnimatedBackgroundOrbs({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[0]">
      {/* Large morphing blob 1 - Pink to Green */}
      <div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/20 via-pink-300/15 to-green-400/20 rounded-full animate-blob"
        style={{
          filter: 'blur(80px)',
          transform: `translateY(${scrollY * 0.2}px) translateX(${Math.sin(scrollY * 0.002) * 50}px) scale(${1 + Math.sin(scrollY * 0.001) * 0.1})`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Large morphing blob 2 - Purple to Teal */}
      <div 
        className="absolute top-1/4 -right-40 w-[700px] h-[700px] bg-gradient-to-br from-purple-400/15 via-teal-300/10 to-teal-400/15 rounded-full animation-delay-2000 animate-blob"
        style={{
          filter: 'blur(90px)',
          transform: `translateY(${-scrollY * 0.15}px) translateX(${-Math.cos(scrollY * 0.0015) * 60}px) scale(${1 + Math.cos(scrollY * 0.0012) * 0.12})`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Medium morphing blob 3 - Green accent */}
      <div 
        className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-green-400/18 to-teal-300/12 rounded-full animation-delay-4000 animate-blob"
        style={{
          filter: 'blur(70px)',
          transform: `translateY(${scrollY * 0.18}px) translateX(${Math.cos(scrollY * 0.0018) * 40}px) rotate(${scrollY * 0.05}deg)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Small morphing blob 4 - Pink accent */}
      <div 
        className="absolute top-2/3 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-pink-300/15 to-purple-300/10 rounded-full animate-blob"
        style={{
          filter: 'blur(60px)',
          transform: `translateY(${-scrollY * 0.12}px) translateX(${Math.sin(scrollY * 0.0022) * 35}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Rotating gradient circle */}
      <div 
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          filter: 'blur(100px)',
          transform: `translate(-50%, -50%) rotate(${scrollY * 0.03}deg) scale(${1 + scrollY * 0.0001})`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <div className="w-full h-full rounded-full bg-gradient-conic from-pink-400/10 via-green-400/10 via-purple-400/10 via-teal-400/10 to-pink-400/10 animate-spin-slow" />
      </div>
    </div>
  )
}

// Floating Particles - Small Decorative Elements
function FloatingParticles() {
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Array<{
    size: number
    left: number
    top: number
    duration: number
    delay: number
    color: string
  }>>([])
  const [sparkles, setSparkles] = useState<Array<{
    left: number
    top: number
    size: number
    duration: number
    delay: number
  }>>([])

  useEffect(() => {
    // Generate particles once on mount to avoid hydration mismatch
    const colors = ['bg-pink-400/20', 'bg-green-400/20', 'bg-purple-400/20', 'bg-teal-400/20']
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      color: colors[i % colors.length]
    }))
    
    const newSparkles = Array.from({ length: 15 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }))
    
    setParticles(newParticles)
    setSparkles(newSparkles)
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      {/* Small decorative circles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className={`absolute ${particle.color} rounded-full animate-pulse`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            filter: 'blur(1px)',
            animation: `float ${particle.duration}s ease-in-out infinite ${particle.delay}s`,
            opacity: 0.4
          }}
        />
      ))}
      
      {/* Floating sparkles */}
      {sparkles.map((sparkle, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute text-yellow-400/30"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            fontSize: `${sparkle.size}px`,
            animation: `twinkle ${sparkle.duration}s ease-in-out infinite ${sparkle.delay}s`
          }}
        >
          ✨
        </div>
      ))}
    </div>
  )
}

// Floating Wave Shapes - Scroll-Responsive
function FloatingWaves({ scrollY }: { scrollY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[0]">
      {/* Wave 1 - Pink to Green */}
      <svg 
        className="absolute -bottom-20 left-0 w-full h-[500px] opacity-20"
        style={{
          transform: `translateY(${-scrollY * 0.3}px) translateX(${Math.sin(scrollY * 0.001) * 50}px)`,
          transition: 'transform 0.3s ease-out'
        }}
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#34D399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4FD1C5" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path 
          fill="url(#wave1)"
          d="M0,200 C320,280 420,180 720,220 C1020,260 1120,200 1440,240 L1440,500 L0,500 Z"
        />
      </svg>

      {/* Wave 2 - Purple to Teal */}
      <svg 
        className="absolute top-40 right-0 w-full h-[400px] opacity-15"
        style={{
          transform: `translateY(${-scrollY * 0.2}px) translateX(${-Math.cos(scrollY * 0.0008) * 40}px)`,
          transition: 'transform 0.3s ease-out'
        }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4FD1C5" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path 
          fill="url(#wave2)"
          d="M0,100 C360,180 540,80 900,140 C1260,200 1380,120 1440,160 L1440,0 L0,0 Z"
        />
      </svg>

      {/* Wave 3 - Green accent */}
      <svg 
        className="absolute top-1/2 left-0 w-full h-[600px] opacity-10"
        style={{
          transform: `translateY(${-scrollY * 0.25}px) scale(${1 + scrollY * 0.0001})`,
          transition: 'transform 0.3s ease-out'
        }}
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="wave3">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6B9D" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        <ellipse 
          cx="720" 
          cy="300" 
          rx="800" 
          ry="400" 
          fill="url(#wave3)"
          style={{
            filter: 'blur(60px)'
          }}
        />
      </svg>

      {/* Floating orbs */}
      <div 
        className="absolute top-20 right-1/4 w-96 h-96 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full"
        style={{
          transform: `translateY(${scrollY * 0.4}px) translateX(${Math.sin(scrollY * 0.002) * 30}px)`,
          filter: 'blur(50px)',
          transition: 'transform 0.3s ease-out'
        }}
      />
      <div 
        className="absolute bottom-40 left-1/3 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-full"
        style={{
          transform: `translateY(${-scrollY * 0.35}px) translateX(${-Math.cos(scrollY * 0.0015) * 40}px)`,
          filter: 'blur(60px)',
          transition: 'transform 0.3s ease-out'
        }}
      />
    </div>
  )
}


// Hyperspeed Background with Language Greetings Flying Toward Viewer
function PulsingRingsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface LanguageStar {
      x: number
      y: number
      z: number
      text: string
      color: string
      px: number
      py: number
    }

    const greetings = [
      'Hello', 'Hola', 'Bonjour', 'Ciao', 'Hallo', 'こんにちは', 
      '你好', 'Привет', 'Olá', 'مرحبا', '안녕하세요', 'Namaste',
      'Hej', 'Merhaba', 'Sawubona', 'Jambo', 'Dia dhuit', 'Szia'
    ]
    
    const colors = ['#FF6B9D', '#34D399', '#A78BFA', '#4FD1C5']
    
    const stars: LanguageStar[] = []
    const numStars = 120
    const speed = 0.3

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width,
        text: greetings[Math.floor(Math.random() * greetings.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        px: 0,
        py: 0
      })
    }

    function animate() {
      if (!ctx || !canvas) return

      // Soft clear with fade effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw ambient gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      )
      gradient.addColorStop(0, 'rgba(255, 107, 157, 0.02)')
      gradient.addColorStop(0.33, 'rgba(52, 211, 153, 0.015)')
      gradient.addColorStop(0.66, 'rgba(167, 139, 250, 0.015)')
      gradient.addColorStop(1, 'rgba(79, 209, 197, 0.01)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2

      stars.forEach(star => {
        star.z -= speed

        // Reset star when it gets too close
        if (star.z <= 0) {
          star.z = canvas.width
          star.x = Math.random() * canvas.width - cx
          star.y = Math.random() * canvas.height - cy
          star.text = greetings[Math.floor(Math.random() * greetings.length)]
          star.color = colors[Math.floor(Math.random() * colors.length)]
        }

        // 3D to 2D projection
        const k = 128 / star.z
        const px = star.x * k + cx
        const py = star.y * k + cy

        // Calculate size based on distance (perspective)
        const size = (1 - star.z / canvas.width) * 24 + 8
        const opacity = Math.min((1 - star.z / canvas.width) * 0.6, 0.4)

        // Draw motion trail (streak effect)
        if (star.px !== 0 && star.py !== 0 && opacity > 0.1) {
          ctx.beginPath()
          ctx.moveTo(star.px, star.py)
          ctx.lineTo(px, py)
          const trailGradient = ctx.createLinearGradient(star.px, star.py, px, py)
          trailGradient.addColorStop(0, star.color + '00')
          trailGradient.addColorStop(1, star.color + Math.floor(opacity * 100).toString(16).padStart(2, '0'))
          ctx.strokeStyle = trailGradient
          ctx.lineWidth = Math.max(size / 8, 0.5)
          ctx.stroke()
        }

        // Draw text (language greeting)
        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          ctx.save()
          ctx.font = `bold ${size}px Inter, sans-serif`
          ctx.fillStyle = star.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // Add glow effect
          ctx.shadowColor = star.color
          ctx.shadowBlur = size / 2
          ctx.fillText(star.text, px, py)
          
          ctx.restore()
        }

        star.px = px
        star.py = py
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
      className="absolute inset-0 z-0 opacity-50"
      style={{ filter: 'blur(0.5px)' }}
    />
  )
}

// Scroll Stack Component for Features
function ScrollStack() {
  const features = [
    {
      icon: MapPin,
      title: 'Interactive Map',
      description: 'Find partners nearby with real-time availability. See who\'s free right now.',
      gradient: 'from-pink-500 to-pink-600',
      emoji: '📍'
    },
    {
      icon: Users,
      title: 'Smart Matching',
      description: 'AI matches you with compatible partners based on goals and interests.',
      gradient: 'from-purple-500 to-purple-600',
      emoji: '🎯'
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book meetups, set availability, get reminders. All in one place.',
      gradient: 'from-teal-500 to-teal-600',
      emoji: '📅'
    },
    {
      icon: MessageCircle,
      title: 'Built-in Chat',
      description: 'Message partners, share locations, coordinate meetups seamlessly.',
      gradient: 'from-green-500 to-emerald-600',
      emoji: '💬'
    },
    {
      icon: Shield,
      title: 'Verified Users',
      description: 'Every user verified. Safe, respectful community with reporting tools.',
      gradient: 'from-orange-500 to-orange-600',
      emoji: '🛡️'
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'Earn badges, maintain streaks, see improvement with detailed stats.',
      gradient: 'from-indigo-500 to-purple-600',
      emoji: '🏆'
    }
  ]

  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const scrollStart = window.innerHeight
      const scrollEnd = window.innerHeight * 0.3
      
      if (rect.top < scrollStart && rect.bottom > scrollEnd) {
        const progress = (scrollStart - rect.top) / (scrollStart - scrollEnd)
        setScrollProgress(Math.min(Math.max(progress, 0), 1))
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-[300vh] perspective-container">
      <div className="sticky top-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => {
          const delay = i * 0.15
          const cardProgress = Math.max(0, Math.min(1, (scrollProgress - delay) / 0.3))
          const scale = 0.8 + cardProgress * 0.2
          const opacity = cardProgress
          const translateY = (1 - cardProgress) * 100

          return (
            <div
              key={i}
              className="relative group bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-3xl p-8 transition-all duration-500 ease-out card-3d smooth-hover-lift cursor-pointer"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity: opacity,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-out, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6B9D'
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(255, 107, 157, 0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-teal-500/0 group-hover:from-pink-500/10 group-hover:to-teal-500/10 rounded-3xl transition-all duration-500" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6`}>
                    <feature.icon className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-4xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">{feature.emoji}</div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 transition-colors duration-300 group-hover:text-pink-600">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-700">{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Orbiting Flags Component with Language Flags
function OrbitingAvatars() {
  const [rotation, setRotation] = useState(15)

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Language flags with their respective countries
  const flags = [
    { name: 'English', flag: '🇬🇧', bgColor: 'from-pink-400 to-pink-600' },
    { name: 'Spanish', flag: '🇪🇸', bgColor: 'from-green-400 to-green-600' },
    { name: 'French', flag: '🇫🇷', bgColor: 'from-purple-400 to-purple-600' },
    { name: 'German', flag: '🇩🇪', bgColor: 'from-teal-400 to-teal-600' },
    { name: 'Japanese', flag: '🇯🇵', bgColor: 'from-pink-400 to-pink-600' },
    { name: 'Chinese', flag: '🇨🇳', bgColor: 'from-green-400 to-green-600' },
    { name: 'Italian', flag: '🇮🇹', bgColor: 'from-purple-400 to-purple-600' },
    { name: 'Portuguese', flag: '🇵🇹', bgColor: 'from-teal-400 to-teal-600' }
  ]

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Center hub with TaalMeet logo */}
      <div className="absolute z-20 w-32 h-32 bg-gradient-to-br from-pink-500 via-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
        <img src="/taalmeet-icon.svg" alt="TaalMeet" className="w-24 h-24" />
      </div>

      {/* Orbiting flag circles */}
      {flags.map((item, i) => {
        const angle = (360 / flags.length) * i + rotation
        const radius = 240
        const x = Math.cos((angle * Math.PI) / 180) * radius
        const y = Math.sin((angle * Math.PI) / 180) * radius

        return (
          <div
            key={i}
            className="absolute w-24 h-24 transition-transform hover:scale-125 cursor-pointer group"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25)) drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
            }}
          >
            <div className={`w-full h-full bg-gradient-to-br ${item.bgColor} rounded-full flex items-center justify-center border-4 border-white overflow-hidden relative group-hover:border-pink-300 transition-all duration-300`}>
              {/* Flag emoji */}
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                {item.flag}
              </span>
              {/* Language name on hover */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-xs font-bold">{item.name}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Orbital rings */}
      <div className="absolute w-[480px] h-[480px] border-2 border-dashed border-pink-300/20 rounded-full animate-spin-slow" />
      <div className="absolute w-[520px] h-[520px] border border-dotted border-green-300/15 rounded-full" style={{ animationDirection: 'reverse' }} />
      
      {/* Connection lines to center */}
      <svg className="absolute w-[480px] h-[480px] pointer-events-none" style={{ opacity: 0.15 }}>
        {flags.map((_, i) => {
          const angle = (360 / flags.length) * i + rotation
          const radius = 240
          const x = Math.cos((angle * Math.PI) / 180) * radius + 240
          const y = Math.sin((angle * Math.PI) / 180) * radius + 240
          
          return (
            <line
              key={i}
              x1="240"
              y1="240"
              x2={x}
              y2={y}
              stroke="url(#flagGradient)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          )
        })}
        <defs>
          <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B9D" />
            <stop offset="33%" stopColor="#34D399" />
            <stop offset="66%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#4FD1C5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

