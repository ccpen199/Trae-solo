import { useEffect, useState } from 'react';
import {
  Building2, Users, CalendarCheck, AlertTriangle, TrendingUp,
  MapPin, Award, ChevronRight, Clock, Bell, Shield
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';
import type { CreditDistribution, InterviewOrder, ResignWarning } from '@shared/types';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#FF7A00', '#EF4444'];

interface DashboardSummary {
  factories: { total: number; whitelist: number; graylist: number; blacklist: number };
  workers: { total: number; verified: number; employed: number; avgCreditScore: number };
  orders: { total: number; today: number; employed: number; passed: number; successRate: number };
  warnings: { total: number; high: number; recentResignTotal: number };
  market?: { totalVacancy: number; totalSeekers: number; avgSaturation: number; avgSalary: number };
}

interface BrokerRank { rank: number; name: string; rating: number; orders: number; region: string; }

function StatCard({ icon: Icon, label, value, subValue, color, bgClass }: {
  icon: typeof Building2; label: string; value: string | number; subValue?: string; color: string; bgClass: string;
}) {
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center shrink-0', bgClass)}>
        <Icon className={cn('w-7 h-7', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-900 leading-none">{value}</div>
        {subValue && <div className="text-xs text-gray-400 mt-2">{subValue}</div>}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
    </div>
  );
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '待指派', cls: 'bg-gray-100 text-gray-600' },
    broker_assigned: { label: '已派单', cls: 'bg-blue-50 text-blue-600' },
    pickup_scheduled: { label: '待接车', cls: 'bg-purple-50 text-purple-600' },
    arrived: { label: '已到达', cls: 'bg-cyan-50 text-cyan-600' },
    documents_copied: { label: '证件已办', cls: 'bg-indigo-50 text-indigo-600' },
    training_done: { label: '培训完成', cls: 'bg-teal-50 text-teal-600' },
    interviewing: { label: '面试中', cls: 'bg-amber-50 text-amber-600' },
    passed: { label: '面试通过', cls: 'bg-success-50 text-success-600' },
    failed: { label: '未通过', cls: 'bg-gray-100 text-gray-600' },
    employed: { label: '已入职', cls: 'bg-success-50 text-success-600' },
  };
  const cfg = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={cn('badge', cfg.cls)}>{cfg.label}</span>;
}

