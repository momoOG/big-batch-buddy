-- Keep extensions in public schema (common practice for pg_cron and pg_net)
-- Recreate cron job without schema prefix
SELECT cron.schedule(
  'sync-historical-locks-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://csdzhdzvgtbptoseosov.supabase.co/functions/v1/sync-historical-locks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZHpoZHp2Z3RicHRvc2Vvc292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjY1MzAsImV4cCI6MjA3NjMwMjUzMH0.EHnps8R4YMRmbvH-rgL6AKND0TriBQmEOT3-U8Ru8lM"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
