import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarDataItem {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarDataItem[];
  series: { key: string; color: string; name?: string }[];
  height?: number;
  horizontal?: boolean;
  showGrid?: boolean;
}

export function BarChart({ data, series, height = 320, horizontal = false, showGrid = true }: BarChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : undefined}
          margin={{ top: 10, right: 10, left: horizontal ? 40 : 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          )}
          <XAxis
            dataKey={horizontal ? undefined : 'name'}
            type={horizontal ? 'number' : 'category'}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            stroke="#475569"
          />
          <YAxis
            dataKey={horizontal ? 'name' : undefined}
            type={horizontal ? 'category' : 'number'}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            stroke="#475569"
            width={horizontal ? 80 : undefined}
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
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name || s.key}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              barSize={horizontal ? 16 : undefined}
            >
              {data.length <= 10 && data.map((_, index) => (
                <Cell key={`cell-${index}`} fillOpacity={0.85} />
              ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
