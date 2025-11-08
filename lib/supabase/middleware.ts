import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing. Skipping auth middleware.")
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createMiddlewareClient(
    { req: request, res: response },
    {
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return response
    }
  } catch (error) {
    console.error("Supabase middleware failed", error)
    return response
  }

  return response
}
