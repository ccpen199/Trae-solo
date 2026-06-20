import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SkillRadar, SKILL_DIMENSIONS } from '@shared/types';
import { cn } from '@/lib/utils';

interface SkillRadarChartProps {
  data: SkillRadar;
  size?: number;
  showLabels?: boolean;
  className?: string;
}

interface RadarDataPoint {
  dimension: string;
  value: number;
  fullMark: number;
}

const SkillRadarChart = ({ data, size = 300, showLabels = true, className }: SkillRadarChartProps) => {
  const chartData: RadarDataPoint[] = SKILL_DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    value: data[dim.key as keyof SkillRadar],
    fullMark: 100,
  }));

  return (
    <div className={cn('flex flex-col items-center', className)} style={{ width: size, height: size + (showLabels ? 20 : 0) }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#E9ECEF" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#495057', fontSize: 12 }}
            tickLine={false}
          />
          {showLabels && (
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#ADB5BD', fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
          )}
          <Radar
            name="技能评分"
            dataKey="value"
            stroke="#1E3A5F"
            strokeWidth={2}
            fill="url(#radarGradient)"
            fillOpacity={0.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E9ECEF',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [`${value}分`, '评分']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export { SkillRadarChart };
export type { SkillRadarChartProps };
