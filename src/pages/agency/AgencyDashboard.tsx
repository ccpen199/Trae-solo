import React, { useMemo } from 'react';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Plus,
  UserPlus,
  UserCog,
  Clock,
  ChevronRight,
  FileText as FileTextIcon,
  Eye,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AgencyStatCard from '@/components/agency/StatCard';
import ArtistRankingChart from '@/components/agency/ArtistRankingChart';
import ActivityTimeline, { ActivityItem } from '@/components/dashboard/ActivityTimeline';

import { useAgencyStore } from '@/store/useAgencyStore';

const AgencyDashboard: React.FC = () => {
  const { stats, applicationTrend, artistRankings } = useAgencyStore();

  const currentDate = useMemo(() => {
    return format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
  }, []);

  const chartData = useMemo(() => {
    return applicationTrend.map((item) => ({
      ...item,
      displayDate: format(new Date(item.date), 'MM/dd'),
    }));
  }, [applicationTrend]);

  const quickActions = useMemo(
    () => [
      {
        icon: <Plus className="w-6 h-6" />,
        iconGradient: 'from-rose-500 to-rose-400',
        title: '发布选角',
        description: '创建新的模特招募启事',
        onClick: () => console.log('Publish Casting'),
      },
      {
        icon: <UserPlus className="w-6 h-6" />,
        iconGradient: 'from-sapphire-500 to-sapphire-400',
        title: '添加艺人',
        description: '将新艺人签约至经纪公司',
        onClick: () => console.log('Add Artist'),
      },
      {
        icon: <UserCog className="w-6 h-6" />,
        iconGradient: 'from-emerald-500 to-emerald-400',
        title: '邀请团队成员',
        description: '发送邀请邮件给团队成员',
        onClick: () => console.log('Invite Team Member'),
      },
    ],
    []
  );

  const activities: ActivityItem[] = useMemo(
    () => [
      {
        id: '1',
        type: 'application',
        icon: <FileTextIcon className="w-4 h-4 text-white" />,
        title: '新申请待处理',
        description: '林雨婷申请了"2024春夏上海时装周走秀"',
        time: '1小时前',
        color: '',
      },
      {
        id: '2',
        type: 'view',
        icon: <Eye className="w-4 h-4 text-white" />,
        title: '艺人资料被查看',
        description: '华谊兄弟时尚查看了刘美娜的个人资料',
        time: '3小时前',
        color: '',
      },
      {
        id: '3',
        type: 'message',
        icon: <MessageSquare className="w-4 h-4 text-white" />,
        title: '收到合作咨询',
        description: '某奢侈品牌询问周雅琪珠宝代言合作',
        time: '5小时前',
        color: '',
      },
      {
        id: '4',
        type: 'casting',
        icon: <Calendar className="w-4 h-4 text-white" />,
        title: '试镜即将开始',
        description: '陈浩然的运动品牌代言人试镜明天开始',
        time: '昨天',
        color: '',
      },
      {
        id: '5',
        type: 'profile',
        icon: <UserCheck className="w-4 h-4 text-white" />,
        title: '新艺人签约',
        description: '王思琪已完成签约流程，正式加入公司',
        time: '2天前',
        color: '',
      },
    ],
    []
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-midnight-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-xl">
          <p className="text-sm text-midnight-300 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                经纪公司管理后台
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
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                发布选角
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <AgencyStatCard
              icon={<Users className="w-5 h-5" />}
              iconGradient="from-rose-500 to-rose-400"
              value={stats.totalArtists}
              label="签约艺人总数"
              suffix="人"
              trend={{ value: 12, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <AgencyStatCard
              icon={<Calendar className="w-5 h-5" />}
              iconGradient="from-sapphire-500 to-sapphire-400"
              value={stats.activeCastings}
              label="进行中的选角"
              suffix="个"
              trend={{ value: 5, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <AgencyStatCard
              icon={<FileText className="w-5 h-5" />}
              iconGradient="from-emerald-500 to-emerald-400"
              value={stats.pendingApplications}
              label="待处理申请"
              suffix="份"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <AgencyStatCard
              icon={<DollarSign className="w-5 h-5" />}
              iconGradient="from-amber-500 to-amber-400"
              value={stats.monthlyRevenue}
              label="本月营收"
              prefix="¥"
              trend={{ value: 15, isPositive: true }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 animate-fade-in">快捷操作</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {quickActions.map((action, index) => (
              <div
                key={action.title}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card variant="glass" hoverable className="p-5 h-full" onClick={action.onClick}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-r ${action.iconGradient} shadow-lg`}>
                      <span className="text-white">{action.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                      <p className="text-sm text-midnight-300">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-midnight-500" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card variant="glass" className="lg:col-span-2 animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5 text-rose-500" />
                  申请趋势
                </CardTitle>
                <CardDescription>最近30天申请与录用数据</CardDescription>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                详细报告
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value: string) => (
                        <span className="text-sm text-midnight-300">{value}</span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      name="申请数量"
                      stroke="#e94560"
                      strokeWidth={3}
                      dot={{ fill: '#e94560', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#e94560', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hires"
                      name="录用数量"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" />
                  最近动态
                </CardTitle>
                <CardDescription>经纪公司最新活动</CardDescription>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                查看全部
              </Button>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <ArtistRankingChart data={artistRankings} />
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;
