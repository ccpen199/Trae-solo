import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StatCard from '@/components/dashboard/StatCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import ActivityTimeline, { ActivityItem } from '@/components/dashboard/ActivityTimeline';

import { mockCurrentArtistProfile, mockCastings, mockSchedules } from '@/data/mockData';
import type { Casting } from '@shared/types';

const Dashboard: React.FC = () => {
  const currentDate = useMemo(() => {
    return format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
  }, []);

  const upcomingCastings = useMemo(() => {
    const today = new Date();
    return mockCastings.filter(
      (c) => c.status === 'published' && new Date(c.startDate) > today
    ).length;
  }, []);

  const modelCardsCount = useMemo(() => {
    return 5;
  }, []);

  const profileViews = useMemo(() => {
    return 1286;
  }, []);

  const profileCompletion = useMemo(() => {
    const profile = mockCurrentArtistProfile;
    let completed = 0;
    let total = 0;

    if (profile.realName) completed++; total++;
    if (profile.stageName) completed++; total++;
    if (profile.age) completed++; total++;
    if (profile.height) completed++; total++;
    if (profile.weight) completed++; total++;
    if (profile.mediaAssets && profile.mediaAssets.length > 0) completed++; total++;
    if (profile.skills && profile.skills.length > 0) completed++; total++;
    if (profile.languages && profile.languages.length > 0) completed++; total++;
    if (profile.location) completed++; total++;

    return Math.round((completed / total) * 100);
  }, []);

  const quickActions = useMemo(
    () => [
      {
        icon: <Edit3 className="w-6 h-6" />,
        iconGradient: 'from-rose-500 to-rose-400',
        title: '编辑资料',
        description: '更新你的个人信息和照片',
        onClick: () => console.log('Edit Profile'),
      },
      {
        icon: <Calendar className="w-6 h-6" />,
        iconGradient: 'from-sapphire-500 to-sapphire-400',
        title: '查看日程',
        description: '管理你的工作安排和档期',
        onClick: () => console.log('View Schedule'),
      },
      {
        icon: <FileImage className="w-6 h-6" />,
        iconGradient: 'from-purple-500 to-purple-400',
        title: '创建模卡',
        description: '设计专业的模特卡展示自己',
        onClick: () => console.log('Create Model Card'),
      },
      {
        icon: <Search className="w-6 h-6" />,
        iconGradient: 'from-emerald-500 to-emerald-400',
        title: '浏览试镜',
        description: '发现最新的模特招募机会',
        onClick: () => console.log('Browse Castings'),
      },
      {
        icon: <Users className="w-6 h-6" />,
        iconGradient: 'from-amber-500 to-amber-400',
        title: '搜索人才',
        description: '寻找合适的模特合作伙伴',
        onClick: () => console.log('Search Talent'),
      },
      {
        icon: <FileText className="w-6 h-6" />,
        iconGradient: 'from-cyan-500 to-cyan-400',
        title: '查看申请',
        description: '跟踪你提交的试镜申请状态',
        onClick: () => console.log('View Applications'),
      },
    ],
    []
  );

  const activities: ActivityItem[] = useMemo(
    () => [
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
    []
  );

  const recommendedCastings: Casting[] = useMemo(() => {
    return mockCastings.filter((c) => c.status === 'published').slice(0, 6);
  }, []);

  const getImageUrl = (prompt: string): string => {
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                欢迎回来，{' '}
                <span className="text-gradient">{mockCurrentArtistProfile.stageName}</span>
              </h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <StatCard
              icon={<User className="w-5 h-5" />}
              iconGradient="from-rose-500 to-rose-400"
              value={profileCompletion}
              label="资料完成度"
              suffix="%"
              showCircular
              progress={profileCompletion}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <StatCard
              icon={<Briefcase className="w-5 h-5" />}
              iconGradient="from-sapphire-500 to-sapphire-400"
              value={upcomingCastings}
              label="即将到来的试镜"
              suffix="个"
              trend={{ value: 12, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <StatCard
              icon={<FileImage className="w-5 h-5" />}
              iconGradient="from-purple-500 to-purple-400"
              value={modelCardsCount}
              label="已创建的模卡"
              suffix="张"
              progress={83}
              progressColor="bg-gradient-to-r from-purple-500 to-purple-400"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <StatCard
              icon={<Eye className="w-5 h-5" />}
              iconGradient="from-emerald-500 to-emerald-400"
              value={profileViews}
              label="个人资料浏览量"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 animate-fade-in">快捷操作</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {quickActions.map((action, index) => (
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
                  onClick={action.onClick}
                />
              </div>
            ))}
          </div>
        </div>

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
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>

          {/* Upcoming Schedule Preview */}
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sapphire-500" />
                  即将到来的日程
                </CardTitle>
                <CardDescription>你最近的工作安排</CardDescription>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
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
        </div>

        {/* Recommended Castings */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-rose-500" />
                为你推荐的试镜
              </h2>
              <p className="text-midnight-300 text-sm">根据你的资料和偏好精选的机会</p>
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
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
                  className="flex-shrink-0 w-80 snap-start"
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
                        申请
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
