import React from 'react'
import { Card, Space, Typography, Tooltip } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

/**
 * 数据卡片组件
 * 展示图标、标题、数值、变化率
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 图标
 * @param {string} props.title - 标题
 * @param {string|number} props.value - 数值
 * @param {string} [props.unit] - 单位
 * @param {number} [props.changeRate] - 变化率百分比
 * @param {string} [props.tooltip] - 提示信息
 * @param {string} [props.color] - 主题色
 * @param {Object} [props.style] - 自定义样式
 */

const DataCard = ({
  icon,
  title,
  value,
  unit,
  changeRate,
  tooltip,
  color = '#1677ff',
  style
}) => {
  const isPositive = changeRate > 0
  const isNegative = changeRate < 0

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ...style
  }

  const iconWrapperStyle = {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color
  }

  return (
    <Card
      hoverable
      style={cardStyle}
      styles={{ body: {  padding: 16 } }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Space size={10} align="center">
            <div style={iconWrapperStyle}>{icon}</div>
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 13 }}>
                {title}
              </Text>
              {tooltip && (
                <Tooltip title={tooltip}>
                  <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                </Tooltip>
              )}
            </Space>
          </Space>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}
        >
          <Space size={4} align="baseline">
            <Title
              level={3}
              style={{
                margin: 0,
                color: '#1f1f1f',
                fontSize: 28,
                fontWeight: 600
              }}
            >
              {value}
            </Title>
            {unit && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {unit}
              </Text>
            )}
          </Space>

          {changeRate !== undefined && (
            <Space size={2} align="center">
              {isPositive && (
                <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12 }} />
              )}
              {isNegative && (
                <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
              )}
              <Text
                style={{
                  color: isPositive ? '#52c41a' : isNegative ? '#ff4d4f' : '#8c8c8c',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {Math.abs(changeRate)}%
              </Text>
            </Space>
          )}
        </div>
      </Space>
    </Card>
  )
}

export default DataCard
