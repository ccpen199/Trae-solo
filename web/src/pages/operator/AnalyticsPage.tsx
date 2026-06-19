import { useState, useEffect } from 'react';
import { analyticsApi } from '../../api';
import type { UsageStats, FunnelData } from '../../types';

const AnalyticsPage = () => {
  const [tab, setTab] = useState<'usage' | 'funnel'>('usage');
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'usage') {
        const res = await analyticsApi.getUsage();
        setUsage(res);
      } else {
        const res = await analyticsApi.getFunnel();
        setFunnel(res);
      }
    } catch (error) {
      console.error('加载分析数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const maxDailyUsage = usage?.dailyData?.length
    ? Math.max(...usage.dailyData.map((d) => d.usageMinutes))
    : 0;
  const maxDailyRevenue = usage?.dailyData?.length
    ? Math.max(...usage.dailyData.map((d) => d.revenue))
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">数据分析</h1>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('usage')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'usage' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          使用统计
        </button>
        <button
          onClick={() => setTab('funnel')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'funnel' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          漏斗分析
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : tab === 'usage' ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">累计使用时长</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {Math.floor((usage?.totalUsageMinutes || 0) / 60)} 小时
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">累计订单数</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{usage?.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">累计营收</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ¥{(usage?.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500">活跃用户</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{usage?.activeUsers || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">每日使用时长（分钟）</h2>
              <div className="flex items-end gap-2 h-48">
                {usage?.dailyData?.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                      style={{
                        height: `${(day.usageMinutes / (maxDailyUsage || 1)) * 100}%`,
                        minHeight: day.usageMinutes > 0 ? '4px' : '0'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {usage?.dailyData?.map((day) => (
                  <div key={day.date} className="flex-1 text-center text-xs text-gray-400">
                    {day.date.slice(5)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">每日营收</h2>
              <div className="flex items-end gap-2 h-48">
                {usage?.dailyData?.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all"
                      style={{
                        height: `${(day.revenue / (maxDailyRevenue || 1)) * 100}%`,
                        minHeight: day.revenue > 0 ? '4px' : '0'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {usage?.dailyData?.map((day) => (
                  <div key={day.date} className="flex-1 text-center text-xs text-gray-400">
                    {day.date.slice(5)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">用户转化漏斗</h2>
          {funnel.length > 0 ? (
            <div className="space-y-3">
              {funnel.map((item, idx) => {
                const maxCount = Math.max(...funnel.map((f) => f.count));
                const width = (item.count / maxCount) * 100;
                const colors = [
                  'from-blue-500 to-blue-400',
                  'from-green-500 to-green-400',
                  'from-yellow-500 to-yellow-400',
                  'from-orange-500 to-orange-400',
                  'from-red-500 to-red-400'
                ];
                return (
                  <div key={item.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {idx + 1}. {item.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{item.count} 人</span>
                        <span className="text-sm font-medium text-green-600">
                          转化率 {item.conversion.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-50 rounded-lg overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-lg flex items-center px-4 text-white text-sm font-medium transition-all`}
                        style={{ width: `${width}%` }}
                      >
                        {item.count}
                      </div>
                    </div>
                    {idx < funnel.length - 1 && (
                      <div className="text-center py-1">
                        <span className="text-xs text-gray-400">
                          ↓ 流失 {(100 - funnel[idx + 1].conversion).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">暂无漏斗数据</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
