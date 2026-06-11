import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, ShieldCheck, Eye, TrendingUp, ArrowUpRight,
  PlusCircle, ClipboardList, Glasses, Brain, User, ChevronRight,
  ChevronDown, Home, Shield, FileCheck, AlertTriangle,
  CheckCircle2, XCircle, Eye as EyeIcon, TrendingDown,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardStats, properties, agents, organizations } from '@/mock/data';

const statusConfig = {
  verified: { badge: 'badge-verified', label: '已验真' },
  pending: { badge: 'badge-pending', label: '待核验' },
  flagged: { badge: 'badge-flagged', label: '异常' },
} as const;

const metrics = [
  { label: '总房源数', value: dashboardStats.totalProperties, growth: dashboardStats.propertiesGrowth, icon: Building2, iconColor: 'text-primary-500', stroke: '#0D4F4F', dataKey: 'properties', to: '/properties' },
  { label: '验真通过率', value: `${dashboardStats.verificationRate}%`, growth: dashboardStats.verificationRateChange, icon: ShieldCheck, iconColor: 'text-status-success', stroke: '#10B981', dataKey: 'viewings', to: '/properties' },
  { label: '今日带看', value: dashboardStats.viewingsToday, growth: dashboardStats.viewingsGrowth, icon: Eye, iconColor: 'text-gold-400', stroke: '#D4A843', dataKey: 'transactions', to: '/dispatch' },
  { label: '月度成交额', value: `${dashboardStats.monthlyRevenue}亿`, growth: dashboardStats.revenueGrowth, icon: TrendingUp, iconColor: 'text-gold-400', stroke: '#D4A843', dataKey: 'properties', to: '/admin/performance' },
];

const quickActions = [
  { label: '房源录入', desc: '新增房源并触发AI验真', icon: PlusCircle, to: '/properties', variant: 'btn-primary' },
  { label: '带看派单', desc: '智能匹配经纪人派单', icon: ClipboardList, to: '/dispatch', variant: 'btn-gold' },
  { label: 'VR看房', desc: '交互埋点与热区分析', icon: Glasses, to: '/vr-analytics', variant: 'btn-primary' },
  { label: '购房决策', desc: '房贷模拟·税费精算·走势预测', icon: Brain, to: '/buyers', variant: 'btn-gold' },
  { label: '组织架构', desc: '门店团队人员管理', icon: Home, to: '/admin/org', variant: 'btn-primary' },
  { label: '业绩复查', desc: '穿透式业绩审计看板', icon: FileCheck, to: '/admin/performance', variant: 'btn-gold' },
];

const verifiedCount = properties.filter(p => p.verification.status === 'verified').length;
const pendingCount = properties.filter(p => p.verification.status === 'pending').length;
const flaggedCount = properties.filter(p => p.verification.status === 'flagged').length;

const statusPieData = [
  { name: '已验真', value: verifiedCount, color: '#10B981', key: 'verified' as const },
  { name: '待核验', value: pendingCount, color: '#F59E0B', key: 'pending' as const },
  { name: '异常', value: flaggedCount, color: '#EF4444', key: 'flagged' as const },
];

const storeData = organizations.flatMap(org =>
  org.stores.map(store => ({
    id: store.id,
    name: store.name,
    revenue: store.performance.totalRevenue,
    transactions: store.performance.transactionCount,
    conversionRate: store.performance.conversionRate,
    teamCount: store.teams.length,
    mom: store.performance.monthOverMonth,
  }))
).sort((a, b) => b.revenue - a.revenue);

const maxRevenue = Math.max(...storeData.map(s => s.revenue));
const rankedAgents = [...agents].sort((a, b) => b.totalTransactions - a.totalTransactions);
const rankStyles = ['bg-gold-400 text-white', 'bg-surface-300 text-white', 'bg-gold-700 text-white'];

type DrillFilter = 'all' | 'verified' | 'pending' | 'flagged';
const drillCards: { key: DrillFilter; label: string; count: number; color: string }[] = [
  { key: 'all', label: '总房源数', count: properties.length, color: 'bg-primary-500' },
  { key: 'verified', label: '验真通过', count: verifiedCount, color: 'bg-status-success' },
  { key: 'pending', label: '待核验', count: pendingCount, color: 'bg-status-warning' },
  { key: 'flagged', label: '异常房源', count: flaggedCount, color: 'bg-status-danger' },
];
const statusLabelMap: Record<string, string> = { verified: '已验真', pending: '待核验', flagged: '异常' };
const mortgageLabel: Record<string, { text: string; color: string }> = {
  none: { text: '无抵押', color: 'text-status-success' },
  active: { text: '有抵押', color: 'text-status-warning' },
  cleared: { text: '已结清', color: 'text-status-success' },
};

