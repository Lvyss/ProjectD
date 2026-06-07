'use client'

import { Territory, Winner } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'

type TerritoryWithWinners = Territory & { winners: Winner[] }

type Props = {
  territory: TerritoryWithWinners
  onClose: () => void
  targetX: number
  targetY: number
  popupX: number
  popupY: number
}

const RANK_BADGES: Record<number, { label: string; color: string }> = {
  1: { label: '1ST', color: '#FFD700' },
  2: { label: '2ND', color: '#C0C0C0' },
  3: { label: '3RD', color: '#CD7F32' },
}

// Fungsi untuk merge winners dengan driver yang sama
function mergeWinnersByDriver(winners: Winner[]): (Winner & { merged_cars: string })[] {
  const driverMap = new Map<string, { points: number; cars: Set<string>; rank: number }>()
  
  for (const w of winners) {
    if (driverMap.has(w.driver_name)) {
      const existing = driverMap.get(w.driver_name)!
      existing.points += w.points
      existing.cars.add(w.car_name)
      // ambil rank terbaik (angka terkecil)
      existing.rank = Math.min(existing.rank, w.rank)
    } else {
      driverMap.set(w.driver_name, {
        points: w.points,
        cars: new Set([w.car_name]),
        rank: w.rank
      })
    }
  }
  
  // Konversi ke array dan urutkan berdasarkan poin tertinggi
  const merged = Array.from(driverMap.entries()).map(([driver_name, data]) => ({
    id: driver_name, // temporary id
    territory_id: 0,
    rank: data.rank,
    driver_name,
    car_name: Array.from(data.cars).join(', '),
    points: data.points,
    created_at: '',
    merged_cars: Array.from(data.cars).join(', ')
  }))
  
  // Urutkan berdasarkan poin tertinggi
  return merged.sort((a, b) => b.points - a.points)
}

