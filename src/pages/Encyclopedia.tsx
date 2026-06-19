import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  Landmark,
  Heart,
  Factory,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  Video,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Star,
  TrendingUp,
  Play,
  ArrowRight,
  Filter,
  Award,
  Clock,
  CheckCircle2,
  Users,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { encyclopediaApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { EncyclopediaJobCard, InterviewCard, CertificationCard } from '@shared/types';

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
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
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

interface IndustryNode {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  categories: {
    id: string;
    name: string;
    jobs: { id: string; name: string }[];
  }[];
}

const INDUSTRY_DATA: IndustryNode[] = [
  {
    id: 'ind-internet',
    name: '互联网',
    icon: Globe,
    description: '涵盖互联网公司、科技企业、软件服务等数字化领域',
    categories: [
      {
        id: 'cat-dev',
        name: '技术研发',
        jobs: [
          { id: 'job-fe', name: '前端工程师' },
          { id: 'job-be', name: '后端工程师' },
          { id: 'job-ds', name: '数据科学家' },
          { id: 'job-algo', name: '算法工程师' },
          { id: 'job-ops', name: '运维工程师' },
          { id: 'job-sec', name: '安全工程师' },
        ],
      },
      {
        id: 'cat-product',
        name: '产品设计',
        jobs: [
          { id: 'job-pm', name: '产品经理' },
          { id: 'job-ui', name: 'UI设计师' },
        ],
      },
    ],
  },
  {
    id: 'ind-finance',
    name: '金融',
    icon: Landmark,
    description: '银行、证券、基金、保险、投资等金融服务领域',
    categories: [
      {
        id: 'cat-invest',
        name: '投资分析',
        jobs: [
          { id: 'job-ia', name: '投资分析师' },
          { id: 'job-rc', name: '风控经理' },
        ],
      },
    ],
  },
  {
    id: 'ind-healthcare',
    name: '医疗健康',
    icon: Heart,
    description: '医疗器械、医药研发、临床研究等医疗健康领域',
    categories: [
      {
        id: 'cat-medical',
        name: '医疗技术',
        jobs: [
          { id: 'job-cra', name: '临床研究员' },
          { id: 'job-me', name: '医疗器械工程师' },
        ],
      },
    ],
  },
  {
    id: 'ind-manufacturing',
    name: '智能制造',
    icon: Factory,
    description: '工业4.0、自动化、机器人、智能装备等制造领域',
    categories: [
      {
        id: 'cat-industrial',
        name: '工业工程',
        jobs: [
          { id: 'job-id', name: '工业设计师' },
          { id: 'job-plc', name: 'PLC工程师' },
        ],
      },
    ],
  },
  {
    id: 'ind-education',
    name: '教育培训',
    icon: GraduationCap,
    description: 'K12教育、职业教育、在线教育、教育科技等领域',
    categories: [
      {
        id: 'cat-teaching',
        name: '教学教研',
        jobs: [
          { id: 'job-dean', name: '教研主任' },
          { id: 'job-lecturer', name: '在线讲师' },
        ],
      },
    ],
  },
  {
    id: 'ind-retail',
    name: '新零售',
    icon: ShoppingBag,
    description: '电商、直播电商、社区团购、线下零售等新零售领域',
    categories: [
      {
        id: 'cat-ops',
        name: '运营管理',
        jobs: [
          { id: 'job-co', name: '品类运营' },
          { id: 'job-po', name: '私域运营' },
        ],
      },
    ],
  },
  {
    id: 'ind-consulting',
    name: '管理咨询',
    icon: Briefcase,
    description: '战略咨询、管理咨询、IT咨询、人力资源咨询等领域',
    categories: [
      {
        id: 'cat-strategy',
        name: '战略管理',
        jobs: [
          { id: 'job-sc', name: '战略咨询顾问' },
          { id: 'job-mc', name: '管理咨询顾问' },
        ],
      },
    ],
  },
  {
    id: 'ind-media',
    name: '文化传媒',
    icon: Video,
    description: '内容创作、短视频、影视制作、广告营销等文化领域',
    categories: [
      {
        id: 'cat-content',
        name: '内容创作',
        jobs: [
          { id: 'job-content', name: '内容运营' },
          { id: 'job-vd', name: '视频编导' },
        ],
      },
    ],
  },
];

const HOT_TAGS = [
  '产品经理',
  '前端工程师',
  'UI设计师',
  '数据分析师',
  '运营',
  'Java工程师',
];

const MOCK_JOBS: EncyclopediaJobCard[] = [
  {
    id: 'job-fe',
    name: '前端工程师',
    industry: '互联网',
    category: '技术研发',
    overview: '负责Web/移动应用的用户界面开发，将设计稿转化为用户可交互的产品',
    avgSalary: 25000,
    entryDifficulty: 3,
    demandGrowth: 18,
    avatarUrls: ['A', 'B', 'C', 'D', 'E'],
  },
  {
    id: 'job-be',
    name: '后端工程师',
    industry: '互联网',
    category: '技术研发',
    overview: '负责服务端业务逻辑实现、数据库设计、接口开发、系统架构等工作',
    avgSalary: 28000,
    entryDifficulty: 4,
    demandGrowth: 15,
    avatarUrls: ['F', 'G', 'H'],
  },
  {
    id: 'job-algo',
    name: '算法工程师',
    industry: '互联网',
    category: '技术研发',
    overview: '专注于深度学习、机器学习算法的研发与落地，AI浪潮核心角色',
    avgSalary: 40000,
    entryDifficulty: 5,
    demandGrowth: 32,
    avatarUrls: ['I', 'J', 'K', 'L'],
  },
  {
    id: 'job-pm',
    name: '产品经理',
    industry: '互联网',
    category: '产品设计',
    overview: '产品的"CEO"，负责用户需求挖掘、产品规划、功能设计、项目推动',
    avgSalary: 28000,
    entryDifficulty: 4,
    demandGrowth: 12,
    avatarUrls: ['M', 'N', 'O'],
  },
  {
    id: 'job-ui',
    name: 'UI设计师',
    industry: '互联网',
    category: '产品设计',
    overview: '负责产品视觉界面的设计，包括图标、配色、排版、组件等',
    avgSalary: 20000,
    entryDifficulty: 3,
    demandGrowth: 10,
    avatarUrls: ['P', 'Q', 'R', 'S'],
  },
  {
    id: 'job-ds',
    name: '数据科学家',
    industry: '互联网',
    category: '技术研发',
    overview: '通过统计学、机器学习从海量数据中挖掘洞察，支持业务决策',
    avgSalary: 35000,
    entryDifficulty: 5,
    demandGrowth: 24,
    avatarUrls: ['T', 'U', 'V'],
  },
  {
    id: 'job-ia',
    name: '投资分析师',
    industry: '金融',
    category: '投资分析',
    overview: '负责行业研究、公司分析、估值建模，为投资决策提供专业建议',
    avgSalary: 35000,
    entryDifficulty: 5,
    demandGrowth: 8,
    avatarUrls: ['W', 'X', 'Y', 'Z'],
  },
  {
    id: 'job-rc',
    name: '风控经理',
    industry: '金融',
    category: '投资分析',
    overview: '负责识别、评估、控制各类金融风险，保障金融机构稳健运营',
    avgSalary: 32000,
    entryDifficulty: 4,
    demandGrowth: 12,
    avatarUrls: ['A1', 'B1', 'C1'],
  },
  {
    id: 'job-sc',
    name: '战略咨询顾问',
    industry: '管理咨询',
    category: '战略管理',
    overview: '为企业提供战略规划、组织变革、业务转型等高端咨询服务',
    avgSalary: 40000,
    entryDifficulty: 5,
    demandGrowth: 6,
    avatarUrls: ['D1', 'E1', 'F1', 'G1'],
  },
];

const MOCK_INTERVIEWS: InterviewCard[] = [
  {
    id: 'int-1',
    jobId: 'job-fe',
    jobName: '前端工程师',
    intervieweeName: '张工',
    avatar: '张',
    yearsOfExperience: 6,
    currentLevel: '资深',
    city: '北京',
    quote: '保持学习是最重要的，前端变化太快，三天不看新闻就落伍了。',
    tags: ['成长路径', '学习方法'],
  },
  {
    id: 'int-2',
    jobId: 'job-pm',
    jobName: '产品经理',
    intervieweeName: '李婷',
    avatar: '李',
    yearsOfExperience: 5,
    currentLevel: '高级',
    city: '上海',
    quote: '产品经理的核心不是画原型，而是对用户的同理心和商业判断力。',
    tags: ['转行建议', '入行建议'],
  },
  {
    id: 'int-3',
    jobId: 'job-algo',
    jobName: '算法工程师',
    intervieweeName: '王博士',
    avatar: '王',
    yearsOfExperience: 8,
    currentLevel: '专家',
    city: '深圳',
    quote: '数学基础决定了你的天花板，工程能力决定了落地速度。',
    tags: ['薪资真相', '技术深度'],
  },
  {
    id: 'int-4',
    jobId: 'job-ui',
    jobName: 'UI设计师',
    intervieweeName: '陈艺',
    avatar: '陈',
    yearsOfExperience: 4,
    currentLevel: '中级',
    city: '杭州',
    quote: 'AI工具解放了生产力，设计师更该关注创意和用户体验本身。',
    tags: ['AI影响', '职业转型'],
  },
];

const MOCK_CERTS: CertificationCard[] = [
  {
    id: 'cert-1',
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    difficulty: 'advanced',
    estimatedHours: 150,
    passRate: 65,
    relevance: 92,
    relatedJobs: ['后端工程师', '运维工程师'],
  },
  {
    id: 'cert-2',
    name: 'Google Cloud Professional ML Engineer',
    issuer: 'Google Cloud',
    difficulty: 'advanced',
    estimatedHours: 140,
    passRate: 58,
    relevance: 88,
    relatedJobs: ['算法工程师', '数据科学家'],
  },
  {
    id: 'cert-3',
    name: 'Meta Front-End Developer',
    issuer: 'Meta',
    difficulty: 'basic',
    estimatedHours: 60,
    passRate: 82,
    relevance: 78,
    relatedJobs: ['前端工程师'],
  },
  {
    id: 'cert-4',
    name: 'CFA Chartered Financial Analyst',
    issuer: 'CFA Institute',
    difficulty: 'advanced',
    estimatedHours: 900,
    passRate: 45,
    relevance: 95,
    relatedJobs: ['投资分析师', '风控经理'],
  },
  {
    id: 'cert-5',
    name: 'PMP Project Management Professional',
    issuer: 'PMI',
    difficulty: 'intermediate',
    estimatedHours: 120,
    passRate: 72,
    relevance: 75,
    relatedJobs: ['产品经理', '管理咨询顾问'],
  },
  {
    id: 'cert-6',
    name: 'CKA Kubernetes Administrator',
    issuer: 'CNCF',
    difficulty: 'advanced',
    estimatedHours: 100,
    passRate: 68,
    relevance: 85,
    relatedJobs: ['运维工程师', '后端工程师'],
  },
];

const FEATURED_BANNERS = [
  {
    jobId: 'job-pm',
    title: '产品经理：从需求到落地的全链路能力',
    description: '深入了解产品经理的日常工作、核心能力要求与职业发展路径，助你判断是否适合这个岗位',
    tag: '🔥 最受欢迎',
    viewCount: '28,456',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 30%, #8B5CF6 70%, #7C3AED 100%)',
  },
  {
    jobId: 'job-fe',
    title: '前端工程师：构建用户体验的技术艺术家',
    description: '从HTML/CSS基础到现代框架，全面了解前端工程师的技能树与成长路径',
    tag: '💻 技术热门',
    viewCount: '35,128',
    gradient: 'linear-gradient(135deg, #3A5FA8 0%, #1E40AF 30%, #06B6D4 70%, #0891B2 100%)',
  },
  {
    jobId: 'job-algo',
    title: '算法工程师：AI时代的核心筑梦者',
    description: '探索算法工程师的真实工作内容、技术深度要求与行业发展前景',
    tag: '🤖 AI风口',
    viewCount: '42,891',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 30%, #EF4444 70%, #DC2626 100%)',
  },
];

const avatarColors = [
  { bg: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-200' },
  { bg: 'from-lavender-400 to-purple-500', ring: 'ring-lavender-200' },
  { bg: 'from-space-indigo-400 to-blue-500', ring: 'ring-space-indigo-200' },
  { bg: 'from-amber-gold-400 to-orange-500', ring: 'ring-amber-gold-200' },
  { bg: 'from-rose-400 to-pink-500', ring: 'ring-rose-200' },
];

function getAvatar(ch: string, colorIdx: number, size: 'sm' | 'md' | 'lg' = 'sm') {
  const colors = avatarColors[colorIdx % avatarColors.length];
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colors.bg} ring-3 ring-white flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}
    >
      {ch}
    </div>
  );
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

