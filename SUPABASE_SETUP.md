# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `project-bayani`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
5. Wait for project creation (~2 minutes)

## 2. Get API Credentials

1. Go to Project Settings > API
2. Copy these values to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

## 3. Create Database Tables

Go to SQL Editor and run:

```sql
-- Voice recordings table
CREATE TABLE voice_recordings (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- GPS logs table
CREATE TABLE gps_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_voice_recordings_timestamp ON voice_recordings(timestamp DESC);
CREATE INDEX idx_gps_logs_timestamp ON gps_logs(timestamp DESC);
```

## 4. Create Storage Bucket

1. Go to Storage section
2. Click "New Bucket"
3. Name: `voice-recordings`
4. Make it **Public** (for easy playback)
5. Click "Create Bucket"

## 5. Set Storage Policies

**EASIEST METHOD: Use Supabase UI Templates**

1. Go to **Storage > voice-recordings > Policies**
2. Click **"New Policy"**
3. Select **"Allow public read access"** template → Apply
4. Click **"New Policy"** again
5. Select **"Allow public insert access"** template → Apply
6. Click **"New Policy"** again
7. Select **"Allow public delete access"** template → Apply

**OR Create Custom Policies via SQL:**

Go to **SQL Editor** and run:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'voice-recordings' );

-- Allow public insert access
CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'voice-recordings' );

-- Allow public delete access
CREATE POLICY "Anyone can delete"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'voice-recordings' );
```

**Note:** If you still get syntax errors, just use the UI templates - they're pre-configured and error-free!

## 6. Configure Row Level Security

**OPTION A: Disable RLS (Easiest for Development)**

Go to **Database > Tables > voice_recordings > RLS disabled** toggle
Or run in SQL Editor:

```sql
ALTER TABLE voice_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs DISABLE ROW LEVEL SECURITY;
```

**OPTION B: Keep RLS Enabled with Permissive Policy (Via UI)**

If using the Supabase UI to add policy (as shown in your screenshot):

1. Go to **Authentication > Policies > voice_recordings**
2. Click **"New Policy"** → **"Create a policy"**
3. Fill in the form:
   - **Policy name**: `Allow all operations`
   - **Allowed operation**: Check **ALL** boxes (SELECT, INSERT, UPDATE, DELETE)
   - **Target roles**: Keep default "public"
   - **Policy definition**: Enter `true` (this allows everything)
   - **WITH CHECK expression**: Enter `true`
4. Click **"Review"** then **"Save policy"**
5. Repeat for `gps_logs` table

**OPTION C: Add Policy via SQL (Recommended)**

```sql
-- Enable RLS if not already enabled
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs ENABLE ROW LEVEL SECURITY;

-- Add permissive policies that allow all operations
CREATE POLICY "Allow all operations"
ON voice_recordings
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations"
ON gps_logs
FOR ALL
USING (true)
WITH CHECK (true);
```

**For Production:** Implement proper authentication and user-specific policies:
```sql
-- Example: Only allow authenticated users
CREATE POLICY "Authenticated users only"
ON voice_recordings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

## 7. Test Connection

In your frontend:

```bash
cd frontend
npm install @supabase/supabase-js
npm run dev
```

Test voice recording feature to verify everything works!

## 8. Monitor Usage

- Go to Database > Tables to see recorded data
- Go to Storage > voice-recordings to see audio files
- Go to Database > Table Editor to browse records

## Troubleshooting

### Error: "new row violates row-level security policy"
**This is the most common issue!**

**Quick Fix via UI:**
1. Go to **Authentication > Policies > voice_recordings**
2. Click **"New Policy"**
3. Policy name: `Allow all operations`
4. Check **ALL** operation boxes (SELECT, INSERT, UPDATE, DELETE)
5. Policy definition: Type `true`
6. Click **"Review"** → **"Save policy"**
7. Repeat for `gps_logs` table

**OR via SQL (Faster):**
```sql
-- Solution 1: Disable RLS completely (easiest)
ALTER TABLE voice_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs DISABLE ROW LEVEL SECURITY;

-- Solution 2: Keep RLS but allow all operations
CREATE POLICY "Allow all" ON voice_recordings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON gps_logs FOR ALL USING (true) WITH CHECK (true);
```

**Verify it worked:**
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('voice_recordings', 'gps_logs');

-- View policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('voice_recordings', 'gps_logs');
```

### Error: "Failed to upload" or Storage Policy Syntax Errors

**If you get CREATE POLICY syntax errors:**
- Use the **UI policy templates** instead of custom SQL
- Go to Storage > voice-recordings > Policies > New Policy
- Select templates: "Allow public read", "Allow public insert", "Allow public delete"

**Other upload issues:**
- Check bucket name is exactly `voice-recordings`
- Verify bucket is **Public** (toggle in bucket settings)
- Ensure at least the "insert" and "select" policies exist
- Check browser console for detailed error messages

### Error: "Database insert failed"
- Verify tables are created (check Database > Tables)
- **Disable RLS or add proper policies** (see above)
- Check column names match exactly
- View logs in Supabase Dashboard > Logs

### Audio won't play
- Ensure bucket is public
- Check file URL is accessible
- Verify CORS settings in Storage

## Security Notes

For production:
1. Implement proper authentication
2. Add user_id tracking
3. Set file size limits
4. Add rate limiting
5. Use private buckets with signed URLs
6. Implement proper RLS policies

## Cost Optimization

Free tier includes:
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth

To optimize:
- Delete old recordings
- Compress audio files
- Use shorter recording durations
- Monitor usage in dashboard
