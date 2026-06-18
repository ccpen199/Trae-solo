import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineDataItem {
  date: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineDataItem[];
  series: { key: string; color: string; name?: string; smooth?: boolean }[];
  height?: number;
  showGrid?: boolean;
}

export function LineChart({ data, series, height = 320, showGrid = true }: LineChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`color${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          )}
          <XAxis
            dataKey="date"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            stroke="#475569"
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            stroke="#475569"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#E2E8F0',
            }}
            itemStyle={{ color: '#E2E8F0' }}
          />
          {series.length > 1 && (
            <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type={s.smooth !== false ? 'monotone' : 'linear'}
              dataKey={s.key}
              name={s.name || s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={{ fill: s.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: s.color }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
