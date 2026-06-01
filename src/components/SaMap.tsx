'use client'

import { useState } from 'react'
import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }

type Props = {
  territories: TerritoryWithWinners[]
  onSelectTerritory: (t: TerritoryWithWinners | null, e?: React.MouseEvent) => void
  selectedId: number | null
}

// UKURAN KOTAK YANG LEBIH PAS UNTUK MAP
const TERRITORY_POSITIONS: Record<string, { top: string; left: string; width: string; height: string }> = {
  // Las Venturas (paling atas kanan) - kota casino
  'las-venturas':   { top: '0%',   left: '0%', width: '100%', height: '100%' },
  
  // Bone County (gurun, di atas tengah)
  'bone':           { top: '0%',  left: '0%', width: '100%', height: '100%' },
  
  // Tierra Robada (semenanjung barat laut)
  'tierra-robada':  { top: '0%',   left: '0%', width: '100%', height: '100%' },
  
  // San Fierro (kota barat)
  'san-fierro':     { top: '0%',  left: '0%', width: '100%', height: '100%' },
  
  // Red County (pedesaan tengah timur)
  'red-county':     { top: '0%',  left: '0%', width: '100%', height: '100%' },
  
  // Whetstone (pegunungan selatan - Mount Chiliad)
  'whetstone':      { top: '0%',  left: '0%',  width: '100%', height: '100%' },
  
  // Flint County (pedesaan barat daya)
  'flint':          { top: '0%',  left: '0%', width: '100%', height: '100%' },
  
  // Los Santos (kota selatan)
  'los-santos':     { top: '0%',  left: '0%', width: '100%', height: '100%' },
}

export default function SaMap({ territories, onSelectTerritory, selectedId }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <div className="relative w-full h-full" style={{ background: '#000' }}>
      {/* ========== BASE MAP FULL - BACKGROUND UTAMA ========== */}
      <img
        src="/map.png"
        alt="SA Map Full"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ opacity: 1, zIndex: 0 }}
        draggable={false}
      />

      {/* ========== TERRITORY PNG OVERLAY (TRANSPARAN) ========== */}
      {territories.map((territory) => {
        const pos = TERRITORY_POSITIONS[territory.slug]
        if (!pos) return null

        const isHovered = hoveredId === territory.id
        const isSelected = selectedId === territory.id
        const isActive = territory.is_active

        return (
          <div
            key={territory.slug}
            className="absolute cursor-pointer transition-all duration-300"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              height: pos.height,
              zIndex: 10,
            }}
            onMouseEnter={() => setHoveredId(territory.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => onSelectTerritory(isSelected ? null : territory, e)}
          >
            {/* Territory PNG */}
            <img
              src={`/${territory.slug}.png`}
              alt={territory.name}
              className="w-full h-full object-contain"
              style={{
                opacity: isActive ? 0.7 : 0.5,
                filter: isActive
                  ? isHovered || isSelected
                    ? `drop-shadow(0 0 8px ${territory.color}) brightness(1.1)`
                    : `drop-shadow(0 0 4px ${territory.color}66)`
                  : isHovered
                    ? 'brightness(0.9)'
                    : 'none',
                transition: 'all 0.3s ease',
              }}
              draggable={false}
            />

            {/* Warna tint overlay */}
            <div
              className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
              style={{
                background: territory.color,
                opacity: isActive
                  ? isHovered || isSelected ? 0.3 : 0.15
                  : isHovered ? 0.1 : 0.03,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Active pulse ring */}
            {isActive && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 2px ${territory.color}`,
                  opacity: isHovered || isSelected ? 0.8 : 0.4,
                  animation: 'pulse 2s ease-in-out infinite',
                  borderRadius: '2px',
                }}
              />
            )}

            {/* Territory label on hover */}
            {(isHovered || isSelected) && (
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 pointer-events-none"
                style={{
                  background: '#000000aa',
                  backdropFilter: 'blur(4px)',
                  border: `1px solid ${territory.color}`,
                  color: territory.color,
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  textShadow: `0 0 4px ${territory.color}`,
                  zIndex: 20,
                }}
              >
                {territory.name}
              </div>
            )}
          </div>
        )
      })}

      {/* Corner HUD decorations */}
      <div className="absolute bottom-3 right-3 pointer-events-none z-20">
        <div style={{
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#ffffff44',
          textAlign: 'right',
          lineHeight: 1.6,
          background: 'rgba(0,0,0,0.4)',
          padding: '4px 8px',
          borderRadius: '2px',
          backdropFilter: 'blur(2px)',
        }}>
          <div>{territories.filter(t => t.is_active).length}/{territories.length} ACTIVE</div>
          <div style={{ color: '#ffffff33' }}>SAN ANDREAS</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}