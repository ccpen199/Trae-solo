import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  FileCheck,
  Target,
  Calendar,
  Phone,
  Mail,
  Video,
  MessageSquare,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bell,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { hrApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  new: '#8B5CF6',
  contacted: '#3A5FA8',
  screening: '#10B981',
  interview: '#F59E0B',
  offer: '#EF4444',
  archived: '#64748B',
};

const STATUS_LABELS: Record<string, string> = {
  new: '新入库',
  contacted: '已联系',
  screening: '初筛中',
  interview: '面试中',
  offer: '发Offer',
  archived: '已归档',
};

const FOLLOW_UP_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  interview: Video,
  'check-in': MessageSquare,
};

const FOLLOW_UP_TYPE_LABEL: Record<string, string> = {
  call: '电话沟通',
  email: '邮件跟进',
  interview: '面试安排',
  'check-in': '日常回访',
};

interface DashboardData {
  welcomeName: string;
  todayFollowUps: number;
  newMatchedTalents: number;
  warningJobs: number;
  kpis: {
    totalTalents: number;
    totalTalentsTrend: number[];
    avgCycleDays: number;
    avgCycleTrend: number[];
    monthlyOffers: number;
    offersTrend: number[];
    matchSuccessRate: number;
    matchRateTrend: number[];
  };
  statusDistribution: { status: string; count: number }[];
  recruitmentFunnel: { stage: string; count: number }[];
  todaySchedule: {
    id: string;
    time: string;
    talentName: string;
    type: 'call' | 'email' | 'interview' | 'check-in';
    status: 'pending' | 'completed' | 'overdue';
  }[];
  topActiveJobs: {
    id: string;
    title: string;
    hiringCount: number;
    matchedCount: number;
    avgCycleDays: number;
  }[];
}

const mockDashboardData: DashboardData = {
  welcomeName: '李经理',
  todayFollowUps: 5,
  newMatchedTalents: 12,
  warningJobs: 3,
  kpis: {
    totalTalents: 328,
    totalTalentsTrend: [280, 290, 295, 305, 310, 318, 328],
    avgCycleDays: 23,
    avgCycleTrend: [30, 29, 28, 27, 26, 25, 23],
    monthlyOffers: 18,
    offersTrend: [10, 11, 12, 13, 14, 16, 18],
    matchSuccessRate: 82,
    matchRateTrend: [70, 72, 74, 76, 78, 80, 82],
  },
  statusDistribution: [
    { status: 'new', count: 68 },
    { status: 'contacted', count: 52 },
    { status: 'screening', count: 48 },
    { status: 'interview', count: 37 },
    { status: 'offer', count: 18 },
    { status: 'archived', count: 105 },
  ],
  recruitmentFunnel: [
    { stage: '人才池', count: 328 },
    { stage: '初筛', count: 156 },
    { stage: '技术面', count: 89 },
    { stage: '终面', count: 37 },
    { stage: 'Offer', count: 18 },
    { stage: '入职', count: 12 },
  ],
  todaySchedule: [
    { id: '1', time: '09:30', talentName: '张伟', type: 'call', status: 'pending' },
    { id: '2', time: '10:30', talentName: '李娜', type: 'interview', status: 'pending' },
    { id: '3', time: '14:00', talentName: '王磊', type: 'email', status: 'overdue' },
    { id: '4', time: '15:30', talentName: '赵敏', type: 'check-in', status: 'completed' },
    { id: '5', time: '16:30', talentName: '孙强', type: 'call', status: 'pending' },
  ],
  topActiveJobs: [
    { id: '1', title: '高级前端工程师', hiringCount: 5, matchedCount: 23, avgCycleDays: 18 },
    { id: '2', title: '资深产品经理', hiringCount: 3, matchedCount: 18, avgCycleDays: 25 },
    { id: '3', title: '后端开发工程师', hiringCount: 8, matchedCount: 42, avgCycleDays: 22 },
    { id: '4', title: '数据分析师', hiringCount: 2, matchedCount: 15, avgCycleDays: 15 },
    { id: '5', title: 'UI/UX设计师', hiringCount: 4, matchedCount: 28, avgCycleDays: 20 },
  ],
};

