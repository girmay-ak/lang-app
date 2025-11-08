-- Alternative: Update existing users OR create via Supabase Auth API
-- If you have existing auth users, use this simpler version
-- OR use Supabase Dashboard to create users manually, then run the UPDATE queries below

-- First ensure languages exist
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

-- Option 1: If you have existing users in auth.users, update their profiles
-- Replace 'USER_ID_HERE' with actual auth user IDs from auth.users table

-- Option 2: Use this script to UPDATE existing users (if they already exist in users table)
-- This will work if users were created via the app signup flow

-- Update user 1: Emma
UPDATE users SET
  full_name = 'Emma',
  bio = 'British expat living in Den Haag. Love practicing Dutch over coffee! 🇬🇧🇳🇱',
  latitude = 52.0795,
  longitude = 4.3107,
  location_point = ST_SetSRID(ST_MakePoint(4.3107, 52.0795), 4326)::geography,
  city = 'Den Haag',
  availability_status = 'available',
  is_online = true,
  languages_speak = ARRAY['en']::TEXT[],
  languages_learn = ARRAY['nl']::TEXT[],
  last_active_at = NOW(),
  location_updated_at = NOW(),
  updated_at = NOW()
WHERE email = 'emma.english@test.com';

-- Update user 2: Marco
UPDATE users SET
  full_name = 'Marco',
  bio = 'Italian chef learning Dutch. Regular at Dutch Language Café! 🇮🇹🇳🇱',
  latitude = 52.1085,
  longitude = 4.2833,
  location_point = ST_SetSRID(ST_MakePoint(4.2833, 52.1085), 4326)::geography,
  city = 'Scheveningen',
  availability_status = 'available',
  is_online = true,
  languages_speak = ARRAY['it']::TEXT[],
  languages_learn = ARRAY['nl', 'en']::TEXT[],
  last_active_at = NOW(),
  location_updated_at = NOW(),
  updated_at = NOW()
WHERE email = 'marco.italian@test.com';

-- Continue with other users...
-- (Add similar UPDATE statements for all 10 users)

-- After updating, add user_languages
-- Delete existing and insert fresh for each user
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, languages_speak, languages_learn 
    FROM users 
    WHERE email IN (
      'emma.english@test.com',
      'marco.italian@test.com',
      'sophie.french@test.com',
      'carlos.spanish@test.com',
      'anna.german@test.com',
      'yuki.japanese@test.com',
      'ahmed.arabic@test.com',
      'lisa.dutch@test.com',
      'maria.portuguese@test.com',
      'emma.swedish@test.com'
    )
  LOOP
    -- Delete existing
    DELETE FROM user_languages WHERE user_id = user_record.id;
    
    -- Insert native languages
    IF user_record.languages_speak IS NOT NULL THEN
      INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
      SELECT user_record.id, unnest(user_record.languages_speak), 'native', 'native'
      ON CONFLICT (user_id, language_code, language_type) DO NOTHING;
    END IF;
    
    -- Insert learning languages
    IF user_record.languages_learn IS NOT NULL THEN
      INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
      SELECT user_record.id, unnest(user_record.languages_learn), 'learning', 'intermediate'
      ON CONFLICT (user_id, language_code, language_type) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Verify
SELECT 
  email,
  full_name,
  city,
  latitude,
  longitude,
  availability_status,
  is_online,
  languages_speak,
  languages_learn
FROM users
WHERE email LIKE '%@test.com'
ORDER BY full_name;

