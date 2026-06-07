import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Battery,
  Leaf,
  Gift,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Settings,
  FileText,
  Shield,
  Flame,
  Snowflake,
  Wind,
  Power,
  AlertCircle,
  Check,
  MoreHorizontal,
  ChevronRight,
  Home,
  Building2,
  Factory,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

interface Bill {
  id: string;
  period: string;
  amount: number;
  usage: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

interface Outage {
  id: string;
  title: string;
  area: string;
  startTime: string;
  endTime: string;
  status: 'planned' | 'emergency' | 'restored';
  affectedUsers: number;
  notificationSent: boolean;
}

interface DeviceAlert {
  id: string;
  deviceName: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
}

interface WeatherData {
  area: string;
  temperature: number;
  humidity: number;
  weatherCondition: string;
  forecastHigh: number;
  forecastLow: number;
  recordedAt: string;
}

interface MeterReading {
  meterNo: string;
  readingKwh: number;
  readingTime: string;
  voltage: number;
  current: number;
  powerFactor: number;
}

interface DashboardData {
  baseData: {
    currentBill: number;
    currentUsage: number;
    carbonEmission: number;
    points: number;
    recentBills: Bill[];
    outages: Outage[];
    efficiencyScore: number;
    unpaidBills: { count: number; total: number };
  };
  customerType: string;
  isAdmin: boolean;
  meterRealtime: MeterReading | null;
  weather: WeatherData | null;
  deviceAlerts: DeviceAlert[];
  userType?: string;
  seasonalPattern?: { month: string; totalKwh: number; avgKwh: number }[];
  homeDevices?: { id: string; deviceName: string; deviceType: string; status: string; powerConsumption: number }[];
  energyTips?: { id: string; title: string; content: string; category: string }[];
  currentPrice?: { periodType: string; pricePerKwh: number }[];
  systemStats?: {
    totalUsers: number;
    totalRevenue: number;
    pendingSubsidies: number;
    activeAlerts: number;
    userDistribution: { customerType: string; count: number }[];
  };
  auditAlerts?: any[];
  priceAudit?: any[];
  energyEfficiency?: {
    latestReport: any;
    reports: any[];
    efficiencyScore: number;
  };
  peakValleyRatio?: { peak: string; valley: string; flat: string };
  deviceLoadWarnings?: { deviceName: string; powerConsumption: number; warning: string }[];
  reportShortcuts?: { type: string; label: string; available: boolean }[];
  pvPlanStatus?: {
    hasPlan: boolean;
    capacity?: number;
    estimatedGeneration?: number;
    paybackYears?: number;
  };
}

const PIE_COLORS = ['#ef4444', '#3b82f6', '#22c55e'];

const seasonIcons: any = {
  summer: <Sun size={20} className="text-csg-amber" />,
  winter: <Snowflake size={20} className="text-blue-500" />,
  spring: <Flower size={20} className="text-pink-500" />,
  autumn: <Leaf size={20} className="text-orange-500" />,
};

function Flower(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a4 4 0 0 0-4 4c0 1.5.5 3 2 4" />
      <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.5 3-2 4" />
      <path d="M2 12a4 4 0 0 0 4 4c1.5 0 3-.5 4-2" />
      <path d="M22 12a4 4 0 0 1-4 4c-1.5 0-3-.5-4-2" />
      <path d="M12 22a4 4 0 0 0-4-4c0-1.5.5-3 2-4" />
      <path d="M12 22a4 4 0 0 1 4-4c0-1.5-.5-3-2-4" />
    </svg>
  );
}

const weatherIcon = (condition: string) => {
  if (condition.includes('晴')) return <Sun size={24} className="text-csg-amber" />;
  if (condition.includes('云')) return <Cloud size={24} className="text-gray-400" />;
  if (condition.includes('雨')) return <CloudRain size={24} className="text-blue-500" />;
  return <Cloud size={24} className="text-gray-400" />;
};

