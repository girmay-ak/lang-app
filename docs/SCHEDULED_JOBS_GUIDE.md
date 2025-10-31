# Scheduled Jobs System Guide

Complete guide for managing automated tasks in your language exchange app using pg_cron.

## Overview

The scheduled jobs system automates critical tasks like:
- Daily challenge resets
- Streak management
- Story cleanup
- Metrics calculation
- Notification sending
- Leaderboard updates
- Data maintenance

## Setup Instructions

### 1. Enable pg_cron in Supabase

**Via Supabase Dashboard:**
1. Go to your project dashboard
2. Navigate to Database → Extensions
3. Search for "pg_cron"
4. Click "Enable" on pg_cron extension

**Via SQL:**
\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
\`\`\`

### 2. Run the Setup Script

Execute the scheduled jobs script:
\`\`\`sql
-- Run scripts/013_scheduled_jobs_system.sql
\`\`\`

This will:
- Create the `cron_job_logs` table for monitoring
- Create all scheduled functions
- Schedule all jobs with appropriate intervals

### 3. Verify Jobs are Scheduled

\`\`\`sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- You should see jobs like:
-- reset-daily-challenges (0 0 * * *)
-- update-user-streaks (0 0 * * *)
-- cleanup-expired-stories (0 * * * *)
-- etc.
\`\`\`

## Job Schedule

### Daily Jobs (Midnight UTC)

| Job | Schedule | Function | Description |
|-----|----------|----------|-------------|
| Reset Challenges | `0 0 * * *` | `reset_daily_challenges()` | Archive old challenges, activate new ones |
| Update Streaks | `0 0 * * *` | `update_user_streaks()` | Increment/break user streaks |
| Calculate Metrics | `0 1 * * *` | `calculate_daily_metrics()` | Aggregate yesterday's statistics |
| Send Reminders | `0 18 * * *` | `send_daily_reminders()` | Remind users about streaks |

### Hourly Jobs

| Job | Schedule | Function | Description |
|-----|----------|----------|-------------|
| Cleanup Stories | `0 * * * *` | `cleanup_expired_stories()` | Delete 24h+ old stories |
| Update Leaderboards | `0 * * * *` | `update_leaderboards()` | Refresh leaderboard views |
| Cleanup Sessions | `*/15 * * * *` | `cleanup_expired_sessions()` | Clear typing indicators |
| Process Moderation | `0 * * * *` | `process_moderation_queue()` | Auto-ban reported users |

### Weekly Jobs (Sunday Midnight)

| Job | Schedule | Function | Description |
|-----|----------|----------|-------------|
| Weekly Reports | `0 0 * * 0` | `send_weekly_reports()` | Send activity summaries |

### Monthly Jobs (1st of Month)

| Job | Schedule | Function | Description |
|-----|----------|----------|-------------|
| Cleanup Accounts | `0 2 1 * *` | `cleanup_inactive_accounts()` | Mark inactive users |
| DB Maintenance | `0 3 1 * *` | `database_maintenance()` | Vacuum and optimize |

## Monitoring Jobs

### View Recent Job Executions

\`\`\`sql
-- Last 100 job runs
SELECT * FROM v_recent_cron_jobs;

-- Failed jobs only
SELECT * FROM cron_job_logs
WHERE status = 'failed'
ORDER BY started_at DESC;
\`\`\`

### View Job Statistics

\`\`\`sql
-- Success rate and performance
SELECT * FROM v_cron_job_stats;

-- Example output:
-- job_name                  | total_runs | successful_runs | failed_runs | avg_execution_time_ms | last_run_at
-- reset-daily-challenges    | 30         | 30              | 0           | 245.50                | 2025-01-15 00:00:00
-- update-user-streaks       | 30         | 29              | 1           | 1823.75               | 2025-01-15 00:00:00
\`\`\`

### Check Job Errors

\`\`\`sql
-- View error details
SELECT 
  job_name,
  started_at,
  error_message,
  metadata
FROM cron_job_logs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
\`\`\`

## Testing Jobs Manually

You can test any job by calling its function directly:

\`\`\`sql
-- Test daily challenge reset
SELECT reset_daily_challenges();

-- Test streak update
SELECT update_user_streaks();

-- Test story cleanup
SELECT cleanup_expired_stories();

-- Check the logs
SELECT * FROM cron_job_logs
WHERE job_name = 'reset_daily_challenges'
ORDER BY started_at DESC
LIMIT 1;
\`\`\`

## Managing Jobs

### Pause a Job

\`\`\`sql
-- Unschedule a job
SELECT cron.unschedule('reset-daily-challenges');
\`\`\`

### Resume a Job

\`\`\`sql
-- Reschedule the job
SELECT cron.schedule(
  'reset-daily-challenges',
  '0 0 * * *',
  'SELECT reset_daily_challenges()'
);
\`\`\`

### Change Job Schedule

\`\`\`sql
-- Unschedule old
SELECT cron.unschedule('send-daily-reminders');

-- Schedule with new time (e.g., 8 PM instead of 6 PM)
SELECT cron.schedule(
  'send-daily-reminders',
  '0 20 * * *',
  'SELECT send_daily_reminders()'
);
\`\`\`

### View All Scheduled Jobs

\`\`\`sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
ORDER BY jobname;
\`\`\`

## Cron Schedule Syntax

\`\`\`
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
\`\`\`

**Examples:**
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 2 1 * *` - Monthly on 1st at 2 AM

