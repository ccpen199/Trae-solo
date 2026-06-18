import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Users, UserCheck, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getDashboardOverview, getRiskAlerts, getAppointments } from '../services/api';
import type { DashboardOverview, RiskAlert, Appointment } from '../../shared/types';
import { cn } from '../lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(amount);
};

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, alertsRes, apptRes] = await Promise.all([
          getDashboardOverview(),
          getRiskAlerts({ pageSize: 5, status: 'pending' }),
          getAppointments({ pageSize: 5 }),
        ]);
        if (overviewRes.code === 0) setOverview(overviewRes.data);
        if (alertsRes.code === 0) setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : (alertsRes.data as unknown as { list: RiskAlert[] }).list || []);
        if (apptRes.code === 0) setAppointments(Array.isArray(apptRes.data) ? (apptRes.data as unknown as Appointment[]) : (apptRes.data as unknown as { list: Appointment[] }).list || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const salesTrendOption = overview ? {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: overview.salesTrend.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 12 },
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#059669' },
        itemStyle: { color: '#059669' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(5, 150, 105, 0.3)' },
              { offset: 1, color: 'rgba(5, 150, 105, 0.05)' },
            ],
          },
        },
        data: overview.salesTrend.map(d => d.salesAmount),
      },
    ],
  } : {};

  const topProductsOption = overview ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: overview.topProducts.map(p => p.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#059669' },
            ],
          },
        },
        data: overview.topProducts.map(p => p.amount),
      },
    ],
  } : {};

  const stats = overview ? [
    { label: '今日销售额', value: formatCurrency(overview.todaySales), icon: TrendingUp, change: '+12.5%', up: true, gradient: 'from-primary-500 to-primary-700' },
    { label: '本月销售额', value: formatCurrency(overview.monthSales), icon: TrendingUp, change: '+8.2%', up: true, gradient: 'from-brand-500 to-brand-700' },
    { label: '客户总数', value: overview.totalCustomers.toString(), icon: Users, change: '+23', up: true, gradient: 'from-amber-500 to-amber-600' },
    { label: '活跃直销员', value: overview.activeSales.toString(), icon: UserCheck, change: '-2%', up: false, gradient: 'from-rose-500 to-rose-600' },
  ] : [];

  const alertLevelColor: Record<string, string> = {
    high: 'bg-danger-100 text-danger-700 border-danger-200',
    medium: 'bg-warning-100 text-warning-700 border-warning-200',
    low: 'bg-brand-100 text-brand-700 border-brand-200',
  };

  const appointmentStatusColor: Record<string, string> = {
    pending: 'bg-warning-100 text-warning-700',
    confirmed: 'bg-brand-100 text-brand-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  const appointmentStatusText: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card bg-white border border-gray-100 shadow-card">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn('flex items-center gap-1 text-sm font-medium', stat.up ? 'text-green-600' : 'text-danger-600')}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">销售趋势</h3>
          <ReactECharts option={salesTrendOption} style={{ height: 300 }} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热销产品</h3>
          <ReactECharts option={topProductsOption} style={{ height: 300 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              待处理告警
            </h3>
            <span className="text-sm text-primary-600 cursor-pointer hover:underline">查看全部</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-2 rounded-full ${alert.level === 'high' ? 'bg-danger-500' : alert.level === 'medium' ? 'bg-warning-500' : 'bg-brand-500'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                  <p className="text-xs text-gray-500">{alert.userName} · {alert.createdAt.slice(0, 16)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${alertLevelColor[alert.level]}`}>
                  {alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'}
                </span>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-center text-gray-400 py-8">暂无待处理告警</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              最近预约
            </h3>
            <span className="text-sm text-primary-600 cursor-pointer hover:underline">查看全部</span>
          </div>
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {apt.customerName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{apt.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {apt.appointmentTime.slice(5, 16)} · {apt.serviceType}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appointmentStatusColor[apt.status]}`}>
                  {appointmentStatusText[apt.status]}
                </span>
              </div>
            ))}
            {appointments.length === 0 && (
              <p className="text-center text-gray-400 py-8">暂无预约记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
