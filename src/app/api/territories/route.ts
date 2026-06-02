import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabase'

export async function GET() {
  const { data: territories, error } = await supabase
    .from('territories')
    .select(`*, winners(id, rank, driver_name, car_name, points, created_at)`)
    .order('id', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort winners by points desc, tampilkan top 3
  const result = territories.map((t: any) => ({
    ...t,
    winners: [...t.winners]
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 3)
      .map((w: any, idx: number) => ({ ...w, rank: idx + 1 }))
  }))

  return NextResponse.json(result)
}