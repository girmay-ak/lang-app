import { createClient } from "./client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// =====================================================
// TYPES
// =====================================================

export type StoryType = "text" | "image" | "voice"
export type StoryPrivacyLevel = "everyone" | "nearby" | "connections" | "custom"
export type StoryReactionType = "like" | "love" | "celebrate" | "laugh" | "wow" | "sad"

export interface Story {
  id: string
  user_id: string
  full_name: string
  avatar_url: string
  content: string
  media_url?: string
  voice_duration?: number
  story_type: StoryType
  language_tags: string[]
  privacy_level: StoryPrivacyLevel
  created_at: string
  expires_at: string
  view_count: number
  has_viewed: boolean
  is_own_story: boolean
  distance_km?: number
}

export interface StoryRingStatus {
  user_id: string
  has_stories: boolean
  has_unviewed_stories: boolean
  is_own_stories: boolean
  story_count: number
  latest_story_at?: string
}

export interface StoryReaction {
  id: string
  story_id: string
  user_id: string
  reaction_type: StoryReactionType
  created_at: string
}

export interface StoryView {
  id: string
  story_id: string
  viewer_id: string
  viewer_name: string
  viewer_avatar: string
  viewed_at: string
}

export interface UserWithStoryStatus {
  user_id: string
  full_name: string
  avatar_url: string
  bio: string
  city: string
  languages_speak: string[]
  languages_learn: string[]
  is_available: boolean
  last_active_at: string
  distance_km?: number
  has_unviewed_stories: boolean
  story_count: number
}

// =====================================================
// STORY OPERATIONS
// =====================================================

/**
 * Create a new story
 */
export async function createStory(params: {
  content: string
  mediaUrl?: string
  voiceDuration?: number
  storyType?: StoryType
  languageTags?: string[]
  privacyLevel?: StoryPrivacyLevel
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("create_story", {
    p_user_id: user.id,
    p_content: params.content,
    p_media_url: params.mediaUrl || null,
    p_voice_duration: params.voiceDuration || null,
    p_story_type: params.storyType || "text",
    p_language_tags: params.languageTags || [],
    p_privacy_level: params.privacyLevel || "nearby",
  })

  if (error) throw error
  return data as string // Returns story ID
}

/**
 * Get nearby stories with proper filtering
 */
export async function getNearbyStories(limit = 50) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("get_nearby_stories", {
    p_user_id: user.id,
    p_limit: limit,
  })

  if (error) throw error
  return data as Story[]
}

/**
 * Get stories for a specific user
 */
export async function getUserStories(userId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("stories")
    .select(`
      *,
      users!inner(full_name, avatar_url)
    `)
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((story) => ({
    ...story,
    full_name: story.users.full_name,
    avatar_url: story.users.avatar_url,
    has_viewed: false, // Will be checked separately
    is_own_story: userId === user.id,
  })) as Story[]
}

/**
 * Mark a story as viewed
 */
export async function markStoryViewed(storyId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("mark_story_viewed", {
    p_story_id: storyId,
    p_viewer_id: user.id,
  })

  if (error) throw error
  return data as boolean
}

/**
 * Check if user has viewed a story
 */
export async function hasViewedStory(storyId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("has_viewed_story", {
    p_story_id: storyId,
    p_viewer_id: user.id,
  })

  if (error) throw error
  return data as boolean
}

/**
 * Delete a story (only own stories)
 */
export async function deleteStory(storyId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("stories").delete().eq("id", storyId).eq("user_id", user.id)

  if (error) throw error
}

/**
 * Get story views (who viewed your story)
 */
export async function getStoryViews(storyId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("story_views")
    .select(`
      id,
      story_id,
      viewer_id,
      viewed_at,
      users!inner(full_name, avatar_url)
    `)
    .eq("story_id", storyId)
    .order("viewed_at", { ascending: false })

  if (error) throw error

  return data.map((view) => ({
    id: view.id,
    story_id: view.story_id,
    viewer_id: view.viewer_id,
    viewer_name: view.users.full_name,
    viewer_avatar: view.users.avatar_url,
    viewed_at: view.viewed_at,
  })) as StoryView[]
}

// =====================================================
// STORY REACTIONS
// =====================================================

/**
 * Add a reaction to a story
 */
export async function addStoryReaction(storyId: string, reactionType: StoryReactionType) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("story_reactions")
    .upsert(
      {
        story_id: storyId,
        user_id: user.id,
        reaction_type: reactionType,
      },
      {
        onConflict: "story_id,user_id",
      },
    )
    .select()
    .single()

  if (error) throw error
  return data as StoryReaction
}

/**
 * Remove a reaction from a story
 */
export async function removeStoryReaction(storyId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("story_reactions").delete().eq("story_id", storyId).eq("user_id", user.id)

  if (error) throw error
}

/**
 * Get reactions for a story
 */
export async function getStoryReactions(storyId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("story_reactions")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as StoryReaction[]
}

// =====================================================
// STORY RING STATUS
// =====================================================

/**
 * Get story ring status for multiple users
 */
export async function getStoryRingStatus(userIds: string[]) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("get_story_ring_status", {
    p_viewer_id: user.id,
    p_user_ids: userIds,
  })

  if (error) throw error
  return data as StoryRingStatus[]
}

/**
 * Get users with story status (sorted by unviewed stories + distance)
 */
export async function getUsersWithStoryStatus(limit = 50) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("get_users_with_story_status", {
    p_viewer_id: user.id,
    p_limit: limit,
  })

  if (error) throw error
  return data as UserWithStoryStatus[]
}

// =====================================================
// STORY PRIVACY
// =====================================================

/**
 * Add user to custom privacy list
 */
export async function addToPrivacyList(allowedUserId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("story_privacy_lists").insert({
    user_id: user.id,
    allowed_user_id: allowedUserId,
  })

  if (error) throw error
}

/**
 * Remove user from custom privacy list
 */
export async function removeFromPrivacyList(allowedUserId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("story_privacy_lists")
    .delete()
    .eq("user_id", user.id)
    .eq("allowed_user_id", allowedUserId)

  if (error) throw error
}

/**
 * Get custom privacy list
 */
export async function getPrivacyList() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("story_privacy_lists")
    .select(`
      allowed_user_id,
      users!inner(full_name, avatar_url)
    `)
    .eq("user_id", user.id)

  if (error) throw error
  return data
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to new stories from nearby users
 */
export function subscribeToNearbyStories(callback: (story: Story) => void): RealtimeChannel {
  const supabase = createClient()

  return supabase
    .channel("nearby-stories")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "stories",
      },
      (payload) => {
        callback(payload.new as Story)
      },
    )
    .subscribe()
}

/**
 * Subscribe to story views on your stories
 */
export function subscribeToStoryViews(storyId: string, callback: (view: StoryView) => void): RealtimeChannel {
  const supabase = createClient()

  return supabase
    .channel(`story-views-${storyId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "story_views",
        filter: `story_id=eq.${storyId}`,
      },
      (payload) => {
        callback(payload.new as StoryView)
      },
    )
    .subscribe()
}

/**
 * Subscribe to story reactions
 */
export function subscribeToStoryReactions(
  storyId: string,
  callback: (reaction: StoryReaction) => void,
): RealtimeChannel {
  const supabase = createClient()

  return supabase
    .channel(`story-reactions-${storyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "story_reactions",
        filter: `story_id=eq.${storyId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          callback(payload.new as StoryReaction)
        }
      },
    )
    .subscribe()
}
