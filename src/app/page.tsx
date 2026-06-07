'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, Territory, Winner } from '@/src/lib/supabase'
import SaMap from '@/src/components/SaMap'
import TerritoryPopup from '@/src/components/TerritoryPopup'

type TerritoryWithWinners = Territory & { winners: Winner[] }

// ========== TAMBAHIN TYPE UNTUK DATA STATS ==========
type StreetRankItem = {
  driver_name: string
  total_points: number
  wins: number
  best_car: string
}

type RankByCarItem = {
  car_name: string
  driver_name: string
  points: number
  territory: string
}

export default function Home() {
  
  const [territories, setTerritories] = useState<TerritoryWithWinners[]>([])
  const [selected, setSelected] = useState<TerritoryWithWinners | null>(null)
  const [popupPos, setPopupPos] = useState({ 
    popupX: 0, popupY: 0,
    targetX: 0, targetY: 0
  })
  const [isMobile, setIsMobile] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
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

  // State untuk tab dan data
const [activeTab, setActiveTab] = useState('MENU')
  const [streetRankData, setStreetRankData] = useState<StreetRankItem[]>([])  // ← tambah type
  const [rankByCarData, setRankByCarData] = useState<RankByCarItem[]>([])     // ← tambah type

// Fetch data stats
useEffect(() => {
  const fetchStats = async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    if (data.streetRank) setStreetRankData(data.streetRank)
    if (data.rankByCar) setRankByCarData(data.rankByCar)
  }
  fetchStats()
}, [])

  useEffect(() => {
    fetchTerritories()
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territories' }, fetchTerritories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'winners' }, fetchTerritories)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Animasi reveal setelah data load
  useEffect(() => {
    if (territories.length > 0) {
      const timer = setTimeout(() => {
        setIsRevealed(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [territories])

  useEffect(() => {
    if (selected) {
      const updated = territories.find((t) => t.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [territories, selected])

const TERRITORY_CENTERS_DESKTOP: Record<string, { cx: string; cy: string }> = {
  'las-venturas':  { cx: '58%', cy: '31%' },
  'bone':          { cx: '42%', cy: '30%' },
  'tierra-robada': { cx: '27%', cy: '24%' },
  'san-fierro':    { cx: '21%', cy: '51%' },
  'red-county':    { cx: '55%', cy: '58%' },
  'whetstone':     { cx: '23%', cy: '82%' },
  'flint':         { cx: '35%', cy: '75%' },
  'los-santos':    { cx: '55%', cy: '75%' },
}

const TERRITORY_CENTERS_MOBILE: Record<string, { cx: string; cy: string }> = {
  'las-venturas':  { cx: '76%', cy: '18%' },
  'bone':          { cx: '57%', cy: '18%' },
  'tierra-robada': { cx: '37%', cy: '11%' },
  'san-fierro':    { cx: '30%', cy: '36%' },
  'red-county':    { cx: '70%', cy: '40%' },
  'whetstone':     { cx: '32%', cy: '61%' },
  'flint':         { cx: '47%', cy: '55%' },
  'los-santos':    { cx: '75%', cy: '57%' },
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
      popupY = window.innerHeight / 2 + 100
    } else {
      popupX = rect.left - 155
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
        
        .main-container {
          width: 100vw;
          min-height: 100vh;
          position: relative;
        }
        
        /* ANIMASI REVEAL DARI ATAS KE BAWAH - SATU KESATUAN */
        .reveal-container {
          clip-path: inset(0 0 100% 0);
          animation: revealDown 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes revealDown {
          0% {
            clip-path: inset(0 0 100% 0);
          }
          100% {
            clip-path: inset(0 0 0 0);
          }
        }
        
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
        
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="main-container">
        {/* BACKGROUND */}
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url("/bg.jpeg")',
          backgroundSize: isMobile ? 'auto 80%' : 'cover',
          backgroundPosition: isMobile ? '65% 10%' : 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(5px) brightness(0.6)',
          transform: 'scale(1.05)',
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

        {/* KONTEN DENGAN ANIMASI REVEAL SATU KESATUAN */}
        <div className={isRevealed ? 'reveal-container' : ''} style={{
          position: 'relative',
          zIndex: 10,
        }}>
          {isMobile ? (
            // ========== VERSI MOBILE ==========
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  }}>
    <div style={{
      textAlign: 'center',
      padding: '50px 0px 20px 0px',
      width: '100%',
    }}>
      <img 
        src="/logo3.png" 
        alt="PROJECT.D"
        style={{
          maxWidth: '90%',
          height: 'auto',
          maxHeight: '250px',
          objectFit: 'contain',
          margin: '0 auto',
          marginBottom: '-50px',
        }}
      />
    </div>

    <div className="sixteen-nine-wrapper">
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}>
        
        {/* LEFT SIDEBAR MOBILE */}
        <div style={{
          width: '42%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '7%',
          paddingRight: '0px',
          overflow: 'hidden',
          height: '100%',
        }}>
          
          {/* ========== MENU PILIHAN MOBILE ========== */}
          {activeTab === 'MENU' ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Menu TERRITORY */}
{/* Menu TERRITORY */}
<div
  onClick={() => setActiveTab('TERRITORY')}
  style={{
    padding: '4px 0px 3px 0px',
    marginBottom: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
  <div style={{ 
    fontFamily: "'Orbitron', sans-serif", 
    fontSize: '0.6rem', 
    fontWeight: 700, 
    color: '#fff', 
    letterSpacing: '0.08em',
    marginBottom: '2px',
  }}>
    TERRITORY
  </div>
  <img 
    className="stroke-img-mobile"
    src="/stroke1.png" 
    alt=""
    style={{ width: '65%', height: 'auto', display: 'block' }}
  />
</div>

              {/* Menu STREET RANK */}
              <div
                onClick={() => setActiveTab('STREET RANK')}
                style={{
                  padding: '10px 0px 6px 0px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
                <div style={{ 
                  fontFamily: "'Orbitron', sans-serif", 
                  fontSize: '0.6rem', 
                  fontWeight: 700, 
                  color: '#fff', 
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}>
                  STREET RANK
                </div>
                <img 
                  className="stroke-img-mobile"
                  src="/stroke1.png" 
                  alt=""
                  style={{ width: '65%', height: 'auto', display: 'block',marginTop: '-3%' }}
                />
              </div>

              {/* Menu RANK BY CAR */}
              <div
                onClick={() => setActiveTab('RANK BY CAR')}
                style={{
                  padding: '10px 0px 6px 0px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
                <div style={{ 
                  fontFamily: "'Orbitron', sans-serif", 
                  fontSize: '0.6rem', 
                  fontWeight: 700, 
                  color: '#fff', 
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}>
                  RANK BY CAR
                </div>
                <img 
                  className="stroke-img-mobile"
                  src="/stroke1.png" 
                  alt=""
                  style={{ width: '65%', height: 'auto', display: 'block',marginTop: '-3%' }}
                />
              </div>

              {/* Menu CREDIT */}
              <div
                onClick={() => setActiveTab('CREDIT')}
                style={{
                  padding: '10px 0px 6px 0px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
                <div style={{ 
                  fontFamily: "'Orbitron', sans-serif", 
                  fontSize: '0.6rem', 
                  fontWeight: 700, 
                  color: '#fff', 
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}>
                  CREDIT
                </div>
                <img 
                  className="stroke-img-mobile"
                  src="/stroke1.png" 
                  alt=""
                  style={{ width: '65%', height: 'auto', display: 'block',marginTop: '-3%' }}
                />
              </div>
            </div>
          ) : (
            // KONTEN SETELAH KLIK MENU + TOMBOL BACK
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* KONTEN UTAMA */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                
                {/* Konten TERRITORY MOBILE - dengan merge driver */}
                {activeTab === 'TERRITORY' && (
                  <div>
                    <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#ff3311', letterSpacing: '0.15em' }}>TERRITORY</span>
                    </div>
                    {territories.map((territory, idx) => {
                      // MERGE WINNER PER TERRITORY
                      const driverMap = new Map()
                      for (const w of territory.winners) {
                        if (driverMap.has(w.driver_name)) {
                          const existing = driverMap.get(w.driver_name)
                          existing.points += w.points
                          existing.cars.push(w.car_name)
                        } else {
                          driverMap.set(w.driver_name, {
                            driver_name: w.driver_name,
                            points: w.points,
                            cars: [w.car_name],
                            color: territory.color
                          })
                        }
                      }
                      const mergedWinners = Array.from(driverMap.values()).sort((a, b) => b.points - a.points)
                      const topWinner = mergedWinners[0]
                      const isActive = territory.is_active
                      
                      return (
                        <div
                          key={territory.id}
                          onClick={() => handleSelectTerritory(selected?.id === territory.id ? null : territory)}
                          style={{
                            padding: '8px 0px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', fontWeight: 'bold', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span style={{ fontSize: '0.6rem', color: '#ff3311', fontWeight: 'bold' }}>/</span>
                              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                {territory.name.substring(0, 8).toUpperCase()}
                              </span>
                            </div>
                            {isActive && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />}
                          </div>
                          {topWinner ? (
                            <div style={{ paddingLeft: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ fontSize: '0.5rem', color: territory.color }}>▶</span>
                              <span style={{ fontSize: '0.5rem', color: '#fff' }}>{topWinner.driver_name.substring(0, 10)}</span>
                              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)' }}>({topWinner.cars.join(', ')})</span>
                              <span style={{ fontSize: '0.5rem', fontWeight: 'bold', color: territory.color, marginLeft: 'auto' }}>{topWinner.points}pt</span>
                            </div>
                          ) : (
                            <div style={{ paddingLeft: '16px' }}>
                              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>— no data —</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)' }}>
                      <span>ACTIVE: {territories.filter(t => t.is_active).length}</span>
                      <span>TOTAL: {territories.length}</span>
                    </div>
                  </div>
                )}

                {/* Konten STREET RANK MOBILE */}
                {activeTab === 'STREET RANK' && (
                  <div>
                    <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.6rem', color: '#ff3311', letterSpacing: '0.15em' }}>STREET RANK</span>
                    </div>
                    {streetRankData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>Loading...</div>
                    ) : (
                      streetRankData.slice(0, 8).map((driver, idx) => (
                        <div key={driver.driver_name} style={{ padding: '8px 0px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                              <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: idx < 3 ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>#{idx + 1}</span>
                              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 600, color: '#fff' }}>{driver.driver_name.substring(0, 12)}</span>
                            </div>
                            <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#ff3311' }}>{driver.total_points}pt</span>
                          </div>
                          <div style={{ paddingLeft: '20px', fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)' }}>
                            🏆 {driver.wins} wins
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Konten RANK BY CAR MOBILE */}
                {activeTab === 'RANK BY CAR' && (
                  <div>
                    <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.6rem', color: '#ff3311', letterSpacing: '0.15em' }}>RANK BY CAR</span>
                    </div>
                    {rankByCarData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem' }}>Loading...</div>
                    ) : (
                      rankByCarData.slice(0, 8).map((car, idx) => (
                        <div key={car.car_name} style={{ padding: '8px 0px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                              <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: idx < 3 ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>#{idx + 1}</span>
                              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.55rem', fontWeight: 600, color: '#fff' }}>{car.car_name.substring(0, 10)}</span>
                            </div>
                            <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#ff3311' }}>{car.points}pt</span>
                          </div>
                          <div style={{ paddingLeft: '20px', fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)' }}>
                            🚗 {car.driver_name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Konten CREDIT MOBILE */}
                {activeTab === 'CREDIT' && (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <img src="/logo3.png" alt="PROJECT.D" style={{ maxWidth: '80px', margin: '0 auto', opacity: 0.8 }} />
                    <p style={{ fontSize: '0.55rem', color: '#ff3311', marginTop: '8px', letterSpacing: '0.15em' }}>V.S. PROJECT</p>
                    <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', marginTop: '12px', lineHeight: 1.5 }}>
                      GTA San Andreas<br />Territory Control System
                    </p>
                    <p style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>Version 1.0</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '15px', paddingTop: '15px' }}>
                      <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>SOCIALS</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.5rem' }}>IG</a>
                        <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.5rem' }}>TW</a>
                        <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.5rem' }}>DC</a>
                        <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.5rem' }}>GH</a>
                      </div>
                    </div>
                    <p style={{ marginTop: '15px', fontSize: '0.4rem', color: 'rgba(255,255,255,0.15)' }}>© 2024 V.S.Project</p>
                  </div>
                )}
              </div>

              {/* TOMBOL BACK MOBILE */}
              <button
                onClick={() => setActiveTab('MENU')}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '12px',
                  marginBottom: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '5px 12px',
                  fontSize: '0.5rem',
                  fontFamily: "'Share Tech Mono', monospace",
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '2px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#ff3311'
                  e.currentTarget.style.color = '#ff3311'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                }}
              >
                ← BACK
              </button>
            </div>
          )}
        </div>         

        {/* RIGHT MAP MOBILE */}
        <div style={{ width: '58%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} ref={mapRef}>
          <div style={{ width: 'calc(100% - 10px)', height: 'calc(100% - 10px)', background: '#00000055',  transform: 'scale(0.7)', 
    transformOrigin: 'center', marginTop: '-25%', marginRight: '-10%' }}>
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
  </div>

          ) : (
            // ========== VERSI DESKTOP ==========
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100vh',
              padding: '50px 28px 0px 28px',
            }}>
              <div style={{
                textAlign: 'center',
                flexShrink: 0,
                height: '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <img src="/logo3.png" alt="PROJECT.D" style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }} />
              </div>

              <div style={{ flex: 1, display: 'flex', gap: '28px', minHeight: 0 }}>
<div style={{
  width: '45%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingLeft: '17.2%',
  paddingRight: '10%',
  paddingTop: '6.2%',
    paddingBottom: '2%',     // ← tambah padding bawah biar ga nempel
  maxHeight: 'calc(100vh - 100px)', // ← batasi tinggi (100px buat header + padding)
}}>
  
  {/* ========== MENU PILIHAN ========== */}
{activeTab === 'MENU' ? (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    
    {/* Menu TERRITORY */}
    <div
      onClick={() => setActiveTab('TERRITORY')}
      style={{
        padding: '0px 0px 8px 0px',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
      <div 
        style={{ 
          fontFamily: "'Orbitron', sans-serif", 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: '#fff', 
          letterSpacing: '0.15em',
          marginBottom: '8px',
        }}
      >
        TERRITORY
      </div>
      <img 
        className="stroke-img"
        src="/stroke1.png" 
        alt=""
        style={{ width: '100%', height: 'auto', display: 'block', marginTop: '-15px' }}
      />
    </div>

    {/* Menu STREET RANK */}
    <div
      onClick={() => setActiveTab('STREET RANK')}
      style={{
        padding: '16px 0px 8px 0px',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
      <div 
        style={{ 
          fontFamily: "'Orbitron', sans-serif", 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: '#fff', 
          letterSpacing: '0.15em',
          marginBottom: '8px',
        }}
      >
        STREET RANK
      </div>
      <img 
        className="stroke-img"
        src="/stroke1.png" 
        alt=""
        style={{ width: '100%', height: 'auto', display: 'block', marginTop: '-15px' }}
      />
    </div>

    {/* Menu RANK BY CAR */}
    <div
      onClick={() => setActiveTab('RANK BY CAR')}
      style={{
        padding: '16px 0px 8px 0px',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
      <div 
        style={{ 
          fontFamily: "'Orbitron', sans-serif", 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: '#fff', 
          letterSpacing: '0.15em',
          marginBottom: '8px',
        }}
      >
        RANK BY CAR
      </div>
      <img 
        className="stroke-img"
        src="/stroke1.png" 
        alt=""
        style={{ width: '100%', height: 'auto', display: 'block', marginTop: '-15px' }}
      />
    </div>

    {/* Menu CREDIT */}
    <div
      onClick={() => setActiveTab('CREDIT')}
      style={{
        padding: '16px 0px 8px 0px',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
  onMouseEnter={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke2.png'
  }}
  onMouseLeave={e => {
    const img = e.currentTarget.querySelector('.stroke-img-mobile') as HTMLImageElement
    if (img) img.src = '/stroke1.png'
  }}
>
      <div 
        style={{ 
          fontFamily: "'Orbitron', sans-serif", 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: '#fff', 
          letterSpacing: '0.15em',
          marginBottom: '8px',
        }}
      >
        CREDIT
      </div>
      <img 
        className="stroke-img"
        src="/stroke1.png" 
        alt=""
        style={{ width: '100%', height: 'auto', display: 'block', marginTop: '-15px' }}
      />
    </div>
  </div>
) : (
  // ... konten lainnya ...

  // Tampilkan konten yang dipilih + tombol BACK di BAWAH
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    
    {/* KONTEN UTAMA (scroll di tengah) */}
    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
      
      {/* Konten TERRITORY */}
{/* Konten TERRITORY - dengan merge driver */}
{activeTab === 'TERRITORY' && (
  <div>
    <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
      <span style={{ 
        fontFamily: "'Share Tech Mono', monospace", 
        fontSize: '0.7rem', 
        color: '#ff3311', 
        letterSpacing: '0.2em' 
      }}>TERRITORY</span>
      <span style={{ 
        fontFamily: "'Share Tech Mono', monospace", 
        fontSize: '0.55rem', 
        color: 'rgba(255,255,255,0.3)', 
        marginLeft: '10px' 
      }}>8 REGIONS</span>
    </div>
    {territories.map((territory, idx) => {
      // MERGE WINNER PER TERRITORY (driver sama digabung)
      const driverMap = new Map()
      for (const w of territory.winners) {
        if (driverMap.has(w.driver_name)) {
          const existing = driverMap.get(w.driver_name)
          existing.points += w.points
          existing.cars.push(w.car_name)
          // ambil rank terbaik
          existing.rank = Math.min(existing.rank, w.rank)
        } else {
          driverMap.set(w.driver_name, {
            driver_name: w.driver_name,
            points: w.points,
            cars: [w.car_name],
            rank: w.rank,
            color: territory.color
          })
        }
      }
      
      const mergedWinners = Array.from(driverMap.values())
        .sort((a, b) => b.points - a.points)
      
      const topWinner = mergedWinners[0]
      const isActive = territory.is_active
      
      return (
        <div
          key={territory.id}
          onClick={() => handleSelectTerritory(selected?.id === territory.id ? null : territory)}
          style={{
            padding: '12px 0px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
              <span style={{ 
                fontFamily: "'Share Tech Mono', monospace", 
                fontSize: '0.8rem', 
                fontWeight: 'bold', 
                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' 
              }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span style={{ 
                fontFamily: "'Share Tech Mono', monospace", 
                fontSize: '0.8rem', 
                color: '#ff3311', 
                fontWeight: 'bold' 
              }}>/</span>
              <span style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                letterSpacing: '0.1em', 
                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' 
              }}>
                {territory.name.toUpperCase()}
              </span>
            </div>
            {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />}
          </div>
          
          {topWinner ? (
            <div style={{ paddingLeft: '32px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: territory.color }}>▶</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#fff' }}>
                {topWinner.driver_name}
              </span>
              <span style={{ 
                fontFamily: "'Share Tech Mono', monospace", 
                fontSize: '0.55rem', 
                color: 'rgba(255,255,255,0.5)' 
              }}>
                ({topWinner.cars.join(', ')})
              </span>
              <span style={{ 
                fontFamily: "'Share Tech Mono', monospace", 
                fontSize: '0.7rem', 
                fontWeight: 'bold', 
                color: territory.color, 
                marginLeft: 'auto' 
              }}>
                {topWinner.points}pt
              </span>
            </div>
          ) : (
            <div style={{ paddingLeft: '32px' }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>— no data —</span>
            </div>
          )}
        </div>
      )
    })}
    <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
      <span>ACTIVE: {territories.filter(t => t.is_active).length}</span>
      <span>TOTAL: {territories.length}</span>
    </div>
  </div>
)}

      {/* Konten STREET RANK */}
      {activeTab === 'STREET RANK' && (
        <div>
          <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#ff3311', letterSpacing: '0.2em' }}>STREET RANK</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginLeft: '10px' }}>ALL DRIVERS</span>
          </div>
          {streetRankData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
          ) : (
            streetRankData.map((driver, idx) => (
              <div key={driver.driver_name} style={{ padding: '10px 0px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', fontWeight: 'bold', color: idx < 3 ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                      {driver.driver_name.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', fontWeight: 'bold', color: '#ff3311' }}>
                    {driver.total_points}pt
                  </span>
                </div>
                <div style={{ paddingLeft: '32px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                  🏆 {driver.wins} wins · Best car: {driver.best_car}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Konten RANK BY CAR */}
      {activeTab === 'RANK BY CAR' && (
        <div>
          <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#ff3311', letterSpacing: '0.2em' }}>RANK BY CAR</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginLeft: '10px' }}>PER CAR</span>
          </div>
          {rankByCarData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
          ) : (
            rankByCarData.map((car, idx) => (
              <div key={car.car_name} style={{ padding: '10px 0px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', fontWeight: 'bold', color: idx < 3 ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: '#fff' }}>
                      {car.car_name.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', fontWeight: 'bold', color: '#ff3311' }}>
                    {car.points}pt
                  </span>
                </div>
                <div style={{ paddingLeft: '32px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                  🚗 {car.driver_name} · {car.territory}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Konten CREDIT */}
      {activeTab === 'CREDIT' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '30px' }}>
            <img src="/logo3.png" alt="PROJECT.D" style={{ maxWidth: '120px', margin: '0 auto', opacity: 0.8 }} />
            <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: '#ff3311', marginTop: '10px', letterSpacing: '0.2em' }}>V.S. PROJECT</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
              GTA San Andreas Territory Control System
            </p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
              Version 1.0
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '15px' }}>SOCIALS</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <a href="#" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.6rem' }}>Instagram</a>
              <a href="#" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.6rem' }}>Twitter</a>
              <a href="#" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.6rem' }}>Discord</a>
              <a href="#" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.6rem' }}>GitHub</a>
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)' }}>
            © 2024 V.S.Project · All Rights Reserved
          </div>
        </div>
      )}
    </div>

    {/* TOMBOL BACK DI BAWAH (FOOTER) */}
    <button
      onClick={() => setActiveTab('MENU')}
      style={{
        alignSelf: 'flex-start',
        marginTop: '20px',
        marginBottom: '10px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: '8px 20px',
        fontSize: '0.6rem',
        fontFamily: "'Share Tech Mono', monospace",
        color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '2px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#ff3311'
        e.currentTarget.style.color = '#ff3311'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
      }}
    >
      ← BACK TO MENU
    </button>
  </div>
)}
</div>

                <div style={{
                  width: '55%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingRight: '10%',
                }} ref={mapRef}>
                  <div style={{ width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', background: '#0005',    transform: 'scale(0.8)', 
    transformOrigin: 'center', marginBottom: '-40px' }}>
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
      </div>
    </>
  )
}