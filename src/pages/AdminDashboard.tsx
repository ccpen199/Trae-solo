import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  MapPin,
  Calendar,
  RefreshCw,
  X,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Target,
  Zap,
  Layers,
  User,
  CheckCircle2,
  FileText,
  Download,
  Settings,
  Percent,
  Route,
  Home,
} from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import api, { ApiResponse, DashboardStats, User as UserType } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

const COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
const FUNNEL_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

interface SalesDetail {
  id: number;
  date: string;
  projectName: string;
  district: string;
  channel: string;
  salesCount: number;
  revenue: number;
  avgPrice: number;
  customerName: string;
  advisorName: string;
}

interface FunnelDetail {
  stage: string;
  count: number;
  conversionRate: number;
  avgDuration: string;
  dropReason: string;
  details: Array<{
    id: number;
    customerName: string;
    phone: string;
    enterTime: string;
    leaveTime?: string;
    status: string;
  }>;
}

interface ChannelDetail {
  channel: string;
  count: number;
  percentage: number;
  conversionRate: number;
  avgCost: number;
  totalRevenue: number;
  details: Array<{
    id: number;
    source: string;
    customerName: string;
    phone: string;
    createTime: string;
    status: string;
  }>;
}

interface CycleDetail {
  period: string;
  avgCycle: number;
  minCycle: number;
  maxCycle: number;
  totalDeals: number;
  details: Array<{
    id: number;
    projectName: string;
    customerName: string;
    firstContact: string;
    dealTime: string;
    cycleDays: number;
    amount: number;
  }>;
}

const mockSalesDetails: SalesDetail[] = [
  { id: 1, date: '2026-06-07', projectName: '金域华府', district: '浦东新区', channel: '线上咨询', salesCount: 3, revenue: 20400000, avgPrice: 68000, customerName: '张先生', advisorName: '张三' },
  { id: 2, date: '2026-06-07', projectName: '滨江壹号', district: '徐汇区', channel: '门店到访', salesCount: 2, revenue: 25000000, avgPrice: 92000, customerName: '李女士', advisorName: '李四' },
  { id: 3, date: '2026-06-06', projectName: '金域华府', district: '浦东新区', channel: '经纪推荐', salesCount: 1, revenue: 6800000, avgPrice: 68000, customerName: '王先生', advisorName: '张三' },
  { id: 4, date: '2026-06-06', projectName: '翠湖天地', district: '黄浦区', channel: '线上咨询', salesCount: 2, revenue: 19600000, avgPrice: 98000, customerName: '赵女士', advisorName: '王五' },
  { id: 5, date: '2026-06-05', projectName: '保利中央公园', district: '天河区', channel: '门店到访', salesCount: 1, revenue: 7200000, avgPrice: 72000, customerName: '孙先生', advisorName: '赵六' },
];

const mockFunnelDetails: FunnelDetail[] = [
  { stage: '线上浏览', count: 1280, conversionRate: 100, avgDuration: '-', dropReason: '-', details: [] },
  { stage: '点击咨询', count: 896, conversionRate: 70, avgDuration: '2天', dropReason: '价格超出预算', details: [
    { id: 1, customerName: '客户A', phone: '138****1234', enterTime: '2026-06-01 10:00', leaveTime: '2026-06-03 14:00', status: '已流失' },
    { id: 2, customerName: '客户B', phone: '139****5678', enterTime: '2026-06-02 09:30', status: '咨询中' },
  ]},
  { stage: '资格核验', count: 538, conversionRate: 60, avgDuration: '3天', dropReason: '限购不符合', details: [
    { id: 3, customerName: '客户C', phone: '137****9012', enterTime: '2026-06-01 14:00', leaveTime: '2026-06-04 10:00', status: '核验未通过' },
    { id: 4, customerName: '客户D', phone: '136****3456', enterTime: '2026-06-03 11:00', status: '核验通过' },
  ]},
  { stage: '认购签约', count: 323, conversionRate: 60, avgDuration: '5天', dropReason: '竞品分流', details: [
    { id: 5, customerName: '客户E', phone: '135****7890', enterTime: '2026-06-02 15:00', leaveTime: '2026-06-07 09:00', status: '已认购' },
  ]},
  { stage: '完成成交', count: 194, conversionRate: 60, avgDuration: '7天', dropReason: '-', details: [
    { id: 6, customerName: '客户F', phone: '134****2345', enterTime: '2026-06-01 16:00', status: '已成交' },
  ]},
];

