import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, TrendingUp, Package, AlertTriangle, CheckCircle, Download, BarChart3 } from 'lucide-react';
import { getSalesAnalysis } from '../../services/api';
import type { SalesAnalysisData } from '../../../shared/types';

export default function SalesAnalysisPage() {
  const [data, setData] = useState<SalesAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, [activePeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getSalesAnalysis({ period: activePeriod });
      if (res.code === 0) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const periodTabs = [
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季度' },
    { key: 'year', label: '本年度' },
  ];

  const categories = [
    { key: 'all', label: '全部品类' },
    { key: 'health', label: '健康食品' },
    { key: 'skincare', label: '护肤美容' },
    { key: 'daily', label: '家居日用' },
    { key: 'nutrition', label: '营养补充' },
  ];

  const trendOption = data ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['销售额', '订单量', '同比增长'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.dailyData?.map(d => d.date.slice(5)) || [],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额(万)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '订单量',
        axisLine: { show: false },
        splitLine: { show: false },
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'bar',
        yAxisIndex: 0,
        data: data.dailyData?.map(d => d.sales) || [],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#059669' },
              { offset: 1, color: '#10b981' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 20,
      },
      {
        name: '订单量',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.dailyData?.map(d => d.orders) || [],
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 3 },
      },
      {
        name: '同比增长',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: data.dailyData?.map(d => (d as unknown as { growth?: number }).growth || 0) || [],
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 2, type: 'dashed' },
      }
    ]
  } : {};

  const categoryOption = data ? {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c}万 ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold', formatter: '{b}\n¥{c}万' }
        },
        data: [
          { value: 128.5, name: '健康食品', itemStyle: { color: '#059669' } },
          { value: 86.2, name: '护肤美容', itemStyle: { color: '#2563eb' } },
          { value: 52.8, name: '家居日用', itemStyle: { color: '#f59e0b' } },
          { value: 68.4, name: '营养补充', itemStyle: { color: '#8b5cf6' } },
        ]
      }
    ]
  } : {};

  const stats = [
    { label: '总销售额', value: data ? `¥${data.totalSales}万` : '¥0万', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '总订单量', value: data?.totalOrders || 0, icon: Package, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '同比增长', value: data ? `${data.growthRate}%` : '0%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '动销产品', value: data?.activeProducts || 0, icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">产品动销分析</h1>
          <p className="text-gray-500 mt-1">全面分析产品销售数据，洞察市场趋势</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {periodTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivePeriod(tab.key as typeof activePeriod)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activePeriod === tab.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">销售趋势</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <ReactECharts option={trendOption} style={{ height: 320 }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">品类销售占比</h3>
          <ReactECharts option={categoryOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="搜索产品..." className="input pl-10 w-64" />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">产品动销排行</h3>
          <span className="text-sm text-gray-500">按销量排序</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">排名</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">产品信息</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">品类</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">销量</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">销售额</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">库存</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">同比</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { rank: 1, name: '国珍松花粉', category: '健康食品', sales: 2856, amount: 113.8, stock: 1250, growth: 28.5, status: 'normal' },
                { rank: 2, name: '松花伴侣片', category: '健康食品', sales: 1923, amount: 57.2, stock: 890, growth: 15.2, status: 'normal' },
                { rank: 3, name: '竹康宁片', category: '健康食品', sales: 1658, amount: 82.6, stock: 756, growth: 12.8, status: 'normal' },
                { rank: 4, name: '亚麻籽油', category: '营养补充', sales: 1425, amount: 28.2, stock: 230, growth: 8.5, status: 'low' },
                { rank: 5, name: '葡萄籽软胶囊', category: '护肤美容', sales: 1287, amount: 76.8, stock: 512, growth: -5.2, status: 'warning' },
                { rank: 6, name: '营养蛋白粉', category: '营养补充', sales: 1056, amount: 42.3, stock: 680, growth: 22.1, status: 'normal' },
                { rank: 7, name: '多效牙膏', category: '家居日用', sales: 987, amount: 19.6, stock: 1200, growth: 10.5, status: 'normal' },
                { rank: 8, name: '润唇膏', category: '护肤美容', sales: 876, amount: 15.8, stock: 45, growth: 18.3, status: 'low' },
              ].map((item, idx) => {
                const colors: Record<number, string> = {
                  1: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
                  2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
                  3: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
                };

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${colors[item.rank] || 'bg-gray-100 text-gray-600'}`}>
                        {item.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-2xl">
                          🌿
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{item.sales.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-primary-600">¥{item.amount}万</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{item.stock}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.growth >= 0 ? '+' : ''}{item.growth}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'normal' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          正常
                        </span>
                      )}
                      {item.status === 'warning' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          下滑
                        </span>
                      )}
                      {item.status === 'low' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          库存低
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">动销率分析</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">健康食品</span>
                <span className="text-sm font-semibold text-gray-900">95.2%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '95.2%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">护肤美容</span>
                <span className="text-sm font-semibold text-gray-900">88.6%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '88.6%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">家居日用</span>
                <span className="text-sm font-semibold text-gray-900">82.3%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '82.3%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">营养补充</span>
                <span className="text-sm font-semibold text-gray-900">91.8%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '91.8%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">滞销产品预警</h3>
          <div className="space-y-3">
            {[
              { name: '保湿面膜', days: 90, reason: '销量持续低迷', action: '建议促销' },
              { name: '洗洁精', days: 60, reason: '季节性需求下降', action: '调整库存' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                  </div>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">{item.days}天</span>
                </div>
                <p className="text-xs text-red-700 mt-2">建议: {item.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">销售渠道分布</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">直销员销售</span>
              <span className="font-semibold text-primary-600">65%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">生活馆销售</span>
              <span className="font-semibold text-brand-600">25%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">线上商城</span>
              <span className="font-semibold text-amber-600">10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
