import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  TrendingUp,
  BookOpen,
  Award,
  Video,
  CalendarDays,
  CheckCircle2,
  Clock,
  Target,
  Star,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Lock,
  FileText,
  Eye,
  MessageSquare,
  Building2,
  Briefcase,
  GraduationCap,
  Zap,
  BarChart3,
  ListTodo,
  PlayCircle,
  ArrowRight,
  Flame,
  Trophy,
  Rocket,
  Lightbulb,
  Brain,
  Shield,
  Users,
  Send,
  ThumbsUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type TabKey = 'timeline' | 'learning' | 'achievements' | 'interviews';

const DIAGNOSIS_DIMENSIONS = ['技术深度', '工程能力', '团队协作', '沟通表达', '学习能力', '领导力'];

const mockProfile: any = {
  id: 'u100',
  name: '张启航',
  avatar: '',
  role: 'jobseeker',
  currentJob: '中级前端工程师',
  currentLevel: 'P5',
  joinYears: 2.5,
  targetJob: '高级前端工程师',
  growthLevel: '快速成长型',
  email: 'zhangqihang@email.com',
  diagnosisHistory: [
    {
      date: '2025-12',
      label: '初次诊断',
      scores: [62, 58, 65, 60, 72, 48],
    },
    {
      date: '2026-03',
      label: '第二次诊断',
      scores: [72, 65, 70, 68, 82, 55],
    },
    {
      date: '2026-06',
      label: '最新诊断',
      scores: [82, 75, 78, 76, 90, 65],
    },
  ],
  timeline: [
    { id: 't1', date: '2026-06-15', type: 'diagnosis', title: '完成第三次能力诊断', description: '综合能力评分 78.2 分，较上次提升 9.5 分，技术深度与学习能力进步显著' },
    { id: 't2', date: '2026-06-10', type: 'skill-up', title: '进阶技能：微前端架构', description: '完成qiankun实战课程，掌握微前端架构设计与性能优化' },
    { id: 't3', date: '2026-06-02', type: 'certification', title: '获得AWS云从业者认证', description: '通过AWS Certified Cloud Practitioner认证考试' },
    { id: 't4', date: '2026-05-25', type: 'interview', title: '字节跳动面试', description: '高级前端岗位，完成前三轮技术面，HR面待安排' },
    { id: 't5', date: '2026-05-18', type: 'job-offer', title: '收到腾讯Offer', description: '中级前端工程师，薪资 28K * 16，已接受意向书' },
    { id: 't6', date: '2026-05-08', type: 'skill-up', title: '进阶技能：React原理', description: '深入学习React 18源码，掌握调度器、Fiber架构等核心机制' },
    { id: 't7', date: '2026-04-20', type: 'certification', title: '完成Meta React证书', description: '通过Meta官方Front-End Developer专业证书认证' },
    { id: 't8', date: '2026-03-15', type: 'diagnosis', title: '完成第二次能力诊断', description: '综合能力评分 68.7 分，较首次提升 7.8 分' },
    { id: 't9', date: '2026-02-28', type: 'interview', title: '阿里巴巴面试', description: '通过P6初筛，技术一面通过，二面未通过' },
    { id: 't10', date: '2026-01-10', type: 'skill-up', title: '基础技能：TypeScript进阶', description: '完成TS高级类型体操，掌握类型编程与实战模式' },
    { id: 't11', date: '2025-12-20', type: 'diagnosis', title: '完成首次能力诊断', description: '综合能力评分 60.9 分，建立基线，制定成长计划' },
  ],
  learning: {
    totalTasks: 42,
    inProgress: 8,
    completed: 30,
    overallProgress: 71,
    weeklyTasks: [
      { id: 'lt1', name: '《React设计模式与最佳实践》', phase: '进阶期', deadline: '06-22', progress: 65, priority: 'high' },
      { id: 'lt2', name: '算法：动态规划专题 20 题', phase: '基础期', deadline: '06-20', progress: 45, priority: 'high' },
      { id: 'lt3', name: 'Node.js 微服务实战项目', phase: '进阶期', deadline: '06-25', progress: 30, priority: 'medium' },
      { id: 'lt4', name: '面试八股：浏览器原理', phase: '冲刺期', deadline: '06-19', progress: 80, priority: 'high' },
      { id: 'lt5', name: '英语口语：每日30分钟', phase: '基础期', deadline: '长期', progress: 40, priority: 'low' },
      { id: 'lt6', name: '性能优化指标监控实践', phase: '进阶期', deadline: '06-28', progress: 15, priority: 'medium' },
    ],
    calendarData: generateCalendarData(),
  },
  achievements: {
    earned: [
      { id: 'a1', name: '诊断先锋', desc: '完成首次能力诊断', icon: Brain, category: '能力类', earnedAt: '2025-12-20', color: 'from-purple-500 to-lavender-500' },
      { id: 'a2', name: '学习达人', desc: '累计完成20个学习任务', icon: BookOpen, category: '学习类', earnedAt: '2026-03-10', color: 'from-blue-500 to-space-indigo-500' },
      { id: 'a3', name: '连燃30天', desc: '连续学习30天不间断', icon: Flame, category: '学习类', earnedAt: '2026-04-15', color: 'from-orange-500 to-amber-gold-500' },
      { id: 'a4', name: '面试新星', desc: '通过首次大厂面试', icon: Video, category: '求职类', earnedAt: '2026-02-28', color: 'from-emerald-500 to-teal-500' },
      { id: 'a5', name: '能力跃迁', desc: '单次诊断提升≥10分', icon: Rocket, category: '能力类', earnedAt: '2026-06-15', color: 'from-pink-500 to-rose-500' },
      { id: 'a6', name: '认证猎手', desc: '获得首项专业认证', icon: Award, category: '里程碑', earnedAt: '2026-04-20', color: 'from-lavender-500 to-purple-600' },
      { id: 'a7', name: '技能专精', desc: '精通一项核心技能', icon: Zap, category: '能力类', earnedAt: '2026-05-08', color: 'from-yellow-400 to-orange-500' },
      { id: 'a8', name: 'Offer收割', desc: '获得第一份大厂Offer', icon: Trophy, category: '里程碑', earnedAt: '2026-05-18', color: 'from-emerald-400 to-emerald-600' },
      { id: 'a9', name: '创新探索者', desc: '完成创新项目实践', icon: Lightbulb, category: '学习类', earnedAt: '2026-06-02', color: 'from-cyan-400 to-blue-500' },
    ],
    locked: [
      { id: 'l1', name: '架构师之路', desc: '学习进度达到90%', icon: Shield, category: '能力类', progress: 71, total: 90, color: 'from-slate-500 to-slate-600' },
      { id: 'l2', name: 'Offer满贯', desc: '获得5个及以上Offer', icon: Users, category: '求职类', progress: 1, total: 5, color: 'from-slate-500 to-slate-600' },
      { id: 'l3', name: '百题斩', desc: '算法刷题满100道', icon: Target, category: '学习类', progress: 47, total: 100, color: 'from-slate-500 to-slate-600' },
      { id: 'l4', name: '全职Offer', desc: '成功入职心仪岗位', icon: Star, category: '里程碑', progress: 85, total: 100, color: 'from-slate-500 to-slate-600' },
      { id: 'l5', name: '技术达人', desc: '获得3项专业认证', icon: GraduationCap, category: '能力类', progress: 2, total: 3, color: 'from-slate-500 to-slate-600' },
    ],
  },
  interviews: [
    {
      id: 'iv1',
      company: '字节跳动',
      logo: '🏢',
      position: '高级前端工程师',
      date: '2026-05-25',
      round: '第3轮 / 共4轮',
      result: '进行中',
      resultType: 'pending',
      feedback: '三面通过，技术深度与系统设计能力获好评，等待HR终面安排。建议准备薪资谈判与职业规划相关问题。',
    },
    {
      id: 'iv2',
      company: '腾讯',
      logo: '🐧',
      position: '中级前端工程师（IEG）',
      date: '2026-05-18',
      round: '全部完成',
      result: '已发Offer',
      resultType: 'offer',
      feedback: '面试表现优异，技术能力扎实，沟通顺畅。薪资 28K * 16，可接受意向。',
    },
    {
      id: 'iv3',
      company: '阿里巴巴',
      logo: '🛒',
      position: '高级前端工程师（P6）',
      date: '2026-02-28',
      round: '第2轮 / 共4轮',
      result: '未通过',
      resultType: 'fail',
      feedback: '一面表现良好，二面系统设计环节暴露出架构能力不足。建议加强：1）分布式系统设计 2）高并发场景处理经验。3个月后可再次投递。',
    },
    {
      id: 'iv4',
      company: '美团',
      logo: '🛵',
      position: '前端开发工程师',
      date: '2026-01-15',
      round: '第2轮 / 共3轮',
      result: '已拒绝',
      resultType: 'reject',
      feedback: '通过两轮技术面，岗位方向与个人发展规划不完全匹配，主动放弃后续流程。',
    },
    {
      id: 'iv5',
      company: '小红书',
      logo: '📕',
      position: '前端工程师（增长团队）',
      date: '2025-12-20',
      round: '第1轮 / 共3轮',
      result: '未通过',
      resultType: 'fail',
      feedback: '初筛通过，一面基础算法题表现待加强。建议增加算法训练量，同时优化简历项目描述。',
    },
  ],
};

