import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface LineChartSeries {
  name: string;
  data: number[];
  color: string;
  gradientId?: string;
}

export interface SimpleLineChartProps {
  series: LineChartSeries[];
  labels: string[];
  width?: number;
  height?: number;
  title?: string;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
  yAxisMin?: number;
  yAxisMax?: number;
}

interface TooltipData {
  index: number;
  x: number;
  y: number;
  values: { name: string; value: number; color: string }[];
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  series,
  labels,
  width = 600,
  height = 300,
  title,
  formatValue = (v) => v.toString(),
  showLegend = true,
  showGrid = true,
  className,
  yAxisMin,
  yAxisMax,
}) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { minValue, maxValue } = useMemo(() => {
    const allValues = series.flatMap((s) => s.data);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const range = dataMax - dataMin || 1;
    return {
      minValue: yAxisMin ?? Math.floor(dataMin - range * 0.1),
      maxValue: yAxisMax ?? Math.ceil(dataMax + range * 0.1),
    };
  }, [series, yAxisMin, yAxisMax]);

  const xScale = (index: number) => {
    if (labels.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (labels.length - 1)) * chartWidth;
  };

  const yScale = (value: number) => {
    const ratio = (value - minValue) / (maxValue - minValue);
    return padding.top + chartHeight - ratio * chartHeight;
  };

  const createPath = (data: number[]) => {
    return data
      .map((value, index) => {
        const x = xScale(index);
        const y = yScale(value);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  const createAreaPath = (data: number[]) => {
    if (data.length === 0) return '';
    const startX = xScale(0);
    const endX = xScale(data.length - 1);
    const bottomY = padding.top + chartHeight;
    const linePath = createPath(data);
    return `${linePath} L${endX},${bottomY} L${startX},${bottomY} Z`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closestIndex = 0;
    let closestDist = Infinity;

    labels.forEach((_, index) => {
      const x = xScale(index);
      const dist = Math.abs(x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = index;
      }
    });

    if (closestDist < 30) {
      setTooltip({
        index: closestIndex,
        x: xScale(closestIndex),
        y: padding.top + chartHeight / 2,
        values: series.map((s) => ({
          name: s.name,
          value: s.data[closestIndex] ?? 0,
          color: s.color,
        })),
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const yAxisTicks = useMemo(() => {
    const tickCount = 5;
    const ticks: number[] = [];
    const step = (maxValue - minValue) / tickCount;
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minValue + step * i);
    }
    return ticks;
  }, [minValue, maxValue]);

  return (
    <div
      className={cn(
        'bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card',
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-100 mb-4">{title}</h3>
      )}

      <div className="relative">
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible cursor-crosshair"
        >
          <defs>
            {series.map((s, index) => (
              <linearGradient
                key={index}
                id={s.gradientId || `gradient-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {showGrid &&
            yAxisTicks.map((tick, i) => {
              const y = yScale(tick);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="rgba(100, 116, 139, 0.1)"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748B"
                    fontSize="11"
                    className="font-mono-code"
                  >
                    {formatValue(tick)}
                  </text>
                </g>
              );
            })}

          {labels.map((label, i) => {
            const x = xScale(i);
            const shouldShow = labels.length <= 10 || i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1;
            return shouldShow ? (
              <text
                key={i}
                x={x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                fill="#64748B"
                fontSize="11"
              >
                {label}
              </text>
            ) : null;
          })}

          {series.map((s, index) => (
            <path
              key={`area-${index}`}
              d={createAreaPath(s.data)}
              fill={`url(#${s.gradientId || `gradient-${index}`})`}
            />
          ))}

          {series.map((s, index) => (
            <path
              key={`line-${index}`}
              d={createPath(s.data)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {tooltip &&
            series.map((s, index) => (
              <circle
                key={`point-${index}`}
                cx={xScale(tooltip.index)}
                cy={yScale(s.data[tooltip.index] ?? 0)}
                r="5"
                fill={s.color}
                stroke="#0F172A"
                strokeWidth="2"
              />
            ))}

          {tooltip && (
            <line
              x1={xScale(tooltip.index)}
              y1={padding.top}
              x2={xScale(tooltip.index)}
              y2={padding.top + chartHeight}
              stroke="rgba(245, 158, 11, 0.4)"
              strokeDasharray="4,4"
            />
          )}
        </svg>

        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 bg-space-blue-700/95 border border-space-blue-500 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm"
            style={{
              left: Math.min(tooltip.x + 12, width - 160),
              top: 20,
            }}
          >
            <div className="text-xs text-gray-400 mb-1.5">
              {labels[tooltip.index]}
            </div>
            {tooltip.values.map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: v.color }}
                  />
                  <span className="text-gray-300">{v.name}</span>
                </div>
                <span className="text-gray-100 font-mono-code font-medium">
                  {formatValue(v.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLegend && series.length > 1 && (
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-space-blue-600">
          {series.map((s, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-gray-400">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleLineChart;
