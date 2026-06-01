import { useState, useEffect } from 'react';
import { reportsApi, shiftsApi, refundsApi, reconciliationApi, mastersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Store,
  Calendar,
  CreditCard,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Scale,
  BarChart3,
  FileText,
  Eye,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';

interface DimensionData {
  id: number | string;
  name: string;
  sales: number;
  orders: number;
  avgAmount: number;
  refund: number;
  overShort: number;
  exception: number;
}

interface TodoItem {
  id: number;
  type: string;
  title: string;
  count: number;
  storeName?: string;
  date?: string;
  amount?: number;
  priority: 'high' | 'medium' | 'low';
}

export default function Home() {
  const [overview, setOverview] = useState<any>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'date' | 'channel' | 'cashier'>('store');
  const [dimensionData, setDimensionData] = useState<DimensionData[]>([]);
  const [pendingRefunds, setPendingRefunds] = useState<any[]>([]);
  const [pendingRecon, setPendingRecon] = useState<any[]>([]);
  const [exceptionOrders, setExceptionOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    store_id: '',
    start_date: '',
    end_date: '',
    cashier_id: '',
    channel: ''
  });

  const user = useAuthStore(state => state.user);
  const hasPermission = useAuthStore(state => state.hasPermission);
  const hasRole = useAuthStore(state => state.hasRole);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        store_id: filters.store_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        cashier_id: filters.cashier_id || undefined
      };

      const [
        overviewRes,
        shiftRes,
        storesRes,
        cashiersRes
      ] = await Promise.all([
        reportsApi.getOverview(params),
        hasPermission('shift:view') ? shiftsApi.getCurrentShift().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        mastersApi.getStores(),
        hasRole('admin', 'finance') ? mastersApi.getUsers({ role_id: 4 }) : Promise.resolve({ data: [] })
      ]);

      setOverview(overviewRes.data);
      setCurrentShift(shiftRes.data);
      setStores(storesRes.data.list || storesRes.data || []);
      setCashiers(cashiersRes.data.list || cashiersRes.data || []);

      if (hasRole('admin', 'finance', 'store_manager')) {
        const [refundsRes, reconRes, exceptionsRes] = await Promise.all([
          refundsApi.getRefunds({ status: 'pending', pageSize: 5 }),
          reconciliationApi.getReconciliations({ status: 'pending', pageSize: 5 }),
          reportsApi.getExceptions({ pageSize: 5 })
        ]);
        setPendingRefunds(refundsRes.data.list || refundsRes.data || []);
        setPendingRecon(reconRes.data.list || reconRes.data || []);
        setExceptionOrders(exceptionsRes.data.list || exceptionsRes.data || []);
      }

      loadDimensionData(activeTab);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDimensionData = async (tab: string) => {
    try {
      let res: any;
      const params = {
        store_id: filters.store_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined
      };

      switch (tab) {
        case 'store':
          res = await reportsApi.getByStore(params);
          break;
        case 'date':
          res = await reportsApi.getSalesTrend({ ...params, group_by: 'day' });
          break;
        case 'channel':
          res = await reportsApi.getByChannel(params);
          break;
        case 'cashier':
          res = await reportsApi.getByCashier(params);
          break;
      }

      const data = res.data.list || res.data || [];
      const formatted: DimensionData[] = data.map((item: any, index: number) => ({
        id: item.id || item.period || index,
        name: item.name || item.period || item.channel || item.real_name || item.username || '-',
        sales: item.total_sales || 0,
        orders: item.order_count || 0,
        avgAmount: item.avg_order_amount || (item.order_count ? item.total_sales / item.order_count : 0),
        refund: item.total_refund || 0,
        overShort: (item.total_expected || 0) - (item.total_actual || 0),
        exception: item.exception_count || 0
      }));
      setDimensionData(formatted);
    } catch (err) {
      console.error('Failed to load dimension data:', err);
      setDimensionData([]);
    }
  };

  const handleTabChange = (tab: 'store' | 'date' | 'channel' | 'cashier') => {
    setActiveTab(tab);
    loadDimensionData(tab);
  };

  const todoItems: TodoItem[] = [
    ...pendingRefunds.map(r => ({
      id: r.id,
      type: 'refund',
      title: `待审核退款 - ${r.order_no}`,
      count: pendingRefunds.length,
      storeName: r.store_name,
      date: r.created_at,
      amount: r.amount,
      priority: (r.amount > 100 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    })),
    ...pendingRecon.map(r => ({
      id: r.id,
      type: 'recon',
      title: `待对账 - ${r.store_name}`,
      count: pendingRecon.length,
      storeName: r.store_name,
      date: r.recon_date,
      amount: r.net_amount,
      priority: 'medium' as const
    })),
    ...exceptionOrders.map(o => ({
      id: o.id,
      type: 'exception',
      title: `异常订单 - ${o.order_no}`,
      count: exceptionOrders.length,
      storeName: o.store_name,
      date: o.created_at,
      amount: o.total_amount,
      priority: 'high' as const
    }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: '今日销售',
      value: formatCurrency(overview?.net_sales),
      change: '+12.5%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600',
      bg: 'bg-green-500'
    },
    {
      label: '今日订单',
      value: overview?.order_count || 0,
      change: '+8.3%',
      trend: 'up',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600',
      bg: 'bg-blue-500'
    },
    {
      label: '预计收款',
      value: formatCurrency(overview?.total_payable),
      change: '-2.1%',
      trend: 'down',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600',
      bg: 'bg-purple-500'
    },
    {
      label: '实际收款',
      value: formatCurrency(overview?.total_payable),
      change: '+0.5%',
      trend: 'up',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-indigo-50 text-indigo-600',
      bg: 'bg-indigo-500'
    },
    {
      label: '长短款',
      value: formatCurrency(0),
      change: '0%',
      trend: 'flat',
      icon: <Scale className="w-6 h-6" />,
      color: 'bg-gray-50 text-gray-600',
      bg: 'bg-gray-500'
    },
    {
      label: '对账完成率',
      value: `${overview?.recon_rate?.toFixed(1) || 0}%`,
      change: '+5.2%',
      trend: 'up',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-teal-50 text-teal-600',
      bg: 'bg-teal-500'
    },
    {
      label: '退款金额',
      value: formatCurrency(overview?.total_refund),
      change: '-15.3%',
      trend: 'down',
      icon: <RotateCcw className="w-6 h-6" />,
      color: 'bg-red-50 text-red-600',
      bg: 'bg-red-500'
    },
    {
      label: '退款率',
      value: `${overview?.refund_rate?.toFixed(2) || '0.00'}%`,
      change: '-3.1%',
      trend: 'down',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-600',
      bg: 'bg-orange-500'
    }
  ];

  const tabConfig = [
    { key: 'store', label: '按门店', icon: <Store className="w-4 h-4" /> },
    { key: 'date', label: '按日期', icon: <Calendar className="w-4 h-4" /> },
    { key: 'channel', label: '按支付渠道', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'cashier', label: '按收银员', icon: <UserCheck className="w-4 h-4" /> }
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  const getOverShortClass = (amount: number) => {
    if (amount > 0.01) return 'text-green-600 bg-green-50';
    if (amount < -0.01) return 'text-red-600 bg-red-50';
    return 'text-gray-500 bg-gray-50';
  };

  const getOverShortLabel = (amount: number) => {
    if (amount > 0.01) return `长款 ${formatCurrency(amount)}`;
    if (amount < -0.01) return `短款 ${formatCurrency(Math.abs(amount))}`;
    return '正常';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const quickActions = [
    {
      label: '收银台',
      href: '/pos',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      roles: ['cashier', 'store_manager', 'admin']
    },
    {
      label: '交班管理',
      href: '/shifts',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
      roles: ['cashier', 'store_manager', 'admin']
    },
    {
      label: '财务对账',
      href: '/reconciliation',
      icon: <Scale className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      roles: ['finance', 'admin', 'store_manager']
    },
    {
      label: '数据报表',
      href: '/reports',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
      roles: ['admin', 'finance', 'store_manager', 'area_operator']
    },
    {
      label: '退款审核',
      href: '/refunds',
      icon: <RotateCcw className="w-6 h-6" />,
      color: 'bg-red-50 text-red-600 hover:bg-red-100',
      roles: ['finance', 'admin', 'store_manager'],
      badge: pendingRefunds.length
    },
    {
      label: '异常订单',
      href: '/reports?tab=exceptions',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      roles: ['admin', 'finance', 'store_manager'],
      badge: exceptionOrders.length
    }
  ];

  const filteredQuickActions = quickActions.filter(
    action => !action.roles || hasRole(...action.roles)
  );

  const hasTodoPermission = hasRole('admin', 'finance', 'store_manager');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">数据概览</h2>
          <p className="text-gray-500">
            {overview?.start_date} 至 {overview?.end_date}
            {user?.store_name && <span className="ml-2">· {user.store_name}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号/会员..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {hasRole('admin', 'finance') && (
            <select
              value={filters.store_id}
              onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部门店</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">至</span>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {currentShift && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">当前交班进行中</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {currentShift.shift_no}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-blue-600">收银员</p>
              <p className="font-medium text-blue-900">{currentShift.cashier_name || user?.real_name}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">开始时间</p>
              <p className="font-medium text-blue-900">{formatDateTime(currentShift.start_time)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">订单数量</p>
              <p className="font-medium text-blue-900">{currentShift.order_count || 0} 单</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">销售金额</p>
              <p className="font-medium text-blue-900">{formatCurrency(currentShift.order_total || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">预计收款</p>
              <p className="font-medium text-blue-900">{formatCurrency(currentShift.total_expected || 0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(card.trend)}
                <span className={`text-xs ${getTrendColor(card.trend)}`}>
                  {card.change}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">多维度明细</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {tabConfig.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    {activeTab === 'store' && '门店'}
                    {activeTab === 'date' && '日期'}
                    {activeTab === 'channel' && '支付渠道'}
                    {activeTab === 'cashier' && '收银员'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">销售额</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">订单数</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">客单价</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">退款</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">长短款</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {dimensionData.length > 0 ? (
                  dimensionData.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {formatCurrency(item.sales)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{item.orders} 单</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.avgAmount)}</td>
                      <td className="py-3 px-4 text-right text-red-500">{formatCurrency(item.refund)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getOverShortClass(item.overShort)}`}>
                          {getOverShortLabel(item.overShort)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">对账进度</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeDasharray={`${(overview?.recon_rate || 0) * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-800">
                    {overview?.recon_rate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">已完成对账</span>
                  <span className="font-medium text-green-600">
                    {overview?.recon_completed || 0} 次
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">待对账</span>
                  <span className="font-medium text-yellow-600">
                    {(overview?.recon_total || 0) - (overview?.recon_completed || 0)} 次
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">异常订单</span>
                  <span className="font-medium text-red-600">
                    {overview?.exception_count || 0} 单
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">长款金额</span>
                <span className="font-medium text-green-600">¥0.00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">短款金额</span>
                <span className="font-medium text-red-600">¥0.00</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              {filteredQuickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className={`relative flex items-center gap-3 p-4 rounded-xl transition ${action.color}`}
                >
                  {action.badge && action.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                  {action.icon}
                  <span className="font-medium text-sm">{action.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasTodoPermission && todoItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              待办事项
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {todoItems.length}
              </span>
            </h3>
            <a href="/reports?tab=exceptions" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todoItems.slice(0, 6).map((item) => (
              <a
                key={`${item.type}-${item.id}`}
                href={
                  item.type === 'refund' ? '/refunds' :
                  item.type === 'recon' ? '/reconciliation' :
                  '/reports?tab=exceptions'
                }
                className="block border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'refund' && <RotateCcw className="w-4 h-4 text-red-500" />}
                    {item.type === 'recon' && <Scale className="w-4 h-4 text-purple-500" />}
                    {item.type === 'exception' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    <span className="font-medium text-gray-800 text-sm">{item.title}</span>
                  </div>
                  {getPriorityBadge(item.priority)}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {item.storeName && <p>门店：{item.storeName}</p>}
                  {item.date && <p>日期：{formatDate(item.date)}</p>}
                  {item.amount !== undefined && (
                    <p className="font-medium text-gray-700">
                      金额：{formatCurrency(item.amount)}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {hasTodoPermission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pendingRefunds.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-500" />
                  待复核退款
                </h3>
                <a href="/refunds?status=pending" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  全部 <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-3">
                {pendingRefunds.slice(0, 3).map((refund) => (
                  <div key={refund.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{refund.order_no}</p>
                      <p className="text-xs text-gray-500">{refund.store_name} · {formatDate(refund.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(refund.amount)}</p>
                      <p className="text-xs text-red-500">{refund.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingRecon.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  待完成对账
                </h3>
                <a href="/reconciliation?status=pending" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  全部 <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-3">
                {pendingRecon.slice(0, 3).map((recon) => (
                  <div key={recon.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{recon.store_name}</p>
                      <p className="text-xs text-gray-500">对账日期：{recon.recon_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{formatCurrency(recon.net_amount)}</p>
                      <p className="text-xs text-purple-500">{recon.order_count} 笔订单</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exceptionOrders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  异常订单
                </h3>
                <a href="/reports?tab=exceptions" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  全部 <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-3">
                {exceptionOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{order.order_no}</p>
                      <p className="text-xs text-gray-500">{order.store_name} · {formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-yellow-500">
                        {order.status === 'cancelled' ? '已取消' :
                         order.status === 'refunded' ? '已退款' :
                         order.status === 'partial_refund' ? '部分退款' : '异常'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