const mockChannelDetails: ChannelDetail[] = [
  { channel: '线上咨询', count: 45, percentage: 45, conversionRate: 28, avgCost: 150, totalRevenue: 135000000, details: [
    { id: 1, source: '百度搜索', customerName: '张先生', phone: '138****1111', createTime: '2026-06-07 10:00', status: '意向客户' },
    { id: 2, source: '微信小程序', customerName: '李女士', phone: '139****2222', createTime: '2026-06-07 11:30', status: '已成交' },
  ]},
  { channel: '门店到访', count: 28, percentage: 28, conversionRate: 35, avgCost: 200, totalRevenue: 98000000, details: [
    { id: 3, source: '自然到访', customerName: '王先生', phone: '137****3333', createTime: '2026-06-06 14:00', status: '跟进中' },
  ]},
  { channel: '经纪推荐', count: 27, percentage: 27, conversionRate: 42, avgCost: 300, totalRevenue: 86000000, details: [
    { id: 4, source: '链家推荐', customerName: '赵女士', phone: '136****4444', createTime: '2026-06-05 09:00', status: '已成交' },
  ]},
];

const mockCycleDetails: CycleDetail[] = [
  { period: '本周', avgCycle: 12, minCycle: 5, maxCycle: 28, totalDeals: 48, details: [
    { id: 1, projectName: '金域华府', customerName: '张先生', firstContact: '2026-05-28', dealTime: '2026-06-07', cycleDays: 10, amount: 6800000 },
    { id: 2, projectName: '滨江壹号', customerName: '李女士', firstContact: '2026-05-25', dealTime: '2026-06-06', cycleDays: 12, amount: 12500000 },
  ]},
  { period: '上周', avgCycle: 15, minCycle: 7, maxCycle: 35, totalDeals: 42, details: [] },
  { period: '本月', avgCycle: 14, minCycle: 5, maxCycle: 35, totalDeals: 90, details: [] },
  { period: '上月', avgCycle: 18, minCycle: 8, maxCycle: 42, totalDeals: 78, details: [] },
];

const districtOptions = ['全部区域', '浦东新区', '徐汇区', '黄浦区', '静安区', '闵行区', '宝山区'];
const channelOptions = ['全部渠道', '线上咨询', '门店到访', '经纪推荐', '老带新', '广告投放'];
const dateOptions = ['今日', '本周', '本月', '本季度', '本年', '自定义'];

