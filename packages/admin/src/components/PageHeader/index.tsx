import { Card, Typography, Space } from 'antd'
import type { ReactNode } from 'react'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: ReactNode
  children?: ReactNode
}

function PageHeader({ title, subtitle, extra, children }: PageHeaderProps) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle && <span style={{ color: '#666' }}>{subtitle}</span>}
        </Space>
        {extra && <div>{extra}</div>}
      </div>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </Card>
  )
}

export default PageHeader
