# Analytics & Admin Reporting System

Complete guide for tracking user behavior, engagement metrics, and generating admin dashboard reports.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Event Logging](#event-logging)
4. [Admin Dashboard Queries](#admin-dashboard-queries)
5. [Performance Optimization](#performance-optimization)
6. [Usage Examples](#usage-examples)

## Overview

The analytics system provides comprehensive tracking of:
- User metrics (signups, active users, retention)
- Engagement metrics (messages, practice time, stories)
- Language metrics (popular languages, combinations)
- Location metrics (users per city/country)
- Feature usage (chat, stories, challenges)
- Performance metrics (response times, errors)

## Database Schema

### Tables

#### `analytics_events`
Raw event tracking for all user actions.

\`\`\`sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- event_type: TEXT (e.g., 'signup', 'message_sent')
- event_category: TEXT (e.g., 'auth', 'engagement')
- event_data: JSONB (additional metadata)
- session_id: UUID (link to user session)
- created_at: TIMESTAMPTZ
\`\`\`

#### `user_sessions`
Track user session duration and activity.

\`\`\`sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- started_at: TIMESTAMPTZ
- ended_at: TIMESTAMPTZ
- duration_seconds: INTEGER
- device_type: TEXT ('mobile', 'tablet', 'desktop')
- platform: TEXT ('ios', 'android', 'web')
- events_count: INTEGER
\`\`\`

#### `daily_metrics`
Aggregated daily statistics for fast dashboard queries.

\`\`\`sql
- metric_date: DATE (unique)
- total_users: INTEGER
- new_signups: INTEGER
- daily_active_users: INTEGER
- weekly_active_users: INTEGER
- monthly_active_users: INTEGER
- total_messages: INTEGER
- avg_messages_per_user: NUMERIC
- stories_posted: INTEGER
- avg_session_duration_seconds: INTEGER
\`\`\`

### Materialized Views

#### `mv_user_growth`
User growth over last 30 days with cumulative totals.

#### `mv_top_cities`
Top 100 cities by user count with active user counts.

#### `mv_language_stats`
Language statistics for both native and learning languages.

#### `mv_engagement_summary`
Daily engagement summary for last 30 days.

## Event Logging

### Client-Side (TypeScript)

\`\`\`typescript
import { logEvent, startSession, endSession } from '@/lib/supabase/analytics'

// Start session when app loads
const sessionId = await startSession('mobile', 'ios', '1.0.0')

// Log custom events
await logEvent('button_clicked', 'engagement', { button_name: 'send_message' })

// Use convenience functions
import { trackMessageSent, trackStoryPosted } from '@/lib/supabase/analytics'

await trackMessageSent(conversationId, 'text')
await trackStoryPosted(storyId)

// End session when app closes
await endSession(sessionId)
\`\`\`

### Server-Side (SQL)

Events are automatically logged via triggers for:
- Message sent
- Story posted
- User signup
- Session start/end

## Admin Dashboard Queries

### 1. Real-Time Active Users

\`\`\`typescript
import { getActiveUsersCount } from '@/lib/supabase/analytics'

const activeUsers = await getActiveUsersCount(5) // Last 5 minutes
console.log(`${activeUsers} users active now`)
\`\`\`

### 2. User Growth Chart

\`\`\`typescript
import { getUserGrowth } from '@/lib/supabase/analytics'

const growth = await getUserGrowth()
// Returns: [{ signup_date, new_users, cumulative_users }]
\`\`\`

### 3. Top Cities

\`\`\`typescript
import { getTopCities } from '@/lib/supabase/analytics'

const cities = await getTopCities(10)
// Returns: [{ city, user_count, active_users }]
\`\`\`

### 4. Language Statistics

\`\`\`typescript
import { getLanguageStats } from '@/lib/supabase/analytics'

const learningLanguages = await getLanguageStats('learn')
// Returns: [{ language_code, user_count }]
\`\`\`

### 5. Daily Metrics

\`\`\`typescript
import { getDailyMetrics } from '@/lib/supabase/analytics'

const metrics = await getDailyMetrics(30) // Last 30 days
// Returns: [{ metric_date, daily_active_users, total_messages, ... }]
\`\`\`

### 6. Streak Distribution

\`\`\`typescript
import { getStreakDistribution } from '@/lib/supabase/analytics'

const distribution = await getStreakDistribution()
// Returns: [{ streak_range: '1-7 days', user_count: 150 }]
\`\`\`

### 7. Most Active Users

\`\`\`typescript
import { getMostActiveUsers } from '@/lib/supabase/analytics'

const topUsers = await getMostActiveUsers(30, 10)
// Returns: [{ user_id, full_name, avatar_url, event_count }]
\`\`\`

### 8. User Retention

\`\`\`typescript
import { calculateRetention } from '@/lib/supabase/analytics'

const retention = await calculateRetention('2024-01-01', 7)
// Returns: { cohort_size, retained_users, retention_rate }
\`\`\`

### 9. Growth Rate

\`\`\`typescript
import { getGrowthRate } from '@/lib/supabase/analytics'

const growth = await getGrowthRate(30)
// Returns: { users_at_start, users_at_end, new_users, growth_rate }
\`\`\`

## Performance Optimization

### Materialized Views

Materialized views are refreshed automatically every hour via pg_cron:

\`\`\`sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_growth;
\`\`\`

### Daily Aggregation

Daily metrics are aggregated automatically at 1 AM via pg_cron:

\`\`\`sql
SELECT aggregate_daily_metrics(CURRENT_DATE - 1);
\`\`\`

### Indexes

All tables have optimized indexes for common queries:
- User ID + timestamp for user-specific queries
- Event type + timestamp for event filtering
- Date-based indexes for time-range queries

### Partitioning (Optional)

For very large datasets (millions of events), consider partitioning `analytics_events` by month:

\`\`\`sql
CREATE INDEX idx_analytics_events_created_month 
ON analytics_events(DATE_TRUNC('month', created_at));
\`\`\`

## Usage Examples

### React Hook for Session Management

\`\`\`typescript
import { useEffect } from 'react'
import { startSession, endSession } from '@/lib/supabase/analytics'

export function useAnalyticsSession() {
  useEffect(() => {
    let sessionId: string | null = null

    const initSession = async () => {
      sessionId = await startSession('mobile', 'web', '1.0.0')
    }

    initSession()

    return () => {
      if (sessionId) {
        endSession(sessionId)
      }
    }
  }, [])
}
\`\`\`

### Admin Dashboard Component

\`\`\`typescript
'use client'

import { useEffect, useState } from 'react'
import { 
  getActiveUsersCount, 
  getUserGrowth, 
  getDailyMetrics 
} from '@/lib/supabase/analytics'

export function AdminDashboard() {
  const [activeUsers, setActiveUsers] = useState(0)
  const [growth, setGrowth] = useState([])
  const [metrics, setMetrics] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const [users, growthData, metricsData] = await Promise.all([
        getActiveUsersCount(5),
        getUserGrowth(),
        getDailyMetrics(30)
      ])
      
      setActiveUsers(users)
      setGrowth(growthData)
      setMetrics(metricsData)
    }

    loadData()
    
    // Refresh every minute
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>Active Users: {activeUsers}</div>
      {/* Render charts with growth and metrics data */}
    </div>
  )
}
\`\`\`

### Event Tracking in Components

\`\`\`typescript
'use client'

import { trackMessageSent } from '@/lib/supabase/analytics'

export function ChatInput({ conversationId }) {
  const handleSend = async (message: string) => {
    // Send message to database
    await sendMessage(conversationId, message)
    
    // Track analytics event
    await trackMessageSent(conversationId, 'text')
  }

  return <input onSubmit={handleSend} />
}
\`\`\`

## Best Practices

1. **Batch Events**: For high-frequency events, consider batching to reduce database load
2. **Async Logging**: Always log events asynchronously to avoid blocking UI
3. **Error Handling**: Wrap analytics calls in try-catch to prevent app crashes
4. **Privacy**: Never log sensitive data (passwords, tokens, etc.)
5. **Sampling**: For very high-traffic apps, consider sampling events (e.g., 10% of users)
6. **Cleanup**: Old events are automatically cleaned up after 90 days (configurable)

## Troubleshooting

### Events Not Appearing

1. Check RLS policies - ensure user has permission
2. Verify session is active
3. Check browser console for errors
4. Verify Supabase connection

### Slow Queries

1. Check if materialized views need refresh
2. Verify indexes are being used (EXPLAIN ANALYZE)
3. Consider adding more specific indexes
4. Check if daily aggregation is running

### Missing Data

1. Verify pg_cron jobs are running
2. Check daily_metrics table for gaps
3. Manually run aggregation: `SELECT aggregate_daily_metrics('2024-01-01')`

## Security

- All analytics tables have RLS enabled
- Only admins can view full analytics
- Users can only view their own events
- Sensitive data is never logged
- IP addresses are hashed for privacy

## Conclusion

This analytics system provides comprehensive tracking and reporting for your language exchange app. It's optimized for performance with 100k+ users and millions of events, using materialized views, daily aggregation, and efficient indexes.

For questions or issues, refer to the Supabase documentation or contact support.
