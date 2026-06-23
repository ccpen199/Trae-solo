import * as React from 'react'
import { cn } from '@/lib/utils'

export interface RadarDimension {
  key: string
  label: string
  value: number
}

export interface RadarChartProps extends React.SVGAttributes<SVGSVGElement> {
  dimensions: RadarDimension[]
  size?: number
  levels?: number
  fillColor?: string
  strokeColor?: string
  pointColor?: string
}

export const RadarChart = React.forwardRef<SVGSVGElement, RadarChartProps>(
  (
    {
      className,
      dimensions,
      size = 280,
      levels = 4,
      fillColor = 'rgba(26, 58, 58, 0.3)',
      strokeColor = '#2a5d56',
      pointColor = '#3a7a71',
      ...props
    },
    ref
  ) => {
    const [animated, setAnimated] = React.useState(false)
    const center = size / 2
    const radius = size / 2 - 40
    const sides = 5
    const angleStep = (Math.PI * 2) / sides

    React.useEffect(() => {
      const timer = setTimeout(() => setAnimated(true), 100)
      return () => clearTimeout(timer)
    }, [])

    const getPoint = (index: number, value: number) => {
      const angle = index * angleStep - Math.PI / 2
      const r = (radius * Math.min(100, Math.max(0, value))) / 100
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      }
    }

    const getLabelPoint = (index: number) => {
      const angle = index * angleStep - Math.PI / 2
      const r = radius + 24
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      }
    }

    const gridPoints = React.useMemo(() => {
      const result: string[] = []
      for (let level = levels; level >= 1; level--) {
        const r = (radius * level) / levels
        const points = Array.from({ length: sides }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
        })
        result.push(points.join(' '))
      }
      return result
    }, [center, radius, sides, angleStep, levels])

    const axisLines = React.useMemo(() => {
      return Array.from({ length: sides }, (_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return {
          x1: center,
          y1: center,
          x2: center + radius * Math.cos(angle),
          y2: center + radius * Math.sin(angle),
        }
      })
    }, [center, radius, sides, angleStep])

    const dataPoints = animated
      ? dimensions.map((d, i) => getPoint(i, d.value))
      : dimensions.map((d, i) => getPoint(i, 0))

    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'

    return (
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn(className)} {...props}>
        {gridPoints.map((points, i) => (
          <polygon key={`grid-${i}`} points={points} fill="none" stroke="#d4c4a6" strokeWidth={1} />
        ))}
        {axisLines.map((line, i) => (
          <line key={`axis-${i}`} {...line} stroke="#e8ddc9" strokeWidth={1} />
        ))}
        <path
          d={dataPath}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          style={{ transition: 'all 1s ease-out' }}
        />
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={pointColor}
            stroke="white"
            strokeWidth={1.5}
            style={{ transition: 'all 1s ease-out' }}
          />
        ))}
        {dimensions.map((d, i) => {
          const point = getLabelPoint(i)
          return (
            <text
              key={`label-${i}`}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-700 font-serif text-sm font-medium"
            >
              {d.label}
              <tspan x={point.x} dy={14} className="fill-jade-700 text-xs font-bold">
                {Math.round(d.value)}
              </tspan>
            </text>
          )
        })}
      </svg>
    )
  }
)
RadarChart.displayName = 'RadarChart'
