import { Card, Statistic } from 'antd'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  prefix?: ReactNode
  suffix?: string
  precision?: number
  color?: string
  onClick?: () => void
}

function StatCard({ title, value, prefix, suffix, precision = 0, color = '#1890ff', onClick }: StatCardProps) {
  return (
    <Card hoverable onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color }}
      />
    </Card>
  )
}

export default StatCard
