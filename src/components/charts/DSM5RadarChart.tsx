import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DSM5Dimension } from '@/types';
import { cn, riskLevelColor, riskLevelBg } from '@/lib/utils';

interface DSM5RadarChartProps {
  dimensions: DSM5Dimension[];
  className?: string;
  selected?: string;
  onSelect?: (disorder: string) => void;
  onDimensionClick?: (dimension: DSM5Dimension) => void;
}

const disorderLabels: Record<string, string> = {
  insomnia: '失眠障碍',
  osa: '阻塞性睡眠呼吸暂停',
  restless_legs: '不宁腿综合征',
  periodic_limb: '周期性肢体运动',
  narcolepsy: '发作性睡病',
  circadian_rhythm: '昼夜节律紊乱',
};

export default function DSM5RadarChart({
  dimensions,
  className,
  selected,
  onSelect,
  onDimensionClick,
}: DSM5RadarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    selected ? dimensions.findIndex((d) => d.disorder === selected) : null
  );

  React.useEffect(() => {
    if (selected) {
      setSelectedIndex(dimensions.findIndex((d) => d.disorder === selected));
    }
  }, [selected, dimensions]);

  const data = dimensions.map((dim) => ({
    disorder: dim.disorder,
    label: disorderLabels[dim.disorder] || dim.disorder,
    score: dim.score,
    threshold: dim.threshold,
    riskLevel: dim.riskLevel,
    fullMark: 100,
  }));

  const thresholdData = dimensions.map((dim) => ({
    disorder: dim.disorder,
    label: disorderLabels[dim.disorder] || dim.disorder,
    score: dim.threshold,
    fullMark: 100,
  }));

  const selectedDimension =
    selectedIndex !== null ? dimensions[selectedIndex] : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const dim = dimensions.find(
        (d) => d.disorder === payload[0].payload.disorder
      );
      if (!dim) return null;
      return (
        <div className="rounded-xl border border-white/10 bg-night-800/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <div className="mb-1 text-sm font-medium text-white">
            {disorderLabels[dim.disorder] || dim.disorder}
          </div>
          <div className="text-[10px] text-silver-500">DSM-5: {dim.dsm5Code}</div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-silver-400">风险评分</span>
              <span
                className={cn('ml-2 font-mono font-medium', riskLevelColor(dim.riskLevel))}
              >
                {dim.score} 分
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-silver-400">阈值</span>
              <span className="ml-2 font-mono text-silver-300">
                {dim.threshold} 分
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-silver-400">风险等级</span>
              <span
                className={cn(
                  'ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium',
                  riskLevelBg(dim.riskLevel)
                )}
              >
                {dim.riskLevel === 'low'
                  ? '低风险'
                  : dim.riskLevel === 'moderate'
                    ? '中风险'
                    : '高风险'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleClick = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onSelect?.(dimensions[index].disorder);
    onDimensionClick?.(dimensions[index]);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">DSM-5 睡眠障碍风险映射</div>
          <div className="text-xs text-silver-400">六维睡眠健康雷达图</div>
        </div>
      </div>

      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="75%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B7EDB" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7BC8A4" stopOpacity={0.4} />
              </linearGradient>
              <filter id="radarGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <PolarGrid
              stroke="rgba(196, 201, 217, 0.1)"
              strokeDasharray="3 3"
            />

            <PolarAngleAxis
              dataKey="label"
              tick={{
                fill: '#9AA1B8',
                fontSize: 10,
                fontFamily: 'system-ui, sans-serif',
              }}
              tickLine={false}
              axisLine={false}
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#6E7590', fontSize: 9, fontFamily: 'monospace' }}
              tickCount={5}
              axisLine={false}
              tickLine={false}
            />

            <Radar
              name="阈值"
              dataKey="threshold"
              stroke="rgba(255, 107, 107, 0.4)"
              fill="rgba(255, 107, 107, 0.1)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            <Radar
              name="风险评分"
              dataKey="score"
              stroke="#9B7EDB"
              strokeWidth={2}
              fill="url(#radarGradient)"
              fillOpacity={0.5}
              animationDuration={1000}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <circle
                  key={index}
                  r={selectedIndex === index ? 6 : 4}
                  fill={selectedIndex === index ? '#B59CEE' : '#131C45'}
                  stroke="#9B7EDB"
                  strokeWidth={2}
                  filter={selectedIndex === index ? 'url(#radarGlow)' : undefined}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                />
              ))}
            </Radar>

            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-center gap-6 text-xs text-silver-500">
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded bg-dream-400/50" />
          <span>当前评分</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-px w-4 border-t border-dashed border-coral-400/60" />
          <span>风险阈值</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {dimensions.map((dim, index) => (
          <button
            key={dim.disorder}
            onClick={() => handleClick(index)}
            className={cn(
              'rounded-lg border p-2 text-left transition-all',
              selectedIndex === index
                ? 'border-white/20 bg-night-700/60'
                : 'border-white/5 bg-night-800/30 hover:border-white/10 hover:bg-night-800/50'
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-silver-400">
                {disorderLabels[dim.disorder] || dim.disorder}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  'text-lg font-mono font-semibold',
                  riskLevelColor(dim.riskLevel)
                )}
              >
                {dim.score}
              </span>
              <span className="text-[10px] text-silver-500">
                /{dim.threshold}
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-night-700">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  dim.riskLevel === 'low'
                    ? 'bg-mint-400'
                    : dim.riskLevel === 'moderate'
                      ? 'bg-dream-400'
                      : 'bg-coral-400'
                )}
                style={{ width: `${Math.min((dim.score / 100) * 100, 100)}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {selectedDimension && (
        <div className="mt-4 rounded-xl border border-white/5 bg-night-800/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                riskLevelBg(selectedDimension.riskLevel)
              )}
            >
              {selectedDimension.riskLevel === 'low'
                ? '低风险'
                : selectedDimension.riskLevel === 'moderate'
                  ? '中风险'
                  : '高风险'}
            </span>
            <span className="text-sm font-medium text-white">
              {disorderLabels[selectedDimension.disorder]}
            </span>
            <span className="text-xs text-silver-500">
              DSM-5: {selectedDimension.dsm5Code}
            </span>
          </div>

          {selectedDimension.evidences.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-silver-400 mb-1">相关证据</div>
              <div className="flex flex-wrap gap-1">
                {selectedDimension.evidences.map((ev, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-night-700/50 px-2 py-0.5 text-[11px] text-silver-300"
                  >
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedDimension.diagnosticCriteriaMet.length > 0 && (
            <div>
              <div className="text-xs text-silver-400 mb-1">符合的诊断标准</div>
              <ul className="space-y-0.5">
                {selectedDimension.diagnosticCriteriaMet.map((criterion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-silver-300"
                  >
                    <span className="text-mint-400">•</span>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
