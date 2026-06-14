import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { BarChart3, TrendingUp, Package, Users, Wallet, Heart, Activity, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  clothing: '#52B788',
  book: '#3B82F6',
  phone: '#F4845F',
};

const CATEGORY_LABELS: Record<string, string> = {
  clothing: '衣服',
  book: '图书',
  phone: '手机',
};

export default function Dashboard() {
  const { stats, trends, loading, fetchStats, fetchTrends } = useDashboardStore();
  const [period, setPeriod] = useState(7);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTrends(period);
  }, [period, fetchTrends]);

  const overview = (stats as any)?.overview || {};
  const orderCategory = (stats as any)?.orderCategory || [];
  const orderStatus = (stats as any)?.orderStatus || [];
  const inspection = (stats as any)?.inspection || {};
  const settlement = (stats as any)?.settlement || {};

  const pieData = orderCategory.map((c: any) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.count,
    color: CATEGORY_COLORS[c.category] || '#94A3B8',
  }));

  const statusMap: Record<string, string> = {
    pending: '待派单', dispatched: '已派单', picked_up: '已取件', inspecting: '质检中',
    priced: '已估价', confirmed: '已确认', settled: '已结算', donated: '已捐赠', rejected: '已拒绝',
  };
  const statusBarData = orderStatus.map((s: any) => ({
    name: statusMap[s.status] || s.status,
    count: s.count,
  }));

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-32" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 animate-pulse h-80" />
          <div className="bg-white rounded-xl p-6 animate-pulse h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-forest">数据看板</h1>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === d ? 'bg-forest text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              近{d}天
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Package className="w-6 h-6" />} label="总订单数" value={overview.totalOrders || 0} color="bg-mint/20 text-mint" />
        <StatCard icon={<Users className="w-6 h-6" />} label="注册用户" value={overview.totalUsers || 0} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="结算总额" value={`¥${(overview.totalSettlementAmount || 0).toLocaleString()}`} color="bg-accent/20 text-accent" />
        <StatCard icon={<Heart className="w-6 h-6" />} label="公益捐赠" value={`¥${(overview.totalCharityAmount || 0).toLocaleString()}`} color="bg-pink-100 text-pink-600" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-5 h-5" />} label="待处理质检" value={inspection.pending || 0} color="bg-amber-100 text-amber-600" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="已完成质检" value={inspection.completed || 0} color="bg-green-100 text-green-600" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="待结算笔数" value={settlement.pendingCount || 0} color="bg-orange-100 text-orange-600" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="待结算金额" value={`¥${(settlement.pendingAmount || 0).toLocaleString()}`} color="bg-red-100 text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">订单趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={(trends as any)?.orderTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="count" stroke="#52B788" fill="#52B788" fillOpacity={0.2} strokeWidth={2} name="订单数" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">结算趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={(trends as any)?.settlementTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="amount" stroke="#F4845F" fill="#F4845F" fillOpacity={0.2} strokeWidth={2} name="结算金额" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">品类分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">订单状态分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Bar dataKey="count" fill="#1B4332" radius={[4, 4, 0, 0]} name="订单数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
