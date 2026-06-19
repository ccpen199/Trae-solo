import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
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
import {
  Brain,
  Target,
  TrendingUp,
  BookOpen,
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Rocket,
  Play,
  Briefcase,
  MapPin,
  DollarSign,
  Star,
  Quote,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function useCountUp(end: number, duration = 2000, start = true) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * end);
      if (current !== countRef.current) {
        countRef.current = current;
        setCount(current);
      }
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startTimeRef.current = null;
      countRef.current = 0;
    };
  }, [end, duration, start]);

  return count;
}

function StatCard({
  value,
  suffix,
  label,
  icon,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  delay: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const count = useCountUp(value, 2000, isInView);

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      transition={{ delay }}
    >
      <Card variant="glass" hoverable className="p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 text-emerald-600">
            {icon}
          </div>
          <Badge variant="emerald" withDot size="sm">
            实时更新
          </Badge>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold gradient-text tracking-tight">
            {count.toLocaleString()}
          </span>
          <span className="text-2xl font-bold text-slate-500">{suffix}</span>
        </div>
        <p className="text-slate-600 font-medium">{label}</p>
      </Card>
    </motion.div>
  );
}

function SkillPlanet() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const particles = [
    { x: 25, y: 20, color: 'emerald', size: 8, delay: 0, label: 'Python' },
    { x: 75, y: 15, color: 'indigo', size: 6, delay: 0.2, label: '沟通' },
    { x: 15, y: 55, color: 'gold', size: 10, delay: 0.4, label: 'PMP' },
    { x: 85, y: 60, color: 'purple', size: 7, delay: 0.6, label: '学习力' },
    { x: 45, y: 10, color: 'emerald', size: 5, delay: 0.3, label: 'SQL' },
    { x: 60, y: 80, color: 'indigo', size: 9, delay: 0.5, label: '领导力' },
    { x: 10, y: 80, color: 'purple', size: 6, delay: 0.7, label: '适应性' },
    { x: 90, y: 35, color: 'gold', size: 7, delay: 0.1, label: 'AWS' },
    { x: 35, y: 85, color: 'emerald', size: 6, delay: 0.8, label: 'React' },
    { x: 70, y: 45, color: 'indigo', size: 8, delay: 0.15, label: '协作' },
    { x: 20, y: 35, color: 'purple', size: 5, delay: 0.25, label: '创新' },
    { x: 55, y: 25, color: 'gold', size: 6, delay: 0.35, label: 'CFA' },
  ];

  const colorMap: Record<string, { bg: string; glow: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.8)]', ring: 'ring-emerald-300/50' },
    indigo: { bg: 'bg-space-indigo-400', glow: 'shadow-[0_0_20px_rgba(96,134,198,0.8)]', ring: 'ring-space-indigo-300/50' },
    gold: { bg: 'bg-amber-gold-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', ring: 'ring-amber-gold-300/50' },
    purple: { bg: 'bg-lavender-400', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.8)]', ring: 'ring-lavender-300/50' },
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-md mx-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      <motion.div
        className="absolute inset-8 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.4) 0%, rgba(52,211,153,0.3) 40%, rgba(58,95,168,0.3) 70%, transparent 100%)',
          filter: 'blur(2px)',
        }}
        animate={{
          x: mousePos.x * 10,
          y: mousePos.y * 10,
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-12 rounded-full border border-lavender-300/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-dashed border-emerald-300/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        style={{ transform: `translate(${-mousePos.x * 8}px, ${-mousePos.y * 8}px)` }}
      />

      {particles.map((p, i) => {
        const c = colorMap[p.color];
        const moveX = mousePos.x * (50 - Math.abs(50 - p.x)) * 0.15;
        const moveY = mousePos.y * (50 - Math.abs(50 - p.y)) * 0.15;
        return (
          <motion.div
            key={i}
            className="absolute group"
            style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: 10 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: moveX,
              y: moveY,
            }}
            transition={{
              delay: p.delay,
              duration: 0.6,
              x: { type: 'spring', stiffness: 50, damping: 20 },
              y: { type: 'spring', stiffness: 50, damping: 20 },
            }}
          >
            <motion.div
              className={`${c.bg} rounded-full ring-4 ${c.ring} ${c.glow}`}
              style={{ width: p.size * 2, height: p.size * 2 }}
              animate={{
                y: [0, -4, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2 + (i % 5) * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: p.delay,
              }}
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <Badge variant="default" size="sm" className="shadow-md backdrop-blur-sm bg-white/90">
                {p.label}
              </Badge>
            </div>
          </motion.div>
        );
      })}

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, x: mousePos.x * 8, y: mousePos.y * 8 }}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 50 }}
      >
        <div className="relative">
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, #fff 0%, #ECFDF5 30%, #EDE9FE 60%, #C8D6EC 100%)',
              boxShadow:
                '0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(16,185,129,0.15), inset 0 2px 20px rgba(255,255,255,0.8)',
            }}
          >
            <Brain className="w-16 h-16 text-transparent" strokeWidth={1.5} style={{ color: 'transparent' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-16 h-16">
                <defs>
                  <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3A5FA8" />
                  </linearGradient>
                </defs>
                <BrainIconSVG />
              </svg>
            </div>
          </div>
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-emerald-300/60"
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-slate-600 font-medium">硬技能</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-space-indigo-400 shadow-[0_0_8px_rgba(96,134,198,0.8)]" />
          <span className="text-slate-600 font-medium">软技能</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-amber-gold-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="text-slate-600 font-medium">认证</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-lavender-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          <span className="text-slate-600 font-medium">潜力</span>
        </div>
      </div>
    </div>
  );
}

