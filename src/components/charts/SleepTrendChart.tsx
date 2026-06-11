import React from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SleepSession } from '@/types';
import { cn, formatDateLabel, dayjs, formatDuration } from '@/lib/utils';

interface SleepTrendChartProps {
  sessions: SleepSession[];
  days?: number;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  qualityScore: number;
  totalDuration: number;
  sleepEfficiency: number;
  deepPercent: number;
  remPercent: number;
}

export default function SleepTrendChart({
  sessions,
  days = 7,
  className,
}: SleepTrendChartProps) {
  const chartData: ChartDataPoint[] = sessions.slice(-days).map((session) => {
    const totalSleep = session.sleepStages.reduce(
      (sum, s) => sum + s.duration,
      0
    );
    const deepSleep = session.sleepStages
      .filter((s) => s.stage === 'deep')
      .reduce((sum, s) => sum + s.duration, 0);
    const remSleep = session.sleepStages
      .filter((s) => s.stage === 'rem')
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      date: dayjs(session.startTime).format('MM-DD'),
      dateLabel: formatDateLabel(session.startTime),
      qualityScore: session.qualityScore,
      totalDuration: session.totalDuration / 60,
      sleepEfficiency: session.sleepEfficiency,
      deepPercent: totalSleep > 0 ? (deepSleep / totalSleep) * 100 : 0,
      remPercent: totalSleep > 0 ? (remSleep / totalSleep) * 100 : 0,
    };
  });

  const avgScore =
    chartData.reduce((sum, d) => sum + d.qualityScore, 0) / chartData.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-night-800/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <div className="mb-2 text-sm font-medium text-white">
            {data.dateLabel}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-dream-400 to-mint-400" />
              <span className="text-silver-400">睡眠质量</span>
              <span className="ml-2 font-mono text-white">
                {data.qualityScore} 分
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-night-300" />
              <span className="text-silver-400">总时长</span>
              <span className="ml-2 font-mono text-white">
                {formatDuration(Math.round(data.totalDuration * 60))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-dream-400" />
              <span className="text-silver-400">深睡占比</span>
              <span className="ml-2 font-mono text-white">
                {data.deepPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-mint-400" />
              <span className="text-silver-400">REM占比</span>
              <span className="ml-2 font-mono text-white">
                {data.remPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-sm font-medium text-white">睡眠质量趋势</div>
          <div className="text-xs text-silver-400">
            近{days}日睡眠质量评分
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-semibold text-dream-300">
            {Math.round(avgScore)}
            <span className="ml-1 text-sm font-normal text-silver-400">分</span>
          </div>
          <div className="text-xs text-silver-500">平均质量</div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B7EDB" stopOpacity={0.5} />
                <stop offset="50%" stopColor="#7BC8A4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7BC8A4" stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 4"
              stroke="rgba(196, 201, 217, 0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9AA1B8', fontSize: 11, fontFamily: 'monospace' }}
              dy={8}
            />

            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9AA1B8', fontSize: 10, fontFamily: 'monospace' }}
              tickCount={5}
              width={35}
            />

            <ReferenceLine
              y={85}
              stroke="rgba(123, 200, 164, 0.3)"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={60}
              stroke="rgba(255, 107, 107, 0.3)"
              strokeDasharray="4 4"
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(155, 126, 219, 0.3)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="qualityScore"
              stroke="none"
              fill="url(#qualityGradient)"
              animationDuration={1000}
            />

            <Line
              type="monotone"
              dataKey="qualityScore"
              stroke="url(#lineGradient)"
              strokeWidth={2.5}
              dot={{
                fill: '#131C45',
                stroke: '#B59CEE',
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: '#B59CEE',
                stroke: '#fff',
                strokeWidth: 2,
                filter: 'url(#glow)',
              }}
              animationDuration={1000}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#9B7EDB" />
                  <stop offset="100%" stopColor="#7BC8A4" />
                </linearGradient>
              </defs>
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-silver-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded bg-gradient-to-r from-dream-400/60 to-mint-400/60" />
            <span>质量评分</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-px w-3 border-t border-dashed border-mint-400/40" />
            <span>优秀 (85+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-px w-3 border-t border-dashed border-coral-400/40" />
            <span>需关注 (60-)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
