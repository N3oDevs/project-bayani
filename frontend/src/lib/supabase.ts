import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface VoiceRecording {
  id: number
  user_id?: number
  file_url: string
  duration: number
  timestamp: string
  file_name: string
}

export interface GPSLog {
  id: number
  user_id?: number
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
}
