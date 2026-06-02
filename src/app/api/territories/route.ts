import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabase'

export async function GET() {
  const { data: territories, error } = await supabase
    .from('territories')
    .select(`
      *,
      winners (
        id,
        rank,
        driver_name,
        car_name,
        points
      )
    `)
    .order('id', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Urutkan winners berdasarkan rank di setiap territory
  const sortedTerritories = territories?.map(territory => ({
    ...territory,
    winners: territory.winners?.sort((a: any, b: any) => a.rank - b.rank) || []
  }))

  return NextResponse.json(sortedTerritories)
}