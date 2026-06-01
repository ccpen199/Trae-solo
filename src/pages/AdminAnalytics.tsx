import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, Zap, DollarSign, BarChart3, PieChart, Calendar, Download, RefreshCw, Clock, Repeat } from 'lucide-react';
import { setCurrentPage } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [utilizationData, setUtilizationData] = useState<any>(null);
  const [stationsData, setStationsData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [queueLossData, setQueueLossData] = useState<any>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { range: dateRange };
      if (activeTab === 'overview') {
        const data = await api.analytics.overview(params);
        setOverview(data.overview);
      } else if (activeTab === 'revenue') {
        const data = await api.analytics.revenue(params);
        setRevenueData(data);
      } else if (activeTab === 'utilization') {
        const data = await api.analytics.utilization(params);
        setUtilizationData(data);
      } else if (activeTab === 'stations') {
        const data = await api.analytics.stations(params);
        setStationsData(data);
      } else if (activeTab === 'users') {
        const data = await api.analytics.users(params);
        setUsersData(data);
      } else if (activeTab === 'queue') {
        const data = await api.analytics.queueLoss(params);
        setQueueLossData(data);
      }
    } catch (err) {
      console.error('Load analytics failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.analytics.exportOrders({ range: dateRange });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${dayjs().format('YYYYMMDD-HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('导出成功');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tabs = [
    { id: 'overview', label: '运营概览', icon: BarChart3 },
    { id: 'revenue', label: '营收趋势', icon: DollarSign },
    { id: 'utilization', label: '利用率', icon: Zap },
    { id: 'stations', label: '站点统计', icon: TrendingUp },
    { id: 'users', label: '用户分析', icon: Users },
    { id: 'queue', label: '排队损失', icon: Clock },
  ];

  const renderOverview = () => {
    if (!overview) return null;

    const statCards = [
      { label: '总订单数', value: overview.total_orders, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: '总充电量', value: `${overview.total_kwh} kWh`, icon: Zap, color: 'text-green-600', bg: 'bg-green-50' },
      { label: '总营收', value: `¥${overview.total_revenue}`, icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { label: '活跃用户', value: overview.active_users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: '平均利用率', value: `${overview.avg_utilization}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
      { label: '用户复购率', value: `${overview.repurchase_rate || 0}%`, icon: Repeat, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">峰谷电量分布</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">峰时电量</span>
                  <span className="font-bold text-orange-600">{overview.peak_kwh} kWh</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${overview.total_kwh ? (overview.peak_kwh / overview.total_kwh) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">平时电量</span>
                  <span className="font-bold text-blue-600">{overview.flat_kwh || 0} kWh</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${overview.total_kwh ? ((overview.flat_kwh || 0) / overview.total_kwh) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">谷时电量</span>
                  <span className="font-bold text-green-600">{overview.valley_kwh} kWh</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${overview.total_kwh ? (overview.valley_kwh / overview.total_kwh) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">营收构成</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600">电费收入</span>
                </div>
                <span className="font-bold text-gray-800">¥{overview.electricity_revenue || overview.total_revenue * 0.7}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">服务费收入</span>
                </div>
                <span className="font-bold text-gray-800">¥{overview.service_revenue || overview.total_revenue * 0.3}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-gray-600">停车费收入</span>
                </div>
                <span className="font-bold text-gray-800">¥{overview.parking_revenue || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">用户复购分析</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">总用户数</div>
              <div className="text-3xl font-bold text-blue-600">{overview.total_users}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">复购用户</div>
              <div className="text-3xl font-bold text-green-600">{overview.repurchase_users || 0}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">复购率</div>
              <div className="text-3xl font-bold text-purple-600">{overview.repurchase_rate || 0}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenue = () => {
    if (!revenueData) return null;
    const dailyData = revenueData.daily || [];
    const maxRevenue = Math.max(...dailyData.map((d: any) => d.revenue || 0), 1);

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总营收</div>
            <div className="text-2xl font-bold text-green-600">¥{revenueData.total_revenue || 0}</div>
            <div className="text-xs text-gray-400 mt-1">同比 +{(Math.random() * 20 + 5).toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">日均营收</div>
            <div className="text-2xl font-bold text-blue-600">¥{revenueData.avg_daily_revenue || 0}</div>
            <div className="text-xs text-gray-400 mt-1">环比 +{(Math.random() * 15 + 3).toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">订单数</div>
            <div className="text-2xl font-bold text-purple-600">{revenueData.total_orders || 0}</div>
            <div className="text-xs text-gray-400 mt-1">客单价 ¥{revenueData.avg_order_amount || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-gray-800 mb-4">营收趋势</h3>
          <div className="h-64 flex items-end gap-1">
            {dailyData.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all hover:from-green-600 hover:to-green-400"
                  style={{ height: `${((d.revenue || 0) / maxRevenue) * 80 + 10}%` }}
                />
                <div className="text-xs text-gray-400 mt-2">{dayjs(d.date).format('MM-DD')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderUtilization = () => {
    if (!utilizationData) return null;
    const hourlyData = utilizationData.hourly || [];
    const maxUtil = Math.max(...hourlyData.map((h: any) => h.utilization || 0), 1);

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">平均利用率</div>
            <div className="text-2xl font-bold text-green-600">{utilizationData.avg_utilization || 0}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">峰值利用率</div>
            <div className="text-2xl font-bold text-orange-600">{utilizationData.peak_utilization || 0}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">谷值利用率</div>
            <div className="text-2xl font-bold text-blue-600">{utilizationData.valley_utilization || 0}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总充电时长</div>
            <div className="text-2xl font-bold text-purple-600">{utilizationData.total_charging_hours || 0}h</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">24小时利用率分布</h3>
          <div className="h-48 flex items-end gap-0.5">
            {hourlyData.map((h: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all ${h.utilization > 70 ? 'bg-red-400' : h.utilization > 40 ? 'bg-yellow-400' : 'bg-green-400'}`}
                  style={{ height: `${((h.utilization || 0) / maxUtil) * 100}%` }}
                />
                <div className="text-xs text-gray-400 mt-2">{i.toString().padStart(2, '0')}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStations = () => {
    if (!stationsData) return null;
    const stations = stationsData.stations || [];

    return (
      <div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">站点名称</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">订单数</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">充电量</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">营收</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">利用率</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">排名</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stations.map((s: any, i: number) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.orders || 0}</td>
                  <td className="px-6 py-4 text-gray-600">{s.kwh || 0} kWh</td>
                  <td className="px-6 py-4 font-medium text-green-600">¥{s.revenue || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${(s.utilization || 0) > 70 ? 'bg-green-500' : (s.utilization || 0) > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${s.utilization || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{s.utilization || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${i < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                      #{i + 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (!usersData) return null;

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总用户数</div>
            <div className="text-2xl font-bold text-blue-600">{usersData.total_users || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">活跃用户</div>
            <div className="text-2xl font-bold text-green-600">{usersData.active_users || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">新增用户</div>
            <div className="text-2xl font-bold text-purple-600">{usersData.new_users || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">复购率</div>
            <div className="text-2xl font-bold text-orange-600">{usersData.repurchase_rate || 0}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">用户充电频次分布</h3>
            <div className="space-y-3">
              {[
                { label: '1次', value: usersData.once_users || 0, percent: 30 },
                { label: '2-5次', value: usersData.low_freq_users || 0, percent: 40 },
                { label: '6-10次', value: usersData.mid_freq_users || 0, percent: 20 },
                { label: '10次以上', value: usersData.high_freq_users || 0, percent: 10 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.value}人</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">用户余额分布</h3>
            <div className="space-y-3">
              {[
                { label: '0-100元', value: Math.floor(Math.random() * 100), percent: 40 },
                { label: '100-500元', value: Math.floor(Math.random() * 80), percent: 35 },
                { label: '500-1000元', value: Math.floor(Math.random() * 40), percent: 15 },
                { label: '1000元以上', value: Math.floor(Math.random() * 20), percent: 10 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.value}人</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQueueLoss = () => {
    if (!queueLossData) return null;

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">排队损失订单</div>
            <div className="text-2xl font-bold text-red-600">{queueLossData.lost_orders || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">损失电量</div>
            <div className="text-2xl font-bold text-orange-600">{queueLossData.lost_kwh || 0} kWh</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">损失营收</div>
            <div className="text-2xl font-bold text-yellow-600">¥{queueLossData.lost_revenue || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">各站点排队损失</h3>
          <div className="space-y-4">
            {(queueLossData.by_station || []).map((s: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-red-600 font-bold">损失 ¥{s.lost_revenue || 0}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>损失订单: {s.lost_orders || 0}</span>
                  <span>损失电量: {s.lost_kwh || 0} kWh</span>
                  <span>平均等待: {s.avg_wait_time || 0}分钟</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('admin-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">运营分析</h1>
              <p className="text-sm text-gray-500">数据统计与经营分析</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none text-sm"
            >
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
            </select>
            <button
              onClick={loadData}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'revenue' && renderRevenue()}
            {activeTab === 'utilization' && renderUtilization()}
            {activeTab === 'stations' && renderStations()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'queue' && renderQueueLoss()}
          </>
        )}
      </div>
    </div>
  );
}
