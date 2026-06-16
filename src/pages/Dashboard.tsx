import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  LayoutDashboard,
  Workflow,
  ClipboardList,
  Menu,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  BarChart3,
  PieChart,
  Thermometer,
  Building2,
  FileText,
  Gauge,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { api } from '@/api/client';
import type {
  CityVitalSigns,
  DataAuditInfo,
  TransportationDashboardData,
  MedicalDashboardData,
  UtilitiesDashboardData,
  GovernmentDashboardData,
  DashboardTab,
} from '../../shared/types';
import { cn } from '@/lib/utils';

interface DataAuditModalProps {
  audit: DataAuditInfo;
  chartName: string;
  onClose: () => void;
}

const DataAuditModal = ({ audit, chartName, onClose }: DataAuditModalProps) => {
  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN');
  };

  const getStatusIcon = () => {
    switch (audit.verifyStatus) {
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-eco-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warm-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (audit.verifyStatus) {
      case 'normal':
        return '数据正常';
      case 'warning':
        return '数据异常警告';
      case 'error':
        return '数据校验失败';
    }
  };

  const getStatusColor = () => {
    switch (audit.verifyStatus) {
      case 'normal':
        return 'text-eco-400 bg-eco-500/20 border-eco-500/30';
      case 'warning':
        return 'text-warm-400 bg-warm-500/20 border-warm-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-400" />
            数据复查
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-dark-bg rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-dark-bg rounded-xl">
            <p className="text-sm text-gray-400 mb-1">图表名称</p>
            <p className="font-medium">{chartName}</p>
          </div>

          <div className={cn('p-3 rounded-xl border flex items-center gap-3', getStatusColor())}>
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              <p className="text-sm opacity-80">置信度: {(audit.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="p-3 bg-dark-bg rounded-xl">
            <p className="text-sm text-gray-400 mb-1">数据来源</p>
            <p className="font-medium">{audit.dataSource}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-dark-bg rounded-xl">
              <p className="text-sm text-gray-400 mb-1">采集时间</p>
              <p className="text-sm font-mono">{formatDateTime(audit.collectedAt)}</p>
            </div>
            <div className="p-3 bg-dark-bg rounded-xl">
              <p className="text-sm text-gray-400 mb-1">校验时间</p>
              <p className="text-sm font-mono">{formatDateTime(audit.verifiedAt)}</p>
            </div>
          </div>

          {audit.abnormalMark && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {audit.abnormalMark}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  audit?: DataAuditInfo;
  onAudit?: () => void;
  children: React.ReactNode;
  className?: string;
}

const ChartCard = ({ title, icon: Icon, iconColor, audit, onAudit, children, className }: ChartCardProps) => {
  const hasWarning = audit?.verifyStatus === 'warning' || audit?.verifyStatus === 'error';

  return (
    <div className={cn('bg-dark-card border border-dark-border rounded-2xl p-6 relative group', className)}>
      {hasWarning && (
        <div className="absolute top-3 right-3">
          <AlertTriangle className={cn('w-4 h-4 animate-pulse', audit?.verifyStatus === 'error' ? 'text-red-400' : 'text-warm-400')} />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon className={cn('w-5 h-5', iconColor)} />
          {title}
        </h3>
        {audit && onAudit && (
          <button
            onClick={onAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-bg hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 rounded-lg border border-transparent hover:border-primary-500/30 transition-all opacity-0 group-hover:opacity-100"
          >
            <Search className="w-3.5 h-3.5" />
            数据复查
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [vitalSigns, setVitalSigns] = useState<CityVitalSigns | null>(null);
  const [historyData, setHistoryData] = useState<CityVitalSigns[]>([]);
  const [transportationData, setTransportationData] = useState<TransportationDashboardData | null>(null);
  const [medicalData, setMedicalData] = useState<MedicalDashboardData | null>(null);
  const [utilitiesData, setUtilitiesData] = useState<UtilitiesDashboardData | null>(null);
  const [governmentData, setGovernmentData] = useState<GovernmentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [auditModal, setAuditModal] = useState<{ audit: DataAuditInfo; chartName: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const adminNavItems = [
    { path: '/admin-workbench', icon: LayoutDashboard, label: '管理工作台' },
    { path: '/dashboard', icon: Activity, label: '城市体征' },
    { path: '/orchestration', icon: Workflow, label: '服务编排' },
    { path: '/ticket-dispatch', icon: ClipboardList, label: '工单分拨调度' },
  ];

  const tabs = [
    { key: 'overview' as DashboardTab, label: '概览', icon: Activity },
    { key: 'transportation' as DashboardTab, label: '交通出行', icon: Car },
    { key: 'medical' as DashboardTab, label: '医疗健康', icon: Heart },
    { key: 'utilities' as DashboardTab, label: '水电燃气', icon: Zap },
    { key: 'government' as DashboardTab, label: '政务城管', icon: Building2 },
  ];

  const loadTabData = useCallback(async (tab: DashboardTab) => {
    setTabLoading(true);
    try {
      switch (tab) {
        case 'transportation':
          if (!transportationData) {
            const data = await api.urban.getTransportationDashboard();
            setTransportationData(data);
          }
          break;
        case 'medical':
          if (!medicalData) {
            const data = await api.urban.getMedicalDashboard();
            setMedicalData(data);
          }
          break;
        case 'utilities':
          if (!utilitiesData) {
            const data = await api.urban.getUtilitiesDashboard();
            setUtilitiesData(data);
          }
          break;
        case 'government':
          if (!governmentData) {
            const data = await api.urban.getGovernmentDashboard();
            setGovernmentData(data);
          }
          break;
      }
    } catch (e) {
      console.error('Failed to load tab data:', e);
    } finally {
      setTabLoading(false);
    }
  }, [transportationData, medicalData, utilitiesData, governmentData]);

  useEffect(() => {
    loadData();
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    timerRef.current = setInterval(loadData, 30000);

    return () => {
      clearInterval(timeTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

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

  const refreshAll = async () => {
    setLoading(true);
    setTransportationData(null);
    setMedicalData(null);
    setUtilitiesData(null);
    setGovernmentData(null);
    await loadData();
    await loadTabData(activeTab);
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

  const getAuditFromArray = (arr?: { audit: DataAuditInfo }[]) => {
    return arr?.[0]?.audit;
  };

  const statCards = [
    {
      label: '公交准点率',
      value: vitalSigns ? `${vitalSigns.transportation.busOnTimeRate.toFixed(1)}%` : '--',
      icon: Bus,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      trend: (vitalSigns?.transportation.busOnTimeRate || 0) > 90 ? 'up' : 'down',
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
      value: vitalSigns ? `${vitalSigns.transportation.parkingOccupancy.toFixed(1)}%` : '--',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      trend: (vitalSigns?.transportation.parkingOccupancy || 0) > 80 ? 'up' : 'down',
    },
    {
      label: '急诊负荷',
      value: vitalSigns ? `${vitalSigns.medical.emergencyLoad.toFixed(1)}%` : '--',
      icon: Heart,
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      trend: (vitalSigns?.medical.emergencyLoad || 0) > 70 ? 'up' : 'down',
    },
    {
      label: '用水量',
      value: vitalSigns ? `${(vitalSigns.utilities.waterUsage / 10000).toFixed(1)}万m³` : '--',
      icon: Droplets,
      color: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      trend: 'up',
    },
    {
      label: '用电量',
      value: vitalSigns ? `${(vitalSigns.utilities.electricityUsage / 10000).toFixed(1)}万MW` : '--',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      trend: 'up',
    },
    {
      label: '用气量',
      value: vitalSigns ? `${(vitalSigns.utilities.gasUsage / 10000).toFixed(1)}万m³` : '--',
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

  const getCommonChartOption = () => ({
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(19, 47, 76, 0.95)',
      borderColor: '#1E3A5F',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  });

  const getAxisStyle = () => ({
    axisLine: { lineStyle: { color: '#1E3A5F' } },
    axisLabel: { color: '#6B7280' },
    splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' as const } },
  });

  const waterChartOption = {
    ...getCommonChartOption(),
    tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: historyData.map((_, i) => `${23 - i}h`).reverse(),
      ...getAxisStyle(),
    },
    yAxis: {
      type: 'value' as const,
      ...getAxisStyle(),
    },
    series: [
      {
        name: '用水量',
        type: 'line' as const,
        smooth: true,
        data: historyData.map(d => d.utilities.waterUsage).reverse(),
        lineStyle: { color: '#06B6D4', width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
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
        type: 'line' as const,
        smooth: true,
        data: historyData.map(d => d.utilities.electricityUsage).reverse(),
        lineStyle: { color: '#FBBF24', width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
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
        type: 'line' as const,
        smooth: true,
        data: historyData.map(d => d.utilities.gasUsage).reverse(),
        lineStyle: { color: '#F97316', width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
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
    ...getCommonChartOption(),
    tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: ['0时', '4时', '8时', '10时', '12时', '14时', '16时', '18时', '20时', '22时'],
      ...getAxisStyle(),
    },
    yAxis: {
      type: 'value' as const,
      ...getAxisStyle(),
    },
    series: [{
      type: 'bar' as const,
      data: [120, 80, 580, 420, 350, 380, 450, 620, 480, 280],
      itemStyle: {
        color: {
          type: 'linear' as const,
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
    ...getCommonChartOption(),
    tooltip: { ...getCommonChartOption().tooltip, trigger: 'item' as const },
    legend: {
      orient: 'vertical' as const,
      right: '5%',
      top: 'center',
      textStyle: { color: '#9CA3AF' },
      itemGap: 12,
    },
    series: [{
      type: 'pie' as const,
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

  const getBusOnTimeChartOption = () => {
    if (!transportationData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const },
      xAxis: {
        type: 'category' as const,
        data: transportationData.busOnTimeTrend.map(d => `${d.hour}时`),
        ...getAxisStyle(),
      },
      yAxis: {
        type: 'value' as const,
        min: 60,
        max: 100,
        ...getAxisStyle(),
        axisLabel: { ...getAxisStyle().axisLabel, formatter: '{value}%' },
      },
      series: [{
        name: '准点率',
        type: 'line' as const,
        smooth: true,
        data: transportationData.busOnTimeTrend.map(d => d.onTimeRate.toFixed(1)),
        lineStyle: { color: '#3B82F6', width: 3 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
        itemStyle: { color: '#3B82F6' },
        markLine: {
          silent: true,
          lineStyle: { color: '#EF4444', type: 'dashed' as const },
          data: [{ yAxis: 90, label: { formatter: '目标: 90%', color: '#EF4444' } }],
        },
      }],
    };
  };

  const getBusRouteRankingOption = () => {
    if (!transportationData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { ...getCommonChartOption().grid, left: '15%' },
      xAxis: {
        type: 'value' as const,
        ...getAxisStyle(),
        axisLabel: { ...getAxisStyle().axisLabel, formatter: '{value}%' },
      },
      yAxis: {
        type: 'category' as const,
        data: transportationData.busRouteRanking.map(d => d.routeName),
        ...getAxisStyle(),
      },
      series: [{
        type: 'bar' as const,
        data: transportationData.busRouteRanking.map(d => ({
          value: d.onTimeRate.toFixed(1),
          itemStyle: {
            color: d.onTimeRate >= 90 ? '#10B981' : d.onTimeRate >= 80 ? '#F59E0B' : '#EF4444',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right' as const,
          formatter: '{c}%',
          color: '#9CA3AF',
        },
      }],
    };
  };

  const getTrafficHeatmapOption = () => {
    if (!transportationData) return {};
    const data = transportationData.trafficHeatmap;
    return {
      ...getCommonChartOption(),
      tooltip: {
        ...getCommonChartOption().tooltip,
        formatter: (params: any) => `${params.name}: ${(params.value / 1000).toFixed(1)}千车次`,
      },
      xAxis: {
        type: 'category' as const,
        data: data.map(d => d.area),
        ...getAxisStyle(),
        axisLabel: { ...getAxisStyle().axisLabel, rotate: 30 },
      },
      yAxis: {
        type: 'value' as const,
        show: false,
      },
      visualMap: {
        show: true,
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 0,
        min: 0,
        max: 20000,
        text: ['高', '低'],
        textStyle: { color: '#6B7280' },
        inRange: {
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        },
      },
      series: [{
        type: 'bar' as const,
        data: data.map((d, i) => ({
          value: d.flow,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '60%',
      }],
    };
  };

  const getBRTStatsOption = () => {
    if (!transportationData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: { ...getCommonChartOption().tooltip, trigger: 'item' as const },
      legend: {
        show: false,
      },
      series: [{
        type: 'pie' as const,
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0A1929',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside' as const,
          formatter: '{b}: {d}%',
          color: '#9CA3AF',
        },
        data: [
          { value: transportationData.brtPassengerStats[0]?.passengerCount || 0, name: 'BRT1号线', itemStyle: { color: '#3B82F6' } },
          { value: transportationData.brtPassengerStats[1]?.passengerCount || 0, name: 'BRT2号线', itemStyle: { color: '#10B981' } },
          { value: transportationData.brtPassengerStats[2]?.passengerCount || 0, name: 'BRT3号线', itemStyle: { color: '#F59E0B' } },
        ],
      }],
    };
  };

  const getWaitHeatmapOption = () => {
    if (!medicalData) return {};
    const departmentSet = new Set<string>();
    const timeSlotSet = new Set<string>();
    medicalData.waitHeatmap.forEach(d => {
      departmentSet.add(d.department);
      timeSlotSet.add(d.timeSlot);
    });
    const departments: string[] = [];
    departmentSet.forEach(d => departments.push(d));
    const timeSlots: string[] = [];
    timeSlotSet.forEach(t => timeSlots.push(t));
    const data = medicalData.waitHeatmap.map(d => [
      timeSlots.indexOf(d.timeSlot),
      departments.indexOf(d.department),
      d.waitTime,
    ]);

    return {
      ...getCommonChartOption(),
      tooltip: {
        ...getCommonChartOption().tooltip,
        position: 'top' as const,
        formatter: (params: any) => {
          const dept = departments[params.value[1]];
          const time = timeSlots[params.value[0]];
          const wait = params.value[2];
          return `${dept} - ${time}<br/>候诊时长: ${wait}分钟`;
        },
      },
      grid: { ...getCommonChartOption().grid, left: '15%', bottom: '15%' },
      xAxis: {
        type: 'category' as const,
        data: timeSlots,
        ...getAxisStyle(),
        splitArea: { show: true, areaStyle: { color: ['rgba(30, 58, 95, 0.3)', 'rgba(30, 58, 95, 0.1)'] } },
      },
      yAxis: {
        type: 'category' as const,
        data: departments,
        ...getAxisStyle(),
        splitArea: { show: true },
      },
      visualMap: {
        show: true,
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 0,
        min: 0,
        max: 120,
        calculable: true,
        text: ['长', '短'],
        textStyle: { color: '#6B7280' },
        inRange: {
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        },
      },
      series: [{
        type: 'heatmap' as const,
        data,
        label: {
          show: true,
          formatter: '{c}',
          color: '#fff',
          fontSize: 10,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }],
    };
  };

  const getEmergencyLoadOption = () => {
    if (!medicalData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: {
        data: ['负荷率', '等待患者'],
        textStyle: { color: '#9CA3AF' },
        top: 0,
      },
      grid: { ...getCommonChartOption().grid, left: '18%', top: '18%' },
      xAxis: {
        type: 'value' as const,
        ...getAxisStyle(),
      },
      yAxis: {
        type: 'category' as const,
        data: medicalData.emergencyLoad.map(d => d.hospitalName),
        ...getAxisStyle(),
      },
      series: [
        {
          name: '负荷率',
          type: 'bar' as const,
          data: medicalData.emergencyLoad.map(d => ({
            value: d.loadRate.toFixed(1),
            itemStyle: {
              color: d.loadRate > 85 ? '#EF4444' : d.loadRate > 70 ? '#F59E0B' : '#10B981',
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '35%',
        },
        {
          name: '等待患者',
          type: 'bar' as const,
          data: medicalData.emergencyLoad.map(d => d.waitingPatients),
          itemStyle: { color: '#3B82F6', borderRadius: [0, 4, 4, 0] },
          barWidth: '35%',
        },
      ],
    };
  };

  const getAppointmentStatsOption = () => {
    if (!medicalData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const },
      legend: {
        data: ['总预约', '已完成', '已取消'],
        textStyle: { color: '#9CA3AF' },
        top: 0,
      },
      xAxis: {
        type: 'category' as const,
        data: medicalData.appointmentStats.map(d => d.date.slice(5)),
        ...getAxisStyle(),
      },
      yAxis: {
        type: 'value' as const,
        ...getAxisStyle(),
      },
      series: [
        {
          name: '总预约',
          type: 'line' as const,
          stack: 'total',
          areaStyle: { color: 'rgba(59, 130, 246, 0.3)' },
          data: medicalData.appointmentStats.map(d => d.totalAppointments),
          lineStyle: { color: '#3B82F6', width: 2 },
          itemStyle: { color: '#3B82F6' },
        },
        {
          name: '已完成',
          type: 'line' as const,
          areaStyle: { color: 'rgba(16, 185, 129, 0.3)' },
          data: medicalData.appointmentStats.map(d => d.completedAppointments),
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' },
        },
        {
          name: '已取消',
          type: 'line' as const,
          areaStyle: { color: 'rgba(239, 68, 68, 0.3)' },
          data: medicalData.appointmentStats.map(d => d.cancelledAppointments),
          lineStyle: { color: '#EF4444', width: 2 },
          itemStyle: { color: '#EF4444' },
        },
      ],
    };
  };

  const getUtilitiesDetailOption = (data: { hour: number; usage: number }[], color: string, name: string, unit: string) => {
    return {
      ...getCommonChartOption(),
      tooltip: {
        ...getCommonChartOption().tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}时<br/>${name}: ${(p.value / 10000).toFixed(2)}万${unit}`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: data.map(d => `${d.hour}时`),
        ...getAxisStyle(),
      },
      yAxis: {
        type: 'value' as const,
        ...getAxisStyle(),
        axisLabel: {
          ...getAxisStyle().axisLabel,
          formatter: (value: number) => `${(value / 10000).toFixed(0)}万`,
        },
      },
      series: [{
        name,
        type: 'line' as const,
        smooth: true,
        data: data.map(d => d.usage),
        lineStyle: { color, width: 3 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '66' },
              { offset: 1, color: color + '00' },
            ],
          },
        },
        itemStyle: { color },
      }],
    };
  };

  const getTicketCategoryOption = () => {
    if (!governmentData) return {};
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
    return {
      ...getCommonChartOption(),
      tooltip: {
        ...getCommonChartOption().tooltip,
        trigger: 'item' as const,
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical' as const,
        right: '5%',
        top: 'center',
        textStyle: { color: '#9CA3AF' },
        itemGap: 12,
      },
      series: [{
        type: 'pie' as const,
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0A1929',
          borderWidth: 2,
        },
        label: { show: false },
        data: governmentData.ticketCategoryDistribution.map((d, i) => ({
          value: d.count,
          name: d.category,
          itemStyle: { color: colors[i % colors.length] },
        })),
      }],
    };
  };

  const getClassificationAccuracyOption = () => {
    if (!governmentData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: {
        ...getCommonChartOption().tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>准确率: ${(p.value * 100).toFixed(1)}%`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: governmentData.classificationAccuracyTrend.map(d => d.date.slice(5)),
        ...getAxisStyle(),
      },
      yAxis: {
        type: 'value' as const,
        min: 0.8,
        max: 1,
        ...getAxisStyle(),
        axisLabel: {
          ...getAxisStyle().axisLabel,
          formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
        },
      },
      series: [{
        name: '准确率',
        type: 'line' as const,
        smooth: true,
        data: governmentData.classificationAccuracyTrend.map(d => d.accuracy),
        lineStyle: { color: '#8B5CF6', width: 3 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.4)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0)' },
            ],
          },
        },
        itemStyle: { color: '#8B5CF6' },
      }],
    };
  };

  const getDepartmentEfficiencyOption = () => {
    if (!governmentData) return {};
    return {
      ...getCommonChartOption(),
      tooltip: { ...getCommonChartOption().tooltip, trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: {
        data: ['平均处理时间(小时)', '已完成工单'],
        textStyle: { color: '#9CA3AF' },
        top: 0,
      },
      grid: { ...getCommonChartOption().grid, left: '20%', top: '18%' },
      xAxis: {
        type: 'value' as const,
        ...getAxisStyle(),
      },
      yAxis: {
        type: 'category' as const,
        data: governmentData.departmentEfficiency.map(d => d.department),
        ...getAxisStyle(),
        axisLabel: { ...getAxisStyle().axisLabel, width: 80, overflow: 'truncate' as const },
      },
      series: [
        {
          name: '平均处理时间(小时)',
          type: 'bar' as const,
          data: governmentData.departmentEfficiency.map(d => ({
            value: d.avgProcessingTime.toFixed(1),
            itemStyle: {
              color: d.avgProcessingTime > 36 ? '#EF4444' : d.avgProcessingTime > 24 ? '#F59E0B' : '#10B981',
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '35%',
        },
        {
          name: '已完成工单',
          type: 'bar' as const,
          data: governmentData.departmentEfficiency.map(d => d.completedTickets),
          itemStyle: { color: '#3B82F6', borderRadius: [0, 4, 4, 0] },
          barWidth: '35%',
        },
      ],
    };
  };

  const getTicketStatusOption = () => {
    if (!governmentData) return {};
    const colors = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6B7280'];
    return {
      ...getCommonChartOption(),
      tooltip: {
        ...getCommonChartOption().tooltip,
        trigger: 'item' as const,
        formatter: '{b}: {c} ({d}%)',
      },
      series: [{
        type: 'pie' as const,
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0A1929',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside' as const,
          formatter: '{b}: {d}%',
          color: '#9CA3AF',
        },
        data: governmentData.ticketStatusDistribution.map((d, i) => ({
          value: d.count,
          name: d.status,
          itemStyle: { color: colors[i % colors.length] },
        })),
      }],
    };
  };

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

  const renderOverviewTab = () => (
    <>
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
        <ChartCard
          title="水电燃气用量趋势（24小时）"
          icon={Activity}
          iconColor="text-primary-400"
          className="col-span-2"
        >
          <div className="flex items-center gap-4 text-sm mb-4">
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
          <div className="h-72">
            <ReactECharts option={waterChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard
          title="科室候诊分布"
          icon={Heart}
          iconColor="text-red-400"
        >
          <div className="h-72">
            <ReactECharts option={medicalChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-6">
        <ChartCard
          title="今日交通流量分布"
          icon={Car}
          iconColor="text-blue-400"
        >
          <div className="h-64">
            <ReactECharts option={trafficChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard
          title="实时预警信息"
          icon={AlertTriangle}
          iconColor="text-warm-400"
          className="col-span-2"
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
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
        </ChartCard>
      </div>
    </>
  );

  const renderTransportationTab = () => {
    if (tabLoading || !transportationData) return <LoadingSpinner />;

    return (
      <>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {transportationData.brtPassengerStats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Bus className="w-6 h-6 text-blue-400" />
                </div>
                <Gauge className="w-4 h-4 text-eco-400" />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.lineName}</p>
              <p className="text-sm text-gray-400">客流: {(stat.passengerCount / 10000).toFixed(1)}万人次</p>
              <p className="text-xs text-gray-500 mt-1">高峰: {stat.peakHour}</p>
              <p className="text-xs text-gray-500">满载率: {(stat.averageLoadFactor * 100).toFixed(0)}%</p>
            </div>
          ))}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-warm-500/20 flex items-center justify-center">
                <Car className="w-6 h-6 text-warm-400" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{vitalSigns?.transportation.trafficFlow.toLocaleString()}</p>
            <p className="text-sm text-gray-400">今日总车流量</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ChartCard
            title="公交准点率 24 小时趋势"
            icon={TrendingUp}
            iconColor="text-blue-400"
            audit={getAuditFromArray(transportationData.busOnTimeTrend)}
            onAudit={() => setAuditModal({ audit: transportationData.busOnTimeTrend[0].audit, chartName: '公交准点率 24 小时趋势' })}
          >
            <div className="h-72">
              <ReactECharts option={getBusOnTimeChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>

          <ChartCard
            title="公交线路准点率排名（TOP 10）"
            icon={BarChart3}
            iconColor="text-eco-400"
            audit={getAuditFromArray(transportationData.busRouteRanking)}
            onAudit={() => setAuditModal({ audit: transportationData.busRouteRanking[0].audit, chartName: '公交线路准点率排名' })}
          >
            <div className="h-72">
              <ReactECharts option={getBusRouteRankingOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <ChartCard
            title="交通流量区域分布"
            icon={MapPin}
            iconColor="text-purple-400"
            audit={getAuditFromArray(transportationData.trafficHeatmap)}
            onAudit={() => setAuditModal({ audit: transportationData.trafficHeatmap[0].audit, chartName: '交通流量区域分布' })}
          >
            <div className="h-72">
              <ReactECharts option={getTrafficHeatmapOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>

          <ChartCard
            title="BRT 客流分布"
            icon={PieChart}
            iconColor="text-warm-400"
            audit={getAuditFromArray(transportationData.brtPassengerStats)}
            onAudit={() => setAuditModal({ audit: transportationData.brtPassengerStats[0].audit, chartName: 'BRT 客流统计' })}
          >
            <div className="h-72">
              <ReactECharts option={getBRTStatsOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>
        </div>
      </>
    );
  };

  const renderMedicalTab = () => {
    if (tabLoading || !medicalData) return <LoadingSpinner />;

    return (
      <>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {medicalData.emergencyLoad.slice(0, 5).map((hospital, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  hospital.loadRate > 85 ? 'bg-red-500/20 text-red-400' :
                  hospital.loadRate > 70 ? 'bg-warm-500/20 text-warm-400' : 'bg-eco-500/20 text-eco-400'
                )}>
                  {hospital.loadRate.toFixed(0)}%
                </span>
              </div>
              <p className="text-sm font-medium mb-1 truncate" title={hospital.hospitalName}>{hospital.hospitalName}</p>
              <p className="text-xs text-gray-400">等待: {hospital.waitingPatients}人</p>
              <p className="text-xs text-gray-400">空床: {hospital.availableBeds}张</p>
            </div>
          ))}
        </div>

        <ChartCard
          title="医院候诊时长热力图（科室×时段）"
          icon={Thermometer}
          iconColor="text-red-400"
          audit={getAuditFromArray(medicalData.waitHeatmap)}
          onAudit={() => setAuditModal({ audit: medicalData.waitHeatmap[0].audit, chartName: '医院候诊时长热力图' })}
        >
          <div className="h-80">
            <ReactECharts option={getWaitHeatmapOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </ChartCard>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <ChartCard
            title="各医院急诊负荷对比"
            icon={Gauge}
            iconColor="text-warm-400"
            audit={getAuditFromArray(medicalData.emergencyLoad)}
            onAudit={() => setAuditModal({ audit: medicalData.emergencyLoad[0].audit, chartName: '各医院急诊负荷对比' })}
          >
            <div className="h-72">
              <ReactECharts option={getEmergencyLoadOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>

          <ChartCard
            title="预约挂号统计（近7天）"
            icon={FileText}
            iconColor="text-blue-400"
            audit={getAuditFromArray(medicalData.appointmentStats)}
            onAudit={() => setAuditModal({ audit: medicalData.appointmentStats[0].audit, chartName: '预约挂号统计' })}
          >
            <div className="h-72">
              <ReactECharts option={getAppointmentStatsOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>
        </div>
      </>
    );
  };

  const renderUtilitiesTab = () => {
    if (tabLoading || !utilitiesData) return <LoadingSpinner />;

    const renderComparisonCard = (comp: any, name: string, color: string, unit: string, icon: React.ElementType) => {
      const Icon = icon;
      return (
        <div className="bg-dark-bg rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', `bg-${color}-500/20`)}>
              <Icon className={cn('w-5 h-5', `text-${color}-400`)} />
            </div>
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-2xl font-bold">{(comp.todayTotal / 10000).toFixed(1)}万{unit}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">较昨日</p>
              <p className={cn('font-medium', comp.comparedYesterday >= 0 ? 'text-red-400' : 'text-eco-400')}>
                {comp.comparedYesterday >= 0 ? '↑' : '↓'} {Math.abs(comp.comparedYesterday).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">较上月同期</p>
              <p className={cn('font-medium', comp.comparedLastMonth >= 0 ? 'text-red-400' : 'text-eco-400')}>
                {comp.comparedLastMonth >= 0 ? '↑' : '↓'} {Math.abs(comp.comparedLastMonth).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {renderComparisonCard(utilitiesData.waterComparison, '用水量', 'cyan', 'm³', Droplets)}
          {renderComparisonCard(utilitiesData.electricityComparison, '用电量', 'yellow', 'MW', Zap)}
          {renderComparisonCard(utilitiesData.gasComparison, '用气量', 'orange', 'm³', Flame)}
        </div>

        <ChartCard
          title="用水量 24 小时趋势"
          icon={Droplets}
          iconColor="text-cyan-400"
          audit={getAuditFromArray(utilitiesData.waterUsage)}
          onAudit={() => setAuditModal({ audit: utilitiesData.waterUsage[0].audit, chartName: '用水量趋势' })}
        >
          <div className="h-64">
            <ReactECharts
              option={getUtilitiesDetailOption(utilitiesData.waterUsage, '#06B6D4', '用水量', 'm³')}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </ChartCard>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <ChartCard
            title="用电量 24 小时趋势"
            icon={Zap}
            iconColor="text-yellow-400"
            audit={getAuditFromArray(utilitiesData.electricityUsage)}
            onAudit={() => setAuditModal({ audit: utilitiesData.electricityUsage[0].audit, chartName: '用电量趋势' })}
          >
            <div className="h-64">
              <ReactECharts
                option={getUtilitiesDetailOption(utilitiesData.electricityUsage, '#FBBF24', '用电量', 'MW')}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </ChartCard>

          <ChartCard
            title="用气量 24 小时趋势"
            icon={Flame}
            iconColor="text-orange-400"
            audit={getAuditFromArray(utilitiesData.gasUsage)}
            onAudit={() => setAuditModal({ audit: utilitiesData.gasUsage[0].audit, chartName: '用气量趋势' })}
          >
            <div className="h-64">
              <ReactECharts
                option={getUtilitiesDetailOption(utilitiesData.gasUsage, '#F97316', '用气量', 'm³')}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </ChartCard>
        </div>
      </>
    );
  };

  const renderGovernmentTab = () => {
    if (tabLoading || !governmentData) return <LoadingSpinner />;

    return (
      <>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {governmentData.ticketStatusDistribution.reduce((sum, s) => sum + s.count, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">工单总数</p>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-eco-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-eco-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {governmentData.ticketStatusDistribution.find(s => s.status === '已解决')?.count || 0}
            </p>
            <p className="text-sm text-gray-400">已解决</p>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-warm-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warm-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {governmentData.ticketStatusDistribution.find(s => s.status === '处理中')?.count || 0}
            </p>
            <p className="text-sm text-gray-400">处理中</p>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {((governmentData.classificationAccuracyTrend[governmentData.classificationAccuracyTrend.length - 1]?.accuracy || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400">AI分类准确率</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ChartCard
            title="12345 工单分类分布"
            icon={PieChart}
            iconColor="text-blue-400"
            audit={getAuditFromArray(governmentData.ticketCategoryDistribution)}
            onAudit={() => setAuditModal({ audit: governmentData.ticketCategoryDistribution[0].audit, chartName: '12345 工单分类分布' })}
          >
            <div className="h-72">
              <ReactECharts option={getTicketCategoryOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>

          <ChartCard
            title="AI 分类准确率趋势（近7天）"
            icon={TrendingUp}
            iconColor="text-purple-400"
            audit={getAuditFromArray(governmentData.classificationAccuracyTrend)}
            onAudit={() => setAuditModal({ audit: governmentData.classificationAccuracyTrend[0].audit, chartName: 'AI 分类准确率趋势' })}
          >
            <div className="h-72">
              <ReactECharts option={getClassificationAccuracyOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <ChartCard
            title="各部门工单处理效率对比"
            icon={BarChart3}
            iconColor="text-eco-400"
            audit={getAuditFromArray(governmentData.departmentEfficiency)}
            onAudit={() => setAuditModal({ audit: governmentData.departmentEfficiency[0].audit, chartName: '各部门工单处理效率对比' })}
          >
            <div className="h-72">
              <ReactECharts option={getDepartmentEfficiencyOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>

          <ChartCard
            title="工单状态分布统计"
            icon={PieChart}
            iconColor="text-warm-400"
            audit={getAuditFromArray(governmentData.ticketStatusDistribution)}
            onAudit={() => setAuditModal({ audit: governmentData.ticketStatusDistribution[0].audit, chartName: '工单状态分布统计' })}
          >
            <div className="h-72">
              <ReactECharts option={getTicketStatusOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </ChartCard>
        </div>
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'transportation':
        return renderTransportationTab();
      case 'medical':
        return renderMedicalTab();
      case 'utilities':
        return renderUtilitiesTab();
      case 'government':
        return renderGovernmentTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {auditModal && (
        <DataAuditModal
          audit={auditModal.audit}
          chartName={auditModal.chartName}
          onClose={() => setAuditModal(null)}
        />
      )}

      <div className="sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-lg border-b border-dark-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-workbench')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-card transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">返回工作台</span>
            </button>
            <div className="h-6 w-px bg-dark-border"></div>
            <div className="hidden md:flex items-center gap-1">
              {adminNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    item.path === '/dashboard'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-dark-card'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-card transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-2 text-eco-400">
            <div className="w-2 h-2 rounded-full bg-eco-400 animate-pulse"></div>
            <span className="text-sm">实时监测中</span>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-dark-border p-3 space-y-1">
            {adminNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  item.path === '/dashboard'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white hover:bg-dark-card'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-primary-400 to-eco-400 bg-clip-text text-transparent">
              南宁城市运行体征监测中心
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-400">{formatDate(currentTime)}</p>
              <p className="text-primary-400 font-mono text-lg">{formatTime(currentTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-dark-card p-1 rounded-lg border border-dark-border overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                    activeTab === tab.key
                      ? 'bg-primary-500 text-white shadow-glow'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={refreshAll}
              className="p-2.5 bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white hover:border-primary-500 transition-colors"
              title="刷新所有数据"
            >
              <RefreshCw className={cn('w-5 h-5', (loading || tabLoading) && 'animate-spin')} />
            </button>
          </div>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}