import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  AlertTriangle,
  FileText as ContentIcon,
  Map,
  CheckSquare,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Clock,
  Eye,
  Droplets,
  Zap,
  Flame,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Radio,
  Shield,
  Network,
  Send,
  BarChart3,
  Newspaper,
  HeartPulse,
  Filter,
  GitBranch,
  ZapOff,
  CircleDot,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import StatCard from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';
import { emergencyLevelLabels, channelLabels, tierLabels } from '@shared/types';
import type { EmergencyInfo } from '@shared/types';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  todayPublished: number;
  pendingAppeals: number;
  emergencyLevel: string;
  userTrend: number;
  contentTrend: number;
  appealTrend: number;
  auditPending: number;
  auditBacklogTrend: number;
}

interface RecentContent {
  id: string;
  title: string;
  channel: string;
  viewCount: number;
  publishTime?: string;
  tier?: string;
  status?: string;
}

interface PublicServiceItem {
  id: string;
  type: 'water' | 'power' | 'gas' | 'construction';
  title: string;
  area: string;
  startTime: string;
  endTime: string;
  affectedCount: number;
  status: 'active' | 'resolved' | 'upcoming';
}

interface AuditBacklogItem {
  id: string;
  title: string;
  source: string;
  submitTime: string;
  riskLevel: 'high' | 'medium' | 'low';
  channel: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyInfo[]>([]);
  const [recentContents, setRecentContents] = useState<RecentContent[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [publicServices, setPublicServices] = useState<PublicServiceItem[]>([]);
  const [auditBacklog, setAuditBacklog] = useState<AuditBacklogItem[]>([]);

  useEffect(() => {
    loadStats();
    loadActiveEmergencies();
    loadRecentContents();
    loadPublicServices();
    loadAuditBacklog();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      setStats({
        totalUsers: 1285634,
        todayPublished: 28,
        pendingAppeals: 45,
        emergencyLevel: 'yellow',
        userTrend: 8.5,
        contentTrend: 12.3,
        appealTrend: -5.2,
        auditPending: 23,
        auditBacklogTrend: 15.3,
      });
    }
  };

  const loadActiveEmergencies = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/emergency/active');
      const data = await res.json();
      if (data.success) {
        setActiveEmergencies(data.data);
      }
    } catch (e) {
      setActiveEmergencies([
        {
          id: '1',
          title: '暴雨黄色预警信号',
          content: '预计未来12小时内我市大部分地区将出现50毫米以上降水，请注意防范。',
          level: 'yellow',
          type: '天气预警',
          targetAreas: ['全市'],
          isPinned: true,
          status: 'published',
          publishTime: '2024-06-20 08:30:00',
          createTime: '2024-06-20 08:00:00',
          creatorId: '1',
          creatorName: '气象局',
          reachCount: 850000,
          feedbackCount: 3247,
        },
        {
          id: '2',
          title: '云龙区部分区域计划停电通知',
          content: '因线路检修，6月21日云龙区和平路沿线将暂停供电8小时。',
          level: 'orange',
          type: '停电通知',
          targetAreas: ['云龙区'],
          isPinned: false,
          status: 'published',
          publishTime: '2024-06-20 10:00:00',
          createTime: '2024-06-20 09:30:00',
          creatorId: '2',
          creatorName: '供电公司',
          reachCount: 125000,
          feedbackCount: 856,
        },
      ]);
    }
  };

  const loadRecentContents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/dashboard/recent-contents');
      const data = await res.json();
      if (data.success) {
        setRecentContents(data.data);
      }
    } catch (e) {
      setRecentContents([
        { id: '1', title: '市委召开常委会会议 研究部署经济社会发展重点工作', channel: 'politics', viewCount: 12580, publishTime: '2024-06-20 10:30:00', tier: 'city', status: 'published' },
        { id: '2', title: '徐州地铁4号线一期工程正式开通运营', channel: 'livelihood', viewCount: 28960, publishTime: '2024-06-20 09:15:00', tier: 'city', status: 'published' },
        { id: '3', title: '徐州汉文化旅游节盛大开幕 擦亮汉文化名片', channel: 'culture', viewCount: 15420, publishTime: '2024-06-19 16:45:00', tier: 'city', status: 'published' },
        { id: '4', title: '我市今年新建改扩建中小学20所 增加学位3万个', channel: 'education', viewCount: 9870, publishTime: '2024-06-19 14:20:00', tier: 'city', status: 'published' },
        { id: '5', title: '泉山区开展社区养老服务试点 惠及12个街道', channel: 'livelihood', viewCount: 5620, publishTime: '2024-06-19 11:30:00', tier: 'district', status: 'published' },
        { id: '6', title: '鼓楼区市场监管局开展食品安全专项检查', channel: 'politics', viewCount: 4320, publishTime: '2024-06-19 10:00:00', tier: 'district', status: 'published' },
      ]);
    }
  };

  const loadPublicServices = () => {
    setPublicServices([
      { id: 's1', type: 'water', title: '铜山区北京路沿线停水检修', area: '铜山区', startTime: '2024-06-20 09:00', endTime: '2024-06-20 17:00', affectedCount: 3560, status: 'active' },
      { id: 's2', type: 'power', title: '云龙区和平大道计划停电', area: '云龙区', startTime: '2024-06-21 08:00', endTime: '2024-06-21 16:00', affectedCount: 8920, status: 'upcoming' },
      { id: 's3', type: 'gas', title: '鼓楼区煤港路燃气管道改造', area: '鼓楼区', startTime: '2024-06-20 14:00', endTime: '2024-06-20 18:00', affectedCount: 2180, status: 'active' },
      { id: 's4', type: 'construction', title: '建国路快速化改造工程施工', area: '泉山区', startTime: '2024-06-18 00:00', endTime: '2024-07-30 00:00', affectedCount: 15000, status: 'active' },
    ]);
  };

  const loadAuditBacklog = () => {
    setAuditBacklog([
      { id: 'a1', title: '关于某事件的不实报道核查', source: 'RSS接入', submitTime: '2024-06-20 10:45', riskLevel: 'high', channel: 'politics' },
      { id: 'a2', title: '某商业活动宣传内容审核', source: '人工录入', submitTime: '2024-06-20 10:20', riskLevel: 'medium', channel: 'livelihood' },
      { id: 'a3', title: '教育政策解读稿件复核', source: '政务API', submitTime: '2024-06-20 09:50', riskLevel: 'low', channel: 'education' },
      { id: 'a4', title: '文化节活动报道敏感词检测', source: '人工录入', submitTime: '2024-06-20 09:30', riskLevel: 'medium', channel: 'culture' },
      { id: 'a5', title: '社会民生新闻AI语义复核', source: 'RSS接入', submitTime: '2024-06-20 09:15', riskLevel: 'high', channel: 'livelihood' },
    ]);
  };

  const quickEntries = [
    { id: 'content', name: '内容发布', icon: ContentIcon, color: 'blue' as const, path: '/content' },
    { id: 'appeal', name: '诉求处理', icon: MessageSquare, color: 'green' as const, path: '/appeal' },
    { id: 'emergency', name: '应急发布', icon: AlertTriangle, color: 'red' as const, path: '/emergency' },
    { id: 'gis-map', name: '地图服务', icon: Map, color: 'cyan' as const, path: '/gis-map' },
    { id: 'audit', name: '内容审核', icon: CheckSquare, color: 'yellow' as const, path: '/audit' },
    { id: 'public-opinion', name: '舆情分析', icon: TrendingUp, color: 'purple' as const, path: '/public-opinion' },
  ];

  const channels = [
    { value: 'all', label: '全部' },
    { value: 'politics', label: '时政' },
    { value: 'livelihood', label: '民生' },
    { value: 'culture', label: '文化' },
    { value: 'education', label: '教育' },
  ];

  const serviceTypeMap: Record<string, { icon: any; color: string; label: string }> = {
    water: { icon: Droplets, color: 'text-blue-500 bg-blue-50', label: '停水' },
    power: { icon: ZapOff, color: 'text-amber-500 bg-amber-50', label: '停电' },
    gas: { icon: Flame, color: 'text-orange-500 bg-orange-50', label: '停气' },
    construction: { icon: Layers, color: 'text-slate-500 bg-slate-50', label: '施工' },
  };

  const riskLevelColors: Record<string, string> = {
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    low: 'bg-green-50 text-green-600 border-green-200',
  };

  const riskLevelLabels: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-red-100 text-red-700',
    resolved: 'bg-green-100 text-green-700',
    upcoming: 'bg-blue-100 text-blue-700',
  };

  const statusLabels: Record<string, string> = {
    active: '进行中',
    resolved: '已恢复',
    upcoming: '即将开始',
  };

  const heatTrendOption = {
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '当前'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: [25, 18, 45, 68, 72, 65, 78],
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.25)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.02)' },
            ],
          },
        },
        lineStyle: { color: '#8b5cf6', width: 2 },
        itemStyle: { color: '#8b5cf6' },
      },
    ],
  };

  const appealStatsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '2%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10, color: '#6b7280' } },
    series: [
      {
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 45, name: '待受理', itemStyle: { color: '#f59e0b' } },
          { value: 32, name: '处理中', itemStyle: { color: '#3b82f6' } },
          { value: 28, name: '已转办12345', itemStyle: { color: '#8b5cf6' } },
          { value: 18, name: '待反馈', itemStyle: { color: '#06b6d4' } },
          { value: 120, name: '已办结', itemStyle: { color: '#10b981' } },
        ],
      },
    ],
  };

  const tieredPublishOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    legend: { top: '0%', right: '0%', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10, color: '#6b7280' } },
    xAxis: {
      type: 'category',
      data: ['时政', '民生', '文化', '教育'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      { name: '市级', type: 'bar', stack: 'total', data: [45, 38, 28, 22], itemStyle: { color: '#2563eb', borderRadius: [0, 0, 0, 0] }, barWidth: 18 },
      { name: '区县', type: 'bar', stack: 'total', data: [32, 45, 25, 30], itemStyle: { color: '#60a5fa', borderRadius: [0, 0, 0, 0] } },
      { name: '街道', type: 'bar', stack: 'total', data: [18, 28, 15, 20], itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] } },
    ],
  };

  const opinionSourceOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '2%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10, color: '#6b7280' } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 420, name: '微博', itemStyle: { color: '#ef4444' } },
          { value: 315, name: '抖音', itemStyle: { color: '#111827' } },
          { value: 198, name: '微信', itemStyle: { color: '#22c55e' } },
          { value: 156, name: '论坛', itemStyle: { color: '#3b82f6' } },
          { value: 89, name: '其他', itemStyle: { color: '#94a3b8' } },
        ],
      },
    ],
  };

  const emergencyLevelColors: Record<string, string> = {
    red: 'from-red-600 to-red-700',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    normal: 'from-slate-500 to-slate-600',
  };

  const quickEntryColors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const filteredContents = activeChannel === 'all'
    ? recentContents
    : recentContents.filter(c => c.channel === activeChannel);

  return (
    <div className="space-y-5">
      <PageHeader
        title="控制台总览"
        description="徐州市级城市综合信息服务平台 - 运营管理控制台"
      />

      {activeEmergencies.length > 0 && (
        <div className="space-y-2">
          {activeEmergencies.slice(0, 2).map((em) => (
            <div key={em.id} className={`bg-gradient-to-r ${emergencyLevelColors[em.level]} text-white rounded-xl p-4 shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {emergencyLevelLabels[em.level as keyof typeof emergencyLevelLabels]}
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                      {em.type}
                    </span>
                    {em.isPinned && (
                      <span className="text-xs bg-white/25 px-2 py-0.5 rounded flex items-center gap-1">
                        <Radio className="w-3 h-3" /> 强制置顶
                      </span>
                    )}
                    <span className="text-xs bg-white/15 px-2 py-0.5 rounded">
                      覆盖: {em.targetAreas?.join('、')}
                    </span>
                    <span className="text-xs bg-white/15 px-2 py-0.5 rounded flex items-center gap-1">
                      <Users className="w-3 h-3" /> 触达 {(em.reachCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-white/90 truncate text-sm">{em.title}</p>
                </div>
                <button
                  onClick={() => navigate('/emergency')}
                  className="flex items-center gap-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                >
                  查看详情
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="总用户数"
          value={stats?.totalUsers?.toLocaleString() || '1,285,634'}
          change={stats?.userTrend || 8.5}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          compact
        />
        <StatCard
          title="今日发布"
          value={stats?.todayPublished || 28}
          change={stats?.contentTrend || 12.3}
          icon={<FileText className="w-5 h-5" />}
          color="green"
          compact
        />
        <StatCard
          title="待处理诉求"
          value={stats?.pendingAppeals || 45}
          change={stats?.appealTrend || -5.2}
          icon={<MessageSquare className="w-5 h-5" />}
          color="yellow"
          compact
        />
        <StatCard
          title="审核积压"
          value={stats?.auditPending || 23}
          change={stats?.auditBacklogTrend || 15.3}
          icon={<Shield className="w-5 h-5" />}
          color="orange"
          compact
        />
        <StatCard
          title="活跃应急"
          value={activeEmergencies.length || 2}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          compact
        />
        <StatCard
          title="舆情热度"
          value="72.5"
          change={5.8}
          icon={<Activity className="w-5 h-5" />}
          color="purple"
          compact
        />
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">快捷入口</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {quickEntries.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                onClick={() => navigate(entry.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quickEntryColors[entry.color]} transition-transform group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-slate-700 font-medium">{entry.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary-600" />
              <h3 className="text-base font-semibold text-slate-900">多频道内容流</h3>
            </div>
            <div className="flex items-center gap-1">
              {channels.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setActiveChannel(ch.value)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    activeChannel === ch.value
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {ch.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/content')}
                className="ml-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
              >
                全部 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {filteredContents.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                onClick={() => navigate('/content')}
              >
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded flex-shrink-0',
                  item.channel === 'politics' && 'bg-blue-50 text-blue-600',
                  item.channel === 'livelihood' && 'bg-green-50 text-green-600',
                  item.channel === 'culture' && 'bg-purple-50 text-purple-600',
                  item.channel === 'education' && 'bg-amber-50 text-amber-600',
                )}>
                  {channelLabels[item.channel as keyof typeof channelLabels]}
                </span>
                {item.tier && (
                  <span className="px-1.5 py-0.5 text-xs text-slate-500 bg-slate-50 rounded flex-shrink-0">
                    {tierLabels[item.tier as keyof typeof tierLabels]}
                  </span>
                )}
                <h4 className="flex-1 text-sm font-medium text-slate-800 truncate min-w-0">{item.title}</h4>
                <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                  <Eye className="w-3 h-3" />
                  {item.viewCount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0 w-28 text-right">
                  {item.publishTime?.slice(5, 16)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-cyan-600" />
              <h3 className="text-base font-semibold text-slate-900">公共服务运行态势</h3>
            </div>
            <button
              onClick={() => navigate('/gis-map')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              GIS地图 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {publicServices.map((svc) => {
              const typeInfo = serviceTypeMap[svc.type];
              const Icon = typeInfo.icon;
              return (
                <div
                  key={svc.id}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate('/gis-map')}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeInfo.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 truncate">{svc.title}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded flex-shrink-0', statusColors[svc.status])}>
                          {statusLabels[svc.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Map className="w-3 h-3" />
                          {svc.area}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          影响 {svc.affectedCount.toLocaleString()} 户
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {svc.startTime.slice(5)} ~ {svc.endTime.slice(5)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-600" />
              <h3 className="text-base font-semibold text-slate-900">审核积压</h3>
            </div>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              去审核 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {auditBacklog.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate('/audit')}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', riskLevelColors[item.riskLevel])}>
                    {riskLevelLabels[item.riskLevel]}
                  </span>
                  <span className="text-xs text-slate-400">{item.source}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700 truncate">{item.title}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{channelLabels[item.channel as keyof typeof channelLabels]}</span>
                  <span>{item.submitTime.slice(5, 16)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-red-600">6</div>
              <div className="text-xs text-slate-500">高风险</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">11</div>
              <div className="text-xs text-slate-500">中风险</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">6</div>
              <div className="text-xs text-slate-500">低风险</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-semibold text-slate-900">分级发布分布</h3>
            </div>
            <button
              onClick={() => navigate('/tiered-publishing')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              详情 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-44">
            <ReactECharts option={tieredPublishOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-blue-50">
              <div className="text-lg font-semibold text-blue-600">133</div>
              <div className="text-xs text-slate-500">市级内容池</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/70">
              <div className="text-lg font-semibold text-blue-500">232</div>
              <div className="text-xs text-slate-500">区县级内容池</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/40">
              <div className="text-lg font-semibold text-blue-400">167</div>
              <div className="text-xs text-slate-500">街道级内容池</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              <h3 className="text-base font-semibold text-slate-900">市民诉求转办</h3>
            </div>
            <button
              onClick={() => navigate('/appeal')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              诉求中心 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-40">
            <ReactECharts option={appealStatsOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-purple-500" />
                今日转办12345
              </span>
              <span className="font-medium text-slate-800">18 件</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-cyan-500" />
                待市民反馈
              </span>
              <span className="font-medium text-slate-800">12 件</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-green-500" />
                闭环办结率
              </span>
              <span className="font-medium text-green-600">94.2%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-slate-900">舆情热度趋势</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                热度指数
              </span>
              <button
                onClick={() => navigate('/public-opinion')}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
              >
                舆情分析 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="h-48">
            <ReactECharts option={heatTrendOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-3">
            <div className="text-center p-2.5 rounded-lg bg-red-50">
              <div className="text-base font-bold text-red-600 flex items-center justify-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> 12
              </div>
              <div className="text-xs text-slate-500 mt-0.5">敏感预警</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-orange-50">
              <div className="text-base font-bold text-orange-600 flex items-center justify-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> 5
              </div>
              <div className="text-xs text-slate-500 mt-0.5">热点上升</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-blue-50">
              <div className="text-base font-bold text-blue-600 flex items-center justify-center gap-1">
                <ArrowDownRight className="w-4 h-4" /> 8
              </div>
              <div className="text-xs text-slate-500 mt-0.5">热度下降</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-green-50">
              <div className="text-base font-bold text-green-600 flex items-center justify-center gap-1">
                <CheckSquare className="w-4 h-4" /> 23
              </div>
              <div className="text-xs text-slate-500 mt-0.5">已处置</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-slate-900">舆情来源分布</h3>
            </div>
          </div>
          <div className="h-40">
            <ReactECharts option={opinionSourceOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
              <GitBranch className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">传播链路追踪</div>
                <div className="text-xs text-slate-500 mt-0.5">当前监测 3 条敏感传播路径</div>
              </div>
              <button
                onClick={() => navigate('/public-opinion')}
                className="text-xs px-2.5 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                溯源
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-semibold text-slate-900">分级审批动态</h3>
            </div>
            <button
              onClick={() => navigate('/tiered-publishing')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              查看审批流 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              { from: '街道', to: '区县', title: '和平街道社区老年活动中心报道', time: '10分钟前', status: '待审批', type: 'up' },
              { from: '区县', to: '市级', title: '泉山区优化营商环境新政策', time: '25分钟前', status: '审批中', type: 'up' },
              { from: '市级', to: '区县', title: '关于做好防汛工作的通知', time: '1小时前', status: '已下发', type: 'down' },
              { from: '区县', to: '街道', title: '鼓楼区文明城市创建活动安排', time: '2小时前', status: '已下发', type: 'down' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  item.type === 'up' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                )}>
                  {item.type === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{item.from}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-medium text-slate-600">{item.to}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-800 truncate">{item.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    item.status === '待审批' && 'bg-yellow-50 text-yellow-600',
                    item.status === '审批中' && 'bg-blue-50 text-blue-600',
                    item.status === '已下发' && 'bg-green-50 text-green-600'
                  )}>
                    {item.status}
                  </span>
                  <div className="mt-1 text-xs text-slate-400">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <h3 className="text-base font-semibold text-slate-900">应急发布触达链路</h3>
            </div>
            <button
              onClick={() => navigate('/emergency')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              应急管理 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {activeEmergencies.slice(0, 2).map((em) => (
              <div key={em.id} className="p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded font-medium text-white',
                    em.level === 'red' && 'bg-red-600',
                    em.level === 'orange' && 'bg-orange-500',
                    em.level === 'yellow' && 'bg-yellow-500',
                  )}>
                    {emergencyLevelLabels[em.level as keyof typeof emergencyLevelLabels]}
                  </span>
                  <span className="text-sm font-medium text-slate-800 truncate flex-1">{em.title}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-sm font-semibold text-slate-800">{(em.reachCount || 0).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">推送触达</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-sm font-semibold text-blue-600">86.3%</div>
                    <div className="text-xs text-slate-500">APP打开率</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-sm font-semibold text-green-600">{(em.feedbackCount || 0).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">市民反馈</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-sm font-semibold text-purple-600">{em.targetAreas?.length || 1}</div>
                    <div className="text-xs text-slate-500">覆盖区域</div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">APP推送</span>
                  <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded">短信通知</span>
                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">电视滚动</span>
                  <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">广播播报</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
