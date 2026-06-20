import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  FileImage,
  Eye,
  Edit3,
  Clock,
  Search,
  FileText,
  Users,
  Briefcase,
  MapPin,
  ChevronRight,
  MessageSquare,
  UserCheck,
  PlusCircle,
  Database,
  LineChart,
  Shield,
  TrendingUp,
  DollarSign,
  UserPlus,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import StatCard from '@/components/dashboard/StatCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import ActivityTimeline, { ActivityItem } from '@/components/dashboard/ActivityTimeline';
import { ArtistRankingChart } from '@/components/agency/ArtistRankingChart';

import { useAuthStore } from '@/store/useAuthStore';
import { mockCurrentArtistProfile, mockCastings, mockSchedules, mockArtists, mockAgencies } from '@/data/mockData';
import type { Casting, UserRole } from '@shared/types';

interface DashboardConfig {
  welcomeTitle: string;
  stats: Array<{
    icon: React.ReactNode;
    iconGradient: string;
    value: number;
    label: string;
    suffix?: string;
    trend?: { value: number; isPositive: boolean };
    showCircular?: boolean;
    progress?: number;
    progressColor?: string;
  }>;
  quickActions: Array<{
    icon: React.ReactNode;
    iconGradient: string;
    title: string;
    description: string;
    path: string;
  }>;
  activities: ActivityItem[];
  showSchedule?: boolean;
  showCastings?: boolean;
  showTeam?: boolean;
  showRanking?: boolean;
}

