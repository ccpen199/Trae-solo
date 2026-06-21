import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SupplyDemandChart } from '@/components/dashboard/SupplyDemandChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { CategoryStats } from '@/components/dashboard/CategoryStats';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Users,
  BarChart3, RefreshCw, Calendar, Download, Filter,
  ArrowUpRight, ArrowDownRight, Activity, Target,
  PieChart, Clock, AlertCircle
} from 'lucide-react';
import { dashboardAPI } from '@/services/api';
import type { DashboardMetrics, FunnelStep, DataPoint } from '../../../shared/types';

const DashboardIndex: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'supply-demand' | 'funnel'>('overview');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [supplyData, setSupplyData] = useState<DataPoint[]>([]);
  const [demandData, setDemandData] = useState<DataPoint[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [funnelPeriod, setFunnelPeriod] = useState('');
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, sdRes, funnelRes, categoryRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getSupplyDemand(period),
        dashboardAPI.getFunnel(period === 'week' ? 'week' : period === 'quarter' ? 'quarter' : 'month'),
        dashboardAPI.getCategoryStats(),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }

      if (sdRes.success && sdRes.data) {
        setSupplyData(sdRes.data.supplyData);
        setDemandData(sdRes.data.demandData);
      }

      if (funnelRes.success && funnelRes.data) {
        setFunnelData(funnelRes.data.funnel);
        setFunnelPeriod(funnelRes.data.period);
      }

      if (categoryRes.success && categoryRes.data) {
        setCategoryStats(categoryRes.data);
      }
    } catch (error) {
      console.error('获取看板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return '本周';
      case 'month': return '本月';
      case 'quarter': return '本季度';
      case 'year': return '本年';
      default: return '';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    unit, 
    change, 
    changeType, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    unit?: string; 
    change?: number; 
    changeType?: 'up' | 'down'; 
    icon: React.ElementType; 
    color: string;
  }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{value}</span>
              {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                changeType === 'up' ? 'text-green-600' : 'text-red-500'
              }`}>
                {changeType === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="font-medium">{Math.abs(change)}%</span>
                <span className="text-slate-400">较上月</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">数据看板</h1>
            <p className="text-slate-500 mt-1">行业供需波动分析与货源转化漏斗复盘</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
              {[
                { value: 'week', label: '周' },
                { value: 'month', label: '月' },
                { value: 'quarter', label: '季' },
                { value: 'year', label: '年' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as typeof period)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    period === p.value
                      ? 'bg-green-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              导出报表
            </Button>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="总交易额"
              value={`¥${(metrics.totalTransaction / 10000).toFixed(1)}`}
              unit="万"
              change={metrics.yoyGrowth}
              changeType={metrics.yoyGrowth >= 0 ? 'up' : 'down'}
              icon={DollarSign}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              title="总交易量"
              value={metrics.totalVolume.toLocaleString()}
              unit="吨"
              change={metrics.momGrowth}
              changeType={metrics.momGrowth >= 0 ? 'up' : 'down'}
              icon={Package}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              title="活跃用户"
              value={metrics.activeUsers.toLocaleString()}
              change={12.5}
              changeType="up"
              icon={Users}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard
              title="成交转化率"
              value={`${metrics.dealRate.toFixed(1)}`}
              unit="%"
              change={3.2}
              changeType="up"
              icon={Target}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              综合概览
            </button>
            <button
              onClick={() => setActiveTab('supply-demand')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'supply-demand'
                  ? 'border-green-500 text-green-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              供需分析
            </button>
            <button
              onClick={() => setActiveTab('funnel')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'funnel'
                  ? 'border-green-500 text-green-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <PieChart className="w-4 h-4" />
              转化漏斗
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            行业供需走势（{getPeriodLabel()}）
                          </h3>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {supplyData.length > 0 && demandData.length > 0 && (
                          <SupplyDemandChart
                            supplyData={supplyData}
                            demandData={demandData}
                            period={period}
                          />
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-green-600" />
                            品类供需分布
                          </h3>
                        </CardHeader>
                        <CardContent>
                          {categoryStats.length > 0 && (
                            <CategoryStats data={categoryStats} />
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-600" />
                            关键指标趋势
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[
                              { label: '货源发布量', value: metrics?.totalSupplies || 0, change: '+15.2%', trend: 'up' },
                              { label: '询价次数', value: metrics?.totalInquiries || 0, change: '+22.8%', trend: 'up' },
                              { label: '成交率', value: `${metrics?.dealRate.toFixed(1) || 0}%`, change: '+3.2%', trend: 'up' },
                              { label: '用户增长率', value: '18.6%', change: '+5.4%', trend: 'up' },
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">{item.label}</span>
                                <div className="flex items-center gap-4">
                                  <span className="font-semibold text-slate-800">{item.value}</span>
                                  <span className={`text-sm font-medium ${
                                    item.trend === 'up' ? 'text-green-600' : 'text-red-500'
                                  }`}>
                                    {item.change}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">业务洞察</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                  {getPeriodLabel()}废铜品类供需缺口达2,350吨，建议关注货源组织；
                                  废铝询价转化率提升至42%，可适当加大推广投入。
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'supply-demand' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-green-600" />
                          供需波动分析（{getPeriodLabel()}）
                        </h3>
                      </CardHeader>
                      <CardContent>
                        {supplyData.length > 0 && demandData.length > 0 && (
                          <SupplyDemandChart
                            supplyData={supplyData}
                            demandData={demandData}
                            period={period}
                          />
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {[
                        { label: '平均供应量', value: '12,850', unit: '吨', color: 'text-green-600' },
                        { label: '平均需求量', value: '15,230', unit: '吨', color: 'text-orange-500' },
                        { label: '供需缺口', value: '-2,380', unit: '吨', color: 'text-red-500' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl text-center">
                          <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                          <p className={`text-2xl font-bold ${item.color}`}>
                            {item.value} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <Package className="w-5 h-5 text-green-600" />
                          各品类供需对比
                        </h3>
                      </CardHeader>
                      <CardContent>
                        {categoryStats.length > 0 && (
                          <CategoryStats data={categoryStats} />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'funnel' && (
                  <div className="max-w-3xl mx-auto">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-green-600" />
                          货源转化漏斗复盘
                        </h3>
                      </CardHeader>
                      <CardContent>
                        {funnelData.length > 0 && (
                          <ConversionFunnel data={funnelData} period={funnelPeriod} />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardIndex;
