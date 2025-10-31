import { createBrowserClient } from "./client"

// =====================================================
// ANALYTICS & ADMIN REPORTING LIBRARY
// =====================================================

export interface AnalyticsEvent {
  id: string
  user_id: string
  event_type: string
  event_category: string
  event_data: Record<string, any>
  session_id?: string
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  device_type: string
  platform: string
  app_version?: string
  events_count: number
}

export interface DailyMetrics {
  metric_date: string
  total_users: number
  new_signups: number
  daily_active_users: number
  weekly_active_users: number
  monthly_active_users: number
  total_messages: number
  total_conversations: number
  total_practice_minutes: number
  avg_messages_per_user: number
  avg_practice_minutes_per_user: number
  stories_posted: number
  stories_viewed: number
  avg_session_duration_seconds: number
}

export interface UserGrowth {
  signup_date: string
  new_users: number
  cumulative_users: number
}

export interface CityStats {
  city: string
  user_count: number
  active_users: number
}

export interface LanguageStats {
  language_type: "speak" | "learn"
  language_code: string
  user_count: number
}

export interface RetentionData {
  cohort_date: string
  cohort_size: number
  retained_users: number
  retention_rate: number
}

export interface GrowthRate {
  period_start: string
  period_end: string
  users_at_start: number
  users_at_end: number
  new_users: number
  growth_rate: number
}

// =====================================================
// EVENT LOGGING
// =====================================================

/**
 * Log an analytics event
 */
export async function logEvent(
  eventType: string,
  eventCategory: string,
  eventData: Record<string, any> = {},
  sessionId?: string,
): Promise<string | null> {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc("log_analytics_event", {
    p_user_id: user.id,
    p_event_type: eventType,
    p_event_category: eventCategory,
    p_event_data: eventData,
    p_session_id: sessionId,
  })

  if (error) {
    console.error("[Analytics] Error logging event:", error)
    return null
  }

  return data
}

/**
 * Start a user session
 */
export async function startSession(
  deviceType: "mobile" | "tablet" | "desktop" = "mobile",
  platform = "web",
  appVersion?: string,
): Promise<string | null> {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc("start_user_session", {
    p_user_id: user.id,
    p_device_type: deviceType,
    p_platform: platform,
    p_app_version: appVersion,
  })

  if (error) {
    console.error("[Analytics] Error starting session:", error)
    return null
  }

  // Store session ID in localStorage
  if (data) {
    localStorage.setItem("analytics_session_id", data)
  }

  return data
}

/**
 * End a user session
 */
export async function endSession(sessionId?: string): Promise<void> {
  const supabase = createBrowserClient()

  const sid = sessionId || localStorage.getItem("analytics_session_id")
  if (!sid) return

  const { error } = await supabase.rpc("end_user_session", {
    p_session_id: sid,
  })

  if (error) {
    console.error("[Analytics] Error ending session:", error)
  }

  localStorage.removeItem("analytics_session_id")
}

/**
 * Get current session ID
 */
export function getCurrentSessionId(): string | null {
  return localStorage.getItem("analytics_session_id")
}

// =====================================================
// ADMIN DASHBOARD QUERIES
// =====================================================

/**
 * Get real-time active users count
 */
export async function getActiveUsersCount(minutes = 5): Promise<number> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("get_active_users_count", {
    p_minutes: minutes,
  })

  if (error) {
    console.error("[Analytics] Error getting active users:", error)
    return 0
  }

  return data || 0
}

/**
 * Get user growth data (last 30 days)
 */
export async function getUserGrowth(): Promise<UserGrowth[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("mv_user_growth").select("*").order("signup_date", { ascending: false })

  if (error) {
    console.error("[Analytics] Error getting user growth:", error)
    return []
  }

  return data || []
}

/**
 * Get top cities by user count
 */
export async function getTopCities(limit = 10): Promise<CityStats[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("mv_top_cities").select("*").limit(limit)

  if (error) {
    console.error("[Analytics] Error getting top cities:", error)
    return []
  }

  return data || []
}

