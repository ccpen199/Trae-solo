import { useState } from 'react'
import { type Institution } from './data'

interface MapViewProps {
  institutions: Institution[]
  onSelect: (inst: Institution) => void
}

const markerPositions = [
  { left: '25%', top: '30%' },
  { left: '55%', top: '20%' },
  { left: '70%', top: '55%' },
  { left: '35%', top: '65%' },
]

export default function MapView({ institutions, onSelect }: MapViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 border border-gray-100">
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute inset-0">
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 150 Q100 80 200 120 T350 100" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M80 250 Q150 180 250 200 T380 160" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
          <rect x="140" y="90" width="120" height="80" rx="8" fill="#e2e8f0" fillOpacity="0.3" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="60" y="170" width="80" height="60" rx="6" fill="#e2e8f0" fillOpacity="0.3" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      </div>

      {institutions.map((inst, idx) => {
        const pos = markerPositions[idx] || { left: '50%', top: '50%' }
        return (
          <div
            key={inst.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: pos.left, top: pos.top }}
            onMouseEnter={() => setHoveredId(inst.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect(inst)}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg ring-2 ring-white transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div className="absolute w-3 h-3 bg-primary rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
            </div>
            {hoveredId === inst.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-100 whitespace-nowrap z-10">
                <p className="text-sm font-medium text-gray-900">{inst.name}</p>
                <p className="text-xs text-gray-500">{inst.distance}km · {inst.level || '未定级'}</p>
              </div>
            )}
          </div>
        )
      })}

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500">共 {institutions.length} 家机构</p>
      </div>
    </div>
  )
}
