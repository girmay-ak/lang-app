# Gamification System Guide

Complete guide for implementing and using the gamification system in your language exchange app.

## Overview

The gamification system includes:
- **XP & Levels**: Users earn experience points and level up
- **Streaks**: Track consecutive days of activity with freeze protection
- **Achievements**: Unlock badges for milestones
- **Daily Challenges**: Complete tasks for bonus XP
- **Leaderboards**: Compete globally, by city, or by language

## Database Schema

### Tables

1. **user_gamification**: User stats (level, XP, streaks)
2. **achievements**: Master list of all achievements
3. **user_achievements**: Achievements earned by users
4. **daily_challenges**: Available challenges
5. **user_challenges**: User progress on challenges
6. **points_history**: Audit log of XP earned

## XP & Leveling System

### XP Earning Activities

| Activity | XP Earned |
|----------|-----------|
| Send message | +2 XP |
| Chat 10+ minutes | +10 XP |
| Voice call | +25 XP |
| Video call | +50 XP |
| Daily login | +5 XP |
| Complete profile | +20 XP |
| Get 5-star rating | +10 XP |
| 7-day streak | +50 bonus XP |
| 30-day streak | +200 bonus XP |

### Level Progression

- Level 1: 0-100 XP
- Level 2: 100-300 XP (needs 200 more)
- Level 3: 300-600 XP (needs 300 more)
- Level 4: 600-1000 XP (needs 400 more)
- Level 5: 1000-1500 XP (needs 500 more)
- Each level needs +100 XP more than previous
- Max level: 100

### Usage Examples

\`\`\`typescript
import { awardXP, getUserStats, calculateLevelProgress } from '@/lib/supabase/gamification'

// Award XP manually
const result = await awardXP(userId, 50, 'special_event')
if (result?.leveledUp) {
  console.log(`Leveled up to ${result.newLevel}!`)
}

// Get user stats
const stats = await getUserStats(userId)
console.log(`Level ${stats.level} - ${stats.xpPoints} XP`)

// Calculate progress to next level
const progress = calculateLevelProgress(stats.xpPoints, stats.level)
console.log(`${progress}% to next level`)
\`\`\`

## Streak System

### How Streaks Work

- Streak increments when user is active (sends a message)
- Streak breaks if user misses a day
- Streak freeze protects for 1 day (earned at 7-day milestone)
- Bonus XP awarded at milestones (7, 30, 100 days)

### Usage Examples

\`\`\`typescript
import { updateStreak, useStreakFreeze } from '@/lib/supabase/gamification'

// Update streak (call when user is active)
const result = await updateStreak(userId)
if (result?.streakBroken) {
  console.log('Streak was broken!')
} else {
  console.log(`Current streak: ${result.currentStreak} days`)
}

// Use streak freeze
const success = await useStreakFreeze(userId)
if (success) {
  console.log('Streak protected for 1 day!')
}
\`\`\`

## Achievements System

### Achievement Categories

- **Social**: First chat, 100 chats, conversationalist
- **Streak**: 7-day, 30-day, 100-day streaks
- **Language**: Practice 5+ languages, globe trotter
- **Rating**: Get 50 five-star ratings
- **Time**: Early bird (chat before 7am), night owl (after midnight)

### Usage Examples

\`\`\`typescript
import { 
  getAchievements, 
  getUserAchievements, 
  checkAndAwardAchievements 
} from '@/lib/supabase/gamification'

// Get all available achievements
const achievements = await getAchievements()

// Get user's earned achievements
const userAchievements = await getUserAchievements(userId)

// Check and award new achievements
const newAchievements = await checkAndAwardAchievements(userId)
newAchievements.forEach(a => {
  console.log(`Unlocked: ${a.achievementName} (+${a.xpAwarded} XP)`)
})
\`\`\`

## Daily Challenges

### Challenge Types

- **send_messages**: Send X messages
- **chat_duration**: Chat for X minutes
- **meet_new**: Meet someone new
- **post_story**: Post a story
- **get_rating**: Get a 5-star rating
- **practice_language**: Practice a new language

### Usage Examples

\`\`\`typescript
import { 
  generateDailyChallenges, 
  getUserChallenges, 
  updateChallengeProgress 
} from '@/lib/supabase/gamification'

// Generate today's challenges
await generateDailyChallenges(userId)

// Get user's challenges with progress
const challenges = await getUserChallenges(userId)
challenges.forEach(c => {
  console.log(`${c.challenge.name}: ${c.progress}/${c.targetValue}`)
})

// Update challenge progress
const result = await updateChallengeProgress(userId, 'send_messages', 1)
if (result?.challengeCompleted) {
  console.log(`Challenge completed! +${result.xpAwarded} XP`)
}
\`\`\`

## Leaderboards

### Leaderboard Types

- **Global**: All users worldwide
- **City**: Users in the same city
- **Language**: Users learning the same language

### Usage Examples

\`\`\`typescript
import { 
  getUserLeaderboardRank, 
  getLeaderboardTop 
} from '@/lib/supabase/gamification'

// Get user's rank
const rank = await getUserLeaderboardRank(userId, 'global')
console.log(`Rank #${rank.rank} of ${rank.totalUsers}`)

