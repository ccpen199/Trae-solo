import React from 'react';
import { Card, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = '#1890ff',
  onClick,
}) => {
  const isPositive = (trend || 0) >= 0;

  return (
    <Card
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderTop: `3px solid ${color}` }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>{title}</Text>
          {icon && <span style={{ fontSize: '24px', color }}>{icon}</span>}
        </Space>
        
        <Title level={3} style={{ margin: 0, color: '#262626' }}>{value}</Title>
        
        {trend !== undefined && (
          <Space align="center">
            {isPositive ? (
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
            )}
            <Text style={{ color: isPositive ? '#52c41a' : '#ff4d4f', fontSize: '12px' }}>
              {Math.abs(trend)}%
            </Text>
            {trendLabel && <Text type="secondary" style={{ fontSize: '12px' }}>{trendLabel}</Text>}
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default StatCard;
