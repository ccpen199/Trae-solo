import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, Trophy, TrendingUp, Users, Star, ChevronRight, Award, Crown, ChevronUp, ChevronDown } from 'lucide-react';
import { getRankings } from '../../services/api';
import type { RankingItem } from '../../../shared/types';

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [activeType, setActiveType] = useState<'performance' | 'team' | 'training'>('performance');

  useEffect(() => {
    fetchRankings();
  }, [activePeriod, activeType]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const res = await getRankings({ period: activePeriod, type: activeType });
      if (res.code === 0) {
        setRankings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const periodTabs = [
    { key: 'daily', label: '今日' },
    { key: 'weekly', label: '本周' },
    { key: 'monthly', label: '本月' },
  ];

  const typeTabs = [
    { key: 'performance', label: '业绩排行', icon: TrendingUp },
    { key: 'team', label: '团队排行', icon: Users },
    { key: 'training', label: '学习排行', icon: Star },
  ];

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['个人业绩', '团队平均'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      name: '万元',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: '个人业绩',
        type: 'bar',
        data: [12.5, 18.6, 15.2, 22.8, 19.6, 28.5],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#059669' },
              { offset: 1, color: '#10b981' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 20,
      },
      {
        name: '团队平均',
        type: 'line',
        smooth: true,
        data: [8.2, 10.5, 9.8, 13.2, 11.5, 16.8],
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 },
      }
    ]
  };

  const personalStats = [
    { label: '当前排名', value: '#3', icon: Trophy, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '本月业绩', value: '¥28.5万', icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '团队成员', value: 15, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '学习积分', value: 1280, icon: Star, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-white', icon: <Crown className="w-5 h-5" /> };
    if (rank === 2) return { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-white', icon: <Award className="w-5 h-5" /> };
    if (rank === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-amber-800', text: 'text-white', icon: <Award className="w-5 h-5" /> };
    return { bg: 'bg-gray-100', text: 'text-gray-600', icon: <span className="font-bold">{rank}</span> };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">业绩排行榜</h1>
          <p className="text-gray-500 mt-1">实时追踪业绩排名，激发团队动力</p>
        </div>
        <div className="flex gap-2">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePeriod(tab.key as typeof activePeriod)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activePeriod === tab.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {personalStats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key as typeof activeType)}
              className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${activeType === tab.key ? 'bg-primary-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">个人排名趋势</h3>
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">#3</div>
              <p className="text-primary-200 flex items-center justify-center gap-1">
                <ChevronUp className="w-4 h-4" />
                较上周上升 2 位
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">28.5</p>
                  <p className="text-xs text-primary-200">业绩(万)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-primary-200">团队人数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-xs text-primary-200">完成率</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">TOP 3 精英</h3>
            <div className="space-y-4">
              {rankings.slice(0, 3).map((item, idx) => {
                const rank = idx + 1;
                const style = getRankStyle(rank);
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center ${style.text}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.userName}</span>
                        {item.level && (
                          <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">{item.level}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{item.teamName || '直属团队'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">
                        {activeType === 'training' ? `${item.score}分` : `¥${item.score}万`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">业绩趋势对比</h3>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">排行榜</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="搜索..." className="input pl-10 w-48 py-2" />
                </div>
                <button className="btn btn-secondary py-2">
                  <Filter className="w-4 h-4 mr-1" />
                  筛选
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {rankings.map((item, idx) => {
                const rank = idx + 1;
                const style = getRankStyle(rank);
                return (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center ${style.text} flex-shrink-0`}>
                        {rank <= 3 ? style.icon : <span className="font-bold">{rank}</span>}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {item.userName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{item.userName}</span>
                          {item.level && (
                            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">{item.level}</span>
                          )}
                          {item.trend > 0 && (
                            <span className="text-xs text-green-600 flex items-center gap-0.5">
                              <ChevronUp className="w-3 h-3" />
                              {item.trend}
                            </span>
                          )}
                          {item.trend < 0 && (
                            <span className="text-xs text-red-600 flex items-center gap-0.5">
                              <ChevronDown className="w-3 h-3" />
                              {Math.abs(item.trend)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{item.teamName || '直属团队'} · {item.memberCount || 0}人</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-600">
                          {activeType === 'training' ? `${item.score}分` : `¥${item.score}万`}
                        </p>
                        {activeType !== 'training' && (
                          <p className="text-xs text-gray-500">
                            目标完成率 {item.completionRate || 0}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
