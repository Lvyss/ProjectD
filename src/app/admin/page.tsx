'use client'

import { useEffect, useState } from 'react'
import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }
type EditingWinner = Winner & { territory_id: number }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [territories, setTerritories] = useState<TerritoryWithWinners[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [search, setSearch] = useState('')
  const [filterTerritory, setFilterTerritory] = useState('')
  const [editingWinner, setEditingWinner] = useState<EditingWinner | null>(null)
  const [form, setForm] = useState({
    territory_id: '',
    driver_name: '',
    car_name: '',
    points: '',
  })

  const fetchTerritories = async () => {
    const res = await fetch('/api/territories')
    const data = await res.json()
    setTerritories(data)
  }

  useEffect(() => {
    if (authed) fetchTerritories()
  }, [authed])

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleLogin = () => {
    if (password.trim()) setAuthed(true)
  }

  const handleSubmitWinner = async () => {
    if (!form.territory_id || !form.driver_name || !form.car_name || !form.points) {
      showMsg('Semua field wajib diisi!', 'error')
      return
    }
    setLoading(true)
    
    // Ambil winner yang sudah ada di territory ini
    const territory = territories.find(t => t.id === parseInt(form.territory_id))
    const existingWinners = territory?.winners || []
    
    // Rank ditentukan berdasarkan poin (otomatis)
    const newPoints = parseInt(form.points)
    let newRank = existingWinners.length + 1
    for (let i = 0; i < existingWinners.length; i++) {
      if (newPoints > existingWinners[i].points) {
        newRank = i + 1
        break
      }
    }
    
    const res = await fetch('/api/winners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        territory_id: parseInt(form.territory_id),
        rank: newRank,
        driver_name: form.driver_name,
        car_name: form.car_name,
        points: newPoints,
      }),
    })
    setLoading(false)
    if (res.ok) {
      showMsg(`Winner berhasil disimpan! (Rank ${newRank} berdasarkan poin)`)
      setForm({ territory_id: '', driver_name: '', car_name: '', points: '' })
      fetchTerritories()
    } else {
      const err = await res.json()
      showMsg(`Error: ${err.error}`, 'error')
    }
  }

  const handleEditSubmit = async () => {
    if (!editingWinner) return
    setLoading(true)
    
    // Re-rank setelah edit poin
    const territory = territories.find(t => t.id === editingWinner.territory_id)
    const otherWinners = territory?.winners.filter(w => w.id !== editingWinner.id) || []
    const newPoints = editingWinner.points
    let newRank = otherWinners.length + 1
    for (let i = 0; i < otherWinners.length; i++) {
      if (newPoints > otherWinners[i].points) {
        newRank = i + 1
        break
      }
    }
    
    const res = await fetch('/api/winners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        id: editingWinner.id,
        driver_name: editingWinner.driver_name,
        car_name: editingWinner.car_name,
        points: editingWinner.points,
        rank: newRank,
        territory_id: editingWinner.territory_id,
      }),
    })
    setLoading(false)
    if (res.ok) {
      showMsg(`Winner berhasil diupdate! (Rank ${newRank} berdasarkan poin)`)
      setEditingWinner(null)
      fetchTerritories()
    } else {
      const err = await res.json()
      showMsg(`Error: ${err.error}`, 'error')
    }
  }

  const handleToggleActive = async (territory: TerritoryWithWinners) => {
    const res = await fetch(`/api/territories/${territory.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, is_active: !territory.is_active }),
    })
    if (res.ok) {
      showMsg(`${territory.name} ${!territory.is_active ? 'diaktifkan' : 'dinonaktifkan'}!`)
      fetchTerritories()
    } else {
      const err = await res.json()
      showMsg(`Error: ${err.error}`, 'error')
    }
  }

  const handleDeleteWinner = async (id: number) => {
    if (!confirm('Hapus winner ini?')) return
    const res = await fetch('/api/winners', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id }),
    })
    if (res.ok) {
      showMsg('Winner dihapus!')
      fetchTerritories()
    }
  }

  // Winners dengan rank otomatis berdasarkan poin
  const allWinners = territories.flatMap(t => {
    const sortedWinners = [...t.winners].sort((a, b) => b.points - a.points)
    return sortedWinners.map((w, idx) => ({
      ...w,
      territory_id: t.id,
      territoryName: t.name,
      territoryColor: t.color,
      autoRank: idx + 1
    }))
  })
  
  const filteredWinners = allWinners.filter(w => {
    const matchSearch = search === '' ||
      w.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      w.car_name.toLowerCase().includes(search.toLowerCase())
    const matchTerritory = filterTerritory === '' || w.territory_id === parseInt(filterTerritory)
    return matchSearch && matchTerritory
  })

  if (!authed) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #020205 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Share Tech Mono', monospace",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');`}</style>
        <div style={{
          background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,51,17,0.3)', padding: '40px 50px',
          width: '380px', textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: '2rem', fontWeight: 900,
            letterSpacing: '0.1em', color: '#fff', marginBottom: '8px',
          }}>PROJECT<span style={{ color: '#ff3311' }}>.</span>D</h1>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>ADMIN ACCESS</p>
          <input
            type="password" placeholder="ENTER PASSWORD" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ ...iS, marginBottom: '12px', textAlign: 'center' }}
          />
          <button onClick={handleLogin} style={bS}>ACCESS →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #020205 100%)',
      fontFamily: "'Share Tech Mono', monospace", color: '#fff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; }
        select option { background: #0a0a0f; }
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '24px', paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <h1 style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: '1.5rem',
            fontWeight: 900, letterSpacing: '0.1em', color: '#fff',
          }}>PROJECT<span style={{ color: '#ff3311' }}>.</span>D
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginLeft: '12px' }}>ADMIN</span>
          </h1>
          <a href="/" style={{
            color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            fontSize: '0.7rem', letterSpacing: '0.2em',
            padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ff3311'; e.currentTarget.style.borderColor = '#ff3311' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
            ← BACK TO MAP
          </a>
        </div>

        {/* Notif */}
        {msg && (
          <div style={{
            padding: '12px 20px', marginBottom: '20px',
            background: msgType === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,17,0.1)',
            borderLeft: `3px solid ${msgType === 'success' ? '#00ff88' : '#ff3311'}`,
            color: msgType === 'success' ? '#00ff88' : '#ff3311',
            fontSize: '0.8rem',
          }}>{msg}</div>
        )}

        {/* Edit Modal */}
        {editingWinner && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
          }}>
            <div style={{
              background: '#0d0d18', border: '1px solid rgba(255,51,17,0.4)',
              padding: '32px', width: '420px',
            }}>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem',
                color: '#ff3311', letterSpacing: '0.2em', marginBottom: '20px',
              }}>EDIT WINNER</h3>

              <label style={labelS}>Territory</label>
              <select
                value={editingWinner.territory_id}
                onChange={e => setEditingWinner({ ...editingWinner, territory_id: parseInt(e.target.value) })}
                style={iS}
              >
                {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <label style={labelS}>Driver Name</label>
              <input
                value={editingWinner.driver_name}
                onChange={e => setEditingWinner({ ...editingWinner, driver_name: e.target.value })}
                style={iS}
              />

              <label style={labelS}>Car Name</label>
              <input
                value={editingWinner.car_name}
                onChange={e => setEditingWinner({ ...editingWinner, car_name: e.target.value })}
                style={iS}
              />

              <label style={labelS}>Points</label>
              <input
                type="number"
                value={editingWinner.points}
                onChange={e => setEditingWinner({ ...editingWinner, points: parseInt(e.target.value) })}
                style={iS}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={handleEditSubmit} disabled={loading} style={{ ...bS, flex: 1 }}>
                  {loading ? 'SAVING...' : 'SAVE →'}
                </button>
                <button
                  onClick={() => setEditingWinner(null)}
                  style={{
                    ...bS, flex: 1,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >CANCEL</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* Form Add Winner */}
          <div style={cardS}>
            <SectionTitle>+ Add Winner</SectionTitle>
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>
              Rank ditentukan otomatis berdasarkan poin tertinggi
            </p>
            <label style={labelS}>Territory</label>
            <select value={form.territory_id} onChange={e => setForm({ ...form, territory_id: e.target.value })} style={iS}>
              <option value="">— Pilih Territory —</option>
              {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label style={labelS}>Driver Name</label>
            <input placeholder="Contoh: Takumi Fujiwara" value={form.driver_name}
              onChange={e => setForm({ ...form, driver_name: e.target.value })} style={iS} />
            <label style={labelS}>Car Name</label>
            <input placeholder="Contoh: Toyota AE86" value={form.car_name}
              onChange={e => setForm({ ...form, car_name: e.target.value })} style={iS} />
            <label style={labelS}>Points</label>
            <input type="number" placeholder="Poin (semakin tinggi semakin baik)" value={form.points}
              onChange={e => setForm({ ...form, points: e.target.value })} style={iS} />
            <button onClick={handleSubmitWinner} disabled={loading} style={{ ...bS, marginTop: '16px' }}>
              {loading ? 'SAVING...' : 'SAVE WINNER →'}
            </button>
          </div>

          {/* Territory Toggle */}
          <div style={cardS}>
            <SectionTitle>⚡ Territory Status</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {territories.map(t => {
                const topWinner = [...t.winners].sort((a,b) => b.points - a.points)[0]
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: 'rgba(0,0,0,0.3)',
                    borderLeft: `3px solid ${t.color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: t.is_active ? '#00ff88' : 'rgba(255,255,255,0.2)',
                        boxShadow: t.is_active ? '0 0 6px #00ff88' : 'none',
                      }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: t.is_active ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                          {t.name}
                        </div>
                        {topWinner && (
                          <div style={{ fontSize: '0.55rem', color: t.color }}>
                            🏆 {topWinner.driver_name} · {topWinner.points}pt
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleToggleActive(t)} style={{
                      fontSize: '0.65rem', padding: '5px 12px', cursor: 'pointer',
                      background: t.is_active ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
                      color: t.is_active ? '#00ff88' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${t.is_active ? '#00ff8844' : 'rgba(255,255,255,0.1)'}`,
                      fontFamily: 'monospace', transition: 'all 0.2s',
                    }}>
                      {t.is_active ? '● ACTIVE' : '○ INACTIVE'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Winners Table dengan Search */}
        <div style={cardS}>
          <SectionTitle>🏆 All Winners (Rank by Points)</SectionTitle>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              placeholder="🔍 Cari driver atau mobil..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...iS, flex: 1, margin: 0 }}
            />
            <select
              value={filterTerritory}
              onChange={e => setFilterTerritory(e.target.value)}
              style={{ ...iS, width: '200px', margin: 0 }}
            >
              <option value="">— Semua Territory —</option>
              {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Rank', 'Territory', 'Driver', 'Car', 'Points', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      color: 'rgba(255,255,255,0.4)', fontWeight: 'normal',
                      letterSpacing: '0.1em', fontSize: '0.65rem',
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredWinners.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: '32px', textAlign: 'center',
                      color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem',
                    }}>— NO DATA —</td>
                  </tr>
                ) : (
                  filteredWinners.map((w: any) => (
                    <tr key={w.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          color: w.autoRank === 1 ? '#FFD700' : w.autoRank === 2 ? '#C0C0C0' : '#CD7F32',
                          fontWeight: 'bold',
                        }}>
                          #{w.autoRank}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          color: w.territoryColor, fontSize: '0.7rem',
                          borderLeft: `2px solid ${w.territoryColor}`,
                          paddingLeft: '8px',
                        }}>{w.territoryName}</span>
                       </td>
                      <td style={{ padding: '10px 12px', color: '#ffffffcc' }}>{w.driver_name}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)' }}>{w.car_name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: w.territoryColor, fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {w.points}pt
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setEditingWinner(w)}
                            style={{
                              padding: '4px 10px', cursor: 'pointer',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem',
                              fontFamily: 'monospace', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                          >EDIT</button>
                          <button
                            onClick={() => handleDeleteWinner(w.id)}
                            style={{
                              padding: '4px 10px', cursor: 'pointer',
                              background: 'rgba(255,51,17,0.1)',
                              border: '1px solid rgba(255,51,17,0.2)',
                              color: '#ff331188', fontSize: '0.65rem',
                              fontFamily: 'monospace', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ff3311'; e.currentTarget.style.borderColor = '#ff3311' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#ff331188'; e.currentTarget.style.borderColor = 'rgba(255,51,17,0.2)' }}
                          >DELETE</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '12px', fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.2)', textAlign: 'right',
          }}>
            {filteredWinners.length} WINNERS FOUND
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ width: '16px', height: '2px', background: '#ff3311' }} />
        <span style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem',
          fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}>{children}</span>
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, #ff331133, transparent)' }} />
    </div>
  )
}

const cardS: React.CSSProperties = {
  background: 'rgba(10,10,20,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.05)',
  padding: '24px',
}

const iS: React.CSSProperties = {
  width: '100%', padding: '10px 12px', marginBottom: '8px',
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff', fontFamily: "'Share Tech Mono', monospace",
  fontSize: '0.75rem', outline: 'none',
  transition: 'border 0.2s',
}

const labelS: React.CSSProperties = {
  fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)',
  letterSpacing: '0.15em', display: 'block', marginBottom: '2px',
  marginTop: '4px',
}

const bS: React.CSSProperties = {
  width: '100%', padding: '11px',
  background: 'linear-gradient(135deg, #ff3311 0%, #cc2200 100%)',
  border: 'none', color: '#fff',
  fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem',
  fontWeight: 'bold', letterSpacing: '0.15em', cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
}