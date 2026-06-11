import React from 'react'
import { Card } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

function StatCard({ title, value, unit, trend, trendValue, icon, color = '#1890ff' }) {
  return (
    <Card className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
        {icon && <span style={{ fontSize: '32px', color }}>{icon}</span>}
        <div>
          <div className="stat-value" style={{ color }}>
            {value}{unit && <span style={{ fontSize: '16px', marginLeft: '4px' }}>{unit}</span>}
          </div>
          <div className="stat-label">{title}</div>
        </div>
      </div>
      {trend !== undefined && (
        <div style={{
          color: trend === 'up' ? '#52c41a' : '#ff4d4f',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {trendValue || 0}% 较上周
        </div>
      )}
    </Card>
  )
}

export default StatCard
