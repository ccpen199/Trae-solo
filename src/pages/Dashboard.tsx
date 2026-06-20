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
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import StatCard from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';
import { emergencyLevelLabels } from '@shared/types';
import type { EmergencyInfo } from '@shared/types';

interface DashboardStats {
  totalUsers: number;
  todayPublished: number;
  pendingAppeals: number;
  emergencyLevel: string;
  userTrend: number;
  contentTrend: number;
  appealTrend: number;
}

interface RecentContent {
  id: string;
  title: string;
  channel: string;
  viewCount: number;
  publishTime?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyInfo[]>([]);
  const [recentContents, setRecentContents] = useState<RecentContent[]>([]);

  useEffect(() => {
    loadStats();
    loadActiveEmergencies();
    loadRecentContents();
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
          content: '预计未来12小时内我市大部分地区将出现50毫米以上降水...',
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
        { id: '1', title: '市委召开常委会会议 研究部署经济社会发展重点工作', channel: 'politics', viewCount: 12580, publishTime: '2024-06-20 10:30:00' },
        { id: '2', title: '徐州地铁4号线一期工程正式开通运营', channel: 'livelihood', viewCount: 28960, publishTime: '2024-06-20 09:15:00' },
        { id: '3', title: '徐州汉文化旅游节盛大开幕 擦亮汉文化名片', channel: 'culture', viewCount: 15420, publishTime: '2024-06-19 16:45:00' },
        { id: '4', title: '我市今年新建改扩建中小学20所 增加学位3万个', channel: 'education', viewCount: 9870, publishTime: '2024-06-19 14:20:00' },
        { id: '5', title: '全市安全生产工作会议召开 压实责任筑牢防线', channel: 'politics', viewCount: 7650, publishTime: '2024-06-19 11:00:00' },
      ]);
    }
  };

  const quickEntries = [
    { id: 'content', name: '内容发布', icon: ContentIcon, color: 'blue' as const, path: '/content' },
    { id: 'appeal', name: '诉求处理', icon: MessageSquare, color: 'green' as const, path: '/appeal' },
    { id: 'emergency', name: '应急发布', icon: AlertTriangle, color: 'red' as const, path: '/emergency' },
    { id: 'gis-map', name: '地图服务', icon: Map, color: 'cyan' as const, path: '/gis-map' },
    { id: 'audit', name: '内容审核', icon: CheckSquare, color: 'yellow' as const, path: '/audit' },
    { id: 'public-opinion', name: '舆情分析', icon: TrendingUp, color: 'purple' as const, path: '/public-opinion' },
  ];

  const channelLabels: Record<string, string> = {
    politics: '时政',
    livelihood: '民生',
    culture: '文化',
    education: '教育',
  };

  const heatTrendOption = {
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['6/14', '6/15', '6/16', '6/17', '6/18', '6/19', '6/20'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: [45, 52, 48, 60, 58, 68, 72],
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
            ],
          },
        },
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  const appealStatsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#6b7280' } },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 45, name: '待处理', itemStyle: { color: '#f59e0b' } },
          { value: 32, name: '处理中', itemStyle: { color: '#3b82f6' } },
          { value: 28, name: '已转办', itemStyle: { color: '#8b5cf6' } },
          { value: 120, name: '已解决', itemStyle: { color: '#10b981' } },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="控制台总览"
        description="徐州市级城市综合信息服务平台 - 运营管理控制台"
      />

      {activeEmergencies.length > 0 && (
        <div className={`bg-gradient-to-r ${emergencyLevelColors[activeEmergencies[0].level]} text-white rounded-xl p-4 shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {emergencyLevelLabels[activeEmergencies[0].level as keyof typeof emergencyLevelLabels]}
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                  {activeEmergencies[0].type}
                </span>
              </div>
              <p className="mt-1 text-white/90 truncate">{activeEmergencies[0].title}</p>
            </div>
            <button
              onClick={() => navigate('/emergency')}
              className="flex items-center gap-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              查看详情
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="总用户数"
          value={stats?.totalUsers?.toLocaleString() || '1,285,634'}
          change={stats?.userTrend || 8.5}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="今日发布内容"
          value={stats?.todayPublished || 28}
          change={stats?.contentTrend || 12.3}
          icon={<FileText className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="待处理诉求"
          value={stats?.pendingAppeals || 45}
          change={stats?.appealTrend || -5.2}
          icon={<MessageSquare className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="应急等级"
          value={stats?.emergencyLevel ? emergencyLevelLabels[stats.emergencyLevel as keyof typeof emergencyLevelLabels] : '黄色预警'}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">快捷入口</h3>
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

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">舆情热度</h3>
            <button
              onClick={() => navigate('/public-opinion')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              详情 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-32">
            <ReactECharts option={heatTrendOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">最新发布内容</h3>
            <button
              onClick={() => navigate('/content')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentContents.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/content/${item.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate">{item.title}</h4>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded">
                      {channelLabels[item.channel]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.publishTime?.slice(5, 16)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.viewCount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">诉求处理统计</h3>
            <button
              onClick={() => navigate('/appeal')}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              详情 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-48">
            <ReactECharts option={appealStatsOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
