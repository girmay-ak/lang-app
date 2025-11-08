-- Seed Test Users in Den Haag (The Hague)
-- This script creates 10 test users at different locations in Den Haag
-- Run this in Supabase SQL Editor

-- Den Haag coordinates (center: 52.0705, 4.3007)
-- Different areas around the city:
-- 1. City Center (Binnenhof): 52.0795, 4.3107
-- 2. Scheveningen Beach: 52.1085, 4.2833
-- 3. Bezuidenhout: 52.0885, 4.3483
-- 4. Laak: 52.0525, 4.3183
-- 5. Escamp: 52.0525, 4.2833
-- 6. Centrum: 52.0705, 4.3007
-- 7. Segbroek: 52.0705, 4.2583
-- 8. Loosduinen: 52.0525, 4.2583
-- 9. Ypenburg: 52.0425, 4.3700
-- 10. Kijkduin: 52.0625, 4.2200

-- First, ensure we have language codes in the languages table
INSERT INTO languages (code, name, native_name, flag_emoji, is_active)
VALUES 
  ('en', 'English', 'English', '🇬🇧', true),
  ('nl', 'Dutch', 'Nederlands', '🇳🇱', true),
  ('es', 'Spanish', 'Español', '🇪🇸', true),
  ('fr', 'French', 'Français', '🇫🇷', true),
  ('de', 'German', 'Deutsch', '🇩🇪', true),
  ('it', 'Italian', 'Italiano', '🇮🇹', true),
  ('pt', 'Portuguese', 'Português', '🇵🇹', true),
  ('ar', 'Arabic', 'العربية', '🇸🇦', true),
  ('ja', 'Japanese', '日本語', '🇯🇵', true),
  ('sv', 'Swedish', 'Svenska', '🇸🇪', true)
ON CONFLICT (code) DO NOTHING;