## Performance Optimization

### Execution Time Estimates

| Job | Expected Time | Notes |
|-----|---------------|-------|
| Reset Challenges | < 1 second | Minimal data |
| Update Streaks | 1-5 seconds | Depends on active users |
| Cleanup Stories | < 1 second | Usually few expired stories |
| Calculate Metrics | 2-10 seconds | Aggregates large datasets |
| Update Leaderboards | 5-30 seconds | Refreshes materialized views |
| Weekly Reports | 10-60 seconds | Sends many notifications |

### Resource Considerations

1. **Peak Times**: Schedule heavy jobs during low-traffic hours (2-4 AM UTC)
2. **Dependencies**: Some jobs depend on others (e.g., metrics need yesterday's data)
3. **Concurrency**: pg_cron runs jobs sequentially, not in parallel
4. **Timeouts**: Jobs have a default 60-second timeout

### Optimization Tips

\`\`\`sql
-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_last_active 
ON users(last_active_at) WHERE account_status = 'active';

CREATE INDEX IF NOT EXISTS idx_messages_created 
ON messages(created_at) WHERE is_deleted = false;

-- Use CONCURRENTLY for materialized view refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_leaderboard;
\`\`\`

## Troubleshooting

### Job Not Running

1. Check if job is scheduled:
\`\`\`sql
SELECT * FROM cron.job WHERE jobname = 'your-job-name';
\`\`\`

2. Check if job is active:
\`\`\`sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'your-job-name';
\`\`\`

3. Check Supabase logs for errors

### Job Failing

1. Check error logs:
\`\`\`sql
SELECT * FROM cron_job_logs
WHERE job_name = 'your-job-name' AND status = 'failed'
ORDER BY started_at DESC;
\`\`\`

2. Test function manually:
\`\`\`sql
SELECT your_function_name();
\`\`\`

3. Check for missing tables/columns:
\`\`\`sql
-- Verify table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'your_table'
);
\`\`\`

### Job Taking Too Long

1. Check execution times:
\`\`\`sql
SELECT 
  job_name,
  AVG(execution_time_ms) as avg_ms,
  MAX(execution_time_ms) as max_ms
FROM cron_job_logs
WHERE started_at >= CURRENT_DATE - 7
GROUP BY job_name
ORDER BY avg_ms DESC;
\`\`\`

2. Add indexes to speed up queries
3. Consider breaking large jobs into smaller chunks
4. Use `LIMIT` in loops to process data in batches

## Rollback Procedures

### If a Job Causes Issues

1. **Immediately pause the job:**
\`\`\`sql
SELECT cron.unschedule('problematic-job-name');
\`\`\`

2. **Check what changed:**
\`\`\`sql
SELECT * FROM cron_job_logs
WHERE job_name = 'problematic-job-name'
ORDER BY started_at DESC
LIMIT 1;
\`\`\`

3. **Rollback data if needed:**
\`\`\`sql
-- Example: Restore broken streaks
UPDATE user_gamification
SET current_streak = previous_streak_value
WHERE updated_at >= 'timestamp-of-job-run';
\`\`\`

4. **Fix the function and reschedule:**
\`\`\`sql
-- Fix the function
CREATE OR REPLACE FUNCTION problematic_function() ...

-- Reschedule
SELECT cron.schedule('job-name', 'schedule', 'SELECT function()');
\`\`\`

## Best Practices

1. **Always log job execution** - Use the cron_job_logs table
2. **Handle errors gracefully** - Use EXCEPTION blocks
3. **Test manually first** - Call functions directly before scheduling
4. **Monitor regularly** - Check v_cron_job_stats weekly
5. **Keep jobs idempotent** - Safe to run multiple times
6. **Use transactions** - Wrap operations in BEGIN/COMMIT
7. **Set timeouts** - Prevent long-running jobs from blocking
8. **Clean up logs** - Delete old logs monthly

## Support

If you encounter issues:
1. Check the logs: `SELECT * FROM v_recent_cron_jobs;`
2. Test manually: `SELECT your_function();`
3. Review Supabase dashboard logs
4. Check pg_cron documentation: https://github.com/citusdata/pg_cron

## Summary

Your scheduled jobs system is now set up and running! Jobs will execute automatically according to their schedules. Monitor the `cron_job_logs` table regularly to ensure everything is working smoothly.
