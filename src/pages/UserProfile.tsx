import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  User,
  MapPin,
  Phone,
  Calendar,
  FileText,
  Gauge,
  Shield,
  Flame,
  ArrowLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Settings,
  Activity,
} from 'lucide-react';
import Tabs, { TabPanel } from '@/components/Tabs';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

interface UserInfo {
  id: string;
  account_no: string;
  name: string;
  address: string;
  user_type: string;
  phone: string;
  open_date: string;
  status: string;
  area?: string;
}

interface Meter {
  id: string;
  user_id: string;
  meter_no: string;
  model: string;
  install_date: string;
  calibration_expiry: string;
  current_reading: number;
  status: string;
}

interface GasDevice {
  id: string;
  user_id: string;
  device_type: string;
  brand: string;
  model: string;
  install_date: string;
  status: string;
}

interface Inspection {
  id: string;
  user_id: string;
  inspect_date: string;
  result: string;
  issues: string[];
  rectification_status: string;
  inspector?: string;
}

interface Reading {
  id: string;
  user_id: string;
  meter_id: string;
  reading: number;
  previous_reading: number;
  consumption: number;
  reading_date: string;
  method: string;
  ocr_confidence?: number;
  image_url?: string;
}

interface UserProfileData extends UserInfo {
  meters: Meter[];
  devices: GasDevice[];
  inspections: Inspection[];
  historyReadings: Reading[];
}

const userTypeLabels: Record<string, string> = {
  residential: '居民用户',
  commercial: '商业用户',
  industrial: '工业用户',
};

const deviceTypeLabels: Record<string, string> = {
  stove: '燃气灶',
  water_heater: '热水器',
  boiler: '锅炉',
  other: '其他设备',
};

const deviceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  stove: Flame,
  water_heater: Flame,
  boiler: Flame,
  other: Settings,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月`;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = id || 'user-1';

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (data.success) {
          setUserData(data.data);
        } else {
          setError(data.error || '获取用户信息失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const consumptionData = userData?.historyReadings
    ? [...userData.historyReadings]
        .sort((a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime())
        .map((item) => ({
          month: formatMonth(item.reading_date),
          用气量: item.consumption,
          异常: item.consumption > 60 || item.consumption < 10,
        }))
    : [];

  const avgConsumption =
    consumptionData.length > 0
      ? consumptionData.reduce((sum, item) => sum + item.用气量, 0) / consumptionData.length
      : 0;

  const tabItems = [
    { key: 'basic', label: '基本信息', icon: User },
    { key: 'meter', label: '表具信息', icon: Gauge },
    { key: 'usage', label: '历史用量', icon: Activity },
    { key: 'inspection', label: '安检记录', icon: Shield },
    { key: 'device', label: '用气设备', icon: Flame },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-64" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      {/* User Info Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10" />
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{userData.name}</h1>
                <StatusBadge
                  variant={userData.status === 'active' ? 'success' : 'warning'}
                  icon
                >
                  {userData.status === 'active' ? '正常' : userData.status === 'suspended' ? '暂停' : '销户'}
                </StatusBadge>
                <StatusBadge variant="info" icon>
                  {userTypeLabels[userData.user_type] || userData.user_type}
                </StatusBadge>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-primary-100">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="font-mono">户号：{userData.account_no}</span>
                </div>
                <div className="flex items-center gap-2 text-primary-100">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>电话：{userData.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-primary-100">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>开户日期：{formatDate(userData.open_date)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 text-sm text-primary-100">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{userData.address}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {userData.meters[0]?.current_reading || 0}
                </p>
                <p className="text-sm text-primary-200 mt-1">当前读数 (m³)</p>
              </div>
              <div className="w-px bg-white/20 hidden md:block" />
              <div className="text-center">
                <p className="text-3xl font-bold">{userData.meters.length}</p>
                <p className="text-sm text-primary-200 mt-1">表具数量</p>
              </div>
              <div className="w-px bg-white/20 hidden md:block" />
              <div className="text-center">
                <p className="text-3xl font-bold">{userData.inspections.length}</p>
                <p className="text-sm text-primary-200 mt-1">安检记录</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        >
          {/* Basic Info */}
          <TabPanel tabKey="basic">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">用户ID</p>
                <p className="text-gray-800 font-medium font-mono">{userData.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">户号</p>
                <p className="text-gray-800 font-medium font-mono">{userData.account_no}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">用户姓名</p>
                <p className="text-gray-800 font-medium">{userData.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">用户类型</p>
                <p className="text-gray-800 font-medium">
                  {userTypeLabels[userData.user_type] || userData.user_type}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="text-gray-800 font-medium">{userData.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">用户状态</p>
                <StatusBadge
                  variant={userData.status === 'active' ? 'success' : 'warning'}
                  icon
                >
                  {userData.status === 'active' ? '正常' : userData.status === 'suspended' ? '暂停' : '销户'}
                </StatusBadge>
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-1">
                <p className="text-sm text-gray-500">所在区域</p>
                <p className="text-gray-800 font-medium">{userData.area || '-'}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-gray-500">详细地址</p>
                <p className="text-gray-800 font-medium">{userData.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">开户日期</p>
                <p className="text-gray-800 font-medium">{formatDate(userData.open_date)}</p>
              </div>
            </div>
          </TabPanel>

          {/* Meter Info */}
          <TabPanel tabKey="meter">
            <div className="space-y-4">
              {userData.meters.map((meter, index) => (
                <div
                  key={meter.id}
                  className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          meter.status === 'normal'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        <Gauge className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">燃气表 #{index + 1}</h3>
                        <p className="text-sm text-gray-500">{meter.model}</p>
                      </div>
                    </div>
                    <StatusBadge
                      variant={meter.status === 'normal' ? 'success' : 'danger'}
                      icon
                    >
                      {meter.status === 'normal' ? '正常' : meter.status === 'faulty' ? '故障' : '已更换'}
                    </StatusBadge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">表号</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">
                        {meter.meter_no}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">安装日期</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDate(meter.install_date)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">检定有效期</p>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          new Date(meter.calibration_expiry) < new Date()
                            ? 'text-red-600'
                            : 'text-gray-800'
                        )}
                      >
                        {formatDate(meter.calibration_expiry)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">当前读数</p>
                      <p className="text-sm font-medium text-primary-600">
                        {meter.current_reading} m³
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {userData.meters.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Gauge className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无表具信息</p>
                </div>
              )}
            </div>
          </TabPanel>

          {/* History Usage */}
          <TabPanel tabKey="usage">
            <div className="space-y-6">
              {/* Chart */}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumptionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      unit=" m³"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                      }}
                      formatter={(value: number) => [`${value} m³`, '用气量']}
                    />
                    <ReferenceLine
                      y={avgConsumption}
                      stroke="#FF6B35"
                      strokeDasharray="5 5"
                      label={{ value: '平均', fill: '#FF6B35', fontSize: 12 }}
                    />
                    <Bar
                      dataKey="用气量"
                      radius={[6, 6, 0, 0]}
                      fill="#0052CC"
                    >
                      {consumptionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.异常 ? '#EF4444' : '#0052CC'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-primary-50">
                  <p className="text-sm text-gray-500 mb-1">平均用量</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {avgConsumption.toFixed(1)}
                    <span className="text-sm font-normal ml-1">m³</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-50">
                  <p className="text-sm text-gray-500 mb-1">最高用量</p>
                  <p className="text-2xl font-bold text-green-600">
                    {consumptionData.length > 0
                      ? Math.max(...consumptionData.map((d) => d.用气量)).toFixed(1)
                      : 0}
                    <span className="text-sm font-normal ml-1">m³</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50">
                  <p className="text-sm text-gray-500 mb-1">最低用量</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {consumptionData.length > 0
                      ? Math.min(...consumptionData.map((d) => d.用气量)).toFixed(1)
                      : 0}
                    <span className="text-sm font-normal ml-1">m³</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-red-50">
                  <p className="text-sm text-gray-500 mb-1">异常次数</p>
                  <p className="text-2xl font-bold text-red-600">
                    {consumptionData.filter((d) => d.异常).length}
                    <span className="text-sm font-normal ml-1">次</span>
                  </p>
                </div>
              </div>

              {/* Abnormal Points Legend */}
              {consumptionData.some((d) => d.异常) && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span>红色标记为用量异常（超出正常范围）</span>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Inspection Records */}
          <TabPanel tabKey="inspection">
            <div className="space-y-4">
              {userData.inspections.map((inspection) => {
                const resultConfig = {
                  pass: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: '合格' },
                  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: '警告' },
                  fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: '不合格' },
                };
                const config = resultConfig[inspection.result as keyof typeof resultConfig] || resultConfig.pass;
                const ResultIcon = config.icon;

                const rectificationLabels: Record<string, string> = {
                  none: '无需整改',
                  pending: '待整改',
                  completed: '已完成',
                };

                return (
                  <div
                    key={inspection.id}
                    className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
                          <ResultIcon className={cn('w-5 h-5', config.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                              安全检查 - {config.label}
                            </h3>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(inspection.inspect_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {inspection.inspector || '未记录'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <StatusBadge
                        variant={
                          inspection.rectification_status === 'completed'
                            ? 'success'
                            : inspection.rectification_status === 'pending'
                            ? 'warning'
                            : 'default'
                        }
                        icon
                      >
                        {rectificationLabels[inspection.rectification_status] ||
                          inspection.rectification_status}
                      </StatusBadge>
                    </div>

                    {inspection.issues && inspection.issues.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">隐患项：</p>
                        <ul className="space-y-1">
                          {inspection.issues.map((issue, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}

              {userData.inspections.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无安检记录</p>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Gas Devices */}
          <TabPanel tabKey="device">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.devices.map((device) => {
                const DeviceIcon = deviceTypeIcons[device.device_type] || Flame;
                const statusConfig = {
                  normal: { variant: 'success' as const, label: '正常' },
                  expired: { variant: 'warning' as const, label: '已过期' },
                  faulty: { variant: 'danger' as const, label: '故障' },
                };
                const config = statusConfig[device.status as keyof typeof statusConfig] || statusConfig.normal;

                return (
                  <div
                    key={device.id}
                    className="p-5 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                          device.status === 'normal'
                            ? 'bg-primary-50 text-primary-600 group-hover:bg-primary-100'
                            : 'bg-red-50 text-red-600'
                        )}
                      >
                        <DeviceIcon className="w-6 h-6" />
                      </div>
                      <StatusBadge variant={config.variant} icon>
                        {config.label}
                      </StatusBadge>
                    </div>

                    <h3 className="font-semibold text-gray-800 mb-1">
                      {deviceTypeLabels[device.device_type] || device.device_type}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {device.brand} {device.model}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">品牌</span>
                        <span className="text-gray-700 font-medium">{device.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">型号</span>
                        <span className="text-gray-700 font-medium">{device.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">安装日期</span>
                        <span className="text-gray-700 font-medium">
                          {formatDate(device.install_date)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">设备编号</span>
                      <span className="text-xs font-mono text-gray-500">{device.id}</span>
                    </div>
                  </div>
                );
              })}

              {userData.devices.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无用气设备记录</p>
                </div>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