const getCurrentSeason = () => {
  const month = dayjs().month();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const getCurrentPeriod = () => {
  const hour = dayjs().hour();
  if (hour >= 8 && hour < 11) return { type: 'peak', label: '峰时', color: 'text-csg-red' };
  if (hour >= 11 && hour < 14) return { type: 'flat', label: '平时', color: 'text-blue-500' };
  if (hour >= 14 && hour < 17) return { type: 'peak', label: '峰时', color: 'text-csg-red' };
  if (hour >= 17 && hour < 19) return { type: 'flat', label: '平时', color: 'text-blue-500' };
  if (hour >= 19 && hour < 21) return { type: 'peak', label: '峰时', color: 'text-csg-red' };
  return { type: 'valley', label: '谷时', color: 'text-csg-green' };
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());

  useEffect(() => {
    const timer = setInterval(() => setCurrentPeriod(getCurrentPeriod()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<DashboardData>('/energy/dashboard');
        setData(res);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const customerTypeLabel =
    user?.customerType === 'enterprise' ? '企业用户' :
    user?.customerType === 'park' ? '园区用户' :
    user?.customerType === 'family' ? '家庭用户' : '个人用户';

  const statusLabel = (s: string) =>
    s === 'paid' ? '已缴' : s === 'overdue' ? '逾期' : '待缴';

  const statusBadge = (s: string) =>
    s === 'paid' ? 'badge-green' : s === 'overdue' ? 'badge-red' : 'badge-amber';

  const outageStatusBadge = (s: string) =>
    s === 'emergency' ? 'badge-red' : s === 'planned' ? 'badge-amber' : 'badge-green';

  const outageStatusLabel = (s: string) =>
    s === 'emergency' ? '紧急' : s === 'planned' ? '计划' : '已恢复';

  const severityBadge = (s: string) =>
    s === 'critical' ? 'badge-red' : s === 'high' ? 'badge-orange' : s === 'medium' ? 'badge-amber' : 'badge-blue';

  const severityLabel = (s: string) =>
    s === 'critical' ? '严重' : s === 'high' ? '高' : s === 'medium' ? '中' : '低';

  const customerIcon = () => {
    if (user?.customerType === 'enterprise') return <Factory size={24} />;
    if (user?.customerType === 'park') return <MapPin size={24} />;
    if (user?.customerType === 'family') return <Home size={24} />;
    return <Users size={24} />;
  };

  const baseData = data?.baseData;

  if (data?.isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-csg-navy to-csg-navy-light rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} />
            <h1 className="text-2xl font-bold">
              你好，{user?.realName || '管理员'}
            </h1>
          </div>
          <p className="text-blue-200">
            系统管理员 · 南方电网能源服务数字生态平台运营控制台
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">平台总用户</span>
              <Users size={18} className="text-csg-navy" />
            </div>
            <span className="stat-value">{data.systemStats?.totalUsers?.toLocaleString() || 0}</span>
            <div className="flex items-center gap-1 text-xs text-csg-green">
              <TrendingUp size={12} />
              <span>较上月 +12.5%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">累计电费收入</span>
              <DollarSign size={18} className="text-csg-green" />
            </div>
            <span className="stat-value">¥{(data.systemStats?.totalRevenue || 0).toLocaleString()}</span>
            <div className="flex items-center gap-1 text-xs text-csg-green">
              <TrendingUp size={12} />
              <span>较上月 +8.3%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">待审补贴申请</span>
              <FileText size={18} className="text-csg-amber" />
            </div>
            <span className="stat-value">{data.systemStats?.pendingSubsidies || 0}</span>
            <button
              onClick={() => navigate('/compliance/subsidies')}
              className="text-xs text-csg-navy dark:text-csg-green hover:underline"
            >
              立即处理 →
            </button>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">活跃设备告警</span>
              <AlertTriangle size={18} className="text-csg-red" />
            </div>
            <span className="stat-value">{data.systemStats?.activeAlerts || 0}</span>
            <button
              onClick={() => navigate('/smartlife/devices')}
              className="text-xs text-csg-navy dark:text-csg-green hover:underline"
            >
              查看详情 →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">用户类型分布</h3>
              <span className="text-sm text-gray-500">按客群分类</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.systemStats?.userDistribution?.map(u => ({
                    name: u.customerType === 'individual' ? '个人' :
                          u.customerType === 'family' ? '家庭' :
                          u.customerType === 'enterprise' ? '企业' : '园区',
                    用户数: u.count
                  })) || []}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="用户数" fill="#1a3a5c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">电价执行核查</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-csg-green/10">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-csg-green" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">正常账单</span>
                </div>
                <span className="font-semibold text-csg-green">{data.priceAudit?.filter(p => !p.priceAbnormal).length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-csg-amber/10">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-csg-amber" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">异常账单</span>
                </div>
                <span className="font-semibold text-csg-amber">{data.priceAudit?.filter(p => p.priceAbnormal).length || 0}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/compliance/price-audit')}
              className="btn-secondary w-full mt-4"
            >
              查看详细核查报告
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-csg-red" />
                审计异常预警
              </h3>
              <button
                onClick={() => navigate('/compliance/audits')}
                className="text-sm text-csg-navy dark:text-csg-green hover:underline"
              >
                全部审计
              </button>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(data.auditAlerts || []).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">暂无审计异常</p>
              ) : (
                data.auditAlerts?.slice(0, 5).map((alert: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-l-4 border-csg-red">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{alert.auditType}</span>
                      <span className={`badge-red text-xs`}>异常</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{alert.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm')}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">快捷操作</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '用户管理', icon: <Users size={20} />, path: '/admin', color: 'text-csg-navy' },
                { label: '补贴审批', icon: <FileText size={20} />, path: '/compliance/subsidies', color: 'text-csg-green' },
                { label: '电价核查', icon: <BarChart3 size={20} />, path: '/compliance/price-audit', color: 'text-csg-amber' },
                { label: '系统设置', icon: <Settings size={20} />, path: '/admin', color: 'text-gray-500' },
              ].map((action) => (
                <button
                  key={`${action.label}-${action.path}`}
                  onClick={() => navigate(action.path)}
                  className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <span className={action.color}>{action.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data?.customerType === 'enterprise' || data?.customerType === 'park') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-csg-navy to-csg-navy-light rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            {customerIcon()}
            <h1 className="text-2xl font-bold">
              你好，{user?.realName || '用户'}
            </h1>
            <span className="ml-auto px-3 py-1 bg-white/20 rounded-full text-sm">
              {customerTypeLabel}
            </span>
          </div>
          <p className="text-blue-200">
            综合能源管理控制台 · 能效优化 · 成本控制 · 绿色转型
          </p>
        </div>

        {data.deviceAlerts && data.deviceAlerts.length > 0 && (
          <div className="bg-csg-red/10 border border-csg-red/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-csg-red" />
              <span className="font-semibold text-csg-red">设备告警 ({data.deviceAlerts.length} 条未处理)</span>
              <button
                onClick={() => navigate('/smartlife/devices')}
                className="ml-auto text-xs text-csg-red hover:underline"
              >
                全部处理
              </button>
            </div>
            <div className="space-y-2">
              {data.deviceAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Power size={16} className="text-csg-red" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{alert.deviceName}</span>
                      <span className={`ml-2 ${severityBadge(alert.severity)} text-xs`}>{severityLabel(alert.severity)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{alert.message}</span>
                    <p className="text-xs text-gray-400">{dayjs(alert.createdAt).format('HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {data?.meterRealtime && (
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap size={18} className="text-csg-amber" />
                  智能电表实时监测
                </h3>
                <span className="text-xs text-gray-500">
                  表号：{data.meterRealtime.meterNo}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-csg-navy/5 rounded-lg">
                  <p className="text-3xl font-bold text-csg-navy">{data.meterRealtime.readingKwh?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">累计读数(kWh)</p>
                </div>
                <div className="text-center p-3 bg-csg-green/5 rounded-lg">
                  <p className="text-2xl font-bold text-csg-green">{data.meterRealtime.voltage} V</p>
                  <p className="text-xs text-gray-500 mt-1">电压</p>
                </div>
                <div className="text-center p-3 bg-csg-amber/5 rounded-lg">
                  <p className="text-2xl font-bold text-csg-amber">{data.meterRealtime.current} A</p>
                  <p className="text-xs text-gray-500 mt-1">电流</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{data.meterRealtime.powerFactor}</p>
                  <p className="text-xs text-gray-500 mt-1">功率因数</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>上次读数：{data.meterRealtime.readingTime ? dayjs(data.meterRealtime.readingTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>
                <span className="flex items-center gap-1 text-csg-green">
                  <CheckCircle size={12} />
                  IoT数据同步正常
                </span>
              </div>
            </div>
          )}

          {data?.weather && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {weatherIcon(data.weather.weatherCondition)}
                  气象联动
                </h3>
                <span className="text-xs text-gray-500">{data.weather.area}</span>
              </div>
              <div className="text-center mb-3">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{data.weather.temperature}°C</span>
                <p className="text-sm text-gray-500 mt-1">{data.weather.weatherCondition}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <Thermometer size={14} className="mx-auto text-csg-amber mb-1" />
                  <p className="text-gray-500">最高</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.weather.forecastHigh}°</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <Snowflake size={14} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-gray-500">最低</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.weather.forecastLow}°</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <Droplets size={14} className="mx-auto text-blue-400 mb-1" />
                  <p className="text-gray-500">湿度</p>
                  <p className="font-medium text-gray-900 dark:text-white">{data.weather.humidity}%</p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-csg-green/10 text-xs text-csg-green">
                <Wind size={12} className="inline mr-1" />
                {data.weather.temperature > 30
                  ? '高温预警：建议将空调调至26°C以上'
                  : data.weather.weatherCondition.includes('雨')
                  ? '雨天提醒：关闭户外电器注意用电安全'
                  : '今日适宜：开窗通风减少空调使用'}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">本月电费</span>
              <Zap size={18} className="text-csg-amber" />
            </div>
            <span className="stat-value">¥{baseData?.currentBill?.toLocaleString() || '0.0'}</span>
            {data.peakValleyRatio && (
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-csg-red">峰 {parseFloat(data.peakValleyRatio.peak) * 100}%</span>
                <span className="text-csg-green">谷 {parseFloat(data.peakValleyRatio.valley) * 100}%</span>
                <span className="text-blue-500">平 {parseFloat(data.peakValleyRatio.flat) * 100}%</span>
              </div>
            )}
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">本月用电量</span>
              <Battery size={18} className="text-blue-500" />
            </div>
            <span className="stat-value">{baseData?.currentUsage?.toLocaleString() || 0} kWh</span>
            <div className="flex items-center gap-1 text-xs text-csg-amber">
              <Clock size={12} />
              <span>当前{currentPeriod.label}电价：
                {data.currentPrice?.find(p => p.periodType === currentPeriod.type)?.pricePerKwh.toFixed(2)}元
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">能效评分</span>
              <Activity size={18} className="text-csg-green" />
            </div>
            <span className={`stat-value ${data.energyEfficiency?.efficiencyScore >= 80 ? 'text-csg-green' : data.energyEfficiency?.efficiencyScore >= 60 ? 'text-csg-amber' : 'text-csg-red'}`}>
              {data.energyEfficiency?.efficiencyScore || 0}
            </span>
            <button
              onClick={() => navigate('/energy/efficiency')}
              className="text-xs text-csg-navy dark:text-csg-green hover:underline"
            >
              生成诊断报告 →
            </button>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">碳排放</span>
              <Leaf size={18} className="text-csg-green" />
            </div>
            <span className="stat-value">{baseData?.carbonEmission || 0} 吨</span>
            <button
              onClick={() => navigate('/energy/carbon')}
              className="text-xs text-csg-navy dark:text-csg-green hover:underline"
            >
              计算碳足迹 →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">峰谷平用电分布</h3>
              <button
                onClick={() => navigate('/electricity/analysis')}
                className="text-sm text-csg-navy dark:text-csg-green hover:underline flex items-center gap-1"
              >
                详细分析 <ArrowRight size={14} />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={baseData?.recentBills?.map(b => ({
                  name: b.period,
                  峰时: Math.round(b.usage * parseFloat(data.peakValleyRatio?.peak || '0.35')),
                  平时: Math.round(b.usage * parseFloat(data.peakValleyRatio?.flat || '0.40')),
                  谷时: Math.round(b.usage * parseFloat(data.peakValleyRatio?.valley || '0.25')),
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="峰时" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="平时" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="谷时" fill="#22c55e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">能效诊断</h3>
              <span className="text-xs text-gray-500">最近报告</span>
            </div>
            {data.energyEfficiency?.latestReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-300">报告周期</span>
                  <span className="font-medium text-gray-900 dark:text-white">{data.energyEfficiency.latestReport.period}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-300">总用电量</span>
                  <span className="font-medium text-gray-900 dark:text-white">{data.energyEfficiency.latestReport.totalConsumptionKwh?.toLocaleString()} kWh</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">峰电占比</span>
                    <span className="font-medium text-csg-red">{(parseFloat(data.energyEfficiency.latestReport.peakRatio) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-csg-red rounded-full" style={{ width: `${parseFloat(data.energyEfficiency.latestReport.peakRatio) * 100}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/energy/efficiency')}
                  className="btn-secondary w-full"
                >
                  查看完整报告
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">暂无能效报告</p>
                <button
                  onClick={() => navigate('/energy/efficiency')}
                  className="btn-secondary"
                >
                  生成第一份报告
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap size={18} className="text-csg-amber" />
                设备负载预警
              </h3>
              <button
                onClick={() => navigate('/smartlife/devices')}
                className="text-sm text-csg-navy dark:text-csg-green hover:underline"
              >
                全部设备
              </button>
            </div>
            {data.deviceLoadWarnings && data.deviceLoadWarnings.length > 0 ? (
              <div className="space-y-3">
                {data.deviceLoadWarnings.map((w, i) => (
                  <div key={i} className="p-3 rounded-lg bg-csg-amber/10 border border-csg-amber/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-csg-amber" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{w.deviceName}</span>
                      </div>
                      <span className="text-xs text-csg-amber font-medium">{w.warning}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>当前功率</span>
                      <span className="font-medium text-csg-red">{w.powerConsumption} kW</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle size={40} className="mx-auto text-csg-green mb-2" />
                <p className="text-gray-500 text-sm">所有设备运行正常</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sun size={18} className="text-csg-amber" />
                光伏方案状态
              </h3>
            </div>
            {data.pvPlanStatus?.hasPlan ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-csg-green/10 text-center">
                    <p className="text-2xl font-bold text-csg-green">{data.pvPlanStatus.capacity} kW</p>
                    <p className="text-xs text-gray-500">推荐容量</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-center">
                    <p className="text-2xl font-bold text-blue-500">{data.pvPlanStatus.estimatedGeneration?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">年发电量(kWh)</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-csg-amber/10 text-center">
                  <p className="text-2xl font-bold text-csg-amber">{data.pvPlanStatus.paybackYears} 年</p>
                  <p className="text-xs text-gray-500">投资回收期</p>
                </div>
                <button
                  onClick={() => navigate('/energy/pv')}
                  className="btn-secondary w-full"
                >
                  查看完整方案
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Sun size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm mb-3">尚未评估光伏方案</p>
                <button
                  onClick={() => navigate('/energy/pv')}
                  className="btn-secondary"
                >
                  立即评估
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '电费缴纳', icon: <Zap size={20} />, path: '/electricity/payment', color: 'text-csg-amber' },
            { label: '能效诊断', icon: <Activity size={20} />, path: '/energy/efficiency', color: 'text-csg-green' },
            { label: '碳足迹', icon: <Leaf size={20} />, path: '/energy/carbon', color: 'text-blue-500' },
            { label: '补贴申请', icon: <DollarSign size={20} />, path: '/compliance/subsidies', color: 'text-purple-500' },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
            >
              <span className={action.color}>{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-csg-navy to-csg-navy-light rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          {customerIcon()}
          <h1 className="text-2xl font-bold">
            你好，{user?.realName || '用户'}
          </h1>
          <span className="ml-auto px-3 py-1 bg-white/20 rounded-full text-sm">
            {customerTypeLabel}
          </span>
        </div>
        <p className="text-blue-200">
          智慧用能 · 绿色生活 · 让每一度电更有价值
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">本月电费</span>
              <Zap size={18} className="text-csg-amber" />
            </div>
            <span className="stat-value">¥{baseData?.currentBill?.toFixed(1) || '0.0'}</span>
            {baseData?.unpaidBills?.count ? (
              <div className="flex items-center gap-1 text-xs text-csg-red">
                <AlertCircle size={12} />
                <span>{baseData.unpaidBills.count} 笔待缴，¥{baseData.unpaidBills.total.toFixed(1)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-csg-green">
                <Check size={12} />
                <span>无待缴账单</span>
              </div>
            )}
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">本月用电量</span>
              <Battery size={18} className="text-blue-500" />
            </div>
            <span className="stat-value">{baseData?.currentUsage || 0} kWh</span>
            <div className="flex items-center gap-1 text-xs">
              {currentPeriod.type === 'peak' ? (
                <><Flame size={12} className="text-csg-red" /> <span className="text-csg-red">当前峰时，建议节约用电</span></>
              ) : currentPeriod.type === 'valley' ? (
                <><Snowflake size={12} className="text-csg-green" /> <span className="text-csg-green">当前谷时，可放心使用</span></>
              ) : (
                <><Clock size={12} className="text-blue-500" /> <span className="text-blue-500">当前平时，电价适中</span></>
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">本月碳排放</span>
              <Leaf size={18} className="text-csg-green" />
            </div>
            <span className="stat-value">{baseData?.carbonEmission || 0} 吨</span>
            <div className="flex items-center gap-1 text-xs text-csg-green">
              <TrendingDown size={12} />
              <span>低于同类型用户平均水平</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">积分余额</span>
              <Gift size={18} className="text-purple-500" />
            </div>
            <span className="stat-value">{baseData?.points?.toLocaleString() || 0}</span>
            <button
              onClick={() => navigate('/smartlife/points')}
              className="text-xs text-csg-navy dark:text-csg-green hover:underline"
            >
              去商城兑换 →
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {weatherIcon(data?.weather?.weatherCondition || '晴')}
              实时天气
            </h3>
            <span className="text-xs text-gray-500">{data?.weather?.area}</span>
          </div>
          <div className="text-center mb-3">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{data?.weather?.temperature}°C</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Thermometer size={14} className="mx-auto text-csg-amber mb-1" />
              <p className="text-gray-500">最高</p>
              <p className="font-medium text-gray-900 dark:text-white">{data?.weather?.forecastHigh}°</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Snowflake size={14} className="mx-auto text-blue-500 mb-1" />
              <p className="text-gray-500">最低</p>
              <p className="font-medium text-gray-900 dark:text-white">{data?.weather?.forecastLow}°</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Droplets size={14} className="mx-auto text-blue-400 mb-1" />
              <p className="text-gray-500">湿度</p>
              <p className="font-medium text-gray-900 dark:text-white">{data?.weather?.humidity}%</p>
            </div>
          </div>
          {data?.weather && (
            <div className="mt-3 p-2 rounded-lg bg-csg-green/10 text-xs text-csg-green">
              <Wind size={12} className="inline mr-1" />
              {data.weather.temperature > 30
                ? '高温天气，建议将空调温度调至26°C以上，每调高1°C可节省约6%电量'
                : data.weather.weatherCondition.includes('雨')
                ? '雨天请关闭户外电器，注意用电安全'
                : '天气适宜，建议多开窗通风，减少空调使用'}
            </div>
          )}
        </div>
      </div>

      {data?.meterRealtime && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Power size={18} className="text-csg-navy" />
              智能电表实时数据
            </h3>
            <span className="text-xs text-gray-500">
              表号：{data.meterRealtime.meterNo} · 更新于 {data.meterRealtime.readingTime ? dayjs(data.meterRealtime.readingTime).format('HH:mm:ss') : '-'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-csg-navy/5 rounded-lg">
              <p className="text-2xl font-bold text-csg-navy">{data.meterRealtime.readingKwh?.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">累计读数(kWh)</p>
            </div>
            <div className="text-center p-3 bg-csg-green/5 rounded-lg">
              <p className="text-2xl font-bold text-csg-green">{data.meterRealtime.voltage} V</p>
              <p className="text-xs text-gray-500 mt-1">电压</p>
            </div>
            <div className="text-center p-3 bg-csg-amber/5 rounded-lg">
              <p className="text-2xl font-bold text-csg-amber">{data.meterRealtime.current} A</p>
              <p className="text-xs text-gray-500 mt-1">电流</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-500">{data.meterRealtime.powerFactor}</p>
              <p className="text-xs text-gray-500 mt-1">功率因数</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>IoT终端在线</span>
            <span className="flex items-center gap-1 text-csg-green">
              <CheckCircle size={12} />
              数据同步正常
            </span>
          </div>
        </div>
      )}

      {data?.deviceAlerts && data.deviceAlerts.length > 0 && (
        <div className="bg-csg-red/10 border border-csg-red/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-csg-red" />
            <span className="font-semibold text-csg-red">设备告警 ({data.deviceAlerts.length} 条未处理)</span>
            <button
              onClick={() => navigate('/smartlife/devices')}
              className="ml-auto text-xs text-csg-red hover:underline"
            >
              查看详情
            </button>
          </div>
          <div className="space-y-2">
            {data.deviceAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Power size={16} className="text-csg-red" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{alert.deviceName}</span>
                    <span className={`ml-2 ${severityBadge(alert.severity)} text-xs`}>{severityLabel(alert.severity)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{alert.message}</span>
                  <p className="text-xs text-gray-400">{alert.createdAt ? dayjs(alert.createdAt).format('HH:mm') : '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">季节用电趋势</h3>
            <button
              onClick={() => navigate('/electricity/analysis')}
              className="text-sm text-csg-navy dark:text-csg-green hover:underline flex items-center gap-1"
            >
              查看账单分析 <ArrowRight size={14} />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.seasonalPattern?.map(d => ({
                month: d.month + '月',
                用电量: d.totalKwh,
                月均: d.avgKwh
              })) || []}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3a5c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a3a5c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="用电量" stroke="#1a3a5c" strokeWidth={2} fill="url(#colorUsage)" />
                <Line type="monotone" dataKey="月均" stroke="#00a651" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-csg-amber" />
                停电通知
              </h3>
              <button
                onClick={() => navigate('/electricity/outage')}
                className="text-sm text-csg-navy dark:text-csg-green hover:underline"
              >
                全部
              </button>
            </div>
            {baseData?.outages?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">暂无停电通知</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {baseData?.outages?.slice(0, 3).map((o) => (
                  <div key={o.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{o.title}</span>
                      <span className={outageStatusBadge(o.status)}>{outageStatusLabel(o.status)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{o.area}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(o.startTime).format('MM-DD HH:mm')} ~ {dayjs(o.endTime).format('HH:mm')}
                    </p>
                    {o.notificationSent && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-csg-green">
                        <Check size={12} />
                        <span>已通知 {o.affectedUsers} 户</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {data?.energyTips && data.energyTips.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                {seasonIcons[getCurrentSeason()]}
                本季节能建议
              </h3>
              <div className="space-y-3">
                {data.energyTips.slice(0, 2).map((tip) => (
                  <div key={tip.id} className="p-3 rounded-lg bg-csg-green/5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{tip.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{tip.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {data?.homeDevices && data.homeDevices.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Power size={18} className="text-csg-navy" />
              我的智能设备
            </h3>
            <button
              onClick={() => navigate('/smartlife/devices')}
              className="text-sm text-csg-navy dark:text-csg-green hover:underline"
            >
              管理设备
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.homeDevices.slice(0, 5).map((device) => (
              <div
                key={device.id}
                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-all hover:shadow-md ${
                  device.status === 'online'
                    ? 'border-csg-green bg-csg-green/5'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <Power
                  size={24}
                  className={`mx-auto mb-2 ${device.status === 'online' ? 'text-csg-green' : 'text-gray-400'}`}
                />
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{device.deviceName}</p>
                <p className={`text-xs mt-1 ${
                  device.status === 'online' ? 'text-csg-green' : 'text-gray-500'
                }`}>
                  {device.status === 'online' ? `在线 · ${device.powerConsumption}kW` : '离线'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '电费缴纳', icon: <Zap size={20} />, path: '/electricity/payment', color: 'text-csg-amber' },
          { label: '节能建议', icon: <Leaf size={20} />, path: '/smartlife/tips', color: 'text-csg-green' },
          { label: '积分商城', icon: <Gift size={20} />, path: '/smartlife/points', color: 'text-purple-500' },
          { label: '安全用电', icon: <Shield size={20} />, path: '/knowledge/safety', color: 'text-csg-navy' },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <span className={action.color}>{action.icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
