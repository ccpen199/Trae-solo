import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface RetentionDataItem {
  month: string | number;
  [key: string]: string | number | undefined;
}

export interface RetentionLineChartProps {
  data: RetentionDataItem[];
  lines: { key: string; name: string; color: string }[];
  className?: string;
  height?: number;
  yAxisLabel?: string;
}

const DEFAULT_COLORS = [
  '#165DFF',
  '#FF7D00',
  '#00B42A',
  '#722ED1',
  '#F53F3F',
  '#14C9C9',
  '#F7BA1E',
  '#86909C',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E6EB',
          borderRadius: 8,
          padding: '12px 16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          fontSize: 12,
        }}
      >
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ color: entry.color, margin: '4px 0' }}
            className="flex items-center justify-between gap-8"
          >
            <span className="flex items-center">
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-medium">{entry.value?.toFixed(1)}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RetentionLineChart({
  data,
  lines,
  className,
  height = 320,
  yAxisLabel = '留存率(%)',
}: RetentionLineChartProps) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(lines.map((l) => l.key))
  );

  const lineColors = useMemo(() => {
    return lines.map((line, index) => ({
      ...line,
      color: line.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
  }, [lines]);

  const handleLegendClick = (data: any) => {
    const key = data.value;
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) {
          next.delete(key);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
        {payload.map((entry: any, index: number) => {
          const isVisible = visibleLines.has(entry.value);
          return (
            <div
              key={index}
              className="flex items-center cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => handleLegendClick(entry)}
              style={{
                opacity: isVisible ? 1 : 0.4,
              }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
        >
          <defs>
            {lineColors.map((line) => (
              <linearGradient
                key={line.key}
                id={`gradient-${line.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={line.color}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={line.color}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E5E6EB"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{
              fill: '#4E5969',
              fontSize: 12,
            }}
            axisLine={{ stroke: '#E5E6EB' }}
            tickLine={false}
            tickFormatter={(value) => `第${value}月`}
          />
          <YAxis
            domain={[0, 100]}
            tick={{
              fill: '#86909C',
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              style: {
                fill: '#86909C',
                fontSize: 11,
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
          {lineColors.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={visibleLines.has(line.key) ? 2.5 : 0}
              dot={{
                fill: line.color,
                strokeWidth: 2,
                r: visibleLines.has(line.key) ? 4 : 0,
              }}
              activeDot={{
                r: 6,
                stroke: line.color,
                strokeWidth: 2,
                fill: '#FFFFFF',
              }}
              isAnimationActive
              animationBegin={100}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
