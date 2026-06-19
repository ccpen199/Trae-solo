import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Calendar,
  FileCheck,
  Mail,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Award,
  Briefcase,
  CalendarClock,
  User,
  TrendingUp,
  Star,
  Send,
  Paperclip,
  Plus,
  X,
  Target,
  Tag,
  Sparkles,
  FileText,
  Edit3,
  Download,
  Upload,
  Clock,
  MessageCircle,
  Video,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { hrApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PotentialLevel, TalentStatus, FollowUpType } from '@shared/types';

const POTENTIAL_BADGE: Record<PotentialLevel, { variant: BadgeVariant; label: string; gradient: string }> = {
  S: { variant: 'purple', label: 'S级 · 顶尖潜力', gradient: 'from-purple-500 via-lavender-500 to-purple-600' },
  A: { variant: 'indigo', label: 'A级 · 高潜力', gradient: 'from-space-indigo-500 to-space-indigo-600' },
  B: { variant: 'info', label: 'B级 · 良好潜力', gradient: 'from-blue-500 to-blue-600' },
  C: { variant: 'default', label: 'C级 · 待观察', gradient: 'from-slate-500 to-slate-600' },
};

const STATUS_BADGE: Record<TalentStatus, { variant: BadgeVariant; label: string }> = {
  new: { variant: 'purple', label: '新入库' },
  contacted: { variant: 'indigo', label: '已联系' },
  screening: { variant: 'emerald', label: '初筛中' },
  interview: { variant: 'gold', label: '面试中' },
  offer: { variant: 'success', label: '已发Offer' },
  archived: { variant: 'default', label: '已归档' },
};

type TabKey = 'competency' | 'growth' | 'followups' | 'remarks';

interface TalentDetailMock {
  id: string;
  userId: string;
  userSummary: {
    name: string;
    avatar: string;
    currentJob: string;
    yearsOfExperience: number;
    keySkills: string[];
    matchScore: number;
    email?: string;
    phone?: string;
    location?: string;
    expectedSalary?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  potentialLevel: PotentialLevel;
  tags: string[];
  status: TalentStatus;
  lastFollowUpAt?: string;
  nextFollowUpAt?: string;
  notes: string;
  addedAt: string;
  matchJobs: { jobId: string; jobTitle: string; score: number; suggestedPeriod?: string }[];
  competencyRadar: { dimension: string; current: number; target: number }[];
  hardSkillsTop10: { name: string; level: number }[];
  softSkills: { name: string; level: number; description: string }[];
  certifications: { id: string; name: string; issuer: string; date: string; difficulty: string }[];
  growthPotential: {
    overallScore: number;
    dimensions: { dimension: string; score: number }[];
    promotionForecast: { year: number; optimistic: number; neutral: number; conservative: number; label: string }[];
  };
  followUps: { id: string; date: string; type: FollowUpType; content: string; operator: string }[];
  remarks: { content: string; attachments: { id: string; name: string; size: string; type: string }[] };
}

const FOLLOW_UP_ICONS: Record<FollowUpType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  interview: Video,
  'check-in': MessageCircle,
};

const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  call: '电话沟通',
  email: '邮件往来',
  interview: '面试安排',
  'check-in': '日常回访',
};

