import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { CloudRain, MapPin, Info } from 'lucide-react';
import type { MinutelyPrecipitation } from '../../shared/types';
import { cn } from '../lib/utils';

interface MinutelyChartProps {
  data: MinutelyPrecipitation | null;
  loading?: boolean;
  className?: string;
}

function getPrecipitationLevel(value: number): { level: string; color: string } {
  if (value === 0) return { level: '无', color: '#64748b' };
  if (value < 0.1) return { level: '微量', color: '#94a3b8' };
  if (value < 0.5) return { level: '小雨', color: '#60a5fa' };
  if (value < 2) return { level: '中雨', color: '#3b82f6' };
  if (value < 5) return { level: '大雨', color: '#2563eb' };
  if (value < 10) return { level: '暴雨', color: '#7c3aed' };
  return { level: '大暴雨', color: '#991b1b' };
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { level, color } = getPrecipitationLevel(data.value);
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-300 mb-1">{data.timeLabel}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
          <span className="text-white font-semibold">{data.value.toFixed(2)} mm</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
            {level}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MinutelyChart({ data, loading, className }: MinutelyChartProps) {
  if (loading || !data) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-40 bg-slate-700/50 rounded-lg"></div>
            <div className="h-5 w-24 bg-slate-700/50 rounded-full"></div>
          </div>
          <div className="h-48 bg-slate-700/30 rounded-xl"></div>
          <div className="h-16 bg-slate-700/30 rounded-xl mt-4"></div>
        </div>
      </div>
    );
  }

  const chartData = data.precipitation.map((item) => ({
    ...item,
    timeLabel: formatTime(item.time),
  }));

  const maxValue = Math.max(...data.precipitation.map((p) => p.value), 1);
  const hasPrecipitation = data.precipitation.some((p) => p.value > 0);

  return (
    <div className={cn('glass-card p-6 relative overflow-hidden', className)}>
      <div className="absolute top-0 left-1/2 w-60 h-60 bg-gradient-to-br from-blue-500/5 to-cyan-400/5 rounded-full blur-3xl -translate-y-1/3 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center">
              <CloudRain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">分钟级降水预报</h3>
              <p className="text-xs text-slate-400">未来2小时 · 每5分钟更新</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/30">
            <MapPin className="w-3 h-3 text-cyan-400" />
            {data.gridSize}米网格
          </div>
        </div>

        <div className="h-48 md:h-56 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                domain={[0, 'auto']}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#precipGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#0a0f1a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-300 leading-relaxed">{data.summary}</p>
              {hasPrecipitation && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">降水等级:</span>
                    {['小雨', '中雨', '大雨', '暴雨'].map((level, index) => (
                      <span
                        key={level}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400"
                        style={{
                          color:
                            index === 0
                              ? '#60a5fa'
                              : index === 1
                              ? '#3b82f6'
                              : index === 2
                              ? '#2563eb'
                              : '#7c3aed',
                        }}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
