import { useState, useEffect } from 'react';
import { analyticsApi, deviceApi, adminApi } from '../../api';
import type { UsageStats, RevenueData, Device, Area } from '../../types';

const typeLabelMap: Record<string, string> = {
  washer: '洗衣机',
  water_dispenser: '饮水机',
  shower: '淋浴终端'
};

const DashboardPage = () => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usageRes, revenueRes, deviceRes, areaRes] = await Promise.all([
        analyticsApi.getUsage(),
        analyticsApi.getRevenue(),
        deviceApi.getList({ pageSize: 500 }),
        adminApi.getAreas()
      ]);
      setUsage(usageRes);
      setRevenue(revenueRes);
      setDevices(deviceRes.items || []);
      setAreas(areaRes || []);
    } catch (error) {
      console.error('加载总览数据失败', error);
      alert('加载总览数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
  };

  const maxMonthlyRevenue = revenue?.byMonth?.length
    ? Math.max(...revenue.byMonth.map(r => r.revenue))
    : 0;

  const dailyUsageData = usage?.dailyData?.slice(-7) || [];
  const maxDailyUsage = dailyUsageData.length ? Math.max(...dailyUsageData.map(d => d.usageMinutes)) : 0;

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">运营总览</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: '总营收', value: `¥${(revenue?.total || 0).toFixed(2)}`, icon: '💰', color: 'bg-green-500' },
          { label: '总订单数', value: usage?.totalOrders || 0, icon: '📋', color: 'bg-blue-500' },
          { label: '总使用时长', value: formatHours(usage?.totalUsageMinutes || 0), icon: '⏱️', color: 'bg-indigo-500' },
          { label: '活跃用户数', value: usage?.activeUsers || 0, icon: '👥', color: 'bg-purple-500' },
          { label: '设备总数', value: devices.length, icon: '📱', color: 'bg-orange-500' },
          { label: '区域数', value: areas.length, icon: '📍', color: 'bg-pink-500' }
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-800 mt-2 break-words">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">月度营收趋势</h2>
          {revenue?.byMonth && revenue.byMonth.length > 0 ? (
            <div className="space-y-4">
              {revenue.byMonth.map((item) => (
                <div key={item.month} className="flex items-center">
                  <span className="w-20 text-sm text-gray-500 flex-shrink-0">{item.month}</span>
                  <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden mx-3">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.revenue / (maxMonthlyRevenue || 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="w-24 text-right text-sm font-medium text-gray-700 flex-shrink-0">
                    ¥{item.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              暂无营收数据
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">近 7 天使用统计</h2>
          {dailyUsageData.length > 0 ? (
            <div>
              <div className="flex items-end justify-between gap-2 h-48 px-2">
                {dailyUsageData.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">
                        {day.usageMinutes > 0 ? `${Math.round(day.usageMinutes / 60)}h` : ''}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500"
                        style={{
                          height: `${Math.max((day.usageMinutes / (maxDailyUsage || 1)) * 100, day.usageMinutes > 0 ? 4 : 0)}%`,
                          minHeight: day.usageMinutes > 0 ? '8px' : '0'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 px-2">
                {dailyUsageData.map((day) => (
                  <div key={day.date} className="flex-1 text-center text-xs text-gray-400">
                    {day.date.slice(5)}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">日均使用</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {formatHours(Math.round(dailyUsageData.reduce((s, d) => s + d.usageMinutes, 0) / dailyUsageData.length))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">日均订单</p>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    {Math.round(dailyUsageData.reduce((s, d) => s + d.orders, 0) / dailyUsageData.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">日均营收</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ¥{(dailyUsageData.reduce((s, d) => s + d.revenue, 0) / dailyUsageData.length).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📈</div>
              暂无使用统计数据
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">按设备类型营收分布</h2>
        {revenue?.byDeviceType && Object.keys(revenue.byDeviceType).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(revenue.byDeviceType).map(([type, amount]) => {
              const pct = revenue.total > 0 ? Math.round((amount / revenue.total) * 100) : 0;
              return (
                <div key={type} className="p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 font-medium">{typeLabelMap[type] || type}</span>
                    <span className="text-2xl">
                      {type === 'washer' ? '🧺' : type === 'water_dispenser' ? '💧' : type === 'shower' ? '🚿' : '📱'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-2">¥{amount.toFixed(2)}</p>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        type === 'washer' ? 'bg-blue-500' : type === 'water_dispenser' ? 'bg-cyan-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-right">占比 {pct}%</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            暂无设备类型营收数据
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
