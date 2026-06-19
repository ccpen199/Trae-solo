import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}

const StatsCard = ({ title, value, icon, trend, prefix = '', suffix = '', color = '#1890ff' }: StatsCardProps) => {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className="stats-card" bodyStyle={{ padding: 20 }} style={{ borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 12, fontWeight: 500 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#1f1f1f', marginBottom: 8 }}>
            {prefix}
            {value}
            {suffix}
          </div>
          {trend !== undefined && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: isPositive ? '#52c41a' : '#ff4d4f',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: 4,
                background: isPositive ? 'rgba(82,196,26,0.08)' : 'rgba(255,77,79,0.08)',
              }}
            >
              {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{Math.abs(trend)}% 环比</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: 28,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
