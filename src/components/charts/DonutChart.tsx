import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DonutChartItem {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutChartItem[];
  size?: number;
  thickness?: number;
  title?: string;
  centerLabel?: string;
  centerValue?: number | string;
  centerSubLabel?: string;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  legendPosition?: 'bottom' | 'right';
  className?: string;
  animate?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 220,
  thickness = 24,
  title,
  centerLabel,
  centerValue,
  centerSubLabel,
  formatValue = (v) => v.toString(),
  showLegend = true,
  legendPosition = 'bottom',
  className,
  animate = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const getArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = size / 2 + outerR * Math.cos(startRad);
    const y1 = size / 2 + outerR * Math.sin(startRad);
    const x2 = size / 2 + outerR * Math.cos(endRad);
    const y2 = size / 2 + outerR * Math.sin(endRad);

    const x3 = size / 2 + innerR * Math.cos(endRad);
    const y3 = size / 2 + innerR * Math.sin(endRad);
    const x4 = size / 2 + innerR * Math.cos(startRad);
    const y4 = size / 2 + innerR * Math.sin(startRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  };

  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const isHovered = hoveredIndex === index;
    const expandOffset = isHovered ? 3 : 0;
    const outerR = radius + thickness / 2 + expandOffset;
    const innerR = radius - thickness / 2 + expandOffset;

    return {
      ...item,
      index,
      startAngle,
      endAngle,
      path: angle < 0.5 ? '' : getArcPath(startAngle, endAngle, innerR, outerR),
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    };
  });

  const displayCenterValue = centerValue ?? formatValue(total);

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

      <div
        className={cn(
          'flex items-center justify-center',
          legendPosition === 'right' ? 'flex-row gap-6' : 'flex-col'
        )}
      >
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className={animate ? 'animate-fade-in' : ''}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius + thickness / 2}
              fill="none"
              stroke="rgba(100, 116, 139, 0.15)"
              strokeWidth={thickness}
            />

            {segments.map((segment, index) => (
              segment.path ? (
                <path
                  key={index}
                  d={segment.path}
                  fill={segment.color}
                  className={cn(
                    'transition-all duration-200 cursor-pointer',
                    hoveredIndex !== null && hoveredIndex !== index && 'opacity-50'
                  )}
                  style={{
                    filter: hoveredIndex === index ? `drop-shadow(0 0 8px ${segment.color}66)` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ) : null
            ))}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerLabel && (
              <span className="text-xs text-gray-400 mb-1">{centerLabel}</span>
            )}
            <span className="text-2xl font-bold text-gray-100 font-mono-code">
              {displayCenterValue}
            </span>
            {centerSubLabel && (
              <span className="text-xs text-gray-500 mt-1">{centerSubLabel}</span>
            )}
            {hoveredIndex !== null && segments[hoveredIndex] && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-space-blue-700/95 border border-space-blue-500 rounded px-2 py-1">
                <span className="text-xs text-gray-300">
                  {segments[hoveredIndex].percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {showLegend && (
          <div
            className={cn(
              'space-y-2',
              legendPosition === 'bottom' ? 'flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4' : ''
            )}
          >
            {segments.map((segment, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 transition-opacity duration-200',
                  hoveredIndex !== null && hoveredIndex !== index && 'opacity-50'
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs text-gray-400 min-w-[60px]">{segment.label}</span>
                <span className="text-xs text-gray-200 font-mono-code">
                  {formatValue(segment.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
