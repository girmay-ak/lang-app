-- =====================================================
-- LOCATION-BASED USER DISCOVERY WITH POSTGIS
-- =====================================================
-- This script sets up PostGIS for efficient location-based queries
-- to find nearby language exchange partners

-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- 1. UPDATE USERS TABLE FOR LOCATION FEATURES
-- =====================================================

-- Add location-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_point geography(Point, 4326),
ADD COLUMN IF NOT EXISTS location_accuracy real DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ghost_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS discovery_radius_km real DEFAULT 5.0;

-- Create spatial index on location_point for fast geo queries
CREATE INDEX IF NOT EXISTS idx_users_location_point 
ON users USING GIST (location_point);

-- Create index on last_active_at for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_last_active 
ON users (last_active_at DESC) WHERE is_available = true;

-- Create index on ghost_mode for filtering discoverable users
CREATE INDEX IF NOT EXISTS idx_users_discoverable 
ON users (ghost_mode, is_available) WHERE ghost_mode = false;

-- Composite index for language matching
CREATE INDEX IF NOT EXISTS idx_users_languages 
ON users USING GIN (languages_speak, languages_learn);

-- =====================================================
-- 2. FUNCTION: UPDATE USER LOCATION
-- =====================================================
-- Updates user's location with privacy (rounds to ~100m precision)
-- This prevents exact location tracking while maintaining usefulness

