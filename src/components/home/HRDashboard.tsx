import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Users,
  UserPlus,
  Calendar,
  Award,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { hrApi } from '@/lib/api';
import type { JobWarning, TalentPoolEntry } from '@shared/types';
import { AnimatedNumber, staggerContainer, fadeInUp } from './shared';

interface DashboardStats {
  totalTalents: number;
  newThisWeek: number;
  interviewsScheduled: number;
  offersSent: number;
  talentByLevel: { level: string; count: number }[];
  talentByStatus: { status: string; count: number }[];
}

const MOCK_STATS: DashboardStats = {
  totalTalents: 328,
  newThisWeek: 12,
  interviewsScheduled: 5,
  offersSent: 8,
  talentByLevel: [
    { level: 'S', count: 12 },
    { level: 'A', count: 45 },
    { level: 'B', count: 120 },
    { level: 'C', count: 151 },
  ],
  talentByStatus: [
    { status: '新入库', count: 68 },
    { status: '已联系', count: 85 },
    { status: '初筛', count: 72 },
    { status: '面试', count: 55 },
    { status: 'Offer', count: 48 },
  ],
};

const MOCK_WARNINGS: JobWarning[] = [
  {
    id: 'w1',
    jobPostId: 'jp1',
    jobTitle: '高级前端工程师',
    type: 'prolonged-hiring',
    severity: 'critical',
    message: '该岗位已开放60天未招满，建议调整薪资或要求',
    suggestion: '考虑放宽经验要求或提升薪资10-15%',
    dataPoint: {},
    detectedAt: new Date().toISOString(),
  },
  {
    id: 'w2',
    jobPostId: 'jp2',
    jobTitle: '产品经理',
    type: 'competition-intensified',
    severity: 'warning',
    message: '同类岗位竞品招聘量增加40%，人才争夺加剧',
    suggestion: '加速面试流程，减少候选人等待时间',
    dataPoint: {},
    detectedAt: new Date().toISOString(),
  },
  {
    id: 'w3',
    jobPostId: 'jp3',
    jobTitle: '数据分析师',
    type: 'skill-shortage',
    severity: 'info',
    message: '符合要求的候选人较少，建议扩大搜索范围',
    suggestion: '放宽学历要求或增加远程岗位选项',
    dataPoint: {},
    detectedAt: new Date().toISOString(),
  },
];

const MOCK_TOP_TALENTS: TalentPoolEntry[] = [
  {
    id: 't1',
    userId: 'u1',
    userSummary: { name: '张明', avatar: '', currentJob: '前端工程师', yearsOfExperience: 5, keySkills: ['React', 'TypeScript'], matchScore: 92 },
    potentialLevel: 'S',
    tags: ['高潜', '主动求职'],
    status: 'interview',
    notes: '',
    addedAt: new Date().toISOString(),
    matchJobs: [{ jobId: 'j1', jobTitle: '高级前端工程师', score: 92 }],
  },
  {
    id: 't2',
    userId: 'u2',
    userSummary: { name: '李芳', avatar: '', currentJob: '产品经理', yearsOfExperience: 4, keySkills: ['需求分析', '数据驱动'], matchScore: 88 },
    potentialLevel: 'S',
    tags: ['高潜'],
    status: 'screening',
    notes: '',
    addedAt: new Date().toISOString(),
    matchJobs: [{ jobId: 'j2', jobTitle: '高级产品经理', score: 88 }],
  },
  {
    id: 't3',
    userId: 'u3',
    userSummary: { name: '王磊', avatar: '', currentJob: '数据分析师', yearsOfExperience: 3, keySkills: ['Python', 'SQL'], matchScore: 85 },
    potentialLevel: 'A',
    tags: ['稳定型'],
    status: 'contacted',
    notes: '',
    addedAt: new Date().toISOString(),
    matchJobs: [{ jobId: 'j3', jobTitle: '数据分析师', score: 85 }],
  },
];

const STATUS_COLORS = ['#10B981', '#3A5FA8', '#8B5CF6', '#F59E0B', '#EC4899'];
const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-gold-500',
  info: 'bg-blue-500',
};
const SEVERITY_BADGE: Record<string, 'destructive' | 'warning' | 'info'> = {
  critical: 'destructive',
  warning: 'warning',
  info: 'info',
};

