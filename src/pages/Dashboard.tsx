import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { propertyApi, workOrderApi, transactionApi, leaseApi, dashboardApi } from '../utils/api';
import {
  Building2, ClipboardList, FileSignature, KeyRound,
  TrendingUp, Clock, AlertTriangle, CheckCircle2, ArrowRight,
  Video, LayoutGrid, Calculator, FileCheck, Shield,
  Banknote, PiggyBank, CreditCard, Star, Timer,
  Users, HeartPulse, Package, BadgeCheck, Percent,
  History, Zap, MapPin, Phone
} from 'lucide-react';
import {
  PROPERTY_STATUS_COLOR, PROPERTY_STATUS_MAP, PROPERTY_TYPE_MAP,
  WO_STATUS_COLOR, WO_STATUS_MAP, WO_TYPE_MAP, WO_TYPE_COLOR,
  TRANSACTION_STATUS_COLOR, TRANSACTION_STATUS_MAP,
  LEASE_STATUS_COLOR, LEASE_STATUS_MAP,
  DECORATION_MAP,
  CONTRACT_STATUS_MAP, CONTRACT_STATUS_COLOR, CONTRACT_TEMPLATE_MAP,
  DEPOSIT_STATUS_MAP, DEPOSIT_STATUS_COLOR,
  formatDate, formatPrice, formatCurrency, USER_ROLE_MAP
} from '../utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#1e3a5f', '#2d6696', '#4a82b0', '#7aa5c9', '#b0c9df'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [stats, setStats] = useState<any>({
    totalProperties: 0, activeProperties: 0,
    pendingOrders: 0, activeLeases: 0,
    activeTransactions: 0, urgentOrders: 0,
    totalCommission: 0, vacancyRate: 0,
  });
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [urgentOrders, setUrgentOrders] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [activeLeases, setActiveLeases] = useState<any[]>([]);
  const [propertyHealth, setPropertyHealth] = useState<any>(null);
  const [agentPerformance, setAgentPerformance] = useState<any>(null);
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [propRes, orderRes, txRes, leaseRes, healthRes, agentRes] = await Promise.all([
        propertyApi.list({ limit: 5 }),
        workOrderApi.list({ limit: 10 }),
        transactionApi.list({ limit: 5 }),
        leaseApi.list({ limit: 5 }),
        dashboardApi.propertyHealth().catch(() => ({ success: false })),
        dashboardApi.agentPerformance().catch(() => ({ success: false })),
      ]);

      const typeCount: Record<string, number> = {};
      propRes.list.forEach((p: any) => {
        typeCount[p.type] = (typeCount[p.type] || 0) + 1;
      });

      let totalCommission = 0;
      txRes.list.forEach((t: any) => {
        totalCommission += t.commission_amount || 0;
      });

      const activeProps = propRes.list.filter((p: any) => p.status === 'active').length;
      const vacancyRate = propRes.total > 0 ? Math.round((1 - activeProps / propRes.list.length) * 100) : 0;

      setStats({
        totalProperties: propRes.total,
        activeProperties: activeProps,
        pendingOrders: orderRes.list.filter((o: any) => o.status !== 'completed').length,
        urgentOrders: orderRes.list.filter((o: any) => o.priority === 'urgent' && o.status !== 'completed').length,
        activeTransactions: txRes.list.filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled').length,
        activeLeases: leaseRes.list.filter((l: any) => l.status === 'active').length,
        totalCommission,
        vacancyRate,
      });

      setRecentProperties(propRes.list);
      setUrgentOrders(orderRes.list.filter((o: any) => o.status !== 'completed').slice(0, 5));
      setRecentTransactions(txRes.list);
      setActiveLeases(leaseRes.list.filter((l: any) => l.status === 'active').slice(0, 5));
      if (healthRes.success) setPropertyHealth(healthRes.data);
      if (agentRes.success) setAgentPerformance(agentRes.data);

      const typeData = Object.entries(typeCount).map(([name, value]) => ({
        name: ({
          shared_rent: '合租', whole_rent: '整租', apartment: '公寓', second_hand: '二手房'
        } as any)[name] || name,
        value
      }));
      setTypeDistribution(typeData);
    } catch (e) {
      console.error('Load dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '总房源数', value: stats.totalProperties, icon: Building2, color: 'bg-primary-50 text-primary-600', change: `${stats.activeProperties} 上架中`, link: '/properties' },
    { label: '待处理工单', value: stats.pendingOrders, icon: ClipboardList, color: 'bg-accent-50 text-accent-600', change: `${stats.urgentOrders} 紧急`, link: '/work-orders' },
    { label: '进行中交易', value: stats.activeTransactions, icon: FileSignature, color: 'bg-blue-50 text-blue-600', change: '佣金五折', link: '/transactions' },
    { label: '履行中租约', value: stats.activeLeases, icon: KeyRound, color: 'bg-indigo-50 text-indigo-600', change: '稳定', link: '/leases' },
    { label: '累计佣金', value: formatCurrency(stats.totalCommission), icon: Banknote, color: 'bg-green-50 text-green-600', change: '五折优惠中', link: '/dashboard/agents' },
    { label: '空置率', value: `${stats.vacancyRate}%`, icon: HeartPulse, color: 'bg-red-50 text-red-600', change: stats.vacancyRate < 10 ? '健康' : '需关注', link: '/dashboard/property-health' },
  ];

  const transactionTrend = [
    { month: '1月', 交易: 8, 租约: 15, 佣金: 12.5 },
    { month: '2月', 交易: 12, 租约: 18, 佣金: 18.3 },
    { month: '3月', 交易: 15, 租约: 22, 佣金: 25.6 },
    { month: '4月', 交易: 18, 租约: 25, 佣金: 32.1 },
    { month: '5月', 交易: 22, 租约: 28, 佣金: 38.9 },
    { month: '6月', 交易: 25, 租约: 32, 佣金: 45.2 },
  ];

  const getSLAColor = (deadline: string) => {
    const now = new Date().getTime();
    const dl = new Date(deadline).getTime();
    const hours = (dl - now) / (1000 * 60 * 60);
    if (hours < 0) return 'text-red-600 bg-red-50';
    if (hours < 6) return 'text-orange-600 bg-orange-50';
    if (hours < 24) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getSLAStatus = (deadline: string) => {
    const now = new Date().getTime();
    const dl = new Date(deadline).getTime();
    const hours = (dl - now) / (1000 * 60 * 60);
    if (hours < 0) return `已超时 ${Math.abs(Math.round(hours))} 小时`;
    if (hours < 24) return `剩余 ${Math.round(hours)} 小时`;
    return `剩余 ${Math.round(hours / 24)} 天`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const roleName = USER_ROLE_MAP[user?.role || ''] || user?.role;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl p-6 text-white flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="w-5 h-5 text-accent-400" />
            <span className="text-sm text-primary-100">{roleName}工作台</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">欢迎回来，{user?.name}！</h2>
          <p className="text-primary-100">实时掌握房源动态、交易进度与服务工单，开始今天的工作</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            onClick={() => navigate('/properties/new')}
            className="px-5 py-2.5 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            新增房源
          </button>
          <button
            onClick={() => navigate('/work-orders')}
            className="px-5 py-2.5 bg-accent-500 text-white font-medium rounded-lg hover:bg-accent-600 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            处理工单
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'VR看房', icon: Video, color: 'bg-purple-50 text-purple-600', link: '/properties', show: true },
          { label: '户型图标注', icon: LayoutGrid, color: 'bg-indigo-50 text-indigo-600', link: '/properties', show: true },
          { label: '智能估价', icon: Calculator, color: 'bg-blue-50 text-blue-600', link: '/properties', show: true },
          { label: '电子签约', icon: FileCheck, color: 'bg-green-50 text-green-600', link: '/properties', show: true },
          { label: '佣金计算', icon: Percent, color: 'bg-accent-50 text-accent-600', link: '/transactions', show: true },
          { label: '资金监管', icon: Shield, color: 'bg-rose-50 text-rose-600', link: '/transactions', show: true },
          { label: '租金划扣', icon: CreditCard, color: 'bg-orange-50 text-orange-600', link: '/leases', show: true },
          { label: '押金托管', icon: PiggyBank, color: 'bg-teal-50 text-teal-600', link: '/leases', show: true },
        ].filter(item => item.show).map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.link)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{card.change}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{card.value}</div>
              <div className="text-sm text-gray-500 flex items-center justify-between">
                <span>{card.label}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            交易与租约趋势
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="交易" stroke="#1e3a5f" strokeWidth={2} dot={{ fill: '#1e3a5f' }} />
                <Line type="monotone" dataKey="租约" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="佣金" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            房源类型分布
          </h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {typeDistribution.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent properties */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              最新房源
            </h3>
            <button
              onClick={() => navigate('/properties')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {recentProperties.map((p: any) => (
              <div
                key={p.id}
                onClick={() => navigate(`/properties/${p.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-800 truncate">{p.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${PROPERTY_STATUS_COLOR[p.status]}`}>
                        {PROPERTY_STATUS_MAP[p.status]}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 shrink-0">
                        {PROPERTY_TYPE_MAP[p.type]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{p.address}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.vr_url && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">
                          <Video className="w-3 h-3" /> VR全景
                        </span>
                      )}
                      {p.floor_plan_json && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded">
                          <LayoutGrid className="w-3 h-3" /> 户型图标注
                        </span>
                      )}
                      {p.decoration_level && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                          <Calculator className="w-3 h-3" /> {DECORATION_MAP[p.decoration_level]}
                        </span>
                      )}
                      {p.area && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                          {p.rooms}室{p.halls}厅 · {p.area}㎡
                        </span>
                      )}
                      {p.contract_status && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${CONTRACT_STATUS_COLOR[p.contract_status]}`}>
                          <FileCheck className="w-3 h-3" />
                          {CONTRACT_TEMPLATE_MAP[p.contract_type] || '委托合同'} · {CONTRACT_STATUS_MAP[p.contract_status]}
                          {p.contract_hash && ' · 已存证'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-primary-600">{formatPrice(p.price, p.type)}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDate(p.created_at)}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/valuation/${p.id}`); }}
                      className="mt-2 text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1 ml-auto"
                    >
                      <Calculator className="w-3 h-3" /> 智能估价
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-accent-600" />
              待处理工单
            </h3>
            <button
              onClick={() => navigate('/work-orders')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {urgentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无待处理工单</div>
            ) : urgentOrders.map((o: any) => (
              <div
                key={o.id}
                onClick={() => navigate(`/work-orders/${o.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${WO_TYPE_COLOR[o.type]}`}>
                    {WO_TYPE_MAP[o.type]}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${WO_STATUS_COLOR[o.status]}`}>
                    {WO_STATUS_MAP[o.status]}
                  </span>
                  {o.sla_deadline && (
                    <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getSLAColor(o.sla_deadline)}`}>
                      <Timer className="w-3 h-3" />
                      {getSLAStatus(o.sla_deadline)}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-1">{o.description}</div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>{o.assignee_name || '待派单'}</span>
                  </div>
                  {o.supplier_name && (
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{o.supplier_name}</span>
                    </div>
                  )}
                </div>
                {o.logs && o.logs > 0 && (
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    {o.logs} 条处理记录可复查
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-blue-600" />
            最近交易
          </h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            全部交易 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">房源</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">交易双方</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">成交价</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">佣金（五折）</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">资金监管</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">过户进度</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTransactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-800">{t.property_name}</div>
                    <div className="text-xs text-gray-500">{t.property_address}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-700">买: {t.buyer_name}</div>
                    <div className="text-xs text-gray-500">卖: {t.seller_name}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-800">{formatCurrency(t.price)}</td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-green-600 font-medium">{formatCurrency(t.commission_amount)}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      原价 {formatCurrency(t.commission_amount * 2)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {t.fund_status === 'deposited' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 text-green-600">
                        <Shield className="w-3 h-3" /> 已监管
                      </span>
                    ) : t.fund_status === 'released' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                        <CheckCircle2 className="w-3 h-3" /> 已划转
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-50 text-yellow-600">
                        <Clock className="w-3 h-3" /> 待存入
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${TRANSACTION_STATUS_COLOR[t.status]}`}>
                        {TRANSACTION_STATUS_MAP[t.status]}
                      </span>
                      {t.current_node && (
                        <div className="text-xs text-gray-500 mt-1">当前: {t.current_node}</div>
                      )}
                      {t.nodes_completed !== undefined && t.nodes_total !== undefined && (
                        <div className="text-xs text-gray-400 mt-1">节点 {t.nodes_completed}/{t.nodes_total}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => navigate(`/transactions/${t.id}`)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lease & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active leases */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              租约履行
            </h3>
            <button
              onClick={() => navigate('/leases')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {activeLeases.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无履行中租约</div>
            ) : activeLeases.map((l: any) => (
              <div
                key={l.id}
                onClick={() => navigate(`/leases/${l.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-800">{l.property_name}</div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${LEASE_STATUS_COLOR[l.status]}`}>
                    {LEASE_STATUS_MAP[l.status]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>租客: {l.tenant_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      <span>月租金: {formatCurrency(l.monthly_rent)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" />
                      <span>押金: {formatCurrency(l.deposit)}</span>
                      {l.deposit_status && (
                        <span className={`ml-1 px-1.5 py-0.5 text-xs rounded ${DEPOSIT_STATUS_COLOR[l.deposit_status]}`}>
                          {DEPOSIT_STATUS_MAP[l.deposit_status]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>信用分: {l.credit_score || '-'}</span>
                      {l.credit_score && l.credit_score >= 700 && (
                        <span className="ml-1 text-green-600 text-xs">优秀</span>
                      )}
                    </div>
                  </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-500">
                    租期: {formatDate(l.start_date)} ~ {formatDate(l.end_date)}
                  </div>
                  {l.next_payment_date && (
                    <div className="text-accent-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      下期: {formatDate(l.next_payment_date)}
                    </div>
                  )}
                </div>
                {l.payment_history && l.payment_history > 0 && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已自动划扣 {l.payment_history} 期，{l.overdue_count || 0} 次逾期
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Property health & agent performance */}
        <div className="space-y-6">
          {/* Property Health */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" />
                房源健康度
              </h3>
              <button
                onClick={() => navigate('/dashboard/property-health')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                详细诊断 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              {propertyHealth ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{propertyHealth.health_score || 85}</div>
                    <div className="text-xs text-gray-500 mt-1">综合健康分</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{propertyHealth.vacancy_rate || 12}%</div>
                    <div className="text-xs text-gray-500 mt-1">空置率</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-accent-600">{propertyHealth.conversion_rate || 28}%</div>
                    <div className="text-xs text-gray-500 mt-1">带看转化率</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{propertyHealth.price_deviation || 5.2}%</div>
                    <div className="text-xs text-gray-500 mt-1">价格偏离度</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">暂无健康度数据</div>
              )}
            </div>
          </div>

          {/* Agent Performance */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                经纪人业绩
              </h3>
              <button
                onClick={() => navigate('/dashboard/agents')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                业绩看板 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              {agentPerformance && agentPerformance.top_agents ? (
                <div className="space-y-3">
                  {agentPerformance.top_agents.slice(0, 3).map((a: any, idx: number) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{a.name}</div>
                        <div className="text-xs text-gray-500">{USER_ROLE_MAP[a.role] || a.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{formatCurrency(a.commission || 0)}</div>
                        <div className="text-xs text-gray-400">{a.transaction_count || 0} 笔成交</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">暂无业绩数据</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
