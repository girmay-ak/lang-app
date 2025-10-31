-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Allow users to view all profiles (for finding language partners)
CREATE POLICY "Users can view all profiles"
ON users FOR SELECT
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS users_location_idx ON users (latitude, longitude);

-- Create index for language searches
CREATE INDEX IF NOT EXISTS users_languages_speak_idx ON users USING GIN (languages_speak);
CREATE INDEX IF NOT EXISTS users_languages_learn_idx ON users USING GIN (languages_learn);
