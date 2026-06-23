import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AgeDistributionProps {
  data: Record<string, number>
  className?: string
  height?: number
}

const defaultLabels = [
  { key: 'before60', label: '60前' },
  { key: '60-70', label: '60-70' },
  { key: '70-80', label: '70-80' },
  { key: '80-90', label: '80-90' },
  { key: '90-00', label: '90-00' },
  { key: '00-10', label: '00-10' },
  { key: 'after10', label: '10后' },
]

export function AgeDistribution({ data, className, height = 160 }: AgeDistributionProps) {
  const values = defaultLabels.map((item) => data[item.key] || 0)
  const maxValue = Math.max(...values, 1)
  const width = 400
  const padding = { top: 16, right: 12, bottom: 32, left: 12 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const barWidth = (chartWidth / defaultLabels.length) * 0.6
  const gap = (chartWidth / defaultLabels.length) * 0.4

  return (
    <div className={cn('w-full', className)}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="ageBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a7a71" />
            <stop offset="100%" stopColor="#1a3a3a" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - ratio)}
            x2={width - padding.right}
            y2={padding.top + chartHeight * (1 - ratio)}
            stroke="#e8ddc9"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        ))}
        {defaultLabels.map((item, index) => {
          const value = values[index]
          const barHeight = (value / maxValue) * chartHeight
          const x = padding.left + index * (barWidth + gap) + gap / 2
          const y = padding.top + chartHeight - barHeight
          return (
            <g key={item.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#ageBarGradient)"
                rx={3}
                style={{ transition: 'all 0.8s ease-out' }}
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-ink-600 text-[10px] font-mono"
              >
                {value > 0 ? value : ''}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="fill-ink-500 text-[10px]"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default AgeDistribution
