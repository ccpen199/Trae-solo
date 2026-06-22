import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dashboardStats } from '@/data'

const tooltipStyle = {
  backgroundColor: '#3D4759',
  border: '1px solid #46536B',
  borderRadius: '8px',
  color: '#F5F7FA',
}

const labelStyle = { color: '#8A9BB8' }

interface TrendLabelProps {
  x?: number
  y?: number
  width?: number
  payload?: { trend: number }
}

function renderTrendLabel(props: TrendLabelProps) {
  const { x = 0, y = 0, width = 0, payload } = props
  if (!payload?.trend) return null
  const positive = payload.trend > 0
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fill={positive ? '#0D9B6A' : '#F28C38'}
      fontSize={11}
      fontWeight={600}
    >
      {positive ? '↑' : '↓'}{Math.abs(payload.trend)}%
    </text>
  )
}

export function HotCategoriesChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={dashboardStats.hotCategories}
        margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#8A9BB8', fontSize: 12 }}
          axisLine={{ stroke: '#46536B' }}
        />
        <YAxis
          tick={{ fill: '#8A9BB8', fontSize: 12 }}
          axisLine={{ stroke: '#46536B' }}
        />
        <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
        <Bar
          dataKey="count"
          fill="#0D9B6A"
          radius={[4, 4, 0, 0]}
          label={renderTrendLabel}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function UpdateTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={dashboardStats.updateFrequency}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8A9BB8', fontSize: 11 }}
          axisLine={{ stroke: '#46536B' }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          tick={{ fill: '#8A9BB8', fontSize: 12 }}
          axisLine={{ stroke: '#46536B' }}
        />
        <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
        <Legend wrapperStyle={{ color: '#8A9BB8' }} />
        <Line type="monotone" dataKey="jobs" stroke="#0D9B6A" name="招聘" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="housing" stroke="#3B82F6" name="房产" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="food" stroke="#F28C38" name="美食" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="dating" stroke="#F472B6" name="交友" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
