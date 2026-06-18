import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RadarDataItem {
  dimension: string;
  [key: string]: string | number;
}

interface RadarChartProps {
  data: RadarDataItem[];
  series: { key: string; color: string; name?: string }[];
  height?: number;
}

export function RadarChart({ data, series, height = 320 }: RadarChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748B', fontSize: 10 }}
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
          <Legend
            wrapperStyle={{ color: '#94A3B8', fontSize: 12 }}
          />
          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.name || s.key}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
