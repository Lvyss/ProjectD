import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabase'

// PASSWORD SAMA KAYA YANG DI ADMIN PAGE
const ADMIN_PASSWORD = 'walleyasu'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, territory_id, driver_name, car_name, points } = body

    // Validasi password
    if (password !== ADMIN_PASSWORD) {
      console.log('Password mismatch: expected', ADMIN_PASSWORD, 'got', password)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil semua winner di territory ini
    const { data: existingWinners, error: fetchError } = await supabase
      .from('winners')
      .select('*')
      .eq('territory_id', territory_id)
      .order('points', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Hitung rank berdasarkan poin
    let newRank = existingWinners.length + 1
    for (let i = 0; i < existingWinners.length; i++) {
      if (points > existingWinners[i].points) {
        newRank = i + 1
        break
      }
    }

    // Insert winner baru
    const { data, error } = await supabase
      .from('winners')
      .insert([{ 
        territory_id, 
        rank: newRank,
        driver_name, 
        car_name, 
        points 
      }])
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update rank untuk winner yang tergeser
    if (newRank <= existingWinners.length) {
      for (let i = newRank - 1; i < existingWinners.length; i++) {
        await supabase
          .from('winners')
          .update({ rank: i + 2 })
          .eq('id', existingWinners[i].id)
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, id, territory_id, driver_name, car_name, points } = body

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update winner
    const { data, error } = await supabase
      .from('winners')
      .update({ driver_name, car_name, points })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Re-rank semua winner di territory ini
    const { data: allWinners } = await supabase
      .from('winners')
      .select('*')
      .eq('territory_id', territory_id)
      .order('points', { ascending: false })

    if (allWinners) {
      let currentRank = 1
      for (const w of allWinners) {
        await supabase
          .from('winners')
          .update({ rank: currentRank })
          .eq('id', w.id)
        currentRank++
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, id } = body

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil winner yang akan dihapus
    const { data: winnerToDelete, error: getError } = await supabase
      .from('winners')
      .select('*')
      .eq('id', id)
      .single()

    if (getError) {
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    // Hapus winner
    const { error } = await supabase
      .from('winners')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Re-rank winner yang tersisa
    const { data: remainingWinners } = await supabase
      .from('winners')
      .select('*')
      .eq('territory_id', winnerToDelete.territory_id)
      .order('points', { ascending: false })

    if (remainingWinners) {
      let newRank = 1
      for (const w of remainingWinners) {
        await supabase
          .from('winners')
          .update({ rank: newRank })
          .eq('id', w.id)
        newRank++
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}