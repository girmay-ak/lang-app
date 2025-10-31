-- =====================================================
-- STORIES/FEED SYSTEM (Instagram-like Stories)
-- =====================================================
-- Complete implementation of 24-hour stories with:
-- - Story posts (text, image, voice, language tags)
-- - Story viewing and tracking
-- - Story reactions and replies
-- - Story rings (new/viewed/own)
-- - Privacy controls
-- - Auto-cleanup after 24 hours
-- =====================================================

-- =====================================================
-- 1. ENHANCE STORIES TABLE
-- =====================================================
-- Add missing fields to existing stories table

ALTER TABLE stories ADD COLUMN IF NOT EXISTS language_tags TEXT[] DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'nearby' CHECK (privacy_level IN ('everyone', 'nearby', 'connections', 'custom'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS voice_duration INTEGER; -- Duration in seconds for voice notes
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_type TEXT DEFAULT 'text' CHECK (story_type IN ('text', 'image', 'voice'));

-- Add index for language tags
CREATE INDEX IF NOT EXISTS idx_stories_language_tags ON stories USING GIN(language_tags);

-- =====================================================
-- 2. STORY REACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'celebrate', 'laugh', 'wow', 'sad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id) -- One reaction per user per story
);

CREATE INDEX idx_story_reactions_story ON story_reactions(story_id);
CREATE INDEX idx_story_reactions_user ON story_reactions(user_id);
CREATE INDEX idx_story_reactions_created ON story_reactions(created_at DESC);

-- =====================================================
-- 3. STORY PRIVACY LISTS TABLE
-- =====================================================
-- For custom privacy: specific users who can see stories

CREATE TABLE IF NOT EXISTS story_privacy_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allowed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, allowed_user_id)
);

CREATE INDEX idx_story_privacy_user ON story_privacy_lists(user_id);
CREATE INDEX idx_story_privacy_allowed ON story_privacy_lists(allowed_user_id);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user can view a story based on privacy settings
CREATE OR REPLACE FUNCTION can_view_story(
  p_story_id UUID,
  p_viewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_story_user_id UUID;
  v_privacy_level TEXT;
  v_can_view BOOLEAN := FALSE;
BEGIN
  -- Get story details
  SELECT user_id, privacy_level INTO v_story_user_id, v_privacy_level
  FROM stories
  WHERE id = p_story_id AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Own story
  IF v_story_user_id = p_viewer_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if blocked
  IF EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = v_story_user_id AND blocked_id = p_viewer_id)
       OR (blocker_id = p_viewer_id AND blocked_id = v_story_user_id)
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check privacy level
  CASE v_privacy_level
    WHEN 'everyone' THEN
      v_can_view := TRUE;
    WHEN 'nearby' THEN
      -- Check if viewer is nearby (within discovery radius)
      v_can_view := EXISTS (
        SELECT 1 FROM users u1, users u2
        WHERE u1.id = v_story_user_id
          AND u2.id = p_viewer_id
          AND u1.location_point IS NOT NULL
          AND u2.location_point IS NOT NULL
          AND ST_DWithin(
            u1.location_point::geography,
            u2.location_point::geography,
            COALESCE(u1.discovery_radius_km, 50) * 1000
          )
      );
    WHEN 'connections' THEN
      -- Check if they've chatted before
      v_can_view := EXISTS (
        SELECT 1 FROM conversations
        WHERE (user1_id = v_story_user_id AND user2_id = p_viewer_id)
           OR (user2_id = v_story_user_id AND user1_id = p_viewer_id)
      );
    WHEN 'custom' THEN
      -- Check custom privacy list
      v_can_view := EXISTS (
        SELECT 1 FROM story_privacy_lists
        WHERE user_id = v_story_user_id AND allowed_user_id = p_viewer_id
      );
  END CASE;
  
  RETURN v_can_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stories from nearby users with proper filtering
