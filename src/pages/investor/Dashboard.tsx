import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { investorApi } from '@/lib/api.ts';
import { formatMoney, formatVolume } from '@/utils/format.ts';
import { Coins, Wallet, Cpu, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function InvestorDashboard() {
  const [data, setData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await investorApi.dashboard();
        setData(d);
        const devices = await investorApi.devices();
        if (devices.length > 0) {
          const trend = await investorApi.deviceTrend(devices[0].id, 7);
          setTrendData(trend);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AppLayout role="investor">
        <div className="flex items-center justify-center h-64"><div className="animate-pulse text-deep-blue-700">加载中...</div></div>
      </AppLayout>
    );
  }

  const pieData = [
    { name: '在线', value: data?.totalDevices ? data.totalDevices - (data.faultDevices || 0) - Math.floor((data.totalDevices || 0) * 0.1) : 0, color: '#10B981' },
    { name: '离线', value: Math.floor((data?.totalDevices || 0) * 0.1), color: '#9CA3AF' },
    { name: '故障', value: data?.faultDevices || 0, color: '#FF6B35' },
  ];

  const statCards = [
    { label: '累计收益', value: formatMoney(data?.totalRevenue || 0), icon: <Coins size={24} />, gradient: 'from-vibrant-orange-400 to-vibrant-orange-600', glow: 'shadow-glow-orange' },
    { label: '可提现余额', value: formatMoney(data?.availableBalance || 0), icon: <Wallet size={24} />, gradient: 'from-green-400 to-green-600', glow: 'shadow-green-300' },
    { label: '设备总数', value: data?.totalDevices || 0, icon: <Cpu size={24} />, gradient: 'from-deep-blue-500 to-deep-blue-700', glow: 'shadow-glow-blue' },
    { label: '在线率', value: `${data?.onlineRate || 0}%`, icon: <Activity size={24} />, gradient: 'from-aqua-400 to-aqua-600', glow: 'shadow-glow-aqua' },
  ];

  return (
    <AppLayout role="investor">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-graphite-800">控制台总览</h2>
          <p className="text-sm text-graphite-500 mt-1">实时监控设备运行状态与收益数据</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => (
            <div key={idx} className="glass-card p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-lg ${card.glow} mb-3`}>
                {card.icon}
              </div>
              <p className="text-sm text-graphite-500 mb-1">{card.label}</p>
              <p className="text-2xl font-display font-bold text-graphite-800">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-aqua-600" />近7日收益趋势
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 600, color: '#1A1A2E' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="收益(元)" stroke="#00B4D8" strokeWidth={3} dot={{ r: 4, fill: '#00B4D8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-deep-blue-600" />设备状态分布
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-graphite-600">{d.name}</span>
                  <span className="font-semibold text-graphite-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {data?.faultDevices > 0 && (
          <div className="glass-card p-5 bg-gradient-to-r from-vibrant-orange-50 to-transparent border-l-4 border-vibrant-orange-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vibrant-orange-100 text-vibrant-orange-600 flex items-center justify-center animate-pulse">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="font-semibold text-graphite-800">故障告警</p>
                <p className="text-sm text-graphite-600">当前有 <span className="text-vibrant-orange-600 font-bold">{data.faultDevices}</span> 台设备需要处理，请前往设备管理查看详情</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-6">
          <h3 className="font-semibold text-graphite-800 mb-4">今日设备运行TOP</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-graphite-50 to-white border border-graphite-100 hover:border-aqua-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-graphite-800">设备 #{String(i).padStart(3, '0')}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">在线</span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-xs text-graphite-500">用水量</p>
                    <p className="text-lg font-bold text-deep-blue-700">{formatVolume(Math.random() * 200 + 50)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-graphite-500">收益</p>
                    <p className="text-lg font-bold text-vibrant-orange-600">{formatMoney(Math.random() * 50 + 10)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
