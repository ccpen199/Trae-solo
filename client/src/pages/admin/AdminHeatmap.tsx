import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import type { HeatmapData } from '@/types/shared';

const districtCenterMap: Record<string, { x: number; y: number }> = {
  '惠城区': { x: 50, y: 45 },
  '惠阳区': { x: 55, y: 70 },
  '惠东县': { x: 75, y: 55 },
  '博罗县': { x: 30, y: 35 },
  '龙门县': { x: 20, y: 15 },
  '大亚湾区': { x: 65, y: 80 },
  '仲恺高新区': { x: 40, y: 55 },
};

export default function AdminHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<HeatmapData | null>(null);

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/heatmap');
      setHeatmapData(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  const getHeatColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio < 0.2) return 'bg-green-400';
    if (ratio < 0.4) return 'bg-yellow-400';
    if (ratio < 0.6) return 'bg-orange-400';
    if (ratio < 0.8) return 'bg-red-400';
    return 'bg-red-600';
  };

  const getHeatSize = (count: number) => {
    const ratio = Math.max(count / maxCount, 0.3);
    return `${40 + ratio * 40}px`;
  };

  const getSentimentColor = (sentiment: HeatmapData['sentiment']) => {
    const total = sentiment.positive + sentiment.neutral + sentiment.negative;
    if (total === 0) return 'gray';
    const negativeRatio = sentiment.negative / total;
    if (negativeRatio > 0.5) return '🔴 负面为主';
    if (sentiment.positive > sentiment.negative) return '🟢 正面为主';
    return '🟡 中性为主';
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  const totalPosts = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const totalPositive = heatmapData.reduce((sum, d) => sum + d.sentiment.positive, 0);
  const totalNegative = heatmapData.reduce((sum, d) => sum + d.sentiment.negative, 0);
  const totalNeutral = heatmapData.reduce((sum, d) => sum + d.sentiment.neutral, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">舆情热力图</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">区域爆料密度分布</h3>
            
            <div className="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="#666" strokeWidth="0.5" />
                  <path d="M25,20 Q35,30 40,45 Q50,40 55,55 Q60,70 70,75 Q80,80 85,85" fill="none" stroke="#4a90d9" strokeWidth="1" />
                  <path d="M15,35 Q25,40 30,50 Q35,55 45,60 Q55,65 60,70 Q70,75 75,80" fill="none" stroke="#4a90d9" strokeWidth="0.5" />
                </svg>
              </div>

              {heatmapData.map((district) => {
                const pos = districtCenterMap[district.district];
                if (!pos) return null;
                
                return (
                  <div
                    key={district.district}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => setSelectedDistrict(district)}
                  >
                    <div
                      className={`${getHeatColor(district.count)} rounded-full opacity-70 animate-pulse flex items-center justify-center`}
                      style={{
                        width: getHeatSize(district.count),
                        height: getHeatSize(district.count),
                      }}
                    >
                      <span className="text-white font-bold text-xs drop-shadow">
                        {district.count}
                      </span>
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-700 bg-white/80 px-2 py-0.5 rounded">
                      {district.district}
                    </div>
                  </div>
                );
              })}

              <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 text-xs">
                <p className="font-medium text-gray-700 mb-2">密度图例</p>
                <div className="flex gap-1">
                  <div className="w-6 h-4 bg-green-400 rounded" title="低" />
                  <div className="w-6 h-4 bg-yellow-400 rounded" title="较低" />
                  <div className="w-6 h-4 bg-orange-400 rounded" title="中" />
                  <div className="w-6 h-4 bg-red-400 rounded" title="较高" />
                  <div className="w-6 h-4 bg-red-600 rounded" title="高" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">总体统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">总爆料数</span>
                <span className="font-bold text-lg text-gray-800">{totalPosts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">正面评价</span>
                <span className="font-medium text-green-600">{totalPositive}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">中性评价</span>
                <span className="font-medium text-gray-600">{totalNeutral}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">负面评价</span>
                <span className="font-medium text-red-600">{totalNegative}</span>
              </div>
            </div>
          </Card>

          {selectedDistrict && (
            <Card className="p-4 border-2 border-primary-200">
              <h3 className="font-semibold text-gray-800 mb-3">
                {selectedDistrict.district} 详情
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">爆料总数</span>
                  <span className="font-bold text-lg text-primary-600">{selectedDistrict.count}</span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">情感分布</p>
                  <div className="flex h-6 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 flex items-center justify-center text-white text-xs"
                      style={{ width: `${(selectedDistrict.sentiment.positive / Math.max(selectedDistrict.count, 1)) * 100}%` }}
                    >
                      {selectedDistrict.sentiment.positive > 0 && '正面'}
                    </div>
                    <div
                      className="bg-gray-400 flex items-center justify-center text-white text-xs"
                      style={{ width: `${(selectedDistrict.sentiment.neutral / Math.max(selectedDistrict.count, 1)) * 100}%` }}
                    >
                      {selectedDistrict.sentiment.neutral > 0 && '中性'}
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-center text-white text-xs"
                      style={{ width: `${(selectedDistrict.sentiment.negative / Math.max(selectedDistrict.count, 1)) * 100}%` }}
                    >
                      {selectedDistrict.sentiment.negative > 0 && '负面'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>正面: {selectedDistrict.sentiment.positive}</span>
                  <span>中性: {selectedDistrict.sentiment.neutral}</span>
                  <span>负面: {selectedDistrict.sentiment.negative}</span>
                </div>
                <p className="text-sm">
                  情感倾向: <span className="font-medium">{getSentimentColor(selectedDistrict.sentiment)}</span>
                </p>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">区域排名</h3>
            <div className="space-y-2">
              {[...heatmapData]
                .sort((a, b) => b.count - a.count)
                .map((district, idx) => (
                  <div
                    key={district.district}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedDistrict?.district === district.district
                        ? 'bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDistrict(district)}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700">{district.district}</span>
                    <span className="text-sm font-medium text-gray-800">{district.count}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
