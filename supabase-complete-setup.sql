-- Supabase Database Setup & Verification Script
-- Run this in Supabase SQL Editor to set up everything at once

-- ============================================
-- STEP 1: Create Tables (if not exist)
-- ============================================

CREATE TABLE IF NOT EXISTS voice_recordings (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gps_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create Indexes (if not exist)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_voice_recordings_timestamp 
ON voice_recordings(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp 
ON gps_logs(timestamp DESC);

-- ============================================
-- STEP 3: Disable RLS (Easiest for Development)
-- ============================================

ALTER TABLE voice_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Verify Setup
-- ============================================

-- Check if tables exist
SELECT tablename, schemaname 
FROM pg_tables 
WHERE tablename IN ('voice_recordings', 'gps_logs')
ORDER BY tablename;

-- Check RLS status (should show 'f' for false = disabled)
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('voice_recordings', 'gps_logs')
ORDER BY tablename;

-- Check if there are any policies (should be empty if RLS disabled)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('voice_recordings', 'gps_logs')
ORDER BY tablename;

-- Count existing records
SELECT 'voice_recordings' as table_name, COUNT(*) as count FROM voice_recordings
UNION ALL
SELECT 'gps_logs' as table_name, COUNT(*) as count FROM gps_logs;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Setup complete! Tables created, RLS disabled, ready to use.' as status;
