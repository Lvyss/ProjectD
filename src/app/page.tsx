'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, Territory, Winner } from '@/src/lib/supabase'
import SaMap from '@/src/components/SaMap'
import TerritoryPopup from '@/src/components/TerritoryPopup'

type TerritoryWithWinners = Territory & { winners: Winner[] }

export default function Home() {
  const [territories, setTerritories] = useState<TerritoryWithWinners[]>([])
  const [selected, setSelected] = useState<TerritoryWithWinners | null>(null)
  const [popupPos, setPopupPos] = useState({ 
    popupX: 0, popupY: 0,
    targetX: 0, targetY: 0
  })
  const [isMobile, setIsMobile] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

const TERRITORY_CENTERS_DESKTOP: Record<string, { cx: string; cy: string }> = {
  'las-venturas':  { cx: '66%', cy: '20%' },
  'bone':          { cx: '47%', cy: '21%' },
  'tierra-robada': { cx: '29%', cy: '12%' },
  'san-fierro':    { cx: '23%', cy: '46%' },
  'red-county':    { cx: '60%', cy: '53%' },
  'whetstone':     { cx: '24%', cy: '82%' },
  'flint':         { cx: '38%', cy: '75%' },
  'los-santos':    { cx: '64%', cy: '79%' },
}

const TERRITORY_CENTERS_MOBILE: Record<string, { cx: string; cy: string }> = {
  'las-venturas':  { cx: '76%', cy: '23%' },
  'bone':          { cx: '50%', cy: '23%' },
  'tierra-robada': { cx: '25%', cy: '13%' },
  'san-fierro':    { cx: '17%', cy: '48%' },
  'red-county':    { cx: '70%', cy: '52%' },
  'whetstone':     { cx: '17%', cy: '82%' },
  'flint':         { cx: '38%', cy: '74%' },
  'los-santos':    { cx: '75%', cy: '76%' },
}

const handleSelectTerritory = (
  territory: TerritoryWithWinners | null,
  event?: React.MouseEvent
) => {
  setSelected(territory)
  if (territory && mapRef.current) {
    const rect = mapRef.current.getBoundingClientRect()
    
    const centers = isMobile ? TERRITORY_CENTERS_MOBILE : TERRITORY_CENTERS_DESKTOP
    const center = centers[territory.slug]
    if (!center) return

    const targetX = rect.left + (parseFloat(center.cx) / 100) * rect.width
    const targetY = rect.top + (parseFloat(center.cy) / 100) * rect.height
    
    let popupX, popupY
    if (isMobile) {
      popupX = window.innerWidth / 2 - 140
      popupY = window.innerHeight / 2 + 50
    } else {
      popupX = rect.left - 165
      popupY = window.innerHeight / 2 - 80
    }

    setPopupPos({ popupX, popupY, targetX, targetY })
  }
}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;800;900&family=Share+Tech+Mono&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          background: #000;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          overflow-y: auto;
        }
        
        /* DESKTOP: normal (tanpa efek 16:9) */
        .main-container {
          width: 100vw;
          min-height: 100vh;
          position: relative;
        }
        
        /* HANYA UNTUK MOBILE */
        @media (max-width: 768px) and (orientation: portrait) {
          .sixteen-nine-wrapper {
            width: 100vw;
            height: 56.25vw;
            max-height: 100vh;
            max-width: calc(100vh * 16 / 9);
            overflow: hidden;
            position: relative;
            margin: 0 auto;
          }
          
          .territory-name {
            font-size: 0.55rem !important;
          }
          
          .territory-number {
            font-size: 0.55rem !important;
          }
        }
        
        /* DESKTOP: reset */
        @media (min-width: 769px) {
          .main-container {
            overflow: hidden;
          }
        }
        
        ::-webkit-scrollbar { display: none; }
      `}</style>

<div className="main-container">
  {/* BACKGROUND */}
  <div style={{
    position: 'fixed',
    inset: 0,
    backgroundImage: 'url("/bg.jpeg")',
    backgroundSize: isMobile ? 'auto 40%' : 'cover',
    backgroundPosition: isMobile ? '30% 20%' : 'center',
    backgroundRepeat: 'no-repeat',
    filter: isMobile ? 'blur(3px) brightness(0.7)' : 'blur(5px) brightness(0.6)',
    transform: isMobile ? 'scale(1)' : 'scale(1.05)',
    zIndex: 0,
  }} />
        
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.55)',
    zIndex: 1,
  }} />

  <div style={{
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)',
  }} />

  {isMobile ? (
    
    // ========== VERSI MOBILE ==========
    <div style={{
      position: 'relative',
      zIndex: 10,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '50px 0px 0px 0px',
        width: '100%',
      }}>
        <img 
          src="/logo1.png" 
          alt="PROJECT.D"
          style={{
            maxWidth: '90%',
            height: 'auto',
            maxHeight: '200px',
            objectFit: 'contain',
            margin: '0 auto',
          }}
        />
      </div>

      <div className="sixteen-nine-wrapper" style={{ marginTop: '-40px' }}>
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '0px 0px 25px 25px',
        }}>
          
          <div style={{
            width: '42%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: '0px',
            paddingRight: '0px',
            overflow: 'hidden',
          }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
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
                      padding: '6px 0px 6px 0px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '3px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                        <span className="territory-number" style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.55rem',
                          fontWeight: 'bold',
                          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                          textShadow: isActive ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
                        }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        
                        <span style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.55rem',
                          color: '#ff3311',
                          fontWeight: 'bold',
                        }}>/</span>
                        
                        <span className="territory-name" style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.55rem',
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                        }}>
                          {territory.name.toUpperCase()}
                        </span>
                      </div>
                      
                      {isActive && (
                        <div style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          marginRight: '10px',
                          background: '#00ff88',
                          boxShadow: '0 0 8px #00ff88',
                        }} />
                      )}
                    </div>
                    
                    {topWinner ? (
                      <div style={{ paddingLeft: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.5rem', color: territory.color }}>▶</span>
                          <span style={{ fontSize: '0.5rem', color: '#fff' }}>{topWinner.driver_name}</span>
                          <span style={{ fontSize: '0.45rem', color: '#fffaaa' }}>{topWinner.car_name}</span>
                          <span style={{ fontSize: '0.5rem', fontWeight: 'bold', color: territory.color, marginLeft: 'auto' }}>{topWinner.points}pt</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ paddingLeft: '16px' }}>
                        <span style={{ fontSize: '0.5rem', color: '#555', fontStyle: 'italic' }}>— no data —</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{
              paddingTop: '6px',
              marginTop: '3px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.45rem',
              color: '#fffaaa',
            }}>
              <span>ACTIVE: {territories.filter(t => t.is_active).length}</span>
              <span>TOTAL: {territories.length}</span>
            </div>
          </div>

          <div style={{
            width: '58%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: '10px',
          }} ref={mapRef}>
            <div style={{
              width: 'calc(100% - 10px)',
              height: 'calc(100% - 10px)',
              background: '#00000055',
            }}>
              <SaMap territories={territories} onSelectTerritory={handleSelectTerritory} selectedId={selected?.id ?? null} />
            </div>
            {selected && (
              <div style={{
                position: 'fixed',
                zIndex: 100,
                left: popupPos.popupX,
                top: popupPos.popupY,
                pointerEvents: 'auto',
              }}>
                <TerritoryPopup territory={selected} onClose={() => setSelected(null)} targetX={popupPos.targetX} targetY={popupPos.targetY} popupX={popupPos.popupX} popupY={popupPos.popupY} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    // ========== VERSI DESKTOP (KEMBALI KE YANG DULU) ==========
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100vh',
      position: 'relative',
      zIndex: 10,
      padding: '20px 28px 28px 28px',
    }}>
      {/* HEADER DESKTOP */}
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
          src="/logo1.png" 
          alt="PROJECT.D"
          style={{
            maxWidth: '90%',
            height: 'auto',
            maxHeight: '350px',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* BODY DESKTOP */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '28px',
        minHeight: 0,
      }}>
        {/* LEFT SIDEBAR DESKTOP */}
        <div style={{
          width: '45%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingLeft: '12%',
          paddingRight: '150px',
          paddingTop: '25px',
          paddingBottom: '35px',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {territories.map((territory, idx) => {
              const topWinner = territory.winners.find(w => w.rank === 1)
              const isActive = territory.is_active
              
              return (
                <div
                  key={territory.id}
                  onClick={() => handleSelectTerritory(selected?.id === territory.id ? null : territory)}
                  style={{
                    padding: '12px 0px',
                    borderBottom: '1px solid #fff1',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold', color: isActive ? '#fff' : '#fff6' }}>{String(idx + 1).padStart(2, '0')}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#f31', fontWeight: 'bold' }}>/</span>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', color: isActive ? '#fff' : '#fff6' }}>{territory.name.toUpperCase()}</span>
                    </div>
                    {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0f8', boxShadow: '0 0 8px #0f8' }} />}
                  </div>
                  {topWinner ? (
                    <div style={{ paddingLeft: '32px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: territory.color }}>▶</span>
                      <span style={{ fontSize: '0.7rem', color: '#fff' }}>{topWinner.driver_name}</span>
                      <span style={{ fontSize: '0.6rem', color: '#fffa' }}>{topWinner.car_name}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: territory.color, marginLeft: 'auto' }}>{topWinner.points}pt</span>
                    </div>
                  ) : (
                    <div style={{ paddingLeft: '32px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#fff6', fontStyle: 'italic' }}>— no data —</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ paddingTop: '16px', borderTop: '1px solid #fff1', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#fffa' }}>
            <span>ACTIVE: {territories.filter(t => t.is_active).length}</span>
            <span>TOTAL: {territories.length}</span>
          </div>
        </div>

        {/* RIGHT MAP DESKTOP */}
        <div style={{
          width: '55%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: '5%',
        }} ref={mapRef}>
          <div style={{ width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', background: '#0005' }}>
            <SaMap territories={territories} onSelectTerritory={handleSelectTerritory} selectedId={selected?.id ?? null} />
          </div>
          {selected && (
            <div style={{ position: 'fixed', zIndex: 100, left: popupPos.popupX, top: popupPos.popupY, pointerEvents: 'auto' }}>
              <TerritoryPopup territory={selected} onClose={() => setSelected(null)} targetX={popupPos.targetX} targetY={popupPos.targetY} popupX={popupPos.popupX} popupY={popupPos.popupY} />
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>
    </>
  )
}