'use client'

import { useEffect, useState } from 'react'
import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [territories, setTerritories] = useState<TerritoryWithWinners[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [form, setForm] = useState({
    territory_id: '',
    rank: '1',
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

  const handleLogin = () => {
    if (password.trim()) setAuthed(true)
  }

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleSubmitWinner = async () => {
    if (!form.territory_id || !form.driver_name || !form.car_name || !form.points) {
      showMsg('❌ Semua field wajib diisi!', 'error')
      return
    }
    setLoading(true)
    const res = await fetch('/api/winners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        territory_id: parseInt(form.territory_id),
        rank: parseInt(form.rank),
        driver_name: form.driver_name,
        car_name: form.car_name,
        points: parseInt(form.points),
      }),
    })
    setLoading(false)
    if (res.ok) {
      showMsg('✅ Winner berhasil disimpan!', 'success')
      setForm({ territory_id: '', rank: '1', driver_name: '', car_name: '', points: '' })
      fetchTerritories()
    } else {
      const err = await res.json()
      showMsg(`❌ Error: ${err.error}`, 'error')
    }
  }

  const handleToggleActive = async (territory: TerritoryWithWinners) => {
    const res = await fetch(`/api/territories/${territory.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, is_active: !territory.is_active }),
    })
    if (res.ok) {
      showMsg(`✅ ${territory.name} ${!territory.is_active ? 'diaktifkan' : 'dinonaktifkan'}!`, 'success')
      fetchTerritories()
    }
  }

  const handleDeleteWinner = async (id: number) => {
    const res = await fetch('/api/winners', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id }),
    })
    if (res.ok) {
      showMsg('✅ Winner dihapus!', 'success')
      fetchTerritories()
    }
  }

  if (!authed) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #020205 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Share Tech Mono', monospace",
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background scanline */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px)',
          pointerEvents: 'none',
        }} />
        
        {/* Login box */}
        <div style={{
          background: 'rgba(10,10,20,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,51,17,0.3)',
          padding: '40px 50px',
          width: '380px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(255,51,17,0.1)',
        }}>
          {/* Title */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, #ffffff 0%, #ff3311 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}>
              PROJECT<span style={{ color: '#ff3311' }}>.</span>D
            </h1>
            <div style={{
              width: '50px',
              height: '2px',
              background: '#ff3311',
              margin: '10px auto',
            }} />
            <p style={{
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}>Admin Access</p>
          </div>

          {/* Input password */}
          <input
            type="password"
            placeholder="ENTER PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.9rem',
              textAlign: 'center',
              letterSpacing: '0.1em',
              marginBottom: '20px',
              outline: 'none',
              transition: 'all 0.3s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff3311'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #ff3311 0%, #cc2200 100%)',
              border: 'none',
              color: '#fff',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 'bold',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 5px 20px rgba(255,51,17,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            ACCESS →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #020205 100%)',
      fontFamily: "'Share Tech Mono', monospace",
      position: 'relative',
    }}>
      {/* Background scanline */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, #ffffff 0%, #ff3311 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              PROJECT<span style={{ color: '#ff3311' }}>.</span>D
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.3)',
                marginLeft: '12px',
                letterSpacing: '0.1em',
              }}>ADMIN PANEL</span>
            </h1>
          </div>
          <a href="/" style={{
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ff3311'
            e.currentTarget.style.borderColor = '#ff3311'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}>
            ← BACK TO MAP
          </a>
        </div>

        {/* Message notification */}
        {msg && (
          <div style={{
            padding: '12px 20px',
            marginBottom: '20px',
            background: msgType === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,17,0.1)',
            borderLeft: `3px solid ${msgType === 'success' ? '#00ff88' : '#ff3311'}`,
            color: msgType === 'success' ? '#00ff88' : '#ff3311',
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
          }}>
            {msg}
          </div>
        )}

        {/* Two column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}>
          
          {/* LEFT: Add Winner Form */}
          <div style={{
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '20px', height: '2px', background: '#ff3311' }} />
                <h2 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                }}>Add / Update Winner</h2>
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, #ff331155, transparent)' }} />
            </div>

            <select
              value={form.territory_id}
              onChange={(e) => setForm({ ...form, territory_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">— SELECT TERRITORY —</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              value={form.rank}
              onChange={(e) => setForm({ ...form, rank: e.target.value })}
              style={inputStyle}
            >
              <option value="1">🥇 RANK 1</option>
              <option value="2">🥈 RANK 2</option>
              <option value="3">🥉 RANK 3</option>
            </select>

            <input
              placeholder="DRIVER NAME"
              value={form.driver_name}
              onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="CAR NAME"
              value={form.car_name}
              onChange={(e) => setForm({ ...form, car_name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="POINTS"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              style={inputStyle}
            />

            <button
              onClick={handleSubmitWinner}
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {loading ? 'SAVING...' : 'SAVE WINNER →'}
            </button>
          </div>

          {/* RIGHT: Territory Status */}
          <div style={{
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '20px', height: '2px', background: '#ff3311' }} />
                <h2 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                }}>Territory Control</h2>
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, #ff331155, transparent)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {territories.map((t) => (
                <div key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderLeft: `3px solid ${t.color}`,
                  }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: t.is_active ? '#fff' : 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.05em',
                  }}>{t.name}</span>
                  <button
                    onClick={() => handleToggleActive(t)}
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      padding: '6px 14px',
                      background: t.is_active ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
                      color: t.is_active ? '#00ff88' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${t.is_active ? '#00ff8844' : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {t.is_active ? '● ACTIVE' : '○ INACTIVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM: Current Winners List */}
        <div style={{
          background: 'rgba(10,10,20,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '24px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '20px', height: '2px', background: '#ff3311' }} />
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
              }}>Current Winners</h2>
            </div>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #ff331155, transparent)' }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {territories.map((t) => (
              <div key={t.id} style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
              }}>
                <p style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: t.color,
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                  borderBottom: `1px solid ${t.color}33`,
                  paddingBottom: '4px',
                }}>{t.name.toUpperCase()}</p>
                {t.winners.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>— NO DATA —</p>
                ) : (
                  [...t.winners].sort((a, b) => a.rank - b.rank).map((w) => (
                    <div key={w.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      fontSize: '0.7rem',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <span>
                        <span style={{ color: t.color, fontWeight: 'bold' }}>#{w.rank}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '8px' }}>{w.driver_name}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: t.color }}>{w.points}pt</span>
                        <button
                          onClick={() => handleDeleteWinner(w.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,51,17,0.5)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ff3311'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,51,17,0.5)'}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  margin: '8px 0',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '0.75rem',
  outline: 'none',
  transition: 'all 0.3s',
}

const buttonStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '12px',
  background: 'linear-gradient(135deg, #ff3311 0%, #cc2200 100%)',
  border: 'none',
  color: '#fff',
  fontFamily: "'Orbitron', sans-serif",
  fontSize: '0.7rem',
  fontWeight: 'bold',
  letterSpacing: '0.15em',
  cursor: 'pointer',
  transition: 'all 0.3s',
}