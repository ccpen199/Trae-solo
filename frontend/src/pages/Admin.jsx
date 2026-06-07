import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Activity, AlertTriangle, Clock, Eye, 
  TrendingUp, Cpu, Zap, User, Check, X 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell 
} from 'recharts';
import * as api from '../api.js';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('health');
  const [deviceHealth, setDeviceHealth] = useState(null);
  const [parental, setParental] = useState(null);
  const [energyTrends, setEnergyTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [healthRes, parentalRes, energyRes] = await Promise.all([
        api.getDeviceHealth(),
        api.getParentalStatus(),
        api.getEnergyTrends(30)
      ]);
      setDeviceHealth(healthRes.data);
      setParental(parentalRes.data);
      setEnergyTrends(energyRes.data);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateParental(data) {
    try {
      await api.updateParentalControls(data);
      await loadData();
    } catch (e) {
      alert('更新失败');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const healthDistribution = [
    { name: '健康', value: deviceHealth?.devices?.filter(d => d.healthScore >= 80).length || 0 },
    { name: '警告', value: deviceHealth?.devices?.filter(d => d.healthScore >= 50 && d.healthScore < 80).length || 0 },
    { name: '异常', value: deviceHealth?.devices?.filter(d => d.healthScore < 50).length || 0 }
  ];

  const tabs = [
    { id: 'health', label: '设备健康', icon: Activity },
    { id: 'parental', label: '儿童模式', icon: Shield },
    { id: 'energy', label: '能耗分析', icon: TrendingUp }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">后台管理</h1>
          <p className="text-slate-400 mt-1">设备监控与系统管理</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">设备总数</p>
                  <p className="text-2xl font-bold text-white mt-1">{deviceHealth?.summary.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Cpu className="text-blue-400" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">在线设备</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{deviceHealth?.summary.online || 0}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Check className="text-green-400" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">需更新固件</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{deviceHealth?.summary.needsUpdate || 0}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="text-amber-400" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">平均健康度</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{deviceHealth?.summary.avgHealth || 0}%</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Activity className="text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">设备健康列表</h3>
              <div className="space-y-3 max-h-[400px] overflow-auto">
                {deviceHealth?.devices?.map((device) => (
                  <div key={device.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{device.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {device.protocol.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">v{device.firmware_version}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              device.healthScore >= 80 ? 'bg-green-500' : 
                              device.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${device.healthScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          <span className={device.healthScore >= 80 ? 'text-green-400' : 
                            device.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
                            {device.healthScore}%
                          </span>
                        </span>
                      </div>
                      {device.warnings?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {device.warnings.map((w, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                              ⚠️ {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">健康分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={50} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {healthDistribution.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'parental' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Shield className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">儿童模式管控</h3>
                <p className="text-slate-400 text-sm">管理儿童使用时长和内容分级</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">今日已使用</p>
                <p className="text-4xl font-bold text-white">{parental?.used_time || 0}</p>
                <p className="text-slate-500 text-sm mt-1">分钟</p>
              </div>
              <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">每日限制</p>
                <p className="text-4xl font-bold text-blue-400">{parental?.daily_time_limit || 120}</p>
                <p className="text-slate-500 text-sm mt-1">分钟</p>
              </div>
              <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">剩余可用</p>
                <p className={`text-4xl font-bold ${parental?.remainingTime > 30 ? 'text-green-400' : parental?.remainingTime > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  {parental?.remainingTime || 0}
                </p>
                <p className="text-slate-500 text-sm mt-1">分钟</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">今日使用进度</span>
                <span className="text-white text-sm font-medium">{parental?.usagePercent || 0}%</span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (parental?.usagePercent || 0) >= 100 ? 'bg-red-500' :
                    (parental?.usagePercent || 0) >= 80 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, parental?.usagePercent || 0)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-300 text-sm mb-2">每日时间限制（分钟）</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="15"
                    value={parental?.daily_time_limit || 120}
                    onChange={(e) => handleUpdateParental({ dailyTimeLimit: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-16 text-right">{parental?.daily_time_limit || 120} 分钟</span>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">内容分级限制</label>
                <select
                  value={parental?.content_rating || 'all'}
                  onChange={(e) => handleUpdateParental({ contentRating: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">全部内容</option>
                  <option value="child">儿童友好（0-6岁）</option>
                  <option value="teen">青少年（7-12岁）</option>
                  <option value="mature">仅限成人</option>
                </select>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Eye className="text-amber-400 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="text-amber-200 font-medium">使用统计</p>
                  <p className="text-amber-300/70 text-sm mt-1">
                    今日已使用 {parental?.used_time || 0} 分钟，还剩 {parental?.remainingTime || 0} 分钟可用。
                    当使用时长超过每日限制时，系统将自动锁定内容服务。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'energy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <p className="text-slate-400 text-sm">30天总能耗</p>
              <p className="text-2xl font-bold text-white mt-1">{energyTrends?.totalConsumption?.toFixed(1) || 0} kWh</p>
              <p className="text-green-400 text-xs mt-1">较上月 ↓ 5.2%</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <p className="text-slate-400 text-sm">日均能耗</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{energyTrends?.avgDaily?.toFixed(1) || 0} kWh</p>
              <p className="text-slate-500 text-xs mt-1">过去30天</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <p className="text-slate-400 text-sm">峰时占比</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">68%</p>
              <p className="text-red-400 text-xs mt-1">高于平均 ↑</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <p className="text-slate-400 text-sm">估算电费</p>
              <p className="text-2xl font-bold text-green-400 mt-1">¥{((energyTrends?.totalConsumption || 0) * 0.56).toFixed(2)}</p>
              <p className="text-slate-500 text-xs mt-1">按 0.56 元/kWh</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">30天能耗趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyTrends?.dailyTrend || []}>
                  <defs>
                    <linearGradient id="energyAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(value) => [`${value} kWh`, '用电量']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#energyAdmin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">房间能耗排行</h3>
              <div className="space-y-3">
                {energyTrends?.byRoom?.sort((a, b) => b.value - a.value).map((room, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-sm font-medium">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">{room.room}</span>
                        <span className="text-amber-400 font-medium">{room.value.toFixed(1)} kWh</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                          style={{ width: `${(room.value / (energyTrends?.byRoom?.[0]?.value || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">节能建议</h3>
              <div className="space-y-3">
                {[
                  { title: '调整空调温度', desc: '将空调温度从24°C调整到26°C，每月可节省约15%电费', saving: '约 ¥45/月' },
                  { title: '使用智能场景', desc: '开启离家模式自动关闭不必要的设备', saving: '约 ¥30/月' },
                  { title: '峰谷用电优化', desc: '将洗衣机、热水器等大功率设备移到谷时使用', saving: '约 ¥20/月' }
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="text-green-400" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{tip.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{tip.desc}</p>
                    </div>
                    <span className="text-green-400 text-sm font-medium">{tip.saving}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