const mockTalentDetail: TalentDetailMock = {
  id: '1',
  userId: 'u1',
  userSummary: {
    name: '陈思远',
    avatar: '',
    currentJob: '高级前端工程师',
    yearsOfExperience: 5,
    keySkills: ['React', 'TypeScript', 'Node.js', 'Vue', 'Webpack', '性能优化', '微前端', 'GraphQL', 'Jest', 'Docker'],
    matchScore: 92,
    email: 'chensiyuan@email.com',
    phone: '138****8888',
    location: '上海',
    expectedSalary: '30-40K',
    linkedin: 'linkedin.com/in/chensiyuan',
    github: 'github.com/chensiyuan',
    website: 'chensiyuan.dev',
  },
  potentialLevel: 'S',
  tags: ['高潜力', '985背景', '大厂经验', '技术博客', '开源贡献'],
  status: 'interview',
  lastFollowUpAt: '2026-06-15T10:00:00Z',
  nextFollowUpAt: '2026-06-19T14:00:00Z',
  notes: '技术能力非常强，沟通顺畅，终面通过，等待谈薪。对技术有深度追求，有团队管理经验。需要确认薪资期望和入职时间。',
  addedAt: '2026-05-10T00:00:00Z',
  matchJobs: [
    { jobId: 'j1', jobTitle: '高级前端工程师', score: 92, suggestedPeriod: '2周' },
    { jobId: 'j2', jobTitle: '前端技术专家', score: 85, suggestedPeriod: '1-2月' },
    { jobId: 'j3', jobTitle: '全栈开发工程师', score: 78, suggestedPeriod: '1个月' },
  ],
  competencyRadar: [
    { dimension: '技术深度', current: 88, target: 85 },
    { dimension: '工程能力', current: 90, target: 80 },
    { dimension: '团队协作', current: 85, target: 80 },
    { dimension: '沟通表达', current: 82, target: 75 },
    { dimension: '学习能力', current: 95, target: 85 },
    { dimension: '领导力', current: 75, target: 70 },
  ],
  hardSkillsTop10: [
    { name: 'React', level: 95 },
    { name: 'TypeScript', level: 92 },
    { name: 'Node.js', level: 85 },
    { name: 'Webpack/Vite', level: 88 },
    { name: 'Vue', level: 80 },
    { name: '性能优化', level: 90 },
    { name: '微前端', level: 82 },
    { name: 'GraphQL', level: 78 },
    { name: '单元测试', level: 85 },
    { name: 'Docker/K8s', level: 72 },
  ],
  softSkills: [
    { name: '沟通协调', level: 85, description: '清晰表达技术方案，善于跨团队协作' },
    { name: '问题解决', level: 90, description: '快速定位复杂问题，提出创新解决方案' },
    { name: '领导力', level: 75, description: '带领5人小组完成项目，具备团队管理潜力' },
    { name: '创新能力', level: 88, description: '主动提出技术改进方案，推动效率提升' },
  ],
  certifications: [
    { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2025-08', difficulty: 'advanced' },
    { id: 'c2', name: 'Google Professional Cloud Developer', issuer: 'Google', date: '2024-12', difficulty: 'advanced' },
    { id: 'c3', name: 'Meta React Developer Certificate', issuer: 'Meta', date: '2024-06', difficulty: 'intermediate' },
  ],
  growthPotential: {
    overallScore: 88,
    dimensions: [
      { dimension: '学习能力', score: 95 },
      { dimension: '适应力', score: 88 },
      { dimension: '抗压性', score: 82 },
      { dimension: '领导力', score: 78 },
      { dimension: '创新力', score: 90 },
    ],
    promotionForecast: [
      { year: 0, optimistic: 88, neutral: 88, conservative: 88, label: '当前' },
      { year: 1, optimistic: 92, neutral: 90, conservative: 87, label: '1年后' },
      { year: 2, optimistic: 96, neutral: 92, conservative: 88, label: '2年后' },
      { year: 3, optimistic: 99, neutral: 95, conservative: 90, label: '3年后' },
    ],
  },
  followUps: [
    {
      id: 'f1',
      date: '2026-06-15',
      type: 'interview' as FollowUpType,
      content: '终面：CTO面试通过，对候选人的技术深度和架构思维非常认可。建议发高级前端工程师岗位Offer。',
      operator: '李经理',
    },
    {
      id: 'f2',
      date: '2026-06-10',
      type: 'interview' as FollowUpType,
      content: '技术三面：系统设计面试。候选人展示了出色的架构设计能力，对高并发、微服务有深入理解。代码质量高。',
      operator: '张技术总监',
    },
    {
      id: 'f3',
      date: '2026-06-05',
      type: 'interview' as FollowUpType,
      content: '技术二面：前端深度面试。React原理、性能优化、工程化方面表现突出。手写代码规范且高效。',
      operator: '王高级工程师',
    },
    {
      id: 'f4',
      date: '2026-05-28',
      type: 'interview' as FollowUpType,
      content: '技术初面：基础知识扎实，5年前端经验，有大厂背景。对候选人简历中的项目进行了深入探讨。',
      operator: '赵工程师',
    },
    {
      id: 'f5',
      date: '2026-05-15',
      type: 'call' as FollowUpType,
      content: '首次电话沟通：候选人对岗位很感兴趣，目前在职，期望薪资30-40K，1个月可到岗。',
      operator: '李经理',
    },
    {
      id: 'f6',
      date: '2026-05-10',
      type: 'email' as FollowUpType,
      content: '通过内推渠道发现候选人，发送岗位介绍邮件，附上JD和公司介绍。',
      operator: '李经理',
    },
  ],
  remarks: {
    content: '<p><strong>综合评价：</strong>候选人技术能力出众，具备<strong>架构思维</strong>和团队管理经验，是难得的高潜力人才。</p><p>技术亮点：</p><ul><li>深入理解React原理，有源码贡献经验</li><li>主导过大型前端架构升级项目</li><li>对性能优化有系统性方法论</li></ul><p><em>建议：尽快发Offer，薪资范围内给到高位，避免被竞品抢走。</em></p>',
    attachments: [
      { id: 'a1', name: '陈思远-简历-2026.pdf', size: '2.4MB', type: 'pdf' },
      { id: 'a2', name: '作品集.zip', size: '15.8MB', type: 'zip' },
      { id: 'a3', name: '面试评估表.xlsx', size: '45KB', type: 'xlsx' },
    ],
  },
};

const HRTalentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [talent, setTalent] = useState<TalentDetailMock>(mockTalentDetail);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('competency');
  const [newFollowUp, setNewFollowUp] = useState({ type: 'call' as FollowUpType, note: '' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id) {
          const res = await hrApi.getHrTalentDetail(id);
          if (res) setTalent({ ...mockTalentDetail, ...res });
        }
      } catch (e) {
        setTalent(mockTalentDetail);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const potentialCfg = POTENTIAL_BADGE[talent.potentialLevel];
  const statusCfg = STATUS_BADGE[talent.status];
  const initial = talent.userSummary.name.charAt(0);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'competency', label: '能力画像', icon: Target },
    { key: 'growth', label: '成长评估', icon: TrendingUp },
    { key: 'followups', label: '跟进记录', icon: MessageSquare },
    { key: 'remarks', label: '备注信息', icon: FileText },
  ];

  const handleAddFollowUp = async () => {
    if (!newFollowUp.note.trim()) return;
    try {
      await hrApi.createFollowUp({
        talentId: talent.id,
        scheduledAt: new Date().toISOString(),
        type: newFollowUp.type,
        note: newFollowUp.note,
      });
      setTalent((prev: any) => ({
        ...prev,
        followUps: [
          {
            id: `new-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: newFollowUp.type,
            content: newFollowUp.note,
            operator: '当前用户',
          },
          ...prev.followUps,
        ],
      }));
      setNewFollowUp({ type: 'call', note: '' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-bold text-slate-800">人才详情</h1>
              <Badge variant={statusCfg.variant} withDot>
                {statusCfg.label}
              </Badge>
              <Badge variant={potentialCfg.variant} withDot>
                {potentialCfg.label}
              </Badge>
            </div>
          </div>
        </div>

        <Card variant="gradient" className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start gap-8">
              <div className="relative shrink-0">
                <div className={cn(
                  'w-28 h-28 rounded-3xl bg-gradient-to-br flex items-center justify-center text-white font-heading font-bold text-4xl shadow-2xl',
                  potentialCfg.gradient
                )}>
                  {initial}
                </div>
                <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-xl bg-white shadow-lg border border-slate-200/60">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-gold-500 fill-amber-gold-500" />
                    <span className="text-sm font-bold text-slate-800">潜力 {talent.potentialLevel}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-heading font-bold gradient-text">
                      {talent.userSummary.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{talent.userSummary.currentJob}</span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{talent.userSummary.yearsOfExperience}年经验</span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{talent.userSummary.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {talent.tags.map((t: string) => (
                        <span
                          key={t}
                          className="px-3 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-gold-50 to-amber-gold-100/50 text-amber-gold-700 border border-amber-gold-200/60"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-center">
                      <ProgressRing percent={talent.userSummary.matchScore} size={80} strokeWidth={7} />
                      <p className="mt-2 text-xs text-slate-500 font-medium">综合匹配度</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-200/60">
                  <div className="flex items-center gap-8 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-space-indigo-500" />
                      <span>{talent.userSummary.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>{talent.userSummary.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Target className="w-4 h-4 text-lavender-500" />
                      <span>期望 {talent.userSummary.expectedSalary}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                        <Github className="w-4 h-4" />
                      </a>
                      <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                      <a href="#" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                        <Globe className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline">
                      <Phone className="w-4 h-4" />
                      发起联系
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4" />
                      发短信
                    </Button>
                    <Button variant="outline">
                      <Calendar className="w-4 h-4" />
                      约面试
                    </Button>
                    <Button variant="primary">
                      <FileCheck className="w-4 h-4" />
                      发Offer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'competency' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="text-lg">六维能力雷达</CardTitle>
                      <CardDescription>综合能力评估 vs 目标岗位要求</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={talent.competencyRadar}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis
                              dataKey="dimension"
                              tick={{ fontSize: 12, fill: '#475569' }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={{ fontSize: 10, fill: '#94A3B8' }}
                            />
                            <Radar
                              name="当前水平"
                              dataKey="current"
                              stroke="#8B5CF6"
                              fill="#8B5CF6"
                              fillOpacity={0.25}
                              strokeWidth={2}
                            />
                            <Radar
                              name="目标要求"
                              dataKey="target"
                              stroke="#10B981"
                              fill="#10B981"
                              fillOpacity={0.15}
                              strokeWidth={2}
                              strokeDasharray="4 4"
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="glass" className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">硬技能 Top 10</CardTitle>
                      <CardDescription>技术栈掌握程度评估</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={talent.hardSkillsTop10}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{ fontSize: 12, fill: '#475569' }}
                              width={90}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              }}
                              formatter={(v: number) => [`${v}分`, '掌握程度']}
                            />
                            <Bar dataKey="level" radius={[0, 8, 8, 0]} barSize={18}>
                              {talent.hardSkillsTop10.map((_: any, i: number) => (
                                <defs key={i}>
                                  <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3A5FA8" />
                                    <stop offset="50%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#10B981" />
                                  </linearGradient>
                                </defs>
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <Card variant="glass" className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">软技能维度</CardTitle>
                      <CardDescription>综合软实力评估</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {talent.softSkills.map((s: any, i: number) => (
                          <motion.div
                            key={s.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="p-4 rounded-xl bg-gradient-to-r from-slate-50/80 to-white border border-slate-200/60"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-slate-800">{s.name}</span>
                              <span className="text-sm font-bold text-lavender-600">{s.level}分</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.level}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className="h-full rounded-full bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-emerald-500"
                              />
                            </div>
                            <p className="text-sm text-slate-500">{s.description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="text-lg">证书列表</CardTitle>
                      <CardDescription>专业认证与资质</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {talent.certifications.map((c: any, i: number) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-lavender-50/30 to-space-indigo-50/30 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                c.difficulty === 'advanced'
                                  ? 'bg-gradient-to-br from-amber-gold-400 to-orange-500 text-white'
                                  : c.difficulty === 'intermediate'
                                  ? 'bg-gradient-to-br from-lavender-400 to-purple-500 text-white'
                                  : 'bg-gradient-to-br from-space-indigo-400 to-blue-500 text-white'
                              )}>
                                <Award className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-800 text-sm leading-tight">{c.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">{c.issuer}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-slate-400">{c.date}</span>
                                  <Badge variant={c.difficulty === 'advanced' ? 'gold' : c.difficulty === 'intermediate' ? 'purple' : 'indigo'} size="sm">
                                    {c.difficulty === 'advanced' ? '高级' : c.difficulty === 'intermediate' ? '中级' : '初级'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'growth' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="text-lg">成长潜力综合得分</CardTitle>
                      <CardDescription>基于多维度综合评估</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <ProgressRing percent={talent.growthPotential.overallScore} size={180} strokeWidth={14} />
                      <div className="mt-6 space-y-2 text-center">
                        <p className="text-sm text-slate-500">评估等级</p>
                        <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-50 via-lavender-50 to-space-indigo-50 border border-emerald-200/60">
                          <span className="font-bold text-emerald-700 text-lg">快速成长型</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 max-w-xs">
                          具备出色的学习能力和适应力，建议重点培养
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="glass" className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">成长五维度评估</CardTitle>
                      <CardDescription>决定长期发展的关键因素</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={talent.growthPotential.dimensions}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis
                              dataKey="dimension"
                              tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={{ fontSize: 10, fill: '#94A3B8' }}
                            />
                            <Radar
                              dataKey="score"
                              stroke="#10B981"
                              fill="url(#growthRadarGrad)"
                              fillOpacity={0.6}
                              strokeWidth={3}
                            />
                            <defs>
                              <linearGradient id="growthRadarGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#3A5FA8" stopOpacity={0.4} />
                              </linearGradient>
                            </defs>
                            <Tooltip formatter={(v: number) => [`${v}分`, '得分']} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">职业晋升预测曲线</CardTitle>
                    <CardDescription>未来3年发展潜力预测（乐观 / 中性 / 保守情景）</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={talent.growthPotential.promotionForecast}>
                          <defs>
                            <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="conGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} />
                          <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                            formatter={(v: number) => [`${v}分`]}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Area type="monotone" dataKey="optimistic" name="乐观情景" stroke="#10B981" fill="url(#optGrad)" strokeWidth={3} />
                          <Area type="monotone" dataKey="neutral" name="中性情景" stroke="#8B5CF6" fill="url(#neuGrad)" strokeWidth={3} />
                          <Area type="monotone" dataKey="conservative" name="保守情景" stroke="#F59E0B" fill="url(#conGrad)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">适配岗位推荐</CardTitle>
                    <CardDescription>基于能力画像智能匹配的岗位路径</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {talent.matchJobs.map((job: any, i: number) => (
                        <motion.div
                          key={job.jobId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-5 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-space-indigo-50/40 to-lavender-50/40 hover:shadow-lg transition-all hover:-translate-y-1 group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center',
                              i === 0
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                : i === 1
                                ? 'bg-gradient-to-br from-lavender-400 to-purple-600 text-white'
                                : 'bg-gradient-to-br from-space-indigo-400 to-space-indigo-600 text-white'
                            )}>
                              <Briefcase className="w-6 h-6" />
                            </div>
                            {i === 0 && (
                              <Badge variant="emerald" withDot>
                                <Sparkles className="w-3 h-3 mr-1" />
                                最佳匹配
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-heading font-bold text-lg text-slate-800 mb-1">
                            {job.jobTitle}
                          </h4>
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-3xl font-heading font-bold bg-gradient-to-r from-space-indigo-600 via-lavender-600 to-emerald-600 bg-clip-text text-transparent">
                              {job.score}
                            </span>
                            <span className="text-sm text-slate-500">% 适配度</span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden mb-4">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${job.score}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-emerald-500"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              建议周期
                            </div>
                            <Badge variant="indigo" size="sm">{job.suggestedPeriod}</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'followups' && (
              <div className="space-y-6">
                <Card variant="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shrink-0">
                        <Plus className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-slate-800">添加新跟进</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 font-medium shrink-0">跟进类型:</span>
                        <div className="flex gap-2">
                          {(Object.keys(FOLLOW_UP_LABELS) as FollowUpType[]).map((type) => {
                            const Icon = FOLLOW_UP_ICONS[type];
                            return (
                              <button
                                key={type}
                                onClick={() => setNewFollowUp((p) => ({ ...p, type }))}
                                className={cn(
                                  'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all',
                                  newFollowUp.type === type
                                    ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                {FOLLOW_UP_LABELS[type]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={newFollowUp.note}
                          onChange={(e) => setNewFollowUp((p) => ({ ...p, note: e.target.value }))}
                          placeholder="记录跟进内容...（自动保存草稿）"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 focus:ring-2 focus:ring-space-indigo-200/50 outline-none resize-none text-sm"
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          onClick={handleAddFollowUp}
                          disabled={!newFollowUp.note.trim()}
                        >
                          <Send className="w-4 h-4" />
                          保存跟进记录
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">历史跟进记录</CardTitle>
                    <CardDescription>共 {talent.followUps.length} 条记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-lavender-400 to-space-indigo-400" />
                      <div className="space-y-6">
                        {talent.followUps.map((f: any, i: number) => {
                          const Icon = FOLLOW_UP_ICONS[f.type];
                          return (
                            <motion.div
                              key={f.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="relative pl-16"
                            >
                              <div className={cn(
                                'absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10',
                                i === 0
                                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                                  : f.type === 'interview'
                                  ? 'bg-gradient-to-br from-amber-gold-400 to-orange-500'
                                  : f.type === 'call'
                                  ? 'bg-gradient-to-br from-space-indigo-400 to-space-indigo-600'
                                  : 'bg-gradient-to-br from-lavender-400 to-purple-600'
                              )}>
                                <Icon className="w-2.5 h-2.5 text-white" />
                              </div>
                              <div className="p-5 rounded-2xl bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge variant={
                                      f.type === 'interview' ? 'gold' :
                                      f.type === 'call' ? 'indigo' : 'purple'
                                    } withDot size="sm">
                                      {FOLLOW_UP_LABELS[f.type]}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <CalendarClock className="w-3.5 h-3.5" />
                                      {f.date}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <User className="w-3.5 h-3.5" />
                                    {f.operator}
                                  </div>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                  {f.content}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'remarks' && (
              <div className="grid grid-cols-3 gap-6">
                <Card variant="glass" className="col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">备注信息</CardTitle>
                        <CardDescription>关于候选人的详细记录和说明</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                        编辑
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-slate max-w-none prose-sm p-6 rounded-2xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/60 min-h-[320px]"
                      dangerouslySetInnerHTML={{ __html: talent.remarks.content }}
                    />
                    <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-200/60">
                      <div className="flex flex-wrap gap-2 flex-1">
                        {talent.tags.map((t: string) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-amber-gold-50 text-amber-gold-700 border border-amber-gold-200/60"
                          >
                            <Tag className="w-3 h-3" />
                            {t}
                            <button className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                          <Plus className="w-3 h-3" />
                          添加标签
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">附件资料</CardTitle>
                        <CardDescription>{talent.remarks.attachments.length} 个文件</CardDescription>
                      </div>
                      <button className="w-9 h-9 rounded-xl bg-gradient-to-r from-space-indigo-50 to-lavender-50 border border-space-indigo-200/60 flex items-center justify-center text-space-indigo-600 hover:shadow-md transition-shadow">
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {talent.remarks.attachments.map((a: any, i: number) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="p-4 rounded-xl border border-slate-200/60 bg-white/60 hover:bg-white hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                              a.type === 'pdf'
                                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                : a.type === 'zip'
                                ? 'bg-gradient-to-br from-amber-gold-400 to-orange-500 text-white'
                                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                            )}>
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{a.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{a.size}</p>
                            </div>
                            <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-500 transition-all">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      <button className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-space-indigo-300 hover:text-space-indigo-600 hover:bg-space-indigo-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                        <Upload className="w-4 h-4" />
                        上传附件
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HRTalentDetail;
