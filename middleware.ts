// Re-export middleware from backend
// This keeps auth working after backend organization
import { updateSession } from "@/backend/lib/supabase/middleware"

export async function middleware(request: Request) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
