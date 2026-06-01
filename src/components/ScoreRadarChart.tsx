import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ScoreRadarChartProps {
  ratings: {
    douban?: number;
    imdb?: number;
    rotten?: number;
    maoyan?: number;
  };
  height?: number;
}

export default function ScoreRadarChart({ ratings, height = 280 }: ScoreRadarChartProps) {
  const data = [
    { subject: '豆瓣', score: ratings.douban || 0, fullMark: 10 },
    { subject: 'IMDb', score: ratings.imdb || 0, fullMark: 10 },
    { subject: '烂番茄', score: (ratings.rotten || 0) / 10, fullMark: 10 },
    { subject: '猫眼', score: ratings.maoyan || 0, fullMark: 10 },
  ].filter(item => item.score > 0);

  if (data.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-cinema-gold" />
        <h3 className="font-semibold text-cinema-text">多源评分</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="#94A3B8"
            fontSize={12}
          />
          <PolarRadiusAxis
            stroke="#64748B"
            fontSize={10}
            domain={[0, 10]}
            tickCount={6}
          />
          <Radar
            name="评分"
            dataKey="score"
            stroke="#D97706"
            fill="#D97706"
            fillOpacity={0.5}
            strokeWidth={2}
            animationDuration={1000}
          />
          <Legend
            wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
