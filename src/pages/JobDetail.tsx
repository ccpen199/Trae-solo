import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Heart,
  Send,
  Share2,
  MapPin,
  Building2,
  Briefcase,
  ChevronRight,
  GraduationCap,
  GitBranch,
  Code2,
  Users,
  TrendingUp,
  BookOpen,
  Clock,
  Star,
  Award,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  Sparkles,
  Info,
  Home,
  FileText,
  Gauge,
  Sprout,
  BarChart3,
  Building,
  BriefcaseBusiness,
  Plus,
  X,
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
import type { JobPost, GrowthTags, ImplicitSignals } from '@shared/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { TagChips, type TagChipsItem } from '@/components/ui/TagChips';
import { cn } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const TABS = [
  { id: 'desc', label: '职位介绍', icon: <FileText className="w-4 h-4" /> },
  { id: 'alignment', label: '能力对齐分析', icon: <Gauge className="w-4 h-4" /> },
  { id: 'growth', label: '成长性信息', icon: <Sprout className="w-4 h-4" /> },
  { id: 'implicit', label: '隐性信号', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'company', label: '公司环境', icon: <Building className="w-4 h-4" /> },
] as const;

type TabId = typeof TABS[number]['id'];

const BENEFITS: TagChipsItem[] = [
  { value: 'wuxianyijin', label: '五险一金' },
  { value: 'nianzhongjiang', label: '年终奖' },
  { value: 'tanxinggongzuo', label: '弹性工作' },
  { value: 'gupiaoqiquan', label: '股票期权' },
  { value: 'baoxian', label: '补充医疗' },
  { value: 'canyanbutie', label: '餐饮补贴' },
  { value: 'tongxunjiaofei', label: '带薪年假' },
  { value: 'jiabanfei', label: '健身房' },
  { value: 'xuexiyuansuan', label: '学习预算' },
  { value: 'jiehunlijin', label: '节日福利' },
];

const GROWTH_TAG_META: Record<keyof GrowthTags, { label: string; icon: React.ReactNode; desc: string }> = {
  hasTrainingSystem: {
    label: '培训体系',
    icon: <GraduationCap className="w-5 h-5" />,
    desc: '公司提供系统化的新人入职培训、岗位技能培训、管理能力培训等完整培训体系，助力员工持续成长。',
  },
  hasRotationProgram: {
    label: '轮岗机会',
    icon: <GitBranch className="w-5 h-5" />,
    desc: '支持跨部门、跨岗位轮岗，帮助员工拓宽视野、发现兴趣点，培养T型人才。',
  },
  techStackEvolution: {
    label: '技术栈演进',
    icon: <Code2 className="w-5 h-5" />,
    desc: '技术栈持续迭代升级，拥抱前沿技术，鼓励技术创新和工程效率提升。',
  },
  mentorshipProgram: {
    label: '导师制',
    icon: <Users className="w-5 h-5" />,
    desc: '为每位新人配备资深导师，提供职业规划指导、技术辅导和心理支持。',
  },
  promotionPathClear: {
    label: '晋升路径',
    icon: <TrendingUp className="w-5 h-5" />,
    desc: '清晰透明的职级体系和晋升标准，凭能力和贡献获得成长，不搞论资排辈。',
  },
  learningBudget: {
    label: '学习预算',
    icon: <BookOpen className="w-5 h-5" />,
    desc: '每人每年提供学习预算，可用于购买课程、书籍、参加技术会议等。',
  },
};

const RADAR_DIMENSIONS = [
  '技术深度', '工程能力', '沟通协作', '问题解决', '学习成长', '业务理解',
];

function generateRadarData(matchScore: number) {
  const targetBase = 85;
  const myBase = Math.round(matchScore * 0.92);
  return RADAR_DIMENSIONS.map((dim, i) => {
    const offsets = [0, -3, 5, -5, 8, -2];
    const myOffsets = [-8, -12, -5, -10, -6, -8];
    return {
      dimension: dim,
      岗位要求: Math.min(100, Math.max(60, targetBase + offsets[i])),
      我的能力: Math.min(100, Math.max(40, myBase + myOffsets[i])),
    };
  });
}

