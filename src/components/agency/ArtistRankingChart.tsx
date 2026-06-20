import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Trophy } from 'lucide-react';
import type { ArtistRanking, AgencyArtist } from '@/store/useAgencyStore';
import { cn } from '@/lib/utils';

const generateMockRankings = (): ArtistRanking[] => {
  const mockArtists: AgencyArtist[] = [
    {
      id: 'artist-1',
      userId: 'user-artist-1',
      realName: '林雨婷',
      stageName: 'Yuting',
      age: 24,
      gender: 'female',
      height: 175,
      weight: 52,
      bust: 85,
      waist: 60,
      hips: 88,
      eyeColor: '棕色',
      hairColor: '黑色',
      languages: ['中文', '英语'],
      skills: ['T台走秀', '平面拍摄'],
      location: '上海市',
      latitude: 31.2304,
      longitude: 121.4737,
      contractStatus: 'exclusive',
      mediaAssets: [],
      tags: [],
      contractType: 'exclusive',
      artistStatus: 'active',
      department: 'fashion',
      upcomingBookings: 8,
      revenueGenerated: 286000,
    },
    {
      id: 'artist-2',
      userId: 'user-artist-2',
      realName: '陈浩然',
      stageName: 'Haoran',
      age: 26,
      gender: 'male',
      height: 188,
      weight: 75,
      bust: 96,
      waist: 80,
      hips: 94,
      eyeColor: '黑色',
      hairColor: '黑色',
      languages: ['中文', '英语'],
      skills: ['T台走秀', '影视表演'],
      location: '北京市',
      latitude: 39.9042,
      longitude: 116.4074,
      contractStatus: 'signed',
      mediaAssets: [],
      tags: [],
      contractType: 'signed',
      artistStatus: 'active',
      department: 'fashion',
      upcomingBookings: 6,
      revenueGenerated: 198000,
    },
    {
      id: 'artist-3',
      userId: 'user-artist-3',
      realName: '王思琪',
      stageName: 'Siqi',
      age: 23,
      gender: 'female',
      height: 172,
      weight: 50,
      bust: 82,
      waist: 58,
      hips: 86,
      eyeColor: '棕色',
      hairColor: '棕色',
      languages: ['中文'],
      skills: ['平面拍摄', '电商模特'],
      location: '杭州市',
      latitude: 30.2741,
      longitude: 120.1551,
      contractStatus: 'exclusive',
      mediaAssets: [],
      tags: [],
      contractType: 'exclusive',
      artistStatus: 'active',
      department: 'commercial',
      upcomingBookings: 12,
      revenueGenerated: 245000,
    },
    {
      id: 'artist-4',
      userId: 'user-artist-4',
      realName: '刘美娜',
      stageName: 'Meina',
      age: 25,
      gender: 'female',
      height: 178,
      weight: 54,
      bust: 86,
      waist: 61,
      hips: 89,
      eyeColor: '黑色',
      hairColor: '黑色',
      languages: ['中文', '法语'],
      skills: ['T台走秀', '高级定制'],
      location: '上海市',
      latitude: 31.2304,
      longitude: 121.4737,
      contractStatus: 'exclusive',
      mediaAssets: [],
      tags: [],
      contractType: 'exclusive',
      artistStatus: 'active',
      department: 'fashion',
      upcomingBookings: 5,
      revenueGenerated: 168000,
    },
    {
      id: 'artist-5',
      userId: 'user-artist-5',
      realName: '张明辉',
      stageName: 'Minghui',
      age: 27,
      gender: 'male',
      height: 185,
      weight: 72,
      bust: 94,
      waist: 78,
      hips: 92,
      eyeColor: '棕色',
      hairColor: '黑色',
      languages: ['中文', '英语', '韩语'],
      skills: ['影视表演', '平面拍摄'],
      location: '广州市',
      latitude: 23.1291,
      longitude: 113.2644,
      contractStatus: 'signed',
      mediaAssets: [],
      tags: [],
      contractType: 'signed',
      artistStatus: 'active',
      department: 'acting',
      upcomingBookings: 4,
      revenueGenerated: 132000,
    },
  ];

  return mockArtists
    .map((a) => ({
      artist: a,
      bookingCount: a.upcomingBookings,
      revenue: a.revenueGenerated,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount);
};

const defaultMockRankings = generateMockRankings();

export interface ArtistRankingChartProps {
  data?: ArtistRanking[];
  className?: string;
}

const rankColors = [
  'from-amber-500 to-amber-400',
  'from-slate-400 to-slate-300',
  'from-orange-600 to-orange-500',
  'from-rose-500 to-rose-400',
  'from-sapphire-500 to-sapphire-400',
];

const barColors = [
  '#f59e0b',
  '#94a3b8',
  '#ea580c',
  '#e94560',
  '#3b82f6',
];

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ArtistRanking & { rank: number };
    return (
      <div className="bg-midnight-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-r',
              rankColors[data.rank - 1]
            )}
          >
            {data.rank}
          </div>
          <span className="font-semibold text-white">{data.artist.stageName}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-midnight-300">
            接单数量: <span className="text-rose-400 font-medium">{data.bookingCount}</span>
          </p>
          <p className="text-midnight-300">
            创收: <span className="text-emerald-400 font-medium">¥{data.revenue.toLocaleString()}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function ArtistRankingChart({ data = defaultMockRankings, className }: ArtistRankingChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    rank: index + 1,
    name: item.artist.stageName,
  }));

  return (
    <Card variant="glass" className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            艺人接单排行
          </CardTitle>
          <CardDescription>按接单数量排名 TOP 5</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((item, index) => (
            <div key={item.artist.id} className="flex items-center gap-4">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-r shadow-lg',
                  rankColors[index]
                )}
              >
                {item.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white truncate">{item.artist.realName}</span>
                  <span className="text-sm text-midnight-300">
                    {item.bookingCount} 单 · ¥{(item.revenue / 10000).toFixed(1)}万
                  </span>
                </div>
                <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out-expo"
                    style={{
                      width: `${(item.bookingCount / chartData[0].bookingCount) * 100}%`,
                      backgroundColor: barColors[index],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" horizontal={false} />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                width={60}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(233, 69, 96, 0.1)' }} />
              <Bar dataKey="bookingCount" radius={[0, 8, 8, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default ArtistRankingChart;
