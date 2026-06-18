import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Shield, AlertTriangle, CheckCircle, Clock, Eye, TrendingUp, Search, Filter } from 'lucide-react';
import { getRiskAlerts } from '../../services/api';
import type { RiskAlert } from '../../../shared/types';

const levelConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  low: { label: '低风险', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  medium: { label: '中风险', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle },
  high: { label: '高风险', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  sensitive_speech: { label: '敏感话术', color: 'bg-purple-100 text-purple-700' },
  withdraw: { label: '提现异常', color: 'bg-amber-100 text-amber-700' },
  geo_fence: { label: '跨区域展业', color: 'bg-blue-100 text-blue-700' },
  abnormal_behavior: { label: '异常行为', color: 'bg-rose-100 text-rose-700' },
};

export default function ComplianceMonitorPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getRiskAlerts();
      if (res.code === 0) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['高风险', '中风险', '低风险'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: '高风险',
        type: 'line',
        smooth: true,
        data: [2, 3, 1, 4, 2, 1, 3],
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3 },
        areaStyle: { color: 'rgba(239, 68, 68, 0.1)' },
      },
      {
        name: '中风险',
        type: 'line',
        smooth: true,
        data: [5, 8, 6, 10, 7, 4, 6],
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 },
        areaStyle: { color: 'rgba(245, 158, 11, 0.1)' },
      },
      {
        name: '低风险',
        type: 'line',
        smooth: true,
        data: [12, 15, 10, 18, 14, 9, 12],
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3 },
        areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
      }
    ]
  };

  const typeDistribution = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold', formatter: '{b}\n{c} ({d}%)' }
        },
        data: [
          { value: alerts.filter(a => a.type === 'sensitive_speech').length, name: '敏感话术', itemStyle: { color: '#8b5cf6' } },
          { value: alerts.filter(a => a.type === 'withdraw').length, name: '提现异常', itemStyle: { color: '#f59e0b' } },
          { value: alerts.filter(a => a.type === 'geo_fence').length, name: '跨区域', itemStyle: { color: '#2563eb' } },
          { value: alerts.filter(a => a.type === 'abnormal_behavior').length, name: '异常行为', itemStyle: { color: '#f43f5e' } },
        ]
      }
    ]
  };

  const stats = [
    { label: '总告警数', value: alerts.length, icon: Shield, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '高风险', value: alerts.filter(a => a.level === 'high').length, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: '待处理', value: alerts.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '已处理', value: alerts.filter(a => a.status === 'resolved').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const filteredAlerts = alerts.filter(a => 
    activeLevel === 'all' || a.level === activeLevel
  ).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近7天告警趋势</h3>
          <ReactECharts option={trendOption} style={{ height: 280 }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">风险类型分布</h3>
          <ReactECharts option={typeDistribution} style={{ height: 280 }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveLevel('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeLevel === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            全部
          </button>
          {Object.entries(levelConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveLevel(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${activeLevel === key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <config.icon className="w-3 h-3" />
              {config.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="搜索告警..." className="input pl-10 w-60" />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">实时风险告警</h3>
          <span className="text-sm text-gray-500">最近24小时</span>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredAlerts.map((alert) => {
            const LevelIcon = levelConfig[alert.level].icon;
            return (
              <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${levelConfig[alert.level].bg} flex items-center justify-center ${levelConfig[alert.level].color} flex-shrink-0`}>
                      <LevelIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[alert.type]?.color}`}>
                          {typeConfig[alert.type]?.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelConfig[alert.level].bg} ${levelConfig[alert.level].color}`}>
                          {levelConfig[alert.level].label}
                        </span>
                        {alert.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">待处理</span>
                        )}
                        {alert.status === 'processing' && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">处理中</span>
                        )}
                        {alert.status === 'resolved' && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">已处理</span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        涉及人员: {alert.userName} · {new Date(alert.createdAt).toLocaleString()}
                      </p>
                      {alert.description && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{alert.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100">
                      <Eye className="w-4 h-4 inline mr-1" />
                      详情
                    </button>
                    {alert.status === 'pending' && (
                      <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                        处理
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