// Get top 100 users
const topUsers = await getLeaderboardTop('global', undefined, 100)
topUsers.forEach(user => {
  console.log(`#${user.rank}: ${user.fullName} - Level ${user.level}`)
})

// Get city leaderboard
const cityTop = await getLeaderboardTop('city', 'New York', 50)

// Get language leaderboard
const langTop = await getLeaderboardTop('language', 'Spanish', 50)
\`\`\`

## Automatic Triggers

The system automatically awards XP for:

1. **Sending messages**: +2 XP per message
2. **Getting 5-star ratings**: +10 XP
3. **Daily login**: +5 XP (once per day)
4. **Streak milestones**: Bonus XP at 7, 30, 100 days

These are handled by database triggers and require no manual code.

## Activity Tracking Helper

For convenience, use the `trackActivity` helper:

\`\`\`typescript
import { trackActivity } from '@/lib/supabase/gamification'

// Track various activities
await trackActivity(userId, 'message', { referenceId: messageId })
await trackActivity(userId, 'voice_call', { duration: 600 })
await trackActivity(userId, 'video_call', { duration: 1200 })
await trackActivity(userId, 'profile_complete')
await trackActivity(userId, 'daily_login')
\`\`\`

## Performance Considerations

The system is optimized for 100k+ users with:

- Indexed queries for fast leaderboard calculations
- Efficient streak updates
- Cached leaderboard views
- Minimal database calls

### Recommended Cron Jobs

Set up these periodic tasks:

1. **Daily at midnight**: Reset daily challenges
2. **Hourly**: Recalculate leaderboards (if using cached tables)
3. **Daily at 11pm**: Send streak reminder notifications

## Best Practices

1. **Call `updateStreak()` once per day** when user is active
2. **Check achievements after major activities** (completing profile, milestones)
3. **Generate daily challenges** when user opens app
4. **Cache leaderboard data** on client for 1 hour
5. **Show XP animations** when users earn points
6. **Notify users** when they level up or unlock achievements

## Testing

\`\`\`sql
-- Award test XP
SELECT * FROM award_xp(
  'user-uuid-here'::uuid, 
  100, 
  'test_activity'
);

-- Check user stats
SELECT * FROM user_gamification WHERE user_id = 'user-uuid-here';

-- View XP history
SELECT * FROM points_history 
WHERE user_id = 'user-uuid-here' 
ORDER BY created_at DESC;

-- Test leaderboard
SELECT * FROM get_leaderboard_top('global', NULL, 10);
\`\`\`

## Troubleshooting

**Issue**: XP not being awarded
- Check if triggers are enabled
- Verify user has gamification record
- Check points_history for errors

**Issue**: Streak not updating
- Ensure `update_user_streak()` is being called
- Check `last_streak_update` date
- Verify timezone settings

**Issue**: Achievements not unlocking
- Run `check_and_award_achievements()` manually
- Verify achievement criteria in database
- Check if achievement is marked as active

## Next Steps

1. Run the SQL script: `scripts/007_gamification_system.sql`
2. Import the TypeScript library in your components
3. Add UI components for displaying stats, achievements, and leaderboards
4. Set up notifications for level-ups and achievements
5. Configure cron jobs for daily resets

Your gamification system is now ready to engage and motivate users!