const HARD_SKILLS_MATRIX = [
  { skill: 'React/Vue框架', required: 4, current: 4, gap: 0, suggestion: '保持并深入原理层' },
  { skill: 'TypeScript', required: 4, current: 3, gap: 1, suggestion: '加强类型体操和泛型编程' },
  { skill: '工程化工具链', required: 4, current: 3, gap: 1, suggestion: '学习Vite/Rollup插件开发' },
  { skill: '性能优化', required: 3, current: 2, gap: 1, suggestion: '系统学习首屏优化、渲染优化方法论' },
  { skill: 'Node.js基础', required: 3, current: 2, gap: 1, suggestion: '通过BFF项目积累实战经验' },
  { skill: '状态管理', required: 4, current: 4, gap: 0, suggestion: '保持，可研究Zustand/Jotai原理' },
  { skill: '测试技术', required: 3, current: 2, gap: 1, suggestion: '补充Jest/Vitest和E2E测试经验' },
  { skill: 'HTML/CSS基础', required: 5, current: 5, gap: 0, suggestion: '持续打磨细节感知' },
];

const TECH_EVOLUTION_PATH = [
  { phase: '当前', tech: 'React 18 + Redux + Webpack', duration: '现在', highlight: false },
  { phase: '半年后', tech: 'React 19 + Zustand + Vite + Monorepo', duration: '6个月', highlight: true },
  { phase: '一年后', tech: 'RSC + Server Actions + Edge Computing', duration: '12个月', highlight: true },
  { phase: '二年后', tech: 'AI Agent 工程化 + 多端一体化', duration: '24个月', highlight: true },
];

const TRAINING_DETAILS = {
  internalCourses: 128,
  externalBudget: 12000,
  mentorRatio: '1:8',
};

const BLOG_DATA = [
  { month: '7月', posts: 2 }, { month: '8月', posts: 4 }, { month: '9月', posts: 3 },
  { month: '10月', posts: 5 }, { month: '11月', posts: 4 }, { month: '12月', posts: 6 },
  { month: '1月', posts: 3 }, { month: '2月', posts: 2 }, { month: '3月', posts: 5 },
  { month: '4月', posts: 7 }, { month: '5月', posts: 4 }, { month: '6月', posts: 6 },
];

const OPEN_SOURCE_DATA = {
  stars: 1280,
  repos: 23,
  contributors: 156,
};

const LEVEL_DISTRIBUTION_COLORS = ['#A7F3D0', '#6EE7B7', '#8B5CF6', '#3A5FA8', '#F59E0B', '#EC4899'];

function getLevelPieData(dist: ImplicitSignals['employeeLevelDistribution']) {
  const labels: Record<string, string> = {
    entry: 'Entry 校招', junior: 'Junior 初级', middle: 'Middle 中级',
    senior: 'Senior 高级', expert: 'Expert 专家', lead: 'Lead 负责人',
  };
  return Object.entries(dist).map(([k, v]) => ({ name: labels[k] || k, value: v }));
}

function GapBadge({ gap }: { gap: number }) {
  if (gap <= 0) {
    return (
      <Badge variant="emerald" size="sm" className="gap-1">
        <CheckCircle2 className="w-3 h-3" /> 已达标
      </Badge>
    );
  }
  if (gap === 1) {
    return (
      <Badge variant="gold" size="sm" className="gap-1">
        <Info className="w-3 h-3" /> 差距 {gap} 级
      </Badge>
    );
  }
  return (
    <Badge variant="warning" size="sm" className="gap-1">
      <AlertCircle className="w-3 h-3" /> 差距 {gap} 级
    </Badge>
  );
}

