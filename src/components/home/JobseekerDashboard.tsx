import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Target,
  Activity,
  Briefcase,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Play,
  Star,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import { encyclopediaApi } from '@/lib/api';
import type { EncyclopediaJobCard } from '@shared/types';
import { staggerContainer, fadeInUp } from './shared';

const MOCK_HOT_JOBS: EncyclopediaJobCard[] = [
  {
    id: 'job_fe_01',
    name: '前端工程师',
    industry: '互联网',
    category: '技术',
    overview: '负责Web前端开发与交互体验',
    avgSalary: 28000,
    entryDifficulty: 2,
    demandGrowth: 15,
    avatarUrls: [],
  },
  {
    id: 'job_pm_01',
    name: '产品经理',
    industry: '互联网',
    category: '产品',
    overview: '负责产品规划与需求管理',
    avgSalary: 32000,
    entryDifficulty: 3,
    demandGrowth: 12,
    avatarUrls: [],
  },
  {
    id: 'job_ui_01',
    name: 'UI设计师',
    industry: '互联网',
    category: '设计',
    overview: '负责用户界面与视觉设计',
    avgSalary: 24000,
    entryDifficulty: 2,
    demandGrowth: 10,
    avatarUrls: [],
  },
];

function WelcomeSection() {
  const { user, currentDiagnosisReport } = useAppStore();
  const name = user.profile?.name || '求职者';
  const currentJob = user.profile?.jobseekerProfile?.currentJob;
  const currentLevel = user.profile?.jobseekerProfile?.currentLevel;

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
        {currentJob && (
          <Badge variant="emerald" size="md" withDot>
            {currentJob}
            {currentLevel && ` · ${currentLevel}`}
          </Badge>
        )}
      </div>
      <p className="text-slate-500 mt-1">
        {currentDiagnosisReport
          ? `当前目标：${currentDiagnosisReport.targetJob.name} · 综合匹配度 ${currentDiagnosisReport.overallMatchScore}%`
          : '完成能力诊断，开启精准职业规划'}
      </p>
    </motion.div>
  );
}