CREATE OR REPLACE FUNCTION update_user_location(
  p_user_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy real DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rounded_lat double precision;
  v_rounded_lon double precision;
  v_result json;
BEGIN
  -- Round coordinates to 3 decimal places (~111m precision)
  -- This protects user privacy while allowing nearby discovery
  v_rounded_lat := ROUND(p_latitude::numeric, 3);
  v_rounded_lon := ROUND(p_longitude::numeric, 3);
  
  -- Update user location
  UPDATE users
  SET 
    latitude = v_rounded_lat,
    longitude = v_rounded_lon,
    location_point = ST_SetSRID(ST_MakePoint(v_rounded_lon, v_rounded_lat), 4326)::geography,
    location_accuracy = p_accuracy,
    location_updated_at = now(),
    last_active_at = now()
  WHERE id = p_user_id;
  
  -- Return updated location info
  SELECT json_build_object(
    'latitude', v_rounded_lat,
    'longitude', v_rounded_lon,
    'accuracy', p_accuracy,
    'updated_at', now()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. FUNCTION: FIND NEARBY USERS
-- =====================================================
-- Finds nearby language exchange partners with all filters applied
-- Returns users sorted by distance (closest first)

CREATE OR REPLACE FUNCTION find_nearby_users(
  p_user_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km real DEFAULT 5.0,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  city text,
  languages_speak text[],
  languages_learn text[],
  distance_meters real,
  distance_km real,
  last_active_at timestamp with time zone,
  is_available boolean,
  language_match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_languages_speak text[];
  v_my_languages_learn text[];
  v_blocked_users uuid[];
  v_search_point geography;
BEGIN
  -- Get current user's languages
  SELECT u.languages_speak, u.languages_learn
  INTO v_my_languages_speak, v_my_languages_learn
  FROM users u
  WHERE u.id = p_user_id;
  
  -- Get list of blocked users (both ways)
  SELECT ARRAY_AGG(DISTINCT blocked_user_id)
  INTO v_blocked_users
  FROM (
    SELECT blocker_id AS blocked_user_id FROM user_blocks WHERE blocked_id = p_user_id
    UNION
    SELECT blocked_id AS blocked_user_id FROM user_blocks WHERE blocker_id = p_user_id
  ) blocked;
  
  -- Create search point
  v_search_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  
  -- Find nearby users with all filters
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    u.bio,
    u.city,
    u.languages_speak,
    u.languages_learn,
    ST_Distance(u.location_point, v_search_point)::real AS distance_meters,
    (ST_Distance(u.location_point, v_search_point) / 1000)::real AS distance_km,
    u.last_active_at,
    u.is_available,
    -- Calculate language match score (higher = better match)
    (
      COALESCE(array_length(ARRAY(
        SELECT unnest(u.languages_speak) 
        INTERSECT 
        SELECT unnest(v_my_languages_learn)
      ), 1), 0) +
      COALESCE(array_length(ARRAY(
        SELECT unnest(u.languages_learn) 
        INTERSECT 
        SELECT unnest(v_my_languages_speak)
      ), 1), 0)
    ) AS language_match_score
  FROM users u
  WHERE 
    -- Not the current user
    u.id != p_user_id
    -- Has location set
    AND u.location_point IS NOT NULL
    -- Within radius
    AND ST_DWithin(u.location_point, v_search_point, p_radius_km * 1000)
    -- Available for exchange
    AND u.is_available = true
    -- Not in ghost mode
    AND u.ghost_mode = false
    -- Active within last 7 days
    AND u.last_active_at > now() - interval '7 days'
    -- Not blocked
    AND (v_blocked_users IS NULL OR u.id != ALL(v_blocked_users))
    -- Has at least one language match
    AND (
      -- They speak what I want to learn
      EXISTS (
        SELECT 1 FROM unnest(u.languages_speak) AS lang
        WHERE lang = ANY(v_my_languages_learn)
      )
      OR
      -- They want to learn what I speak
      EXISTS (
        SELECT 1 FROM unnest(u.languages_learn) AS lang
        WHERE lang = ANY(v_my_languages_speak)
      )
    )
  ORDER BY 
    -- Sort by language match score first (best matches)
    language_match_score DESC,
    -- Then by distance (closest)
    distance_meters ASC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 4. FUNCTION: GET NEARBY USERS COUNT
-- =====================================================
-- Quick count of nearby users without full data retrieval

CREATE OR REPLACE FUNCTION count_nearby_users(
  p_user_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km real DEFAULT 5.0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_my_languages_speak text[];
  v_my_languages_learn text[];
  v_blocked_users uuid[];
  v_search_point geography;
BEGIN
  -- Get current user's languages
  SELECT u.languages_speak, u.languages_learn
  INTO v_my_languages_speak, v_my_languages_learn
  FROM users u
  WHERE u.id = p_user_id;
  
  -- Get blocked users
  SELECT ARRAY_AGG(DISTINCT blocked_user_id)
  INTO v_blocked_users
  FROM (
    SELECT blocker_id AS blocked_user_id FROM user_blocks WHERE blocked_id = p_user_id
    UNION
    SELECT blocked_id AS blocked_user_id FROM user_blocks WHERE blocker_id = p_user_id
  ) blocked;
  
  -- Create search point
  v_search_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  
  -- Count nearby users
  SELECT COUNT(*)::integer
  INTO v_count
  FROM users u
  WHERE 
    u.id != p_user_id
    AND u.location_point IS NOT NULL
    AND ST_DWithin(u.location_point, v_search_point, p_radius_km * 1000)
    AND u.is_available = true
    AND u.ghost_mode = false
    AND u.last_active_at > now() - interval '7 days'
    AND (v_blocked_users IS NULL OR u.id != ALL(v_blocked_users))
    AND (
      EXISTS (
        SELECT 1 FROM unnest(u.languages_speak) AS lang
        WHERE lang = ANY(v_my_languages_learn)
      )
      OR
      EXISTS (
        SELECT 1 FROM unnest(u.languages_learn) AS lang
        WHERE lang = ANY(v_my_languages_speak)
      )
    );
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- 5. FUNCTION: TOGGLE GHOST MODE
-- =====================================================
-- Allow users to hide from discovery

CREATE OR REPLACE FUNCTION toggle_ghost_mode(
  p_user_id uuid,
  p_enabled boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET ghost_mode = p_enabled
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'ghost_mode', p_enabled,
    'message', CASE 
      WHEN p_enabled THEN 'You are now hidden from discovery'
      ELSE 'You are now visible to nearby users'
    END
  );
END;
$$;

-- =====================================================
-- 6. FUNCTION: UPDATE LAST ACTIVE
-- =====================================================
-- Call this periodically to keep user active in discovery

CREATE OR REPLACE FUNCTION update_last_active(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE users
  SET last_active_at = now()
  WHERE id = p_user_id;
$$;

-- =====================================================
-- 7. RLS POLICIES FOR LOCATION PRIVACY
-- =====================================================

-- Users can only update their own location
CREATE POLICY "Users can update own location"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can view other users' approximate location (not exact)
-- This is handled by the find_nearby_users function which rounds coordinates

-- =====================================================
-- 8. CREATE USER_BLOCKS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker 
ON user_blocks(blocker_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked 
ON user_blocks(blocked_id);

-- RLS for user_blocks
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blocks"
ON user_blocks FOR ALL
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

-- =====================================================
-- 9. HELPER VIEWS
-- =====================================================

-- View for active discoverable users
CREATE OR REPLACE VIEW discoverable_users AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  city,
  languages_speak,
  languages_learn,
  is_available,
  last_active_at,
  location_point,
  ST_Y(location_point::geometry) AS latitude,
  ST_X(location_point::geometry) AS longitude
FROM users
WHERE 
  ghost_mode = false
  AND is_available = true
  AND location_point IS NOT NULL
  AND last_active_at > now() - interval '7 days';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Update user location
-- SELECT update_user_location(
--   'user-uuid-here',
--   40.7128,  -- latitude (New York)
--   -74.0060, -- longitude
--   10.0      -- accuracy in meters
-- );

-- Example 2: Find nearby users within 2km
-- SELECT * FROM find_nearby_users(
--   'user-uuid-here',
--   40.7128,  -- my latitude
--   -74.0060, -- my longitude
--   2.0,      -- radius in km
--   20        -- limit results
-- );

-- Example 3: Count nearby users
-- SELECT count_nearby_users(
--   'user-uuid-here',
--   40.7128,
--   -74.0060,
--   5.0
-- );

-- Example 4: Enable ghost mode
-- SELECT toggle_ghost_mode('user-uuid-here', true);

-- Example 5: Update last active timestamp
-- SELECT update_last_active('user-uuid-here');