const roleWorkbenches: Record<string, { title: string; description: string; features: string[]; stats: Array<{ label: string; value: number; icon: any; color: string }>; quickActions: Array<{ label: string; icon: any; color: string; route: string; roles: string[] }> }> = {
  admin: {
    title: '管理员工作台',
    description: '全局数据概览与系统管理',
    features: ['销售数据看板', '房源管理', '工单处理', '分佣规则', '权限管理', '楼盘配置'],
    stats: [
      { label: '在售楼盘', value: 28, icon: Building2, color: 'from-blue-500 to-blue-600' },
      { label: '注册用户', value: 12580, icon: Users, color: 'from-green-500 to-green-600' },
      { label: '销售总额', value: 15.8, icon: DollarSign, color: 'from-amber-500 to-amber-600' },
      { label: '待处理工单', value: 12, icon: Ticket, color: 'from-red-500 to-red-600' },
    ],
    quickActions: [
      { label: '楼盘配置', icon: Home, color: 'from-blue-500 to-blue-600', route: '/admin/properties', roles: ['admin'] },
      { label: '分佣规则', icon: Percent, color: 'from-green-500 to-green-600', route: '/admin/commission', roles: ['admin'] },
      { label: '工单追踪明细', icon: Route, color: 'from-amber-500 to-amber-600', route: '/admin/tickets', roles: ['admin', 'advisor'] },
      { label: '系统设置', icon: Settings, color: 'from-purple-500 to-purple-600', route: '/admin/settings', roles: ['admin'] },
    ],
  },
  advisor: {
    title: '置业顾问工作台',
    description: '客户跟进与业绩追踪',
    features: ['我的客户', '待办任务', '业绩统计', '佣金明细', '排班管理', '工单处理'],
    stats: [
      { label: '跟进客户', value: 36, icon: Users, color: 'from-blue-500 to-blue-600' },
      { label: '本月成交', value: 8, icon: TrendingUp, color: 'from-green-500 to-green-600' },
      { label: '待办事项', value: 12, icon: Clock, color: 'from-amber-500 to-amber-600' },
      { label: '本月佣金', value: 86000, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
    ],
    quickActions: [
      { label: '工单追踪明细', icon: Route, color: 'from-amber-500 to-amber-600', route: '/admin/tickets', roles: ['admin', 'advisor'] },
    ],
  },
  agent: {
    title: '经纪人工作台',
    description: '房源推广与客户推荐',
    features: ['推荐房源', '我的客户', '推荐记录', '佣金结算', '培训资料'],
    stats: [
      { label: '推荐客户', value: 24, icon: Users, color: 'from-blue-500 to-blue-600' },
      { label: '成功转化', value: 6, icon: Target, color: 'from-green-500 to-green-600' },
      { label: '待结算', value: 32000, icon: DollarSign, color: 'from-amber-500 to-amber-600' },
      { label: '可推荐房源', value: 156, icon: Building2, color: 'from-indigo-500 to-indigo-600' },
    ],
    quickActions: [],
  },
};

const normalizeStats = (stats: Partial<DashboardStats> & Record<string, any>): DashboardStats => ({
  totalProperties: stats.totalProperties || 0,
  totalSales: stats.totalSales || stats.completedOrders || 0,
  totalRevenue: stats.totalRevenue || 0,
  pendingTickets: stats.pendingTickets || 0,
  funnelData: stats.funnelData || [
    { name: '线上浏览', value: stats.totalProperties || 0 },
    { name: '资格核验', value: stats.pendingOrders || 0 },
    { name: '完成成交', value: stats.completedOrders || stats.totalSales || 0 },
  ],
  channelData: stats.channelData || [
    { name: '线上咨询', value: 45 },
    { name: '门店到访', value: 28 },
    { name: '经纪推荐', value: 27 },
  ],
  trendData: stats.trendData || [
    { date: '06-01', sales: 8, revenue: 6800000 },
    { date: '06-02', sales: 11, revenue: 9200000 },
    { date: '06-03', sales: 9, revenue: 7500000 },
    { date: '06-04', sales: 14, revenue: 11800000 },
  ],
});

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSalesDetail, setShowSalesDetail] = useState(false);
  const [showFunnelDetail, setShowFunnelDetail] = useState(false);
  const [showChannelDetail, setShowChannelDetail] = useState(false);
  const [showCycleDetail, setShowCycleDetail] = useState(false);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedCyclePeriod, setSelectedCyclePeriod] = useState<string | null>(null);
  const [salesFilters, setSalesFilters] = useState({
    date: '本周',
    district: '全部区域',
    channel: '全部渠道',
    search: '',
  });
  const [salesDetails] = useState<SalesDetail[]>(mockSalesDetails);
  const [funnelDetails] = useState<FunnelDetail[]>(mockFunnelDetails);
  const [channelDetails] = useState<ChannelDetail[]>(mockChannelDetails);
  const [cycleDetails] = useState<CycleDetail[]>(mockCycleDetails);

  const currentRole = user?.role || 'admin';
  const workbench = roleWorkbenches[currentRole] || roleWorkbenches.admin;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
      if (res.code === 200) {
        setStats(normalizeStats(res.data));
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
  };

  const filteredSalesDetails = salesDetails.filter((item) => {
    const matchDistrict = salesFilters.district === '全部区域' || item.district === salesFilters.district;
    const matchChannel = salesFilters.channel === '全部渠道' || item.channel === salesFilters.channel;
    const matchSearch = !salesFilters.search ||
      item.projectName.includes(salesFilters.search) ||
      item.customerName.includes(salesFilters.search) ||
      item.advisorName.includes(salesFilters.search);
    return matchDistrict && matchChannel && matchSearch;
  });

  const handleFunnelStageClick = (stage: string) => {
    setSelectedFunnelStage(stage);
    setShowFunnelDetail(true);
  };

  const handleChannelClick = (channel: string) => {
    setSelectedChannel(channel);
    setShowChannelDetail(true);
  };

  const handleCyclePeriodClick = (period: string) => {
    setSelectedCyclePeriod(period);
    setShowCycleDetail(true);
  };

  const getFunnelStageDetail = (stage: string) => {
    return funnelDetails.find((f) => f.stage === stage);
  };

  const getChannelDetail = (channel: string) => {
    return channelDetails.find((c) => c.channel === channel);
  };

  const getCyclePeriodDetail = (period: string) => {
    return cycleDetails.find((c) => c.period === period);
  };

  const statCards = [
    {
      label: '在售房源',
      value: stats?.totalProperties || 0,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      trend: '+12%',
      trendUp: true,
      route: currentRole === 'admin' ? '/admin/properties' : null,
    },
    {
      label: '本月成交',
      value: stats?.totalSales || 0,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      trend: '+23%',
      trendUp: true,
      route: null,
    },
    {
      label: '总销售额',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      trend: '+18%',
      trendUp: true,
      route: null,
    },
    {
      label: '待处理工单',
      value: stats?.pendingTickets || 0,
      icon: Ticket,
      color: 'from-red-500 to-red-600',
      trend: '-5%',
      trendUp: false,
      route: '/admin/tickets',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">后台管理中心 · {workbench.title}</h1>
          <p className="text-gray-500 mt-1">
            {workbench.description}
            {user && (
              <span className="ml-2 text-primary-600 font-medium">
                欢迎，{user.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm">
            <Layers className="w-4 h-4" />
            {currentRole === 'admin' ? '管理员' : currentRole === 'advisor' ? '置业顾问' : '经纪人'}
          </div>
          <button
            onClick={loadStats}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {workbench.features.map((feature, index) => (
            <span key={index} className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 border border-primary-200">
              {feature}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workbench.stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-4 border border-primary-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {workbench.quickActions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            快捷入口
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workbench.quickActions
              .filter((action) => action.roles.includes(currentRole))
              .map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => (window.location.href = action.route)}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-lg transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                      {action.label}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const CardWrapper = card.route ? 'button' : 'div';
          return (
            <CardWrapper
              key={index}
              onClick={card.route ? () => (window.location.href = card.route!) : undefined}
              className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow text-left w-full ${card.route ? 'cursor-pointer hover:border-primary-300' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {card.trend}
                    <span className="text-gray-400 ml-1">vs 上月</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center ${card.route ? 'group-hover:scale-110 transition-transform' : ''}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              销售转化漏斗
            </h3>
            <button
              onClick={() => setShowFunnelDetail(true)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看明细 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart data={funnelDetails}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900">{data.stage}</p>
                          <p className="text-sm text-gray-600">人数: {data.count}</p>
                          <p className="text-sm text-gray-600">转化率: {data.conversionRate}%</p>
                          <p className="text-sm text-gray-600">平均周期: {data.avgDuration}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Funnel dataKey="count" isAnimationActive>
                  <LabelList position="right" fill="#374151" stroke="none" dataKey="count" />
                  <LabelList position="center" fill="white" stroke="none" dataKey="stage" fontSize={12} />
                  {funnelDetails.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleFunnelStageClick(entry.stage)}
                    />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {funnelDetails.slice(1).map((item, index) => (
                <div key={item.stage} className="flex items-center justify-between">
                  <span className="text-gray-600">{funnelDetails[index].stage} → {item.stage}</span>
                  <span className={`font-medium ${item.conversionRate >= 60 ? 'text-green-600' : item.conversionRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                    {item.conversionRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary-600" />
              客源渠道分布
            </h3>
            <button
              onClick={() => setShowChannelDetail(true)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看明细 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDetails}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  onClick={(data) => handleChannelClick(data.channel)}
                  className="cursor-pointer"
                >
                  {channelDetails.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900">{data.channel}</p>
                          <p className="text-sm text-gray-600">客户数: {data.count}</p>
                          <p className="text-sm text-gray-600">占比: {data.percentage}%</p>
                          <p className="text-sm text-gray-600">转化率: {data.conversionRate}%</p>
                          <p className="text-sm text-gray-600">产出: {formatCurrency(data.totalRevenue)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {channelDetails.map((item, index) => (
              <button
                key={item.channel}
                onClick={() => handleChannelClick(item.channel)}
                className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-gray-600">{item.channel}</span>
                <span className="text-xs text-gray-400">({item.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            销售趋势
          </h3>
          <button
            onClick={() => setShowSalesDetail(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            查看明细 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="h-80 cursor-pointer" onClick={() => setShowSalesDetail(true)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.trendData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                stroke="#1e3a5f"
                strokeWidth={2}
                dot={{ fill: '#1e3a5f' }}
                name="成交套数"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#d4af37"
                strokeWidth={2}
                dot={{ fill: '#d4af37' }}
                name="销售额"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1e3a5f]" />
            <span className="text-sm text-gray-600">成交套数</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#d4af37]" />
            <span className="text-sm text-gray-600">销售额</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              成交周期分析
            </h3>
            <button
              onClick={() => setShowCycleDetail(true)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看明细 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {cycleDetails.map((item) => (
              <button
                key={item.period}
                onClick={() => handleCyclePeriodClick(item.period)}
                className="w-full p-4 bg-gray-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.period}</span>
                  <span className="text-xs text-gray-500">共 {item.totalDeals} 笔成交</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">平均周期</p>
                    <p className="font-bold text-primary-600">{item.avgCycle}天</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">最短周期</p>
                    <p className="font-medium text-green-600">{item.minCycle}天</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">最长周期</p>
                    <p className="font-medium text-amber-600">{item.maxCycle}天</p>
                  </div>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    style={{ width: `${Math.min((item.avgCycle / 42) * 100, 100)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">热销楼盘TOP5</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">排名</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">楼盘名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">区域</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">本月成交</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">销售额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成交周期</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rank: 1, name: '金域华府', district: '浦东新区', sales: 58, revenue: 34800000, period: '12天' },
                { rank: 2, name: '滨江壹号', district: '黄浦区', sales: 42, revenue: 42000000, period: '15天' },
                { rank: 3, name: '中央公园', district: '静安区', sales: 36, revenue: 28800000, period: '18天' },
                { rank: 4, name: '翠湖天地', district: '徐汇区', sales: 31, revenue: 46500000, period: '20天' },
                { rank: 5, name: '星河湾', district: '闵行区', sales: 25, revenue: 22500000, period: '16天' },
              ].map((item) => (
                <tr key={item.rank} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      item.rank === 2 ? 'bg-gray-200 text-gray-700' :
                      item.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {item.district}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{item.sales}套</td>
                  <td className="py-4 px-4 font-medium text-primary-600">{formatCurrency(item.revenue)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      平均{item.period}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {showSalesDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">销售明细追踪</h3>
                <p className="text-sm text-gray-500 mt-1">支持按日期、区域、渠道筛选</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  导出
                </button>
                <button onClick={() => setShowSalesDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={salesFilters.date}
                  onChange={(e) => setSalesFilters((prev) => ({ ...prev, date: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {dateOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <select
                  value={salesFilters.district}
                  onChange={(e) => setSalesFilters((prev) => ({ ...prev, district: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {districtOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <select
                  value={salesFilters.channel}
                  onChange={(e) => setSalesFilters((prev) => ({ ...prev, channel: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {channelOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索楼盘、客户、顾问..."
                  value={salesFilters.search}
                  onChange={(e) => setSalesFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">楼盘</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">区域</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">渠道</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成交套数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成交金额</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">顾问</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesDetails.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">暂无数据</td>
                    </tr>
                  ) : (
                    filteredSalesDetails.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-900">{item.date}</td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.projectName}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{item.district}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.channel === '线上咨询' ? 'bg-blue-100 text-blue-700' :
                            item.channel === '门店到访' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {item.channel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.salesCount}套</td>
                        <td className="py-4 px-4 text-sm font-medium text-primary-600">{formatCurrency(item.revenue)}</td>
                        <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {item.customerName}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{item.advisorName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
              <span>共 {filteredSalesDetails.length} 条记录</span>
              <button onClick={() => setShowSalesDetail(false)} className="btn-primary px-6">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showFunnelDetail && selectedFunnelStage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">转化漏斗明细 - {selectedFunnelStage}</h3>
                <p className="text-sm text-gray-500 mt-1">下钻查看各环节数据</p>
              </div>
              <button onClick={() => { setShowFunnelDetail(false); setSelectedFunnelStage(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const detail = getFunnelStageDetail(selectedFunnelStage);
              if (!detail) return null;
              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-600 mb-1">当前人数</p>
                      <p className="text-2xl font-bold text-blue-900">{detail.count}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-600 mb-1">转化率</p>
                      <p className="text-2xl font-bold text-green-900">{detail.conversionRate}%</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <p className="text-sm text-amber-600 mb-1">平均停留</p>
                      <p className="text-2xl font-bold text-amber-900">{detail.avgDuration}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl">
                      <p className="text-sm text-red-600 mb-1">主要流失原因</p>
                      <p className="text-lg font-bold text-red-900">{detail.dropReason || '-'}</p>
                    </div>
                  </div>

                  {detail.details.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">手机号</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">进入时间</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">离开时间</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.details.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {item.customerName}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.phone}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.enterTime}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.leaveTime || '-'}</td>
                              <td className="py-4 px-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  item.status.includes('成交') || item.status.includes('认购') || item.status.includes('通过')
                                    ? 'bg-green-100 text-green-700'
                                    : item.status.includes('流失') || item.status.includes('未通过')
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button onClick={() => { setShowFunnelDetail(false); setSelectedFunnelStage(null); }} className="btn-primary px-6">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showChannelDetail && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">客源渠道明细 - {selectedChannel}</h3>
                <p className="text-sm text-gray-500 mt-1">按来源渠道筛选分析</p>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>全部来源</option>
                  <option>百度搜索</option>
                  <option>微信小程序</option>
                  <option>自然到访</option>
                  <option>链家推荐</option>
                </select>
                <button onClick={() => { setShowChannelDetail(false); setSelectedChannel(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {(() => {
              const detail = getChannelDetail(selectedChannel);
              if (!detail) return null;
              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-600 mb-1">客户数</p>
                      <p className="text-2xl font-bold text-blue-900">{detail.count}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-sm text-purple-600 mb-1">占比</p>
                      <p className="text-2xl font-bold text-purple-900">{detail.percentage}%</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-600 mb-1">转化率</p>
                      <p className="text-2xl font-bold text-green-900">{detail.conversionRate}%</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <p className="text-sm text-amber-600 mb-1">平均获客成本</p>
                      <p className="text-2xl font-bold text-amber-900">¥{detail.avgCost}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl">
                      <p className="text-sm text-indigo-600 mb-1">总产出</p>
                      <p className="text-2xl font-bold text-indigo-900">{formatCurrency(detail.totalRevenue)}</p>
                    </div>
                  </div>

                  {detail.details.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">来源</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">手机号</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.details.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4 text-sm text-gray-600">{item.source}</td>
                              <td className="py-4 px-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {item.customerName}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.phone}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.createTime}</td>
                              <td className="py-4 px-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  item.status === '已成交' ? 'bg-green-100 text-green-700' :
                                  item.status === '意向客户' ? 'bg-blue-100 text-blue-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button onClick={() => { setShowChannelDetail(false); setSelectedChannel(null); }} className="btn-primary px-6">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showCycleDetail && selectedCyclePeriod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">成交周期明细 - {selectedCyclePeriod}</h3>
                <p className="text-sm text-gray-500 mt-1">按时间段查看成交周期分布</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  {cycleDetails.map((c) => (
                    <option key={c.period} value={c.period}>{c.period}</option>
                  ))}
                </select>
                <button onClick={() => { setShowCycleDetail(false); setSelectedCyclePeriod(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {(() => {
              const detail = getCyclePeriodDetail(selectedCyclePeriod);
              if (!detail) return null;
              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-600 mb-1">成交总数</p>
                      <p className="text-2xl font-bold text-blue-900">{detail.totalDeals}套</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-600 mb-1">平均周期</p>
                      <p className="text-2xl font-bold text-green-900">{detail.avgCycle}天</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <p className="text-sm text-emerald-600 mb-1">最短周期</p>
                      <p className="text-2xl font-bold text-emerald-900">{detail.minCycle}天</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <p className="text-sm text-amber-600 mb-1">最长周期</p>
                      <p className="text-2xl font-bold text-amber-900">{detail.maxCycle}天</p>
                    </div>
                  </div>

                  {detail.details.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">楼盘</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">首次接触</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成交时间</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成交周期</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成交金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.details.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.projectName}</td>
                              <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {item.customerName}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.firstContact}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{item.dealTime}</td>
                              <td className="py-4 px-4">
                                <span className={`text-sm font-medium ${
                                  item.cycleDays <= 10 ? 'text-green-600' :
                                  item.cycleDays <= 20 ? 'text-blue-600' :
                                  'text-amber-600'
                                }`}>
                                  {item.cycleDays}天
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm font-medium text-primary-600">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {detail.details.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>暂无明细数据</p>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button onClick={() => { setShowCycleDetail(false); setSelectedCyclePeriod(null); }} className="btn-primary px-6">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