CREATE OR REPLACE FUNCTION get_nearby_stories(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  story_id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  content TEXT,
  media_url TEXT,
  voice_duration INTEGER,
  story_type TEXT,
  language_tags TEXT[],
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  view_count INTEGER,
  has_viewed BOOLEAN,
  is_own_story BOOLEAN,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS story_id,
    s.user_id,
    u.full_name,
    u.avatar_url,
    s.content,
    s.media_url,
    s.voice_duration,
    s.story_type,
    s.language_tags,
    s.created_at,
    s.expires_at,
    s.view_count,
    EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = p_user_id) AS has_viewed,
    (s.user_id = p_user_id) AS is_own_story,
    CASE 
      WHEN u.location_point IS NOT NULL AND viewer.location_point IS NOT NULL THEN
        ROUND((ST_Distance(u.location_point::geography, viewer.location_point::geography) / 1000)::numeric, 2)
      ELSE NULL
    END AS distance_km
  FROM stories s
  JOIN users u ON s.user_id = u.id
  CROSS JOIN users viewer
  WHERE viewer.id = p_user_id
    AND s.expires_at > NOW()
    AND can_view_story(s.id, p_user_id)
  ORDER BY 
    -- Own stories first
    (s.user_id = p_user_id) DESC,
    -- Then unviewed stories
    (NOT EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = p_user_id)) DESC,
    -- Then by distance (closest first)
    distance_km ASC NULLS LAST,
    -- Then by recency
    s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get story ring status for users
