import React, { useMemo } from 'react';
import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface FunnelDataItem {
  name: string;
  value: number;
  rate?: number;
}

export interface FunnelChartProps {
  data: FunnelDataItem[];
  className?: string;
  height?: number;
  showConversionRate?: boolean;
}

const GRADIENT_COLORS = [
  'rgba(22, 93, 255, 0.95)',
  'rgba(22, 93, 255, 0.88)',
  'rgba(22, 93, 255, 0.80)',
  'rgba(22, 93, 255, 0.72)',
  'rgba(22, 93, 255, 0.64)',
  'rgba(22, 93, 255, 0.56)',
  'rgba(22, 93, 255, 0.48)',
  'rgba(22, 93, 255, 0.40)',
  'rgba(22, 93, 255, 0.32)',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
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
        <p className="font-medium text-gray-800 mb-2">{item.name}</p>
        <p className="text-gray-600 mb-1">
          <span style={{ color: '#165DFF' }}>●</span> 数量：
          <span className="font-medium">{item.value?.toLocaleString()}</span>
        </p>
        {item.rate !== undefined && (
          <p className="text-gray-600">
            <span style={{ color: '#FF7D00' }}>●</span> 转化率：
            <span className="font-medium">{item.rate.toFixed(1)}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ x, y, width, height, value, name, rate, index, isLast }: any) => {
  if (!value) return null;

  const fontSize = height >= 40 ? 13 : height >= 30 ? 11 : 10;
  const subFontSize = height >= 40 ? 11 : height >= 30 ? 10 : 9;

  return (
    <g>
      <text
        x={x + width / 2}
        y={y + height / 2 - (height >= 40 ? 4 : 2)}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={fontSize}
        fontWeight={600}
      >
        {value.toLocaleString()}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + (height >= 40 ? 12 : 10)}
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.9)"
        fontSize={subFontSize}
      >
        {name}
      </text>
      {rate !== undefined && !isLast && (
        <g>
          <line
            x1={x + width / 2}
            y1={y + height}
            x2={x + width / 2}
            y2={y + height + 18}
            stroke="#E5E6EB"
            strokeDasharray="3 3"
          />
          <rect
            x={x + width / 2 - 30}
            y={y + height + 8}
            width={60}
            height={20}
            fill="#FFF3E6"
            rx={4}
          />
          <text
            x={x + width / 2}
            y={y + height + 22}
            textAnchor="middle"
            fill="#FF7D00"
            fontSize={11}
            fontWeight={500}
          >
            {rate.toFixed(1)}%
          </text>
        </g>
      )}
    </g>
  );
};

export default function FunnelChart({
  data,
  className,
  height = 480,
  showConversionRate = true,
}: FunnelChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      let rate: number | undefined;
      if (showConversionRate && index > 0 && data[index - 1].value > 0) {
        rate = (item.value / data[index - 1].value) * 100;
      }
      return {
        ...item,
        rate,
        fill: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
        isLast: index === data.length - 1,
        index,
      };
    });
  }, [data, showConversionRate]);

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsFunnelChart
          margin={{ top: 20, right: 40, bottom: 40, left: 40 }}
        >
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={chartData}
            isAnimationActive
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            <LabelList
              content={<CustomLabel />}
              position="center"
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
