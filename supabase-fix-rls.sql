-- Quick Fix for RLS Policy Error
-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy"

-- SOLUTION 1: Disable RLS (Easiest for Development)
-- Recommended for development/testing
ALTER TABLE voice_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs DISABLE ROW LEVEL SECURITY;

-- SOLUTION 2: Keep RLS enabled but allow all operations
-- Uncomment if you prefer to keep RLS on

-- First, enable RLS if not already enabled
-- ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gps_logs ENABLE ROW LEVEL SECURITY;

-- Then, drop existing restrictive policies if any
-- DROP POLICY IF EXISTS "Anyone can insert voice recordings" ON voice_recordings;
-- DROP POLICY IF EXISTS "Anyone can read voice recordings" ON voice_recordings;
-- DROP POLICY IF EXISTS "Anyone can delete voice recordings" ON voice_recordings;
-- DROP POLICY IF EXISTS "Anyone can insert GPS logs" ON gps_logs;
-- DROP POLICY IF EXISTS "Anyone can read GPS logs" ON gps_logs;

-- Create permissive policies that allow everything
-- CREATE POLICY "Allow all operations"
-- ON voice_recordings
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Allow all operations"
-- ON gps_logs
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);

-- Verify RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('voice_recordings', 'gps_logs');

-- View existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('voice_recordings', 'gps_logs');