const getDashboardConfig = (
  role: UserRole | undefined,
  artistName: string
): DashboardConfig => {
  const baseActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'application',
      icon: <FileText className="w-4 h-4 text-white" />,
      title: '申请状态更新',
      description: '有新的申请进入候选名单',
      time: '2小时前',
      color: '',
    },
    {
      id: '2',
      type: 'view',
      icon: <Eye className="w-4 h-4 text-white" />,
      title: '资料被查看',
      description: '新的企业查看了相关资料',
      time: '5小时前',
      color: '',
    },
    {
      id: '3',
      type: 'message',
      icon: <MessageSquare className="w-4 h-4 text-white" />,
      title: '收到新消息',
      description: '有新的合作邀请消息',
      time: '昨天',
      color: '',
    },
  ];

  switch (role) {
    case 'artist':
      return {
        welcomeTitle: `欢迎回来，${artistName}`,
        stats: [
          {
            icon: <User className="w-5 h-5" />,
            iconGradient: 'from-rose-500 to-rose-400',
            value: 85,
            label: '资料完成度',
            suffix: '%',
            showCircular: true,
            progress: 85,
          },
          {
            icon: <Briefcase className="w-5 h-5" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            value: 7,
            label: '即将到来的试镜',
            suffix: '个',
            trend: { value: 12, isPositive: true },
          },
          {
            icon: <FileImage className="w-5 h-5" />,
            iconGradient: 'from-purple-500 to-purple-400',
            value: 5,
            label: '已创建的模卡',
            suffix: '张',
            progress: 83,
            progressColor: 'bg-gradient-to-r from-purple-500 to-purple-400',
          },
          {
            icon: <Eye className="w-5 h-5" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            value: 1286,
            label: '个人资料浏览量',
            trend: { value: 8, isPositive: true },
          },
        ],
        quickActions: [
          {
            icon: <Edit3 className="w-6 h-6" />,
            iconGradient: 'from-rose-500 to-rose-400',
            title: '编辑资料',
            description: '更新你的个人信息和照片',
            path: '/profile',
          },
          {
            icon: <Calendar className="w-6 h-6" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            title: '查看日程',
            description: '管理你的工作安排和档期',
            path: '/profile/schedule',
          },
          {
            icon: <FileImage className="w-6 h-6" />,
            iconGradient: 'from-purple-500 to-purple-400',
            title: '创建模卡',
            description: '设计专业的模特卡展示自己',
            path: '/model-cards',
          },
          {
            icon: <Search className="w-6 h-6" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            title: '浏览试镜',
            description: '发现最新的模特招募机会',
            path: '/castings',
          },
          {
            icon: <Shield className="w-6 h-6" />,
            iconGradient: 'from-amber-500 to-amber-400',
            title: '数据安全',
            description: '管理你的数据授权和隐私',
            path: '/security',
          },
          {
            icon: <FileText className="w-6 h-6" />,
            iconGradient: 'from-cyan-500 to-cyan-400',
            title: '我的申请',
            description: '跟踪你提交的试镜申请状态',
            path: '/castings',
          },
        ],
        activities: [
          {
            id: '1',
            type: 'application',
            icon: <FileText className="w-4 h-4 text-white" />,
            title: '申请已入选',
            description: '你申请的"2024春夏上海时装周走秀"已进入候选名单',
            time: '2小时前',
            color: '',
          },
          {
            id: '2',
            type: 'view',
            icon: <Eye className="w-4 h-4 text-white" />,
            title: '个人资料被查看',
            description: '星耀模特经纪有限公司查看了你的个人资料',
            time: '5小时前',
            color: '',
          },
          {
            id: '3',
            type: 'message',
            icon: <MessageSquare className="w-4 h-4 text-white" />,
            title: '收到新消息',
            description: '华谊兄弟时尚文化传媒邀请你参加试镜',
            time: '昨天',
            color: '',
          },
          {
            id: '4',
            type: 'casting',
            icon: <Calendar className="w-4 h-4 text-white" />,
            title: '试镜提醒',
            description: '国际奢侈品牌珠宝平面广告拍摄将于后天开始',
            time: '昨天',
            color: '',
          },
          {
            id: '5',
            type: 'profile',
            icon: <UserCheck className="w-4 h-4 text-white" />,
            title: '资料审核通过',
            description: '你更新的个人资料已通过平台审核',
            time: '3天前',
            color: '',
          },
        ],
        showSchedule: true,
        showCastings: true,
      };

    case 'agency_admin':
      return {
        welcomeTitle: '经纪公司管理后台',
        stats: [
          {
            icon: <Users className="w-5 h-5" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            value: 28,
            label: '签约艺人',
            suffix: '位',
            trend: { value: 3, isPositive: true },
          },
          {
            icon: <Briefcase className="w-5 h-5" />,
            iconGradient: 'from-rose-500 to-rose-400',
            value: 12,
            label: '进行中的通告',
            suffix: '个',
          },
          {
            icon: <FileText className="w-5 h-5" />,
            iconGradient: 'from-amber-500 to-amber-400',
            value: 86,
            label: '待处理申请',
            suffix: '份',
            trend: { value: 15, isPositive: true },
          },
          {
            icon: <DollarSign className="w-5 h-5" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            value: 358000,
            label: '本月营收',
            suffix: '元',
            trend: { value: 23, isPositive: true },
          },
        ],
        quickActions: [
          {
            icon: <Users className="w-6 h-6" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            title: '签约艺人管理',
            description: '查看和管理旗下所有艺人',
            path: '/agency/artists',
          },
          {
            icon: <PlusCircle className="w-6 h-6" />,
            iconGradient: 'from-rose-500 to-rose-400',
            title: '发布新通告',
            description: '为客户发布新的模特招募需求',
            path: '/castings/create',
          },
          {
            icon: <Search className="w-6 h-6" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            title: '智能人才搜索',
            description: '根据需求筛选最合适的艺人',
            path: '/search',
          },
          {
            icon: <UserPlus className="w-6 h-6" />,
            iconGradient: 'from-purple-500 to-purple-400',
            title: '添加新艺人',
            description: '录入新签约艺人的资料',
            path: '/agency/artists',
          },
          {
            icon: <Users className="w-6 h-6" />,
            iconGradient: 'from-amber-500 to-amber-400',
            title: '团队管理',
            description: '管理团队成员和权限设置',
            path: '/agency/team',
          },
          {
            icon: <FileText className="w-6 h-6" />,
            iconGradient: 'from-cyan-500 to-cyan-400',
            title: '联系记录',
            description: '查看和归档客户联系记录',
            path: '/agency/contacts',
          },
        ],
        activities: [
          {
            id: '1',
            type: 'application',
            icon: <FileText className="w-4 h-4 text-white" />,
            title: '新申请提交',
            description: '艺人李雨晴申请了"春夏时装周"通告',
            time: '30分钟前',
            color: '',
          },
          {
            id: '2',
            type: 'review',
            icon: <UserCheck className="w-4 h-4 text-white" />,
            title: '艺人资料审核',
            description: '新签约艺人张明的资料已通过审核',
            time: '2小时前',
            color: '',
          },
          {
            id: '3',
            type: 'casting',
            icon: <Briefcase className="w-4 h-4 text-white" />,
            title: '通告发布成功',
            description: '"国际珠宝品牌平面广告"通告已成功发布',
            time: '5小时前',
            color: '',
          },
          {
            id: '4',
            type: 'message',
            icon: <MessageSquare className="w-4 h-4 text-white" />,
            title: '客户咨询',
            description: 'LVMH集团询问艺人王琳的档期',
            time: '昨天',
            color: '',
          },
        ],
        showTeam: true,
        showRanking: true,
      };

    case 'company_hr':
      return {
        welcomeTitle: '企业招聘管理',
        stats: [
          {
            icon: <Briefcase className="w-5 h-5" />,
            iconGradient: 'from-rose-500 to-rose-400',
            value: 8,
            label: '发布的通告',
            suffix: '个',
          },
          {
            icon: <Users className="w-5 h-5" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            value: 256,
            label: '收到的申请',
            suffix: '份',
            trend: { value: 28, isPositive: true },
          },
          {
            icon: <UserCheck className="w-5 h-5" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            value: 42,
            label: '已录用艺人',
            suffix: '位',
          },
          {
            icon: <Search className="w-5 h-5" />,
            iconGradient: 'from-purple-500 to-purple-400',
            value: 1286,
            label: '浏览过的人才',
            suffix: '人',
          },
        ],
        quickActions: [
          {
            icon: <PlusCircle className="w-6 h-6" />,
            iconGradient: 'from-rose-500 to-rose-400',
            title: '发布招聘需求',
            description: '发布新的模特或演员招募信息',
            path: '/castings/create',
          },
          {
            icon: <Database className="w-6 h-6" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            title: '人才库搜索',
            description: '在海量人才中精准筛选',
            path: '/search',
          },
          {
            icon: <FileText className="w-6 h-6" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            title: '申请管理',
            description: '查看和处理收到的申请',
            path: '/castings',
          },
          {
            icon: <Calendar className="w-6 h-6" />,
            iconGradient: 'from-amber-500 to-amber-400',
            title: '面试安排',
            description: '管理试镜和面试日程',
            path: '/castings',
          },
          {
            icon: <Shield className="w-6 h-6" />,
            iconGradient: 'from-purple-500 to-purple-400',
            title: '授权管理',
            description: '管理艺人资料访问授权',
            path: '/security',
          },
          {
            icon: <Settings className="w-6 h-6" />,
            iconGradient: 'from-cyan-500 to-cyan-400',
            title: '企业设置',
            description: '管理企业资料和团队成员',
            path: '/settings',
          },
        ],
        activities: [
          {
            id: '1',
            type: 'application',
            icon: <FileText className="w-4 h-4 text-white" />,
            title: '新申请收到',
            description: '模特陈静怡申请了你发布的"春夏新品发布会"',
            time: '1小时前',
            color: '',
          },
          {
            id: '2',
            type: 'view',
            icon: <Eye className="w-4 h-4 text-white" />,
            title: '艺人资料已查看',
            description: '你查看了艺人林小雨的详细资料',
            time: '3小时前',
            color: '',
          },
          {
            id: '3',
            type: 'casting',
            icon: <Briefcase className="w-4 h-4 text-white" />,
            title: '通告已截止',
            description: '"夏季护肤品广告"申请通道已关闭',
            time: '昨天',
            color: '',
          },
        ],
        showCastings: true,
      };

    case 'admin':
    case 'platform':
    case 'ops':
      return {
        welcomeTitle: '系统管理后台',
        stats: [
          {
            icon: <Users className="w-5 h-5" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            value: 12586,
            label: '平台用户总数',
            suffix: '人',
            trend: { value: 156, isPositive: true },
          },
          {
            icon: <Briefcase className="w-5 h-5" />,
            iconGradient: 'from-rose-500 to-rose-400',
            value: 328,
            label: '活跃通告数',
            suffix: '个',
            trend: { value: 42, isPositive: true },
          },
          {
            icon: <Database className="w-5 h-5" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            value: 8956,
            label: '艺人档案数',
            suffix: '份',
          },
          {
            icon: <LineChart className="w-5 h-5" />,
            iconGradient: 'from-amber-500 to-amber-400',
            value: 99.8,
            label: '系统可用率',
            suffix: '%',
            showCircular: true,
            progress: 99.8,
          },
        ],
        quickActions: [
          {
            icon: <Shield className="w-6 h-6" />,
            iconGradient: 'from-rose-500 to-rose-400',
            title: '用户审核',
            description: '审核新注册用户和企业资质',
            path: '/search',
          },
          {
            icon: <Database className="w-6 h-6" />,
            iconGradient: 'from-sapphire-500 to-sapphire-400',
            title: '数据管理',
            description: '管理平台数据和内容审核',
            path: '/artists',
          },
          {
            icon: <FileText className="w-6 h-6" />,
            iconGradient: 'from-emerald-500 to-emerald-400',
            title: '操作日志',
            description: '查看系统操作审计记录',
            path: '/security/logs',
          },
          {
            icon: <LineChart className="w-6 h-6" />,
            iconGradient: 'from-purple-500 to-purple-400',
            title: '数据统计',
            description: '查看平台运营数据和报表',
            path: '/agency',
          },
          {
            icon: <Users className="w-6 h-6" />,
            iconGradient: 'from-amber-500 to-amber-400',
            title: '机构管理',
            description: '管理平台签约机构',
            path: '/agency',
          },
          {
            icon: <Settings className="w-6 h-6" />,
            iconGradient: 'from-cyan-500 to-cyan-400',
            title: '系统设置',
            description: '配置系统参数和功能开关',
            path: '/settings',
          },
        ],
        activities: [
          {
            id: '1',
            type: 'review',
            icon: <Shield className="w-4 h-4 text-white" />,
            title: '新企业待审核',
            description: '风尚国际文化传媒提交了企业认证申请',
            time: '15分钟前',
            color: '',
          },
          {
            id: '2',
            type: 'review',
            icon: <UserCheck className="w-4 h-4 text-white" />,
            title: '艺人资料审核',
            description: '艺人王晓明更新的照片已通过审核',
            time: '1小时前',
            color: '',
          },
          {
            id: '3',
            type: 'view',
            icon: <Eye className="w-4 h-4 text-white" />,
            title: '违规内容处理',
            description: '系统自动检测到3条需要人工审核的内容',
            time: '2小时前',
            color: '',
          },
          {
            id: '4',
            type: 'message',
            icon: <MessageSquare className="w-4 h-4 text-white" />,
            title: '用户投诉',
            description: '收到1条用户投诉需要处理',
            time: '昨天',
            color: '',
          },
        ],
        showRanking: true,
        showTeam: true,
      };

    default:
      return {
        welcomeTitle: '欢迎使用 TalentHub',
        stats: [],
        quickActions: [],
        activities: baseActivities,
      };
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, artistProfile } = useAuthStore();

  const currentDate = useMemo(() => {
    return format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
  }, []);

  const displayName = useMemo(() => {
    if (user?.role === 'artist' && artistProfile?.stageName) {
      return artistProfile.stageName;
    }
    if (user?.role === 'agency_admin') {
      return '管理员';
    }
    if (user?.role === 'company_hr') {
      return 'HR';
    }
    if (user?.role === 'admin') {
      return '系统管理员';
    }
    return user?.email?.split('@')[0] || '用户';
  }, [user, artistProfile]);

  const config = useMemo(() => {
    return getDashboardConfig(user?.role, displayName);
  }, [user?.role, displayName]);

  const recommendedCastings: Casting[] = useMemo(() => {
    return mockCastings.filter((c) => c.status === 'published').slice(0, 6);
  }, []);

  const roleBadge = useMemo(() => {
    const badges: Record<string, { variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'default'; label: string }> = {
      artist: { variant: 'primary', label: '艺人/模特' },
      agency_admin: { variant: 'success', label: '经纪公司' },
      company_hr: { variant: 'secondary', label: '企业HR' },
      admin: { variant: 'danger', label: '系统管理员' },
    };
    return user?.role ? badges[user.role] : null;
  }, [user?.role]);

  const getImageUrl = (prompt: string): string => {
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
  };

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  <span className="text-gradient">{config.welcomeTitle}</span>
                </h1>
                {roleBadge && (
                  <Badge variant={roleBadge.variant} size="md">
                    {roleBadge.label}
                  </Badge>
                )}
              </div>
              <p className="text-midnight-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {currentDate}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" leftIcon={<Calendar className="w-4 h-4" />}>
                今日日程
              </Button>
              <Button leftIcon={<Search className="w-4 h-4" />}>
                发现机会
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Grid */}
        {config.stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {config.stats.map((stat, index) => (
              <div
                key={stat.label}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <StatCard
                  icon={stat.icon}
                  iconGradient={stat.iconGradient}
                  value={stat.value}
                  label={stat.label}
                  suffix={stat.suffix}
                  trend={stat.trend}
                  showCircular={stat.showCircular}
                  progress={stat.progress}
                  progressColor={stat.progressColor}
                />
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        {config.quickActions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 animate-fade-in">快捷操作</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {config.quickActions.map((action, index) => (
                <div
                  key={action.title}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <QuickActionCard
                    icon={action.icon}
                    iconGradient={action.iconGradient}
                    title={action.title}
                    description={action.description}
                    onClick={() => handleActionClick(action.path)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" />
                  最近动态
                </CardTitle>
                <CardDescription>查看你的最新活动和通知</CardDescription>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                查看全部
              </Button>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={config.activities} />
            </CardContent>
          </Card>

          {/* Conditional Right Column */}
          {config.showSchedule && (
            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sapphire-500" />
                    即将到来的日程
                  </CardTitle>
                  <CardDescription>你最近的工作安排</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => navigate('/profile/schedule')}
                >
                  完整日程
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSchedules
                    .filter((s) => s.status === 'booked' || s.status === 'pending')
                    .slice(0, 4)
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 hover:border-rose-500/30 transition-all duration-300"
                      >
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-r from-sapphire-500 to-sapphire-400 flex flex-col items-center justify-center">
                          <span className="text-xs text-white/80">
                            {format(new Date(schedule.date), 'MM月', { locale: zhCN })}
                          </span>
                          <span className="text-lg font-bold text-white">
                            {format(new Date(schedule.date), 'dd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{schedule.description}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                schedule.status === 'booked'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {schedule.status === 'booked' ? '已确认' : '待确认'}
                            </span>
                            <MapPin className="w-3 h-3 text-midnight-400" />
                            <span className="text-xs text-midnight-400">上海市</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {config.showTeam && !config.showSchedule && (
            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    团队成员
                  </CardTitle>
                  <CardDescription>你的团队最近活动</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => navigate('/agency/team')}
                >
                  管理团队
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAgencies[0]?.name && (
                    <div className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700/50 mb-4">
                      <h4 className="font-semibold text-white mb-1">{mockAgencies[0].name}</h4>
                      <p className="text-sm text-midnight-400">{mockAgencies[0].address}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="success" size="sm" dot>已认证</Badge>
                        <span className="text-sm text-midnight-400">联系人：{mockAgencies[0].contactPerson}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {mockArtists.slice(0, 5).map((artist, i) => (
                        <div
                          key={artist.id}
                          className="w-10 h-10 rounded-full border-2 border-midnight-900 overflow-hidden"
                          style={{ zIndex: 5 - i }}
                        >
                          <img
                            src={artist.mediaAssets[0]?.url}
                            alt={artist.stageName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-midnight-900 bg-midnight-800 flex items-center justify-center text-xs text-midnight-400">
                        +24
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">28 位签约艺人</p>
                      <p className="text-xs text-midnight-400">12 位团队成员</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {config.showRanking && (
            <Card variant="glass" className="animate-fade-in-up lg:col-span-2" style={{ animationDelay: '400ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                    艺人接单排行
                  </CardTitle>
                  <CardDescription>本月接单量最高的艺人</CardDescription>
                </div>
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  查看完整排行
                </Button>
              </CardHeader>
              <CardContent>
                <ArtistRankingChart />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommended Castings */}
        {config.showCastings && (
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-rose-500" />
                  为你推荐的试镜
                </h2>
                <p className="text-midnight-300 text-sm">根据你的资料和偏好精选的机会</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => navigate('/castings')}
              >
                查看更多
              </Button>
            </div>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {recommendedCastings.map((casting) => (
                  <Card
                    key={casting.id}
                    variant="glass"
                    hoverable
                    className="flex-shrink-0 w-80 snap-start cursor-pointer"
                    onClick={() => navigate(`/castings/${casting.id}`)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={getImageUrl(`fashion casting ${casting.category} professional model photoshoot`)}
                        alt={casting.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full bg-rose-500/90 text-white text-xs font-medium">
                          {casting.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {casting.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-midnight-300 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {casting.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(casting.startDate), 'MM/dd')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 font-semibold">
                          ¥{casting.budgetMin.toLocaleString()} - ¥{casting.budgetMax.toLocaleString()}
                        </span>
                        <Button variant="primary" size="sm">
                          查看详情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
