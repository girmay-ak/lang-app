import { createClient } from "@/backend/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const origin = requestUrl.origin

  // Handle errors
  if (error) {
    console.error("[auth/callback] Error:", error)
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`)
  }

  // Exchange code for session
  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error("[auth/callback] Exchange error:", exchangeError)
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message)}`)
      }
      
      console.log("[auth/callback] Session established successfully")
    } catch (err: any) {
      console.error("[auth/callback] Unexpected error:", err)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(err.message || "Authentication failed")}`)
    }
  }

  // Redirect to the dashboard after successful authentication
  return NextResponse.redirect(`${origin}/dashboard`)
}

