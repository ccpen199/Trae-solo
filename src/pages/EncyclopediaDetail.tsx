import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ArrowLeft,
  Play,
  TrendingUp,
  Clock,
  Award,
  DollarSign,
  Gauge,
  Target,
  Flame,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  Wrench,
  Rocket,
  Briefcase,
  BarChart3,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  Pause,
  FastForward,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { encyclopediaApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type {
  EncyclopediaEntry,
  WorkflowStep,
  EntryThresholdStep,
  Certification,
  CareerDirection,
} from '@shared/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const avatarColors = [
  { bg: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-200' },
  { bg: 'from-lavender-400 to-purple-500', ring: 'ring-lavender-200' },
  { bg: 'from-space-indigo-400 to-blue-500', ring: 'ring-space-indigo-200' },
  { bg: 'from-amber-gold-400 to-orange-500', ring: 'ring-amber-gold-200' },
  { bg: 'from-rose-400 to-pink-500', ring: 'ring-rose-200' },
];

function getAvatar(ch: string, colorIdx: number, size: 'sm' | 'md' | 'lg' | 'xl' = 'md') {
  const colors = avatarColors[colorIdx % avatarColors.length];
  const sizeMap = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  };
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${colors.bg} ring-4 ring-white flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}
    >
      {ch}
    </div>
  );
}