/**
 * Get language statistics
 */
export async function getLanguageStats(type?: "speak" | "learn"): Promise<LanguageStats[]> {
  const supabase = createBrowserClient()

  let query = supabase.from("mv_language_stats").select("*").order("user_count", { ascending: false })

  if (type) {
    query = query.eq("language_type", type)
  }

  const { data, error } = await query

  if (error) {
    console.error("[Analytics] Error getting language stats:", error)
    return []
  }

  return data || []
}

/**
 * Get daily metrics
 */
export async function getDailyMetrics(days = 30): Promise<DailyMetrics[]> {
  const supabase = createBrowserClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from("daily_metrics")
    .select("*")
    .gte("metric_date", startDate.toISOString().split("T")[0])
    .order("metric_date", { ascending: false })

  if (error) {
    console.error("[Analytics] Error getting daily metrics:", error)
    return []
  }

  return data || []
}

/**
 * Get streak distribution
 */
export async function getStreakDistribution(): Promise<{ streak_range: string; user_count: number }[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("get_streak_distribution")

  if (error) {
    console.error("[Analytics] Error getting streak distribution:", error)
    return []
  }

  return data || []
}

/**
 * Calculate user retention
 */
export async function calculateRetention(cohortDate: string, daysAfter: number): Promise<RetentionData | null> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("calculate_retention", {
    p_cohort_date: cohortDate,
    p_days_after: daysAfter,
  })

  if (error) {
    console.error("[Analytics] Error calculating retention:", error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get growth rate
 */
export async function getGrowthRate(days = 30): Promise<GrowthRate | null> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("get_growth_rate", {
    p_days: days,
  })

  if (error) {
    console.error("[Analytics] Error getting growth rate:", error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get most active users
 */
export async function getMostActiveUsers(days = 30, limit = 10) {
  const supabase = createBrowserClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from("analytics_events")
    .select(`
      user_id,
      users!inner(full_name, avatar_url)
    `)
    .gte("created_at", startDate.toISOString())

  if (error) {
    console.error("[Analytics] Error getting active users:", error)
    return []
  }

  // Count events per user
  const userCounts = data.reduce((acc: any, event: any) => {
    const userId = event.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user_id: userId,
        full_name: event.users.full_name,
        avatar_url: event.users.avatar_url,
        event_count: 0,
      }
    }
    acc[userId].event_count++
    return acc
  }, {})

  return Object.values(userCounts)
    .sort((a: any, b: any) => b.event_count - a.event_count)
    .slice(0, limit)
}

// =====================================================
// CONVENIENCE FUNCTIONS FOR COMMON EVENTS
// =====================================================

export const trackPageView = (page: string) => logEvent("page_view", "engagement", { page })

export const trackSignup = (method: string) => logEvent("signup", "auth", { method })

export const trackLogin = (method: string) => logEvent("login", "auth", { method })

export const trackMessageSent = (conversationId: string, messageType: string) =>
  logEvent("message_sent", "engagement", { conversation_id: conversationId, message_type: messageType })

export const trackStoryPosted = (storyId: string) => logEvent("story_posted", "social", { story_id: storyId })

export const trackStoryViewed = (storyId: string, authorId: string) =>
  logEvent("story_viewed", "social", { story_id: storyId, author_id: authorId })

export const trackChallengeCompleted = (challengeId: string) =>
  logEvent("challenge_completed", "gamification", { challenge_id: challengeId })

export const trackAchievementUnlocked = (achievementId: string) =>
  logEvent("achievement_unlocked", "gamification", { achievement_id: achievementId })

export const trackProfileUpdated = () => logEvent("profile_updated", "engagement", {})

export const trackLocationUpdated = (city: string) => logEvent("location_updated", "engagement", { city })

export const trackSearchPerformed = (filters: Record<string, any>) =>
  logEvent("search_performed", "feature_usage", { filters })