-- Create test users (using auth.users IDs - you'll need to create auth users first)
-- Or insert directly if you have auth users already

-- Note: These UUIDs are examples. Replace with actual user IDs from auth.users
-- Or create auth users first, then update this script with their IDs

-- Function to create a test user with location and languages
CREATE OR REPLACE FUNCTION create_test_user(
  p_email TEXT,
  p_full_name TEXT,
  p_bio TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_city TEXT DEFAULT 'Den Haag',
  p_availability_status TEXT DEFAULT 'available',
  p_is_online BOOLEAN DEFAULT true,
  p_languages_speak TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_languages_learn TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert or update user
  INSERT INTO users (
    email,
    full_name,
    bio,
    latitude,
    longitude,
    location_point,
    city,
    availability_status,
    is_online,
    languages_speak,
    languages_learn,
    last_active_at,
    location_updated_at,
    show_location,
    account_status
  )
  VALUES (
    p_email,
    p_full_name,
    p_bio,
    p_latitude,
    p_longitude,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_city,
    p_availability_status,
    p_is_online,
    p_languages_speak,
    p_languages_learn,
    NOW(),
    NOW(),
    true,
    'active'
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    location_point = EXCLUDED.location_point,
    city = EXCLUDED.city,
    availability_status = EXCLUDED.availability_status,
    is_online = EXCLUDED.is_online,
    languages_speak = EXCLUDED.languages_speak,
    languages_learn = EXCLUDED.languages_learn,
    last_active_at = NOW(),
    location_updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- Add languages to user_languages table
  -- First, delete existing languages
  DELETE FROM user_languages WHERE user_id = v_user_id;

  -- Insert native languages
  IF array_length(p_languages_speak, 1) > 0 THEN
    INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
    SELECT v_user_id, unnest(p_languages_speak), 'native', 'native';
  END IF;

  -- Insert learning languages
  IF array_length(p_languages_learn, 1) > 0 THEN
    INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
    SELECT v_user_id, unnest(p_languages_learn), 'learning', 'intermediate';
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create 10 test users in different areas of Den Haag

-- 1. Emma - English speaker learning Dutch (City Center)
SELECT create_test_user(
  'emma.english@test.com',
  'Emma',
  'British expat living in Den Haag. Love practicing Dutch over coffee! 🇬🇧🇳🇱',
  52.0795,
  4.3107,
  'Den Haag',
  'available',
  true,
  ARRAY['en'],
  ARRAY['nl']
);

-- 2. Marco - Italian speaker learning Dutch (Scheveningen Beach)
SELECT create_test_user(
  'marco.italian@test.com',
  'Marco',
  'Italian chef learning Dutch. Regular at Dutch Language Café! 🇮🇹🇳🇱',
  52.1085,
  4.2833,
  'Scheveningen',
  'available',
  true,
  ARRAY['it'],
  ARRAY['nl', 'en']
);

-- 3. Sophie - French speaker learning Dutch (Bezuidenhout)
SELECT create_test_user(
  'sophie.french@test.com',
  'Sophie',
  'French teacher helping with French, learning Dutch. Intermediate level! 🇫🇷🇳🇱',
  52.0885,
  4.3483,
  'Bezuidenhout',
  'available',
  true,
  ARRAY['fr'],
  ARRAY['nl', 'en']
);

-- 4. Carlos - Spanish speaker learning Dutch (Laak)
SELECT create_test_user(
  'carlos.spanish@test.com',
  'Carlos',
  'Spanish speaker learning Dutch at Dutch Language Café. Member since 2024! 🇪🇸🇳🇱',
  52.0525,
  4.3183,
  'Laak',
  'available',
  true,
  ARRAY['es'],
  ARRAY['nl', 'en']
);

-- 5. Anna - German speaker learning Dutch (Escamp)
SELECT create_test_user(
  'anna.german@test.com',
  'Anna',
  'German native teaching German, learning Dutch. Love language exchange! 🇩🇪🇳🇱',
  52.0525,
  4.2833,
  'Escamp',
  'available',
  true,
  ARRAY['de'],
  ARRAY['nl', 'en']
);

-- 6. Yuki - Japanese speaker learning English (Centrum)
SELECT create_test_user(
  'yuki.japanese@test.com',
  'Yuki',
  'Japanese speaker learning English and Dutch. Beginner level! 🇯🇵🇳🇱',
  52.0705,
  4.3007,
  'Den Haag Centrum',
  'available',
  true,
  ARRAY['ja'],
  ARRAY['en', 'nl']
);

-- 7. Ahmed - Arabic speaker learning Dutch (Segbroek)
SELECT create_test_user(
  'ahmed.arabic@test.com',
  'Ahmed',
  'Arabic speaker teaching Arabic, learning Dutch. Practice makes perfect! 🇸🇦🇳🇱',
  52.0705,
  4.2583,
  'Segbroek',
  'available',
  true,
  ARRAY['ar'],
  ARRAY['nl', 'en']
);

-- 8. Lisa - Dutch native helping others (Loosduinen)
SELECT create_test_user(
  'lisa.dutch@test.com',
  'Lisa',
  'Dutch native helping others learn Dutch. Volunteer at Dutch Language Café! 🇳🇱🇫🇷',
  52.0525,
  4.2583,
  'Loosduinen',
  'available',
  true,
  ARRAY['nl'],
  ARRAY['fr', 'es']
);

-- 9. Maria - Portuguese speaker learning Dutch (Ypenburg)
SELECT create_test_user(
  'maria.portuguese@test.com',
  'Maria',
  'Portuguese speaker learning Dutch. Pre-intermediate level! 🇵🇹🇳🇱',
  52.0425,
  4.3700,
  'Ypenburg',
  'available',
  true,
  ARRAY['pt'],
  ARRAY['nl', 'en']
);

-- 10. Emma S. - Swedish speaker learning Spanish (Kijkduin)
SELECT create_test_user(
  'emma.swedish@test.com',
  'Emma S.',
  'Swedish speaker teaching Swedish, learning Spanish. Intermediate level! 🇸🇪🇪🇸',
  52.0625,
  4.2200,
  'Kijkduin',
  'available',
  true,
  ARRAY['sv'],
  ARRAY['es', 'nl']
);

-- Verify the users were created
SELECT 
  id,
  email,
  full_name,
  city,
  latitude,
  longitude,
  availability_status,
  is_online,
  languages_speak,
  languages_learn,
  ST_AsText(location_point::geometry) as location
FROM users
WHERE city = 'Den Haag' OR city = 'Scheveningen' OR city = 'Bezuidenhout' OR city = 'Laak' OR city = 'Escamp' OR city = 'Segbroek' OR city = 'Loosduinen' OR city = 'Ypenburg' OR city = 'Kijkduin'
ORDER BY full_name;

-- Show user languages
SELECT 
  u.full_name,
  u.email,
  ul.language_code,
  ul.language_type,
  ul.proficiency_level,
  l.name as language_name,
  l.flag_emoji
FROM users u
JOIN user_languages ul ON u.id = ul.user_id
JOIN languages l ON ul.language_code = l.code
WHERE u.city LIKE '%Den Haag%' OR u.city = 'Scheveningen' OR u.city = 'Bezuidenhout' OR u.city = 'Laak' OR u.city = 'Escamp' OR u.city = 'Segbroek' OR u.city = 'Loosduinen' OR u.city = 'Ypenburg' OR u.city = 'Kijkduin'
ORDER BY u.full_name, ul.language_type, ul.language_code;

