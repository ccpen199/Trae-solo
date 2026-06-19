import { useState, useEffect } from 'react';
import { analyticsApi, adminApi } from '../../api';
import type { UsageStats, RevenueData, WorkOrderSummary } from '../../types';

const DashboardPage = () => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [workorderSummary, setWorkorderSummary] = useState<WorkOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usageRes, revenueRes, workorderRes] = await Promise.all([
        analyticsApi.getUsage(),
        analyticsApi.getRevenue(),
        adminApi.getWorkorderSummary()
      ]);
      setUsage(usageRes);
      setRevenue(revenueRes);
      setWorkorderSummary(workorderRes);
    } catch (error) {
      console.error('加载总览数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: '总营收', value: revenue ? `¥${revenue.total.toFixed(2)}` : '¥0.00', icon: '💰', color: 'bg-green-500' },
    { label: '使用总时长', value: usage ? `${Math.floor(usage.totalUsageMinutes / 60)} 小时` : '0 小时', icon: '⏱️', color: 'bg-blue-500' },
    { label: '总订单数', value: usage?.totalOrders || 0, icon: '📋', color: 'bg-orange-500' },
    { label: '活跃用户', value: usage?.activeUsers || 0, icon: '👥', color: 'bg-purple-500' }
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">运营总览</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">月度营收趋势</h2>
          {revenue && revenue.byMonth.length > 0 ? (
            <div className="space-y-3">
              {revenue.byMonth.map((item) => (
                <div key={item.month} className="flex items-center">
                  <span className="w-16 text-sm text-gray-500">{item.month}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden mx-3">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      style={{
                        width: `${(item.revenue / (revenue.byMonth.reduce((a, b) => Math.max(a, b.revenue), 0) || 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-gray-700">
                    ¥{item.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">暂无数据</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">按设备类型营收</h2>
          {revenue && Object.keys(revenue.byDeviceType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(revenue.byDeviceType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">
                      {type === 'washing_machine' && '🧺'}
                      {type === 'water_purifier' && '💧'}
                      {type === 'shower' && '🚿'}
                    </span>
                    <span className="text-gray-700">
                      {type === 'washing_machine' && '洗衣机'}
                      {type === 'water_purifier' && '饮水机'}
                      {type === 'shower' && '淋浴终端'}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">¥{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">暂无数据</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">工单统计</h2>
        {workorderSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-gray-800">{workorderSummary.total}</p>
              <p className="text-sm text-gray-500 mt-1">总工单</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-yellow-600">{workorderSummary.open}</p>
              <p className="text-sm text-gray-500 mt-1">待处理</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-600">{workorderSummary.inProgress}</p>
              <p className="text-sm text-gray-500 mt-1">处理中</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-600">{workorderSummary.resolved}</p>
              <p className="text-sm text-gray-500 mt-1">已解决</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
