import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import { Card, Badge, MatchScore, Button } from '@/components/ui';
import {
  Calendar,
  Users,
  Briefcase,
  UserCheck,
  Plus,
  Eye,
  MessageSquare,
  Download,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { mockMatchResults, mockInterviewInvites, mockRecruitmentMetrics } from '@shared/mock/data';
import type { MatchResult, InterviewInvite } from '@shared/types';
import { cn } from '@/lib/utils';

const useCountUp = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

const StatCard = ({ title, value, icon, gradient, delay = 0 }: StatCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const count = useCountUp(isVisible ? value : 0, 1500);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      padding="lg"
      className={cn(
        'relative overflow-hidden group hover:scale-[1.02] transition-all duration-500',
        gradient
      )}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <p className="text-white text-4xl font-serif font-bold mt-2">
              {count}
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-white/60 text-xs">较昨日</span>
          <Badge variant="success" size="sm" className="bg-white/20 text-white border-white/30">
            +12%
          </Badge>
        </div>
      </div>
    </Card>
  );
};

const RecommendationCard = ({ match }: { match: MatchResult }) => {
  const talent = match.talent;
  if (!talent) return null;

  return (
    <Card
      hoverable
      padding="md"
      className="mb-3 last:mb-0 group"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={talent.avatar}
            alt={talent.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-100 group-hover:ring-mint-300 transition-all duration-300"
          />
          <div className="absolute -bottom-1 -right-1">
            <MatchScore score={Math.round(match.overallScore)} size="sm" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-primary-800 truncate">{talent.name}</h4>
            <Badge variant="info" size="sm">{talent.experienceYears}年经验</Badge>
          </div>
          <p className="text-sm text-neutral-500 truncate mb-2">
            {match.job?.title || '匹配岗位'}
          </p>
          <div className="flex flex-wrap gap-1">
            {talent.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-mint-50 text-mint-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="flex-shrink-0">
          <Eye size={16} />
          查看
        </Button>
      </div>
    </Card>
  );
};

const InterviewTimelineItem = ({ interview, index }: { interview: InterviewInvite; index: number }) => {
  const talent = mockMatchResults.find(m => m.talentId === interview.talentId)?.talent;
  const time = new Date(interview.interviewTime);
  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const statusConfig = {
    pending: { label: '待确认', variant: 'warning' as const },
    accepted: { label: '已接受', variant: 'success' as const },
    rejected: { label: '已拒绝', variant: 'danger' as const },
    completed: { label: '已完成', variant: 'info' as const },
    no_show: { label: '未到场', variant: 'danger' as const },
  };

  const config = statusConfig[interview.status];

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {index < mockInterviewInvites.length - 1 && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 to-transparent" />
      )}
      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-mint-400 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
      <Card padding="sm" className="hover:shadow-card-hover transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {talent && (
              <img
                src={talent.avatar}
                alt={talent.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-primary-800">
                  {talent?.name || '候选人'}
                </h4>
                <Badge variant={config.variant} size="sm">{config.label}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {timeStr}
                </span>
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin size={14} />
                  {interview.location.split('，')[0]}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <ChevronRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
}

const QuickAction = ({ title, description, icon, gradient, onClick }: QuickActionProps) => (
  <Card
    hoverable
    padding="lg"
    className="group cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      <div className={cn(
        'p-4 rounded-2xl transition-all duration-300 group-hover:scale-110',
        gradient
      )}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-primary-800 group-hover:text-primary-600 transition-colors">
          {title}
        </h4>
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      </div>
      <ChevronRight className="text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" size={20} />
    </div>
  </Card>
);

export default function DashboardHome() {
  const stats = [
    {
      title: '待处理面试',
      value: 5,
      icon: <Calendar className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-primary-500 to-primary-700',
      delay: 0,
    },
    {
      title: '今日新增候选人',
      value: 12,
      icon: <Users className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-mint-400 to-mint-600',
      delay: 150,
    },
    {
      title: '进行中的岗位',
      value: 8,
      icon: <Briefcase className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-accent-400 to-accent-600',
      delay: 300,
    },
    {
      title: '本月入职人数',
      value: 3,
      icon: <UserCheck className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-primary-400 to-mint-500',
      delay: 450,
    },
  ];

  const quickActions = [
    {
      title: '发布职位',
      description: '使用AI智能生成职位描述',
      icon: <Plus className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-primary-500 to-primary-600',
    },
    {
      title: '查看候选池',
      description: '浏览所有匹配的候选人',
      icon: <Eye className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-mint-400 to-mint-500',
    },
    {
      title: '发起面试',
      description: '向候选人发送面试邀请',
      icon: <MessageSquare className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-accent-400 to-accent-500',
    },
    {
      title: '导出报表',
      description: '生成招聘数据分析报告',
      icon: <Download className="text-white" size={24} />,
      gradient: 'bg-gradient-to-br from-primary-400 to-mint-400',
    },
  ];

  const recommendations = mockMatchResults.slice(0, 4);
  const interviews = mockInterviewInvites.slice().sort((a, b) =>
    new Date(a.interviewTime).getTime() - new Date(b.interviewTime).getTime()
  );

  return (
    <PageLayout title="工作台" subtitle="今日招聘数据概览">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card
            padding="lg"
            className="lg:col-span-3"
            header={
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-primary-800">今日推荐</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">为您精选的高匹配度候选人</p>
                </div>
                <Button variant="ghost" size="sm">
                  查看全部
                  <ChevronRight size={16} />
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {recommendations.map((match) => (
                <RecommendationCard key={`${match.jobId}-${match.talentId}`} match={match} />
              ))}
            </div>
          </Card>

          <Card
            padding="lg"
            className="lg:col-span-2"
            header={
              <div>
                <h3 className="font-serif text-lg font-bold text-primary-800">即将面试</h3>
                <p className="text-sm text-neutral-500 mt-0.5">近期的面试安排时间表</p>
              </div>
            }
          >
            <div className="mt-2">
              {interviews.map((interview, idx) => (
                <InterviewTimelineItem key={interview.id} interview={interview} index={idx} />
              ))}
            </div>
          </Card>
        </div>

        <Card
          padding="lg"
          header={
            <div>
              <h3 className="font-serif text-lg font-bold text-primary-800">快捷操作</h3>
              <p className="text-sm text-neutral-500 mt-0.5">快速访问常用招聘功能</p>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, idx) => (
              <QuickAction key={idx} {...action} />
            ))}
          </div>
        </Card>

        <Card
          padding="lg"
          header={
            <div>
              <h3 className="font-serif text-lg font-bold text-primary-800">招聘数据概览</h3>
              <p className="text-sm text-neutral-500 mt-0.5">本月招聘关键指标</p>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-3xl font-serif font-bold text-primary-600">{mockRecruitmentMetrics.avgFillDays}</p>
              <p className="text-sm text-neutral-500 mt-1">平均到岗天数</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-3xl font-serif font-bold text-mint-500">{mockRecruitmentMetrics.retentionRate}%</p>
              <p className="text-sm text-neutral-500 mt-1">员工留存率</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-3xl font-serif font-bold text-accent-500">¥{mockRecruitmentMetrics.costPerHire}</p>
              <p className="text-sm text-neutral-500 mt-1">人均招聘成本</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-3xl font-serif font-bold text-primary-500">
                {mockRecruitmentMetrics.channelFunnel.reduce((acc, c) => acc + c.hires, 0)}
              </p>
              <p className="text-sm text-neutral-500 mt-1">本月累计入职</p>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
