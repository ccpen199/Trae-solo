import { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, ShoppingCart, DollarSign, AlertTriangle, CheckCircle, RefreshCw, Filter, Calendar } from 'lucide-react';
import { reportsApi, mastersApi } from '@/lib/api';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';

interface OverviewData {
  total_sales: number;
  order_count: number;
  avg_order_value: number;
  refund_rate: number;
  reconciliation_rate: number;
  exception_count: number;
  total_refund: number;
}

interface SalesTrendItem {
  date: string;
  sales: number;
  orders: number;
  refunds: number;
}

interface StoreStat {
  store_id: number;
  store_name: string;
  total_sales: number;
  order_count: number;
  avg_order_value: number;
  refund_rate: number;
}

interface CashierStat {
  cashier_id: number;
  cashier_name: string;
  total_sales: number;
  order_count: number;
  avg_order_value: number;
  refund_count: number;
}

interface ChannelStat {
  channel: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

interface CategoryStat {
  category_id: number;
  category_name: string;
  total_sales: number;
  quantity_sold: number;
  percentage: number;
}

interface ExceptionOrder {
  id: number;
  order_no: string;
  store_name: string;
  cashier_name: string;
  total_amount: number;
  exception_type: string;
  exception_reason: string;
  created_at: string;
}

const channelMap: Record<string, string> = {
  cash: '现金',
  qr: '扫码支付',
  bank_card: '银行卡',
  stored_value: '储值卡',
  coupon: '优惠券'
};

const exceptionTypeMap: Record<string, { label: string; class: string }> = {
  price_mismatch: { label: '价格异常', class: 'bg-yellow-100 text-yellow-700' },
  quantity_mismatch: { label: '库存异常', class: 'bg-orange-100 text-orange-700' },
  payment_mismatch: { label: '支付异常', class: 'bg-red-100 text-red-700' },
  discount_abuse: { label: '优惠滥用', class: 'bg-purple-100 text-purple-700' },
  manual_override: { label: '人工干预', class: 'bg-blue-100 text-blue-700' },
  large_refund: { label: '大额退款', class: 'bg-red-100 text-red-700' }
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'store' | 'cashier' | 'channel' | 'category' | 'exceptions'>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [storeStats, setStoreStats] = useState<StoreStat[]>([]);
  const [cashierStats, setCashierStats] = useState<CashierStat[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    store_id: '',
    cashier_id: '',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportModal, setExportModal] = useState(false);

  useEffect(() => {
    loadOptions();
    loadData();
  }, []);

  const loadOptions = async () => {
    try {
      const [storesRes, cashiersRes] = await Promise.all([
        mastersApi.getStores(),
        mastersApi.getUsers({ role: 'cashier' })
      ]);
      setStores(storesRes.data.list || storesRes.data || []);
      setCashiers(cashiersRes.data.list || cashiersRes.data || []);
    } catch (error) {
      console.error('加载选项失败', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        start_date: filters.start_date,
        end_date: filters.end_date
      };
      if (filters.store_id) params.store_id = filters.store_id;
      if (filters.cashier_id) params.cashier_id = filters.cashier_id;

      const [overviewRes, trendRes, storeRes, cashierRes, channelRes, categoryRes, exceptionRes] = await Promise.all([
        reportsApi.getOverview(params),
        reportsApi.getSalesTrend(params),
        reportsApi.getByStore(params),
        reportsApi.getByCashier(params),
        reportsApi.getByChannel(params),
        reportsApi.getByCategory(params),
        reportsApi.getExceptions(params)
      ]);

      setOverview(overviewRes.data);
      setSalesTrend(trendRes.data.list || trendRes.data || []);
      setStoreStats(storeRes.data.list || storeRes.data || []);
      setCashierStats(cashierRes.data.list || cashierRes.data || []);
      setChannelStats(channelRes.data.list || channelRes.data || []);
      setCategoryStats(categoryRes.data.list || categoryRes.data || []);
      setExceptions(exceptionRes.data.list || exceptionRes.data || []);
    } catch (error: any) {
      alert('加载报表数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDailySettlement = async () => {
    try {
      const params: any = {};
      if (filters.store_id) params.store_id = filters.store_id;
      
      const res = await reportsApi.exportDailySettlement(exportDate, params);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `日结单_${exportDate}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('日结单导出成功');
      setExportModal(false);
    } catch (error: any) {
      alert('导出失败: ' + error.message);
    }
  };

  const tabs = [
    { key: 'overview', label: '数据概览', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'trend', label: '销售趋势', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'store', label: '门店统计', icon: <Users className="w-4 h-4" /> },
    { key: 'cashier', label: '收银员统计', icon: <Users className="w-4 h-4" /> },
    { key: 'channel', label: '渠道统计', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'category', label: '分类统计', icon: <ShoppingCart className="w-4 h-4" /> },
    { key: 'exceptions', label: '异常订单', icon: <AlertTriangle className="w-4 h-4" /> }
  ];

  const maxSales = Math.max(...salesTrend.map(item => item.sales), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">数据报表</h1>
        <button
          onClick={() => setExportModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出日结单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">门店</label>
            <select
              value={filters.store_id}
              onChange={e => setFilters(prev => ({ ...prev, store_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部门店</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">收银员</label>
            <select
              value={filters.cashier_id}
              onChange={e => setFilters(prev => ({ ...prev, cashier_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>{c.real_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              setFilters({
                store_id: '',
                cashier_id: '',
                start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              });
            }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            查询
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500">加载中...</div>
          ) : (
            <>
              {activeTab === 'overview' && overview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                      <div className="text-white/80 text-sm">销售总额</div>
                      <div className="text-2xl font-bold mt-1">{formatCurrency(overview.total_sales)}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                      <div className="text-white/80 text-sm">订单数</div>
                      <div className="text-2xl font-bold mt-1">{overview.order_count}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                      <div className="text-white/80 text-sm">客单价</div>
                      <div className="text-2xl font-bold mt-1">{formatCurrency(overview.avg_order_value)}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
                      <div className="text-white/80 text-sm">退款率</div>
                      <div className="text-2xl font-bold mt-1">{(overview.refund_rate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl text-white">
                      <div className="text-white/80 text-sm">对账完成率</div>
                      <div className="text-2xl font-bold mt-1">{(overview.reconciliation_rate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                      <div className="text-white/80 text-sm">异常订单</div>
                      <div className="text-2xl font-bold mt-1">{overview.exception_count}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <h4 className="font-medium text-gray-800 mb-4">销售指标</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">销售总额</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(overview.total_sales)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">退款总额</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(overview.total_refund)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className="text-gray-600">净销售额</span>
                          <span className="font-bold text-gray-900">{formatCurrency(overview.total_sales - overview.total_refund)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <h4 className="font-medium text-gray-800 mb-4">效率指标</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">订单总数</span>
                          <span className="font-semibold text-gray-900">{overview.order_count} 单</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">客单价</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(overview.avg_order_value)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className="text-gray-600">异常订单数</span>
                          <span className="font-semibold text-orange-600">{overview.exception_count} 单</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trend' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">销售趋势</h4>
                  <div className="h-80 flex items-end gap-1">
                    {salesTrend.map((item, index) => {
                      const height = (item.sales / maxSales) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">{formatCurrency(item.sales)}</div>
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                          <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left whitespace-nowrap">
                            {formatDate(item.date)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="overflow-x-auto mt-8">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">日期</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">销售额</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">订单数</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">退款额</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">净销售额</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesTrend.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{formatDate(item.date)}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(item.sales)}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600">{item.orders}</td>
                            <td className="px-4 py-2 text-sm text-right text-red-600">-{formatCurrency(item.refunds)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">{formatCurrency(item.sales - item.refunds)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'store' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">门店</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">销售总额</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">订单数</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">客单价</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">退款率</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">占比</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {storeStats.map((stat, index) => {
                        const total = storeStats.reduce((sum, s) => sum + s.total_sales, 0);
                        const percentage = total > 0 ? (stat.total_sales / total * 100).toFixed(1) : '0';
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.store_name}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(stat.total_sales)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{stat.order_count}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(stat.avg_order_value)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className={`${stat.refund_rate > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                                {(stat.refund_rate * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'cashier' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">收银员</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">销售总额</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">订单数</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">客单价</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">退款数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cashierStats.map((stat, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.cashier_name}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(stat.total_sales)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{stat.order_count}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(stat.avg_order_value)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">{stat.refund_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'channel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">支付渠道分布</h4>
                    <div className="space-y-3">
                      {channelStats.map((stat, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{channelMap[stat.channel] || stat.channel}</span>
                            <span className="font-medium text-gray-900">{stat.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-purple-500' :
                                index === 3 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">渠道</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">金额</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">笔数</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">占比</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {channelStats.map((stat, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{channelMap[stat.channel] || stat.channel}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(stat.total_amount)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{stat.transaction_count}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{stat.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'category' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">商品分类销售</h4>
                    <div className="space-y-3">
                      {categoryStats.map((stat, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{stat.category_name}</span>
                            <span className="font-medium text-gray-900">{stat.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-purple-500' :
                                index === 3 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">分类</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">销售额</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">销量</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">占比</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {categoryStats.map((stat, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{stat.category_name}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(stat.total_sales)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{stat.quantity_sold}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{stat.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'exceptions' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">订单号</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">门店</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">收银员</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">金额</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">异常类型</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">异常原因</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {exceptions.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">暂无异常订单</td></tr>
                      ) : (
                        exceptions.map((ex, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{ex.order_no}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{ex.store_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{ex.cashier_name}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(ex.total_amount)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${exceptionTypeMap[ex.exception_type]?.class || 'bg-gray-100 text-gray-700'}`}>
                                {exceptionTypeMap[ex.exception_type]?.label || ex.exception_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{ex.exception_reason}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(ex.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {exportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                导出日结单
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">选择日期</label>
                <input
                  type="date"
                  value={exportDate}
                  onChange={e => setExportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {filters.store_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    已筛选门店：{stores.find(s => s.id === Number(filters.store_id))?.name || '全部'}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setExportModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleExportDailySettlement}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
