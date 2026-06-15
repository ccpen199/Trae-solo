import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface ChannelROIDataItem {
  channel: string;
  cost: number;
  conversionRate: number;
  hireCount?: number;
  cpa?: number;
}

export interface ChannelROIChartProps {
  data: ChannelROIDataItem[];
  className?: string;
  height?: number;
}

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';

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
          <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.name === '招聘成本' ? `¥${entry.value?.toLocaleString()}` : `${entry.value?.toFixed(1)}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChannelROIChart({
  data,
  className,
  height = 320,
}: ChannelROIChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: item.channel,
    }));
  }, [data]);

  const maxCost = useMemo(() => {
    const max = Math.max(...data.map((d) => d.cost), 0);
    return Math.ceil(max * 1.2 / 1000) * 1000;
  }, [data]);

  const maxRate = useMemo(() => {
    const max = Math.max(...data.map((d) => d.conversionRate), 0);
    return Math.ceil(max * 1.2 / 5) * 5;
  }, [data]);

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 40, bottom: 20, left: 20 }}
        >
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#165DFF" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#699EFF" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{
              fill: '#4E5969',
              fontSize: 12,
            }}
            axisLine={{ stroke: '#E5E6EB' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            domain={[0, maxCost]}
            tick={{
              fill: '#86909C',
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            label={{
              value: '招聘成本',
              angle: -90,
              position: 'insideLeft',
              style: {
                fill: '#86909C',
                fontSize: 11,
              },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, maxRate]}
            tick={{
              fill: '#86909C',
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
            label={{
              value: '入职转化率',
              angle: 90,
              position: 'insideRight',
              style: {
                fill: '#86909C',
                fontSize: 11,
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: 12,
              paddingTop: 8,
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="cost"
            name="招聘成本"
            fill="url(#costGradient)"
            radius={[4, 4, 0, 0]}
            barSize={32}
            isAnimationActive
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversionRate"
            name="入职转化率"
            stroke={VITAL_ORANGE}
            strokeWidth={2.5}
            dot={{
              fill: VITAL_ORANGE,
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              stroke: VITAL_ORANGE,
              strokeWidth: 2,
              fill: '#FFFFFF',
            }}
            isAnimationActive
            animationBegin={200}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
