import { createClient } from "./client"

export interface Rating {
  id: string
  rater_id: string
  rated_user_id: string
  rating: number
  review: string | null
  created_at: string
}

export interface RatingStats {
  average_rating: number
  total_ratings: number
  five_stars: number
  five_stars_percent: number
  four_stars: number
  four_stars_percent: number
  three_stars: number
  three_stars_percent: number
  two_stars: number
  two_stars_percent: number
  one_star: number
  one_stars_percent: number
}

export interface Review {
  rating_id: string
  rater_name: string
  rater_avatar: string | null
  rating: number
  review: string | null
  created_at: string
}

export interface RatingAnalytics {
  user_average: number
  city_average: number
  global_average: number
  percentile: number
  trend: "improving" | "declining" | "stable"
}

/**
 * Check if a user can rate another user
 */
export async function canRateUser(raterId: string, ratedUserId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("can_rate_user", {
    p_rater_id: raterId,
    p_rated_user_id: ratedUserId,
  })

  if (error) {
    console.error("[v0] Error checking if can rate:", error)
    return { canRate: false, reason: "Error checking eligibility" }
  }

  return {
    canRate: data[0]?.can_rate || false,
    reason: data[0]?.reason || "Unknown error",
  }
}

/**
 * Add a new rating
 */
export async function addRating(raterId: string, ratedUserId: string, rating: number, review?: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("add_rating", {
    p_rater_id: raterId,
    p_rated_user_id: ratedUserId,
    p_rating: rating,
    p_review: review || null,
  })

  if (error) {
    console.error("[v0] Error adding rating:", error)
    return {
      success: false,
      message: error.message,
      ratingId: null,
    }
  }

  return {
    success: data[0]?.success || false,
    message: data[0]?.message || "Unknown error",
    ratingId: data[0]?.rating_id || null,
  }
}

/**
 * Get rating breakdown for a user
 */
export async function getRatingBreakdown(userId: string): Promise<RatingStats | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_rating_breakdown", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error getting rating breakdown:", error)
    return null
  }

  return data[0] || null
}

/**
 * Get recent reviews for a user
 */
export async function getRecentReviews(userId: string, limit = 10, offset = 0): Promise<Review[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_recent_reviews", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error("[v0] Error getting recent reviews:", error)
    return []
  }

  return data || []
}

/**
 * Report an inappropriate review
 */
export async function reportRating(ratingId: string, reporterId: string, reason: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("report_rating", {
    p_rating_id: ratingId,
    p_reporter_id: reporterId,
    p_reason: reason,
  })

  if (error) {
    console.error("[v0] Error reporting rating:", error)
    return { success: false, message: error.message }
  }

  return {
    success: data[0]?.success || false,
    message: data[0]?.message || "Unknown error",
  }
}

/**
 * Track a practice session
 */
export async function trackPracticeSession(
  conversationId: string,
  user1Id: string,
  user2Id: string,
  durationMinutes: number,
) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("track_practice_session", {
    p_conversation_id: conversationId,
    p_user1_id: user1Id,
    p_user2_id: user2Id,
    p_duration_minutes: durationMinutes,
  })

  if (error) {
    console.error("[v0] Error tracking practice session:", error)
    return null
  }

  return data
}

/**
 * Get rating analytics for a user
 */
export async function getRatingAnalytics(userId: string): Promise<RatingAnalytics | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_rating_analytics", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error getting rating analytics:", error)
    return null
  }

  return data[0] || null
}

/**
 * Get user's rating stats (cached)
 */
export async function getUserRatingStats(userId: string): Promise<RatingStats | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("rating_stats").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("[v0] Error getting rating stats:", error)
    return null
  }

  return data
}

/**
 * Subscribe to rating updates for a user
 */
export function subscribeToRatings(userId: string, callback: (rating: Rating) => void) {
  const supabase = createClient()

  const channel = supabase
    .channel(`ratings:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "user_ratings",
        filter: `rated_user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Rating)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
