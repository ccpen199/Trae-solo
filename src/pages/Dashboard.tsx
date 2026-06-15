import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Car,
  Heart,
  Droplets,
  Zap,
  Flame,
  Bus,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { api } from '@/api/client';
import type { CityVitalSigns } from '../../shared/types';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [vitalSigns, setVitalSigns] = useState<CityVitalSigns | null>(null);
  const [historyData, setHistoryData] = useState<CityVitalSigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'transportation' | 'medical' | 'utilities'>('overview');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    timerRef.current = setInterval(loadData, 5000);

    return () => {
      clearInterval(timeTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const [signs, history] = await Promise.all([
        api.urban.getVitalSigns(),
        api.urban.getVitalSignsHistory(24),
      ]);
      setVitalSigns(signs);
      setHistoryData(Array.isArray(history) ? history : []);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getTrendColor = (value: number, threshold: number) => {
    return value > threshold ? 'text-red-400' : 'text-eco-400';
  };

  const getTrendIcon = (value: number, threshold: number) => {
    return value > threshold ? TrendingUp : TrendingDown;
  };

  const waterChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(19, 47, 76, 0.9)',
      borderColor: '#1E3A5F',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: historyData.map((_, i) => `${23 - i}h`).reverse(),
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#6B7280' },
      splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } },
    },
    series: [
      {
        name: '用水量',
        type: 'line',
        smooth: true,
        data: historyData.map(d => d.utilities.waterUsage).reverse(),
        lineStyle: { color: '#06B6D4', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0)' },
            ],
          },
        },
        itemStyle: { color: '#06B6D4' },
      },
      {
        name: '用电量',
        type: 'line',
        smooth: true,
        data: historyData.map(d => d.utilities.electricityUsage).reverse(),
        lineStyle: { color: '#FBBF24', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(251, 191, 36, 0.3)' },
              { offset: 1, color: 'rgba(251, 191, 36, 0)' },
            ],
          },
        },
        itemStyle: { color: '#FBBF24' },
      },
      {
        name: '用气量',
        type: 'line',
        smooth: true,
        data: historyData.map(d => d.utilities.gasUsage).reverse(),
        lineStyle: { color: '#F97316', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0)' },
            ],
          },
        },
        itemStyle: { color: '#F97316' },
      },
    ],
  };

  const trafficChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(19, 47, 76, 0.9)',
      borderColor: '#1E3A5F',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['0时', '4时', '8时', '10时', '12时', '14时', '16时', '18时', '20时', '22时'],
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#6B7280' },
      splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: [120, 80, 580, 420, 350, 380, 450, 620, 480, 280],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#1D4ED8' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: '50%',
    }],
  };

  const medicalChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(19, 47, 76, 0.9)',
      borderColor: '#1E3A5F',
      textStyle: { color: '#fff' },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#9CA3AF' },
      itemGap: 12,
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#0A1929',
        borderWidth: 2,
      },
      label: { show: false },
      data: [
        { value: vitalSigns?.medical.hospitalWaitTimes['内科'] || 35, name: '内科', itemStyle: { color: '#10B981' } },
        { value: vitalSigns?.medical.hospitalWaitTimes['外科'] || 45, name: '外科', itemStyle: { color: '#3B82F6' } },
        { value: vitalSigns?.medical.hospitalWaitTimes['儿科'] || 60, name: '儿科', itemStyle: { color: '#F59E0B' } },
        { value: vitalSigns?.medical.hospitalWaitTimes['急诊科'] || 25, name: '急诊科', itemStyle: { color: '#EF4444' } },
        { value: vitalSigns?.medical.hospitalWaitTimes['妇产科'] || 40, name: '妇产科', itemStyle: { color: '#8B5CF6' } },
      ],
    }],
  };

  const statCards = [
    {
      label: '公交准点率',
      value: vitalSigns ? `${vitalSigns.transportation.busOnTimeRate}%` : '--',
      icon: Bus,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      trend: vitalSigns?.transportation.busOnTimeRate || 0 > 90 ? 'up' : 'down',
    },
    {
      label: '交通流量',
      value: vitalSigns ? (vitalSigns.transportation.trafficFlow / 10000).toFixed(1) + '万' : '--',
      icon: Car,
      color: 'from-warm-500 to-warm-600',
      iconBg: 'bg-warm-500/20',
      iconColor: 'text-warm-400',
      trend: 'up',
    },
    {
      label: '停车周转率',
      value: vitalSigns ? `${vitalSigns.transportation.parkingOccupancy}%` : '--',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      trend: vitalSigns?.transportation.parkingOccupancy || 0 > 80 ? 'up' : 'down',
    },
    {
      label: '急诊负荷',
      value: vitalSigns ? `${vitalSigns.medical.emergencyLoad}%` : '--',
      icon: Heart,
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      trend: vitalSigns?.medical.emergencyLoad || 0 > 70 ? 'up' : 'down',
    },
    {
      label: '用水量',
      value: vitalSigns ? `${vitalSigns.utilities.waterUsage}m³` : '--',
      icon: Droplets,
      color: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      trend: 'up',
    },
    {
      label: '用电量',
      value: vitalSigns ? `${vitalSigns.utilities.electricityUsage}MW` : '--',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      trend: 'up',
    },
    {
      label: '用气量',
      value: vitalSigns ? `${vitalSigns.utilities.gasUsage}m³` : '--',
      icon: Flame,
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      trend: 'down',
    },
    {
      label: '入学报名数',
      value: vitalSigns ? vitalSigns.education.schoolEnrollment.toLocaleString() : '--',
      icon: Users,
      color: 'from-eco-500 to-eco-600',
      iconBg: 'bg-eco-500/20',
      iconColor: 'text-eco-400',
      trend: 'up',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-400 font-medium">正在加载城市运行数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-primary-400 to-eco-400 bg-clip-text text-transparent">
            南宁城市运行体征监测中心
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-400">{formatDate(currentTime)}</p>
            <p className="text-primary-400 font-mono text-lg">{formatTime(currentTime)}</p>
            <div className="flex items-center gap-2 text-eco-400">
              <div className="w-2 h-2 rounded-full bg-eco-400 animate-pulse"></div>
              实时监测中
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-card p-1 rounded-lg border border-dark-border">
            {[
              { key: 'overview', label: '总览' },
              { key: 'transportation', label: '交通' },
              { key: 'medical', label: '医疗' },
              { key: 'utilities', label: '水电燃气' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="p-2.5 bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white hover:border-primary-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => {
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div
              key={index}
              className="bg-dark-card border border-dark-border rounded-2xl p-5 hover:border-primary-500/50 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.iconBg)}>
                  <card.icon className={cn('w-6 h-6', card.iconColor)} />
                </div>
                <TrendIcon className={cn('w-4 h-4', card.trend === 'up' ? 'text-red-400' : 'text-eco-400')} />
              </div>
              <p className="text-3xl font-bold mb-1">{card.value}</p>
              <p className="text-sm text-gray-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-dark-card border border-dark-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              水电燃气用量趋势（24小时）
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                <span className="text-gray-400">水</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="text-gray-400">电</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                <span className="text-gray-400">气</span>
              </span>
            </div>
          </div>
          <div className="h-72">
            <ReactECharts option={waterChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-red-400" />
            科室候诊分布
          </h3>
          <div className="h-72">
            <ReactECharts option={medicalChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Car className="w-5 h-5 text-blue-400" />
            今日交通流量分布
          </h3>
          <div className="h-64">
            <ReactECharts option={trafficChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="col-span-2 bg-dark-card border border-dark-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-warm-400" />
            实时预警信息
          </h3>
          <div className="space-y-3">
            {[
              { level: 'high', title: '民族大道交通拥堵预警', desc: '当前车流量达到饱和状态，建议绕行', time: '2分钟前' },
              { level: 'medium', title: '市第一人民医院候诊高峰', desc: '儿科候诊时间超过60分钟', time: '15分钟前' },
              { level: 'low', title: '东盟商务区停车位紧张', desc: '周边停车场周转率超过85%', time: '30分钟前' },
              { level: 'medium', title: '用水量异常波动', desc: '江南区用水量较昨日同期上升15%', time: '1小时前' },
            ].map((alert, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border transition-all',
                  alert.level === 'high'
                    ? 'bg-red-500/10 border-red-500/30'
                    : alert.level === 'medium'
                    ? 'bg-warm-500/10 border-warm-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  alert.level === 'high' ? 'bg-red-500/20 text-red-400' :
                  alert.level === 'medium' ? 'bg-warm-500/20 text-warm-400' : 'bg-blue-500/20 text-blue-400'
                )}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{alert.title}</h4>
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      alert.level === 'high' ? 'bg-red-500/20 text-red-400' :
                      alert.level === 'medium' ? 'bg-warm-500/20 text-warm-400' : 'bg-blue-500/20 text-blue-400'
                    )}>
                      {alert.level === 'high' ? '高级' : alert.level === 'medium' ? '中级' : '普通'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{alert.desc}</p>
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
