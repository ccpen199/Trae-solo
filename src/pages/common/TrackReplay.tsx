import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Slider, Card, Tag, List, Avatar, Tooltip, Space, Typography } from 'antd';
import {
  Gauge,
  Play as PlayIcon,
  Pause as PlayIcon_ignore,
  Pause as PauseIcon,
  FastForward,
  AlertTriangle,
  Fuel,
  MapPin,
  Navigation,
  X,
  Clock,
  Info,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const { Text } = Typography;

export interface TrackPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
  status?: 'normal' | 'slow' | 'stop' | 'overspeed';
}

export interface TrackAlarm {
  id: string;
  type: 'overspeed' | 'fatigue' | 'deviation' | 'stop' | 'fuel_abnormal';
  timestamp: number;
  position: { lat: number; lng: number };
  description: string;
  level: 'warning' | 'danger' | 'info';
}

export interface TrackReplayProps {
  trackPoints?: TrackPoint[];
  alarms?: TrackAlarm[];
  driverName?: string;
  orderNo?: string;
  startCity?: string;
  endCity?: string;
  startTime?: string;
  endTime?: string;
  className?: string;
  mode?: 'admin' | 'driver' | 'shipper';
}

const DEFAULT_POINTS: TrackPoint[] = (() => {
  const points: TrackPoint[] = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseLng = 116.4074 + (121.4737 - 116.4074) * t;
    const baseLat = 39.9042 + (31.2304 - 39.9042) * t;
    const speed = Math.max(
      0,
      Math.min(120, 70 + Math.sin(t * Math.PI * 4) * 30 + Math.random() * 15 - 7.5)
    );
    let status: TrackPoint['status'] = 'normal';
    if (speed < 10) status = 'stop';
    else if (speed < 30) status = 'slow';
    else if (speed > 100) status = 'overspeed';
    points.push({
      lat: baseLat + (Math.random() - 0.5) * 0.3,
      lng: baseLng + (Math.random() - 0.5) * 0.3,
      speed,
      timestamp: 1717800000 + i * 180,
      status,
    });
  }
  return points;
})();

const DEFAULT_ALARMS: TrackAlarm[] = [
  {
    id: 'A001',
    type: 'overspeed',
    timestamp: 1717803600,
    position: { lat: 38.5, lng: 118.2 },
    description: '超速行驶：当前速度112km/h，限速100km/h',
    level: 'danger',
  },
  {
    id: 'A002',
    type: 'stop',
    timestamp: 1717807200,
    position: { lat: 36.8, lng: 119.0 },
    description: '异常停留：在服务区停留超过45分钟',
    level: 'warning',
  },
  {
    id: 'A003',
    type: 'fatigue',
    timestamp: 1717810800,
    position: { lat: 34.2, lng: 120.1 },
    description: '疲劳驾驶：连续驾驶4.2小时未休息',
    level: 'danger',
  },
  {
    id: 'A004',
    type: 'deviation',
    timestamp: 1717814400,
    position: { lat: 32.5, lng: 120.8 },
    description: '路线偏离：偏离规划路线2.3公里',
    level: 'warning',
  },
  {
    id: 'A005',
    type: 'fuel_abnormal',
    timestamp: 1717818000,
    position: { lat: 31.8, lng: 121.2 },
    description: '油耗异常：瞬时油耗较均值偏高35%',
    level: 'info',
  },
];

const getSpeedColor = (speed: number): string => {
  if (speed < 10) return '#EF4444';
  if (speed < 40) return '#F59E0B';
  return '#10B981';
};

const getAlarmColor = (level: TrackAlarm['level']): string => {
  switch (level) {
    case 'danger':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    default:
      return '#3B82F6';
  }
};

const getAlarmIcon = (type: TrackAlarm['type']) => {
  switch (type) {
    case 'overspeed':
    case 'fatigue':
      return <AlertTriangle size={14} />;
    case 'fuel_abnormal':
      return <Fuel size={14} />;
    case 'deviation':
      return <Navigation size={14} />;
    case 'stop':
      return <MapPin size={14} />;
    default:
      return <Info size={14} />;
  }
};

