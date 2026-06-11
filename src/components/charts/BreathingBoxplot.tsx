import React from 'react';
import type { BreathingMetrics } from '@/types';
import { cn, formatDuration } from '@/lib/utils';

interface BreathingBoxplotProps {
  metrics: BreathingMetrics;
  className?: string;
}

export default function BreathingBoxplot({
  metrics,
  className,
}: BreathingBoxplotProps) {
  const values = metrics.rateSeries.map((r) => r.value);
  const sorted = [...values].sort((a, b) => a - b);

  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const iqr = q3 - q1;

  const minVal = Math.max(metrics.minRate, q1 - 1.5 * iqr);
  const maxVal = Math.min(metrics.maxRate, q3 + 1.5 * iqr);

  const chartWidth = 280;
  const chartHeight = 180;
  const padding = { top: 20, right: 40, bottom: 30, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const yMin = Math.floor(minVal - 2);
  const yMax = Math.ceil(maxVal + 2);
  const yRange = yMax - yMin;

  const yScale = (value: number) => {
    return padding.top + innerHeight - ((value - yMin) / yRange) * innerHeight;
  };

  const boxX = padding.left + innerWidth * 0.25;
  const boxWidth = innerWidth * 0.5;

  const yTicks = [];
  const tickStep = Math.ceil(yRange / 5);
  for (let y = yMin; y <= yMax; y += tickStep) {
    yTicks.push(y);
  }

  const outlierPoints = values.filter((v) => v < minVal || v > maxVal);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">呼吸节律分布</div>
          <div className="text-xs text-silver-400">整晚呼吸频率箱线图</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-semibold text-mint-300">
            {metrics.avgRate}
            <span className="ml-1 text-sm font-normal text-silver-400">
              次/分
            </span>
          </div>
          <div className="text-xs text-silver-500">平均呼吸率</div>
        </div>
      </div>

      <div className="flex items-start gap-6">
        <svg width={chartWidth} height={chartHeight} className="flex-shrink-0">
          <defs>
            <linearGradient id="boxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7BC8A4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7BC8A4" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={chartWidth - padding.right}
                y2={yScale(tick)}
                stroke="rgba(196, 201, 217, 0.1)"
                strokeDasharray="2,4"
              />
              <text
                x={padding.left - 8}
                y={yScale(tick) + 4}
                textAnchor="end"
                className="fill-silver-400"
                style={{ fontSize: 10, fontFamily: 'monospace' }}
              >
                {tick}
              </text>
            </g>
          ))}

          <line
            x1={padding.left + innerWidth * 0.5}
            y1={yScale(minVal)}
            x2={padding.left + innerWidth * 0.5}
            y2={yScale(q1)}
            stroke="#7BC8A4"
            strokeWidth={2}
            opacity={0.6}
          />

          <line
            x1={padding.left + innerWidth * 0.5}
            y1={yScale(q3)}
            x2={padding.left + innerWidth * 0.5}
            y2={yScale(maxVal)}
            stroke="#7BC8A4"
            strokeWidth={2}
            opacity={0.6}
          />

          <rect
            x={boxX}
            y={yScale(q3)}
            width={boxWidth}
            height={yScale(q1) - yScale(q3)}
            fill="url(#boxGradient)"
            stroke="#7BC8A4"
            strokeWidth={1.5}
            rx={4}
          />

          <line
            x1={boxX}
            y1={yScale(median)}
            x2={boxX + boxWidth}
            y2={yScale(median)}
            stroke="#B6E5CF"
            strokeWidth={2}
          />

          <line
            x1={padding.left + innerWidth * 0.3}
            y1={yScale(minVal)}
            x2={padding.left + innerWidth * 0.7}
            y2={yScale(minVal)}
            stroke="#7BC8A4"
            strokeWidth={2}
            opacity={0.8}
          />
          <line
            x1={padding.left + innerWidth * 0.3}
            y1={yScale(maxVal)}
            x2={padding.left + innerWidth * 0.7}
            y2={yScale(maxVal)}
            stroke="#7BC8A4"
            strokeWidth={2}
            opacity={0.8}
          />

          {outlierPoints.map((v, i) => (
            <circle
              key={i}
              cx={padding.left + innerWidth * 0.5}
              cy={yScale(v)}
              r={3}
              fill="#FF6B6B"
              opacity={0.8}
            />
          ))}

          <text
            x={padding.left + innerWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            className="fill-silver-500"
            style={{ fontSize: 10 }}
          >
            呼吸频率 (次/分)
          </text>
        </svg>

        <div className="flex-1 space-y-3">
          <div className="rounded-xl bg-night-800/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-silver-400">呼吸规律性</span>
              <span className="text-sm font-mono font-medium text-mint-300">
                {metrics.regularity}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-night-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint-500 to-mint-300 transition-all"
                style={{ width: `${metrics.regularity}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-night-800/30 p-2">
              <div className="text-[10px] text-silver-500">最快</div>
              <div className="font-mono text-sm text-coral-300">
                {metrics.maxRate} <span className="text-[10px] text-silver-500">bpm</span>
              </div>
            </div>
            <div className="rounded-lg bg-night-800/30 p-2">
              <div className="text-[10px] text-silver-500">最慢</div>
              <div className="font-mono text-sm text-mint-300">
                {metrics.minRate} <span className="text-[10px] text-silver-500">bpm</span>
              </div>
            </div>
            <div className="rounded-lg bg-night-800/30 p-2">
              <div className="text-[10px] text-silver-500">中位数</div>
              <div className="font-mono text-sm text-dream-300">
                {Math.round(median)} <span className="text-[10px] text-silver-500">bpm</span>
              </div>
            </div>
            <div className="rounded-lg bg-night-800/30 p-2">
              <div className="text-[10px] text-silver-500">IQR</div>
              <div className="font-mono text-sm text-night-200">
                {Math.round(q1)}-{Math.round(q3)} <span className="text-[10px] text-silver-500">bpm</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-silver-400">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-1.5 rounded-sm bg-mint-400/60" />
              <span>IQR范围</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-3 bg-mint-200" />
              <span>中位数</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-coral-400" />
              <span>异常值</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
