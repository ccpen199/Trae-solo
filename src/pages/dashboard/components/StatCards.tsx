import { useEffect, useState, useRef } from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import {
  ShopOutlined,
  CloudServerOutlined,
  TeamOutlined,
  BellOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { DashboardOverview } from '../../../services/api/analytics';
import './StatCards.css';

interface StatCardsProps {
  data?: DashboardOverview;
}

interface StatCardConfig {
  key: keyof DashboardOverview;
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  trendKey: keyof DashboardOverview;
}

const AnimatedNumber = ({ value, duration = 1500, suffix = '' }: { value: number; duration?: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValueRef.current + (value - startValueRef.current) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [value, duration]);

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万';
    }
    return num.toLocaleString();
  };

  return <span className="animated-number">{formatNumber(displayValue)}{suffix}</span>;
};

const StatCards = ({ data }: StatCardsProps) => {
  const cardConfigs: StatCardConfig[] = [
    {
      key: 'totalPlaces',
      label: '场所总数',
      unit: '家',
      icon: <ShopOutlined />,
      color: '#00d4ff',
      gradient: 'linear-gradient(135deg, #00d4ff, #0080ff)',
      trendKey: 'placeCountTrend',
    },
    {
      key: 'onlinePlaces',
      label: '在线场所',
      unit: '家',
      icon: <CloudServerOutlined />,
      color: '#00ff88',
      gradient: 'linear-gradient(135deg, #00ff88, #00cc6a)',
      trendKey: 'onlineRateTrend',
    },
    {
      key: 'todayVisitors',
      label: '今日客流',
      unit: '人次',
      icon: <TeamOutlined />,
      color: '#ffd700',
      gradient: 'linear-gradient(135deg, #ffd700, #ffaa00)',
      trendKey: 'visitorTrend',
    },
    {
      key: 'pendingAlarms',
      label: '待处理告警',
      unit: '条',
      icon: <BellOutlined />,
      color: '#ff4757',
      gradient: 'linear-gradient(135deg, #ff4757, #ff6b81)',
      trendKey: 'alarmTrend',
    },
    {
      key: 'inspectionCompletionRate',
      label: '巡检完成率',
      unit: '%',
      icon: <AuditOutlined />,
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      trendKey: 'inspectionTrend',
    },
  ];

  const getTrendIcon = (trend: number) => {
    if (trend >= 0) {
      return (
        <span className="trend-up">
          <ArrowUpOutlined /> {Math.abs(trend)}%
        </span>
      );
    }
    return (
      <span className="trend-down">
        <ArrowDownOutlined /> {Math.abs(trend)}%
      </span>
    );
  };

  return (
    <div className="stat-cards-container">
      {cardConfigs.map((config, index) => {
        const value = data?.[config.key] ?? 0;
        const trend = data?.[config.trendKey] ?? 0;
        const displayValue = config.key === 'inspectionCompletionRate' ? value : value;

        return (
          <div key={config.key} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="stat-card-glow" style={{ background: config.gradient }} />
            <div className="stat-card-inner">
              <div className="stat-card-header">
                <div className="stat-card-icon" style={{ background: config.gradient }}>
                  {config.icon}
                </div>
                <div className="stat-card-trend" style={{ color: trend >= 0 ? '#00ff88' : '#ff4757' }}>
                  {config.key !== 'pendingAlarms' ? getTrendIcon(trend) : getTrendIcon(-trend)}
                </div>
              </div>
              <div className="stat-card-value">
                <AnimatedNumber
                  value={displayValue}
                  suffix={config.unit}
                />
              </div>
              <div className="stat-card-label">{config.label}</div>
              {config.key === 'onlinePlaces' && data && (
                <div className="stat-card-extra">
                  在线率: {(data.onlinePlaces / data.totalPlaces * 100).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="stat-card-decoration" style={{ borderColor: config.color }} />
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
