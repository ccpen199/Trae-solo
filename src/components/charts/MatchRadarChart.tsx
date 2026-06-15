import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface MatchRadarScores {
  skill: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
}

export interface MatchRadarChartProps {
  scores: MatchRadarScores;
  targetScores?: Partial<MatchRadarScores>;
  className?: string;
  height?: number;
}

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';

const DIMENSION_LABELS: Record<keyof MatchRadarScores, string> = {
  skill: '技能匹配',
  experience: '经验匹配',
  education: '学历匹配',
  location: '地点匹配',
  salary: '薪资匹配',
};

export default function MatchRadarChart({
  scores,
  targetScores,
  className,
  height = 320,
}: MatchRadarChartProps) {
  const data = useMemo(() => {
    return (Object.keys(DIMENSION_LABELS) as (keyof MatchRadarScores)[]).map((key) => ({
      dimension: DIMENSION_LABELS[key],
      actual: scores[key],
      target: targetScores?.[key] ?? 100,
      fullMark: 100,
    }));
  }, [scores, targetScores]);

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart
          data={data}
          outerRadius="70%"
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid stroke="#E5E6EB" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fill: '#4E5969',
              fontSize: 12,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fill: '#86909C',
              fontSize: 10,
            }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="当前匹配"
            dataKey="actual"
            stroke={INDUSTRIAL_BLUE}
            fill={INDUSTRIAL_BLUE}
            fillOpacity={0.35}
            strokeWidth={2}
            isAnimationActive
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Radar
            name="目标值"
            dataKey="target"
            stroke={VITAL_ORANGE}
            fill="transparent"
            strokeWidth={2}
            strokeDasharray="5 5"
            isAnimationActive
            animationBegin={300}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E6EB',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Legend
            wrapperStyle={{
              fontSize: 12,
              paddingTop: 8,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