const formatTime = (ts: number): string => {
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

const TrackReplay: React.FC<TrackReplayProps> = ({
  trackPoints = DEFAULT_POINTS,
  alarms = DEFAULT_ALARMS,
  driverName = '张师傅',
  orderNo = 'YD202406070001',
  startCity = '北京',
  endCity = '上海',
  startTime = '2024-06-07 08:00',
  endTime = '2024-06-07 14:00',
  className = '',
  mode = 'admin',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [progress, setProgress] = useState(0);
  const [hoveredAlarm, setHoveredAlarm] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const totalDuration = useMemo(() => {
    if (trackPoints.length < 2) return 1;
    return trackPoints[trackPoints.length - 1].timestamp - trackPoints[0].timestamp;
  }, [trackPoints]);

  const currentIndex = useMemo(() => {
    return Math.min(trackPoints.length - 1, Math.floor(progress * (trackPoints.length - 1)));
  }, [progress, trackPoints.length]);

  const currentPoint = trackPoints[currentIndex] || trackPoints[0];
  const currentTs = currentPoint?.timestamp || 0;

  const gaugeOption = useMemo(
    () => ({
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          center: ['50%', '62%'],
          radius: '90%',
          min: 0,
          max: 140,
          splitNumber: 7,
          itemStyle: {
            color: getSpeedColor(currentPoint?.speed || 0),
            shadowColor: getSpeedColor(currentPoint?.speed || 0),
            shadowBlur: 10,
          },
          progress: { show: true, width: 10 },
          pointer: { show: false },
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.28, '#EF4444'],
                [0.71, '#F59E0B'],
                [1, '#10B981'],
              ],
            },
          },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { color: '#fff', opacity: 0.6 } },
          axisLabel: {
            color: '#fff',
            fontSize: 10,
            distance: -18,
            opacity: 0.7,
          },
          anchor: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 22,
            fontWeight: 'bold',
            offsetCenter: [0, '10%'],
            formatter: '{value} km/h',
            color: '#fff',
          },
          data: [{ value: Math.round(currentPoint?.speed || 0) }],
        },
      ],
    }),
    [currentPoint?.speed]
  );

  const viewBox = useMemo(() => {
    const lngs = trackPoints.map((p) => p.lng);
    const lats = trackPoints.map((p) => p.lat);
    const minLng = Math.min(...lngs) - 0.5;
    const maxLng = Math.max(...lngs) + 0.5;
    const minLat = Math.min(...lats) - 0.5;
    const maxLat = Math.max(...lats) + 0.5;
    return { minLng, maxLng, minLat, maxLat };
  }, [trackPoints]);

  const project = (lng: number, lat: number): { x: number; y: number } => {
    const w = 800;
    const h = 500;
    const x = ((lng - viewBox.minLng) / (viewBox.maxLng - viewBox.minLng)) * w;
    const y = h - ((lat - viewBox.minLat) / (viewBox.maxLat - viewBox.minLat)) * h;
    return { x, y };
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const animate = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const delta = ts - lastTickRef.current;
      lastTickRef.current = ts;

      const stepPerMs = (speed / 10000) * 0.001;
      setProgress((prev) => {
        const next = prev + delta * stepPerMs;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTickRef.current = 0;
    };
  }, [isPlaying, speed]);

  const handleAlarmClick = (alarm: TrackAlarm) => {
    const idx = trackPoints.findIndex((p) => p.timestamp >= alarm.timestamp);
    if (idx >= 0) {
      setProgress(idx / (trackPoints.length - 1));
      setIsPlaying(false);
    }
  };

  const stopPoints = useMemo(
    () => trackPoints.filter((p, i) => p.speed < 10 && (i === 0 || trackPoints[i - 1].speed >= 10)),
    [trackPoints]
  );

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-deep-blue-800/90 to-deep-blue-950/90 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Navigation size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">轨迹回放</div>
            <div className="text-xs text-white/50">
              {orderNo} · {driverName} · {startCity} → {endCity}
            </div>
          </div>
        </div>
        <Space>
          <Tag color="blue" className="!rounded-md">
            <Clock size={11} className="inline mr-1" />
            {startTime} - {endTime}
          </Tag>
        </Space>
      </div>

      <div className="relative flex" style={{ height: 560 }}>
        <div className="w-64 flex-shrink-0 border-r border-white/10 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">异常事件</span>
              <Tag color="red" className="!rounded-md !text-xs">
                {alarms.length}
              </Tag>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <List
              dataSource={alarms}
              renderItem={(alarm) => {
                const isActive =
                  currentTs >= alarm.timestamp &&
                  currentTs <= alarm.timestamp + 600;
                return (
                  <List.Item
                    className="!px-3 !py-2 cursor-pointer transition-colors"
                    style={{
                      background: isActive
                        ? 'rgba(255,107,26,0.12)'
                        : hoveredAlarm === alarm.id
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                      borderLeft: `3px solid ${getAlarmColor(alarm.level)}`,
                    }}
                    onClick={() => handleAlarmClick(alarm)}
                    onMouseEnter={() => setHoveredAlarm(alarm.id)}
                    onMouseLeave={() => setHoveredAlarm(null)}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: getAlarmColor(alarm.level) }}
                        >
                          {getAlarmIcon(alarm.type)}
                          <span className="capitalize">{alarm.type}</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          {formatTime(alarm.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 leading-snug m-0 line-clamp-2">
                        {alarm.description}
                      </p>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </div>

        <div className="flex-1 relative bg-gradient-to-br from-deep-blue-950 via-deep-blue-900 to-deep-blue-800 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`h${i}`}
                className="absolute left-0 right-0 border-t border-primary-orange/30"
                style={{ top: `${i * 5}%` }}
              />
            ))}
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={`v${i}`}
                className="absolute top-0 bottom-0 border-l border-primary-orange/30"
                style={{ left: `${i * 3.125}%` }}
              />
            ))}
          </div>

          <svg viewBox="0 0 800 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <polyline
              points={trackPoints.map((p) => {
                const { x, y } = project(p.lng, p.lat);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {trackPoints.slice(0, currentIndex + 1).map((p, i) => {
              if (i % 3 !== 0 && i !== currentIndex) return null;
              const { x, y } = project(p.lng, p.lat);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={2.5}
                  fill={getSpeedColor(p.speed)}
                  opacity={i === currentIndex ? 1 : 0.7}
                />
              );
            })}

            {stopPoints.map((p, i) => {
              const { x, y } = project(p.lng, p.lat);
              return (
                <g key={`stop-${i}`}>
                  <circle cx={x} cy={y} r={10} fill="#F59E0B" opacity={0.2}>
                    <animate attributeName="r" from="8" to="18" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={5} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} />
                </g>
              );
            })}

            {alarms.map((alarm) => {
              const { x, y } = project(alarm.position.lng, alarm.position.lat);
              const isMatched =
                hoveredAlarm === alarm.id ||
                (currentTs >= alarm.timestamp && currentTs <= alarm.timestamp + 600);
              return (
                <g key={alarm.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isMatched ? 14 : 10}
                    fill={getAlarmColor(alarm.level)}
                    opacity={0.25}
                  >
                    <animate attributeName="r" from="10" to="22" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle
                    cx={x}
                    cy={y}
                    r={isMatched ? 7 : 5}
                    fill={getAlarmColor(alarm.level)}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </g>
              );
            })}

            {(() => {
              const { x, y } = project(
                trackPoints[0].lng,
                trackPoints[0].lat
              );
              return (
                <g>
                  <circle cx={x} cy={y} r={8} fill="#10B981" opacity={0.3} />
                  <circle cx={x} cy={y} r={5} fill="#10B981" stroke="#fff" strokeWidth={2} />
                  <text x={x} y={y - 12} textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="bold">
                    起点
                  </text>
                </g>
              );
            })()}

            {(() => {
              const last = trackPoints[trackPoints.length - 1];
              const { x, y } = project(last.lng, last.lat);
              return (
                <g>
                  <circle cx={x} cy={y} r={8} fill="#EF4444" opacity={0.3} />
                  <circle cx={x} cy={y} r={5} fill="#EF4444" stroke="#fff" strokeWidth={2} />
                  <text x={x} y={y - 12} textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="bold">
                    终点
                  </text>
                </g>
              );
            })()}

            {(() => {
              const { x, y } = project(currentPoint.lng, currentPoint.lat);
              const angle =
                currentIndex > 0
                  ? (() => {
                      const prev = trackPoints[currentIndex - 1];
                      const { x: x2, y: y2 } = project(prev.lng, prev.lat);
                      return (Math.atan2(y - y2, x - x2) * 180) / Math.PI;
                    })()
                  : 0;
              return (
                <g transform={`translate(${x},${y}) rotate(${angle})`}>
                  <circle r={14} fill="#FF6B1A" opacity={0.25} filter="url(#glow)">
                    <animate attributeName="r" from="12" to="22" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  <polygon points="12,0 -8,-7 -4,0 -8,7" fill="#FF6B1A" stroke="#fff" strokeWidth={1.5} />
                </g>
              );
            })()}
          </svg>

          <div className="absolute top-3 right-3 w-44 rounded-xl overflow-hidden border border-white/10 bg-deep-blue-900/80 backdrop-blur">
            <div className="px-3 py-2 text-xs font-semibold text-white/80 border-b border-white/10 flex items-center gap-1.5">
              <Gauge size={12} className="text-primary-orange" />
              实时车速
            </div>
            <ReactECharts
              option={gaugeOption}
              style={{ height: 150 }}
              theme="dark"
              opts={{ renderer: 'canvas' }}
            />
          </div>

          <div className="absolute bottom-16 right-3 rounded-xl border border-white/10 bg-deep-blue-900/80 backdrop-blur p-3 text-xs">
            <div className="font-semibold text-white/80 mb-2 flex items-center gap-1.5">
              <Info size={12} className="text-primary-orange" />
              图例说明
            </div>
            <div className="space-y-1.5 text-white/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                正常行驶 (≥40km/h)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                低速行驶 (10-40km/h)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                停车/异常（小于10km/h）
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-white/10 mt-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-orange animate-pulse" />
                当前位置
              </div>
              <div className="flex items-center gap-2">
                <span className="relative inline-flex w-2.5 h-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-40 animate-ping" />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                </span>
                停留点
              </div>
              <div className="flex items-center gap-2">
                <span className="relative inline-flex w-2.5 h-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-40 animate-ping" />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-danger" />
                </span>
                告警事件
              </div>
            </div>
          </div>

          <div className="absolute top-3 left-3 rounded-xl border border-white/10 bg-deep-blue-900/80 backdrop-blur px-3 py-2 text-xs text-white/70 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/50">当前时间</span>
              <Text className="!m-0 !text-white font-mono font-semibold !text-sm">
                {formatTime(currentTs)}
              </Text>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/50">进度</span>
              <Text className="!m-0 !text-primary-orange font-mono font-semibold">
                {(progress * 100).toFixed(1)}%
              </Text>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/50">行驶里程</span>
              <Text className="!m-0 !text-success font-mono font-semibold">
                {(progress * 1206).toFixed(1)} km
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              type="primary"
              icon={isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              onClick={() => setIsPlaying((p) => !p)}
              className="!bg-gradient-primary !border-0 !rounded-lg !h-9 shadow-soft-orange"
            >
              {isPlaying ? '暂停' : '播放'}
            </Button>
            <Button
              size="small"
              className="!rounded-md !border-white/10"
              onClick={() => {
                setProgress(0);
                setIsPlaying(false);
              }}
              ghost
            >
              重置
            </Button>
          </div>

          <Space.Compact className="ml-2">
            {[1, 2, 4].map((s) => (
              <Button
                key={s}
                size="small"
                type={speed === s ? 'primary' : 'default'}
                className={
                  speed === s
                    ? '!bg-primary-orange !border-primary-orange !text-white'
                    : '!border-white/10'
                }
                ghost={speed !== s}
                onClick={() => setSpeed(s as 1 | 2 | 4)}
              >
                {s}x
              </Button>
            ))}
          </Space.Compact>

          <div className="flex-1 px-3">
            <Slider
              min={0}
              max={100}
              step={0.1}
              value={progress * 100}
              onChange={(v) => {
                setProgress((v as number) / 100);
                setIsPlaying(false);
              }}
              tooltip={{
                formatter: (v) => `${v?.toFixed(1)}% · ${formatTime(currentTs)}`,
              }}
              styles={{
                rail: {
                  background: 'rgba(255,255,255,0.1)',
                  height: 6,
                  borderRadius: 3,
                },
                track: {
                  background: 'linear-gradient(90deg, #10B981 0%, #F59E0B 60%, #EF4444 100%)',
                  height: 6,
                  borderRadius: 3,
                },
                handle: {
                  borderColor: '#FF6B1A',
                  borderWidth: 3,
                  background: '#fff',
                  boxShadow: '0 0 0 6px rgba(255,107,26,0.2)',
                },
              }}
              marks={
                alarms.reduce((acc, a) => {
                  const idx = trackPoints.findIndex((p) => p.timestamp >= a.timestamp);
                  if (idx >= 0) {
                    const pct = (idx / (trackPoints.length - 1)) * 100;
                    acc[pct] = {
                      style: { color: getAlarmColor(a.level) },
                      label: <span className="text-[10px]">●</span>,
                    };
                  }
                  return acc;
                }, {} as Record<string, { style: React.CSSProperties; label: React.ReactNode }>)
              }
            />
          </div>

          <div className="flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              {startTime}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger" />
              {endTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackReplay;