function HRWelcomeSection({ stats }: { stats: DashboardStats }) {
  const { user } = useAppStore();
  const name = user.profile?.name || 'HR';
  const companyName = user.profile?.hrProfile?.companyName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-heading text-3xl font-bold text-slate-900">
          欢迎回来，{name}
        </h1>
        {companyName && (
          <Badge variant="indigo" size="md" withDot>
            {companyName}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          今日待办：
        </span>
        <span className="text-space-indigo-600 font-medium">待跟进 {stats.newThisWeek}人</span>
        <span className="text-emerald-600 font-medium">新增匹配 {stats.interviewsScheduled}人</span>
        <span className="text-amber-gold-600 font-medium">预警 {MOCK_WARNINGS.filter(w => w.severity === 'critical').length}个</span>
      </div>
    </motion.div>
  );
}

function KPICards({ stats }: { stats: DashboardStats }) {
  const navigate = useNavigate();

  const kpis = [
    {
      icon: Users,
      title: '人才池总人数',
      value: stats.totalTalents,
      suffix: '人',
      gradient: 'from-emerald-400 to-teal-500',
      path: '/hr/talent-pool',
    },
    {
      icon: UserPlus,
      title: '本周新增人才',
      value: stats.newThisWeek,
      suffix: '人',
      gradient: 'from-space-indigo-400 to-blue-500',
      path: '/hr/talent-pool',
    },
    {
      icon: Calendar,
      title: '今日面试安排',
      value: stats.interviewsScheduled,
      suffix: '场',
      gradient: 'from-lavender-400 to-purple-500',
      path: '/hr/dashboard',
    },
    {
      icon: Award,
      title: '已发Offer数',
      value: stats.offersSent,
      suffix: '个',
      gradient: 'from-amber-gold-400 to-orange-500',
      path: '/hr/dashboard',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.title} variants={fadeInUp}>
          <Card
            variant="glass"
            hoverable
            className="p-5 h-full cursor-pointer group"
            onClick={() => navigate(kpi.path)}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 mb-1">{kpi.title}</h3>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={kpi.value}
                suffix={kpi.suffix}
                className="text-3xl font-bold gradient-text tracking-tight"
                duration={1800}
              />
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function TalentPoolDonut({ stats }: { stats: DashboardStats }) {
  const chartData = stats.talentByStatus.map((s, i) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card variant="glass" className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900">人才池分布</h3>
          <Badge variant="indigo" size="sm" withDot>
            {stats.totalTalents}人
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}人`, name]}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900">{item.value}人</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function WarningSummary({ warnings }: { warnings: JobWarning[] }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card variant="glass" className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900">预警中心</h3>
          <button
            onClick={() => navigate('/hr/warnings')}
            className="text-sm text-space-indigo-600 hover:text-space-indigo-700 font-medium flex items-center gap-1 transition-colors"
          >
            查看全部
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {warnings.slice(0, 3).map((w) => (
            <motion.div
              key={w.id}
              whileHover={{ x: 4 }}
              onClick={() => navigate('/hr/warnings')}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-white/80 hover:border-amber-gold-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <div className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${SEVERITY_COLORS[w.severity]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-sm text-slate-900">{w.jobTitle}</h4>
                  <Badge variant={SEVERITY_BADGE[w.severity]} size="sm">
                    {w.severity === 'critical' ? '严重' : w.severity === 'warning' ? '警告' : '提示'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{w.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function TopTalentCard({ talents }: { talents: TalentPoolEntry[] }) {
  const navigate = useNavigate();

  const levelBadgeVariant = (level: string) => {
    if (level === 'S') return 'potential-A' as const;
    if (level === 'A') return 'potential-B' as const;
    return 'potential-C' as const;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            潜力人才 Top3
          </h3>
          <button
            onClick={() => navigate('/hr/talent-pool')}
            className="text-sm text-space-indigo-600 hover:text-space-indigo-700 font-medium flex items-center gap-1 transition-colors"
          >
            人才池
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {talents.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/hr/talent-pool/${t.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/80 hover:border-emerald-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {t.userSummary.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-slate-900">{t.userSummary.name}</h4>
                  <Badge variant={levelBadgeVariant(t.potentialLevel)} size="sm">
                    {t.potentialLevel}级
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{t.userSummary.currentJob}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-600">{t.userSummary.matchScore}%</p>
                <p className="text-[10px] text-slate-400">匹配度</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function HRBottomCTA() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8"
    >
      <Card
        variant="gradient"
        className="p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #3A5FA8 0%, #8B5CF6 50%, #EC4899 100%)',
        }}
      >
        <div className="relative z-10">
          <BarChart3 className="w-8 h-8 text-white/80 mx-auto mb-3" />
          <h3 className="font-heading text-2xl font-bold text-white mb-2">
            进入完整HR控制台
          </h3>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            管理人才池、安排面试跟进、查看招聘预警，一站式高效运营
          </p>
          <Button
            size="lg"
            className="!bg-white !text-space-indigo-700 hover:!bg-white/95 shadow-2xl"
            onClick={() => navigate('/hr/dashboard')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            进入HR控制台
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function HRDashboard() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [warnings, setWarnings] = useState<JobWarning[]>(MOCK_WARNINGS);
  const [topTalents, setTopTalents] = useState<TalentPoolEntry[]>(MOCK_TOP_TALENTS);

  useEffect(() => {
    hrApi
      .getHrDashboardStats()
      .then((data) => setStats(data))
      .catch(() => {});

    hrApi
      .getHrWarnings({ page: 1, pageSize: 3 })
      .then((res) => {
        if (res.data && res.data.length > 0) setWarnings(res.data.slice(0, 3));
      })
      .catch(() => {});

    hrApi
      .getHrTalentPool({ page: 1, pageSize: 3 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const sorted = [...res.data].sort((a, b) => {
            const levelOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };
            return (levelOrder[a.potentialLevel] ?? 4) - (levelOrder[b.potentialLevel] ?? 4);
          });
          setTopTalents(sorted.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-indigo-50/30 via-white to-lavender-50/20 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <HRWelcomeSection stats={stats} />
        <KPICards stats={stats} />
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <TalentPoolDonut stats={stats} />
          <WarningSummary warnings={warnings} />
        </div>
        <TopTalentCard talents={topTalents} />
        <HRBottomCTA />
      </div>
    </div>
  );
}