function BrainIconSVG() {
  return (
    <g fill="url(#brainGrad)" stroke="url(#brainGrad)" strokeWidth="1">
      <path d="M24 12c-3 0-5.5 2-6.5 5C15 16 13 17 13 20c0 1.5.5 2.5 1.5 3.5C13 25 12 27 12 30c0 2.5 1 4.5 3 5.5C14 37 14 39 15 40.5c.5.8 1.2 1.2 2 1.5 1 2 3 3.5 5.5 4V32c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5v14c2.5-.5 4.5-2 5.5-4 .8-.3 1.5-.7 2-1.5 1-1.5 1-3.5 1-5 2-1 3-3 3-5.5 0-3-1-5-2.5-6.5 1-1 1.5-2 1.5-3.5 0-3-2-4-4.5-3-1-3-3.5-5-6.5-5h-2c0 0-.5-1-1.5-1S26 12 24 12zm-4 10a2 2 0 110-4 2 2 0 010 4zm28 0a2 2 0 110-4 2 2 0 010 4zM18 32a2 2 0 110-4 2 2 0 010 4zm32 0a2 2 0 110-4 2 2 0 010 4z" />
    </g>
  );
}

const trendData = [
  { month: '1月', 前端工程师: 8200, 产品经理: 6800, 数据分析师: 5400, AI算法工程师: 4200, 运营专家: 5800, 销售经理: 7200 },
  { month: '2月', 前端工程师: 8800, 产品经理: 7200, 数据分析师: 5900, AI算法工程师: 4800, 运营专家: 6100, 销售经理: 7400 },
  { month: '3月', 前端工程师: 9200, 产品经理: 7600, 数据分析师: 6300, AI算法工程师: 5500, 运营专家: 6500, 销售经理: 7800 },
  { month: '4月', 前端工程师: 9800, 产品经理: 8100, 数据分析师: 6800, AI算法工程师: 6300, 运营专家: 6900, 销售经理: 8100 },
  { month: '5月', 前端工程师: 10500, 产品经理: 8600, 数据分析师: 7400, AI算法工程师: 7200, 运营专家: 7300, 销售经理: 8500 },
  { month: '6月', 前端工程师: 11200, 产品经理: 9200, 数据分析师: 8100, AI算法工程师: 8500, 运营专家: 7800, 销售经理: 8900 },
];

const lineColors = ['#10B981', '#8B5CF6', '#F59E0B', '#3A5FA8', '#EC4899', '#06B6D4'];
const jobNames = ['前端工程师', '产品经理', '数据分析师', 'AI算法工程师', '运营专家', '销售经理'];

