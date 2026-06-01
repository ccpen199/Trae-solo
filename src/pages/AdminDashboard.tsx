import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Users, DollarSign, TrendingUp, AlertTriangle, Wrench, Battery, Car, Clock, Activity } from 'lucide-react';
import { setCurrentPage } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.overview();
      setOverview(data.overview);
    } catch (err) {
      console.error('Load overview failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = overview ? [
    { label: '总订单数', value: overview.total_orders, icon: Zap, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: '总充电量', value: `${overview.total_kwh} kWh`, icon: Battery, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
    { label: '总营收', value: `¥${overview.total_revenue}`, icon: DollarSign, color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50' },
    { label: '用户数', value: overview.total_users, icon: Users, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
    { label: '今日订单', value: overview.today_orders, icon: Activity, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50' },
    { label: '充电中', value: overview.charging_now, icon: TrendingUp, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50' },
    { label: '站点数', value: overview.stations, icon: Car, color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50' },
    { label: '设备总数', value: overview.chargers, icon: Wrench, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
  ] : [];

  const quickActions = [
    { label: '设备管理', page: 'admin-devices', icon: Wrench, color: 'bg-blue-50 text-blue-600' },
    { label: '工单管理', page: 'admin-workorders', icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
    { label: '告警中心', page: 'admin-alarms', icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: '运营分析', page: 'admin-analytics', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('profile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">运营管理后台</h1>
            <p className="text-sm text-gray-500">实时监控运营数据</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">运营概览</h2>
              <p className="text-blue-100">数据更新时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
            <button
              onClick={loadOverview}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              刷新数据
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statCards.map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <card.icon className={`w-6 h-6 ${card.color.includes('blue') ? 'text-blue-600' : card.color.includes('green') ? 'text-green-600' : card.color.includes('yellow') ? 'text-yellow-600' : card.color.includes('purple') ? 'text-purple-600' : card.color.includes('indigo') ? 'text-indigo-600' : card.color.includes('teal') ? 'text-teal-600' : card.color.includes('pink') ? 'text-pink-600' : 'text-orange-600'}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{card.value}</div>
                  <div className="text-sm text-gray-500">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">设备状态</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">在线设备</span>
                    <span className="font-bold text-green-600">{overview?.online_guns} 枪</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${overview ? (overview.online_guns / overview.guns) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">故障设备</span>
                    <span className="font-bold text-red-600">{overview?.fault_guns} 枪</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${overview ? (overview.fault_guns / overview.guns) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">峰谷电量</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">峰时电量</span>
                    <span className="font-bold text-orange-600">{overview?.peak_kwh} kWh</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">谷时电量</span>
                    <span className="font-bold text-blue-600">{overview?.valley_kwh} kWh</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">平均利用率</span>
                      <span className="font-bold text-green-600">{overview?.avg_utilization}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">待处理事项</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">活跃告警</div>
                      <div className="text-sm text-gray-500">{overview?.active_alarms} 条待处理</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                    <Wrench className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">待处理工单</div>
                      <div className="text-sm text-gray-500">{overview?.pending_work_orders} 条待处理</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="font-bold text-gray-800 mb-4">快捷操作</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(action.page)}
                    className={`p-5 rounded-xl ${action.color} hover:opacity-80 transition-opacity text-center`}
                  >
                    <action.icon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">{action.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-medium transition-colors ${activeTab === 'overview' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  今日实时
                </button>
                <button
                  onClick={() => setActiveTab('devices')}
                  className={`px-6 py-4 font-medium transition-colors ${activeTab === 'devices' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  今日营收
                </button>
              </div>
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">今日订单</div>
                      <div className="text-3xl font-bold text-green-600">{overview?.today_orders}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">今日电量</div>
                      <div className="text-3xl font-bold text-blue-600">{overview?.today_kwh} kWh</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">今日营收</div>
                      <div className="text-3xl font-bold text-yellow-600">¥{overview?.today_revenue}</div>
                    </div>
                  </div>
                )}
                {activeTab === 'devices' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-2">今日充电量趋势</div>
                      <div className="h-32 flex items-end gap-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded-t"
                            style={{ height: `${Math.random() * 80 + 20}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-2">站点营收排行</div>
                      <div className="space-y-2">
                        {['望京SOHO', '国贸中心', '中关村'].map((name, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500">{i + 1}</span>
                            <span className="flex-1 text-gray-700">{name}</span>
                            <span className="font-bold text-gray-800">¥{(Math.random() * 5000 + 1000).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