function LevelBars({ level, max = 5, color }: { level: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-4 h-2 rounded-sm transition-all',
            i < level ? color : 'bg-slate-100'
          )}
        />
      ))}
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('desc');
  const [favorited, setFavorited] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await jobsApi.getJobDetail(id);
        if (cancelled) return;
        if (!res) {
          setNotFound(true);
          return;
        }
        setJob(res);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-4 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-lg w-full text-center"
        >
          <Card variant="glass" className="p-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-100 to-amber-gold-100 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h1 className="font-heading font-bold text-3xl text-slate-900 mb-3">职位不存在</h1>
            <p className="text-slate-500 mb-8">
              你访问的职位可能已下架或链接有误，试试浏览其他机会吧。
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
                返回上一页
              </Button>
              <Button variant="primary" leftIcon={<Briefcase className="w-4 h-4" />} onClick={() => navigate('/jobs')}>
                浏览职位列表
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const matchScore = job.matchScore ?? 82;
  const matchBreakdown = job.matchBreakdown ?? { competency: 78, growth: 85, preference: 72, implicit: 68 };
  const radarData = generateRadarData(matchScore);
  const levelPieData = getLevelPieData(job.implicitSignals.employeeLevelDistribution);
  const activeGrowthTags = Object.entries(job.growthTags).filter(([k, v]) => {
    if (k === 'techStackEvolution') return v !== 'stable';
    return v === true;
  }).map(([k]) => k as keyof GrowthTags);

  return (
    <div className="min-h-screen pt-4 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              首页
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <button
              onClick={() => navigate('/jobs')}
              className="text-slate-500 hover:text-emerald-600 transition-colors"
            >
              职位列表
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="font-medium text-slate-800 truncate max-w-[200px]">{job.title}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-space-indigo-600 hover:text-emerald-600 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            返回职位列表
          </button>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          <Card
            variant="gradient"
            className="relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, #ECFDF5 30%, #F5F3FF 60%, #E8EEF7 100%)',
            }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-lavender-200/30 blur-3xl" />
            </div>

            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center text-4xl border border-slate-100">
                    {job.company.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 truncate">
                        {job.title}
                      </h1>
                      <Badge variant="emerald" size="sm" withDot>
                        热招中
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <Building2 className="w-4 h-4 text-space-indigo-500" />
                        {job.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        {job.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-lavender-500" />
                        {job.company.size}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-amber-gold-500" />
                        {job.company.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {new Date(job.publishedAt).toLocaleDateString('zh-CN')} 发布
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-4">
                      <span className="text-4xl sm:text-5xl font-heading font-bold gradient-text tracking-tight">
                        {job.salaryRange[0]}K
                      </span>
                      <span className="text-2xl font-bold text-slate-400">-</span>
                      <span className="text-3xl sm:text-4xl font-heading font-bold text-lavender-600">
                        {job.salaryRange[1]}K
                      </span>
                      <span className="text-base text-slate-400">/月</span>
                      <Badge variant="gold" size="sm" className="ml-2">
                        <Zap className="w-3 h-3" /> 14薪
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['五险一金', '年终奖', '弹性工作', '学习预算', '带薪年假', '健身房'].map((b) => (
                        <Badge key={b} variant="indigo" size="sm" className="gap-1">
                          <Award className="w-3 h-3" />
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 lg:gap-5">
                  <div className="flex-shrink-0">
                    <ProgressRing percent={matchScore} size={110} strokeWidth={10} />
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-1 sm:flex-initial">
                    <div className="relative">
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        rightIcon={<Send className="w-4 h-4" />}
                      >
                        立即投递
                      </Button>
                    </div>
                    <Button
                      variant={favorited ? 'outline' : 'outline'}
                      size="md"
                      fullWidth
                      leftIcon={
                        <Heart className={cn('w-4 h-4', favorited && 'fill-rose-500 text-rose-500')} />
                      }
                      onClick={() => setFavorited(!favorited)}
                      className={cn(favorited && '!border-rose-200 !text-rose-600 !bg-rose-50')}
                    >
                      {favorited ? '已收藏' : '收藏'}
                    </Button>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="md"
                        fullWidth
                        leftIcon={<Share2 className="w-4 h-4" />}
                        onClick={() => setShowShare(!showShare)}
                      >
                        分享
                      </Button>
                      <AnimatePresence>
                        {showShare && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            className="absolute bottom-full mb-2 left-0 right-0 z-20"
                          >
                            <Card variant="glass" className="p-2 shadow-xl">
                              <div className="flex gap-1">
                                {['微信', '复制链接', '钉钉', '邮件'].map((s) => (
                                  <button
                                    key={s}
                                    className="flex-1 px-2 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <Card variant="glass" className="p-2">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-lavender-500 text-white shadow-md shadow-emerald-200/50'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'desc' && (
              <div className="space-y-6">
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="gradient-text text-2xl flex items-center gap-2">
                      <FileText className="w-6 h-6" />
                      职位介绍
                    </CardTitle>
                    <CardDescription>深入了解岗位职责与任职要求</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <section>
                      <h3 className="font-heading font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-lavender-500" />
                        岗位职责
                      </h3>
                      <div className="pl-4 space-y-3 text-slate-700 leading-relaxed">
                        {[
                          '负责公司核心产品的前端架构设计与技术选型，确保系统高性能、高可用、可扩展；',
                          '主导复杂业务模块的开发与落地，解决关键技术问题，推动工程效率持续提升；',
                          '与产品、设计、后端团队紧密协作，参与需求评审和技术方案设计；',
                          '参与前端工程化建设，包括组件库、构建工具链、CI/CD流程优化；',
                          '指导初级工程师成长，进行Code Review，沉淀团队技术规范和最佳实践；',
                          '关注前沿技术动态，评估新技术引入价值，推动团队技术栈演进。',
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            variants={fadeInUp}
                            initial="hidden"
                            animate="show"
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-heading font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-lavender-400 to-space-indigo-500" />
                        任职要求
                      </h3>
                      <div className="pl-4 space-y-3 text-slate-700 leading-relaxed">
                        {[
                          '本科及以上学历，计算机相关专业优先，3-5年前端开发经验；',
                          '精通React/Vue等主流前端框架，深入理解其原理和生态；',
                          '扎实的HTML/CSS/JavaScript基础，熟悉TypeScript，能编写高质量类型安全代码；',
                          '有前端工程化实践经验，熟悉Vite/Webpack等构建工具的配置与优化；',
                          '具备良好的问题分析和解决能力，有性能优化、首屏优化的实战经验；',
                          '优秀的沟通协作能力，有团队管理或Mentor经验者优先。',
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            variants={fadeInUp}
                            initial="hidden"
                            animate="show"
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="flex gap-3"
                          >
                            <Target className="w-5 h-5 text-lavender-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-heading font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-gold-400 to-rose-400" />
                        福利待遇
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {BENEFITS.slice(0, 10).map((b, i) => (
                          <motion.div
                            key={b.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.04 }}
                          >
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 text-center text-sm font-medium text-slate-700 hover:border-emerald-200 hover:from-emerald-50 hover:to-lavender-50 transition-all">
                              {b.label}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'alignment' && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card variant="glass" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="gradient-text text-xl flex items-center gap-2">
                        <Gauge className="w-5 h-5" />
                        六维能力雷达图
                      </CardTitle>
                      <CardDescription>岗位要求 vs 你的能力，差值一目了然</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                            <PolarAngleAxis
                              dataKey="dimension"
                              tick={{ fill: '#475569', fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                              angle={30}
                              domain={[0, 100]}
                              tick={{ fill: '#94A3B8', fontSize: 10 }}
                            />
                            <Radar
                              name="岗位要求"
                              dataKey="岗位要求"
                              stroke="#3A5FA8"
                              fill="#3A5FA8"
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                            <Radar
                              name="我的能力"
                              dataKey="我的能力"
                              stroke="#10B981"
                              fill="url(#radarGrad)"
                              fillOpacity={0.4}
                              strokeWidth={2.5}
                            />
                            <defs>
                              <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
                              </linearGradient>
                            </defs>
                            <Legend
                              iconType="circle"
                              wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
                            />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="glass" className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="gradient-text text-xl flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        综合对齐度
                      </CardTitle>
                      <CardDescription>基于六维能力的加权评估</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center">
                      <ProgressRing percent={matchScore} size={160} strokeWidth={14} />
                      <div className="mt-6 w-full space-y-3">
                        {[
                          { label: '技术深度', score: 78, color: 'from-emerald-400 to-emerald-500' },
                          { label: '综合潜力', score: 86, color: 'from-lavender-400 to-lavender-500' },
                          { label: '成长加速', score: 92, color: 'from-amber-gold-400 to-amber-gold-500' },
                        ].map((s, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600 font-medium">{s.label}</span>
                              <span className="text-slate-800 font-bold">{s.score}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.score}%` }}
                                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                                className={cn('h-full rounded-full bg-gradient-to-r', s.color)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="gradient-text text-xl flex items-center gap-2">
                      <Code2 className="w-5 h-5" />
                      硬技能对齐矩阵
                    </CardTitle>
                    <CardDescription>逐项技能对比分析与行动建议</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full min-w-[640px]">
                        <thead>
                          <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                            <th className="px-4 py-3 font-semibold">技能名称</th>
                            <th className="px-4 py-3 font-semibold">要求等级</th>
                            <th className="px-4 py-3 font-semibold">我的等级</th>
                            <th className="px-4 py-3 font-semibold">差距</th>
                            <th className="px-4 py-3 font-semibold">行动建议</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {HARD_SKILLS_MATRIX.map((row, i) => (
                            <motion.tr
                              key={row.skill}
                              variants={fadeInUp}
                              initial="hidden"
                              animate="show"
                              transition={{ delay: i * 0.05 }}
                              className="hover:bg-emerald-50/40 transition-colors"
                            >
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-slate-800">{row.skill}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <LevelBars level={row.required} color="bg-gradient-to-r from-space-indigo-400 to-space-indigo-500" />
                                  <span className="text-xs font-medium text-slate-500">L{row.required}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <LevelBars level={row.current} color="bg-gradient-to-r from-emerald-400 to-emerald-500" />
                                  <span className="text-xs font-medium text-slate-500">L{row.current}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <GapBadge gap={row.gap} />
                              </td>
                              <td className="px-4 py-3.5 text-sm text-slate-600 max-w-xs">
                                {row.suggestion}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'growth' && (
              <div className="space-y-6">
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="gradient-text text-xl flex items-center gap-2">
                      <Sprout className="w-5 h-5" />
                      成长性指标总览
                    </CardTitle>
                    <CardDescription>共 {activeGrowthTags.length} / 6 项成长性指标已开启</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(Object.keys(GROWTH_TAG_META) as Array<keyof GrowthTags>).map((key, i) => {
                        const meta = GROWTH_TAG_META[key];
                        const active = activeGrowthTags.includes(key) || (key === 'techStackEvolution' && job.growthTags.techStackEvolution !== 'stable');
                        const level = key === 'techStackEvolution' ? job.growthTags[key] : null;
                        return (
                          <motion.div
                            key={key}
                            variants={fadeInUp}
                            initial="hidden"
                            animate="show"
                            transition={{ delay: i * 0.06 }}
                          >
                            <Card
                              variant={active ? 'gradient' : 'default'}
                              className={cn(
                                'p-5 h-full transition-all',
                                active ? 'border-emerald-200' : 'opacity-70'
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className={cn(
                                  'p-3 rounded-2xl',
                                  active
                                    ? 'bg-gradient-to-br from-emerald-100 to-lavender-100 text-emerald-600'
                                    : 'bg-slate-100 text-slate-400'
                                )}>
                                  {meta.icon}
                                </div>
                                <Badge
                                  variant={active ? 'emerald' : 'default'}
                                  size="sm"
                                  withDot
                                >
                                  {active ? (level === 'leading' ? '行业领先' : level === 'growing' ? '快速成长' : '已开启') : '未开启'}
                                </Badge>
                              </div>
                              <h4 className="font-heading font-bold text-slate-900 mb-2">{meta.label}</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">{meta.desc}</p>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="gradient-text text-xl flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      技术栈演进路径
                    </CardTitle>
                    <CardDescription>当前技术栈 → 未来升级规划时间线</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-emerald-300 via-lavender-400 to-space-indigo-400" />
                      <div className="space-y-8">
                        {TECH_EVOLUTION_PATH.map((step, i) => (
                          <motion.div
                            key={step.phase}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.12, duration: 0.5 }}
                            className="relative flex gap-5"
                          >
                            <div className={cn(
                              'relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg',
                              i === 0
                                ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                                : 'bg-gradient-to-br from-emerald-400 via-lavender-500 to-space-indigo-500'
                            )}>
                              {i === 0 ? (
                                <Clock className="w-5 h-5 text-white" />
                              ) : (
                                <Sparkles className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h4 className="font-heading font-bold text-lg text-slate-900">{step.phase}</h4>
                                <Badge variant={i === 0 ? 'default' : 'purple'} size="sm">
                                  {step.duration}
                                </Badge>
                                {step.highlight && (
                                  <Badge variant="emerald" size="sm" withDot>
                                    <TrendingUp className="w-3 h-3" />
                                    升级点
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-700 font-medium">{step.tech}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      label: '内训课程数',
                      value: TRAINING_DETAILS.internalCourses,
                      suffix: '门',
                      desc: '覆盖技术/管理/通用力',
                      icon: <GraduationCap className="w-6 h-6" />,
                      color: 'from-emerald-400 to-emerald-500',
                    },
                    {
                      label: '外训预算',
                      value: TRAINING_DETAILS.externalBudget,
                      suffix: '元/年',
                      desc: '课程/书籍/会议报销',
                      icon: <BookOpen className="w-6 h-6" />,
                      color: 'from-lavender-400 to-lavender-500',
                    },
                    {
                      label: '导师配比',
                      value: TRAINING_DETAILS.mentorRatio,
                      suffix: '',
                      desc: '1位导师带8位新人',
                      icon: <Users className="w-6 h-6" />,
                      color: 'from-space-indigo-400 to-space-indigo-500',
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      <Card variant="glass" className="p-6 h-full">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${s.color} w-fit text-white shadow-md mb-4`}>
                          {s.icon}
                        </div>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-3xl font-heading font-bold gradient-text">{s.value}</span>
                          <span className="text-lg font-bold text-slate-500">{s.suffix}</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-0.5">{s.label}</h4>
                        <p className="text-sm text-slate-500">{s.desc}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'implicit' && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="gradient-text text-xl flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        技术博客发文频率
                      </CardTitle>
                      <CardDescription>近12个月技术团队发文统计</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={BLOG_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.7} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                              cursor={{ fill: '#F1F5F9', opacity: 0.6 }}
                              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="posts" radius={[8, 8, 0, 0]} fill="url(#barGrad)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <Badge variant="emerald" size="sm" withDot>
                          <TrendingUp className="w-3 h-3" />
                          月均 4.2 篇
                        </Badge>
                        <span className="text-slate-500">年发文总量 <span className="font-bold text-slate-800">51 篇</span></span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="gradient-text text-xl flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        开源贡献数据
                      </CardTitle>
                      <CardDescription>GitHub 生态活跃度指标</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                          { label: 'GitHub Stars', value: OPEN_SOURCE_DATA.stars.toLocaleString(), icon: '⭐', color: 'from-amber-gold-400 to-amber-gold-500' },
                          { label: '开源仓库', value: OPEN_SOURCE_DATA.repos, icon: '📦', color: 'from-emerald-400 to-emerald-500' },
                          { label: '贡献者', value: OPEN_SOURCE_DATA.contributors, icon: '👥', color: 'from-lavender-400 to-lavender-500' },
                        ].map((s, i) => (
                          <motion.div
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100"
                          >
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <div className={`text-2xl font-heading font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                              {s.value}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-lavender-50 via-emerald-50 to-space-indigo-50 border border-lavender-100">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-lavender-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-slate-900 mb-1">开源活跃度高</h5>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              团队在开源社区保持高活跃度，参与多个知名项目贡献，内部技术氛围开放，鼓励代码分享。
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                  <Card variant="glass" className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="gradient-text text-xl flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        职级分布健康度
                      </CardTitle>
                      <CardDescription>团队结构金字塔分布情况</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={levelPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {levelPieData.map((_, index) => (
                                <Cell key={index} fill={LEVEL_DISTRIBUTION_COLORS[index % LEVEL_DISTRIBUTION_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            />
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              iconType="circle"
                              wrapperStyle={{ fontSize: 12, paddingLeft: 20 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-6">
                    {[
                      {
                        label: '平均在职时长',
                        value: job.implicitSignals.avgTenureMonths,
                        suffix: '个月',
                        desc: '高于行业平均（24个月），团队稳定性良好',
                        icon: <Clock className="w-6 h-6" />,
                        color: 'from-emerald-400 to-emerald-500',
                        good: job.implicitSignals.avgTenureMonths >= 24,
                      },
                      {
                        label: '内部晋升率',
                        value: Math.round(job.implicitSignals.internalPromotionRate * 100),
                        suffix: '%',
                        desc: '内部晋升通道通畅，优先从团队内部培养干部',
                        icon: <TrendingUp className="w-6 h-6" />,
                        color: 'from-lavender-400 to-lavender-500',
                        good: job.implicitSignals.internalPromotionRate >= 0.35,
                      },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                      >
                        <Card variant="glass" className="p-6 h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${s.color} w-fit text-white shadow-md`}>
                              {s.icon}
                            </div>
                            <Badge variant={s.good ? 'emerald' : 'gold'} size="sm" withDot>
                              {s.good ? '健康' : '关注'}
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-4xl font-heading font-bold gradient-text">{s.value}</span>
                            <span className="text-xl font-bold text-slate-500">{s.suffix}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800 mb-1">{s.label}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="gradient-text text-xl flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      公司介绍
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-start">
                      <div className="flex-shrink-0 w-20 h-20 rounded-3xl bg-gradient-to-br from-space-indigo-50 via-lavender-50 to-emerald-50 flex items-center justify-center text-5xl border border-slate-100 shadow-sm">
                        {job.company.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-2xl text-slate-900 mb-2">{job.company.name}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                          <span className="flex items-center gap-1">
                            <BriefcaseBusiness className="w-4 h-4 text-space-indigo-500" />
                            {job.company.industry}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-lavender-500" />
                            {job.company.size}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            {job.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                      <p className="text-slate-700 leading-relaxed">
                        {job.company.name} 是{job.company.industry}行业的领先企业，专注于为用户提供创新的产品与服务。
                        公司汇聚了来自全球顶尖高校和企业的优秀人才，以技术创新和用户体验为核心驱动力。
                        我们相信优秀的人才是公司最重要的资产，致力于为每位员工提供广阔的成长空间、有竞争力的薪酬回报和开放包容的文化氛围。
                        加入我们，一起创造更有价值的未来。
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="gradient-text text-xl flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      办公环境
                    </CardTitle>
                    <CardDescription>走进{job.company.name}的日常</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: '开放办公区', gradient: 'from-emerald-400 to-teal-500', emoji: '🏢' },
                        { label: '休闲茶水间', gradient: 'from-lavender-400 to-purple-500', emoji: '☕' },
                        { label: '健身房', gradient: 'from-space-indigo-400 to-blue-500', emoji: '🏋️' },
                        { label: '会议室', gradient: 'from-amber-gold-400 to-orange-500', emoji: '💼' },
                      ].map((env, i) => (
                        <motion.div
                          key={env.label}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="group relative aspect-[4/3] rounded-2xl overflow-hidden"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${env.gradient} opacity-80 group-hover:opacity-90 transition-opacity`} />
                          <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                            {env.emoji}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
                            <span className="text-white text-sm font-medium">{env.label}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="gradient-text text-xl flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        其他在招职位
                      </CardTitle>
                      <CardDescription>来自{job.company.name}的更多机会</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      查看全部
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-slate-100 -mt-2">
                      {[
                        { title: '高级后端工程师 (Java)', salary: '30K-55K', city: job.city, tags: ['Java', '微服务', '高并发'], hot: true },
                        { title: '资深产品经理', salary: '35K-65K', city: job.city, tags: ['B端产品', 'SaaS', '数据驱动'], hot: false },
                        { title: '数据科学家', salary: '35K-70K', city: job.city, tags: ['机器学习', 'Python', '实验设计'], hot: true },
                        { title: 'UI/UX 设计师', salary: '22K-40K', city: job.city, tags: ['Figma', '设计系统', 'B端'], hot: false },
                      ].map((j, i) => (
                        <motion.div
                          key={j.title}
                          variants={staggerContainer}
                          initial="hidden"
                          animate="show"
                          className="py-4 flex items-center justify-between gap-4 group cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                                {j.title}
                              </h4>
                              {j.hot && (
                                <Badge variant="warning" size="sm" className="gap-1">
                                  <Zap className="w-3 h-3" /> 急招
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="font-medium text-lavender-600">{j.salary}</span>
                              <span>·</span>
                              <span>{j.city}</span>
                              <span>·</span>
                              <span className="truncate">{j.tags.join(' / ')}</span>
                            </div>
                          </div>
                          <Plus className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:rotate-90 transition-all" />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-30 sm:hidden"
        >
          <div className="flex gap-2 p-2 rounded-2xl glass-card shadow-2xl">
            <Button
              variant="outline"
              size="md"
              fullWidth
              leftIcon={<Heart className={cn('w-4 h-4', favorited && 'fill-rose-500 text-rose-500')} />}
              onClick={() => setFavorited(!favorited)}
              className={cn(favorited && '!border-rose-200 !text-rose-600 !bg-rose-50')}
            >
              收藏
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              rightIcon={<Send className="w-4 h-4" />}
            >
              立即投递
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
