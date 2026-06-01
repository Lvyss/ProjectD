'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, Territory, Winner } from '@/src/lib/supabase'
import SaMap from '@/src/components/SaMap'
import TerritoryPopup from '@/src/components/TerritoryPopup'

type TerritoryWithWinners = Territory & { winners: Winner[] }

export default function Home() {
  const [territories, setTerritories] = useState<TerritoryWithWinners[]>([])
  const [selected, setSelected] = useState<TerritoryWithWinners | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  const fetchTerritories = async () => {
    const res = await fetch('/api/territories')
    const data = await res.json()
    setTerritories(data)
  }

  useEffect(() => {
    fetchTerritories()
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territories' }, fetchTerritories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'winners' }, fetchTerritories)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (selected) {
      const updated = territories.find((t) => t.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [territories, selected])

  const handleSelectTerritory = (
    territory: TerritoryWithWinners | null,
    event?: React.MouseEvent
  ) => {
    setSelected(territory)
    if (territory && event && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect()
      const x = Math.min(event.clientX - rect.left + 20, rect.width - 320)
      const y = Math.min(event.clientY - rect.top - 30, rect.height - 300)
      setPopupPos({ x: Math.max(10, x), y: Math.max(10, y) })
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* BACKGROUND IMAGE DENGAN BLUR */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("/bg.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(5px) brightness(0.6)',
        transform: 'scale(1.05)',
        zIndex: 0,
      }} />
      
      {/* OVERLAY GELAP AGAR TEKS JELAS */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        zIndex: 1,
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;800;900&family=Share+Tech+Mono&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; background: #000; }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #ff331155; }
      `}</style>

      {/* SCANLINE EFFECT */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)',
      }} />

      {/* MAIN CONTAINER */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 10,
        padding: '20px 28px 28px 28px',
      }}>

        {/* ========== HEADER ========== */}
<div style={{
  textAlign: 'center',
  flexShrink: 0,
  height: '20%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}}>
  <img 
    src="/logo.png" 
    alt="PROJECT.D"
    style={{
      maxWidth: '90%',
      height: 'auto',
      maxHeight: '120px',
      objectFit: 'contain',
    }}
  />
</div>

        {/* ========== BODY: RATIO 40:60 ========== */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '28px',
          minHeight: 0,
        }}>

{/* ========== LEFT SIDEBAR - 45% DENGAN TEKS PUTIH MENYALA ========== */}
<div style={{
  width: '45%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingLeft: '15%',
  paddingRight: '50px',
  paddingTop: '50px',
  paddingBottom: '35px',
}}>
  

  {/* List territory */}
  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
    {territories.map((territory, idx) => {
      const topWinner = territory.winners.find(w => w.rank === 1)
      const isActive = territory.is_active
      
      return (
        <div
          key={territory.id}
          onClick={() => handleSelectTerritory(
            selected?.id === territory.id ? null : territory
          )}
          style={{
            padding: '12px 0px 12px 0px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Baris utama: 01_ NAMA dengan efek glow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              {/* Nomor dengan efek glow */}
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                textShadow: isActive ? '0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.5)' : 'none',
              }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              
              {/* Garis miring separator */}
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.8rem',
                color: '#ff3311',
                fontWeight: 'bold',
              }}>/</span>
              
              {/* Nama territory dengan efek glow putih */}
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                textShadow: isActive ? '0 0 5px rgba(255,255,255,0.6), 0 0 10px rgba(255,255,255,0.3)' : 'none',
              }}>
                {territory.name.toUpperCase()}
              </span>
            </div>
            
            {isActive && (
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00ff88',
                boxShadow: '0 0 8px #00ff88, 0 0 12px #00ff88',
              }} />
            )}
          </div>
          
          {/* Winner data atau NO DATA */}
          {topWinner ? (
            <div style={{ paddingLeft: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.7rem',
                  color: territory.color,
                  textShadow: `0 0 4px ${territory.color}`,
                }}>▶</span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '0 0 3px rgba(255,255,255,0.5)',
                }}>
                  {topWinner.driver_name}
                </span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  {topWinner.car_name}
                </span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: territory.color,
                  marginLeft: 'auto',
                  textShadow: `0 0 4px ${territory.color}`,
                }}>
                  {topWinner.points}pt
                </span>
              </div>
            </div>
          ) : (
            <div style={{ paddingLeft: '32px' }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.25)',
                fontStyle: 'italic',
              }}>
                — no data —
              </span>
            </div>
          )}
        </div>
      )
    })}
  </div>

  {/* Footer dengan slash */}
  <div style={{
    paddingTop: '16px',
    marginTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.6rem',
  }}>
    <span style={{
      color: 'rgba(255,255,255,0.3)',
      letterSpacing: '0.1em',
    }}>
      ACTIVE: {territories.filter(t => t.is_active).length}
    </span>
    
    
    <span style={{
      color: 'rgba(255,255,255,0.3)',
      letterSpacing: '0.1em',
    }}>
      TOTAL: {territories.length}
    </span>
  </div>
</div>

          {/* ========== RIGHT MAP - 60% ========== */}
          <div style={{
            width: '55%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: '5%',
          }} ref={mapRef}>
            
            {/* Map container */}
            <div style={{
              width: 'calc(100% - 20px)',
              height: 'calc(100% - 20px)',
              position: 'relative',
              background: 'rgba(0,0,0,0.3)',
              
            }}>
              <SaMap
                territories={territories}
                onSelectTerritory={handleSelectTerritory}
                selectedId={selected?.id ?? null}
              />
            </div>


            {/* Popup */}
            {selected && (
              <div style={{
                position: 'absolute',
                zIndex: 100,
                left: popupPos.x,
                top: popupPos.y,
                pointerEvents: 'auto',
              }}>
                <TerritoryPopup
                  territory={selected}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}