function generateCalendarData() {
  const data: Record<string, number> = {};
  const today = new Date('2026-06-18');
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const weekday = d.getDay();
    if (weekday === 0 || weekday === 6) {
      data[key] = Math.random() > 0.3 ? Math.floor(Math.random() * 240) + 30 : 0;
    } else {
      data[key] = Math.random() > 0.1 ? Math.floor(Math.random() * 300) + 60 : 0;
    }
  }
  return data;
}

const TIMELINE_ICONS: Record<string, any> = {
  diagnosis: { icon: Brain, color: 'from-lavender-500 to-purple-500' },
  'skill-up': { icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
  certification: { icon: Award, color: 'from-amber-gold-500 to-orange-500' },
  interview: { icon: Video, color: 'from-space-indigo-500 to-blue-500' },
  'job-offer': { icon: Trophy, color: 'from-pink-500 to-rose-500' },
};

const TIMELINE_LABELS: Record<string, string> = {
  diagnosis: '能力诊断',
  'skill-up': '技能提升',
  certification: '专业认证',
  interview: '面试记录',
  'job-offer': '录用通知',
};

const PROGRESS_COLOR: Record<string, string> = {
  high: 'from-red-500 via-orange-500 to-amber-gold-500',
  medium: 'from-space-indigo-500 via-lavender-500 to-purple-500',
  low: 'from-blue-400 to-sky-500',
};

const PROGRESS_LABEL: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const RESULT_STYLE: Record<string, { bg: string; text: string; badge: any; icon: any }> = {
  offer: { bg: 'from-emerald-50 via-lavender-50/30 to-white', text: 'text-emerald-600', badge: 'success', icon: Trophy },
  pending: { bg: 'from-amber-gold-50 via-space-indigo-50/30 to-white', text: 'text-amber-gold-600', badge: 'gold', icon: Clock },
  fail: { bg: 'from-red-50 via-slate-50/30 to-white', text: 'text-red-600', badge: 'destructive' as any, icon: AlertCircle },
  reject: { bg: 'from-slate-50 via-space-indigo-50/30 to-white', text: 'text-slate-600', badge: 'default', icon: CheckCircle2 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const LearningCalendar: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const weeks: { date: Date; value: number }[][] = [];
  const today = new Date('2026-06-18');
  const start = new Date(today);
  start.setDate(start.getDate() - 89);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  let current = new Date(start);
  let week: { date: Date; value: number }[] = [];
  while (current <= today) {
    const key = current.toISOString().split('T')[0];
    week.push({ date: new Date(current), value: data[key] || 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const getColor = (v: number) => {
    if (v === 0) return 'bg-slate-100';
    if (v < 60) return 'bg-emerald-100';
    if (v < 120) return 'bg-emerald-200';
    if (v < 180) return 'bg-emerald-300';
    if (v < 240) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  const total = Object.values(data).reduce((s, v) => s + v, 0);
  const hours = Math.round(total / 60);
  const activeDays = Object.values(data).filter((v) => v > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-slate-500">近3个月学习</p>
            <p className="text-2xl font-heading font-bold gradient-text">{hours}<span className="text-sm text-slate-400 ml-1">小时</span></p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-500">活跃天数</p>
            <p className="text-2xl font-heading font-bold text-emerald-600">{activeDays}<span className="text-sm text-slate-400 ml-1">天</span></p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-500">日均学习</p>
            <p className="text-2xl font-heading font-bold text-space-indigo-600">{Math.round(total / 90)}<span className="text-sm text-slate-400 ml-1">分钟</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>少</span>
          {['bg-slate-100', 'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
            <div key={i} className={`w-4 h-4 rounded ${c}`} />
          ))}
          <span>多</span>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {w.map((d, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={`${d.date.toLocaleDateString('zh-CN')}: ${d.value}分钟`}
                  className={cn(
                    'w-4 h-4 rounded transition-all hover:ring-2 hover:ring-space-indigo-300 cursor-pointer',
                    getColor(d.value)
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1 mt-2 text-[10px] text-slate-400 pl-0">
        <div className="w-4" />
        <div className="w-4">一</div>
        <div className="w-4" />
        <div className="w-4">三</div>
        <div className="w-4" />
        <div className="w-4">五</div>
        <div className="w-4">六</div>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(mockProfile);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await usersApi.getProfile();
        if (res) setProfile({ ...mockProfile, ...res });
      } catch (e) {
        setProfile(mockProfile);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const diagnosisChartData = useMemo(() => {
    const histories = profile.diagnosisHistory;
    return DIAGNOSIS_DIMENSIONS.map((dim, i) => ({
      dimension: dim,
      [histories[0].label]: histories[0].scores[i],
      [histories[1].label]: histories[1].scores[i],
      [histories[2].label]: histories[2].scores[i],
    }));
  }, [profile.diagnosisHistory]);

  const tabs: { key: TabKey; label: string; icon: any; count?: string }[] = [
    { key: 'timeline', label: '成长时间轴', icon: Brain },
    { key: 'learning', label: '学习任务中心', icon: ListTodo, count: `${profile.learning.inProgress}` },
    { key: 'achievements', label: '成就徽章墙', icon: Trophy, count: `${profile.achievements.earned.length}` },
    { key: 'interviews', label: '面试记录', icon: Video, count: `${profile.interviews.length}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-space-indigo-50/20 to-lavender-50/30 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-12 gap-6"
        >
          <Card variant="gradient" className="col-span-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-lavender-500/5 via-space-indigo-500/5 to-emerald-500/5" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-space-indigo-500 via-lavender-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-lavender-200/50">
                    <User className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-xl bg-white shadow-lg border border-slate-200/60">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-gold-500" />
                      <span className="text-xs font-bold text-slate-800">{profile.growthLevel}</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-heading font-bold gradient-text">{profile.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">{profile.currentJob}</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="indigo">{profile.currentLevel}</Badge>
                  <Badge variant="emerald">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    目标: {profile.targetJob}
                  </Badge>
                </div>
                <div className="w-full mt-6 pt-6 border-t border-slate-200/60 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      入职工龄
                    </span>
                    <span className="font-bold text-slate-800">{profile.joinYears} 年</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      成长等级
                    </span>
                    <span className="font-bold text-lavender-700">Lv. 7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      综合评分
                    </span>
                    <span className="font-bold text-emerald-700">78.2</span>
                  </div>
                </div>
                <div className="w-full mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" fullWidth size="sm">
                    <Edit3Icon className="w-4 h-4" />
                    编辑资料
                  </Button>
                  <Button variant="primary" fullWidth size="sm">
                    <Brain className="w-4 h-4" />
                    开始诊断
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-8 space-y-6">
            <div className="flex gap-2 border-b border-slate-200 pb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative px-5 py-3 flex items-center gap-2 text-sm font-medium transition-all -mb-px',
                      isActive
                        ? 'text-space-indigo-600'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count && (
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        isActive
                          ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white'
                          : 'bg-slate-100 text-slate-600'
                      )}>
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="profileTabUnderline"
                        className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-emerald-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                variants={containerVariants}
              >
                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <motion.div variants={itemVariants}>
                      <Card variant="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-lavender-500" />
                                历次诊断对比
                              </CardTitle>
                              <CardDescription>3次诊断 · 6维度能力变化追踪</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                              对比详情
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={diagnosisChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="lineGrad1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3A5FA8" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#3A5FA8" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                                <Tooltip
                                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line
                                  type="monotone"
                                  dataKey={profile.diagnosisHistory[0].label}
                                  stroke="#94A3B8"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  dot={{ r: 4, fill: '#94A3B8' }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey={profile.diagnosisHistory[1].label}
                                  stroke="#8B5CF6"
                                  strokeWidth={2.5}
                                  dot={{ r: 5, fill: '#8B5CF6' }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey={profile.diagnosisHistory[2].label}
                                  stroke="#10B981"
                                  strokeWidth={3}
                                  dot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card variant="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-emerald-500" />
                                成长足迹
                              </CardTitle>
                              <CardDescription>记录你职业道路上的每一步成长</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {(Object.keys(TIMELINE_LABELS) as string[]).map((k) => (
                                <Badge key={k} variant={k === 'diagnosis' ? 'purple' : k === 'skill-up' ? 'emerald' : k === 'certification' ? 'gold' : k === 'interview' ? 'indigo' : 'success'} size="sm">
                                  {TIMELINE_LABELS[k]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="relative">
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-lavender-400 via-space-indigo-400 to-pink-400" />
                            <div className="space-y-1">
                              {profile.timeline.map((item: any, i: number) => {
                                const cfg = TIMELINE_ICONS[item.type];
                                const Icon = cfg.icon;
                                return (
                                  <motion.div
                                    key={item.id}
                                    variants={itemVariants}
                                    className="relative pl-16 py-3 group"
                                  >
                                    <div className={cn(
                                      'absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 bg-gradient-to-br',
                                      cfg.color
                                    )}>
                                      <Icon className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <div className="p-5 rounded-2xl bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 hover:shadow-md hover:border-l-4 hover:border-l-lavender-400 transition-all">
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-slate-800">{item.title}</h4>
                                            <Badge variant={item.type === 'diagnosis' ? 'purple' : item.type === 'skill-up' ? 'emerald' : item.type === 'certification' ? 'gold' : item.type === 'interview' ? 'indigo' : 'success'} size="sm" withDot>
                                              {TIMELINE_LABELS[item.type]}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{item.date}</span>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}

                {activeTab === 'learning' && (
                  <div className="space-y-6">
                    <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
                      <Card variant="gradient" className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white">
                            <ListTodo className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">总任务数</p>
                            <p className="text-2xl font-heading font-bold gradient-text">{profile.learning.totalTasks}</p>
                          </div>
                        </div>
                      </Card>
                      <Card variant="gradient" className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-gold-500 to-orange-500 flex items-center justify-center text-white">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">进行中</p>
                            <p className="text-2xl font-heading font-bold text-amber-gold-700">{profile.learning.inProgress}</p>
                          </div>
                        </div>
                      </Card>
                      <Card variant="gradient" className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">已完成</p>
                            <p className="text-2xl font-heading font-bold text-emerald-700">{profile.learning.completed}</p>
                          </div>
                        </div>
                      </Card>
                      <Card variant="gradient" className="p-5">
                        <div className="flex items-center gap-3">
                          <ProgressRing percent={profile.learning.overallProgress} size={44} strokeWidth={5} />
                          <div>
                            <p className="text-xs text-slate-500">总进度</p>
                            <p className="text-2xl font-heading font-bold text-space-indigo-700">{profile.learning.overallProgress}%</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card variant="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <PlayCircle className="w-5 h-5 text-emerald-500" />
                                本周任务
                              </CardTitle>
                              <CardDescription>聚焦重点，高效推进</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                              <PlusIcon className="w-4 h-4" />
                              添加任务
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {profile.learning.weeklyTasks.map((task: any, i: number) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="p-4 rounded-2xl bg-gradient-to-r from-white via-slate-50/40 to-white border border-slate-200/60 hover:shadow-md transition-all group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                      i < 2 ? 'bg-gradient-to-br from-red-400 to-orange-400 text-white' :
                                      i < 4 ? 'bg-gradient-to-br from-space-indigo-400 to-lavender-400 text-white' :
                                      'bg-gradient-to-br from-blue-400 to-sky-400 text-white'
                                    )}>
                                      <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-800">{task.name}</h4>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                          <GraduationCap className="w-3.5 h-3.5" />
                                          {task.phase}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5" />
                                          截止 {task.deadline}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant={task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'indigo' : 'info'} size="sm">
                                      {PROGRESS_LABEL[task.priority]}
                                    </Badge>
                                    <div className="text-right min-w-[70px]">
                                      <p className="text-lg font-heading font-bold text-slate-800">{task.progress}%</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${task.progress}%` }}
                                    transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                                    className={cn('h-full rounded-full bg-gradient-to-r', PROGRESS_COLOR[task.priority])}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card variant="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                学习日历热力图
                              </CardTitle>
                              <CardDescription>坚持每一天，见证你的成长轨迹</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <LearningCalendar data={profile.learning.calendarData} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}

                {activeTab === 'achievements' && (
                  <div className="space-y-6">
                    <motion.div variants={itemVariants}>
                      <Card variant="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-gold-500" />
                                已获得徽章
                                <span className="ml-2 text-sm font-normal text-slate-500">（{profile.achievements.earned.length} 枚）</span>
                              </CardTitle>
                              <CardDescription>每一枚徽章都是成长的见证</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {['能力类', '学习类', '求职类', '里程碑'].map((c) => (
                                <Badge key={c} variant={c === '能力类' ? 'indigo' : c === '学习类' ? 'emerald' : c === '求职类' ? 'purple' : 'gold'} size="sm">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-5 gap-5">
                            {profile.achievements.earned.map((a: any, i: number) => {
                              const Icon = a.icon;
                              return (
                                <motion.div
                                  key={a.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                                  whileHover={{ scale: 1.05, y: -4 }}
                                  className="relative group"
                                >
                                  <div className={cn(
                                    'absolute -inset-3 rounded-3xl opacity-30 blur-xl bg-gradient-to-br',
                                    a.color,
                                    'group-hover:opacity-60 transition-opacity animate-pulse-glow'
                                  )} />
                                  <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white via-lavender-50/30 to-emerald-50/30 border border-white shadow-lg text-center">
                                    <div className={cn(
                                      'w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-3',
                                      a.color
                                    )}>
                                      <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h4 className="font-heading font-bold text-slate-800 text-sm">{a.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-tight">{a.desc}</p>
                                    <Badge variant={a.category === '能力类' ? 'indigo' : a.category === '学习类' ? 'emerald' : a.category === '求职类' ? 'purple' : 'gold'} size="sm" className="mt-3">
                                      {a.category}
                                    </Badge>
                                    <p className="text-[10px] text-slate-400 mt-2">{a.earnedAt}</p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card variant="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-400" />
                                待解锁徽章
                                <span className="ml-2 text-sm font-normal text-slate-500">（{profile.achievements.locked.length} 枚）</span>
                              </CardTitle>
                              <CardDescription>加油，下一枚徽章就在前方！</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-5 gap-5">
                            {profile.achievements.locked.map((a: any, i: number) => {
                              const Icon = a.icon;
                              const pct = Math.round((a.progress / a.total) * 100);
                              return (
                                <motion.div
                                  key={a.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.08 }}
                                  className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-200 text-center"
                                >
                                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-3 opacity-60">
                                    <div className="relative">
                                      <Icon className="w-8 h-8 text-white opacity-40" />
                                      <Lock className="absolute -right-1 -bottom-1 w-4 h-4 text-slate-500 bg-white rounded-full p-0.5" />
                                    </div>
                                  </div>
                                  <h4 className="font-heading font-bold text-slate-500 text-sm">{a.name}</h4>
                                  <p className="text-xs text-slate-400 mt-1 leading-tight">{a.desc}</p>
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                      <span>{a.progress} / {a.total}</span>
                                      <span>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                                        className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-500"
                                      />
                                    </div>
                                  </div>
                                  <Badge variant="default" size="sm" className="mt-3">
                                    {a.category}
                                  </Badge>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}

                {activeTab === 'interviews' && (
                  <div className="space-y-4">
                    {profile.interviews.map((iv: any, i: number) => {
                      const style = RESULT_STYLE[iv.resultType];
                      const ResultIcon = style.icon;
                      return (
                        <motion.div
                          key={iv.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <Card variant="gradient" className="overflow-hidden">
                            <CardContent className={cn('p-6 bg-gradient-to-r', style.bg)}>
                              <div className="flex items-start gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 flex items-center justify-center text-3xl shadow-sm shrink-0">
                                  {iv.logo}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-xl font-heading font-bold text-slate-800 truncate">
                                          {iv.company}
                                        </h3>
                                        <Badge variant={style.badge} size="sm" withDot>
                                          <ResultIcon className="w-3 h-3 mr-1" />
                                          {iv.result}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                                          <Briefcase className="w-4 h-4 text-space-indigo-500" />
                                          {iv.position}
                                        </span>
                                        <span className="text-slate-300">|</span>
                                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                                          <Video className="w-4 h-4 text-lavender-500" />
                                          {iv.round}
                                        </span>
                                        <span className="text-slate-300">|</span>
                                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                                          <CalendarDays className="w-4 h-4 text-slate-400" />
                                          {iv.date}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                        详情
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/50">
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="w-4 h-4 text-space-indigo-500 mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-1">面试官反馈</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{iv.feedback}</p>
                                      </div>
                                    </div>
                                    {iv.resultType === 'fail' && (
                                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                          <Lightbulb className="w-3.5 h-3.5 text-amber-gold-500" />
                                          系统已生成针对性提升建议
                                        </span>
                                        <Button variant="outline" size="sm" className="text-xs h-8">
                                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                                          查看建议
                                        </Button>
                                      </div>
                                    )}
                                    {iv.resultType === 'offer' && (
                                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                                        <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                          <ThumbsUp className="w-3.5 h-3.5" />
                                          恭喜！这是对你能力的认可
                                        </span>
                                        <Button variant="primary" size="sm" className="text-xs h-8">
                                          <Send className="w-3.5 h-3.5 mr-1" />
                                          发送感谢信
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function Edit3Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default Profile;
