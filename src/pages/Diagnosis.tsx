import { useEffect, useMemo, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import {
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronRight,
  Flag,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Users,
  Brain,
  Zap,
  Heart,
  Sparkles,
  ArrowRight,
  Briefcase,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { diagnosisApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DiagnosisReport, SkillGap, Certification as CertificationType } from '@shared/types';

type GapPriority = 'critical' | 'high' | 'medium' | 'low';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function useScrollInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return { ref, inView };
}

function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 14,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A5F" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30, 58, 95, 0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-heading text-4xl font-bold gradient-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {progress}%
        </motion.span>
        <span className="text-sm text-slate-500 mt-1">综合匹配度</span>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-space-indigo-500 to-lavender-500 text-white shadow-lg shadow-lavender-200">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    </motion.div>
  );
}

function GapBadge({ priority }: { priority: GapPriority }) {
  const config: Record<GapPriority, { label: string; className: string }> = {
    critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
    high: { label: 'High', className: 'bg-amber-gold-50 text-amber-gold-700 border-amber-gold-200' },
    medium: { label: 'Medium', className: 'bg-lavender-50 text-lavender-700 border-lavender-200' },
    low: { label: 'Low', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };
  const { label, className } = config[priority];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', className)}>
      {label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: CertificationType['difficulty'] }) {
  const config = {
    basic: { label: '入门', className: 'bg-emerald-100 text-emerald-700' },
    intermediate: { label: '进阶', className: 'bg-lavender-100 text-lavender-700' },
    advanced: { label: '高级', className: 'bg-space-indigo-100 text-space-indigo-700' },
  };
  const { label, className } = config[difficulty];
  return <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', className)}>{label}</span>;
}

const softSkillMeta = [
  {
    key: '沟通协作',
    dimension: 'communication',
    icon: Users,
    currentDesc: '能清晰表达技术方案，但跨团队沟通时缺少结构化表达，会议中偶尔过于被动',
    suggestions: ['每日练习 STAR 结构化表达法', '主动承担跨组项目协调角色', '每周复盘一次会议记录与反馈'],
  },
  {
    key: '领导力',
    dimension: 'leadership',
    icon: TrendingUp,
    currentDesc: '能带领小组完成任务，但在激励团队和战略思考层面仍有提升空间',
    suggestions: ['学习情境领导力模型', '主动主导 1 个跨部门项目', '建立团队 1-on-1 沟通机制'],
  },
  {
    key: '思维分析',
    dimension: 'thinking',
    icon: Brain,
    currentDesc: '逻辑推理能力强，但系统设计与抽象思维需要更具前瞻性',
    suggestions: ['每周深度阅读 1 篇系统设计论文', '练习用第一性原理拆解问题', '参与技术方案评审并主动写文档'],
  },
  {
    key: '执行力',
    dimension: 'execution',
    icon: Zap,
    currentDesc: '任务交付准时可靠，但在优先级排序和风险预判上仍可优化',
    suggestions: ['引入 Eisenhower 矩阵做任务分级', '每周五做下周计划与风险评估', '建立个人 OKR 并追踪进度'],
  },
  {
    key: '情商逆商',
    dimension: 'emotional',
    icon: Heart,
    currentDesc: '抗压能力良好，但在冲突处理与情绪管理方面可更从容',
    suggestions: ['学习非暴力沟通方法论', '每日 5 分钟情绪日志', '在冲突中练习「暂停 6 秒」法则'],
  },
];

function buildMockReport(): DiagnosisReport {
  const hardSkillGaps: SkillGap[] = [
    { skillId: 'h1', skillName: 'JavaScript/TypeScript 高级特性', currentLevel: 3, targetLevel: 5, gap: 2, priority: 'high', suggestedAction: '系统学习 TS 类型体操、设计模式与性能优化实战课程' },
    { skillId: 'h2', skillName: 'React 原理与源码', currentLevel: 2, targetLevel: 4, gap: 2, priority: 'critical', suggestedAction: '深入阅读 Fiber 架构与调度机制，手写 Mini React' },
    { skillId: 'h3', skillName: '工程化 (Vite/Webpack/Rollup)', currentLevel: 2, targetLevel: 4, gap: 2, priority: 'high', suggestedAction: '从 0 搭建 Monorepo，编写自定义 Vite/Rollup 插件' },
    { skillId: 'h4', skillName: '性能优化 (Web/V8)', currentLevel: 2, targetLevel: 4, gap: 2, priority: 'high', suggestedAction: '系统学习 Lighthouse 指标、V8 编译管线、长列表优化' },
    { skillId: 'h5', skillName: '跨端 (RN/小程序/Taro)', currentLevel: 1, targetLevel: 3, gap: 2, priority: 'medium', suggestedAction: '选择一条跨端路线深入，完成 1 个真实项目落地' },
    { skillId: 'h6', skillName: 'Node.js 后端能力', currentLevel: 2, targetLevel: 3, gap: 1, priority: 'medium', suggestedAction: '学习 Nest.js/Express，完成 BFF 层实践' },
    { skillId: 'h7', skillName: 'CSS/动画与设计系统', currentLevel: 4, targetLevel: 4, gap: 0, priority: 'low', suggestedAction: '保持现有水平，关注 CSS 新特性与设计规范演进' },
    { skillId: 'h8', skillName: '测试 (单测/E2E)', currentLevel: 2, targetLevel: 3, gap: 1, priority: 'medium', suggestedAction: '在项目中引入 Vitest + Playwright，TDD 实践' },
    { skillId: 'h9', skillName: '算法与数据结构', currentLevel: 3, targetLevel: 4, gap: 1, priority: 'low', suggestedAction: '每周 3 道 Medium，重点刷 DP、图与系统设计' },
    { skillId: 'h10', skillName: 'Git 高级操作与协作', currentLevel: 4, targetLevel: 4, gap: 0, priority: 'low', suggestedAction: '继续保持，学习 Git 工作流最佳实践' },
  ];
  const softSkillGaps: SkillGap[] = [
    { skillId: 's1', skillName: '沟通协作', currentLevel: 3, targetLevel: 5, gap: 2, priority: 'high', suggestedAction: '' },
    { skillId: 's2', skillName: '领导力', currentLevel: 2, targetLevel: 4, gap: 2, priority: 'critical', suggestedAction: '' },
    { skillId: 's3', skillName: '思维分析', currentLevel: 3, targetLevel: 4, gap: 1, priority: 'medium', suggestedAction: '' },
    { skillId: 's4', skillName: '执行力', currentLevel: 4, targetLevel: 4, gap: 0, priority: 'low', suggestedAction: '' },
    { skillId: 's5', skillName: '情商逆商', currentLevel: 3, targetLevel: 4, gap: 1, priority: 'medium', suggestedAction: '' },
  ];
  const certifications: CertificationType[] = [
    { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', difficulty: 'advanced', estimatedHours: 120, relevance: 88 },
    { id: 'c2', name: 'Google Professional Cloud Architect', issuer: 'Google Cloud', difficulty: 'advanced', estimatedHours: 140, relevance: 82 },
    { id: 'c3', name: 'Meta Front-End Developer', issuer: 'Meta / Coursera', difficulty: 'intermediate', estimatedHours: 80, relevance: 95 },
    { id: 'c4', name: 'Certified Kubernetes Application Developer', issuer: 'CNCF', difficulty: 'advanced', estimatedHours: 100, relevance: 75 },
    { id: 'c5', name: 'MongoDB Certified Developer Associate', issuer: 'MongoDB University', difficulty: 'intermediate', estimatedHours: 60, relevance: 70 },
    { id: 'c6', name: 'Scrum Master Certified (SMC)', issuer: 'SCRUMstudy', difficulty: 'basic', estimatedHours: 30, relevance: 68 },
  ];
  return {
    id: 'mock-report-' + Date.now(),
    createdAt: new Date().toISOString(),
    targetJob: { id: 'frontend-senior', name: '高级前端工程师', level: 'senior' },
    overallMatchScore: 72,
    radarDimensions: [
      { dimension: '技术深度', current: 70, target: 90 },
      { dimension: '业务理解', current: 65, target: 85 },
      { dimension: '协作沟通', current: 60, target: 80 },
      { dimension: '项目经验', current: 72, target: 88 },
      { dimension: '行业认知', current: 55, target: 75 },
      { dimension: '成长潜力', current: 80, target: 90 },
    ],
    hardSkillGaps,
    softSkillGaps,
    certificationRecommendations: certifications,
    promotionPath: {
      fromJobId: 'frontend-middle',
      totalEstimatedMonths: 24,
      nodes: [
        { id: 'p0', jobName: '中级前端工程师', level: 'middle', estimatedMonths: 0, keyThresholds: [], avgSalaryRange: [18, 28] },
        { id: 'p1', jobName: '高级前端工程师', level: 'senior', estimatedMonths: 12, keyThresholds: ['系统掌握 React/Vue 原理', '独立负责中型项目', '带新人能力'], avgSalaryRange: [28, 45] },
        { id: 'p2', jobName: '前端技术专家', level: 'expert', estimatedMonths: 24, keyThresholds: ['架构设计能力', '跨端/微前端落地', '技术影响力输出'], avgSalaryRange: [45, 70] },
        { id: 'p3', jobName: '前端技术总监', level: 'lead', estimatedMonths: 42, keyThresholds: ['团队管理 10+', '技术战略规划', '组织级影响力'], avgSalaryRange: [70, 120] },
      ],
    },
    estimatedReadinessMonths: 12,
    learningPlan: [
      {
        phase: '基础期',
        durationWeeks: 12,
        tasks: [
          'JavaScript 高级特性系统梳理 (闭包/原型/异步/事件循环)',
          'TypeScript 进阶：类型体操 + 实战项目重构',
          'React 原理：Fiber、调度、Hooks 源码学习',
          '工程化：从 0 搭建 Monorepo + 组件库',
          '性能优化：Lighthouse 全指标优化实战',
        ],
      },
      {
        phase: '提升期',
        durationWeeks: 16,
        tasks: [
          '系统设计：微前端、BFF、SSR 架构落地',
          '跨端实践：Taro / RN 选一条深入',
          'Node.js：Nest.js + BFF 层服务端开发',
          '测试体系：单测 + E2E + CI/CD 流水线',
          '技术写作：输出 3 篇深度技术博客',
        ],
      },
      {
        phase: '冲刺期',
        durationWeeks: 8,
        tasks: ['面试刷题：算法 + 系统设计 + 行为面试', '模拟面试：每周 2 次模拟', '作品集整理：项目复盘 + 案例整理', '目标公司定向调研 + 内推渠道建设', 'Offer 谈判与选择策略'],
      },
    ],
  };
}

const skillCategories = [
  { key: '基础', skills: ['JavaScript/TypeScript 高级特性', '算法与数据结构', 'CSS/动画与设计系统', 'Git 高级操作与协作'] as const },
  { key: '框架', skills: ['React 原理与源码'] as const },
  { key: '工程化', skills: ['工程化 (Vite/Webpack/Rollup)', '测试 (单测/E2E)'] as const },
  { key: '性能', skills: ['性能优化 (Web/V8)'] as const },
  { key: '跨端', skills: ['跨端 (RN/小程序/Taro)', 'Node.js 后端能力'] as const },
] as const;

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  基础: BookOpen,
  框架: Sparkles,
  工程化: Zap,
  性能: TrendingUp,
  跨端: ArrowRight,
};

function priorityWeight(p: GapPriority) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[p];
}