function VerificationDetail({ propertyId }: { propertyId: string }) {
  const p = properties.find(pr => pr.id === propertyId);
  if (!p) return null;
  const v = p.verification;
  const pr = p.propertyRights;
  return (
    <div className="mt-3 p-3 bg-surface-50 rounded-lg space-y-3 text-xs border border-surface-200">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-surface-500 mb-1">价格交叉比对 <span className={`font-bold ${v.priceCrossCheck.score >= 80 ? 'text-status-success' : v.priceCrossCheck.score >= 60 ? 'text-status-warning' : 'text-status-danger'}`}>{v.priceCrossCheck.score}分</span></p>
          <div className="space-y-0.5">
            {v.priceCrossCheck.sources.map(s => (
              <p key={s.platform} className="text-surface-600">{s.platform}: {s.price}万 <span className="text-surface-400">({s.lastUpdated})</span></p>
            ))}
            <p className="text-surface-400">偏差率: {v.priceCrossCheck.deviation}%</p>
          </div>
        </div>
        <div>
          <p className="text-surface-500 mb-1">图片篡改检测 <span className={`font-bold ${v.imageTampering.score >= 80 ? 'text-status-success' : v.imageTampering.score >= 60 ? 'text-status-warning' : 'text-status-danger'}`}>{v.imageTampering.score}分</span></p>
          <p className="text-surface-600">标记图片: {v.imageTampering.flaggedImages.length}张</p>
          {v.imageTampering.issues.map((issue, i) => (
            <p key={i} className="text-status-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{issue}</p>
          ))}
        </div>
        <div>
          <p className="text-surface-500 mb-1">经纪人一致性 <span className={`font-bold ${v.agentConsistency.score >= 80 ? 'text-status-success' : v.agentConsistency.score >= 60 ? 'text-status-warning' : 'text-status-danger'}`}>{v.agentConsistency.score}分</span></p>
          <p className="text-surface-600">在售房源: {v.agentConsistency.totalListings}套</p>
          <p className="text-surface-600">不一致: {v.agentConsistency.inconsistentCount}套</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-200">
        <div>
          <p className="text-surface-500 mb-1">产权核验</p>
          <p className="text-surface-600">抵押: <span className={mortgageLabel[pr.mortgageStatus].color}>{mortgageLabel[pr.mortgageStatus].text}</span></p>
          <p className="text-surface-600">查封: <span className={pr.seizureStatus === 'none' ? 'text-status-success' : 'text-status-danger'}>{pr.seizureStatus === 'none' ? '无查封' : '已查封'}</span></p>
          <p className="text-surface-400">核验时间: {pr.lastChecked}</p>
        </div>
        <div>
          <p className="text-surface-500 mb-1">VR与价格</p>
          <p className="text-surface-600">VR全景: {p.vrEnabled ? <span className="text-status-success">已开通</span> : <span className="text-surface-400">未开通</span>}</p>
          <p className="text-surface-600">历史成交: {p.priceHistory.filter(h => h.type === 'transaction').length}条</p>
          <p className="text-surface-600">价格区间: {Math.min(...p.priceHistory.map(h => h.price))}-{Math.max(...p.priceHistory.map(h => h.price))}万</p>
        </div>
      </div>
      <Link to={`/properties/${p.id}`} className="flex items-center gap-1 text-primary-500 hover:underline pt-1">
        查看完整房源详情 <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const [drillFilter, setDrillFilter] = useState<DrillFilter>('all');
  const [expandedVerification, setExpandedVerification] = useState<string | null>(null);

  const filteredProperties = drillFilter === 'all'
    ? properties
    : properties.filter(p => p.verification.status === drillFilter);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-header rounded-2xl p-8 text-white">
        <h1 className="font-serif text-3xl font-bold">房产交易可信协作平台</h1>
        <p className="mt-2 text-primary-200 text-sm">全方位房源验真 · 智能带看派单 · VR沉浸看房 · 数据驱动决策</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Link key={m.label} to={m.to} className="card card-hover p-5 block">
            <div className="flex items-center justify-between">
              <m.icon className={`w-8 h-8 ${m.iconColor}`} />
              <span className="flex items-center text-xs font-medium text-status-success">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />+{m.growth}%
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-surface-800">{m.value}</p>
              <p className="text-xs text-surface-400 mt-1">{m.label}</p>
            </div>
            <div className="h-10 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardStats.weeklyTrend}>
                  <Area type="monotone" dataKey={m.dataKey} stroke={m.stroke} fill={m.stroke} fillOpacity={0.1} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title mb-4">本周趋势</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dashboardStats.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip />
              <Area type="monotone" dataKey="properties" name="房源" stroke="#0D4F4F" fill="#0D4F4F" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="viewings" name="带看" stroke="#D4A843" fill="#D4A843" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="transactions" name="成交" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-4">验真动态</h2>
          <div className="space-y-3">
            {dashboardStats.recentVerifications.map((v) => (
              <div key={v.propertyId}>
                <button
                  onClick={() => setExpandedVerification(expandedVerification === v.propertyId ? null : v.propertyId)}
                  className="w-full flex items-start justify-between py-2 border-b border-surface-200/50 last:border-0 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700 truncate flex items-center gap-1">
                      {v.title}
                      {expandedVerification === v.propertyId ? <ChevronDown className="w-3 h-3 text-surface-400" /> : <ChevronRight className="w-3 h-3 text-surface-400" />}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{v.time} · 综合评分 {v.score}</p>
                  </div>
                  <span className={statusConfig[v.status].badge}>{statusConfig[v.status].label}</span>
                </button>
                {expandedVerification === v.propertyId && (
                  <VerificationDetail propertyId={v.propertyId} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to} className={`${action.variant} flex flex-col items-center justify-center gap-1 py-3 px-2`}>
            <action.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{action.label}</span>
            <span className="text-[10px] opacity-80">{action.desc}</span>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="section-title mb-4">穿透式业务看板</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 flex flex-col items-center">
            <h3 className="section-title mb-4 self-start">房源状态分布</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                  {statusPieData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value}套`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {statusPieData.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setDrillFilter(drillFilter === s.key ? 'all' : s.key)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${drillFilter === s.key ? 'text-primary-500 font-medium' : 'text-surface-600 hover:text-primary-400'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name} {s.value}套
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">门店业绩排名</h3>
            <div className="space-y-4">
              {storeData.map((store) => (
                <Link key={store.id} to="/admin/performance" className="block group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-700 font-medium group-hover:text-primary-500 transition-colors">{store.name}</span>
                    <span className="text-gold-500 font-semibold">{store.revenue}万</span>
                  </div>
                  <div className="h-3 bg-surface-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${(store.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-surface-400">
                    <span>{store.transactions}笔成交 · 转化率{store.conversionRate}%</span>
                    <span className={store.mom >= 0 ? 'text-status-success' : 'text-status-danger'}>
                      {store.mom >= 0 ? '+' : ''}{store.mom}% 环比
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/admin/performance" className="flex items-center justify-center gap-1 text-sm text-primary-500 hover:underline mt-4 pt-3 border-t border-surface-200">
              查看全部业绩穿透 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">经纪人排行榜</h3>
            <div className="space-y-3">
              {rankedAgents.map((agent, i) => (
                <Link key={agent.id} to={`/agents/${agent.id}`} className="flex items-center gap-3 py-1.5 group">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? rankStyles[i] : 'bg-surface-100 text-surface-500'}`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 group-hover:text-primary-500 transition-colors">{agent.name}</p>
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <span>{agent.totalTransactions}笔成交</span>
                      <span className="text-surface-300">|</span>
                      <span>转化率{((agent.conversionFunnel.transactions / agent.conversionFunnel.leads) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${agent.creditScore >= 90 ? 'badge-verified' : agent.creditScore >= 75 ? 'badge-pending' : 'badge-flagged'}`}>
                      {agent.creditScore}分
                    </span>
                    {agent.creditHistory.length > 0 && (
                      <span className={`text-[10px] ${agent.creditHistory[0].change >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                        {agent.creditHistory[0].change >= 0 ? '↑' : '↓'}{Math.abs(agent.creditHistory[0].change)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/agents" className="flex items-center justify-center gap-1 text-sm text-primary-500 hover:underline mt-4 pt-3 border-t border-surface-200">
              进入经纪人工作台 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">房源钻取面板</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {drillCards.map((card) => (
            <button
              key={card.key}
              onClick={() => setDrillFilter(drillFilter === card.key ? 'all' : card.key)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${drillFilter === card.key ? 'border-primary-500 shadow-card-hover' : 'border-surface-200 hover:border-surface-300'}`}
            >
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center text-white text-sm font-bold mb-2`}>
                {card.count}
              </div>
              <p className="text-sm font-medium text-surface-700">{card.label}</p>
              {drillFilter === card.key && <ChevronRight className="absolute top-4 right-3 w-4 h-4 text-primary-500" />}
            </button>
          ))}
        </div>

        {drillFilter !== 'all' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-surface-500">
                筛选：{statusLabelMap[drillFilter]} · 共 {filteredProperties.length} 条
              </p>
              <button onClick={() => setDrillFilter('all')} className="text-sm text-primary-500 hover:underline">清除筛选</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProperties.map((p) => (
                <Link
                  key={p.id}
                  to={`/properties/${p.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:shadow-card-hover transition-all group"
                >
                  <img src={p.images[0]} alt={p.title} className="w-16 h-12 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate group-hover:text-primary-500 transition-colors">{p.title}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{p.district} · {p.rooms}室{p.halls}厅 · {p.area}㎡</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-gold-500">{p.price}万</span>
                      <span className={statusConfig[p.verification.status].badge}>{statusLabelMap[p.verification.status]}</span>
                      {p.vrEnabled && <EyeIcon className="w-3 h-3 text-primary-400" />}
                      <span className={`text-[10px] ${mortgageLabel[p.propertyRights.mortgageStatus].color}`}>{mortgageLabel[p.propertyRights.mortgageStatus].text}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary-400 mt-1 flex-shrink-0" />
                </Link>
              ))}
            </div>
            <Link to="/properties" className="flex items-center justify-center gap-1 text-sm text-primary-500 hover:underline mt-4 pt-3 border-t border-surface-200">
              查看全部房源 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
