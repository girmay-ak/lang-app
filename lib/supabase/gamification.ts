import { createClient } from "./client"

// ============================================================================
// TYPES
// ============================================================================

export interface UserStats {
  userId: string
  level: number
  xpPoints: number
  currentStreak: number
  longestStreak: number
  streakFreezeAvailable: boolean
  streakFrozenUntil: string | null
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  requirementType: string
  requirementValue: number
  isActive: boolean
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  earnedAt: string
  achievement?: Achievement
}

export interface DailyChallenge {
  id: string
  code: string
  name: string
  description: string
  challengeType: string
  targetValue: number
  xpReward: number
  isActive: boolean
}

export interface UserChallenge {
  id: string
  userId: string
  challengeId: string
  progress: number
  targetValue: number
  isCompleted: boolean
  completedAt: string | null
  challenge?: DailyChallenge
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  fullName: string
  avatarUrl: string
  level: number
  xpPoints: number
  currentStreak: number
}

export interface XPAwardResult {
  newLevel: number
  newXp: number
  leveledUp: boolean
}

// ============================================================================
// XP & LEVELING
// ============================================================================

/**
 * Award XP to a user and automatically level them up if needed
 */
export async function awardXP(
  userId: string,
  xpAmount: number,
  activityType: string,
  referenceId?: string,
  referenceType?: string,
): Promise<XPAwardResult | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_xp_amount: xpAmount,
    p_activity_type: activityType,
    p_reference_id: referenceId || null,
    p_reference_type: referenceType || null,
  })

  if (error) {
    console.error("[v0] Error awarding XP:", error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get user's current gamification stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_gamification").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("[v0] Error fetching user stats:", error)
    return null
  }

  return {
    userId: data.user_id,
    level: data.level,
    xpPoints: data.xp_points,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    streakFreezeAvailable: data.streak_freeze_available,
    streakFrozenUntil: data.streak_frozen_until,
  }
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0
  if (level === 2) return 100

  // Sum of arithmetic sequence: 100 + 200 + 300 + ... + (level-1)*100
  return 100 + ((level - 1) * (level - 2) * 100) / 2
}

/**
 * Calculate XP progress percentage for current level
 */
export function calculateLevelProgress(currentXP: number, currentLevel: number): number {
  const currentLevelXP = calculateXPForLevel(currentLevel)
  const nextLevelXP = calculateXPForLevel(currentLevel + 1)
  const xpInCurrentLevel = currentXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP

  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
}

// ============================================================================
// STREAK MANAGEMENT
// ============================================================================

/**
 * Update user's streak (call this when user is active)
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number
  longestStreak: number
  streakBroken: boolean
} | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("update_user_streak", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error updating streak:", error)
    return null
  }

  return data?.[0] || null
}

/**
 * Use streak freeze to protect streak for 1 day
 */
export async function useStreakFreeze(userId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("use_streak_freeze", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error using streak freeze:", error)
    return false
  }

  return data || false
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

/**
 * Get all available achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching achievements:", error)
    return []
  }

  return data.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    xpReward: a.xp_reward,
    requirementType: a.requirement_type,
    requirementValue: a.requirement_value,
    isActive: a.is_active,
  }))
}

/**
 * Get user's earned achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching user achievements:", error)
    return []
  }

  return data.map((ua) => ({
    id: ua.id,
    userId: ua.user_id,
    achievementId: ua.achievement_id,
    earnedAt: ua.earned_at,
    achievement: ua.achievement
      ? {
          id: ua.achievement.id,
          code: ua.achievement.code,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
          xpReward: ua.achievement.xp_reward,
          requirementType: ua.achievement.requirement_type,
          requirementValue: ua.achievement.requirement_value,
          isActive: ua.achievement.is_active,
        }
      : undefined,
  }))
}

/**
 * Check and award achievements for a user
 */
export async function checkAndAwardAchievements(userId: string): Promise<
  {
    achievementId: string
    achievementName: string
    xpAwarded: number
  }[]
> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("check_and_award_achievements", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error checking achievements:", error)
    return []
  }

  return data || []
}

// ============================================================================
// DAILY CHALLENGES
// ============================================================================

/**
 * Generate daily challenges for a user
 */
export async function generateDailyChallenges(userId: string): Promise<DailyChallenge[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("generate_daily_challenges", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error generating challenges:", error)
    return []
  }

  return data || []
}

/**
 * Get user's daily challenges with progress
 */
export async function getUserChallenges(userId: string): Promise<UserChallenge[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_challenges")
    .select(`
      *,
      challenge:daily_challenges(*)
    `)
    .eq("user_id", userId)
    .gte("created_at", new Date().toISOString().split("T")[0]) // Today's challenges
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching user challenges:", error)
    return []
  }

  return data.map((uc) => ({
    id: uc.id,
    userId: uc.user_id,
    challengeId: uc.challenge_id,
    progress: uc.progress,
    targetValue: uc.target_value,
    isCompleted: uc.is_completed,
    completedAt: uc.completed_at,
    challenge: uc.challenge
      ? {
          id: uc.challenge.id,
          code: uc.challenge.code,
          name: uc.challenge.name,
          description: uc.challenge.description,
          challengeType: uc.challenge.challenge_type,
          targetValue: uc.challenge.target_value,
          xpReward: uc.challenge.xp_reward,
          isActive: uc.challenge.is_active,
        }
      : undefined,
  }))
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeType: string,
  increment = 1,
): Promise<{ challengeCompleted: boolean; xpAwarded: number } | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("update_challenge_progress", {
    p_user_id: userId,
    p_challenge_type: challengeType,
    p_increment: increment,
  })

  if (error) {
    console.error("[v0] Error updating challenge progress:", error)
    return null
  }

  return data?.[0] || null
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

/**
 * Get user's leaderboard rank
 */
export async function getUserLeaderboardRank(
  userId: string,
  leaderboardType: "global" | "city" | "language" = "global",
  filterValue?: string,
): Promise<{ rank: number; totalUsers: number } | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_user_leaderboard_rank", {
    p_user_id: userId,
    p_leaderboard_type: leaderboardType,
    p_filter_value: filterValue || null,
  })

  if (error) {
    console.error("[v0] Error fetching user rank:", error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get top leaderboard users
 */
export async function getLeaderboardTop(
  leaderboardType: "global" | "city" | "language" = "global",
  filterValue?: string,
  limit = 100,
): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_leaderboard_top", {
    p_leaderboard_type: leaderboardType,
    p_filter_value: filterValue || null,
    p_limit: limit,
  })

  if (error) {
    console.error("[v0] Error fetching leaderboard:", error)
    return []
  }

  return data || []
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

/**
 * Track user activity and award appropriate XP
 */
export async function trackActivity(
  userId: string,
  activityType: "message" | "voice_call" | "video_call" | "profile_complete" | "daily_login",
  metadata?: { duration?: number; referenceId?: string },
): Promise<XPAwardResult | null> {
  const xpAmounts = {
    message: 2,
    voice_call: 25,
    video_call: 50,
    profile_complete: 20,
    daily_login: 5,
  }

  const xpAmount = xpAmounts[activityType] || 0

  // Award bonus XP for long calls
  let finalXP = xpAmount
  if (activityType === "voice_call" && metadata?.duration && metadata.duration >= 600) {
    finalXP += 10 // +10 XP for 10+ minute calls
  }

  return awardXP(userId, finalXP, activityType, metadata?.referenceId)
}
