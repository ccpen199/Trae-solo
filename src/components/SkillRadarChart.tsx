import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarChartProps {
  data: { axis: string; value: number }[];
}

export default function SkillRadarChart({ data }: SkillRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E5E6E7" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: '#4A4E53', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: '#8E9296', fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="技能匹配"
          dataKey="value"
          stroke="#C8553D"
          fill="#C8553D"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
