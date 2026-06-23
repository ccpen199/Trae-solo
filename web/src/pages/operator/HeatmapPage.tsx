import { useState, useEffect, useMemo } from 'react';
import { analyticsApi } from '../../api';
import type { HeatmapData } from '../../types';

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}`);

const HeatmapPage = () => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<{ day: number; hour: number; value: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getHeatmap();
      setData(res || []);
    } catch (error) {
      console.error('加载热力图数据失败', error);
      alert('加载热力图数据失败');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 0, total: 0, avgValue: 0, peakHour: -1, peakDay: -1 };
    }
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, 1);
    const total = values.reduce((s, v) => s + v, 0);
    const avgValue = Math.round(total / (7 * 24));

    const peakItem = data.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), data[0]);
    return { maxValue, total, avgValue, peakHour: peakItem.hour, peakDay: peakItem.day };
  }, [data]);

  const getValue = (day: number, hour: number) => {
    const item = data.find(d => d.day === day && d.hour === hour);
    return item?.value || 0;
  };

  const getColorClass = (value: number) => {
    if (value === 0) return 'bg-gray-50 border border-gray-100';
    const ratio = value / (stats.maxValue || 1);
    if (ratio < 0.2) return 'bg-blue-100';
    if (ratio < 0.4) return 'bg-teal-200';
    if (ratio < 0.6) return 'bg-green-300';
    if (ratio < 0.8) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const getLegendItems = () => {
    if (stats.maxValue === 0) {
      return [
        { label: '0', cls: 'bg-gray-50 border border-gray-200' }
      ];
    }
    return [
      { label: `0`, cls: 'bg-gray-50 border border-gray-200' },
      { label: `1-${Math.round(stats.maxValue * 0.2)}`, cls: 'bg-blue-100' },
      { label: `${Math.round(stats.maxValue * 0.2) + 1}-${Math.round(stats.maxValue * 0.4)}`, cls: 'bg-teal-200' },
      { label: `${Math.round(stats.maxValue * 0.4) + 1}-${Math.round(stats.maxValue * 0.6)}`, cls: 'bg-green-300' },
      { label: `${Math.round(stats.maxValue * 0.6) + 1}-${Math.round(stats.maxValue * 0.8)}`, cls: 'bg-yellow-400' },
      { label: `${Math.round(stats.maxValue * 0.8) + 1}+`, cls: 'bg-red-500' }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">设备使用热力图</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">7 天 × 24 小时 使用频次分布</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="font-medium">图例（使用次数）:</span>
            {getLegendItems().map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded ${item.cls}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗺️</div>
            <p>暂无热力图数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="flex mb-2 ml-12">
                {hourLabels.map((h) => (
                  <div
                    key={h}
                    className={`flex-shrink-0 text-center text-xs text-gray-400 ${
                      parseInt(h) % 3 === 0 ? 'w-8' : 'w-8 opacity-50'
                    }`}
                  >
                    {parseInt(h) % 3 === 0 ? `${h}:00` : ''}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {dayLabels.map((day, dayIdx) => (
                  <div key={day} className="flex items-center">
                    <div className="w-12 text-sm text-gray-600 font-medium flex-shrink-0">
                      {day}
                    </div>
                    <div className="grid grid-cols-24 gap-1 flex-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                      {hourLabels.map((_, hourIdx) => {
                        const value = getValue(dayIdx, hourIdx);
                        return (
                          <div
                            key={hourIdx}
                            className={`aspect-square rounded ${getColorClass(value)} cursor-pointer hover:ring-2 hover:ring-primary-500 hover:scale-110 transition-all duration-150 relative`}
                            onMouseEnter={() => setHoverInfo({ day: dayIdx, hour: hourIdx, value })}
                            onMouseLeave={() => setHoverInfo(null)}
                          >
                            {hoverInfo && hoverInfo.day === dayIdx && hoverInfo.hour === hourIdx && value > 0 && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
                                <div className="font-medium">{dayLabels[dayIdx]} {hourIdx}:00-{hourIdx + 1}:00</div>
                                <div className="text-yellow-300 mt-0.5">{value} 次使用</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总使用次数</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">过去 7 天累计使用</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">时段平均</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.avgValue}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">每小时平均使用次数</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">高峰时段</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stats.peakHour >= 0 ? `${stats.peakHour}:00` : '-'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {stats.peakDay >= 0 ? `多见于 ${dayLabels[stats.peakDay]}` : '暂无数据'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">峰值次数</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.maxValue}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">单小时最高使用次数</p>
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage;
