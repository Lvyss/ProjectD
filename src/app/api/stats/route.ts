import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabase'

export async function GET() {
  try {
    // Ambil semua winners dengan join ke territories
    const { data: winners, error } = await supabase
      .from('winners')
      .select(`
        *,
        territories (name, color)
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // STREET RANK: semua driver unik dengan total points
    const driverMap = new Map()
    for (const w of winners) {
      const existing = driverMap.get(w.driver_name)
      if (existing) {
        existing.total_points += w.points
        existing.wins += 1
      } else {
        driverMap.set(w.driver_name, {
          driver_name: w.driver_name,
          total_points: w.points,
          wins: 1,
          best_car: w.car_name,
        })
      }
    }
    const streetRank = Array.from(driverMap.values())
      .sort((a, b) => b.total_points - a.total_points)

    // RANK BY CAR: group by car, ambil driver dengan poin tertinggi per mobil
    const carMap = new Map()
    for (const w of winners) {
      const existing = carMap.get(w.car_name)
      if (!existing || w.points > existing.points) {
        carMap.set(w.car_name, {
          car_name: w.car_name,
          driver_name: w.driver_name,
          points: w.points,
          territory: w.territories?.name || '-',
        })
      }
    }
    const rankByCar = Array.from(carMap.values())
      .sort((a, b) => b.points - a.points)

    return NextResponse.json({ streetRank, rankByCar })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}