CREATE OR REPLACE FUNCTION get_story_ring_status(
  p_viewer_id UUID,
  p_user_ids UUID[]
)
RETURNS TABLE (
  user_id UUID,
  has_stories BOOLEAN,
  has_unviewed_stories BOOLEAN,
  is_own_stories BOOLEAN,
  story_count INTEGER,
  latest_story_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    COUNT(s.id) > 0 AS has_stories,
    COUNT(s.id) FILTER (WHERE NOT EXISTS(
      SELECT 1 FROM story_views sv 
      WHERE sv.story_id = s.id AND sv.viewer_id = p_viewer_id
    )) > 0 AS has_unviewed_stories,
    (u.id = p_viewer_id) AS is_own_stories,
    COUNT(s.id)::INTEGER AS story_count,
    MAX(s.created_at) AS latest_story_at
  FROM users u
  LEFT JOIN stories s ON s.user_id = u.id 
    AND s.expires_at > NOW()
    AND can_view_story(s.id, p_viewer_id)
  WHERE u.id = ANY(p_user_ids)
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark story as viewed
CREATE OR REPLACE FUNCTION mark_story_viewed(
  p_story_id UUID,
  p_viewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_story_user_id UUID;
BEGIN
  -- Check if story exists and is not expired
  SELECT user_id INTO v_story_user_id
  FROM stories
  WHERE id = p_story_id AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Don't track views on own stories
  IF v_story_user_id = p_viewer_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user can view this story
  IF NOT can_view_story(p_story_id, p_viewer_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Insert view record (ignore if already exists)
  INSERT INTO story_views (story_id, viewer_id)
  VALUES (p_story_id, p_viewer_id)
  ON CONFLICT (story_id, viewer_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has viewed a story
CREATE OR REPLACE FUNCTION has_viewed_story(
  p_story_id UUID,
  p_viewer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM story_views
    WHERE story_id = p_story_id AND viewer_id = p_viewer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a story with validation
CREATE OR REPLACE FUNCTION create_story(
  p_user_id UUID,
  p_content TEXT,
  p_media_url TEXT DEFAULT NULL,
  p_voice_duration INTEGER DEFAULT NULL,
  p_story_type TEXT DEFAULT 'text',
  p_language_tags TEXT[] DEFAULT '{}',
  p_privacy_level TEXT DEFAULT 'nearby'
)
RETURNS UUID AS $$
DECLARE
  v_story_count INTEGER;
  v_story_id UUID;
BEGIN
  -- Check if user has reached max stories (10)
  SELECT COUNT(*) INTO v_story_count
  FROM stories
  WHERE user_id = p_user_id AND expires_at > NOW();
  
  IF v_story_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 active stories allowed per user';
  END IF;
  
  -- Create story
  INSERT INTO stories (
    user_id,
    content,
    media_url,
    voice_duration,
    story_type,
    language_tags,
    privacy_level,
    expires_at
  ) VALUES (
    p_user_id,
    p_content,
    p_media_url,
    p_voice_duration,
    p_story_type,
    p_language_tags,
    p_privacy_level,
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_story_id;
  
  RETURN v_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users sorted by story status and distance
CREATE OR REPLACE FUNCTION get_users_with_story_status(
  p_viewer_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  languages_speak TEXT[],
  languages_learn TEXT[],
  is_available BOOLEAN,
  last_active_at TIMESTAMPTZ,
  distance_km NUMERIC,
  has_unviewed_stories BOOLEAN,
  story_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    u.bio,
    u.city,
    u.languages_speak,
    u.languages_learn,
    u.is_available,
    u.last_active_at,
    CASE 
      WHEN u.location_point IS NOT NULL AND viewer.location_point IS NOT NULL THEN
        ROUND((ST_Distance(u.location_point::geography, viewer.location_point::geography) / 1000)::numeric, 2)
      ELSE NULL
    END AS distance_km,
    COUNT(s.id) FILTER (WHERE NOT EXISTS(
      SELECT 1 FROM story_views sv 
      WHERE sv.story_id = s.id AND sv.viewer_id = p_viewer_id
    )) > 0 AS has_unviewed_stories,
    COUNT(s.id)::INTEGER AS story_count
  FROM users u
  CROSS JOIN users viewer
  LEFT JOIN stories s ON s.user_id = u.id 
    AND s.expires_at > NOW()
    AND can_view_story(s.id, p_viewer_id)
  WHERE viewer.id = p_viewer_id
    AND u.id != p_viewer_id
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks
      WHERE (blocker_id = u.id AND blocked_id = p_viewer_id)
         OR (blocker_id = p_viewer_id AND blocked_id = u.id)
    )
  GROUP BY u.id, u.full_name, u.avatar_url, u.bio, u.city, 
           u.languages_speak, u.languages_learn, u.is_available, 
           u.last_active_at, u.location_point, viewer.location_point
  ORDER BY 
    -- Users with unviewed stories first
    has_unviewed_stories DESC,
    -- Then by distance (closest first)
    distance_km ASC NULLS LAST,
    -- Then by recent activity
    u.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. SCHEDULED CLEANUP JOB
-- =====================================================
-- Function to delete expired stories and their views

CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired stories (views will cascade delete)
  WITH deleted AS (
    DELETE FROM stories
    WHERE expires_at <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Set up a cron job in Supabase dashboard to run this function every hour:
-- SELECT cron.schedule('cleanup-expired-stories', '0 * * * *', 'SELECT cleanup_expired_stories()');

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_privacy_lists ENABLE ROW LEVEL SECURITY;

-- Story Reactions Policies
CREATE POLICY "Users can view reactions on stories they can see" ON story_reactions
  FOR SELECT USING (
    can_view_story(story_id, auth.uid())
  );

CREATE POLICY "Users can create reactions on stories they can see" ON story_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND can_view_story(story_id, auth.uid())
  );

CREATE POLICY "Users can delete their own reactions" ON story_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Story Privacy Lists Policies
CREATE POLICY "Users can view their own privacy lists" ON story_privacy_lists
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own privacy lists" ON story_privacy_lists
  FOR ALL USING (user_id = auth.uid());

-- Update existing stories policies to use the new can_view_story function
DROP POLICY IF EXISTS "Users can view active stories" ON stories;
CREATE POLICY "Users can view stories based on privacy" ON stories
  FOR SELECT USING (can_view_story(id, auth.uid()));

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to award XP when story gets reactions
CREATE OR REPLACE FUNCTION award_xp_for_story_reaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 XP to story creator for each reaction
  PERFORM award_xp(
    (SELECT user_id FROM stories WHERE id = NEW.story_id),
    5,
    'story_reaction'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_xp_on_story_reaction AFTER INSERT ON story_reactions
FOR EACH ROW EXECUTE FUNCTION award_xp_for_story_reaction();

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_stories_user_expires ON stories(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_privacy ON stories(privacy_level);
CREATE INDEX IF NOT EXISTS idx_story_views_composite ON story_views(story_id, viewer_id);

-- =====================================================
-- STORIES SYSTEM SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Set up cron job for cleanup_expired_stories()
-- 3. Use the TypeScript library (lib/supabase/stories.ts) in your app
-- 4. Implement file upload for images and voice notes
-- =====================================================