export default function TerritoryPopup({ territory, onClose, targetX, targetY, popupX, popupY }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  const [showAll, setShowAll] = useState(false)
  
  // Merge winners berdasarkan driver yang sama
  const mergedWinners = mergeWinnersByDriver(territory.winners)
  
  // Tampilkan hanya top 3 jika showAll false, else semua
  const displayedWinners = showAll ? mergedWinners : mergedWinners.slice(0, 3)
  const hasMoreWinners = mergedWinners.length > 3

  // Deteksi mode HP
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ============================================================
  // SETTINGAN GARIS PENUNJUK - 2 TIPE (DESKTOP & MOBILE)
  // ============================================================
  
  const ANCHOR_X = isMobile ? 138 : 245
  const ANCHOR_Y = isMobile ? 15 : 25
  const TARGET_OFFSET_X = 0
  const TARGET_OFFSET_Y = 0
  const LINE_WIDTH = '1px'
  const LINE_COLOR = '#ffffff'
  const LINE_OPACITY = 0.7
  const DOT_SIZE_END = 6
  const DOT_SIZE_START = isMobile ? 6 : 4
  
  const fromX = popupX + ANCHOR_X
  const fromY = popupY + ANCHOR_Y
  const targetFinalX = targetX + TARGET_OFFSET_X
  const targetFinalY = targetY + TARGET_OFFSET_Y
  const dx = targetFinalX - fromX
  const dy = targetFinalY - fromY
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  const length = Math.sqrt(dx * dx + dy * dy)

  // Hitung rank untuk display (1,2,3,... berdasarkan poin)
  const getDisplayRank = (idx: number) => {
    if (idx === 0) return 1
    if (idx === 1) return 2
    if (idx === 2) return 3
    return idx + 1
  }

  return (
    <>
      <style>{`
        @keyframes gold-blink {
          0%, 49% { opacity: 1; text-shadow: 0 0 6px #FFD700, 0 0 12px #FFD70088; }
          50%, 99% { opacity: 0; text-shadow: none; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* GARIS KONEKTOR */}
      <div style={{
        position: 'fixed',
        left: fromX,
        top: fromY,
        width: `${length}px`,
        height: LINE_WIDTH,
        background: LINE_COLOR,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        pointerEvents: 'none',
        zIndex: 90,
        opacity: LINE_OPACITY,
      }} />

      <div style={{
        position: 'fixed',
        left: targetFinalX - DOT_SIZE_END / 2,
        top: targetFinalY - DOT_SIZE_END / 2,
        width: `${DOT_SIZE_END}px`,
        height: `${DOT_SIZE_END}px`,
        borderRadius: '50%',
        background: LINE_COLOR,
        boxShadow: `0 0 6px ${LINE_COLOR}, 0 0 12px ${LINE_COLOR}88`,
        pointerEvents: 'none',
        zIndex: 90,
      }} />

      <div style={{
        position: 'fixed',
        left: fromX - DOT_SIZE_START / 2,
        top: fromY - DOT_SIZE_START / 2,
        width: `${DOT_SIZE_START}px`,
        height: `${DOT_SIZE_START}px`,
        borderRadius: '50%',
        background: LINE_COLOR,
        opacity: 0.8,
        pointerEvents: 'none',
        zIndex: 90,
      }} />

      {/* POPUP CARD */}
      <div style={{
        background: 'transparent',
        minWidth: isMobile ? '280px' : '250px',
        maxWidth: isMobile ? '280px' : '250px',
        position: 'relative',
        fontFamily: "'Share Tech Mono', monospace",
      }}>

        {/* Header */}
        <div style={{
          padding: '12px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.3em',
              marginBottom: '4px',
            }}>TERRITORY</div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.12em',
              textShadow: `0 0 10px ${territory.color}88`,
            }}>
              {territory.name.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', fontSize: '13px',
              fontFamily: 'monospace', padding: '2px 4px',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >✕</button>
          </div>
        </div>

        {/* Tabel header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 1fr 52px',
          borderBottom: '1px solid rgba(255,255,255,0.5)',
        }}>
          {['#', 'DRIVER', 'CAR', 'PTS'].map((h, i, arr) => (
            <div key={h} style={{
              padding: '7px 10px',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.5)' : 'none',
              fontSize: '0.52rem',
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.15em',
              textAlign: 'center',
            }}>{h}</div>
          ))}
        </div>

        {/* Tabel body dengan merge data */}
        <div style={{
          maxHeight: showAll ? (isMobile ? '150px' : '150px') : 'auto',
          overflowY: showAll ? 'auto' : 'visible',
          transition: 'max-height 0.3s ease',
        }}>
          {displayedWinners.length === 0 ? (
            <div style={{
              padding: '28px 16px',
              textAlign: 'center',
              fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.2em',
            }}>— NO DATA —</div>
          ) : (
            displayedWinners.map((winner, idx) => {
              const displayRank = getDisplayRank(idx)
              return (
                <div key={winner.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 1fr 52px',
                  borderBottom: idx < displayedWinners.length - 1
                    ? '1px solid rgba(255,255,255,0.5)' : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (displayRank > 3) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}>
                  <div style={{
                    padding: '9px 10px',
                    borderRight: '1px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      color: displayRank <= 3 ? RANK_BADGES[displayRank]?.color || 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.4)',
                      animation: displayRank === 1 ? 'gold-blink 1.2s ease-in-out infinite' : 'none',
                    }}>
                      {displayRank <= 3 ? RANK_BADGES[displayRank]?.label || `#${displayRank}` : `#${displayRank}`}
                    </span>
                  </div>

                  <div style={{
                    padding: '9px 10px',
                    borderRight: '1px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: '0.68rem',
                      color: '#ffffff',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                      width: '100%',
                    }}>{winner.driver_name}</span>
                  </div>

                  <div style={{
                    padding: '9px 10px',
                    borderRight: '1px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: '0.55rem',
                      color: 'rgba(255,255,255,0.6)',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                      width: '100%',
                    }}>{winner.merged_cars || winner.car_name}</span>
                  </div>

                  <div style={{
                    padding: '9px 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: displayRank === 1 ? '#FFD700' : 'rgba(255,255,255,0.7)',
                      animation: displayRank === 1 ? 'gold-blink 1.2s ease-in-out infinite' : 'none',
                    }}>{winner.points}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '7px 12px',
          borderTop: '1px solid rgba(255,255,255,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.5rem',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.1em',
        }}>
          <span>PROJECT.D</span>
          
          {hasMoreWinners && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                fontSize: '0.55rem',
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${territory.color}44`,
                color: territory.color,
                cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '0.1em',
                transition: 'all 0.2s',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${territory.color}22`
                e.currentTarget.style.borderColor = territory.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = `${territory.color}44`
              }}
            >
              {showAll ? '▲ SHOW LESS' : `▼ VIEW ALL (${mergedWinners.length})`}
            </button>
          )}
          
          <span>WINNERS {mergedWinners.length}</span>
        </div>
      </div>
    </>
  )
}