const SparklineMiniChart: React.FC<{
  data: number[];
  color: string;
}> = ({ data, color }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            fill={color}
            fillOpacity={0.1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const KPICard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  trendLabel: string;
  isUpward: boolean;
  trendData: number[];
  gradient: string;
  iconBg: string;
}> = ({ title, value, unit, icon: Icon, trendLabel, isUpward, trendData, gradient, iconBg }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="gradient" hoverable className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', iconBg)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-slate-500 mb-1">{title}</p>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-3xl font-heading font-bold', gradient)}>
                  {value}
                </span>
                {unit && <span className="text-sm text-slate-500">{unit}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <SparklineMiniChart
                data={trendData}
                color={isUpward ? '#10B981' : '#EF4444'}
              />
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full',
                isUpward
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              )}>
                {isUpward ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendLabel}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const HRDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>(mockDashboardData);

  useEffect(() => {
    const loadData = async () => {
      try {
        await hrApi.getHrDashboardStats();
        setData(mockDashboardData);
      } catch {
        setData(mockDashboardData);
      }
    };
    loadData();
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚上好';

  const customTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 text-sm">
          <p className="font-medium text-slate-800">{payload[0].name}</p>
          <p className="text-slate-600 mt-1">
            {STATUS_LABELS[payload[0].name] || payload[0].name}: {payload[0].value}人
          </p>
        </div>
      );
    }
    return null;
  };

  const funnelTooltip = ({ active, payload }: { active?: boolean; payload?: { payload?: { stage: string }; name: string; value: number }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 text-sm">
          <p className="font-medium text-slate-800">{payload[0].payload?.stage || payload[0].name}</p>
          <p className="text-slate-600 mt-1">{payload[0].value}人</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-6 min-h-screen"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold gradient-text">
            {greeting}，{data.welcomeName} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            今天是{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-lavender-50 via-space-indigo-50 to-emerald-50 border border-white/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-space-indigo-500" />
              <span className="text-sm">
                今日待跟进：<span className="font-bold text-space-indigo-700">{data.todayFollowUps}</span>人
              </span>
            </div>
            <div className="w-px h-5 bg-slate-300" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lavender-500" />
              <span className="text-sm">
                新增匹配：<span className="font-bold text-lavender-700">{data.newMatchedTalents}</span>人
              </span>
            </div>
            <div className="w-px h-5 bg-slate-300" />
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-gold-500" />
              <span className="text-sm">
                预警岗位：<span className="font-bold text-amber-gold-700">{data.warningJobs}</span>个
              </span>
            </div>
          </div>
          <Button variant="primary" size="md">
            <Sparkles className="w-4 h-4" />
            智能推荐
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-6">
        <KPICard
          title="人才池总人数"
          value={data.kpis.totalTalents}
          unit="人"
          icon={Users}
          trendLabel="+12% 环比"
          isUpward={true}
          trendData={data.kpis.totalTalentsTrend}
          gradient="bg-gradient-to-r from-space-indigo-600 to-lavender-600 bg-clip-text text-transparent"
          iconBg="bg-gradient-to-br from-space-indigo-500 to-space-indigo-600"
        />
        <KPICard
          title="平均招聘周期"
          value={data.kpis.avgCycleDays}
          unit="天"
          icon={Clock}
          trendLabel="-3天 下降"
          isUpward={false}
          trendData={data.kpis.avgCycleTrend}
          gradient="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent"
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <KPICard
          title="本月Offer数量"
          value={data.kpis.monthlyOffers}
          unit="份"
          icon={FileCheck}
          trendLabel="+5 上升"
          isUpward={true}
          trendData={data.kpis.offersTrend}
          gradient="bg-gradient-to-r from-lavender-600 to-amber-gold-500 bg-clip-text text-transparent"
          iconBg="bg-gradient-to-br from-lavender-500 to-lavender-600"
        />
        <KPICard
          title="人岗匹配成功率"
          value={data.kpis.matchSuccessRate}
          unit="%"
          icon={Target}
          trendLabel="+4% 上升"
          isUpward={true}
          trendData={data.kpis.matchRateTrend}
          gradient="bg-gradient-to-r from-amber-gold-600 to-amber-gold-500 bg-clip-text text-transparent"
          iconBg="bg-gradient-to-br from-amber-gold-500 to-amber-gold-600"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
        <Card variant="glass" className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>人才跟进状态分布</CardTitle>
                <CardDescription>实时掌握各阶段人才流转情况</CardDescription>
              </div>
              <Badge variant="indigo">共 {data.statusDistribution.reduce((s, i) => s + i.count, 0)} 人</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="w-64 h-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                    >
                      {data.statusDistribution.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={customTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {data.statusDistribution.map((item) => {
                  const total = data.statusDistribution.reduce((s, i) => s + i.count, 0);
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div
                      key={item.status}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-slate-200/60 hover:bg-white/80 transition-colors"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {STATUS_LABELS[item.status]}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: STATUS_COLORS[item.status],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>招聘漏斗</CardTitle>
            <CardDescription>人才转化全链路分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.recruitmentFunnel}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    width={60}
                  />
                  <Tooltip content={funnelTooltip} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    fill="url(#funnelGradient)"
                    barSize={24}
                  />
                  <defs>
                    <linearGradient id="funnelGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3A5FA8" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                <div className="text-xs text-emerald-600 font-medium">总转化率</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {Math.round((data.recruitmentFunnel[5].count / data.recruitmentFunnel[0].count) * 100)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-lavender-50/60 border border-lavender-200/60">
                <div className="text-xs text-lavender-600 font-medium">Offer→入职</div>
                <div className="text-xl font-bold text-lavender-700 mt-1">
                  {Math.round((data.recruitmentFunnel[5].count / data.recruitmentFunnel[4].count) * 100)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-5 gap-6">
        <Card variant="glass" className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>今日跟进日程</CardTitle>
                <CardDescription>高效安排每日候选人沟通</CardDescription>
              </div>
              <Badge variant="purple" withDot>
                {data.todaySchedule.filter((s) => s.status === 'pending').length} 待完成
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.todaySchedule.map((item) => {
                const TypeIcon = FOLLOW_UP_TYPE_ICON[item.type];
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      item.status === 'completed'
                        ? 'bg-slate-50/50 border-slate-200/60 opacity-60'
                        : item.status === 'overdue'
                        ? 'bg-red-50/40 border-red-200/60'
                        : 'bg-white/70 border-slate-200/60 hover:border-space-indigo-200 hover:shadow-sm'
                    )}
                  >
                    <div className="text-center shrink-0 w-14">
                      <div className={cn(
                        'text-lg font-heading font-bold',
                        item.status === 'overdue' ? 'text-red-600' : 'text-space-indigo-600'
                      )}>
                        {item.time}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">今日</div>
                    </div>
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      item.status === 'completed'
                        ? 'bg-slate-200 text-slate-500'
                        : item.status === 'overdue'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gradient-to-br from-lavender-400/20 to-emerald-400/20 text-space-indigo-600'
                    )}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-semibold',
                          item.status === 'completed' && 'line-through text-slate-500'
                        )}>
                          {item.talentName}
                        </span>
                        {item.status === 'overdue' && (
                          <Badge variant="destructive" size="sm">已逾期</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {FOLLOW_UP_TYPE_LABEL[item.type]}
                      </div>
                    </div>
                    {item.status !== 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        完成
                      </Button>
                    ) : (
                      <Badge variant="success" withDot>已完成</Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>活跃岗位 Top5</CardTitle>
                <CardDescription>热门岗位招聘进展一览</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-slate-200/60">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-space-indigo-50/80 via-lavender-50/60 to-emerald-50/60">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">
                      岗位名称
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      在招
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      匹配人数
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">
                      平均周期
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topActiveJobs.map((job, idx) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                            idx === 0 ? 'bg-gradient-to-br from-amber-gold-400 to-amber-gold-500' :
                            idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                            idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400' :
                            'bg-gradient-to-br from-space-indigo-300 to-space-indigo-400'
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{job.title}</div>
                            <div className="text-xs text-slate-400">匹配度 {92 - idx * 3}%</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="warning">{job.hiringCount}人</Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-space-indigo-600">{job.matchedCount}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          'font-medium',
                          job.avgCycleDays <= 20 ? 'text-emerald-600' :
                          job.avgCycleDays <= 25 ? 'text-amber-gold-600' : 'text-red-600'
                        )}>
                          {job.avgCycleDays}天
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Users className="w-4 h-4" />
                            推荐
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default HRDashboard;
