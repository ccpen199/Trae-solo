import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dashboardStats } from '@/data'

type ChartTheme = 'dark' | 'light'

interface ChartProps {
  theme?: ChartTheme
}

const getColors = (theme: ChartTheme) => {
  if (theme === 'light') {
    return {
      tooltipBg: '#FFFFFF',
      tooltipBorder: '#D1D9E6',
      tooltipText: '#1A2332',
      labelColor: '#6B7F9E',
      gridColor: '#E8ECF2',
      axisLine: '#D1D9E6',
      tickColor: '#6B7F9E',
      legendColor: '#46536B',
    }
  }
  return {
    tooltipBg: '#3D4759',
    tooltipBorder: '#46536B',
    tooltipText: '#F5F7FA',
    labelColor: '#8A9BB8',
    gridColor: '#2D3748',
    axisLine: '#46536B',
    tickColor: '#8A9BB8',
    legendColor: '#8A9BB8',
  }
}

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

export function HotCategoriesChart({ theme = 'dark' }: ChartProps) {
  const colors = getColors(theme)
  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: '8px',
    color: colors.tooltipText,
  }
  const labelStyle = { color: colors.labelColor }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={dashboardStats.hotCategories}
        margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
        <XAxis
          dataKey="name"
          tick={{ fill: colors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: colors.axisLine }}
        />
        <YAxis
          tick={{ fill: colors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: colors.axisLine }}
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

export function UpdateTrendChart({ theme = 'dark' }: ChartProps) {
  const colors = getColors(theme)
  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: '8px',
    color: colors.tooltipText,
  }
  const labelStyle = { color: colors.labelColor }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={dashboardStats.updateFrequency}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
        <XAxis
          dataKey="date"
          tick={{ fill: colors.tickColor, fontSize: 11 }}
          axisLine={{ stroke: colors.axisLine }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          tick={{ fill: colors.tickColor, fontSize: 12 }}
          axisLine={{ stroke: colors.axisLine }}
        />
        <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
        <Legend wrapperStyle={{ color: colors.legendColor }} />
        <Line type="monotone" dataKey="jobs" stroke="#0D9B6A" name="招聘" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="housing" stroke="#3B82F6" name="房产" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="food" stroke="#F28C38" name="美食" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="dating" stroke="#F472B6" name="交友" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
