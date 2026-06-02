'use client'

import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }

type Props = {
  territory: TerritoryWithWinners
  onClose: () => void
  targetX: number  // posisi tengah territory di layar
  targetY: number
  popupX: number   // posisi popup (tengah layar)
  popupY: number
}

const RANK_BADGES: Record<number, { label: string; color: string }> = {
  1: { label: '1ST', color: '#FFD700' },
  2: { label: '2ND', color: '#C0C0C0' },
  3: { label: '3RD', color: '#CD7F32' },
}

export default function TerritoryPopup({ territory, onClose, targetX, targetY, popupX, popupY }: Props) {
  const sortedWinners = [...territory.winners].sort((a, b) => a.rank - b.rank)

// ===== SESUAIKAN INI =====
const OFFSET_FROM_X = -224   // geser pangkal garis horizontal (= lebar popup)
const OFFSET_FROM_Y = -154     // geser pangkal garis vertikal dari tengah popup
const OFFSET_TARGET_X = -500   // geser ujung garis horizontal dari tengah territory
const OFFSET_TARGET_Y = -150   // geser ujung garis vertikal dari tengah territory
// =========================

const fromX = popupX + OFFSET_FROM_X
const fromY = popupY + OFFSET_FROM_Y
const targetFinalX = targetX + OFFSET_TARGET_X
const targetFinalY = targetY + OFFSET_TARGET_Y

const dx = targetFinalX - fromX
const dy = targetFinalY - fromY
const angle = Math.atan2(dy, dx) * (180 / Math.PI)
const length = Math.sqrt(dx * dx + dy * dy)

  return (
    <>
      <style>{`
@keyframes gold-blink {
  0%, 49% { opacity: 1; text-shadow: 0 0 6px #FFD700, 0 0 12px #FFD70088; }
  50%, 99% { opacity: 0; text-shadow: none; }
  100% { opacity: 1; }
}
      `}</style>

     {/* GARIS */}
<div style={{
  position: 'fixed',
  left: fromX,
  top: fromY,
  width: `${length}px`,
  height: '1px',
  background: '#ffffff',
  transformOrigin: '0 50%',
  transform: `rotate(${angle}deg)`,
  pointerEvents: 'none',
  zIndex: 90,
  opacity: 0.85,
}} />

{/* Dot di territory (ujung) */}
<div style={{
  position: 'fixed',
left: targetFinalX - 4,
top: targetFinalY - 4,
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#ffffff',
  boxShadow: '0 0 6px #ffffff, 0 0 12px #ffffff88',
  pointerEvents: 'none',
  zIndex: 90,
}} />

{/* Dot di pangkal (pojok popup) */}
<div style={{
  position: 'fixed',
left: fromX - 3,
top: fromY - 3,
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#ffffff',
  pointerEvents: 'none',
  zIndex: 90,
}} />

      {/* ===== POPUP CARD ===== */}
      <div style={{
background: 'transparent',
        minWidth: '250px',
        maxWidth: '250px',
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
              color: 'rgba(255,255,255,0.)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: territory.is_active ? '#00ff88' : '#ffffff44',
                boxShadow: territory.is_active ? '0 0 6px #00ff88' : 'none',
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: '0.55rem',
                color: territory.is_active ? '#00ff88' : 'rgba(255,255,255,0.3)',
                letterSpacing: '0.15em',
              }}>
                {territory.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
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
              textAlign: 'center',  // semua center
            }}>{h}</div>
          ))}
        </div>

        {/* Tabel body */}
        {sortedWinners.length === 0 ? (
          <div style={{
            padding: '28px 16px',
            textAlign: 'center',
            fontSize: '0.62rem',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.2em',
          }}>— NO DATA —</div>
        ) : (
          sortedWinners.map((winner, idx) => (
            <div key={winner.id} style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 1fr 52px',
              borderBottom: idx < sortedWinners.length - 1
                ? '1px solid rgba(255,255,255,0.5)' : 'none',
            }}>
              {/* Rank */}
              <div style={{
                padding: '9px 10px',
                borderRight: '1px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.62rem',
                  fontWeight: 'bold',
                  color: RANK_BADGES[winner.rank].color,
                  // Gold rank 1 kelap-kelip!
                  animation: winner.rank === 1 ? 'gold-blink 1.2s ease-in-out infinite' : 'none',
                }}>
                  {RANK_BADGES[winner.rank].label}
                </span>
              </div>

              {/* Driver */}
              <div style={{
                padding: '9px 10px',
                borderRight: '1px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
              }}>
<span style={{
  fontSize: '0.68rem',
  color: '#ffffff',
  wordBreak: 'break-word',
  textAlign: 'center',
  width: '100%',
}}>{winner.driver_name}</span>
              </div>

              {/* Car */}
              <div style={{
                padding: '9px 10px',
                borderRight: '1px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
              }}>
<span style={{
  fontSize: '0.6rem',
  color: '#ffffff',
  wordBreak: 'break-word',
  textAlign: 'center',
  width: '100%',
}}>{winner.car_name}</span>
              </div>

              {/* Points - gold blink untuk rank 1 */}
              <div style={{
                padding: '9px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  color: winner.rank === 1 ? '#FFD700' : 'rgba(255,255,255,0.7)',
                  animation: winner.rank === 1 ? 'gold-blink 1.2s ease-in-out infinite' : 'none',
                }}>{winner.points}</span>
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <div style={{
          padding: '7px 12px',
          borderTop: '1px solid rgba(255,255,255,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.5rem',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.1em',
        }}>
          <span>PROJECT.D</span>
          <span>WINNERS {sortedWinners.length}/3</span>
        </div>
      </div>
    </>
  )
}