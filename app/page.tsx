"use client"

import { useState, useEffect, useRef } from "react"
import { MapView } from "@/components/map-view"
import { ProfileView } from "@/components/profile-view"
import { FeedView } from "@/components/feed-view"
import { ChatsView } from "@/components/chats-view"
import { NotificationsView } from "@/components/notifications-view"
import { NewExchangeView } from "@/components/new-exchange-view"
import { BottomNav } from "@/components/bottom-nav"
import { SetFlagModal } from "@/components/set-flag-modal"
import { OnboardingCarousel } from "@/components/onboarding-carousel"
import { SignupFlow } from "@/components/signup-flow"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Mail, RefreshCw } from "lucide-react"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"map" | "feed" | "chats" | "notifications" | "profile">("map")
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showNewExchange, setShowNewExchange] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const hasCheckedAuth = useRef(false)
  const isProcessingAuthChange = useRef(false)

  useEffect(() => {
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    async function checkAuth() {
      try {
        const supabase = createClient()

        console.log("[v0] Starting auth check...")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[v0] Session found:", !!session)

        if (session) {
          console.log("[v0] Active session found:", session.user.id)
          
          // Check if there's pending profile data (user just confirmed email)
          const pendingProfile = localStorage.getItem("pending_user_profile")
          
          if (pendingProfile) {
            try {
              const profile = JSON.parse(pendingProfile)
              console.log("[v0] Found pending profile, completing setup...")
              
              // Check for saved location data
              let locationData = null
              try {
                const savedLocation = localStorage.getItem("signup_location")
                if (savedLocation) {
                  locationData = JSON.parse(savedLocation)
                }
              } catch {}
              
              // Update the user profile with stored data
              const { error: profileError } = await supabase
                .from("users")
                .update({
                  full_name: profile.name,
                  avatar_url: profile.photo || null,
                  languages_speak: profile.speakLanguages?.map((lang: any) => lang.code) || [],
                  languages_learn: profile.learnLanguages?.map((lang: any) => lang.code) || [],
                  is_available: true,
                  latitude: locationData?.latitude || null,
                  longitude: locationData?.longitude || null,
                })
                .eq("id", session.user.id)

              if (profileError) {
                console.error("[v0] Error updating profile:", profileError)
                // Try insert if update fails
                const { error: insertError } = await supabase.from("users").insert({
                  id: session.user.id,
                  email: profile.email || session.user.email,
                  full_name: profile.name,
                  avatar_url: profile.photo || null,
                  languages_speak: profile.speakLanguages?.map((lang: any) => lang.code) || [],
                  languages_learn: profile.learnLanguages?.map((lang: any) => lang.code) || [],
                  bio: "",
                  is_available: true,
                  latitude: locationData?.latitude || null,
                  longitude: locationData?.longitude || null,
                  city: null,
                })
                
                if (insertError) {
                  console.error("[v0] Profile insert error:", insertError)
                }
              }
              
              // Store user data in localStorage
              localStorage.setItem(
                "user_profile",
                JSON.stringify({
                  id: session.user.id,
                  name: profile.name,
                  email: profile.email || session.user.email,
                  photo: profile.photo,
                  speakLanguages: profile.speakLanguages,
                  learnLanguages: profile.learnLanguages,
                }),
              )
              
              console.log("[v0] Profile setup complete")
              localStorage.removeItem("pending_user_profile")
              localStorage.removeItem("signup_location")
            } catch (error) {
              console.error("[v0] Error processing pending profile:", error)
            }
          }
          
          console.log("[v0] Fetching user data for:", session.user.id)

          const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (error) {
            console.error("[v0] Error fetching user data:", error)
            // If user doesn't exist yet (new signup), show signup to complete profile
            // But only if we have pending profile data (from signup flow)
            const pendingProfile = localStorage.getItem("pending_user_profile")
            if (pendingProfile) {
              setShowOnboarding(false)
              setShowSignup(true)
              setIsCheckingAuth(false)
              return
            }
            // Otherwise, user is logged in but profile doesn't exist - create a basic one and let them in
            console.log("[v0] User logged in but no profile, allowing access")
          } else {
            console.log("[v0] User data fetched:", userData)

            // Check if profile has languages, but don't block access for existing users
            const speakCount = Array.isArray(userData.languages_speak) ? userData.languages_speak.length : 0
            const learnCount = Array.isArray(userData.languages_learn) ? userData.languages_learn.length : 0

            // Only show signup if this is a new user from signup flow (has pending profile)
            const pendingProfile = localStorage.getItem("pending_user_profile")
            if ((speakCount === 0 || learnCount === 0) && pendingProfile) {
              // Deep-link to the missing step
              try {
                const step = speakCount === 0 ? 3 : 4
                localStorage.setItem("resume_signup_step", String(step))
              } catch {}
              console.log("[v0] Profile incomplete (missing languages), showing signup for new user")
              setShowOnboarding(false)
              setShowSignup(true)
              setIsCheckingAuth(false)
              return
            }
            // If it's an existing user logging in, let them in even without languages
            // They can complete their profile later
          }

          // User is logged in and can access the app
          localStorage.setItem("onboarding_completed", "true")
          localStorage.setItem("user_id", session.user.id)
          localStorage.removeItem("pending_user_profile")
          setPendingConfirmation(false)
          setShowOnboarding(false)
          setShowSignup(false)
          setIsCheckingAuth(false)
          return
        }

        const pendingProfile = localStorage.getItem("pending_user_profile")
        console.log("[v0] Pending profile found:", !!pendingProfile)

        if (pendingProfile) {
          const profile = JSON.parse(pendingProfile)
          console.log("[v0] Showing email confirmation screen for:", profile.email)
          setUserEmail(profile.email)
          setPendingConfirmation(true)
          setShowOnboarding(false)
          setShowSignup(false)
          setIsCheckingAuth(false)
          return
        }

        // No session - redirect to login page
        console.log("[v0] No session found, redirecting to login")
        window.location.href = "/auth/login"
        return
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        // On error, redirect to login page
        window.location.href = "/auth/login"
        return
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isProcessingAuthChange.current) {
        console.log("[v0] Already processing auth change, skipping...")
        return
      }

      console.log("[v0] Auth state changed:", event, "Session:", !!session)

      if (event === "SIGNED_IN" && session) {
        isProcessingAuthChange.current = true
        console.log("[v0] User signed in, checking for pending profile...")
        
        // Check if there's pending profile data to complete setup (from signup flow)
        const pendingProfile = localStorage.getItem("pending_user_profile")
        
        if (pendingProfile) {
          try {
            const profile = JSON.parse(pendingProfile)
            console.log("[v0] Found pending profile, completing setup...")
            
            const supabase = createClient()
            
            // Check for saved location data
            let locationData = null
            try {
              const savedLocation = localStorage.getItem("signup_location")
              if (savedLocation) {
                locationData = JSON.parse(savedLocation)
              }
            } catch {}
            
            // Update the user profile with stored data
            const { error: profileError } = await supabase
              .from("users")
              .update({
                full_name: profile.name,
                avatar_url: profile.photo || null,
                languages_speak: profile.speakLanguages?.map((lang: any) => lang.code) || [],
                languages_learn: profile.learnLanguages?.map((lang: any) => lang.code) || [],
                is_available: true,
                latitude: locationData?.latitude || null,
                longitude: locationData?.longitude || null,
              })
              .eq("id", session.user.id)

            if (profileError) {
              console.error("[v0] Error updating profile:", profileError)
              // Try insert if update fails
              const { error: insertError } = await supabase.from("users").insert({
                id: session.user.id,
                email: profile.email || session.user.email,
                full_name: profile.name,
                avatar_url: profile.photo || null,
                languages_speak: profile.speakLanguages?.map((lang: any) => lang.code) || [],
                languages_learn: profile.learnLanguages?.map((lang: any) => lang.code) || [],
                bio: "",
                is_available: true,
                latitude: locationData?.latitude || null,
                longitude: locationData?.longitude || null,
                city: null,
              })
              
              if (insertError) {
                console.error("[v0] Profile insert error:", insertError)
              }
            }
            
            // Store user data in localStorage
            localStorage.setItem(
              "user_profile",
              JSON.stringify({
                id: session.user.id,
                name: profile.name,
                email: profile.email || session.user.email,
                photo: profile.photo,
                speakLanguages: profile.speakLanguages,
                learnLanguages: profile.learnLanguages,
              }),
            )
            
            console.log("[v0] Profile setup complete")
            localStorage.removeItem("pending_user_profile")
            localStorage.removeItem("signup_location")
            setShowWelcome(true)
          } catch (error) {
            console.error("[v0] Error processing pending profile:", error)
          }
        } else {
          // User logged in normally (not from signup), clear any stale pending data
          console.log("[v0] Normal login - clearing any stale pending data")
          localStorage.removeItem("pending_user_profile")
          localStorage.removeItem("signup_location")
          localStorage.removeItem("resume_signup_step")
        }
        
        // Allow user to access the app
        localStorage.setItem("onboarding_completed", "true")
        localStorage.setItem("user_id", session.user.id)
        setPendingConfirmation(false)
        setShowOnboarding(false)
        setShowSignup(false)
        setIsCheckingAuth(false)

        setTimeout(() => {
          isProcessingAuthChange.current = false
        }, 1000)
      } else if (event === "SIGNED_OUT") {
        isProcessingAuthChange.current = true
        console.log("[v0] User signed out, clearing all data")
        localStorage.removeItem("onboarding_completed")
        localStorage.removeItem("user_profile")
        localStorage.removeItem("user_id")
        localStorage.removeItem("pending_user_profile")
        setPendingConfirmation(false)
        setShowOnboarding(true)

        setTimeout(() => {
          isProcessingAuthChange.current = false
        }, 1000)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setShowSignup(true)
  }

  const handleSignupComplete = () => {
    setShowSignup(false)
    setIsCheckingAuth(true)
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleSignupBack = () => {
    setShowSignup(false)
    setShowOnboarding(true)
  }

  const handleResendConfirmation = async () => {
    if (!userEmail) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      })

      if (error) throw error
      alert("Confirmation email sent! Please check your inbox.")
    } catch (error) {
      console.error("[v0] Resend error:", error)
      alert("Failed to resend email. Please try again.")
    }
  }

  const handleContinueAsGuest = () => {
    localStorage.removeItem("pending_user_profile")
    setPendingConfirmation(false)
  }

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (pendingConfirmation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] p-6">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center space-y-6 border border-white/20">
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Mail className="h-12 w-12 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Check Your Email</h1>
            <p className="text-white/80 text-lg">We sent a confirmation link to</p>
            <p className="text-white font-semibold">{userEmail}</p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResendConfirmation}
              className="w-full h-12 rounded-full bg-white text-[#667eea] hover:bg-gray-50 font-semibold"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Resend Email
            </Button>

            <Button
              onClick={handleContinueAsGuest}
              variant="ghost"
              className="w-full h-12 rounded-full text-white hover:bg-white/20 font-semibold"
            >
              Continue as Guest
            </Button>
          </div>

          <p className="text-sm text-white/60 pt-4">Can't find the email? Check your spam folder or try resending.</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingCarousel onComplete={handleOnboardingComplete} />
  }

  if (showSignup) {
    return <SignupFlow onComplete={handleSignupComplete} onBack={handleSignupBack} />
  }

  return (
    <div className="flex flex-col h-screen bg-background safe-area-inset">
      {showWelcome && (
        <div className="px-4 py-2 text-center text-sm bg-emerald-600 text-white">
          Welcome! Your email is confirmed and your profile was set up.
          <button
            className="ml-3 underline"
            onClick={() => setShowWelcome(false)}
          >
            Dismiss
          </button>
        </div>
      )}
      <main className="flex-1 overflow-y-auto overscroll-contain animate-slide-up">
        {showNewExchange ? (
          <NewExchangeView onClose={() => setShowNewExchange(false)} />
        ) : (
          <>
            {activeTab === "map" && (
              <MapView onSetFlag={() => setIsFlagModalOpen(true)} onProfileModalChange={setIsProfileModalOpen} />
            )}
            {activeTab === "feed" && <FeedView />}
            {activeTab === "chats" && <ChatsView onChatOpenChange={setIsChatOpen} />}
            {activeTab === "notifications" && <NotificationsView />}
            {activeTab === "profile" && <ProfileView />}
          </>
        )}
      </main>

      {!isProfileModalOpen && !isChatOpen && !showNewExchange && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onNewExchange={() => setShowNewExchange(true)} />
      )}

      <SetFlagModal open={isFlagModalOpen} onOpenChange={setIsFlagModalOpen} />
    </div>
  )
}
