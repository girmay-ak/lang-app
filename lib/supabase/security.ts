import { createBrowserClient } from "./client"

export type ReportType =
  | "inappropriate_message"
  | "inappropriate_story"
  | "inappropriate_profile"
  | "harassment"
  | "spam"
  | "fake_profile"
  | "underage"
  | "other"

export type PrivacySettings = {
  hide_exact_location: boolean
  hide_last_seen: boolean
  hide_online_status: boolean
  who_can_message: "everyone" | "connections_only" | "no_one"
  story_visibility: "everyone" | "nearby" | "connections_only" | "no_one"
  profile_visibility: "all" | "language_learners_only" | "hidden"
  discoverable: boolean
}

// =====================================================
// BLOCKING FUNCTIONS
// =====================================================

export async function blockUser(blockedUserId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("block_user", {
    p_blocker_id: (await supabase.auth.getUser()).data.user?.id,
    p_blocked_id: blockedUserId,
  })

  if (error) throw error
  return data
}

export async function unblockUser(blockedUserId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc("unblock_user", {
    p_blocker_id: (await supabase.auth.getUser()).data.user?.id,
    p_blocked_id: blockedUserId,
  })

  if (error) throw error
  return data
}

export async function isUserBlocked(userId: string) {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) return false

  const { data, error } = await supabase.rpc("is_user_blocked", {
    user_a: currentUser.id,
    user_b: userId,
  })

  if (error) throw error
  return data as boolean
}

export async function getBlockedUsers() {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) return []

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id, created_at, users:blocked_id(full_name, avatar_url)")
    .eq("blocker_id", currentUser.id)

  if (error) throw error
  return data
}

// =====================================================
// REPORTING FUNCTIONS
// =====================================================

export async function createReport(params: {
  reportedUserId: string
  reportType: ReportType
  contentType: "message" | "story" | "profile" | "other"
  contentId?: string
  reason: string
}) {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("create_report", {
    p_reporter_id: currentUser.id,
    p_reported_user_id: params.reportedUserId,
    p_report_type: params.reportType,
    p_content_type: params.contentType,
    p_content_id: params.contentId || null,
    p_reason: params.reason,
  })

  if (error) throw error
  return data
}

export async function getMyReports() {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) return []

  const { data, error } = await supabase
    .from("user_reports")
    .select("*")
    .eq("reporter_id", currentUser.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// =====================================================
// PRIVACY SETTINGS FUNCTIONS
// =====================================================

export async function getPrivacySettings(): Promise<PrivacySettings | null> {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) return null

  const { data, error } = await supabase.from("privacy_settings").select("*").eq("user_id", currentUser.id).single()

  if (error) {
    // Return defaults if no settings exist
    return {
      hide_exact_location: false,
      hide_last_seen: false,
      hide_online_status: false,
      who_can_message: "everyone",
      story_visibility: "nearby",
      profile_visibility: "all",
      discoverable: true,
    }
  }

  return data as PrivacySettings
}

export async function updatePrivacySettings(settings: Partial<PrivacySettings>) {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("privacy_settings")
    .upsert({
      user_id: currentUser.id,
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// RATE LIMITING FUNCTIONS
// =====================================================

export async function checkRateLimit(
  actionType: string,
  maxCount: number,
  timeWindowMinutes: number,
): Promise<boolean> {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) return false

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: currentUser.id,
    p_action_type: actionType,
    p_max_count: maxCount,
    p_time_window_minutes: timeWindowMinutes,
  })

  if (error) throw error
  return data as boolean
}

export async function logRateLimit(actionType: string) {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) return

  await supabase.rpc("log_rate_limit", {
    p_user_id: currentUser.id,
    p_action_type: actionType,
  })
}

// =====================================================
// GDPR COMPLIANCE FUNCTIONS
// =====================================================

export async function exportUserData() {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("export_user_data", {
    p_user_id: currentUser.id,
  })

  if (error) throw error
  return data
}

export async function deleteUserAccount() {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("delete_user_account", {
    p_user_id: currentUser.id,
  })

  if (error) throw error
  return data
}

// =====================================================
// ADMIN FUNCTIONS
// =====================================================

export async function getPendingReports() {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("admin_pending_reports").select("*").limit(50)

  if (error) throw error
  return data
}

export async function getModerationQueue() {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("admin_moderation_queue").select("*").limit(50)

  if (error) throw error
  return data
}

export async function reviewReport(reportId: string, status: "resolved" | "dismissed", adminNotes?: string) {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("user_reports")
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function moderateContent(
  queueId: string,
  action: "approved" | "removed",
  adminAction: "none" | "warning" | "content_removed" | "user_suspended" | "user_banned",
  adminNotes?: string,
) {
  const supabase = createBrowserClient()
  const currentUser = (await supabase.auth.getUser()).data.user

  if (!currentUser) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("moderation_queue")
    .update({
      status: action,
      admin_action: adminAction,
      admin_notes: adminNotes,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", queueId)
    .select()
    .single()

  if (error) throw error
  return data
}
