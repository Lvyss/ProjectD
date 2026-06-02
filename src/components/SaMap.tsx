'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }

type Props = {
  territories: TerritoryWithWinners[]
  onSelectTerritory: (t: TerritoryWithWinners | null, e?: React.MouseEvent) => void
  selectedId: number | null
}

const TERRITORY_POSITIONS: Record<string, { top: string; left: string; width: string; height: string }> = {
  'las-venturas':  { top: '0.3%',  left: '52.5%', width: '41%',   height: '41%'   },
  'bone':          { top: '0%',    left: '28.5%', width: '42.5%', height: '42.5%' },
  'tierra-robada': { top: '0.5%',  left: '9.7%',  width: '39.5%', height: '39.5%' },
  'san-fierro':    { top: '23.8%', left: '1.6%',  width: '50%',   height: '50%'   },
  'red-county':    { top: '31%',   left: '38%',   width: '47.5%', height: '47.5%' },
  'whetstone':     { top: '64.5%', left: '8.2%',  width: '35.5%', height: '35.5%' },
  'flint':         { top: '56%',   left: '17.3%', width: '44%',   height: '44%'   },
  'los-santos':    { top: '60.1%', left: '47.9%', width: '40.3%', height: '40.3%' },
}

// Canvas cache untuk pixel detection
const canvasCache: Record<string, HTMLCanvasElement> = {}

function loadToCanvas(slug: string): Promise<void> {
  return new Promise((resolve) => {
    if (canvasCache[slug]) { resolve(); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `/${slug}.png`
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      canvasCache[slug] = c
      resolve()
    }
    img.onerror = () => resolve()
  })
}

function getAlpha(slug: string, relX: number, relY: number): number {
  const c = canvasCache[slug]
  if (!c) return 0
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const px = Math.floor(relX * c.width)
  const py = Math.floor(relY * c.height)
  if (px < 0 || py < 0 || px >= c.width || py >= c.height) return 0
  return ctx.getImageData(px, py, 1, 1).data[3]
}

export default function SaMap({ territories, onSelectTerritory, selectedId }: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Preload semua canvas saat mount
  useEffect(() => {
    territories.forEach(t => loadToCanvas(t.slug))
  }, [territories])

  // ============================================================
  // CORE: Hit test semua territory dari mouse position di container
  // ============================================================
  const hitTest = useCallback((
    e: React.MouseEvent,
    mode: 'hover' | 'click'
  ) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left  // px dari kiri container
    const mouseY = e.clientY - rect.top   // px dari atas container
    const contW = rect.width
    const contH = rect.height

    // Cek semua territory — yang paling atas (z-index tinggi) duluan
    // Urutan: las-venturas, bone, tierra-robada, san-fierro, red-county, flint, los-santos, whetstone
    const order = ['las-venturas','bone','tierra-robada','red-county','san-fierro','flint','los-santos','whetstone']

    for (const slug of order) {
      const t = territories.find(t => t.slug === slug)
      const pos = TERRITORY_POSITIONS[slug]
      if (!t || !pos) continue

      // Convert % position ke px
      const tLeft = (parseFloat(pos.left) / 100) * contW
      const tTop  = (parseFloat(pos.top)  / 100) * contH
      const tW    = (parseFloat(pos.width) / 100) * contW
      const tH    = (parseFloat(pos.height)/ 100) * contH

      // Apakah mouse dalam bounding box territory ini?
      if (mouseX < tLeft || mouseX > tLeft + tW) continue
      if (mouseY < tTop  || mouseY > tTop  + tH) continue

      // Posisi relatif dalam territory (0-1)
      const relX = (mouseX - tLeft) / tW
      const relY = (mouseY - tTop)  / tH

      const alpha = getAlpha(slug, relX, relY)

      if (alpha < 30) continue // pixel transparan, skip ke territory berikutnya

      // HIT! Territory ini yang kena
      if (mode === 'hover') {
        setHoveredId(t.id)
      } else {
        onSelectTerritory(selectedId === t.id ? null : t, e)
      }
      return
    }

    // Ga ada yang kena
    if (mode === 'hover') setHoveredId(null)
  }, [territories, selectedId, onSelectTerritory])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: '#000', cursor: hoveredId ? 'pointer' : 'default' }}
      onMouseMove={(e) => hitTest(e, 'hover')}
      onMouseLeave={() => setHoveredId(null)}
      onClick={(e) => hitTest(e, 'click')}
    >
      {/* Base map */}
      <img
        src="/map.png"
        alt="SA Map"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ opacity: 1, zIndex: 0, pointerEvents: 'none' }}
        draggable={false}
      />

      {/* Territory overlays - semua pointer-events: none, handler di container */}
      {territories.map((territory) => {
        const pos = TERRITORY_POSITIONS[territory.slug]
        if (!pos) return null

        const isHovered = hoveredId === territory.id
        const isSelected = selectedId === territory.id
        const isActive = territory.is_active

        return (
          <div
            key={territory.slug}
            className="absolute transition-all duration-300"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              height: pos.height,
              zIndex: isHovered || isSelected ? 20 : 10,
              pointerEvents: 'none', // SEMUA pointer events di container parent
            }}
          >
            <img
              src={`/${territory.slug}.png`}
              alt={territory.name}
              className="w-full h-full object-contain"
              style={{
                opacity: isHovered || isSelected ? 0.9 : isActive ? 0.7 : 0.4,
filter: isHovered || isSelected
  ? 'grayscale(1) brightness(0.6) contrast(1.2)'
  : isActive
    ? `drop-shadow(0 0 4px ${territory.color}55) brightness(1.0)`
    : 'grayscale(1) brightness(0.4)',
                transition: 'all 0.3s ease',
                pointerEvents: 'none',
              }}
              draggable={false}
            />

            {/* Color tint */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: territory.color,
opacity: isHovered || isSelected
  ? 0
  : isActive
    ? 0.1
    : 0.02,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Active glow */}
            {isActive && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 2px ${territory.color}88`,
                  opacity: isHovered || isSelected ? 1 : 0.4,
                  animation: 'territorypulse 2s ease-in-out infinite',
                }}
              />
            )}

            {/* Label */}
            {(isHovered || isSelected) && (
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 pointer-events-none"
                style={{
                  background: '#000000cc',
                  border: `1px solid ${territory.color}`,
                  color: territory.color,
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  textShadow: `0 0 6px ${territory.color}`,
                  zIndex: 30,
                }}
              >
                {territory.name}
              </div>
            )}
          </div>
        )
      })}

      <style>{`
        @keyframes territorypulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}