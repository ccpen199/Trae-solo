import { useState } from 'react'
import { dashboardStats } from '@/data'

type ChartTheme = 'dark' | 'light'

interface HeatMapProps {
  theme?: ChartTheme
}

const townshipShapes = [
  { name: '乌峰街道', points: '155,35 215,25 245,55 225,95 165,85 135,55' },
  { name: '南台街道', points: '135,165 195,155 225,195 195,235 145,225' },
  { name: '旧府街道', points: '140,95 200,88 210,140 170,160 130,140' },
  { name: '以勒镇', points: '275,45 345,35 365,95 325,125 265,105' },
  { name: '泼机镇', points: '200,205 270,195 280,255 240,285 195,265' },
  { name: '赤水源镇', points: '35,30 115,20 125,65 95,85 35,75' },
  { name: '芒部镇', points: '95,5 150,0 160,35 130,50 85,35' },
  { name: '大湾镇', points: '295,155 365,145 385,205 345,235 295,215' },
  { name: '塘房镇', points: '25,135 95,125 105,175 75,195 25,185' },
  { name: '五德镇', points: '25,75 85,70 95,115 65,135 25,125' },
]

const maxUsers = Math.max(...dashboardStats.activeTownships.map(t => t.activeUsers))

function getColorDark(activeUsers: number): string {
  const ratio = activeUsers / maxUsers
  if (ratio > 0.8) return '#0C4F3A'
  if (ratio > 0.6) return '#0A6346'
  if (ratio > 0.4) return '#0D9B6A'
  if (ratio > 0.2) return '#3EC093'
  return '#76D9B3'
}

function getColorLight(activeUsers: number): string {
  const ratio = activeUsers / maxUsers
  if (ratio > 0.8) return '#0A6346'
  if (ratio > 0.6) return '#0D9B6A'
  if (ratio > 0.4) return '#3EC093'
  if (ratio > 0.2) return '#76D9B3'
  return '#ACEBD0'
}

export default function TownshipHeatMap({ theme = 'dark' }: HeatMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const getColor = theme === 'light' ? getColorLight : getColorDark
  const strokeColor = theme === 'light' ? '#D1D9E6' : '#1A2332'
  const textColor = theme === 'light' ? '#FFFFFF' : 'white'
  const tooltipBg = theme === 'light' ? 'bg-white border-rock-200' : 'bg-rock-800 border-rock-600'
  const tooltipText = theme === 'light' ? 'text-rock-900' : 'text-white'

  const handleHover = (name: string, e: React.MouseEvent) => {
    setHovered(name)
    const svg = e.currentTarget.closest('svg')
    if (svg) {
      const rect = svg.getBoundingClientRect()
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 400 300" className="w-full">
        {townshipShapes.map((shape) => {
          const township = dashboardStats.activeTownships.find(t => t.name === shape.name)
          const activeUsers = township?.activeUsers || 0
          return (
            <polygon
              key={shape.name}
              points={shape.points}
              fill={getColor(activeUsers)}
              stroke={strokeColor}
              strokeWidth={1.5}
              opacity={hovered === shape.name ? 1 : 0.85}
              className="transition-opacity duration-200 cursor-pointer"
              onMouseEnter={(e) => handleHover(shape.name, e)}
              onMouseMove={(e) => handleHover(shape.name, e)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
        {townshipShapes.map((shape) => {
          const pts = shape.points.split(' ').map(p => p.split(',').map(Number))
          const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
          const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
          return (
            <text
              key={shape.name}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill={textColor}
              fontSize={10}
              opacity={0.95}
              className="pointer-events-none select-none"
            >
              {shape.name.replace(/街道|镇/, '')}
            </text>
          )
        })}
      </svg>
      {hovered && (() => {
        const township = dashboardStats.activeTownships.find(t => t.name === hovered)
        return township ? (
          <div
            className={`absolute ${tooltipBg} border rounded-lg px-3 py-2 shadow-xl pointer-events-none z-10 text-sm whitespace-nowrap`}
            style={{ left: tooltipPos.x, top: tooltipPos.y - 70, transform: 'translateX(-50%)' }}
          >
            <p className={`${tooltipText} font-medium`}>{township.name}</p>
            <p className="text-jade-500 font-number">{township.activeUsers.toLocaleString()} 活跃用户</p>
            <p className="text-ember-500 font-number">{township.postCount} 帖子</p>
          </div>
        ) : null
      })()}
    </div>
  )
}
