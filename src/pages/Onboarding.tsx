import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Target,
  Briefcase,
  Brain,
  Wrench,
  HeartHandshake,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Building2,
  Code,
  Palette,
  LineChart as LineChartIcon,
  Megaphone,
  Users,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  MapPin,
  DollarSign,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { diagnosisApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { HardSkill, JobLevel, SkillLevel, GapPriority } from '@shared/types';

const steps = [
  { id: 1, title: '职业目标', desc: '选择行业与岗位', icon: Target },
  { id: 2, title: '硬技能自评', desc: '评估专业能力', icon: Wrench },
  { id: 3, title: '软技能自评', desc: '评估综合素养', icon: HeartHandshake },
  { id: 4, title: '期望条件', desc: '设定求职偏好', icon: Settings2 },
];

const industries = [
  {
    id: 'internet',
    name: '互联网',
    icon: Code,
    desc: '互联网/IT/软件/科技',
    color: 'from-emerald-400 to-teal-500',
    categories: [
      { id: 'frontend', name: '前端开发', jobs: ['前端工程师', '高级前端工程师', '前端架构师', '全栈工程师'] },
      { id: 'backend', name: '后端开发', jobs: ['Java工程师', 'Go工程师', 'Python工程师', '后端架构师'] },
      { id: 'algorithm', name: '算法/AI', jobs: ['AI算法工程师', '推荐算法工程师', 'NLP算法工程师', 'CV算法工程师'] },
      { id: 'mobile', name: '移动开发', jobs: ['iOS开发工程师', 'Android开发工程师', 'Flutter工程师', 'React Native工程师'] },
    ],
  },
  {
    id: 'product',
    name: '产品/设计',
    icon: Palette,
    desc: '产品经理/交互/视觉',
    color: 'from-lavender-400 to-purple-500',
    categories: [
      { id: 'pm', name: '产品经理', jobs: ['产品经理', '高级产品经理', '产品专家', '产品总监'] },
      { id: 'ux', name: '交互设计', jobs: ['UX设计师', '高级UX设计师', '交互专家', '设计总监'] },
      { id: 'ui', name: '视觉设计', jobs: ['UI设计师', '高级UI设计师', '视觉专家', '设计总监'] },
      { id: 'growth', name: '增长运营', jobs: ['增长产品经理', '用户运营', '内容运营', '活动运营'] },
    ],
  },
  {
    id: 'data',
    name: '数据/商业分析',
    icon: LineChartIcon,
    desc: '数据分析/BI/数仓',
    color: 'from-space-indigo-400 to-blue-500',
    categories: [
      { id: 'da', name: '数据分析', jobs: ['数据分析师', '高级数据分析师', '数据分析专家', 'BI经理'] },
      { id: 'ds', name: '数据科学', jobs: ['数据科学家', '机器学习工程师', '算法工程师', '数据科学专家'] },
      { id: 'de', name: '数据工程', jobs: ['数据工程师', '大数据工程师', 'ETL工程师', '数据架构师'] },
      { id: 'bi', name: '商业分析', jobs: ['商业分析师', '战略分析师', '行业研究员', '业务分析师'] },
    ],
  },
  {
    id: 'marketing',
    name: '市场/品牌',
    icon: Megaphone,
    desc: '市场/品牌/公关',
    color: 'from-amber-gold-400 to-orange-500',
    categories: [
      { id: 'brand', name: '品牌营销', jobs: ['品牌专员', '品牌经理', '品牌总监', 'CMO'] },
      { id: 'digital', name: '数字营销', jobs: ['数字营销专员', 'SEM专员', 'SEO优化师', '增长黑客'] },
      { id: 'pr', name: '公关传播', jobs: ['公关专员', '公关经理', '公关总监', '媒介总监'] },
      { id: 'content', name: '内容营销', jobs: ['内容运营', '文案策划', '新媒体运营', '内容总监'] },
    ],
  },
  {
    id: 'hr',
    name: '人力资源',
    icon: Users,
    desc: 'HR/招聘/培训',
    color: 'from-pink-400 to-rose-500',
    categories: [
      { id: 'recruit', name: '招聘', jobs: ['招聘专员', '招聘经理', '人才发展经理', 'HRBP'] },
      { id: 'od', name: '组织发展', jobs: ['OD专员', 'OD经理', '组织发展专家', 'HRD'] },
      { id: 'training', name: '培训发展', jobs: ['培训专员', '培训经理', '学习发展专家', '企业大学校长'] },
      { id: 'cnb', name: '薪酬绩效', jobs: ['薪酬专员', '绩效经理', 'C&B专家', 'HRD'] },
    ],
  },
  {
    id: 'finance',
    name: '金融/投资',
    icon: Building2,
    desc: '银行/证券/投资',
    color: 'from-cyan-400 to-sky-500',
    categories: [
      { id: 'ib', name: '投资银行', jobs: ['投行分析师', '投资经理', '投行VP', '投行MD'] },
      { id: 'pe', name: '私募股权投资', jobs: ['PE分析师', '投资经理', '投资总监', '合伙人'] },
      { id: 'sec', name: '证券研究', jobs: ['行业研究员', '高级研究员', '首席分析师', '研究所所长'] },
      { id: 'fin', name: '企业财务', jobs: ['财务分析师', '财务经理', '财务总监', 'CFO'] },
    ],
  },
  {
    id: 'bio',
    name: '生物/医药',
    icon: FlaskConical,
    desc: '医疗/制药/生物',
    color: 'from-green-400 to-emerald-500',
    categories: [
      { id: 'rnd', name: '药物研发', jobs: ['研发专员', '高级研究员', '研发科学家', '研发总监'] },
      { id: 'clinic', name: '临床医学', jobs: ['临床研究员', '临床监查员', '医学经理', '医学总监'] },
      { id: 'reg', name: '注册事务', jobs: ['注册专员', '注册经理', '法规事务专家', '注册总监'] },
      { id: 'qa', name: '质量控制', jobs: ['QA专员', 'QA经理', '质量总监', '质量负责人'] },
    ],
  },
  {
    id: 'consulting',
    name: '咨询/专业服务',
    icon: Brain,
    desc: '管理咨询/战略/法律',
    color: 'from-indigo-400 to-violet-500',
    categories: [
      { id: 'mc', name: '管理咨询', jobs: ['咨询顾问', '高级顾问', '项目经理', '合伙人'] },
      { id: 'stra', name: '战略咨询', jobs: ['战略分析师', '战略顾问', '战略总监', '高级合伙人'] },
      { id: 'law', name: '法律', jobs: ['律师助理', '执业律师', '高级律师', '合伙人'] },
      { id: 'acc', name: '审计/会计', jobs: ['审计助理', '审计师', '高级审计师', '审计合伙人'] },
    ],
  },
];

const jobLevels: { value: JobLevel; label: string; desc: string }[] = [
  { value: 'entry', label: '入门', desc: '应届生/转行者' },
  { value: 'junior', label: '初级', desc: '1-2年经验' },
  { value: 'middle', label: '中级', desc: '2-5年经验' },
  { value: 'senior', label: '高级', desc: '5-8年经验' },
  { value: 'expert', label: '专家', desc: '8年以上' },
  { value: 'lead', label: '负责人', desc: '团队管理者' },
];

const hardSkillsByJob: Record<string, HardSkill[]> = {
  default: [
    { id: 'hs1', name: '编程语言', category: '核心技能', priority: 'must', targetLevel: 4, description: '熟练掌握至少一种主流编程语言' },
    { id: 'hs2', name: '数据结构与算法', category: '核心技能', priority: 'must', targetLevel: 4, description: '掌握常用数据结构与算法设计' },
    { id: 'hs3', name: '系统设计', category: '架构能力', priority: 'important', targetLevel: 3, description: '理解分布式系统与架构设计' },
    { id: 'hs4', name: '数据库', category: '核心技能', priority: 'must', targetLevel: 4, description: '熟悉关系型与非关系型数据库' },
    { id: 'hs5', name: '网络与协议', category: '基础知识', priority: 'important', targetLevel: 3, description: '理解HTTP/TCP等网络协议' },
    { id: 'hs6', name: '项目管理', category: '工程能力', priority: 'nice', targetLevel: 3, description: '掌握项目管理与协作工具' },
    { id: 'hs7', name: '测试质量', category: '工程能力', priority: 'important', targetLevel: 3, description: '理解单元测试与质量保证' },
    { id: 'hs8', name: '运维部署', category: '工程能力', priority: 'nice', targetLevel: 2, description: '了解CI/CD与容器化部署' },
  ],
  product: [
    { id: 'hs1', name: '需求分析', category: '核心能力', priority: 'must', targetLevel: 5, description: '深入理解用户需求并转化为PRD' },
    { id: 'hs2', name: '竞品分析', category: '战略思维', priority: 'important', targetLevel: 4, description: '系统性分析竞品与市场格局' },
    { id: 'hs3', name: '数据分析', category: '决策能力', priority: 'must', targetLevel: 4, description: '通过数据驱动产品决策' },
    { id: 'hs4', name: '原型设计', category: '表达能力', priority: 'must', targetLevel: 4, description: '熟练使用Axure/Figma等工具' },
    { id: 'hs5', name: '项目管理', category: '执行能力', priority: 'important', targetLevel: 4, description: '跨部门协作推进项目落地' },
    { id: 'hs6', name: '行业认知', category: '专业深度', priority: 'important', targetLevel: 3, description: '对垂直行业有深入理解' },
    { id: 'hs7', name: '商业化思维', category: '商业能力', priority: 'nice', targetLevel: 3, description: '理解产品变现与商业模式' },
  ],
};

const softSkillDimensions = [
  {
    id: 'communication',
    name: '沟通协作',
    icon: Users,
    color: 'emerald',
    question: '在团队项目中，当与同事对技术方案产生分歧时，你通常会：',
    options: [
      { score: 1, text: '坚持自己的方案，用专业论据说服对方', behavior: '偏主导型沟通，注重个人专业判断，在协作中可能较为强势' },
      { score: 2, text: '先倾听对方想法，再尝试找共同点', behavior: '理性协商型，能够平衡个人意见与他人观点，注重过程沟通' },
      { score: 3, text: '组织双方梳理方案优劣，用数据和逻辑共同决策', behavior: '协作引导型，擅长推动建设性讨论，以事实为基础达成共识' },
      { score: 4, text: '站在多方视角整合方案，同时确保团队关系与目标双赢', behavior: '整合共赢型，不仅解决当前问题，更能建立长期信任与协作机制' },
    ],
  },
  {
    id: 'leadership',
    name: '领导力',
    icon: Briefcase,
    color: 'indigo',
    question: '当你负责一个紧急且资源有限的项目时，你会：',
    options: [
      { score: 1, text: '自己承担核心任务，确保按时交付', behavior: '个人贡献者模式，追求自我卓越，但团队赋能不足' },
      { score: 2, text: '分配任务并密切跟踪每个人的进度', behavior: '任务管理型，能够合理分工，但偏过程监控而非激发潜能' },
      { score: 3, text: '明确目标与分工，给予支持并鼓励团队自主完成', behavior: '赋能支持型，信任团队并提供必要资源，注重培养成员能力' },
      { score: 4, text: '塑造愿景激发动力，根据成员优势设计成长型任务并创造突破机会', behavior: '愿景引领型，不仅交付项目更培养未来领导者，创造长期团队价值' },
    ],
  },
  {
    id: 'thinking',
    name: '思维分析',
    icon: Brain,
    color: 'purple',
    question: '面对一个陌生领域的复杂问题，你的思考路径是：',
    options: [
      { score: 1, text: '凭经验先做起来，边做边调整', behavior: '实践试错型，行动力强但可能缺乏系统性规划' },
      { score: 2, text: '请教领域专家，参考已有案例来制定方案', behavior: '经验借鉴型，善于学习他人经验，但原创突破可能不足' },
      { score: 3, text: '拆解问题成子模块，结构化分析后制定优先级方案', behavior: '结构化思维型，擅长系统拆解与逻辑推演，决策质量较高' },
      { score: 4, text: '先理解底层原理，建立框架假设，再通过实验验证迭代', behavior: '第一性原理型，能够穿透现象看本质，产生创新性解决方案' },
    ],
  },
  {
    id: 'execution',
    name: '执行力',
    icon: Target,
    color: 'gold',
    question: '面对一个多目标并行的季度规划，你通常会：',
    options: [
      { score: 1, text: '按紧急程度逐项处理，走一步看一步', behavior: '应急响应型，能应对突发任务但长周期规划较弱' },
      { score: 2, text: '列一个清单按照优先级逐个完成', behavior: '清单管理型，有基本的优先级意识，但缺少里程碑节奏' },
      { score: 3, text: '拆解目标为里程碑和关键任务，建立进度跟踪机制定期复盘', behavior: '目标管理型，掌握OKR等方法，能稳定交付重要目标' },
      { score: 4, text: '先识别关键路径与资源瓶颈，动态排程并建立风险预案，超预期交付', behavior: '战略执行型，不仅能稳定交付，还能预判风险创造额外价值' },
    ],
  },
  {
    id: 'emotional',
    name: '情商逆商',
    icon: HeartHandshake,
    color: 'pink',
    question: '当项目遭遇重大挫折且受到上级质疑时，你通常会：',
    options: [
      { score: 1, text: '情绪低落，需要一段时间才能恢复状态', behavior: '敏感波动型，抗压能力有待提升，易受外部评价影响' },
      { score: 2, text: '接受批评，总结教训后继续努力', behavior: '恢复适应型，能够面对现实，但缺少主动掌控局面的意识' },
      { score: 3, text: '理性分析原因，主动沟通寻求支持并制定改进计划', behavior: '理性应对型，能快速从负面情绪中抽离，主动解决问题' },
      { score: 4, text: '将挫折视为成长契机，主动沟通管理预期，同时带领团队看到积极面并转化为动力', behavior: '韧性超越型，不仅个人抗压能力强，还能赋能团队在逆境中成长' },
    ],
  },
];

const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '苏州', '重庆', '天津', '厦门', '青岛', '长沙', '郑州', '合肥', '佛山', '东莞', '宁波'];

