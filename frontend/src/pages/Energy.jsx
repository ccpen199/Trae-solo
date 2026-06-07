import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend 
} from 'recharts';
import * as api from '../api.js';

export default function Energy() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [timeRange, setTimeRange] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        api.getEnergyOverview(),
        api.getEnergyTrends(timeRange)
      ]);
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
    } catch (e) {
      console.error('Failed to load energy data:', e);
    } finally {
      setLoading(false);
    }
  }

  const stats = overview ? [
    { label: '今日用电', value: `${overview.todayUsage} kWh`, icon: Zap, color: 'blue' },
    { label: '本月用电', value: `${overview.monthUsage} kWh`, icon: Clock, color: 'purple' },
    { label: '累计用电', value: `${overview.totalUsage} kWh`, icon: BarChart3, color: 'amber' },
    { label: '预计电费', value: `¥${overview.estimatedCost}`, icon: DollarSign, color: 'green' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">能耗监控</h1>
          <p className="text-slate-400 mt-1">家庭能源消耗分析</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {days}天
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const bgColors = {
            blue: 'bg-blue-500/10 text-blue-400',
            amber: 'bg-amber-500/10 text-amber-400',
            green: 'bg-green-500/10 text-green-400',
            purple: 'bg-purple-500/10 text-purple-400'
          };
          
          return (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${bgColors[stat.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">用电趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.dailyTrend || []}>
                <defs>
                  <linearGradient id="energyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value) => [`${value} kWh`, '用电量']}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#energyArea)" strokeWidth={2} name="用电量" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">房间用电分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.byRoom || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis type="category" dataKey="room" stroke="#94a3b8" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value) => [`${value} kWh`, '用电量']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="用电量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">用电统计摘要</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">总用电量</p>
            <p className="text-3xl font-bold text-white">{trends?.totalConsumption?.toFixed(1) || 0}</p>
            <p className="text-slate-500 text-sm">kWh / {timeRange}天</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">日均用电量</p>
            <p className="text-3xl font-bold text-blue-400">{trends?.avgDaily?.toFixed(1) || 0}</p>
            <p className="text-slate-500 text-sm">kWh / 天</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">统计房间</p>
            <p className="text-3xl font-bold text-green-400">{trends?.byRoom?.length || 0}</p>
            <p className="text-slate-500 text-sm">个房间</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">计量设备</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium text-sm">计量单元</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">所属房间</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">累计消耗</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">最后读数</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">最后读数时间</th>
              </tr>
            </thead>
            <tbody>
              {trends?.byRoom?.map((room, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="p-3 text-white">电表 - {room.room}</td>
                  <td className="p-3 text-slate-300">{room.room}</td>
                  <td className="p-3 text-amber-400 font-medium">{room.value.toFixed(2)} kWh</td>
                  <td className="p-3 text-slate-300">{(room.value / timeRange).toFixed(2)} kWh</td>
                  <td className="p-3 text-slate-400 text-sm">{new Date().toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
