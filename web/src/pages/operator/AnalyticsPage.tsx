import { useState, useEffect } from 'react';
import { analyticsApi } from '../../api';
import type { UsageStats, FunnelData } from '../../types';

const funnelColors = [
  { bg: 'bg-gradient-to-r from-blue-600 to-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  { bg: 'bg-gradient-to-r from-cyan-600 to-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
  { bg: 'bg-gradient-to-r from-teal-600 to-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
  { bg: 'bg-gradient-to-r from-green-600 to-green-500', text: 'text-green-600', light: 'bg-green-50' },
  { bg: 'bg-gradient-to-r from-emerald-600 to-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' }
];

const AnalyticsPage = () => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usageRes, funnelRes] = await Promise.all([
        analyticsApi.getUsage(),
        analyticsApi.getFunnel()
      ]);
      setUsage(usageRes);
      setFunnel(funnelRes || []);
    } catch (error) {
      console.error('加载分析数据失败', error);
      alert('加载分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const dailyData = usage?.dailyData?.slice(-7) || [];
  const maxDailyMinutes = dailyData.length ? Math.max(...dailyData.map(d => d.usageMinutes), 1) : 1;

  const formatMinutes = (m: number) => {
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return min > 0 ? `${h}h${min}m` : `${h}h`;
    }
    return `${m}m`;
  };

  const funnelMaxCount = funnel.length > 0 ? Math.max(...funnel.map(f => f.count), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">数据分析</h1>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm">加载中...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">用户行为漏斗</h2>
              <div className="text-xs text-gray-400">
                总转化：
                {funnel.length >= 2 ? (
                  <span className="text-green-600 font-semibold ml-1">
                    {((funnel[funnel.length - 1].count / (funnel[0].count || 1)) * 100).toFixed(1)}%
                  </span>
                ) : '-'}
              </div>
            </div>

            {funnel.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">📥</div>
                暂无漏斗数据
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="space-y-1">
                  {funnel.map((item, idx) => {
                    const color = funnelColors[idx % funnelColors.length];
                    const widthPct = (item.count / funnelMaxCount) * 100;
                    const nextItem = funnel[idx + 1];
                    const stepConversion = nextItem
                      ? ((nextItem.count / (item.count || 1)) * 100).toFixed(1)
                      : null;

                    return (
                      <div key={item.stage} className="py-1">
                        <div className="flex items-center justify-between mb-2 px-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg ${color.light} ${color.text} flex items-center justify-center text-sm font-bold`}>
                              {idx + 1}
                            </span>
                            <span className="font-medium text-gray-700">{item.stage}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{item.count.toLocaleString()} 人</span>
                            <span className={`text-sm font-semibold ${color.text}`}>
                              {item.conversion.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div
                            className={`h-14 ${color.bg} rounded-xl flex items-center justify-center text-white font-bold shadow-sm transition-all duration-500 relative overflow-hidden`}
                            style={{ width: `${Math.max(widthPct, 15)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/10" />
                            <span className="relative z-10 text-lg tracking-wide">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {idx < funnel.length - 1 && (
                          <div className="flex justify-center my-2">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full">
                              <span className="text-gray-400">↓</span>
                              <span className="text-xs text-gray-500">
                                转化 <span className="text-green-600 font-semibold">{stepConversion}%</span>
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-xs text-gray-500">
                                流失 <span className="text-red-500 font-semibold">{(100 - parseFloat(stepConversion || '0')).toFixed(1)}%</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">漏斗顶部</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {funnel[0]?.count.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{funnel[0]?.stage || '-'}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">漏斗底部</p>
                    <p className="text-2xl font-bold text-green-600">
                      {funnel[funnel.length - 1]?.count.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{funnel[funnel.length - 1]?.stage || '-'}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">总转化率</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {funnel.length >= 2
                        ? ((funnel[funnel.length - 1].count / (funnel[0].count || 1)) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">完成用户占比</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-800">近 7 天设备使用统计</h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm" />
                  <span>使用分钟数</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 flex items-center justify-center">
                    <span className="w-3 h-0.5 bg-orange-400 rounded" />
                  </span>
                  <span>订单数</span>
                </div>
              </div>
            </div>

            {dailyData.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">📊</div>
                暂无使用数据
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-2 h-56 items-end px-1">
                  {dailyData.map((day, idx) => {
                    const barHeight = (day.usageMinutes / maxDailyMinutes) * 100;
                    return (
                      <div key={day.date} className="flex flex-col items-center justify-end h-full group">
                        <div className="mb-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-xs font-semibold text-blue-600">
                            {formatMinutes(day.usageMinutes)}
                          </div>
                          <div className="text-xs text-orange-500">{day.orders} 单</div>
                          <div className="text-xs text-green-600">¥{day.revenue.toFixed(0)}</div>
                        </div>

                        <div className="w-full flex flex-col items-center justify-end flex-1">
                          <div className="relative w-full max-w-[40px] flex justify-center">
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500 hover:from-blue-600 hover:to-blue-500 shadow-sm cursor-pointer relative"
                              style={{
                                height: `${Math.max(barHeight, day.usageMinutes > 0 ? 6 : 0)}%`,
                                minHeight: day.usageMinutes > 0 ? '20px' : '0'
                              }}
                            >
                              {day.orders > 0 && (
                                <div
                                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-orange-400 rounded-full shadow"
                                  title={`${day.orders} 订单`}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-center w-full">
                          <p className="text-xs font-medium text-gray-700">{day.date.slice(5)}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-gray-100">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 mb-1">累计使用时长</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatMinutes(dailyData.reduce((s, d) => s + d.usageMinutes, 0))}
                    </p>
                    <p className="text-xs text-blue-400 mt-1">近 7 天总计</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-xs text-orange-600 mb-1">累计订单数</p>
                    <p className="text-xl font-bold text-orange-700">
                      {dailyData.reduce((s, d) => s + d.orders, 0)}
                    </p>
                    <p className="text-xs text-orange-400 mt-1">日均 {Math.round(dailyData.reduce((s, d) => s + d.orders, 0) / dailyData.length)} 单</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 mb-1">累计营收</p>
                    <p className="text-xl font-bold text-green-700">
                      ¥{dailyData.reduce((s, d) => s + d.revenue, 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">日均 ¥{(dailyData.reduce((s, d) => s + d.revenue, 0) / dailyData.length).toFixed(0)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 mb-1">单日最高</p>
                    <p className="text-xl font-bold text-purple-700">
                      {formatMinutes(Math.max(...dailyData.map(d => d.usageMinutes)))}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      {dailyData.find(d => d.usageMinutes === Math.max(...dailyData.map(x => x.usageMinutes)))?.date.slice(5) || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
