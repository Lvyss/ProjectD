import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Territory = {
  id: number
  name: string
  slug: string
  color: string
  is_active: boolean
  created_at: string
}

export type Winner = {
  id: number
  territory_id: number
  rank: number
  driver_name: string
  car_name: string
  points: number
  created_at: string
}