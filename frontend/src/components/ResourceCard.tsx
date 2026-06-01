import { Card, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface ResourceCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  trend?: 'up' | 'down' | null
}

export default function ResourceCard({ icon, title, value, trend }: ResourceCardProps) {
  return (
    <Card hoverable>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            fontSize: 32,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: '#f0f5ff',
            color: '#1677ff',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
            {title}
          </Typography.Text>
          <Typography.Title level={3} style={{ margin: '4px 0 0' }}>
            {value}
          </Typography.Title>
        </div>
        {trend && (
          <div style={{ fontSize: 18 }}>
            {trend === 'up' ? (
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