const topJobs = [
  { title: 'AI算法工程师', salary: '35K-80K', matchCount: 28470, growth: '+32%', level: 'P6-P8' },
  { title: '高级前端工程师', salary: '25K-55K', matchCount: 24150, growth: '+18%', level: 'P5-P7' },
  { title: '资深产品经理', salary: '30K-65K', matchCount: 21380, growth: '+15%', level: 'P6-P8' },
  { title: '数据科学家', salary: '28K-60K', matchCount: 19520, growth: '+24%', level: 'P6-P8' },
  { title: '全栈工程师', salary: '22K-48K', matchCount: 17840, growth: '+12%', level: 'P5-P7' },
  { title: 'SRE运维专家', salary: '25K-55K', matchCount: 15230, growth: '+20%', level: 'P5-P7' },
  { title: '商业化产品', salary: '28K-60K', matchCount: 13680, growth: '+22%', level: 'P6-P8' },
  { title: '增长运营负责人', salary: '25K-50K', matchCount: 12150, growth: '+16%', level: 'M1-M3' },
];

const features = [
  {
    icon: Brain,
    title: '能力图谱引擎',
    description: '覆盖300+岗位的职业能力模型，精准拆解硬技能、软技能、认证、经验等维度要求',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Target,
    title: '差距诊断',
    description: 'AI多维度分析目标岗位匹配度，智能识别能力短板，生成个性化诊断报告',
    color: 'indigo',
    gradient: 'from-space-indigo-500 to-blue-500',
  },
  {
    icon: TrendingUp,
    title: '成长性职位',
    description: '不仅匹配当前能力，更分析企业成长基因、晋升路径、学习资源等成长性指标',
    color: 'purple',
    gradient: 'from-lavender-500 to-purple-500',
  },
  {
    icon: BookOpen,
    title: '职业百科',
    description: '系统化岗位知识库：面试经验、工作流程、成长阶梯、薪资分布等全景透视',
    color: 'gold',
    gradient: 'from-amber-gold-500 to-orange-500',
  },
  {
    icon: Users,
    title: '人才池运营',
    description: '为企业HR提供人才分层标签体系、潜力智能评估、跟进提醒等全流程运营工具',
    color: 'emerald',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: AlertTriangle,
    title: '智能预警',
    description: '实时监测市场变化、岗位竞争度、技能迭代趋势，提前感知职业风险与机遇',
    color: 'purple',
    gradient: 'from-rose-500 to-pink-500',
  },
];

const testimonials = [
  {
    name: '张雨薇',
    role: '5年经验 · 转行成功',
    avatar: 'yvonne',
    type: '求职者',
    quote: '从行政转行数据分析师，系统帮我拆解了需要补的8项技能，按学习计划6个月拿到了18K的offer。这不是海投碰运气，而是精确制导。',
    highlight: '6个月薪资翻2.3倍',
  },
  {
    name: '李明浩',
    role: '2024届应届生',
    avatar: 'leo',
    type: '应届生',
    quote: '校招季特别迷茫，不知道自己适合什么。做完诊断才发现我的思维分析维度特别突出，匹配了产品经理赛道，最终拿到了字节的SP offer。',
    highlight: '校招斩获SP offer',
  },
  {
    name: '陈慧琳',
    role: '字节跳动HRBP',
    avatar: 'linda',
    type: 'HR',
    quote: '以前筛选简历只能看学历和关键词匹配，现在能看到候选人的成长潜力标签。招进来的3个高潜人才表现都远超预期，留存率也高。',
    highlight: '人才匹配准确率+40%',
  },
];

