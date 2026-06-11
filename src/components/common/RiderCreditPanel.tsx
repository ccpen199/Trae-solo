import React from 'react';
import { Shield, AlertTriangle, Clock, Package, Shirt, Star, ChevronRight, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadarDimension {
  key: string;
  label: string;
  value: number;
  maxValue: number;
  icon?: React.ReactNode;
}

export interface CreditRecord {
  id: string;
  date: string;
  reason: string;
  points: number;
  type: 'penalty' | 'reward';
  category: string;
}

export interface RiderCreditPanelProps {
  riderName?: string;
  riderAvatar?: string;
  creditScore: number;
  maxCreditScore?: number;
  level: string;
  levelNumber?: number;
  dimensions?: RadarDimension[];
  records?: CreditRecord[];
  className?: string;
}

const defaultDimensions: RadarDimension[] = [
  { key: 'punctuality', label: '准时率', value: 95, maxValue: 100, icon: <Clock className="w-3 h-3" /> },
  { key: 'complaint', label: '投诉率', value: 88, maxValue: 100, icon: <AlertTriangle className="w-3 h-3" /> },
  { key: 'equipment', label: '装备合规', value: 92, maxValue: 100, icon: <Shirt className="w-3 h-3" /> },
  { key: 'completion', label: '完成率', value: 97, maxValue: 100, icon: <Package className="w-3 h-3" /> },
  { key: 'service', label: '服务态度', value: 90, maxValue: 100, icon: <Star className="w-3 h-3" /> },
];

const defaultRecords: CreditRecord[] = [
  { id: '1', date: '2024-01-15 14:30', reason: '配送超时', points: -2, type: 'penalty', category: '准时率' },
  { id: '2', date: '2024-01-14 09:15', reason: '用户好评奖励', points: +5, type: 'reward', category: '服务态度' },
  { id: '3', date: '2024-01-13 18:45', reason: '未佩戴头盔', points: -5, type: 'penalty', category: '装备合规' },
  { id: '4', date: '2024-01-12 11:20', reason: '连续100单无投诉', points: +10, type: 'reward', category: '服务质量' },
  { id: '5', date: '2024-01-10 16:00', reason: '订单取消', points: -3, type: 'penalty', category: '完成率' },
];

export const RiderCreditPanel: React.FC<RiderCreditPanelProps> = ({
  riderName = '张师傅',
  riderAvatar,
  creditScore,
  maxCreditScore = 100,
  level,
  levelNumber,
  dimensions = defaultDimensions,
  records = defaultRecords,
  className,
}) => {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const levels = 5;

  const getAngle = (index: number, total: number) => {
    return (index * 2 * Math.PI) / total - Math.PI / 2;
  };

  const getPoint = (angle: number, r: number) => ({
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  });

  const radarPath = dimensions.map((dim, index) => {
    const angle = getAngle(index, dimensions.length);
    const r = (dim.value / dim.maxValue) * radius;
    const point = getPoint(angle, r);
    return `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`;
  }).join(' ') + ' Z';

  const getLevelColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-success-500/20', text: 'text-success-400', border: 'border-success-500/50' };
    if (score >= 75) return { bg: 'bg-info-500/20', text: 'text-info-400', border: 'border-info-500/50' };
    if (score >= 60) return { bg: 'bg-amber-accent-500/20', text: 'text-amber-accent-400', border: 'border-amber-accent-500/50' };
    return { bg: 'bg-danger-500/20', text: 'text-danger-400', border: 'border-danger-500/50' };
  };

  const scoreColor = getLevelColor(creditScore);
  const scorePercentage = (creditScore / maxCreditScore) * 100;

  return (
    <div className={cn(
      'bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card',
      className
    )}>
      <div className="flex items-center gap-4 mb-6 pb-5 border-b border-space-blue-600">
        <div className="relative">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
            scoreColor.bg,
            scoreColor.text,
            'border-2',
            scoreColor.border
          )}>
            {riderAvatar || riderName.charAt(0)}
          </div>
          {levelNumber && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-accent-400 to-amber-accent-600 rounded-full flex items-center justify-center border-2 border-space-blue-800">
              <Award className="w-4 h-4 text-space-blue-900" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-100">{riderName}</h3>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              scoreColor.bg,
              scoreColor.text
            )}>
              Lv.{levelNumber} {level}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Shield className={cn('w-4 h-4', scoreColor.text)} />
              <span className="text-sm text-gray-300">信用分</span>
            </div>
            <span className={cn('text-xl font-bold font-mono-code', scoreColor.text)}>
              {creditScore}
            </span>
            <span className="text-xs text-gray-500">/ {maxCreditScore}</span>
          </div>
          <div className="mt-2 h-1.5 bg-space-blue-600 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                creditScore >= 90 ? 'bg-gradient-to-r from-success-500 to-success-400' :
                creditScore >= 75 ? 'bg-gradient-to-r from-info-500 to-info-400' :
                creditScore >= 60 ? 'bg-gradient-to-r from-amber-accent-500 to-amber-accent-400' :
                'bg-gradient-to-r from-danger-500 to-danger-400'
              )}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-accent-400" />
            信用维度分析
          </h4>
          <div className="flex justify-center">
            <svg width={size} height={size}>
              <defs>
                <radialGradient id="radar-fill">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {Array.from({ length: levels }).map((_, levelIndex) => {
                const levelRadius = ((levelIndex + 1) / levels) * radius;
                const points = dimensions.map((_, dimIndex) => {
                  const angle = getAngle(dimIndex, dimensions.length);
                  const point = getPoint(angle, levelRadius);
                  return `${point.x},${point.y}`;
                }).join(' ');
                return (
                  <polygon
                    key={levelIndex}
                    points={points}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.15)"
                    strokeWidth="1"
                  />
                );
              })}

              {dimensions.map((_, index) => {
                const angle = getAngle(index, dimensions.length);
                const point = getPoint(angle, radius);
                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={point.x}
                    y2={point.y}
                    stroke="rgba(100, 116, 139, 0.15)"
                    strokeWidth="1"
                  />
                );
              })}

              <path
                d={radarPath}
                fill="url(#radar-fill)"
                stroke="#F59E0B"
                strokeWidth="2"
                className="animate-fade-in"
              />

              {dimensions.map((dim, index) => {
                const angle = getAngle(index, dimensions.length);
                const r = (dim.value / dim.maxValue) * radius;
                const point = getPoint(angle, r);
                return (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#F59E0B"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                );
              })}

              {dimensions.map((dim, index) => {
                const angle = getAngle(index, dimensions.length);
                const labelRadius = radius + 22;
                const point = getPoint(angle, labelRadius);
                return (
                  <g key={`label-${index}`} transform={`translate(${point.x}, ${point.y})`}>
                    <foreignObject x="-50" y="-10" width="100" height="20">
                      <div className="flex items-center justify-center gap-1 w-full h-full">
                        {dim.icon && <span className="text-gray-400">{dim.icon}</span>}
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{dim.label}</span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              <foreignObject x="55" y="85" width="90" height="30">
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <span className="text-[10px] text-gray-500">综合评分</span>
                  <span className="text-base font-bold text-amber-accent-400 font-mono-code">
                    {creditScore}
                  </span>
                </div>
              </foreignObject>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {dimensions.map((dim) => (
              <div key={dim.key} className="bg-space-blue-700/50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">{dim.icon}</span>
                    <span className="text-xs text-gray-400">{dim.label}</span>
                  </div>
                  <span className="text-xs font-mono-code text-gray-200">{dim.value}</span>
                </div>
                <div className="h-1 bg-space-blue-600 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      dim.value >= 90 ? 'bg-success-500' :
                      dim.value >= 75 ? 'bg-info-500' :
                      dim.value >= 60 ? 'bg-amber-accent-500' :
                      'bg-danger-500'
                    )}
                    style={{ width: `${(dim.value / dim.maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-accent-400" />
            信用分变动记录
          </h4>
          <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-space-blue-700/50 rounded-lg p-3 hover:bg-space-blue-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        record.type === 'reward' ? 'bg-success-500' : 'bg-danger-500'
                      )} />
                      <span className="text-xs text-gray-400">{record.category}</span>
                      <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors ml-auto" />
                    </div>
                    <p className="text-sm text-gray-200 truncate">{record.reason}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono-code">{record.date}</p>
                  </div>
                  <div className={cn(
                    'text-sm font-bold font-mono-code shrink-0',
                    record.type === 'reward' ? 'text-success-400' : 'text-danger-400'
                  )}>
                    {record.points > 0 ? '+' : ''}{record.points}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-space-blue-600">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500">累计奖励</div>
                <div className="text-sm font-mono-code text-success-400">
                  +{records.filter(r => r.type === 'reward').reduce((sum, r) => sum + r.points, 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">累计扣分</div>
                <div className="text-sm font-mono-code text-danger-400">
                  {records.filter(r => r.type === 'penalty').reduce((sum, r) => sum + r.points, 0)}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">净变化</div>
              <div className={cn(
                'text-sm font-mono-code font-bold',
                records.reduce((sum, r) => sum + r.points, 0) >= 0 ? 'text-success-400' : 'text-danger-400'
              )}>
                {records.reduce((sum, r) => sum + r.points, 0) >= 0 ? '+' : ''}
                {records.reduce((sum, r) => sum + r.points, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderCreditPanel;