interface SuccessRateItem { month: string; rate: number; count: number; }
interface RegionSupplyItem { region: string; vacancy: number; seekers: number; }

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [creditDist, setCreditDist] = useState<CreditDistribution | null>(null);
  const [latestOrders, setLatestOrders] = useState<InterviewOrder[]>([]);
  const [warnings, setWarnings] = useState<ResignWarning[]>([]);
  const [successRateData, setSuccessRateData] = useState<SuccessRateItem[]>([]);
  const [regionSupplyData, setRegionSupplyData] = useState<RegionSupplyItem[]>([]);
  const [brokerRanks, setBrokerRanks] = useState<BrokerRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, cdRes, ordersRes, warningsRes, srRes, rsRes, brRes] = await Promise.all([
          get<DashboardSummary>('/dashboard/summary'),
          get<CreditDistribution>('/workers/credit-distribution'),
          get<InterviewOrder[]>('/interviews'),
          get<ResignWarning[]>('/warnings/resign'),
          get<SuccessRateItem[]>('/dashboard/success-rate-trend'),
          get<RegionSupplyItem[]>('/dashboard/region-supply'),
          get<BrokerRank[]>('/dashboard/broker-ranking'),
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (cdRes.success) setCreditDist(cdRes.data);
        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          setLatestOrders(ordersRes.data.slice(0, 6));
        }
        if (warningsRes.success && Array.isArray(warningsRes.data)) {
          setWarnings(warningsRes.data.slice(0, 3));
        }
        if (srRes.success && Array.isArray(srRes.data)) setSuccessRateData(srRes.data);
        if (rsRes.success && Array.isArray(rsRes.data)) setRegionSupplyData(rsRes.data);
        if (brRes.success && Array.isArray(brRes.data)) setBrokerRanks(brRes.data.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pieData = creditDist ? [
    { name: '优秀', value: creditDist.excellent, color: '#10B981' },
    { name: '良好', value: creditDist.good, color: '#3B82F6' },
    { name: '一般', value: creditDist.fair, color: '#F59E0B' },
    { name: '较差', value: creditDist.poor, color: '#FF7A00' },
    { name: '危险', value: creditDist.veryPoor, color: '#EF4444' },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand-600 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-500 text-sm mt-1">实时数据总览 · {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2">
            <Clock className="w-4 h-4" /> 刷新数据
          </button>
          <button className="btn-accent gap-2">
            <Bell className="w-4 h-4" /> 预警设置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          icon={Shield}
          label="白名单工厂数"
          value={summary?.factories.whitelist ?? '--'}
          subValue={`总计 ${summary?.factories.total ?? '--'} 家 · 灰${summary?.factories.graylist ?? 0} 黑${summary?.factories.blacklist ?? 0}`}
          color="text-brand-600"
          bgClass="bg-brand-50"
        />
        <StatCard
          icon={Users}
          label="在岗工人数"
          value={summary?.workers.employed ?? '--'}
          subValue={`已认证 ${summary?.workers.verified ?? '--'} 人 · 平均信用 ${summary?.workers.avgCreditScore ?? '--'} 分`}
          color="text-success-600"
          bgClass="bg-success-50"
        />
        <StatCard
          icon={CalendarCheck}
          label="今日预约面试"
          value={summary?.orders.today ?? '--'}
          subValue={`本月成功率 ${summary?.orders.successRate ?? '--'}% · 通过 ${summary?.orders.passed ?? '--'} 人`}
          color="text-accent-600"
          bgClass="bg-accent-50"
        />
        <StatCard
          icon={AlertTriangle}
          label="异常预警工厂数"
          value={summary?.warnings.high ?? '--'}
          subValue={`近30天异常离职 ${summary?.warnings.recentResignTotal ?? '--'} 人`}
          color="text-danger-600"
          bgClass="bg-danger-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <div className="card p-5">
          <h3 className="section-title mb-4">
            <Shield className="w-5 h-5 text-brand-600" /> 工人信用分分布
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">
            <TrendingUp className="w-5 h-5 text-success-600" /> 本月面试成功率趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="rate" name="成功率(%)" stroke="#1E3A5F" strokeWidth={2.5} dot={{ r: 4, fill: '#1E3A5F' }} />
                <Line type="monotone" dataKey="count" name="面试人数" stroke="#FF7A00" strokeWidth={2.5} dot={{ r: 4, fill: '#FF7A00' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">
            <MapPin className="w-5 h-5 text-accent-600" /> 区域供需对比
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionSupplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="vacancy" name="岗位空缺" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="seekers" name="求职人数" fill="#FF7A00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">
            <Award className="w-5 h-5 text-yellow-500" /> 经纪人服务评分 TOP5
          </h3>
          <div className="space-y-3">
            {brokerRanks.map((b) => (
              <div key={b.rank} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                  b.rank === 1 ? 'bg-yellow-400 text-white' :
                  b.rank === 2 ? 'bg-gray-300 text-gray-700' :
                  b.rank === 3 ? 'bg-amber-600 text-white' :
                  'bg-gray-100 text-gray-500'
                )}>{b.rank}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{b.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{b.region}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={cn('w-3 h-3', i < Math.floor(b.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{b.rating}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-brand-600">{b.orders}</div>
                  <div className="text-xs text-gray-400">订单</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <CalendarCheck className="w-5 h-5 text-brand-600" /> 最新面试订单
            </h3>
            <button className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[600px] space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {latestOrders.length === 0 && (
                <div className="text-center text-gray-400 py-12">暂无订单数据</div>
              )}
              {latestOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-brand-100 hover:bg-brand-50/30 transition">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {o.workerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{o.workerName}</span>
                      <span className="text-xs text-gray-400">{o.workerPhone}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 truncate">
                      <span className="text-brand-600 font-medium">{o.factoryName}</span>
                      <span className="mx-1.5">·</span>
                      {o.jobTitle}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {getStatusBadge(o.status)}
                    <div className="text-xs text-gray-400 mt-1.5">{new Date(o.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <AlertTriangle className="w-5 h-5 text-danger-600" /> 最新预警
            </h3>
            <button className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {warnings.length === 0 && (
              <div className="text-center text-gray-400 py-12">暂无预警数据</div>
            )}
            {warnings.map((w) => (
              <div key={w.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-soft transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'badge',
                      w.riskLevel === 'high' ? 'bg-danger-100 text-danger-600' :
                      w.riskLevel === 'medium' ? 'bg-warning-100 text-warning-600' :
                      'bg-success-100 text-success-600'
                    )}>
                      {w.riskLevel === 'high' ? '高风险' : w.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </span>
                    <span className={cn(
                      'text-xs flex items-center gap-0.5',
                      w.trend === 'up' ? 'text-danger-500' : w.trend === 'down' ? 'text-success-500' : 'text-gray-400'
                    )}>
                      {w.trend === 'up' ? '↑ 上升' : w.trend === 'down' ? '↓ 下降' : '→ 稳定'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(w.reportedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-semibold text-gray-900 mb-1">{w.factoryName}</div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span>风险分 <b className="text-gray-700">{w.riskScore}</b></span>
                  <span>近30天离职 <b className="text-danger-600">{w.recentResignCount}</b>人</span>
                  <span>离职率 <b className="text-gray-700">{w.resignRate}%</b></span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5 border-l-3 border-accent-500">
                  💡 {w.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