const companySizes = [
  { value: 'startup', label: '初创', sub: '<50人' },
  { value: 'growth', label: '成长', sub: '50-500人' },
  { value: 'mid', label: '中型', sub: '500-2000人' },
  { value: 'large', label: '大型', sub: '>2000人' },
];

const industryPreferences = [
  '互联网/科技', '人工智能', '新能源', '生物医药', '金融科技',
  '电商零售', '游戏娱乐', '教育科技', '企业服务', '智能硬件',
  '汽车出行', '本地生活', '医疗健康', '文化创意', '物流供应链',
];

function SkillSlider({
  skill,
  value,
  onChange,
}: {
  skill: HardSkill;
  value: SkillLevel;
  onChange: (v: SkillLevel) => void;
}) {
  const labels = ['入门', '了解', '熟练', '精通', '专家'];
  const priorityColors = {
    must: 'text-red-600 bg-red-50 border-red-200',
    important: 'text-amber-gold-700 bg-amber-gold-50 border-amber-gold-200',
    nice: 'text-slate-600 bg-slate-50 border-slate-200',
  };
  const priorityLabels = { must: '必备', important: '重要', nice: '加分' };

  return (
    <div className="p-5 rounded-2xl bg-white/60 border border-slate-200/80 hover:border-emerald-200/80 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900">{skill.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[skill.priority]}`}>
              {priorityLabels[skill.priority]}
            </span>
          </div>
          <p className="text-sm text-slate-500">{skill.description}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-2xl font-bold gradient-text">{value}</div>
          <div className="text-xs text-slate-500">目标 {skill.targetLevel}</div>
        </div>
      </div>
      <div className="relative pt-2">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-lavender-400 to-space-indigo-400 rounded-full transition-all duration-500"
            style={{ width: `${(value / 5) * 100}%` }}
          />
          <div
            className="absolute top-0 h-full w-px border-r-2 border-dashed border-slate-300"
            style={{ left: `${(skill.targetLevel / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-3">
          {labels.map((l, i) => {
            const level = (i + 1) as SkillLevel;
            const isActive = value === level;
            const isTarget = skill.targetLevel === level;
            return (
              <button
                key={i}
                onClick={() => onChange(level)}
                className={cn(
                  'group relative flex flex-col items-center gap-1 transition-all',
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all',
                    isActive
                      ? 'bg-gradient-to-br from-emerald-400 to-lavender-500 border-transparent shadow-lg shadow-emerald-500/40 scale-125'
                      : isTarget
                      ? 'border-space-indigo-400 border-dashed bg-transparent'
                      : 'border-slate-300 bg-white group-hover:border-emerald-300'
                  )}
                />
                <span className={cn(
                  'text-xs font-medium transition-all',
                  isActive ? 'text-emerald-600' : 'text-slate-500'
                )}>
                  {l}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { setDiagnosisReport } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<JobLevel | null>(null);
  const [jobSearch, setJobSearch] = useState('');

  const [hardSkillRatings, setHardSkillRatings] = useState<Record<string, SkillLevel>>({});

  const [softSkillSelections, setSoftSkillSelections] = useState<Record<string, number>>({});

  const [salaryMin, setSalaryMin] = useState(15000);
  const [salaryMax, setSalaryMax] = useState(40000);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const industry = industries.find((i) => i.id === selectedIndustry);
  const category = industry?.categories.find((c) => c.id === selectedCategory);
  const filteredJobs = category?.jobs.filter((j) => j.includes(jobSearch)) ?? [];

  const hardSkills = useMemo(() => {
    if (selectedIndustry === 'product') return hardSkillsByJob.product;
    return hardSkillsByJob.default;
  }, [selectedIndustry]);

  const radarData = useMemo(() => {
    const hsAvg = hardSkills.length
      ? Object.values(hardSkillRatings).reduce((a, b) => a + b, 0) / Math.max(hardSkills.length * 5, 1) * 100
      : 0;
    const ssAvg = softSkillDimensions.length
      ? Object.values(softSkillSelections).reduce((a, b) => a + b, 0) / Math.max(softSkillDimensions.length * 4, 1) * 100
      : 0;
    const expScore = selectedLevel
      ? (['entry', 'junior', 'middle', 'senior', 'expert', 'lead'].indexOf(selectedLevel) / 5) * 100
      : 0;
    return [
      { dimension: '硬技能', self: Math.round(hsAvg), target: 85 },
      { dimension: '软技能', self: Math.round(ssAvg), target: 80 },
      { dimension: '经验匹配', self: Math.round(expScore), target: 70 },
      { dimension: '认证资质', self: 35, target: 60 },
      { dimension: '行业认知', self: 55, target: 75 },
      { dimension: '成长潜力', self: 70, target: 85 },
    ];
  }, [hardSkillRatings, softSkillSelections, hardSkills.length, selectedLevel]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const goNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedIndustry && selectedCategory && selectedJob && selectedLevel;
      case 2:
        return hardSkills.every((s) => hardSkillRatings[s.id]);
      case 3:
        return softSkillDimensions.every((d) => softSkillSelections[d.id]);
      case 4:
        return selectedCities.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);

    const hsRatingsTyped: Record<string, SkillLevel> = { ...hardSkillRatings };
    hardSkills.forEach((s) => {
      if (!hsRatingsTyped[s.id]) hsRatingsTyped[s.id] = 3;
    });

    const ssRatingsTyped: Record<string, SkillLevel> = {};
    softSkillDimensions.forEach((d) => {
      const score = (softSkillSelections[d.id] ?? 2) as SkillLevel;
      ssRatingsTyped[d.id] = score;
    });

    const mockHardSkillGaps = hardSkills.map((s): import('@shared/types').SkillGap => ({
      skillId: s.id,
      skillName: s.name,
      currentLevel: hsRatingsTyped[s.id] ?? 3,
      targetLevel: s.targetLevel,
      gap: Math.max(0, s.targetLevel - (hsRatingsTyped[s.id] ?? 3)),
      priority: (s.priority === 'must' ? (s.targetLevel - (hsRatingsTyped[s.id] ?? 3) >= 2 ? 'critical' : 'high') : s.priority === 'important' ? 'medium' : 'low') as GapPriority,
      suggestedAction: `加强${s.name}的学习与实践`,
    }));

    const mockSoftSkillGaps = softSkillDimensions.map((d) => {
      const cur = ssRatingsTyped[d.id] ?? 3;
      const tgt = 4;
      return {
        skillId: d.id,
        skillName: d.name,
        currentLevel: cur,
        targetLevel: tgt,
        gap: Math.max(0, tgt - cur),
        priority: (tgt - cur >= 2 ? 'high' : 'medium') as 'high' | 'medium',
        suggestedAction: `在${d.name}方面持续提升`,
      };
    });

    const mockReport = {
      id: `diag_${Date.now()}`,
      createdAt: new Date().toISOString(),
      targetJob: { id: selectedJob ?? 'job_001', name: selectedJob ?? '产品经理', level: selectedLevel ?? 'middle' },
      overallMatchScore: Math.round(
        radarData.reduce((s, d) => s + d.self, 0) / (radarData.length * 100) * 100
      ),
      radarDimensions: radarData.map((r) => ({ dimension: r.dimension, current: r.self, target: r.target })),
      hardSkillGaps: mockHardSkillGaps,
      softSkillGaps: mockSoftSkillGaps,
      certificationRecommendations: [
        { id: 'cert1', name: 'PMP项目管理', issuer: 'PMI', difficulty: 'intermediate' as const, estimatedHours: 120, relevance: 0.85 },
        { id: 'cert2', name: 'AWS解决方案架构师', issuer: 'Amazon', difficulty: 'advanced' as const, estimatedHours: 200, relevance: 0.72 },
      ],
      promotionPath: {
        fromJobId: selectedJob ?? 'job_001',
        nodes: [
          { id: 'p1', jobName: selectedJob ?? '产品经理', level: selectedLevel ?? 'middle', estimatedMonths: 0, keyThresholds: ['当前'], avgSalaryRange: [salaryMin, salaryMax] as [number, number] },
          { id: 'p2', jobName: `高级${selectedJob ?? '产品经理'}`, level: 'senior', estimatedMonths: 18, keyThresholds: ['独立lead项目', '业务指标达成'], avgSalaryRange: [salaryMax, salaryMax * 1.5] as [number, number] },
          { id: 'p3', jobName: `${selectedJob ?? '产品'}专家/负责人`, level: 'expert', estimatedMonths: 36, keyThresholds: ['行业影响力', '团队管理'], avgSalaryRange: [salaryMax * 1.5, salaryMax * 2.5] as [number, number] },
        ],
        totalEstimatedMonths: 36,
      },
      estimatedReadinessMonths: Math.round(
        mockHardSkillGaps.reduce((s, g) => s + g.gap * 1.5, 0) + mockSoftSkillGaps.reduce((s, g) => s + g.gap * 1, 0)
      ),
      learningPlan: [
        { phase: '基础夯实期', durationWeeks: 8, tasks: ['完成核心技能课程', '每日练习', '加入学习社群'] },
        { phase: '进阶突破期', durationWeeks: 12, tasks: ['参与实战项目', '系统性阅读书籍', '建立作品集'] },
        { phase: '求职冲刺期', durationWeeks: 6, tasks: ['优化简历', '模拟面试', '投递目标公司'] },
      ],
    };

    try {
      try {
        await diagnosisApi.postDiagnosisAssess({
          targetJobId: selectedJob ?? 'job_001',
          targetJobLevel: selectedLevel ?? 'middle',
          hardSkillRatings: hsRatingsTyped,
          softSkillRatings: ssRatingsTyped,
          yearsOfExperience: selectedLevel ? ['entry', 'junior', 'middle', 'senior', 'expert', 'lead'].indexOf(selectedLevel) * 1.5 : 0,
          certificationsHeld: [],
          salaryExpectation: [salaryMin, salaryMax] as [number, number],
          preferredCities: selectedCities,
        });
      } catch {
      }
      setDiagnosisReport(mockReport);
      setTimeout(() => navigate('/diagnosis'), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProgress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen pb-40">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-lavender-500 to-space-indigo-500 flex items-center justify-center shadow-lg shadow-lavender-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg leading-tight">职业诊断向导</h1>
                <p className="text-xs text-slate-500">预计5分钟完成 · 生成个性化报告</p>
              </div>
            </div>
            <ProgressRing percent={stepProgress} size={56} strokeWidth={5} />
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="relative grid grid-cols-4 gap-4">
              {steps.map((s, i) => {
                const isActive = currentStep === s.id;
                const isDone = currentStep > s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                      className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10',
                        isDone
                          ? 'bg-gradient-to-br from-emerald-500 to-lavender-500 border-transparent text-white shadow-lg shadow-emerald-500/40'
                          : isActive
                          ? 'bg-gradient-to-br from-emerald-400 via-lavender-400 to-space-indigo-400 border-transparent text-white shadow-lg shadow-lavender-500/40'
                          : 'bg-white border-slate-200 text-slate-400'
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="font-bold text-sm">{s.id}</span>
                      )}
                      {isActive && (
                        <motion.div
                          className="absolute -inset-1 rounded-full border-2 border-lavender-300/60"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <div className={cn(
                      'mt-2.5 text-center transition-colors',
                      isActive ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'
                    )}>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 1 / 4</div>
                  <h2 className="text-2xl font-bold font-heading">选择你的职业目标</h2>
                </div>
              </div>
              <p className="text-slate-600 mb-8">
                选择目标行业、领域和具体岗位，系统将基于胜任力模型为你进行精准评估
              </p>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-700">选择行业</span>
                  <Badge variant="emerald" size="sm">8个可选</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {industries.map((ind) => {
                    const Icon = ind.icon;
                    const selected = selectedIndustry === ind.id;
                    return (
                      <motion.button
                        key={ind.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedIndustry(ind.id);
                          setSelectedCategory(null);
                          setSelectedJob(null);
                        }}
                        className={cn(
                          'group p-5 rounded-2xl text-left border-2 transition-all duration-300',
                          selected
                            ? 'border-emerald-400 bg-emerald-50/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                            : 'border-slate-200 bg-white hover:border-lavender-200 hover:bg-lavender-50/40'
                        )}
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110',
                          selected ? `bg-gradient-to-br ${ind.color} text-white shadow-lg` : 'bg-slate-100 text-slate-600'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h4 className={cn(
                          'font-bold mb-1 transition-colors',
                          selected ? 'text-emerald-700' : 'text-slate-900 group-hover:text-lavender-700'
                        )}>
                          {ind.name}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{ind.desc}</p>
                        {selected && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1 mt-3 text-xs font-semibold text-emerald-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> 已选择
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {industry && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-slate-700">选择领域</span>
                    <Badge variant="indigo" size="sm">{industry.categories.length}个方向</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {industry.categories.map((cat) => {
                      const selected = selectedCategory === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedJob(null);
                          }}
                          className={cn(
                            'p-4 rounded-xl text-left border-2 transition-all',
                            selected
                              ? 'border-emerald-400 bg-emerald-50/60 shadow-md'
                              : 'border-slate-200 bg-white hover:border-lavender-200'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h5 className={cn('font-semibold text-sm', selected ? 'text-emerald-700' : 'text-slate-800')}>
                              {cat.name}
                            </h5>
                            {selected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <p className="text-xs text-slate-500">{cat.jobs.length}个岗位</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {category && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">搜索并选择具体岗位</span>
                      <Badge variant="purple" size="sm">{filteredJobs.length}个可选</Badge>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        placeholder="搜索岗位..."
                        className="w-56 h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                      />
                      {jobSearch && (
                        <button
                          onClick={() => setJobSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {filteredJobs.map((job) => {
                      const selected = selectedJob === job;
                      return (
                        <motion.button
                          key={job}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedJob(job)}
                          className={cn(
                            'p-4 rounded-xl text-left transition-all border-2',
                            selected
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-lavender-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-lavender-200'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span className={cn(
                              'font-semibold text-sm leading-snug',
                              selected ? 'text-emerald-700' : 'text-slate-800'
                            )}>
                              {job}
                            </span>
                            {selected && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {selectedJob && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-slate-700">选择目标职级</span>
                    <Badge variant="gold" size="sm">6个级别</Badge>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {jobLevels.map((lvl) => {
                      const selected = selectedLevel === lvl.value;
                      return (
                        <motion.button
                          key={lvl.value}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedLevel(lvl.value)}
                          className={cn(
                            'p-4 rounded-xl text-center transition-all border-2',
                            selected
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-lavender-50 shadow-lg'
                              : 'border-slate-200 bg-white hover:border-lavender-200'
                          )}
                        >
                          <div className={cn(
                            'text-lg font-bold mb-0.5',
                            selected ? 'gradient-text' : 'text-slate-900'
                          )}>
                            {lvl.label}
                          </div>
                          <div className="text-xs text-slate-500">{lvl.desc}</div>
                          {selected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {selectedJob && selectedLevel && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-lavender-50 to-space-indigo-50 border-2 border-emerald-200/60"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-amber-gold-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">目标已确认</h4>
                      <p className="text-sm text-slate-600">
                        行业：<span className="font-semibold">{industry?.name}</span>
                        <span className="mx-2 text-slate-400">·</span>
                        领域：<span className="font-semibold">{category?.name}</span>
                        <span className="mx-2 text-slate-400">·</span>
                        岗位：<span className="font-semibold">{selectedJob}</span>
                        <span className="mx-2 text-slate-400">·</span>
                        级别：<span className="font-semibold">{jobLevels.find((l) => l.value === selectedLevel)?.label}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">系统将加载该岗位的{hardSkills.length}项硬技能和5项软技能维度</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 2 / 4</div>
                      <h2 className="text-2xl font-bold font-heading">硬技能自评</h2>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    根据<span className="font-semibold text-slate-900">{selectedJob}</span>的胜任力模型，
                    请对以下{hardSkills.length}项硬技能进行自我评估
                  </p>
                  <div className="space-y-4">
                    {hardSkills.map((skill, i) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <SkillSlider
                          skill={skill}
                          value={(hardSkillRatings[skill.id] ?? 0) as SkillLevel}
                          onChange={(v) => setHardSkillRatings((prev) => ({ ...prev, [skill.id]: v }))}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="sticky top-48">
                    <Card variant="glass" className="p-6">
                      <h3 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-lavender-500" />
                        能力雷达预览
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        随着你的自评实时更新，最终会与目标岗位对比
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name="当前水平"
                              dataKey="self"
                              stroke="#10B981"
                              strokeWidth={2}
                              fill="#10B981"
                              fillOpacity={0.3}
                            />
                            <Radar
                              name="目标水平"
                              dataKey="target"
                              stroke="#8B5CF6"
                              strokeWidth={2}
                              fill="#8B5CF6"
                              fillOpacity={0.15}
                              strokeDasharray="4 4"
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: 8 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">已完成评估</span>
                          <span className="font-semibold text-emerald-600">
                            {Object.keys(hardSkillRatings).length} / {hardSkills.length}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-lavender-500 rounded-full transition-all duration-500"
                            style={{ width: `${(Object.keys(hardSkillRatings).length / hardSkills.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 3 / 4</div>
                  <h2 className="text-2xl font-bold font-heading">软技能场景自评</h2>
                </div>
              </div>
              <p className="text-slate-600 mb-8">
                通过真实工作场景选择最符合你的行为方式，评估你的5大软技能维度
              </p>

              <div className="space-y-8">
                {softSkillDimensions.map((dim, di) => {
                  const Icon = dim.icon;
                  const selected = softSkillSelections[dim.id];
                  const selectedOption = dim.options.find((o) => o.score === selected);
                  const colorMap: Record<string, string> = {
                    emerald: 'from-emerald-400 to-teal-500',
                    indigo: 'from-space-indigo-400 to-blue-500',
                    purple: 'from-lavender-400 to-purple-500',
                    gold: 'from-amber-gold-400 to-orange-500',
                    pink: 'from-pink-400 to-rose-500',
                  };
                  const variantMap: Record<string, 'emerald' | 'indigo' | 'purple' | 'gold'> = {
                    emerald: 'emerald',
                    indigo: 'indigo',
                    purple: 'purple',
                    gold: 'gold',
                    pink: 'purple',
                  };
                  return (
                    <motion.div
                      key={dim.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: di * 0.08 }}
                    >
                      <Card variant="glass" className="p-6">
                        <div className="flex items-start gap-4 mb-5">
                          <div className={cn(
                            'w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md flex-shrink-0',
                            colorMap[dim.color]
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-slate-900">
                                维度 {di + 1}：{dim.name}
                              </h3>
                              {selected && (
                                <Badge variant={variantMap[dim.color]} size="sm" withDot>
                                  {selected}分
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-600 text-sm">{dim.question}</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          {dim.options.map((opt, oi) => {
                            const isSel = selected === opt.score;
                            return (
                              <motion.button
                                key={oi}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSoftSkillSelections((prev) => ({ ...prev, [dim.id]: opt.score }))}
                                className={cn(
                                  'p-4 rounded-xl text-left transition-all duration-300 border-2 relative overflow-hidden',
                                  isSel
                                    ? 'border-emerald-400 bg-emerald-50/80 shadow-md'
                                    : 'border-slate-200 bg-white hover:border-lavender-200 hover:bg-lavender-50/40'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all',
                                    isSel
                                      ? 'bg-gradient-to-br from-emerald-500 to-lavender-500 text-white border-transparent shadow-md'
                                      : 'bg-white border-slate-300 text-slate-500'
                                  )}>
                                    {isSel ? <CheckCircle2 className="w-4 h-4" /> : opt.score}
                                  </div>
                                  <span className={cn(
                                    'text-sm leading-relaxed font-medium',
                                    isSel ? 'text-emerald-800' : 'text-slate-700'
                                  )}>
                                    {opt.text}
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                        <AnimatePresence mode="wait">
                          {selectedOption && (
                            <motion.div
                              key={selected}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-4 border-t border-slate-200/60 flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-lavender-100 flex-shrink-0">
                                  <Sparkles className="w-4 h-4 text-lavender-600" />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-lavender-700 mb-0.5">典型行为画像</div>
                                  <p className="text-sm text-slate-600 leading-relaxed">{selectedOption.behavior}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 4 / 4</div>
                  <h2 className="text-2xl font-bold font-heading">设定期望条件</h2>
                </div>
              </div>
              <p className="text-slate-600 mb-8">
                告诉我们你的求职偏好，系统将结合能力评估进行多维度匹配推荐
              </p>

              <div className="space-y-8">
                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">期望薪资范围</h3>
                        <p className="text-xs text-slate-500">拖动滑块选择月薪范围（单位：元）</p>
                      </div>
                    </div>
                    <Badge variant="gold" size="md">
                      {salaryMin.toLocaleString()} - {salaryMax.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="relative px-4 py-8">
                    <div className="relative h-2 bg-slate-200 rounded-full">
                      <div
                        className="absolute inset-y-0 bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 rounded-full"
                        style={{
                          left: `${((salaryMin - 5000) / 95000) * 100}%`,
                          right: `${100 - ((salaryMax - 5000) / 95000) * 100}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={5000}
                        max={100000}
                        step={1000}
                        value={salaryMin}
                        onChange={(e) => {
                          const val = Math.min(Number(e.target.value), salaryMax - 5000);
                          setSalaryMin(val);
                        }}
                        className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <input
                        type="range"
                        min={5000}
                        max={100000}
                        step={1000}
                        value={salaryMax}
                        onChange={(e) => {
                          const val = Math.max(Number(e.target.value), salaryMin + 5000);
                          setSalaryMax(val);
                        }}
                        className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-lavender-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between mt-3 text-xs text-slate-500">
                      <span>5K</span><span>25K</span><span>50K</span><span>75K</span><span>100K</span>
                    </div>
                  </div>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">期望城市</h3>
                        <p className="text-xs text-slate-500">可多选，已选 {selectedCities.length} 个</p>
                      </div>
                    </div>
                    {selectedCities.length > 0 && (
                      <button
                        onClick={() => setSelectedCities([])}
                        className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => {
                      const selected = selectedCities.includes(city);
                      return (
                        <motion.button
                          key={city}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleCity(city)}
                          className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200',
                            selected
                              ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-lavender-50 text-emerald-700 shadow-md'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-lavender-300 hover:bg-lavender-50/40'
                          )}
                        >
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                          {city}
                        </motion.button>
                      );
                    })}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-xl text-sm font-medium border-2 border-dashed border-slate-300 text-slate-500 hover:border-lavender-400 hover:text-lavender-600 transition-all"
                    >
                      + 更多城市
                    </motion.button>
                  </div>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">公司规模偏好</h3>
                      <p className="text-xs text-slate-500">选择你倾向的公司发展阶段</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {companySizes.map((sz) => {
                      const selected = selectedSize === sz.value;
                      return (
                        <motion.button
                          key={sz.value}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSize(selected ? null : sz.value)}
                          className={cn(
                            'p-4 rounded-xl text-center border-2 transition-all',
                            selected
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-lavender-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-lavender-200'
                          )}
                        >
                          <div className={cn(
                            'text-lg font-bold mb-1',
                            selected ? 'gradient-text' : 'text-slate-900'
                          )}>
                            {sz.label}
                          </div>
                          <div className="text-xs text-slate-500">{sz.sub}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </Card>

                <Card variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">行业偏好</h3>
                        <p className="text-xs text-slate-500">可多选，优先匹配这些行业的岗位</p>
                      </div>
                    </div>
                    {selectedIndustries.length > 0 && (
                      <button
                        onClick={() => setSelectedIndustries([])}
                        className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {industryPreferences.map((ind) => {
                      const selected = selectedIndustries.includes(ind);
                      return (
                        <motion.button
                          key={ind}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleIndustry(ind)}
                          className={cn(
                            'px-3.5 py-1.5 rounded-full text-xs font-medium border-2 transition-all',
                            selected
                              ? 'border-lavender-400 bg-lavender-50 text-lavender-700 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                          )}
                        >
                          {ind}
                        </motion.button>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-white/80 border-t border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            {currentStep > 1 && (
              <span className="text-sm text-slate-500">
                完成进度：<span className="font-semibold text-slate-700">{Math.round((currentStep / steps.length) * 100)}%</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentStep === 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              上一步
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                下一步
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                生成诊断报告
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
