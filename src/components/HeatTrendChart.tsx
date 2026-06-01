import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface HeatTrendChartProps {
  data: { date: string; value: number }[];
  height?: number;
}

export default function HeatTrendChart({ data, height = 200 }: HeatTrendChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-cinema-red" />
        <h3 className="font-semibold text-cinema-text">热度趋势</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[minValue - padding, maxValue + padding]}
            tickFormatter={(value) => (value / 1000).toFixed(0) + 'k'}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F1F5F9',
            }}
            itemStyle={{ color: '#DC2626' }}
            formatter={(value: number) => [value, '热度指数']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#DC2626"
            strokeWidth={2}
            fill="url(#colorValue)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