function difficultyBadge(level: number) {
  if (level <= 2) return <Badge variant="emerald" size="sm">低门槛</Badge>;
  if (level <= 3) return <Badge variant="gold" size="sm">中等</Badge>;
  return <Badge variant="purple" size="sm">高门槛</Badge>;
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < level ? 'fill-amber-gold-400 text-amber-gold-400' : 'fill-slate-200 text-slate-200'}`}
        />
      ))}
    </div>
  );
}

const DEFAULT_CERTIFICATIONS: (Certification & { passRate: number; relevance: number })[] = [
  { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', difficulty: 'advanced', estimatedHours: 150, relevance: 0.85, passRate: 65 },
  { id: 'c2', name: 'Google Professional Cloud Architect', issuer: 'Google', difficulty: 'advanced', estimatedHours: 140, relevance: 0.82, passRate: 60 },
  { id: 'c3', name: 'CKA Kubernetes Administrator', issuer: 'CNCF', difficulty: 'intermediate', estimatedHours: 100, relevance: 0.78, passRate: 72 },
  { id: 'c4', name: 'Meta Front-End Developer', issuer: 'Meta', difficulty: 'basic', estimatedHours: 60, relevance: 0.75, passRate: 85 },
];

const DEFAULT_CAREER_DIRECTIONS: CareerDirection[] = [
  {
    id: 'd1',
    title: '纵向晋升',
    type: 'vertical',
    description: '沿技术深度深耕，从初级到专家',
    targetRoles: ['初级→中级→高级→资深→技术专家'],
    typicalYears: 5,
    avgSalary: [15000, 80000],
  },
  {
    id: 'd2',
    title: '横向转型',
    type: 'horizontal',
    description: '跨职能发展，拓展职业边界',
    targetRoles: ['前端→全栈→技术架构→产品管理'],
    typicalYears: 3,
    avgSalary: [20000, 60000],
  },
  {
    id: 'd3',
    title: '专家路线',
    type: 'expert',
    description: '成为特定领域的技术权威',
    targetRoles: ['前端→性能优化→工程化→架构师'],
    typicalYears: 7,
    avgSalary: [30000, 120000],
  },
  {
    id: 'd4',
    title: '管理路线',
    type: 'management',
    description: '从个人贡献者走向团队管理',
    targetRoles: ['高级→TL→前端负责人→技术总监'],
    typicalYears: 6,
    avgSalary: [35000, 150000],
  },
];

const WORKFLOW_TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];

const PRACTITIONERS = [
  {
    id: 'p1',
    name: '张明',
    avatar: '张',
    years: 6,
    city: '北京',
    level: '资深前端工程师',
    duration: 24 * 60 + 35,
    speed: [1, 1.25, 1.5, 2],
    currentSpeed: 1,
    tags: ['转行建议', '加班情况', '薪资真相', '入行建议'],
    insights: [
      { text: '基础永远是最重要的，框架会变，但HTML/CSS/JS不会', highlight: true },
      { text: '第一份工作尽量选大厂，培训体系完善', highlight: true },
      { text: '不要只写业务代码，多关注工程化和性能优化', highlight: false },
      { text: '沟通能力比技术能力更决定你的天花板', highlight: true },
    ],
    transcript:
      '大家好我是张明，做前端已经6年了，目前在字节跳动做资深前端工程师。很多同学问我前端是不是已经饱和了，我觉得不是饱和了，而是低端产能过剩，高端人才永远稀缺。我当年是从测试转行的，转行最大的障碍不是技术而是心理落差...',
  },
  {
    id: 'p2',
    name: '李慧',
    avatar: '李',
    years: 4,
    city: '上海',
    level: '高级前端工程师',
    duration: 18 * 60 + 20,
    speed: [1, 1.25, 1.5, 2],
    currentSpeed: 1,
    tags: ['学习方法', '项目实战', '面试技巧'],
    insights: [
      { text: '做项目的时候要思考为什么这么做，而不只是怎么做', highlight: true },
      { text: '面试前至少刷100道算法题，手写题和源码同样重要', highlight: false },
      { text: '简历用STAR法则，量化成果，不要写形容词', highlight: true },
    ],
    transcript:
      '我是李慧，上海某电商的高级前端。今天想和大家分享一下我的学习方法论。很多同学学习的时候喜欢看视频记笔记，但是我发现动手实践才是最重要的...',
  },
  {
    id: 'p3',
    name: '王强',
    avatar: '王',
    years: 8,
    city: '深圳',
    level: '前端架构师',
    duration: 32 * 60 + 10,
    speed: [1, 1.25, 1.5, 2],
    currentSpeed: 1,
    tags: ['架构设计', '技术管理', '职业规划'],
    insights: [
      { text: '架构师不是头衔，而是一种思维方式：全局视角', highlight: true },
      { text: '当TL后最大的转变是从"我"变成"我们"', highlight: true },
      { text: '技术选型永远看业务场景，不要追热点', highlight: true },
    ],
    transcript:
      '大家好我是王强，8年前端经验，现在在腾讯做架构师。很多同学问我怎么从高级工程师走向架构师，我觉得关键是从"做事"到"谋局"的思维转变...',
  },
];

const SALARY_BAR_COLORS = [
  '#10B981',
  '#34D399',
  '#6EE7B7',
  '#8B5CF6',
  '#A78BFA',
  '#C4B5FD',
  '#3A5FA8',
  '#6086C6',
  '#94AED9',
  '#F59E0B',
];

export default function EncyclopediaDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const diagnosisReport = useAppStore((s) => s.currentDiagnosisReport);

  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [audioSpeeds, setAudioSpeeds] = useState<Record<string, number>>({});
  const audioTimerRef = useRef<number | null>(null);

  const currentProgressPercent = useMemo(() => {
    if (!diagnosisReport) return 0;
    const total = diagnosisReport.learningPlan.reduce((s, p) => s + p.durationWeeks, 0);
    const estimated = diagnosisReport.estimatedReadinessMonths * 4;
    return Math.min(100, Math.round((1 - Math.min(total, estimated) / Math.max(estimated, 1)) * 100));
  }, [diagnosisReport]);

  useEffect(() => {
    if (!jobId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    encyclopediaApi
      .getJobById(jobId)
      .then((data) => {
        if (data) {
          setEntry(data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [jobId]);

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
    };
  }, []);

  const togglePlay = (id: string, duration: number) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
      if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
      return;
    }
    setPlayingAudioId(id);
    if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
    const speed = audioSpeeds[id] || 1;
    audioTimerRef.current = window.setInterval(() => {
      setAudioProgress((prev) => {
        const current = prev[id] || 0;
        const next = current + speed;
        if (next >= duration) {
          if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
          setPlayingAudioId(null);
          return { ...prev, [id]: 0 };
        }
        return { ...prev, [id]: next };
      });
    }, 1000);
  };

  const toggleTranscript = (id: string) => {
    setExpandedTranscripts((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const salaryBarData = useMemo(() => {
    if (!entry) return [];
    return entry.avgSalaryDistribution.map((s) => ({
      city: s.city,
      平均月薪: Math.round(s.avg / 100) / 10,
    }));
  }, [entry]);

  const salaryLineData = useMemo(() => [
    { level: '初级', 薪资: 12 },
    { level: '中级', 薪资: 22 },
    { level: '高级', 薪资: 35 },
    { level: '专家', 薪资: 55 },
    { level: '资深专家', 薪资: 80 },
  ], []);

  const defaultLadderSteps: EntryThresholdStep[] = [
    { step: 1, title: '入门准备', description: '掌握基础概念和开发工具，完成第一个项目', estimatedMonths: 3, typicalObstacles: ['基础不扎实', '环境搭建困难', '缺乏系统性学习'] },
    { step: 2, title: '基础技能', description: '熟练掌握核心技术栈，独立完成常规任务', estimatedMonths: 6, typicalObstacles: ['知识碎片化', '调试能力弱', '最佳实践缺乏'] },
    { step: 3, title: '项目实战', description: '参与真实项目，掌握工程化和协作流程', estimatedMonths: 9, typicalObstacles: ['项目经验不足', 'Git协作不熟悉', '代码质量差'] },
    { step: 4, title: '求职面试', description: '刷题、优化简历、面试实战', estimatedMonths: 3, typicalObstacles: ['简历关难过', '算法面试卡壳', '薪资谈判劣势'] },
    { step: 5, title: '入职适应', description: '快速融入团队，建立职场口碑', estimatedMonths: 3, typicalObstacles: ['新人期焦虑', '业务理解慢', '沟通障碍'] },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500">正在加载职业百科...</p>
        </div>
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-6">
        <Card variant="glass" className="max-w-md w-full p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-gold-100 to-rose-100 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-amber-gold-600" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-3">岗位未找到</h2>
          <p className="text-slate-500 mb-8">
            你访问的职业百科条目不存在，可能已被移除或ID有误。
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
              返回上一页
            </Button>
            <Button onClick={() => navigate('/encyclopedia')}>浏览职业百科</Button>
          </div>
        </Card>
      </div>
    );
  }

  const avgSalary =
    entry.avgSalaryDistribution.reduce((s, c) => s + c.avg, 0) /
    Math.max(entry.avgSalaryDistribution.length, 1);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none top-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute top-80 right-20 w-[480px] h-[480px] rounded-full bg-lavender-200/30 blur-3xl" />
        <div className="absolute bottom-60 left-1/3 w-80 h-80 rounded-full bg-space-indigo-200/20 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.nav variants={fadeIn} initial="hidden" animate="show" className="mb-6 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/encyclopedia"
              className="text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              职业百科
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">{entry.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-700">{entry.jobName}</span>
          </div>
        </motion.nav>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mb-10"
        >
          <motion.div variants={fadeInUp}>
            <div className="relative rounded-3xl overflow-hidden">
              <div
                className="absolute inset-0 rounded-3xl p-[2px]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(52,211,153,0.6) 0%, rgba(167,139,250,0.6) 50%, rgba(58,95,168,0.6) 100%)',
                  WebkitMask:
                    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              <div className="glass-card rounded-3xl p-8 lg:p-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/50 to-lavender-200/40 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-lavender-200/50 to-space-indigo-200/40 blur-3xl" />

                <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="emerald" size="md" withDot>
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        热门岗位
                      </Badge>
                      <Badge variant="indigo" size="md">
                        {entry.category}
                      </Badge>
                    </div>
                    <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
                      <span className="gradient-text">{entry.jobName}</span>
                    </h1>
                    <p className="text-slate-600 leading-relaxed text-base">{entry.overview}</p>
                  </div>

                  <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                    <StatBlock label="平均薪资" value={`¥${Math.round(avgSalary / 1000)}K`} unit="/月" icon={<DollarSign className="w-5 h-5" />} gradient="from-emerald-500 to-teal-500" />
                    <StatBlock label="需求增长" value="+18%" unit="3年" icon={<TrendingUp className="w-5 h-5" />} gradient="from-lavender-500 to-purple-500" />
                    <StatBlock label="入行门槛" value="中等" unit="3/5星" icon={<Gauge className="w-5 h-5" />} gradient="from-amber-gold-500 to-orange-500" />
                    <StatBlock label="竞争强度" value="中高" unit="⭐⭐⭐⭐" icon={<Flame className="w-5 h-5" />} gradient="from-space-indigo-500 to-blue-500" />
                  </div>

                  <div className="lg:col-span-3 flex flex-col gap-3">
                    <Button
                      size="lg"
                      fullWidth
                      rightIcon={<Rocket className="w-5 h-5" />}
                      onClick={() => navigate('/onboarding')}
                    >
                      我要入行
                    </Button>
                    <Button variant="outline" size="lg" fullWidth leftIcon={<BarChart3 className="w-5 h-5" />}>
                      做能力诊断
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                      <Users className="w-3.5 h-3.5" />
                      已有 <span className="font-semibold text-slate-700">12,458</span> 人通过此页开始规划
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <div className="space-y-14">
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <SectionTitle
              eyebrow="真实工作流"
              title="一天的真实工作流"
              subtitle="来自一线从业者真实记录，还原这个岗位的日常节奏"
            />

            <motion.div variants={fadeInUp} className="mb-8">
              <div className="relative rounded-3xl overflow-hidden group">
                <div
                  className="aspect-[16/9] w-full rounded-3xl relative cursor-pointer"
                  style={{
                    background:
                      'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1e3a5f 60%, #065f46 100%)',
                  }}
                >
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 800 450">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52,211,153,0.2)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-2xl"
                    >
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </motion.button>
                  </div>
                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <Badge variant="default" className="bg-black/40 text-white border-white/20 backdrop-blur">
                      <Play className="w-3 h-3 mr-1" fill="white" />
                      真实工作流记录
                    </Badge>
                    <Badge variant="default" className="bg-black/40 text-white border-white/20 backdrop-blur">
                      <Clock className="w-3 h-3 mr-1" />
                      08:42
                    </Badge>
                  </div>
                  <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-medium backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    已完结
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="relative pl-10">
                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-300 via-lavender-300 to-space-indigo-300 rounded-full" />

                {(entry.workflow.length > 0 ? entry.workflow : [
                  { title: '晨会与任务同步', description: '团队站会同步进度，明确今日任务和 blockers', duration: '30min', tools: ['飞书', 'Jira'] },
                  { title: '核心编码', description: '进行需求开发，完成核心模块的编码与自测', duration: '2.5h', tools: ['VSCode', 'Git', 'TypeScript'] },
                  { title: '午休 & 技术学习', description: '午餐休息 + 阅读技术博客或掘金社区', duration: '1.5h', tools: ['掘金', '知乎', 'Medium'] },
                  { title: '代码评审', description: 'Review同事PR，提出修改意见，确保代码质量', duration: '1h', tools: ['GitLab', 'SonarQube'] },
                  { title: '联调测试', description: '与后端/测试联调接口，修复bug', duration: '2h', tools: ['Postman', 'Chrome DevTools'] },
                  { title: '技术方案讨论', description: '参与下周需求的技术方案评审会', duration: '1h', tools: ['飞书文档', 'XMind'] },
                  { title: '总结与计划', description: '完成日报，梳理明日待办，整理技术沉淀', duration: '30min', tools: ['Notion', '飞书'] },
                ]).map((step: WorkflowStep, i: number) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    transition={{ delay: i * 0.07 }}
                    className="relative mb-6 last:mb-0"
                  >
                    <div className="absolute -left-[26px] top-4 w-12 h-12 rounded-full bg-white border-4 border-emerald-200 shadow-lg flex items-center justify-center z-10">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-lavender-500 flex items-center justify-center text-white text-xs font-bold">
                        {i + 1}
                      </div>
                    </div>

                    <Card variant="glass" hoverable className="p-5 pl-6">
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            {WORKFLOW_TIMES[i % WORKFLOW_TIMES.length]}
                          </span>
                          <h4 className="font-heading font-bold text-lg text-slate-900">
                            {step.title}
                          </h4>
                        </div>
                        <Badge variant="gold" size="sm">
                          <Clock className="w-3 h-3 mr-1" />
                          {step.duration}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{step.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                          <Wrench className="w-3 h-3" /> 使用工具：
                        </span>
                        {step.tools.map((t) => (
                          <Badge key={t} variant="info" size="sm">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <SectionTitle
              eyebrow="入行路径"
              title="入行门槛阶梯图"
              subtitle="从零基础到成功入职，科学拆解每个阶段的关键任务与典型障碍"
            />

            <motion.div variants={fadeInUp}>
              <Card variant="glass" className="p-6 lg:p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <div>
                    <h4 className="font-heading font-bold text-lg text-slate-900 mb-1">你的当前进度</h4>
                    <p className="text-sm text-slate-500">
                      {diagnosisReport
                        ? '基于你的诊断报告同步计算'
                        : '未做诊断，默认为0%，完成诊断后可同步'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-4xl font-bold gradient-text">{currentProgressPercent}%</div>
                      <div className="text-xs text-slate-500 mt-0.5">准备就绪度</div>
                    </div>
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="#E2E8F0" strokeWidth="8" fill="none" />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="url(#progressGrad)"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: '0 201' }}
                          whileInView={{
                            strokeDasharray: `${(currentProgressPercent / 100) * 201} 201`,
                          }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                        />
                        <defs>
                          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Target className="w-6 h-6 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative pt-6 pb-4">
                  <svg viewBox="0 0 900 360" className="w-full h-auto block">
                    <defs>
                      <linearGradient id="ladderLine" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6EE7B7" />
                        <stop offset="50%" stopColor="#A78BFA" />
                        <stop offset="100%" stopColor="#3A5FA8" />
                      </linearGradient>
                      <linearGradient id="stepBg1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D1FAE5" />
                        <stop offset="100%" stopColor="#A7F3D0" />
                      </linearGradient>
                      <linearGradient id="stepBg2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#EDE9FE" />
                        <stop offset="100%" stopColor="#DDD6FE" />
                      </linearGradient>
                      <linearGradient id="stepBg3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C8D6EC" />
                        <stop offset="100%" stopColor="#94AED9" />
                      </linearGradient>
                    </defs>

                    {(entry.entryThresholdLadder && entry.entryThresholdLadder.length > 0
                      ? entry.entryThresholdLadder
                      : defaultLadderSteps
                    ).slice(0, 5).map((step, i) => {
                      const x = 30 + i * 170;
                      const y = 300 - i * 55;
                      const reached = currentProgressPercent >= ((i + 1) * 20);
                      const bgs = ['stepBg1', 'stepBg2', 'stepBg3', 'stepBg2', 'stepBg1'];
                      return (
                        <g key={step.step}>
                          {i < 4 && (
                            <motion.line
                              x1={x + 110}
                              y1={y - 15}
                              x2={x + 180}
                              y2={y - 70}
                              stroke="url(#ladderLine)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray="10 6"
                              initial={{ pathLength: 0, opacity: 0 }}
                              whileInView={{ pathLength: 1, opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                            />
                          )}
                          <motion.rect
                            x={x}
                            y={y}
                            width="120"
                            height="44"
                            rx="14"
                            fill={`url(#${bgs[i]})`}
                            stroke={reached ? '#10B981' : 'rgba(148,163,184,0.3)'}
                            strokeWidth="2"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                          />
                          <motion.text
                            x={x + 60}
                            y={y + 28}
                            textAnchor="middle"
                            fill="#0F172A"
                            fontSize="15"
                            fontWeight="700"
                            fontFamily="Space Grotesk, system-ui, sans-serif"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                          >
                            Step{step.step} · {step.title}
                          </motion.text>
                          <motion.text
                            x={x + 60}
                            y={y + 58}
                            textAnchor="middle"
                            fill="#64748B"
                            fontSize="11"
                            fontWeight="500"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                          >
                            约{step.estimatedMonths}个月
                          </motion.text>
                          {reached && (
                            <motion.circle
                              cx={x + 108}
                              cy={y + 6}
                              r="12"
                              fill="#10B981"
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.3, delay: 0.6 + i * 0.1, type: 'spring' }}
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="grid md:grid-cols-5 gap-4 mt-4">
                  {(entry.entryThresholdLadder && entry.entryThresholdLadder.length > 0
                    ? entry.entryThresholdLadder
                    : defaultLadderSteps
                  ).slice(0, 5).map((step, i) => {
                    const reached = currentProgressPercent >= ((i + 1) * 20);
                    return (
                      <Card
                        key={step.step}
                        variant="default"
                        className={`p-4 h-full ${reached ? 'ring-2 ring-emerald-300/60' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                reached
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {reached ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                            </div>
                            <span className="font-bold text-sm text-slate-900">{step.title}</span>
                          </div>
                          <Badge variant={reached ? 'emerald' : 'info'} size="sm">
                            {step.estimatedMonths}月
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">{step.description}</p>
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                            ⚠ 典型障碍
                          </div>
                          <ul className="text-[11px] text-slate-500 space-y-0.5">
                            {step.typicalObstacles.slice(0, 2).map((o) => (
                              <li key={o}>· {o}</li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <SectionTitle
              eyebrow="深度访谈"
              title="从业者深度访谈"
              subtitle="倾听真实从业者的声音，了解岗位最真实的酸甜苦辣"
            />

            <div className="space-y-5">
              {PRACTITIONERS.map((p, idx) => {
                const isPlaying = playingAudioId === p.id;
                const progress = audioProgress[p.id] || 0;
                const progressPct = Math.min(100, (progress / p.duration) * 100);
                const speed = audioSpeeds[p.id] || 1;
                const expanded = expandedTranscripts.has(p.id);

                return (
                  <motion.div key={p.id} variants={scaleIn} transition={{ delay: idx * 0.08 }}>
                    <Card variant="glass" className="p-6 lg:p-7 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-100/50 to-lavender-100/40 blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70" />

                      <div className="relative z-10">
                        <div className="flex items-start gap-4 mb-5 flex-wrap">
                          {getAvatar(p.avatar, idx, 'lg')}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-heading font-bold text-xl text-slate-900">{p.name}</h4>
                              <Badge variant="emerald" size="sm">
                                {p.tags[0]}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                              {p.level} · {p.years}年经验 · {p.city}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {p.tags.slice(1).map((t) => (
                              <Badge key={t} variant="indigo" size="sm">
                                #{t}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/70 p-4 lg:p-5 mb-5">
                          <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => togglePlay(p.id, p.duration)}
                              className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-lavender-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200/60 flex-shrink-0"
                            >
                              {isPlaying ? (
                                <Pause className="w-5 h-5" fill="white" />
                              ) : (
                                <Play className="w-5 h-5 ml-0.5" fill="white" />
                              )}
                            </motion.button>

                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-end gap-0.5 h-10 mb-1.5">
                                {[...Array(48)].map((_, bi) => {
                                  const active = (bi / 48) * 100 < progressPct;
                                  const h = 15 + Math.abs(Math.sin(bi * 0.7 + idx)) * 25;
                                  return (
                                    <motion.div
                                      key={bi}
                                      className={`w-1.5 rounded-full ${
                                        active
                                          ? 'bg-gradient-to-t from-emerald-400 to-lavender-500'
                                          : 'bg-slate-200'
                                      } ${isPlaying ? 'animate-pulse' : ''}`}
                                      style={{
                                        height: `${h}%`,
                                        animationDelay: `${bi * 20}ms`,
                                      }}
                                      initial={{ height: 0 }}
                                      whileInView={{ height: `${h}%` }}
                                      viewport={{ once: true }}
                                      transition={{ duration: 0.3, delay: bi * 0.01 }}
                                    />
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                <span>
                                  {Math.floor(progress / 60)}:{String(progress % 60).padStart(2, '0')}
                                </span>
                                <span className="font-semibold text-slate-600">
                                  {isPlaying ? '正在播放...' : '点击播放'}
                                </span>
                                <span>
                                  {Math.floor(p.duration / 60)}:
                                  {String(p.duration % 60).padStart(2, '0')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                              {p.speed.map((s) => (
                                <button
                                  key={s}
                                  onClick={() =>
                                    setAudioSpeeds((prev) => ({ ...prev, [p.id]: s }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    speed === s
                                      ? 'bg-gradient-to-br from-emerald-500 to-lavender-500 text-white shadow-sm'
                                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {s}x
                                </button>
                              ))}
                              <button className="px-2 py-1 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                                <FastForward className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mb-5">
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            核心洞察
                          </div>
                          <div className="grid md:grid-cols-2 gap-2">
                            {p.insights.map((ins, ii) => (
                              <div
                                key={ii}
                                className={`p-3 rounded-xl text-sm leading-relaxed ${
                                  ins.highlight
                                    ? 'bg-gradient-to-br from-emerald-50 to-lavender-50 border border-emerald-100 text-slate-800 font-medium'
                                    : 'bg-slate-50 border border-slate-100 text-slate-600'
                                }`}
                              >
                                {ins.highlight && (
                                  <span className="text-emerald-600 font-bold mr-1">💎</span>
                                )}
                                {ins.text}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => toggleTranscript(p.id)}
                          className="w-full flex items-center justify-between text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors py-2 border-t border-slate-100"
                        >
                          <span className="flex items-center gap-1.5">
                            📝 查看文字稿全文
                          </span>
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 pb-2">
                                <div className="bg-slate-50/70 rounded-xl p-5 text-sm text-slate-600 leading-loose border border-slate-100">
                                  {p.transcript}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <SectionTitle
              eyebrow="数据洞察"
              title="薪资与前景"
              subtitle="用数据说话，全面了解这个职业的回报与长期发展方向"
            />

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <motion.div variants={scaleIn}>
                <Card variant="glass" className="p-6 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h4 className="font-heading font-bold text-lg text-slate-900">
                        10城市平均月薪对比
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">数据来源：2025年市场调研</p>
                    </div>
                    <Badge variant="emerald" size="sm" withDot>
                      <DollarSign className="w-3 h-3 mr-1" />
                      单位：K
                    </Badge>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salaryBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis
                          dataKey="city"
                          stroke="#64748B"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}K`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(16,185,129,0.05)' }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                            padding: '10px 14px',
                          }}
                          itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                          formatter={(v: number) => [`${v}K`, '平均月薪']}
                        />
                        <Bar dataKey="平均月薪" radius={[10, 10, 0, 0]} maxBarSize={42}>
                          {salaryBarData.map((_, i) => (
                            <Cell key={i} fill={SALARY_BAR_COLORS[i % SALARY_BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={scaleIn} transition={{ delay: 0.05 }}>
                <Card variant="glass" className="p-6 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h4 className="font-heading font-bold text-lg text-slate-900">
                        5年薪资增长趋势
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">初级→中级→高级→专家→资深专家</p>
                    </div>
                    <Badge variant="gold" size="sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      成长曲线
                    </Badge>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salaryLineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="50%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#3A5FA8" />
                          </linearGradient>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis
                          dataKey="level"
                          stroke="#64748B"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}K`}
                        />
                        <Tooltip
                          cursor={{ stroke: '#8B5CF6', strokeDasharray: '4 4' }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                            padding: '10px 14px',
                          }}
                          itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                          formatter={(v: number) => [`${v}K/月`, '平均薪资']}
                        />
                        <Line
                          type="monotone"
                          dataKey="薪资"
                          stroke="url(#lineGrad)"
                          strokeWidth={4}
                          dot={{ r: 6, strokeWidth: 3, fill: 'white', stroke: '#10B981' }}
                          activeDot={{ r: 10, strokeWidth: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp}>
              <Card variant="glass" className="p-6 lg:p-8">
                <div className="mb-6">
                  <h4 className="font-heading font-bold text-xl text-slate-900 mb-1">
                    职业发展方向矩阵
                  </h4>
                  <p className="text-sm text-slate-500">
                    4条主流发展路径，总有一条适合你
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {DEFAULT_CAREER_DIRECTIONS.map((d, i) => {
                    const colors = [
                      { from: 'from-emerald-500', to: 'to-teal-500', icon: ArrowUpRight, ring: 'ring-emerald-100', bg: 'bg-emerald-50' },
                      { from: 'from-lavender-500', to: 'to-purple-500', icon: TrendingUp, ring: 'ring-lavender-100', bg: 'bg-lavender-50' },
                      { from: 'from-space-indigo-500', to: 'to-blue-500', icon: Target, ring: 'ring-space-indigo-100', bg: 'bg-space-indigo-50' },
                      { from: 'from-amber-gold-500', to: 'to-orange-500', icon: Users, ring: 'ring-amber-gold-100', bg: 'bg-amber-gold-50' },
                    ];
                    const c = colors[i % colors.length];
                    const Icon = c.icon;
                    return (
                      <Card
                        key={d.id}
                        variant="default"
                        hoverable
                        glowOnHover
                        className="p-6 relative overflow-hidden group"
                      >
                        <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${c.bg} blur-2xl opacity-80 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-white shadow-lg ring-4 ${c.ring}`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            {i === 0 && (
                              <Badge variant="emerald" size="sm" withDot>
                                推荐
                              </Badge>
                            )}
                          </div>
                          <h5 className="font-heading font-bold text-lg text-slate-900 mb-1">
                            {d.title}
                          </h5>
                          <p className="text-sm text-slate-500 leading-relaxed mb-4">{d.description}</p>

                          <div className="space-y-2 mb-4 py-3 border-y border-slate-100">
                            {d.targetRoles.map((r) => (
                              <div key={r} className="flex items-center gap-2 text-sm text-slate-600">
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="truncate">{r}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-slate-400 mb-0.5">典型周期</div>
                              <div className="font-bold text-slate-800">{d.typicalYears}年</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] text-slate-400 mb-0.5">薪资范围</div>
                              <div className="font-bold gradient-text text-base">
                                ¥{(d.avgSalary[0] / 1000).toFixed(0)}K-
                                {(d.avgSalary[1] / 1000).toFixed(0)}K
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <SectionTitle
              eyebrow="权威认证"
              title="相关认证推荐"
              subtitle="行业公认的高含金量证书，为你的简历增加竞争力"
            />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {(DEFAULT_CERTIFICATIONS as (Certification & {
                passRate: number;
                relevance: number;
              })[]).map((cert, i) => {
                const bgColors = [
                  'from-emerald-100 to-emerald-50',
                  'from-lavender-100 to-lavender-50',
                  'from-space-indigo-100 to-space-indigo-50',
                  'from-amber-gold-100 to-amber-gold-50',
                ];
                const borderColors = [
                  'border-emerald-200',
                  'border-lavender-200',
                  'border-space-indigo-200',
                  'border-amber-gold-200',
                ];
                const iconColors = [
                  'text-emerald-600',
                  'text-lavender-600',
                  'text-space-indigo-600',
                  'text-amber-gold-600',
                ];
                return (
                  <motion.div key={cert.id} variants={scaleIn} transition={{ delay: i * 0.07 }}>
                    <Card variant="default" glowOnHover hoverable className="p-6 h-full group">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgColors[i % 4]} border ${borderColors[i % 4]} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Award className={`w-7 h-7 ${iconColors[i % 4]}`} />
                      </div>

                      <div className="mb-4">
                        <h5 className="font-heading font-bold text-slate-900 mb-1 leading-snug line-clamp-2">
                          {cert.name}
                        </h5>
                        <p className="text-xs text-slate-500">{cert.issuer}</p>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">难度</span>
                          {cert.difficulty === 'basic' ? (
                            <Badge variant="emerald" size="sm">入门</Badge>
                          ) : cert.difficulty === 'intermediate' ? (
                            <Badge variant="gold" size="sm">中级</Badge>
                          ) : (
                            <Badge variant="purple" size="sm">高级</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">学时</span>
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {cert.estimatedHours}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">通过率</span>
                          <span className="font-bold text-emerald-600">{cert.passRate}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500">岗位相关度</span>
                          <span className="font-semibold text-slate-700">{cert.relevance}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 transition-all duration-700"
                            style={{ width: `${cert.relevance}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  unit,
  icon,
  gradient,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-[0.07] group-hover:opacity-15 transition-opacity" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
      <div className="relative p-4 rounded-2xl border border-slate-100/70 bg-white/50 backdrop-blur-sm">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm mb-3`}>
          {icon}
        </div>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-heading font-bold text-2xl text-slate-900 tracking-tight">{value}</span>
          {unit && <span className="text-xs text-slate-400">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {eyebrow}
      </div>
      <h2 className="font-heading text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
        {title}
      </h2>
      {subtitle && <p className="text-slate-500 text-base max-w-2xl">{subtitle}</p>}
    </motion.div>
  );
}