import { useState, useEffect } from 'react';
import { analyticsApi } from '../../api';
import type { HeatmapData } from '../../types';

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const HeatmapPage = () => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getHeatmap();
      setData(res);
      if (res.length > 0) {
        setMaxValue(Math.max(...res.map((d) => d.value)));
      }
    } catch (error) {
      console.error('加载热力图数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-50';
    const ratio = value / (maxValue || 1);
    if (ratio < 0.25) return 'bg-green-100';
    if (ratio < 0.5) return 'bg-green-300';
    if (ratio < 0.75) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getValue = (day: number, hour: number) => {
    const item = data.find((d) => d.day === day && d.hour === hour);
    return item?.value || 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">使用热力图</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">设备使用时段分布</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>使用频率:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded" />
              <span>低</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-300 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-400 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>高</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="flex mb-2">
                <div className="w-16" />
                {hours.map((hour) => (
                  <div key={hour} className="w-8 text-center text-xs text-gray-400">
                    {hour.slice(0, -3)}
                  </div>
                ))}
              </div>
              {days.map((day, dayIdx) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-16 text-sm text-gray-600">{day}</div>
                  {hours.map((_, hourIdx) => {
                    const value = getValue(dayIdx, hourIdx);
                    return (
                      <div
                        key={hourIdx}
                        className={`w-7 h-7 mr-1 rounded ${getColor(value)} cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all`}
                        title={`${day} ${hours[hourIdx]}: ${value} 次使用`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">高峰时段</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">19:00 - 22:00</p>
          <p className="text-xs text-gray-400 mt-1">晚间使用最集中</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">低谷时段</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">02:00 - 06:00</p>
          <p className="text-xs text-gray-400 mt-1">凌晨基本无人使用</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">最忙日期</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">周六、周日</p>
          <p className="text-xs text-gray-400 mt-1">周末使用量约为工作日2倍</p>
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage;
