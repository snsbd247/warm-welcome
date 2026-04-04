SELECT cron.schedule(
  'bandwidth-collector-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
      url:='https://udxrzqpivtzunnfenmyd.supabase.co/functions/v1/bandwidth-collector',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeHJ6cXBpdnR6dW5uZmVubXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjM3OTAsImV4cCI6MjA4ODUzOTc5MH0.cqupkjIjdIcF-g_WDBtmKpSXqMoL09TVPtWsV5XY0ps"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);