function difficultyText(level: number) {
  const map = ['入门级', '简单', '中等', '较难', '地狱级'];
  return map[level - 1] || '中等';
}

function diffBadge(d: 'basic' | 'intermediate' | 'advanced') {
  if (d === 'basic') return <Badge variant="emerald" size="sm">入门</Badge>;
  if (d === 'intermediate') return <Badge variant="gold" size="sm">中级</Badge>;
  return <Badge variant="purple" size="sm">高级</Badge>;
}

export default function Encyclopedia() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set(['ind-internet']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['cat-dev', 'cat-product']));
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ind-internet');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<EncyclopediaJobCard[]>(MOCK_JOBS);
  const [interviews, setInterviews] = useState<InterviewCard[]>(MOCK_INTERVIEWS);
  const [certs, setCerts] = useState<CertificationCard[]>(MOCK_CERTS);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  const treeFilter = searchKeyword.trim().toLowerCase();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      encyclopediaApi
        .getJobs({ page: 1, pageSize: 50, industry: selectedIndustry })
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setJobs(res.data as unknown as EncyclopediaJobCard[]);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedIndustry]);

  useEffect(() => {
    encyclopediaApi
      .getInterviews({ page: 1, pageSize: 10 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setInterviews(res.data as unknown as InterviewCard[]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    encyclopediaApi
      .getCertifications({ page: 1, pageSize: 20 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCerts(res.data as unknown as CertificationCard[]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev === FEATURED_BANNERS.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentIndustry = INDUSTRY_DATA.find((i) => i.id === selectedIndustry);
  const currentJobs = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    let result = jobs;
    if (selectedJobId) {
      result = result.filter((j) => j.id === selectedJobId);
    } else if (currentIndustry) {
      const indJobs = currentIndustry.categories.flatMap((c) => c.jobs.map((j) => j.id));
      result = result.filter((j) => indJobs.includes(j.id));
    }
    if (kw) {
      result = result.filter(
        (j) => j.name.toLowerCase().includes(kw) || j.overview.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [jobs, selectedJobId, currentIndustry, searchKeyword]);

  const toggleIndustry = (id: string) => {
    setSelectedIndustry(id);
    setSelectedJobId(null);
    setExpandedIndustries((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectJob = (id: string, name: string) => {
    setSelectedJobId(id);
    setSearchKeyword(name);
  };

  const filteredTree = useMemo(() => {
    if (!treeFilter) return INDUSTRY_DATA;
    return INDUSTRY_DATA.map((ind) => {
      const categories = ind.categories
        .map((cat) => ({
          ...cat,
          jobs: cat.jobs.filter(
            (j) =>
              j.name.toLowerCase().includes(treeFilter) ||
              cat.name.toLowerCase().includes(treeFilter) ||
              ind.name.toLowerCase().includes(treeFilter)
          ),
        }))
        .filter((cat) => cat.jobs.length > 0 || cat.name.toLowerCase().includes(treeFilter) || ind.name.toLowerCase().includes(treeFilter));
      return { ...ind, categories };
    }).filter((ind) => ind.categories.length > 0 || ind.name.toLowerCase().includes(treeFilter));
  }, [treeFilter]);

  const totalJobsInIndustry = currentIndustry
    ? currentIndustry.categories.reduce((s, c) => s + c.jobs.length, 0)
    : 0;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none top-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute top-60 right-10 w-[420px] h-[420px] rounded-full bg-lavender-200/25 blur-3xl" />
        <div className="absolute bottom-40 left-10 w-80 h-80 rounded-full bg-space-indigo-200/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={fadeInUp}>
            <Badge variant="emerald" size="md" withDot className="mb-4">
              <BookOpenIcon />
              系统化职业知识库
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            探索<span className="gradient-text">职业百科</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-slate-600 mb-8">
            300+岗位全景透视 · 一线从业者深度访谈 · 科学入行路径规划
          </motion.p>

          <motion.div variants={fadeInUp} className="relative max-w-3xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  if (!e.target.value) setSelectedJobId(null);
                }}
                placeholder="搜索你想了解的职业，如：产品经理"
                className="w-full pl-14 pr-4 py-4 rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200/80 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-base transition-all shadow-lg shadow-slate-200/40"
              />
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-sm text-slate-500 mr-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 热门搜索：
            </span>
            {HOT_TAGS.map((tag, i) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchKeyword(tag);
                  setSelectedJobId(null);
                }}
                className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition-all duration-200 hover:scale-105"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <div className="flex gap-8 items-start">
          <motion.aside
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="w-72 flex-shrink-0 sticky top-20"
          >
            <Card variant="glass" className="p-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-heading font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  行业目录
                </h3>
                <Badge variant="indigo" size="sm">
                  8大行业
                </Badge>
              </div>

              <div className="space-y-1">
                {filteredTree.map((ind) => {
                  const IndIcon = ind.icon;
                  const industryExpanded = expandedIndustries.has(ind.id);
                  const isIndustrySelected = selectedIndustry === ind.id;
                  return (
                    <div key={ind.id}>
                      <button
                        onClick={() => toggleIndustry(ind.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isIndustrySelected
                            ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/60 border border-emerald-200'
                            : 'hover:bg-slate-100/80'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isIndustrySelected
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-md shadow-emerald-200'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                          }`}
                        >
                          <IndIcon className="w-4 h-4" />
                        </div>
                        <span
                          className={`flex-1 text-left text-sm font-semibold ${
                            isIndustrySelected ? 'text-emerald-700' : 'text-slate-700'
                          }`}
                        >
                          {ind.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {ind.categories.reduce((s, c) => s + c.jobs.length, 0)}
                        </span>
                        {industryExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {industryExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden ml-3 border-l-2 border-emerald-100 pl-3 my-1"
                          >
                            {ind.categories.map((cat) => {
                              const catExpanded = expandedCategories.has(cat.id);
                              return (
                                <div key={cat.id} className="mb-0.5">
                                  <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100/60 text-left transition-colors"
                                  >
                                    {catExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                    )}
                                    <span className="text-xs font-medium text-slate-600">
                                      {cat.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-auto">
                                      {cat.jobs.length}岗
                                    </span>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {catExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="overflow-hidden ml-5 space-y-0.5 py-0.5"
                                      >
                                        {cat.jobs.map((job) => (
                                          <button
                                            key={job.id}
                                            onClick={() => selectJob(job.id, job.name)}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                                              selectedJobId === job.id
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-semibold shadow-sm'
                                                : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/60'
                                            }`}
                                          >
                                            {job.name}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.aside>

          <main className="flex-1 min-w-0 space-y-12">
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="relative"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <div className="w-16 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 mb-4" />
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="gold" size="md" withDot>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    精选推荐
                  </Badge>
                </div>
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  <span className="gradient-text">热门岗位</span>深度解析
                </h2>
              </motion.div>

              <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-3xl">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
                  {FEATURED_BANNERS.map((banner, i) => (
                    <div
                      key={i}
                      className="w-full flex-shrink-0 relative h-64 lg:h-80 rounded-3xl overflow-hidden"
                      style={{
                        background: banner.gradient,
                      }}
                    >
                      <div className="absolute inset-0 opacity-30">
                        <svg className="w-full h-full" viewBox="0 0 1200 320">
                          <defs>
                            <pattern id={`bannerGrid${i}`} width="50" height="50" patternUnits="userSpaceOnUse">
                              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill={`url(#bannerGrid${i})`} />
                        </svg>
                      </div>
                      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute -left-10 bottom-0 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

                      <div className="relative z-10 h-full flex items-center px-10 lg:px-16">
                        <div className="max-w-xl">
                          <Badge variant="default" className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-4">
                            {banner.tag}
                          </Badge>
                          <h3 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-3">
                            {banner.title}
                          </h3>
                          <p className="text-white/80 text-base mb-6 leading-relaxed">
                            {banner.description}
                          </p>
                          <div className="flex items-center gap-4">
                            <Button
                              size="lg"
                              variant="secondary"
                              className="!bg-white !text-slate-900 hover:!bg-white/90 shadow-xl"
                              onClick={() => navigate(`/encyclopedia/${banner.jobId}`)}
                              rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                              立即探索
                            </Button>
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                              <Users className="w-4 h-4" />
                              <span>{banner.viewCount}+ 人已查看</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                  {FEATURED_BANNERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        bannerIndex === i ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setBannerIndex((prev) => (prev === 0 ? FEATURED_BANNERS.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setBannerIndex((prev) => (prev === FEATURED_BANNERS.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.section>

            <motion.section variants={staggerContainer} initial="hidden" animate="show">
              <motion.div variants={fadeInUp} className="mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {currentIndustry && (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-lavender-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                            {(() => {
                              const IndIcon = currentIndustry.icon;
                              return <IndIcon className="w-6 h-6 text-white" />;
                            })()}
                          </div>
                          <div>
                            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
                              {currentIndustry.name}
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {currentIndustry.description}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold gradient-text">{totalJobsInIndustry}</div>
                      <div className="text-xs text-slate-500">在岗位数</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} variant="glass" className="p-6 h-56 animate-pulse">
                      <div className="h-5 bg-slate-200 rounded w-2/3 mb-4" />
                      <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                      <div className="h-4 bg-slate-100 rounded w-5/6 mb-6" />
                      <div className="h-6 bg-slate-200 rounded w-1/2 mb-4" />
                      <div className="h-9 bg-slate-100 rounded-xl w-full mt-auto" />
                    </Card>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {currentJobs.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500 mb-2">未找到匹配的岗位</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchKeyword('');
                          setSelectedJobId(null);
                        }}
                      >
                        清除筛选
                      </Button>
                    </div>
                  ) : (
                    currentJobs.map((job, idx) => (
                      <motion.div
                        key={job.id}
                        variants={scaleIn}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card
                          variant="glass"
                          hoverable
                          className="h-full p-6 group flex flex-col relative overflow-hidden"
                          onClick={() => navigate(`/encyclopedia/${job.id}`)}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-200/30 to-lavender-200/30 blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

                          <div className="relative z-10 flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-heading text-xl font-bold text-slate-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                                {job.name}
                              </h3>
                              <Badge variant="indigo" size="sm">
                                {job.industry} · {job.category}
                              </Badge>
                            </div>
                          </div>

                          <p className="relative z-10 text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
                            {job.overview}
                          </p>

                          <div className="relative z-10 mb-4">
                            <div className="text-xs text-slate-400 mb-1.5">平均月薪</div>
                            <div className="text-3xl font-bold tracking-tight">
                              <span className="bg-gradient-to-r from-emerald-600 via-lavender-600 to-space-indigo-600 bg-clip-text text-transparent">
                                ¥{(job.avgSalary / 1000).toFixed(1)}K
                              </span>
                            </div>
                          </div>

                          <div className="relative z-10 grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-100">
                            <div>
                              <div className="text-[11px] text-slate-400 mb-1">入行难度</div>
                              <div className="flex items-center gap-1">
                                <DifficultyStars level={job.entryDifficulty} />
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {difficultyText(job.entryDifficulty)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-400 mb-1">3年需求增长</div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="text-lg font-bold text-emerald-600">
                                  +{job.demandGrowth}%
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">市场热度↑</div>
                            </div>
                          </div>

                          <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1">
                              <div className="flex -space-x-2">
                                {job.avatarUrls.slice(0, 3).map((ch, i) => (
                                  <div
                                    key={i}
                                    className="w-8 h-8 rounded-full ring-2 ring-white bg-gradient-to-br from-emerald-400 to-space-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                  >
                                    {ch.charAt(0)}
                                  </div>
                                ))}
                              </div>
                              {job.avatarUrls.length > 3 && (
                                <div className="w-8 h-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 ml-1">
                                  +{job.avatarUrls.length - 3}
                                </div>
                              )}
                              <span className="text-[11px] text-slate-400 ml-2">
                                <Users className="w-3 h-3 inline mr-0.5" />
                                从业者
                              </span>
                            </div>
                          </div>

                          <div className="relative z-10 mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              rightIcon={<ArrowRight className="w-4 h-4" />}
                              className="group-hover:!border-emerald-400 group-hover:!bg-emerald-50 group-hover:!text-emerald-600"
                            >
                              查看详情
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </motion.section>

            <motion.section
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
            >
              <motion.div variants={fadeInUp} className="mb-6 flex items-end justify-between">
                <div>
                  <div className="w-16 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 mb-4" />
                  <Badge variant="purple" size="md" withDot className="mb-3">
                    <QuoteIcon />
                    真实分享
                  </Badge>
                  <h2 className="font-heading text-2xl font-bold tracking-tight">
                    来自一线从业者的<span className="gradient-text">真实声音</span>
                  </h2>
                </div>
              </motion.div>

              <div className="relative">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="flex gap-5 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {interviews.map((iv, i) => (
                    <motion.div
                      key={iv.id}
                      variants={scaleIn}
                      transition={{ delay: i * 0.08 }}
                      className="flex-shrink-0 w-[320px] snap-start"
                    >
                      <Card
                        variant="gradient"
                        hoverable
                        className="h-full p-6 relative overflow-hidden group"
                      >
                        <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-lavender-200/50 to-emerald-200/50 blur-2xl opacity-60" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            {getAvatar(iv.avatar, i, 'lg')}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-lavender-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200/60 relative"
                            >
                              <Play className="w-4 h-4 ml-0.5" fill="white" />
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
                                animate={{
                                  scale: [1, 1.3, 1],
                                  opacity: [0.6, 0, 0.6],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                              />
                            </motion.button>
                          </div>

                          <div className="mb-3">
                            <div className="font-bold text-slate-900">{iv.intervieweeName}</div>
                            <div className="text-sm text-slate-500">
                              {iv.jobName} · {iv.currentLevel} · {iv.yearsOfExperience}年
                              {iv.city && ` · ${iv.city}`}
                            </div>
                          </div>

                          <div className="bg-white/60 rounded-xl p-3 mb-4 border border-white/60">
                            <div className="flex items-end gap-0.5 h-8 mb-2">
                              {[...Array(32)].map((_, bi) => {
                                const h = 20 + Math.abs(Math.sin(bi * 0.6 + i * 2)) * 60;
                                return (
                                  <motion.div
                                    key={bi}
                                    className="flex-1 rounded-full bg-gradient-to-t from-emerald-400 to-lavender-500"
                                    style={{ height: `${h}%` }}
                                    animate={{
                                      height: [`${h * 0.6}%`, `${h}%`, `${h * 0.7}%`],
                                    }}
                                    transition={{
                                      duration: 1 + (bi % 5) * 0.2,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                      delay: bi * 0.03,
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="font-mono">02:45</span>
                              <span className="text-emerald-600 font-medium">点击播放完整访谈</span>
                            </div>
                          </div>

                          <div className="bg-white/50 rounded-xl p-4 mb-4 border border-white/60">
                            <p className="text-sm text-slate-700 leading-relaxed italic">
                              「{iv.quote}」
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {iv.tags.map((t) => (
                              <Badge key={t} variant="info" size="sm">
                                #{t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.section>

            <motion.section
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <div className="w-16 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 mb-4" />
                <Badge variant="gold" size="md" withDot className="mb-3">
                  <Award className="w-3.5 h-3.5 mr-1" />
                  认证推荐
                </Badge>
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  行业权威<span className="gradient-text">热门认证</span>
                </h2>
                <p className="text-slate-600 mt-2">
                  由行业专家精选的高含金量证书，助力职业进阶
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {certs.map((cert, i) => (
                  <motion.div key={cert.id} variants={scaleIn} transition={{ delay: i * 0.06 }}>
                    <Card variant="default" glowOnHover hoverable className="h-full p-6 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-gold-100 to-amber-gold-50 border border-amber-gold-200 flex items-center justify-center">
                          <Award className="w-6 h-6 text-amber-gold-600" />
                        </div>
                        {diffBadge(cert.difficulty)}
                      </div>

                      <h3 className="font-heading font-bold text-slate-900 mb-1.5 leading-snug">
                        {cert.name}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">{cert.issuer}</p>

                      <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-slate-100">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {cert.estimatedHours}h
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">学时</div>
                        </div>
                        <div className="text-center border-x border-slate-100">
                          <div className="text-slate-700 font-bold">{cert.passRate}%</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">通过率</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {cert.relevance}%
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">相关度</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                          <span>岗位相关度</span>
                          <span className="font-semibold">{cert.relevance}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 to-lavender-500 rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${cert.relevance}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {cert.relatedJobs.slice(0, 2).map((j) => (
                          <Badge key={j} variant="emerald" size="sm">
                            {j}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => navigate('/onboarding')}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="group-hover:!border-emerald-400 group-hover:!bg-emerald-50 group-hover:!text-emerald-600"
                      >
                        开始学习
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          </main>
        </div>
      </div>

      <AnimatePresence />
    </div>
  );
}

function BookOpenIcon() {
  return <BookOpenInline />;
}

function BookOpenInline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}
