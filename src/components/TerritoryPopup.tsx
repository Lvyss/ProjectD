'use client'

import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }

type Props = {
  territory: TerritoryWithWinners
  onClose: () => void
}

const RANK_BADGES: Record<number, { label: string; color: string }> = {
  1: { label: '1ST', color: '#FFD700' },
  2: { label: '2ND', color: '#C0C0C0' },
  3: { label: '3RD', color: '#CD7F32' },
}

export default function TerritoryPopup({ territory, onClose }: Props) {
  const sortedWinners = [...territory.winners].sort((a, b) => a.rank - b.rank)

  return (
    <div className="relative group">
      {/* Animasi CSS */}
      <style>{`
        @keyframes blink {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 2px ${territory.color}, 0 0 5px ${territory.color};
          }
          49% {
            opacity: 1;
          }
          50% {
            opacity: 0.2;
            text-shadow: none;
          }
          51% {
            opacity: 1;
            text-shadow: 0 0 2px ${territory.color}, 0 0 5px ${territory.color};
          }
        }
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translateY(-50%) scale(1.2);
          }
        }
      `}</style>

      {/* ========== KONEKTOR GARIS KE TERRITORY ========== */}
      <div style={{
        position: 'absolute',
        left: '-25px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '25px',
        height: '1px',
        background: territory.color,
        boxShadow: `0 0 3px ${territory.color}`,
      }} />
      
      {/* Bulat di ujung garis */}
      <div style={{
        position: 'absolute',
        left: '-30px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: territory.color,
        boxShadow: `0 0 8px ${territory.color}`,
        animation: 'pulse-dot 1.5s ease-in-out infinite',
      }} />

      {/* ========== POPUP - TANPA OUTLINE/BORDER LUAR ========== */}
      <div style={{
        background: 'rgba(8, 8, 12, 0.5)',
        backdropFilter: 'blur(6px)',
        borderRadius: '4px',
        minWidth: '320px',
        maxWidth: '380px',
        position: 'relative',
        border: 'none', // ← HILANGKAN OUTLINE
      }}>
        
        {/* ========== HEADER ========== */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${territory.color}25`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {/* JUDUL KELAP-KELIP */}
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: territory.color,
                animation: 'blink 1s step-end infinite',
              }}>
                {territory.name.toUpperCase()}
              </h3>
              
              {/* Status badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '5px',
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: territory.is_active ? '#00ff88' : 'rgba(255,255,255,0.4)',
                  boxShadow: territory.is_active ? '0 0 5px #00ff88' : 'none',
                }} />
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.55rem',
                  color: territory.is_active ? '#00ff88' : 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.1em',
                }}>
                  {territory.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace',
                fontSize: '14px',
                padding: '4px 6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = territory.color}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========== TABEL DENGAN GARIS BARIS DAN KOLOM ========== */}
        <div>
          {/* Header tabel - dengan border kanan */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '45px 1fr 1fr 45px',
            borderBottom: `1px solid ${territory.color}25`,
          }}>
            <div style={{
              padding: '8px 12px',
              borderRight: `1px solid ${territory.color}15`,
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.05em',
              }}>#</span>
            </div>
            <div style={{
              padding: '8px 12px',
              borderRight: `1px solid ${territory.color}15`,
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.05em',
              }}>NAME</span>
            </div>
            <div style={{
              padding: '8px 12px',
              borderRight: `1px solid ${territory.color}15`,
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.05em',
              }}>CAR</span>
            </div>
            <div style={{
              padding: '8px 12px',
              textAlign: 'right',
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.05em',
              }}>PTS</span>
            </div>
          </div>

          {/* Body tabel - dengan garis baris DAN kolom */}
          <div>
            {sortedWinners.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.25)',
              }}>
                — NO DATA —
              </div>
            ) : (
              sortedWinners.map((winner, idx) => (
                <div
                  key={winner.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '45px 1fr 1fr 45px',
                    borderBottom: idx < sortedWinners.length - 1 ? `1px solid ${territory.color}15` : 'none',
                  }}
                >
                  {/* Kolom # */}
                  <div style={{
                    padding: '8px 12px',
                    borderRight: `1px solid ${territory.color}15`,
                  }}>
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: RANK_BADGES[winner.rank].color,
                    }}>
                      {RANK_BADGES[winner.rank].label}
                    </span>
                  </div>
                  
                  {/* Kolom NAME */}
                  <div style={{
                    padding: '8px 12px',
                    borderRight: `1px solid ${territory.color}15`,
                  }}>
                    <span style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.7rem',
                      color: '#ffffffcc',
                    }}>
                      {winner.driver_name}
                    </span>
                  </div>
                  
                  {/* Kolom CAR */}
                  <div style={{
                    padding: '8px 12px',
                    borderRight: `1px solid ${territory.color}15`,
                  }}>
                    <span style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.5)',
                    }}>
                      {winner.car_name}
                    </span>
                  </div>
                  
                  {/* Kolom PTS */}
                  <div style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                  }}>
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: territory.color,
                    }}>
                      {winner.points}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${territory.color}20`,
          fontSize: '0.5rem',
          fontFamily: "'Share Tech Mono', monospace",
          color: 'rgba(255,255,255,0.25)',
          textAlign: 'right',
          letterSpacing: '0.05em',
        }}>
          WINNERS: {sortedWinners.length}/3
        </div>
      </div>
    </div>
  )
}