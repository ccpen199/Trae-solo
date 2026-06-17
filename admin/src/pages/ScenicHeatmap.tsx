import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import type { DashboardData } from '@/types';
import { ThermometerSun, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ScenicHeatmap() {
  const [data, setData] = useState<DashboardData | null>(null);
  const loadDashboardData = useAppStore((state) => state.loadDashboardData);

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
      setData(useAppStore.getState().dashboardData);
    };
    fetchData();
  }, []);

  const getHeatColor = (level: number) => {
    if (level >= 90) return 'bg-red-500';
    if (level >= 70) return 'bg-orange-500';
    if (level >= 50) return 'bg-amber-500';
    if (level >= 30) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getHeatBgColor = (level: number) => {
    if (level >= 90) return 'bg-red-50 border-red-200';
    if (level >= 70) return 'bg-orange-50 border-orange-200';
    if (level >= 50) return 'bg-amber-50 border-amber-200';
    if (level >= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getHeatTextColor = (level: number) => {
    if (level >= 90) return 'text-red-700';
    if (level >= 70) return 'text-orange-700';
    if (level >= 50) return 'text-amber-700';
    if (level >= 30) return 'text-yellow-700';
    return 'text-emerald-700';
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedScenics = [...data.scenicHeatmap].sort((a, b) => b.heatLevel - a.heatLevel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">景区入园热力图</h1>
          <p className="text-gray-500 text-sm mt-1">按行政区划实时监控各景区客流情况</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></span>舒适</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></span>适中</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></span>较热</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-1.5"></span>热门</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></span>爆满</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {sortedScenics.slice(0, 4).map((scenic) => (
          <div
            key={scenic.scenicId}
            className={`${getHeatBgColor(scenic.heatLevel)} border rounded-2xl p-5 transition-all hover:shadow-card`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-xl ${getHeatColor(scenic.heatLevel)} flex items-center justify-center`}>
                  <ThermometerSun size={20} className="text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">{scenic.scenicName}</h3>
                  <p className="text-xs text-gray-500">{scenic.district}</p>
                </div>
              </div>
              {scenic.heatLevel >= 90 && (
                <AlertTriangle size={20} className="text-red-500 animate-pulse" />
              )}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-800">{scenic.heatLevel}%</p>
                <p className="text-xs text-gray-500 mt-1">客流饱和度</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${getHeatTextColor(scenic.heatLevel)}`}>
                  {scenic.currentVisitorCount.toLocaleString()} / {scenic.todayVisitorCount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">当前/今日游客</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-10 gap-4">
        {sortedScenics.map((scenic) => {
          const height = Math.max(120, scenic.heatLevel * 2.5);
          return (
            <div key={scenic.scenicId} className="flex flex-col items-center">
              <div
                className={`w-full rounded-t-xl ${getHeatColor(scenic.heatLevel)} flex items-end justify-center transition-all duration-500 relative group cursor-pointer`}
                style={{ height: `${height}px` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {scenic.scenicName}: {scenic.heatLevel}%
                </div>
                <div className="text-center pb-3">
                  <p className="text-white font-bold text-lg">{scenic.heatLevel}%</p>
                  <p className="text-white/80 text-xs">{scenic.currentVisitorCount.toLocaleString()}人</p>
                </div>
              </div>
              <div className="mt-3 text-center w-full">
                <p className="text-sm font-medium text-gray-800 truncate px-2">{scenic.scenicName}</p>
                <p className="text-xs text-gray-500">{scenic.district}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <Users size={20} className="text-primary-500 mr-2" />
          各景区详细客流
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {sortedScenics.map((scenic) => (
            <div key={scenic.scenicId} className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800 text-sm">{scenic.scenicName}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getHeatBgColor(scenic.heatLevel)} ${getHeatTextColor(scenic.heatLevel)}`}>
                  {scenic.heatLevel >= 90 ? '爆满' : scenic.heatLevel >= 70 ? '热门' : scenic.heatLevel >= 50 ? '较热' : '舒适'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>当前游客</span>
                    <span className="font-medium">{scenic.currentVisitorCount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getHeatColor(scenic.heatLevel)}`}
                      style={{ width: `${(scenic.currentVisitorCount / (scenic.todayVisitorCount * 1.2)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">今日累计</span>
                  <span className="text-gray-800 font-medium flex items-center">
                    <TrendingUp size={12} className="mr-1 text-emerald-500" />
                    {scenic.todayVisitorCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">按行政区划客流分布</h3>
        <div className="space-y-4">
          {['姑苏区', '工业园区', '虎丘区', '吴中区', '吴江区', '昆山市', '常熟市'].map((district) => {
            const districtScenics = sortedScenics.filter((s) => s.district === district);
            if (districtScenics.length === 0) return null;
            const totalVisitors = districtScenics.reduce((sum, s) => sum + s.todayVisitorCount, 0);
            const avgHeat = Math.round(districtScenics.reduce((sum, s) => sum + s.heatLevel, 0) / districtScenics.length);
            return (
              <div key={district} className="flex items-center">
                <div className="w-24 text-sm font-medium text-gray-700">{district}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full h-8 bg-gray-50 rounded-lg overflow-hidden flex">
                    {districtScenics.map((scenic) => (
                      <div
                        key={scenic.scenicId}
                        className={`h-full ${getHeatColor(scenic.heatLevel)} relative group cursor-pointer transition-all`}
                        style={{ width: `${(scenic.todayVisitorCount / totalVisitors) * 100}%` }}
                        title={`${scenic.scenicName}: ${scenic.todayVisitorCount}人`}
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {scenic.scenicName}: {scenic.todayVisitorCount.toLocaleString()}人
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-36 text-right">
                  <span className="text-sm font-semibold text-gray-800">{totalVisitors.toLocaleString()} 人</span>
                  <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${getHeatBgColor(avgHeat)} ${getHeatTextColor(avgHeat)}`}>
                    {avgHeat}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
