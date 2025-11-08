SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = tablename
    ) THEN '✅ Enabled'
    ELSE '❌ Not Enabled'
  END as realtime_status
FROM (
  VALUES 
    ('messages'),
    ('conversations'),
    ('users'),
    ('notifications')
) AS t(tablename);

