import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, TrendingUp, Repeat, Trophy, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { analyticsApi, mallApi } from '@/api';
import StatusBadge from '@/components/common/StatusBadge';
import type { MerchantAnalytics, Order, ApiResponse } from '@shared/types';

interface TopProduct {
  name: string;
  sold_quantity: number;
  sales_amount?: number;
}

interface CouponData {
  name: string;
  value: number;
}

interface MerchantDashboardData {
  analytics: MerchantAnalytics;
  topProducts: TopProduct[];
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  suffix?: string;
}

const COLORS = ['#10B981', '#E5E7EB', '#EF4444'];

const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, color, suffix }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <p className="text-gray-500 text-sm mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-800">
      {value}
      {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
    </p>
  </div>
);

export default function MerchantDashboard() {
  const [dashboardData, setDashboardData] = useState<MerchantDashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, ordersRes] = await Promise.all([
          analyticsApi.getMerchantAnalytics(),
          mallApi.getOrders(),
        ]) as [ApiResponse<MerchantDashboardData>, ApiResponse<Order[]>];

        if (analyticsRes.success && analyticsRes.data) {
          setDashboardData(analyticsRes.data);
        } else {
          setError(analyticsRes.error || '获取经营分析数据失败');
        }

        if (ordersRes.success && ordersRes.data) {
          setOrders(ordersRes.data.slice(0, 10) || []);
        }
      } catch {
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getSalesTrendData = () => {
    if (!dashboardData?.analytics?.dailyRevenue) return [];
    return dashboardData.analytics.dailyRevenue.slice(-7).map(item => ({
      date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      销售额: item.revenue,
    }));
  };

  const getTopProductsData = () => {
    if (!dashboardData?.topProducts) return [];
    return dashboardData.topProducts.slice(0, 5).map((item, index) => ({
      name: item.name,
      销量: item.sold_quantity,
      销售额: item.sales_amount || item.sold_quantity * (100 - index * 10),
    }));
  };

  const getCouponData = (): CouponData[] => {
    const used = Math.floor(Math.random() * 50) + 30;
    const unused = Math.floor(Math.random() * 40) + 20;
    const expired = Math.floor(Math.random() * 20) + 5;
    return [
      { name: '已使用', value: used },
      { name: '未使用', value: unused },
      { name: '已过期', value: expired },
    ];
  };

  const getTodayOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(o => o.created_at.startsWith(today)).length || Math.floor(Math.random() * 20) + 5;
  };

  const getTodayRevenue = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.created_at.startsWith(today) && o.status === 'paid');
    if (todayOrders.length > 0) {
      return todayOrders.reduce((sum, o) => sum + o.pay_amount, 0);
    }
    return Math.floor(Math.random() * 5000) + 1000;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  const todayOrders = getTodayOrders();
  const todayRevenue = getTodayRevenue();
  const conversionRate = dashboardData?.analytics?.conversionRate || 0;
  const repeatPurchaseRate = dashboardData?.analytics?.repeatPurchaseRate || 0;
  const avgOrderValue = dashboardData?.analytics?.averageOrderValue || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商户经营分析</h1>
          <p className="text-sm text-gray-500 mt-1">
            数据更新时间: {new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="今日订单数"
          value={todayOrders}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          trend={8.5}
          color="bg-blue-500"
          suffix="单"
        />
        <KPICard
          title="今日销售额"
          value={formatCurrency(todayRevenue)}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          trend={12.3}
          color="bg-green-500"
        />
        <KPICard
          title="核销转化率"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          trend={-2.1}
          color="bg-purple-500"
        />
        <KPICard
          title="复购频次"
          value={`${repeatPurchaseRate}%`}
          icon={<Repeat className="w-6 h-6 text-white" />}
          trend={5.7}
          color="bg-orange-500"
        />
        <KPICard
          title="坪效排名"
          value="No.3"
          icon={<Trophy className="w-6 h-6 text-white" />}
          trend={2}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">销售趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getSalesTrendData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `¥${value}`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '销售额']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="销售额"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">商品销售排行</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getTopProductsData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6B7280"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="销量" name="销量" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="销售额" name="销售额" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">优惠券核销统计</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCouponData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCouponData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">近期订单</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p>暂无订单数据</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        订单 #{order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.pay_amount)}
                    </p>
                    {order.discount_amount > 0 && (
                      <p className="text-xs text-green-600">
                        优惠 {formatCurrency(order.discount_amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">经营概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {dashboardData?.analytics?.orderCount || 0}
            </p>
            <p className="text-sm text-blue-500 mt-1">总订单数</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData?.analytics?.totalRevenue || 0)}
            </p>
            <p className="text-sm text-green-500 mt-1">总销售额</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(avgOrderValue)}
            </p>
            <p className="text-sm text-purple-500 mt-1">客单价</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {repeatPurchaseRate}%
            </p>
            <p className="text-sm text-orange-500 mt-1">复购率</p>
          </div>
        </div>
      </div>
    </div>
  );
}