function QuickEntryCards() {
  const navigate = useNavigate();
  const { currentDiagnosisReport } = useAppStore();
  const hasReport = !!currentDiagnosisReport;
  const matchScore = currentDiagnosisReport?.overallMatchScore;

  const entries = [
    {
      icon: Target,
      title: '设定职业目标',
      desc: hasReport ? '已设定' : '尚未完成',
      path: '/onboarding',
      gradient: 'from-emerald-400 to-teal-500',
      alert: !hasReport,
      alertText: '尚未完成',
    },
    {
      icon: Activity,
      title: '查看诊断报告',
      desc: hasReport ? `匹配度 ${matchScore}%` : '暂无报告',
      path: hasReport ? '/diagnosis' : '/onboarding',
      gradient: 'from-space-indigo-400 to-blue-500',
      disabled: !hasReport,
    },
    {
      icon: Briefcase,
      title: '浏览推荐职位',
      desc: '智能匹配',
      path: '/jobs',
      gradient: 'from-lavender-400 to-purple-500',
    },
    {
      icon: BookOpen,
      title: '探索职业百科',
      desc: '300+岗位',
      path: '/encyclopedia',
      gradient: 'from-amber-gold-400 to-orange-500',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {entries.map((entry) => (
        <motion.div key={entry.title} variants={fadeInUp}>
          <Card
            variant="glass"
            hoverable
            className={`p-5 h-full group cursor-pointer ${entry.disabled ? 'opacity-60' : ''}`}
            onClick={() => !entry.disabled && navigate(entry.path)}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <entry.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{entry.title}</h3>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-slate-500">{entry.desc}</p>
              {entry.alert && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  {entry.alertText}
                </span>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function CompetencyOverviewCard() {
  const navigate = useNavigate();
  const { currentDiagnosisReport } = useAppStore();
  const hasReport = !!currentDiagnosisReport;

  if (!hasReport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" className="p-6 h-full flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">尚未完成能力诊断</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            完成5分钟AI能力自评，获取专属能力雷达图和岗位匹配分析
          </p>
          <Button
            variant="primary"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/onboarding')}
          >
            立即开始
          </Button>
        </Card>
      </motion.div>
    );
  }

  const radarData = currentDiagnosisReport.radarDimensions.map((d) => ({
    dimension: d.dimension,
    current: d.current,
    target: d.target,
  }));

  const overallScore = currentDiagnosisReport.overallMatchScore;
  const biggestGap = [...currentDiagnosisReport.hardSkillGaps, ...currentDiagnosisReport.softSkillGaps]
    .sort((a, b) => b.gap - a.gap)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card variant="glass" className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900">能力概览</h3>
          <Badge variant={overallScore >= 70 ? 'emerald' : overallScore >= 40 ? 'gold' : 'destructive'} size="sm" withDot>
            综合匹配度 {overallScore}%
          </Badge>
        </div>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width={180} height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#64748B' }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
              <Radar
                name="目标"
                dataKey="target"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.15}
                strokeDasharray="5 5"
              />
              <Radar
                name="当前"
                dataKey="current"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {biggestGap && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs text-red-600 font-medium">
              最大差距技能：<span className="font-bold">{biggestGap.skillName}</span>
              <span className="text-red-400 ml-1">
                (当前{biggestGap.currentLevel}/目标{biggestGap.targetLevel})
              </span>
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function HotEncyclopediaCard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<EncyclopediaJobCard[]>(MOCK_HOT_JOBS);

  useEffect(() => {
    encyclopediaApi
      .getJobs({ page: 1, pageSize: 3 })
      .then((res) => {
        if (res.data && res.data.length > 0) setJobs(res.data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const formatSalary = (v: number) => {
    if (v >= 10000) return `${(v / 10000).toFixed(1)}万`;
    return `${(v / 1000).toFixed(0)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card variant="glass" className="p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900">热门职业百科</h3>
          <button
            onClick={() => navigate('/encyclopedia')}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
          >
            查看更多
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/encyclopedia/${job.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/80 hover:border-emerald-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900 truncate">{job.name}</h4>
                <p className="text-xs text-slate-500 truncate">{job.overview}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-600">¥{formatSalary(job.avgSalary)}</p>
                <div className="flex items-center gap-0.5 justify-end">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 ${i < job.entryDifficulty ? 'text-amber-gold-400 fill-amber-gold-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function RecentSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900">最近浏览 / 收藏</h3>
        </div>
        <div className="flex items-center justify-center py-12 text-slate-400">
          <div className="text-center">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">暂无浏览记录</p>
            <p className="text-xs mt-1">浏览职位或百科后将在此展示</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function BottomCTA() {
  const navigate = useNavigate();
  const { currentDiagnosisReport } = useAppStore();
  const hasReport = !!currentDiagnosisReport;

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
          background: hasReport
            ? 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #8B5CF6 100%)'
            : 'linear-gradient(135deg, #3A5FA8 0%, #8B5CF6 50%, #EC4899 100%)',
        }}
      >
        <div className="relative z-10">
          <Sparkles className="w-8 h-8 text-white/80 mx-auto mb-3" />
          <h3 className="font-heading text-2xl font-bold text-white mb-2">
            {hasReport ? '持续提升，迈向目标' : '开启你的职业诊断之旅'}
          </h3>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            {hasReport
              ? '查看你的完整诊断报告，获取个性化学习计划和岗位推荐'
              : '5分钟AI能力自评，获取专属能力雷达图和岗位匹配分析'}
          </p>
          <Button
            size="lg"
            className="!bg-white !text-space-indigo-700 hover:!bg-white/95 shadow-2xl"
            onClick={() => navigate(hasReport ? '/diagnosis' : '/onboarding')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {hasReport ? '查看完整报告' : '立即开始诊断'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function JobseekerDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-lavender-50/20 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <WelcomeSection />
        <QuickEntryCards />
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <CompetencyOverviewCard />
          <HotEncyclopediaCard />
        </div>
        <RecentSection />
        <BottomCTA />
      </div>
    </div>
  );
}
