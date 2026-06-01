'use client'

import { Territory, Winner } from '@/src/lib/supabase'

type TerritoryWithWinners = Territory & { winners: Winner[] }

type Props = {
  territories: TerritoryWithWinners[]
  onSelectTerritory: (t: TerritoryWithWinners | null) => void
  selectedId: number | null
}

export default function Leaderboard({ territories, onSelectTerritory, selectedId }: Props) {
  const activeCount = territories.filter((t) => t.is_active).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-0.5 bg-red-500" />
          <span className="text-red-500 text-xs tracking-[0.4em] font-mono uppercase">
            Initialized
          </span>
        </div>
        <h1
          className="text-3xl font-black tracking-[0.15em] uppercase"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(135deg, #ffffff 0%, #aaaaaa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
          }}
        >
          PROJECT.D
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-white/30 text-xs font-mono tracking-widest">
            TERRITORY CONTROL
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-sm"
            style={{ background: '#ffffff11', color: '#ffffff44' }}>
            {activeCount}/{territories.length}
          </span>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-red-500/50 via-white/10 to-transparent" />
      </div>

      {/* Territory List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-hide">
        {territories.map((territory, index) => {
          const isSelected = selectedId === territory.id
          const topWinner = territory.winners.find((w) => w.rank === 1)

          return (
            <button
              key={territory.id}
              onClick={() => onSelectTerritory(isSelected ? null : territory)}
              className="w-full text-left transition-all duration-200 group"
            >
              <div
                className="px-3 py-3 relative overflow-hidden"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${territory.color}22, ${territory.color}11)`
                    : 'transparent',
                  borderLeft: `2px solid ${territory.is_active ? territory.color : territory.color + '33'}`,
                  borderBottom: '1px solid #ffffff08',
                }}
              >
                {/* Hover effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: `${territory.color}11` }}
                />

                <div className="relative flex items-center gap-3">
                  {/* Index */}
                  <span className="text-white/20 text-xs font-mono w-5 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: territory.color,
                      opacity: territory.is_active ? 1 : 0.3,
                      boxShadow: territory.is_active ? `0 0 6px ${territory.color}` : 'none',
                    }}
                  />

                  {/* Territory info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold tracking-wide truncate uppercase"
                      style={{
                        color: territory.is_active ? '#ffffff' : '#ffffff55',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.7rem',
                      }}
                    >
                      {territory.name}
                    </p>
                    {topWinner ? (
                      <p className="text-xs text-white/40 font-mono truncate mt-0.5">
                        ▶ {topWinner.driver_name} · {topWinner.car_name}
                      </p>
                    ) : (
                      <p className="text-xs text-white/20 font-mono mt-0.5">
                        — no data —
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  {topWinner && (
                    <span
                      className="text-xs font-mono font-bold shrink-0"
                      style={{ color: territory.is_active ? territory.color : territory.color + '66' }}
                    >
                      {topWinner.points}pt
                    </span>
                  )}

                  {/* Active indicator */}
                  {territory.is_active && (
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                      style={{ background: '#00ff88', boxShadow: '0 0 4px #00ff88' }}
                    />
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 shrink-0 border-t border-white/5">
        <p className="text-white/20 text-xs font-mono tracking-widest text-center">
          CLICK TERRITORY TO INSPECT
        </p>
      </div>
    </div>
  )
}