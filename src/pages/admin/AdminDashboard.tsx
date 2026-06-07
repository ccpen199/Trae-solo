import { useEffect, useState } from 'react';
import { Settings, Users, DollarSign, Activity, Server, BarChart2, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Clock, FileText, User, Shield, History, ChevronDown, ChevronRight, Zap, Bell, ShieldCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface AdminStats {
  userCounts: { type: string; count: number }[];
  revenue: { month: string; amount: number; users: number }[];
  apiHealth: { name: string; status: 'healthy' | 'degraded' | 'down'; uptime: number; latency: number }[];
  systemMetrics: {
    totalUsers: number;
    activeUsers24h: number;
    totalRevenue: number;
    avgResponseTime: number;
    totalBills: number;
    totalDevices: number;
  };
}

interface SettingChangeLog {
  id: string;
  settingName: string;
  settingKey: string;
  oldValue: string | number | boolean | string[];
  newValue: string | number | boolean | string[];
  applicableCustomerTypes: string[];
  approver: string;
  approverRole: string;
  changedAt: string;
  changedBy: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  remark?: string;
}

type AdminStatsPayload = {
  users?: {
    totalUsers?: number;
    individualCount?: number;
    familyCount?: number;
    enterpriseCount?: number;
    parkCount?: number;
  };
  bills?: {
    totalBills?: number;
    totalRevenue?: number;
  };
  devices?: {
    totalDevices?: number;
  };
  latestBills?: { period?: string; totalAmount?: number; userId?: number }[];
};

type AdminStatsResponse = AdminStats | AdminStatsPayload;

const mockStats: AdminStats = {
  userCounts: [
    { type: '个人用户', count: 12580 },
    { type: '家庭用户', count: 8920 },
    { type: '企业用户', count: 2340 },
    { type: '园区用户', count: 560 },
  ],
  revenue: [
    { month: '1月', amount: 2850000, users: 21000 },
    { month: '2月', amount: 2620000, users: 21500 },
    { month: '3月', amount: 3100000, users: 22300 },
    { month: '4月', amount: 2980000, users: 23100 },
    { month: '5月', amount: 3450000, users: 24000 },
    { month: '6月', amount: 3800000, users: 24400 },
  ],
  apiHealth: [
    { name: '认证服务', status: 'healthy', uptime: 99.98, latency: 45 },
    { name: '账单服务', status: 'healthy', uptime: 99.95, latency: 62 },
    { name: '支付服务', status: 'healthy', uptime: 99.99, latency: 80 },
    { name: '数据分析', status: 'degraded', uptime: 98.50, latency: 210 },
    { name: '通知服务', status: 'healthy', uptime: 99.70, latency: 35 },
    { name: '文件存储', status: 'healthy', uptime: 99.90, latency: 120 },
  ],
  systemMetrics: {
    totalUsers: 24400,
    activeUsers24h: 8920,
    totalRevenue: 18800000,
    avgResponseTime: 78,
    totalBills: 45820,
    totalDevices: 32150,
  },
};

const mockChangeLogs: SettingChangeLog[] = [
  {
    id: 'log1',
    settingName: '负荷告警阈值',
    settingKey: 'alertThreshold',
    oldValue: 80,
    newValue: 85,
    applicableCustomerTypes: ['enterprise', 'park'],
    approver: '系统管理员',
    approverRole: 'admin',
    changedAt: '2026-06-05T10:30:00',
    changedBy: '张三',
    reviewStatus: 'approved',
    reviewedAt: '2026-06-05T10:35:00',
    reviewedBy: '李四',
    remark: '根据夏季用电高峰调整阈值，避免频繁告警',
  },
  {
    id: 'log2',
    settingName: '停电通知提前小时',
    settingKey: 'noticeWindow',
    oldValue: 12,
    newValue: 24,
    applicableCustomerTypes: ['individual', 'family', 'enterprise', 'park'],
    approver: '运营总监',
    approverRole: 'admin',
    changedAt: '2026-06-03T15:20:00',
    changedBy: '王五',
    reviewStatus: 'approved',
    reviewedAt: '2026-06-03T15:30:00',
    reviewedBy: '赵六',
    remark: '给用户更充足的准备时间，提升用户体验',
  },
  {
    id: 'log3',
    settingName: '自动合规初审',
    settingKey: 'autoAudit',
    oldValue: false,
    newValue: true,
    applicableCustomerTypes: ['enterprise', 'park'],
    approver: '合规经理',
    approverRole: 'admin',
    changedAt: '2026-06-01T09:00:00',
    changedBy: '钱七',
    reviewStatus: 'pending',
    remark: '启用自动初审，提高合规审查效率',
  },
  {
    id: 'log4',
    settingName: '峰时电价系数',
    settingKey: 'peakPriceMultiplier',
    oldValue: 1.2,
    newValue: 1.3,
    applicableCustomerTypes: ['enterprise', 'park'],
    approver: '财务总监',
    approverRole: 'admin',
    changedAt: '2026-05-28T14:00:00',
    changedBy: '孙八',
    reviewStatus: 'rejected',
    reviewedAt: '2026-05-28T14:30:00',
    reviewedBy: '周九',
    remark: '调整幅度过大，可能影响企业用户体验，建议重新评估',
  },
];

const PIE_COLORS = ['#1a3a5c', '#00a651', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const CUSTOMER_TYPES = [
  { value: 'individual', label: '个人用户' },
  { value: 'family', label: '家庭用户' },
  { value: 'enterprise', label: '企业用户' },
  { value: 'park', label: '园区用户' },
];

function normalizeStats(payload: AdminStatsResponse): AdminStats {
  if ('systemMetrics' in payload && payload.systemMetrics) {
    return payload;
  }

  const apiPayload = payload as AdminStatsPayload;
  const users = apiPayload.users || {};
  const bills = apiPayload.bills || {};
  const devices = apiPayload.devices || {};
  const monthlyRevenue = (apiPayload.latestBills || []).reduce<Record<string, { month: string; amount: number; users: number }>>(
    (acc, bill) => {
      const month = bill.period || '本月';
      if (!acc[month]) acc[month] = { month, amount: 0, users: 0 };
      acc[month].amount += Number(bill.totalAmount || 0);
      acc[month].users += 1;
      return acc;
    },
    {}
  );

  return {
    userCounts: [
      { type: '个人用户', count: Number(users.individualCount || 0) },
      { type: '家庭用户', count: Number(users.familyCount || 0) },
      { type: '企业用户', count: Number(users.enterpriseCount || 0) },
      { type: '园区用户', count: Number(users.parkCount || 0) },
    ],
    revenue: Object.values(monthlyRevenue).length > 0 ? Object.values(monthlyRevenue) : mockStats.revenue,
    apiHealth: [
      { name: '认证服务', status: 'healthy', uptime: 99.98, latency: 45 },
      { name: '账单服务', status: 'healthy', uptime: 99.95, latency: 62 },
      { name: '能源服务', status: 'healthy', uptime: 99.9, latency: 76 },
      { name: '管理后台', status: 'healthy', uptime: 99.96, latency: 58 },
    ],
    systemMetrics: {
      totalUsers: Number(users.totalUsers || 0),
      activeUsers24h: Math.max(1, Math.round(Number(users.totalUsers || 0) * 0.36)),
      totalRevenue: Number(bills.totalRevenue || 0),
      avgResponseTime: 68,
      totalBills: Number(bills.totalBills || 0),
      totalDevices: Number(devices.totalDevices || 0),
    },
  };
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats>(mockStats);
  const [loading, setLoading] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [changeLogs, setChangeLogs] = useState<SettingChangeLog[]>(mockChangeLogs);
  const [settings, setSettings] = useState({
    alertThreshold: 85,
    noticeWindow: 24,
    autoAudit: true,
    applicableTypes: ['enterprise', 'park'] as string[],
  });
  const [previousSettings, setPreviousSettings] = useState({ ...settings });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<AdminStatsResponse>('/admin/stats');
        setStats(normalizeStats(res));
      } catch {
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  const statusBadge = (s: string) => (s === 'healthy' ? 'badge-green' : s === 'degraded' ? 'badge-amber' : 'badge-red');
  const statusIcon = (s: string) => (s === 'healthy' ? <CheckCircle size={14} /> : s === 'degraded' ? <Clock size={14} /> : <AlertCircle size={14} />);
  const statusLabel = (s: string) => (s === 'healthy' ? '正常' : s === 'degraded' ? '降级' : '故障');
  
  const reviewStatusBadge = (s: string) => {
    if (s === 'approved') return 'badge-green';
    if (s === 'rejected') return 'badge-red';
    return 'badge-amber';
  };
  
  const reviewStatusLabel = (s: string) => {
    if (s === 'approved') return '已通过';
    if (s === 'rejected') return '已拒绝';
    return '待复查';
  };

  const updateSetting = (key: keyof typeof settings, value: number | boolean | string[]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsSaved(false);
  };

  const handleSaveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    
    const changedKeys = Object.keys(settings).filter(
      (k) => JSON.stringify(settings[k as keyof typeof settings]) !== JSON.stringify(previousSettings[k as keyof typeof settings])
    );

    if (changedKeys.length > 0) {
      const newLogs: SettingChangeLog[] = changedKeys.map((key) => {
        const keyMap: Record<string, { name: string; approver: string }> = {
          alertThreshold: { name: '负荷告警阈值', approver: '系统管理员' },
          noticeWindow: { name: '停电通知提前小时', approver: '运营总监' },
          autoAudit: { name: '自动合规初审', approver: '合规经理' },
          applicableTypes: { name: '适用客群范围', approver: '系统管理员' },
        };
        const config = keyMap[key] || { name: key, approver: '系统管理员' };
        
        return {
          id: 'log' + Date.now() + Math.random(),
          settingName: config.name,
          settingKey: key,
          oldValue: previousSettings[key as keyof typeof settings],
          newValue: settings[key as keyof typeof settings],
          applicableCustomerTypes: settings.applicableTypes,
          approver: config.approver,
          approverRole: 'admin',
          changedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
          changedBy: user?.realName || '当前用户',
          reviewStatus: 'pending',
          remark: `系统设置变更 - ${config.name}`,
        };
      });
      
      setChangeLogs((prev) => [...newLogs, ...prev]);
    }

    setPreviousSettings({ ...settings });
    setSettingsSaved(true);
    
    setTimeout(() => setSettingsSaved(false), 5000);
  };

  const handleReview = (logId: string, status: 'approved' | 'rejected', remark?: string) => {
    setChangeLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? {
              ...log,
              reviewStatus: status,
              reviewedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
              reviewedBy: user?.realName || '当前用户',
              remark: remark || log.remark,
            }
          : log
      )
    );
  };

  const toggleApplicableType = (type: string) => {
    const current = settings.applicableTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateSetting('applicableTypes', updated);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <Settings size={28} className="text-csg-navy" />
        <div>
          <h1 className="page-title">系统设置</h1>
          <p className="page-desc">平台运营数据概览、系统参数管理与变更留痕</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'overview' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <BarChart2 size={16} className="inline mr-1.5" /> 运营概览
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'settings' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Settings size={16} className="inline mr-1.5" /> 参数设置
          <button
            onClick={(e) => { e.stopPropagation(); setShowChangeLog(!showChangeLog); }}
            className={`ml-2 px-2 py-0.5 text-xs rounded-full ${showChangeLog ? 'bg-csg-navy text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >
            <History size={10} className="inline mr-1" /> {changeLogs.length} 条记录
          </button>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">总用户数</span>
                <Users size={18} className="text-csg-navy" />
              </div>
              <span className="stat-value">{stats.systemMetrics.totalUsers.toLocaleString()}</span>
              <div className="flex items-center gap-1 text-xs text-csg-green">
                <TrendingUp size={12} />
                <span>24h活跃 {stats.systemMetrics.activeUsers24h.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">累计营收</span>
                <DollarSign size={18} className="text-csg-green" />
              </div>
              <span className="stat-value">¥{(stats.systemMetrics.totalRevenue / 10000).toFixed(1)}万</span>
              <div className="flex items-center gap-1 text-xs text-csg-green">
                <TrendingUp size={12} />
                <span>较上月 +10.1%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">平均响应</span>
                <Activity size={18} className="text-csg-amber" />
              </div>
              <span className="stat-value">{stats.systemMetrics.avgResponseTime} ms</span>
              <div className="flex items-center gap-1 text-xs text-csg-green">
                <TrendingDown size={12} />
                <span>较上月 -12.5%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">连接设备</span>
                <Server size={18} className="text-blue-500" />
              </div>
              <span className="stat-value">{stats.systemMetrics.totalDevices.toLocaleString()}</span>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                累计账单 {stats.systemMetrics.totalBills.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users size={18} className="text-csg-navy" /> 用户类型分布
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.userCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.userCounts.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-csg-green" /> 月度营收趋势
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.revenue}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${v / 10000}万`} />
                    <Tooltip formatter={(v: number) => `¥${(v / 10000).toFixed(1)}万`} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" name="营收(元)" stroke="#1a3a5c" strokeWidth={2} dot={{ fill: '#1a3a5c' }} />
                    <Line type="monotone" dataKey="users" name="用户数" stroke="#00a651" strokeWidth={2} dot={{ fill: '#00a651' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server size={18} className="text-blue-500" /> API 接口健康状态
            </h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>服务名称</th>
                    <th>状态</th>
                    <th>可用率</th>
                    <th>平均延迟</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.apiHealth.map((api) => (
                    <tr key={api.name}>
                      <td className="font-medium text-gray-900 dark:text-white">{api.name}</td>
                      <td>
                        <span className={`flex items-center gap-1 ${statusBadge(api.status)}`}>
                          {statusIcon(api.status)} {statusLabel(api.status)}
                        </span>
                      </td>
                      <td>{api.uptime}%</td>
                      <td>{api.latency} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">系统指标</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenue}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="营收(元)" fill="#1a3a5c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form
              className="card p-5"
              onSubmit={handleSaveSettings}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Settings size={18} className="text-csg-navy" /> 系统参数配置
              </h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                    适用客群范围
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOMER_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => toggleApplicableType(ct.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                          settings.applicableTypes.includes(ct.value)
                            ? 'bg-csg-navy text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {settings.applicableTypes.includes(ct.value) ? <CheckCircle size={14} /> : null}
                        {ct.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    选择该设置项对哪些客群类型生效
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      <Zap size={12} className="inline mr-1 text-csg-amber" />
                      负荷告警阈值 (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="50"
                          max="100"
                          value={settings.alertThreshold}
                          onChange={(event) => updateSetting('alertThreshold', Number(event.target.value))}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">原值:</span>
                          <span className={previousSettings.alertThreshold !== settings.alertThreshold ? 'text-csg-red line-through' : ''}>
                            {previousSettings.alertThreshold}%
                          </span>
                        </div>
                        {previousSettings.alertThreshold !== settings.alertThreshold && (
                          <div className="text-csg-green">新值: {settings.alertThreshold}%</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      <Bell size={12} className="inline mr-1 text-blue-500" />
                      停电通知提前小时
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={settings.noticeWindow}
                          onChange={(event) => updateSetting('noticeWindow', Number(event.target.value))}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">原值:</span>
                          <span className={previousSettings.noticeWindow !== settings.noticeWindow ? 'text-csg-red line-through' : ''}>
                            {previousSettings.noticeWindow}h
                          </span>
                        </div>
                        {previousSettings.noticeWindow !== settings.noticeWindow && (
                          <div className="text-csg-green">新值: {settings.noticeWindow}h</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-csg-green" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        自动合规初审
                      </label>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">原值:</span>
                          <span className={previousSettings.autoAudit !== settings.autoAudit ? 'text-csg-red line-through' : ''}>
                            {previousSettings.autoAudit ? '开启' : '关闭'}
                          </span>
                        </div>
                        {previousSettings.autoAudit !== settings.autoAudit && (
                          <div className="text-csg-green">新值: {settings.autoAudit ? '开启' : '关闭'}</div>
                        )}
                      </div>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoAudit}
                          onChange={(event) => updateSetting('autoAudit', event.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {settings.autoAudit ? '已开启' : '已关闭'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    启用后系统将自动对电价执行、补贴发放进行初步合规审查，发现异常自动预警
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      审批人: <span className="font-medium text-gray-700 dark:text-gray-200">{user?.realName || '当前用户'}</span>
                    </span>
                  </div>
                  <button type="submit" className="btn-primary whitespace-nowrap px-8">
                    保存设置
                  </button>
                </div>
              </div>
              
              {settingsSaved && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-sm text-csg-green">
                    <CheckCircle size={16} />
                    <div>
                      <span className="font-medium">设置已保存</span>
                      <span className="ml-2">变更记录已写入审计日志，待合规复查</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield size={18} className="text-csg-navy" /> 当前配置摘要
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">负荷告警阈值</span>
                  <span className="font-medium text-gray-900 dark:text-white">{settings.alertThreshold}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">停电通知提前</span>
                  <span className="font-medium text-gray-900 dark:text-white">{settings.noticeWindow} 小时</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">自动合规初审</span>
                  <span className={`font-medium ${settings.autoAudit ? 'text-csg-green' : 'text-gray-500'}`}>
                    {settings.autoAudit ? '已开启' : '已关闭'}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-gray-500 block mb-2">适用客群</span>
                  <div className="flex flex-wrap gap-1">
                    {settings.applicableTypes.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-csg-navy/10 text-csg-navy">
                        {CUSTOMER_TYPES.find(ct => ct.value === t)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {showChangeLog && (
              <div className="card p-5 max-h-[600px] overflow-y-auto">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <History size={18} className="text-csg-navy" /> 变更历史记录
                </h3>
                <div className="space-y-4">
                  {changeLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{log.settingName}</div>
                          <div className="text-xs text-gray-500">
                            {dayjs(log.changedAt).format('YYYY-MM-DD HH:mm')} · {log.changedBy}
                          </div>
                        </div>
                        <span className={reviewStatusBadge(log.reviewStatus)}>{reviewStatusLabel(log.reviewStatus)}</span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">变更:</span>
                          <span className="text-csg-red line-through">{String(log.oldValue)}</span>
                          <ChevronRight size={12} className="text-gray-400" />
                          <span className="text-csg-green font-medium">{String(log.newValue)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <User size={10} /> 审批: {log.approver}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users size={10} /> 适用: {log.applicableCustomerTypes.map(t => 
                            CUSTOMER_TYPES.find(ct => ct.value === t)?.label
                          ).join(', ')}
                        </div>
                        {log.remark && (
                          <div className="text-gray-500 italic">"{log.remark}"</div>
                        )}
                        {log.reviewedAt && (
                          <div className="text-gray-500">
                            复查: {log.reviewedBy} · {dayjs(log.reviewedAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        )}
                      </div>

                      {log.reviewStatus === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => handleReview(log.id, 'approved')}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-csg-green text-white hover:bg-csg-green/90"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReview(log.id, 'rejected')}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-csg-red text-white hover:bg-csg-red/90"
                          >
                            驳回
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
