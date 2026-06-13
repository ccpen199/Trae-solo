import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Star,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { DashboardStats } from '../../../shared/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.admin.dashboard().then((d) => setStats(d as DashboardStats));
  }, []);

  if (!stats) return <div className="p-10 text-center text-neutral-400">加载中...</div>;

  const trendOpt = {
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: stats.weeklyTrend.map((d) => d.date),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C' },
    },
    series: [
      {
        data: stats.weeklyTrend.map((d) => d.orders),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#0058FF', width: 3 },
        itemStyle: { color: '#0058FF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 88, 255, 0.25)' },
              { offset: 1, color: 'rgba(0, 88, 255, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  const kpiCards = [
    {
      label: '今日订单',
      value: stats.totalOrdersToday,
      diff: stats.totalOrdersToday - stats.totalOrdersYesterday,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: '进行中申诉',
      value: stats.activeClaims,
      diff: 3,
      icon: ShieldAlert,
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: '平均派送时长',
      value: `${stats.avgDeliveryTime}h`,
      diff: -0.2,
      icon: Clock,
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      iconColor: 'text-green-500',
      invert: true,
    },
    {
      label: '准时签收率',
      value: `${(stats.onTimeRate * 100).toFixed(1)}%`,
      diff: 0.8,
      icon: CheckCircle2,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-700">运营数据概览</h1>
          <p className="text-sm text-neutral-500 mt-1">实时监控中通快递全网运营核心指标</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-xs text-green-600">
          <Zap className="w-3.5 h-3.5" />
          数据实时同步
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpiCards.map((k, i) => {
          const positive = k.invert ? k.diff < 0 : k.diff > 0;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.iconColor}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>
                  {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(k.diff)}{typeof k.diff === 'number' && k.diff < 1 ? '' : k.diff > 0 ? '%' : ''}
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-700 mb-1">{k.value}</div>
              <div className="text-sm text-neutral-500">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-700">近 7 天订单趋势</h3>
            <span className="tag-blue">近 7 日</span>
          </div>
          <ReactECharts option={trendOpt} style={{ height: 280 }} />
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-700">运营质量指标</h3>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  投诉率
                </span>
                <span className="font-bold text-neutral-700">{(stats.complaintRate * 100).toFixed(2)}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: `${Math.min(stats.complaintRate * 100 * 30, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  准时签收率
                </span>
                <span className="font-bold text-neutral-700">{(stats.onTimeRate * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: `${stats.onTimeRate * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  平均响应时长
                </span>
                <span className="font-bold text-neutral-700">{stats.avgDeliveryTime} 小时</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: `${Math.min((stats.avgDeliveryTime / 5) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-700">TOP 5 高效能网点</h3>
            <button className="text-xs text-brand-500 flex items-center gap-1 hover:underline">
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {stats.topOutlets.map((o, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-yellow-100 text-yellow-600' :
                  i === 1 ? 'bg-neutral-100 text-neutral-600' :
                  i === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-brand-50 text-brand-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-700 truncate text-sm">{o.name}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-0.5"><Package className="w-3 h-3" /> {o.orders} 单</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {o.rating}</span>
                  </div>
                </div>
                <div className="w-20 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full" style={{ width: `${(o.orders / Math.max(...stats.topOutlets.map((x) => x.orders))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-700">运营健康度</h3>
          </div>
          <ReactECharts
            option={{
              series: [{
                type: 'gauge',
                startAngle: 210,
                endAngle: -30,
                min: 0,
                max: 100,
                radius: '90%',
                axisLine: {
                  lineStyle: {
                    width: 20,
                    color: [
                      [0.3, '#F53F3F'],
                      [0.7, '#FF6B1A'],
                      [1, '#00B578'],
                    ],
                  },
                },
                pointer: { itemStyle: { color: '#0058FF' }, width: 5, length: '65%' },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: {
                  valueAnimation: true,
                  formatter: '{value}',
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: '#1D2129',
                  offsetCenter: [0, '10%'],
                },
                title: {
                  offsetCenter: [0, '50%'],
                  fontSize: 14,
                  color: '#86909C',
                },
                data: [{ value: Math.round((stats.onTimeRate * 100 + (1 - stats.complaintRate * 100) + (5 - stats.avgDeliveryTime) * 10) / 3), name: '健康指数' }],
              }],
            }}
            style={{ height: 260 }}
          />
        </div>
      </div>
    </div>
  );
}