const avatarColors = [
  { bg: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-200' },
  { bg: 'from-lavender-400 to-purple-500', ring: 'ring-lavender-200' },
  { bg: 'from-space-indigo-400 to-blue-500', ring: 'ring-space-indigo-200' },
];

function getAvatar(name: string, colorIdx: number) {
  const colors = avatarColors[colorIdx % avatarColors.length];
  const initials = name.slice(0, 1);
  return (
    <div
      className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.bg} ring-4 ${colors.ring} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
    >
      {initials}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-slate-200/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-lavender-500 to-space-indigo-500 flex items-center justify-center shadow-lg shadow-lavender-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-slate-900">
              Career<span className="gradient-text">Mind</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">核心功能</a>
            <a href="#trends" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">岗位趋势</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">用户故事</a>
            <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
              浏览职位
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
              开始诊断
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-lavender-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-space-indigo-200/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              <motion.div variants={fadeInUp}>
                <Badge variant="purple" size="md" withDot className="mb-6">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  全新 AI 职业规划引擎 v3.0
                </Badge>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="font-heading text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
                重新定义求职，
                <br />
                从<span className="gradient-text">「找工作」</span>
                <br />
                到<span className="gradient-text">「规划职业人生」</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-xl text-slate-600 leading-relaxed mb-4">
                300+岗位职业能力图谱 · AI能力差距诊断 · 成长性匹配算法
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-2 mb-10">
                <Badge variant="emerald" size="sm">基于胜任力模型</Badge>
                <Badge variant="indigo" size="sm">多维雷达匹配</Badge>
                <Badge variant="gold" size="sm">个性化成长路径</Badge>
                <Badge variant="purple" size="sm">市场热度实时监测</Badge>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/onboarding')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  开始职业诊断
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/jobs')}
                  leftIcon={<Briefcase className="w-5 h-5" />}
                >
                  浏览职位机会
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  leftIcon={<Play className="w-5 h-5" />}
                >
                  观看演示
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-8">
                <div className="flex -space-x-3">
                  {['A', 'B', 'C', 'D'].map((ch, i) => {
                    const c = avatarColors[i % avatarColors.length];
                    return (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.bg} ring-3 ring-white flex items-center justify-center text-white text-sm font-bold shadow-md`}
                      >
                        {ch}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-gold-400 text-amber-gold-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">50万+</span> 用户信赖之选
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
              <SkillPlanet />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard value={300} suffix="+" label="胜任力模型覆盖岗位" icon={<BookOpen className="w-6 h-6" />} delay={0} />
            <StatCard value={500000} suffix="+" label="求职者智能匹配" icon={<Users className="w-6 h-6" />} delay={0.1} />
            <StatCard value={8000} suffix="+" label="企业入驻招聘" icon={<Briefcase className="w-6 h-6" />} delay={0.2} />
            <StatCard value={92} suffix="%" label="职业目标达成率" icon={<Target className="w-6 h-6" />} delay={0.3} />
          </motion.div>
        </div>
      </section>

      {/* Features Matrix */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lavender-50/50 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="emerald" size="md" withDot className="mb-4">
                <Rocket className="w-3.5 h-3.5 mr-1" />
                核心能力矩阵
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              职业发展的<span className="gradient-text">全链路引擎</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 max-w-2xl mx-auto">
              从自我认知、差距诊断到智能匹配、持续成长，为你的职业人生提供科学决策支持
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={scaleIn} transition={{ delay: i * 0.08 }}>
                <Card variant="default" glowOnHover hoverable className="p-8 h-full group">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    style={{ boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)' }}
                  >
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 font-heading">
                    {f.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {f.description}
                  </p>
                  <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:gap-2 gap-1 transition-all duration-300">
                    了解详情 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Job Trends Section */}
      <section id="trends" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mb-12"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="gold" size="md" withDot className="mb-4">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                实时数据
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              热门岗位<span className="gradient-text">趋势洞察</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600">
              基于全网8000+企业招聘数据的实时分析
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              className="lg:col-span-3"
            >
              <Card variant="glass" className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    近6个月岗位需求指数趋势
                  </h3>
                  <Badge variant="emerald" size="sm" withDot>
                    较上月 +8.3%
                  </Badge>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        {jobNames.map((_, i) => (
                          <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={lineColors[i]} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={lineColors[i]} stopOpacity={0.9} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="month"
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
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                          padding: '12px 16px',
                        }}
                        itemStyle={{ fontSize: '13px', padding: '4px 0' }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '13px', paddingBottom: '12px' }}
                      />
                      {jobNames.map((name, i) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={`url(#grad${i})`}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              className="lg:col-span-2"
            >
              <Card variant="glass" className="p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    TOP 热门岗位
                  </h3>
                  <Badge variant="purple" size="sm">
                    匹配人数
                  </Badge>
                </div>
                <div className="space-y-3">
                  {topJobs.map((job, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="group p-3.5 rounded-xl hover:bg-white/80 transition-all duration-300 cursor-pointer border border-transparent hover:border-emerald-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-space-indigo-50 to-lavender-50 flex items-center justify-center text-sm font-bold text-space-indigo-700 border border-space-indigo-100">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                              {job.title}
                            </h4>
                            <Badge variant="success" size="sm" className="flex-shrink-0">
                              {job.growth}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {job.salary}
                            </span>
                            <span>·</span>
                            <span>{job.level}</span>
                            <span>·</span>
                            <span>{job.matchCount.toLocaleString()}人匹配</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-lavender-50/60 via-transparent to-emerald-50/60" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="emerald" size="md" withDot className="mb-4">
                <Users className="w-3.5 h-3.5 mr-1" />
                用户真实证言
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              他们的<span className="gradient-text">职业跃迁故事</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 max-w-2xl mx-auto">
              来自不同背景的求职者与招聘方，都在这里找到了职业方向的答案
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeInUp} transition={{ delay: i * 0.1 }}>
                <Card variant="gradient" hoverable className="p-8 h-full relative overflow-hidden">
                  <Quote className="absolute top-6 right-6 w-12 h-12 text-lavender-200/60" />
                  <div className="flex items-center gap-4 mb-6">
                    {getAvatar(t.name, i)}
                    <div>
                      <h4 className="font-bold text-slate-900">{t.name}</h4>
                      <p className="text-sm text-slate-500">{t.role}</p>
                    </div>
                  </div>
                  <Badge
                    variant={t.type === 'HR' ? 'indigo' : t.type === '应届生' ? 'purple' : 'emerald'}
                    size="sm"
                    className="mb-5"
                  >
                    {t.type}
                  </Badge>
                  <p className="text-slate-700 leading-relaxed mb-6 relative z-10">
                    「{t.quote}」
                  </p>
                  <div className="pt-6 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-lavender-100">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">
                        {t.highlight}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden p-12 lg:p-16"
            style={{
              background:
                'linear-gradient(135deg, #10B981 0%, #34D399 25%, #8B5CF6 60%, #3A5FA8 100%)',
              boxShadow: '0 30px 80px -20px rgba(139,92,246,0.5)',
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div className="text-white">
                <div className="mb-6">
                  <Badge variant="default" size="md" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Rocket className="w-3.5 h-3.5 mr-1" />
                    开启你的职业加速
                  </Badge>
                </div>
                <h2 className="font-heading text-4xl lg:text-5xl font-bold leading-tight mb-4">
                  今天，
                  <br />
                  就开启职业人生的<br />科学规划之旅
                </h2>
                <p className="text-lg text-white/80 leading-relaxed max-w-xl">
                  5分钟完成AI诊断，获取你的专属能力雷达、成长路径与精准岗位推荐。
                  已有50万+用户在这里完成职业跃迁。
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:justify-self-end">
                <Button
                  size="xl"
                  variant="secondary"
                  className="!bg-white !text-space-indigo-700 hover:!bg-white/95 shadow-2xl w-full lg:w-auto"
                  onClick={() => navigate('/onboarding')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  免费开始职业诊断
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="!border-white/50 !text-white hover:!bg-white/10 w-full lg:w-auto"
                  onClick={() => navigate('/jobs')}
                  leftIcon={<Briefcase className="w-5 h-5" />}
                >
                  先看看有哪些机会
                </Button>
                <div className="flex items-center justify-center lg:justify-start gap-6 pt-2 text-sm text-white/80">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    信息加密保护
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    覆盖300+城市
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200/60 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-lavender-500 to-space-indigo-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-slate-900">
                Career<span className="gradient-text">Mind</span>
              </span>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 CareerMind · 让职业发展更科学
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-emerald-600 transition-colors">关于我们</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence />
    </div>
  );
}
