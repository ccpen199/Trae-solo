interface StatusCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down'
  trendValue?: string
  color?: string
}

export default function StatusCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  color = '#0052D9',
}: StatusCardProps) {
  return (
    <div className="status-card">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {trend && trendValue && (
        <div
          className={`text-xs mt-2 ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </div>
  )
}
