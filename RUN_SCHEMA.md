# Running the Database Schema Script

## Quick Method: Supabase Dashboard SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `scripts/003_complete_database_schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

The script will create:
- ✅ All missing tables (including `notifications`)
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers and functions
- ✅ Seed data (languages, achievements, challenges)
- ✅ Leaderboard views

## Verification

After running, verify the notifications table was created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';
```

You should see `notifications` in the results.

## What This Script Does

- Creates/extends 20+ tables
- Sets up proper indexes
- Enables Row Level Security
- Creates helpful functions (find_nearby_users, etc.)
- Seeds initial data (languages, achievements)

## Note

The script uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times. It won't overwrite existing data.

