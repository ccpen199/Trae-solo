import { useEffect, useRef, useState } from 'react';
import { BellOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { RealtimeAlarm } from '../../../services/api/analytics';
import './RealtimeAlarms.css';

interface RealtimeAlarmsProps {
  data: RealtimeAlarm[];
}

const levelColors: Record<string, { bg: string; border: string; text: string }> = {
  critical: {
    bg: 'rgba(255, 71, 87, 0.15)',
    border: 'rgba(255, 71, 87, 0.5)',
    text: '#ff4757',
  },
  major: {
    bg: 'rgba(255, 165, 0, 0.15)',
    border: 'rgba(255, 165, 0, 0.5)',
    text: '#ffa500',
  },
  minor: {
    bg: 'rgba(255, 215, 0, 0.15)',
    border: 'rgba(255, 215, 0, 0.5)',
    text: '#ffd700',
  },
  warning: {
    bg: 'rgba(0, 212, 255, 0.15)',
    border: 'rgba(0, 212, 255, 0.5)',
    text: '#00d4ff',
  },
  info: {
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.5)',
    text: '#a855f7',
  },
};

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: '#ff4757' },
  processing: { text: '处理中', color: '#ffa500' },
  resolved: { text: '已解决', color: '#00ff88' },
};

const AlarmItem = ({ alarm, index }: { alarm: RealtimeAlarm; index: number }) => {
  const colors = levelColors[alarm.level] || levelColors.info;
  const status = statusMap[alarm.status] || statusMap.pending;
  const isCritical = alarm.level === 'critical' || alarm.level === 'major';

  return (
    <div
      className={`alarm-item ${isCritical ? 'alarm-critical' : ''}`}
      style={{
        animationDelay: `${index * 0.1}s`,
        borderLeftColor: colors.text,
      }}
    >
      <div className="alarm-item-header">
        <div className="alarm-level-badge" style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
          {alarm.levelName}
        </div>
        <div className="alarm-status" style={{ color: status.color }}>
          {status.text}
        </div>
      </div>

      <div className="alarm-item-content">
        <div className="alarm-place">
          <EnvironmentOutlined style={{ color: '#00d4ff', marginRight: '6px' }} />
          <span>{alarm.placeName}</span>
        </div>
        <div className="alarm-type">{alarm.alarmType}</div>
        <div className="alarm-message">{alarm.content}</div>
      </div>

      <div className="alarm-item-footer">
        <div className="alarm-time">
          <ClockCircleOutlined style={{ color: 'rgba(224, 230, 237, 0.5)', marginRight: '4px' }} />
          {alarm.time}
        </div>
        {isCritical && (
          <div className="alarm-pulse" style={{ background: colors.text }}>
            <BellOutlined />
          </div>
        )}
      </div>

      {isCritical && <div className="alarm-glow" style={{ background: colors.text }} />}
    </div>
  );
};

const RealtimeAlarms = ({ data }: RealtimeAlarmsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (!scrollRef.current || data.length === 0 || isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const container = scrollRef.current;
    const scrollSpeed = 0.5;

    const scroll = () => {
      if (!container || isPaused) return;

      scrollPositionRef.current += scrollSpeed;

      if (scrollPositionRef.current >= container.scrollHeight / 2) {
        scrollPositionRef.current = 0;
      }

      container.scrollTop = scrollPositionRef.current;
      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data.length, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const criticalCount = data.filter(a => a.level === 'critical' || a.level === 'major').length;
  const pendingCount = data.filter(a => a.status === 'pending').length;

  return (
    <div className="realtime-alarms-container">
      <div className="alarms-stats">
        <div className="alarm-stat-item">
          <span className="stat-value critical">{criticalCount}</span>
          <span className="stat-label">紧急/重大</span>
        </div>
        <div className="alarm-stat-item">
          <span className="stat-value warning">{pendingCount}</span>
          <span className="stat-label">待处理</span>
        </div>
        <div className="alarm-stat-item">
          <span className="stat-value info">{data.length}</span>
          <span className="stat-label">总计</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="alarms-scroll-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="alarms-list">
          {[...data, ...data].map((alarm, index) => (
            <AlarmItem key={`${alarm.id}-${index}`} alarm={alarm} index={index % data.length} />
          ))}
        </div>
      </div>

      <div className="alarms-scroll-hint">
        <span>滚动查看更多 · 鼠标悬停暂停</span>
      </div>
    </div>
  );
};

export default RealtimeAlarms;