export default function Diagnosis() {
  const navigate = useNavigate();
  const { currentDiagnosisReport, setDiagnosisReport } = useAppStore();
  const [loading, setLoading] = useState(!currentDiagnosisReport);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ 基础: true, 框架: true, 工程化: true, 性能: true, 跨端: true });
  const [expandedCerts, setExpandedCerts] = useState<Record<string, boolean>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentDiagnosisReport) {
      const mock = buildMockReport();
      setDiagnosisReport(mock);
      setLoading(false);
      try {
        diagnosisApi.postDiagnosisAssess({
          targetJobId: 'frontend-senior',
          targetJobLevel: 'senior',
          hardSkillRatings: {},
          softSkillRatings: {},
          yearsOfExperience: 3,
          certificationsHeld: [],
          salaryExpectation: [30, 50],
          preferredCities: ['北京', '上海', '深圳'],
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }, [currentDiagnosisReport, setDiagnosisReport]);

  const report = currentDiagnosisReport ?? buildMockReport();

  const handleReDiagnose = () => {
    setLoading(true);
    const mock = buildMockReport();
    setDiagnosisReport(mock);
    setTimeout(() => setLoading(false), 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const criticalHighCount = useMemo(() => report.hardSkillGaps.filter((s) => s.priority === 'critical' || s.priority === 'high').length, [report]);
  const masteredCount = useMemo(() => report.hardSkillGaps.filter((s) => s.gap === 0).length, [report]);
  const certificationCount = report.certificationRecommendations.length;
  const readinessMonths = report.estimatedReadinessMonths;

  const readinessDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + readinessMonths);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [readinessMonths]);

  const createdDate = useMemo(() => {
    const d = new Date(report.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, [report.createdAt]);

  const groupedHardSkills = useMemo(() => {
    const map: Record<string, SkillGap[]> = {};
    for (const cat of skillCategories) {
      map[cat.key] = [];
      for (const sname of cat.skills) {
        const found = report.hardSkillGaps.find((g) => g.skillName === sname);
        if (found) map[cat.key].push(found);
      }
    }
    return map;
  }, [report]);

  const barChartData = useMemo(
    () =>
      report.softSkillGaps.map((s) => ({
        name: s.skillName,
        当前: s.currentLevel * 20,
        目标: s.targetLevel * 20,
      })),
    [report]
  );

  const highestPrioritySoft = useMemo(
    () => report.softSkillGaps.reduce((a, b) => (priorityWeight(a.priority) > priorityWeight(b.priority) ? a : b)).skillName,
    [report]
  );

  const overviewCards = [
    { label: '关键差距项数', value: criticalHighCount, unit: '项', icon: Zap, color: 'from-red-500 to-amber-gold-500', bg: 'bg-red-50 border-red-100' },
    { label: '已掌握技能数', value: masteredCount, unit: '项', icon: CheckCircle2, color: 'from-emerald-500 to-space-indigo-500', bg: 'bg-emerald-50 border-emerald-100' },
    { label: '推荐认证数', value: certificationCount, unit: '个', icon: Award, color: 'from-lavender-500 to-space-indigo-500', bg: 'bg-lavender-50 border-lavender-100' },
    { label: '预计学习周期', value: readinessMonths, unit: '月', icon: Clock, color: 'from-amber-gold-500 to-lavender-500', bg: 'bg-amber-gold-50 border-amber-gold-100' },
  ] as const;

  const recommendedJobs = [
    { id: 'r1', title: '高级前端工程师', company: '字节跳动', city: '北京', salary: '35-60K', match: 92 },
    { id: 'r2', title: '资深前端工程师', company: '蚂蚁集团', city: '杭州', salary: '40-70K', match: 88 },
    { id: 'r3', title: '前端技术专家', company: '腾讯', city: '深圳', salary: '45-80K', match: 85 },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Header targetName={report.targetJob.name} createdDate={createdDate} onReDiagnose={handleReDiagnose} onPrint={handlePrint} loading={loading} />

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-space-indigo-500 animate-pulse text-lg">正在生成诊断报告...</div>
          </div>
        ) : (
          <div className="mt-8 space-y-16">
            <OverviewSection matchScore={report.overallMatchScore} radarData={report.radarDimensions} readinessDate={readinessDate} overviewCards={overviewCards} />
            <HardSkillsSection groupedSkills={groupedHardSkills} expanded={expandedCategories} setExpanded={setExpandedCategories} />
            <SoftSkillsSection data={barChartData} softGaps={report.softSkillGaps} highestPriority={highestPrioritySoft} />
            <CertificationsSection certifications={report.certificationRecommendations} expanded={expandedCerts} setExpanded={setExpandedCerts} />
            <PromotionPathSection nodes={report.promotionPath.nodes} />
            <LearningPlanSection phases={report.learningPlan} completedTasks={completedTasks} setCompletedTasks={setCompletedTasks} />
            <RecommendedJobsBanner jobs={recommendedJobs} onNavigate={() => navigate('/jobs')} />
          </div>
        )}
      </div>
    </div>
  );
}

function Header({
  targetName,
  createdDate,
  onReDiagnose,
  onPrint,
  loading,
}: {
  targetName: string;
  createdDate: string;
  onReDiagnose: () => void;
  onPrint: () => void;
  loading: boolean;
}) {
  return (
    <motion.header variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <motion.div variants={fadeInUp}>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">
          <span className="gradient-text">能力差距诊断报告</span>
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:text-base">
          <span className="inline-flex items-center gap-1 rounded-full bg-lavender-50 px-3 py-1 text-lavender-700 font-medium border border-lavender-100">
            <Briefcase className="h-3.5 w-3.5" />
            目标岗位：{targetName}
          </span>
          <span>·</span>
          <span>报告生成时间：{createdDate}</span>
        </p>
      </motion.div>
      <motion.div variants={fadeInUp} className="flex gap-3">
        <button
          onClick={onReDiagnose}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium text-sm transition-all',
            'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-lg shadow-lavender-200/60',
            'hover:shadow-xl hover:shadow-lavender-300/60 hover:-translate-y-0.5',
            'disabled:opacity-70 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          重新诊断
        </button>
        <button
          onClick={onPrint}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <Printer className="h-4 w-4" />
          打印 / 导出
        </button>
      </motion.div>
    </motion.header>
  );
}

function OverviewSection({
  matchScore,
  radarData,
  readinessDate,
  overviewCards,
}: {
  matchScore: number;
  radarData: DiagnosisReport['radarDimensions'];
  readinessDate: string;
  overviewCards: ReadonlyArray<{
    label: string;
    value: number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }>;
}) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();

  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer}>
      <div className="relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-br from-space-indigo-400 via-lavender-400 to-emerald-400">
        <div className="rounded-[calc(1.5rem-2px)] bg-white/95 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-10">
            <motion.div variants={fadeInUp} className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-lavender-200/50 to-space-indigo-200/40 blur-2xl" />
                <ProgressRing progress={matchScore} />
              </div>
              <div className="mt-6 text-center lg:text-left">
                <p className="text-sm text-slate-500">预计达成时间</p>
                <p className="mt-1 font-heading text-xl font-bold text-slate-900">{readinessDate}</p>
                <p className="mt-1 text-xs text-slate-400">基于当前学习强度估算</p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="mb-4 font-heading text-lg font-semibold text-slate-900">六维能力雷达</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" strokeWidth={1} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="当前能力" dataKey="current" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} strokeWidth={2} />
                    <Radar name="目标要求" dataKey="target" stroke="#1E3A5F" fill="#1E3A5F" fillOpacity={0.15} strokeWidth={2} strokeDasharray="4 2" />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-6 sm:px-10 pb-10">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={cn('rounded-2xl border p-4 transition-all hover:shadow-md', card.bg)}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-600">{card.label}</p>
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white', card.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 font-heading text-2xl font-bold text-slate-900">
                    {card.value}
                    <span className="ml-1 text-sm font-medium text-slate-500">{card.unit}</span>
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function HardSkillsSection({
  groupedSkills,
  expanded,
  setExpanded,
}: {
  groupedSkills: Record<string, SkillGap[]>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();

  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className="scroll-mt-8">
      <SectionTitle icon={BookOpen} title="硬技能差距分析" description="按技能分类展示当前水平与目标水平差距，优先级越高代表需要优先攻克" />
      <div className="space-y-3">
        {skillCategories.map((cat, idx) => {
          const Icon = categoryIcons[cat.key];
          const isOpen = expanded[cat.key];
          const skills = groupedSkills[cat.key] ?? [];
          const catBarData = skills.map((s) => ({ name: s.skillName, 当前: s.currentLevel * 20, 目标: s.targetLevel * 20 }));
          const topPriority = skills.find((s) => s.priority === 'critical') ?? skills.find((s) => s.priority === 'high');
          return (
            <motion.div key={cat.key} variants={fadeInUp} custom={idx}>
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                className="w-full glass-card flex items-center justify-between p-5 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-space-indigo-500 to-lavender-500 text-white">
                    {Icon && <Icon className="h-5 w-5" />}
                  </div>
                  <div className="text-left">
                    <h3 className="font-heading text-lg font-bold text-slate-900">{cat.key}</h3>
                    <p className="text-xs text-slate-500">{skills.length} 项技能</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    {topPriority && <GapBadge priority={topPriority.priority} />}
                  </div>
                  <ChevronDown className={cn('h-5 w-5 text-slate-400 transition-transform duration-300', isOpen && 'rotate-180')} />
                </div>
              </button>

              <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-3 glass-card p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {skills.map((skill) => (
                        <div key={skill.skillId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-slate-800">{skill.skillName}</span>
                              <GapBadge priority={skill.priority} />
                            </div>
                            <div className="text-xs text-slate-500 whitespace-nowrap ml-2">
                              Lv.{skill.currentLevel} → Lv.{skill.targetLevel}
                            </div>
                          </div>
                          <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-space-indigo-400 to-lavender-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.currentLevel * 20}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                            <div className="absolute top-0 h-full w-0.5 bg-amber-gold-400" style={{ left: `${skill.targetLevel * 20}%` }}>
                              <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rotate-45 border-r-2 border-t-2 border-amber-gold-500 bg-white" />
                            </div>
                          </div>
                          {(skill.priority === 'critical' || skill.priority === 'high') && (
                            <motion.p
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
                              className="flex items-start gap-2 rounded-lg bg-amber-gold-50 border border-amber-gold-100 px-3 py-2 text-xs text-amber-gold-700"
                            >
                              <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>建议行动：{skill.suggestedAction}</span>
                            </motion.p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={catBarData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="目标" fill="#E2E8F0" radius={[0, 6, 6, 0]} barSize={14} />
                          <Bar dataKey="当前" radius={[0, 6, 6, 0]} barSize={14}>
                            {catBarData.map((_, i) => (
                              <Cell key={i} fill={`url(#barGrad-${cat.key}-${i})`} />
                            ))}
                          </Bar>
                          <defs>
                            {catBarData.map((_, i) => (
                              <linearGradient key={i} id={`barGrad-${cat.key}-${i}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#1E3A5F" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                              </linearGradient>
                            ))}
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function SoftSkillsSection({
  data,
  softGaps,
  highestPriority,
}: {
  data: Array<{ name: string; 当前: number; 目标: number }>;
  softGaps: SkillGap[];
  highestPriority: string;
}) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className="scroll-mt-8">
      <SectionTitle icon={Users} title="软技能维度分析" description="评估通用能力差距，每维度提供具体行为描述与改进建议" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={fadeInUp} className="lg:col-span-2 glass-card p-6">
          <h3 className="mb-4 font-heading text-lg font-semibold text-slate-900">五维能力对比</h3>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="目标" fill="#E2E8F0" radius={[0, 6, 6, 0]} barSize={16} />
                <Bar dataKey="当前" radius={[0, 6, 6, 0]} barSize={16}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={`url(#softGrad-${i})`} />
                  ))}
                </Bar>
                <defs>
                  {data.map((d, i) => (
                    <linearGradient key={i} id={`softGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={d.name === highestPriority ? '#F59E0B' : '#10B981'} />
                      <stop offset="100%" stopColor={d.name === highestPriority ? '#FBBF24' : '#8B5CF6'} />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="lg:col-span-3 space-y-3">
          {softSkillMeta.map((meta) => {
            const gap = softGaps.find((g) => g.skillName === meta.key);
            const isHighlight = meta.key === highestPriority;
            const Icon = meta.icon;
            return (
              <div
                key={meta.key}
                className={cn(
                  'glass-card p-5 transition-all',
                  isHighlight && 'ring-2 ring-amber-gold-400 ring-offset-2 ring-offset-white shadow-xl'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white',
                      isHighlight
                        ? 'bg-gradient-to-br from-amber-gold-500 to-amber-gold-400'
                        : 'bg-gradient-to-br from-emerald-500 to-space-indigo-500'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heading text-base font-bold text-slate-900">{meta.key}</h4>
                      {isHighlight && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-gold-100 px-2 py-0.5 text-xs font-semibold text-amber-gold-700">
                          ⚡ 优先改进
                        </span>
                      )}
                      {gap && <span className="ml-auto text-xs text-slate-500">Lv.{gap.currentLevel} → Lv.{gap.targetLevel}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      <span className="font-medium text-slate-700">当前表现：</span>
                      {meta.currentDesc}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600">改进建议：</p>
                      <ul className="space-y-1">
                        {meta.suggestions.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}

function CertificationsSection({
  certifications,
  expanded,
  setExpanded,
}: {
  certifications: CertificationType[];
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className="scroll-mt-8">
      <SectionTitle icon={Award} title="推荐认证与学习" description="高相关度认证，加速技能背书，点亮职业竞争力" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certifications.map((cert, idx) => {
          const isOpen = expanded[cert.id];
          return (
            <motion.div key={cert.id} variants={fadeInUp} custom={idx}>
              <div className={cn('glass-card overflow-hidden transition-all duration-300', isOpen ? 'ring-2 ring-lavender-300 shadow-lg' : 'hover:shadow-md')}>
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [cert.id]: !prev[cert.id] }))}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <h3 className="font-heading text-base font-bold text-slate-900 leading-snug">{cert.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{cert.issuer}</p>
                    </div>
                    <ChevronRight className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 mt-0.5', isOpen && 'rotate-90')} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={cert.difficulty} />
                    <span className="inline-flex items-center gap-1 rounded-md bg-space-indigo-50 px-2 py-0.5 text-xs font-medium text-space-indigo-700">
                      <Clock className="h-3 w-3" />
                      {cert.estimatedHours} 学时
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      相关度 {cert.relevance}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>相关度进度</span>
                      <span className="font-medium text-slate-700">{cert.relevance}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lavender-400 to-space-indigo-500"
                        style={{ width: `${cert.relevance}%` }}
                      />
                    </div>
                  </div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 bg-gradient-to-b from-lavender-50/30 to-transparent">
                    <p className="text-sm font-semibold text-slate-800 mb-2">学习路径建议</p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex gap-2">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-space-indigo-100 text-space-indigo-600 flex items-center justify-center font-bold text-[10px]">1</span>
                        <span>官方文档通读 + 配套视频课程完成基础模块</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-lavender-100 text-lavender-600 flex items-center justify-center font-bold text-[10px]">2</span>
                        <span>完成官方动手实验 (Hands-on Labs) 与实战项目</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">3</span>
                        <span>模拟题库冲刺 + 社区模拟题 + 考前复习笔记</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-amber-gold-100 text-amber-gold-600 flex items-center justify-center font-bold text-[10px]">4</span>
                        <span>预约考试 + 考后整理学习总结到简历</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function PromotionPathSection({ nodes }: { nodes: DiagnosisReport['promotionPath']['nodes'] }) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();
  const currentIndex = 1;

  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className="scroll-mt-8">
      <SectionTitle icon={TrendingUp} title="晋升路径可视化" description="从当前岗位到目标岗位的成长路径，附关键门槛参考" />
      <motion.div variants={fadeInUp} className="glass-card p-6 sm:p-10 overflow-x-auto">
        <div className="relative min-w-[800px]">
          <svg className="absolute left-0 right-0 top-10 h-24 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#1E3A5F" />
              </linearGradient>
              <linearGradient id="pathGradBg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D1FAE5" />
                <stop offset="100%" stopColor="#C4B5FD" />
              </linearGradient>
            </defs>
            {nodes.slice(0, -1).map((_, i) => {
              const x1 = (i + 0.5) * (100 / nodes.length);
              const x2 = (i + 1.5) * (100 / nodes.length);
              const mid = (x1 + x2) / 2;
              return (
                <g key={i}>
                  <path d={`M ${x1}% 40 C ${mid}% 0, ${mid}% 80, ${x2}% 40`} stroke="url(#pathGradBg)" strokeWidth="14" fill="none" strokeLinecap="round" />
                  <path
                    d={`M ${x1}% 40 C ${mid}% 0, ${mid}% 80, ${x2}% 40`}
                    stroke="url(#pathGrad)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={i < currentIndex ? '0' : '8 6'}
                    opacity={i < currentIndex ? 1 : 0.6}
                  />
                </g>
              );
            })}
          </svg>
          <div className="relative flex justify-between">
            {nodes.map((node, idx) => {
              const isCurrent = idx === currentIndex;
              const isPast = idx < currentIndex;
              const gradientClass = isPast
                ? 'from-emerald-400 to-emerald-600'
                : isCurrent
                ? 'from-space-indigo-500 via-lavender-500 to-emerald-500 animate-pulse-glow'
                : 'from-slate-300 to-slate-400';
              return (
                <div key={node.id} className="relative flex w-[20%] flex-col items-center" style={{ paddingTop: isCurrent ? '2rem' : '0' }}>
                  <div className="relative">
                    <div
                      className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-xl font-heading text-xl font-bold border-4 border-white',
                        gradientClass
                      )}
                    >
                      {node.level.charAt(0).toUpperCase()}
                    </div>
                    {isCurrent && (
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        className="absolute -top-6 -right-4"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-gold-400 text-white shadow-lg">
                          <Flag className="h-4 w-4" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="mt-5 text-center">
                    <h4 className="font-heading text-base font-bold text-slate-900">{node.jobName}</h4>
                    <p className="mt-1 text-xs text-slate-500">{node.estimatedMonths > 0 ? `${node.estimatedMonths} 个月可达` : '当前岗位'}</p>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-gold-50 to-amber-gold-100 px-3 py-1 text-xs font-semibold text-amber-gold-700 border border-amber-gold-200">
                      <DollarSign className="h-3 w-3" />
                      {node.avgSalaryRange[0]}K - {node.avgSalaryRange[1]}K
                    </div>
                  </div>
                  {node.keyThresholds.length > 0 && (
                    <div className="mt-3 w-full space-y-1 rounded-xl border border-slate-100 bg-white/60 p-3 text-left">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">关键门槛</p>
                      {node.keyThresholds.map((t, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-lavender-400" />
                          <span className="leading-snug">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function LearningPlanSection({
  phases,
  completedTasks,
  setCompletedTasks,
}: {
  phases: DiagnosisReport['learningPlan'];
  completedTasks: Record<string, boolean>;
  setCompletedTasks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();
  const phaseColors = [
    { from: 'from-space-indigo-500', to: 'to-space-indigo-400', badge: 'bg-space-indigo-100 text-space-indigo-700', bar: 'from-space-indigo-400 to-lavender-400' },
    { from: 'from-lavender-500', to: 'to-lavender-400', badge: 'bg-lavender-100 text-lavender-700', bar: 'from-lavender-400 to-emerald-400' },
    { from: 'from-amber-gold-500', to: 'to-amber-gold-400', badge: 'bg-amber-gold-100 text-amber-gold-700', bar: 'from-amber-gold-400 to-red-400' },
  ] as const;

  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className="scroll-mt-8">
      <SectionTitle icon={BookOpen} title="三阶段学习计划" description="分阶段落地执行，步步为营达成目标" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {phases.map((phase, idx) => {
          const colors = phaseColors[idx];
          const phaseKey = `phase-${idx}`;
          const totalTasks = phase.tasks.length;
          const doneCount = phase.tasks.filter((_, ti) => completedTasks[`${phaseKey}-${ti}`]).length;
          const percent = Math.round((doneCount / totalTasks) * 100);
          return (
            <motion.div key={phase.phase} variants={fadeInUp} custom={idx}>
              <div className="glass-card overflow-hidden">
                <div className={cn('bg-gradient-to-r px-5 py-4', colors.from, colors.to, 'text-white')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold">{phase.phase}</h3>
                      <p className="mt-0.5 text-xs text-white/80">第 {idx + 1} 阶段</p>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', colors.badge)}>{phase.durationWeeks} 周</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
                      <span>阶段进度</span>
                      <span className="font-semibold text-white">{doneCount}/{totalTasks} · {percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + idx * 0.1 }}
                        className={cn('h-full rounded-full bg-gradient-to-r', colors.bar)}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  {phase.tasks.map((task, ti) => {
                    const taskKey = `${phaseKey}-${ti}`;
                    const done = !!completedTasks[taskKey];
                    return (
                      <button
                        key={ti}
                        onClick={() => setCompletedTasks((prev) => ({ ...prev, [taskKey]: !prev[taskKey] }))}
                        className={cn(
                          'w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all',
                          done ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                            done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                          )}
                        >
                          {done && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                        <span className={cn('text-sm leading-relaxed', done ? 'text-slate-500 line-through' : 'text-slate-700')}>{task}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function RecommendedJobsBanner({
  jobs,
  onNavigate,
}: {
  jobs: Array<{ id: string; title: string; company: string; city: string; salary: string; match: number }>;
  onNavigate: () => void;
}) {
  const { ref, inView } = useScrollInView<HTMLDivElement>();
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className="scroll-mt-8">
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-emerald-500"
      >
        <div className="relative rounded-[calc(1.5rem-2px)] bg-gradient-to-br from-space-indigo-600 via-lavender-600 to-space-indigo-700 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-400 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-gold-400 blur-3xl" />
          </div>
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10">
            <div className="lg:col-span-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-gold-300" />
                智能职位匹配
              </div>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-bold leading-tight">
                基于你的诊断报告
                <br />
                <span className="bg-gradient-to-r from-amber-gold-300 to-emerald-300 bg-clip-text text-transparent">
                  智能匹配了 {jobs.length * 5} 个高成长职位
                </span>
              </h2>
              <p className="mt-3 text-sm text-white/80">
                根据你的能力差距、学习计划和市场趋势，为你筛选出匹配度最高、成长空间最大的机会。
              </p>
              <button
                onClick={onNavigate}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-space-indigo-700 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              >
                查看推荐职位
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {jobs.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                  className="rounded-2xl bg-white/95 backdrop-blur p-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
                  onClick={onNavigate}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      {job.match}% 匹配
                    </span>
                  </div>
                  <h3 className="font-heading text-sm font-bold text-slate-900 leading-tight">{job.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{job.company}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.city}
                    </span>
                  </div>
                  <p className="mt-2 font-heading text-sm font-bold bg-gradient-to-r from-space-indigo-600 to-lavender-600 bg-clip-text text-transparent">
                    {job.salary}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
