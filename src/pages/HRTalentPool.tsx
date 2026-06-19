import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Star,
  MessageSquarePlus,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CalendarClock,
  AlertCircle,
  Briefcase,
  Tag,
  CheckCircle2,
  Target,
  TrendingUp,
  Award,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { hrApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { TalentPoolEntry, PotentialLevel, TalentStatus, PaginatedResponse } from '@shared/types';
import { useNavigate } from 'react-router-dom';

const POTENTIAL_COLORS: Record<PotentialLevel, { variant: string; bg: string; border: string }> = {
  S: { variant: 'purple', bg: 'from-purple-500 to-lavender-500', border: 'border-purple-200' },
  A: { variant: 'indigo', bg: 'from-space-indigo-500 to-space-indigo-400', border: 'border-space-indigo-200' },
  B: { variant: 'info', bg: 'from-blue-500 to-blue-400', border: 'border-blue-200' },
  C: { variant: 'default', bg: 'from-slate-500 to-slate-400', border: 'border-slate-200' },
};

const STATUS_CONFIG: Record<TalentStatus, { label: string; variant: string; dot: string }> = {
  new: { label: '新入库', variant: 'purple', dot: 'bg-purple-500' },
  contacted: { label: '已联系', variant: 'indigo', dot: 'bg-space-indigo-500' },
  screening: { label: '初筛中', variant: 'emerald', dot: 'bg-emerald-500' },
  interview: { label: '面试中', variant: 'gold', dot: 'bg-amber-gold-500' },
  offer: { label: '发Offer', variant: 'success', dot: 'bg-green-500' },
  archived: { label: '已归档', variant: 'default', dot: 'bg-slate-500' },
};

const STATUS_VARIANT_MAP: Record<TalentStatus, any> = {
  new: 'purple',
  contacted: 'indigo',
  screening: 'emerald',
  interview: 'gold',
  offer: 'success',
  archived: 'default',
};

const mockTalentPool: TalentPoolEntry[] = [
  {
    id: '1',
    userId: 'u1',
    userSummary: {
      name: '陈思远',
      avatar: '',
      currentJob: '高级前端工程师',
      yearsOfExperience: 5,
      keySkills: ['React', 'TypeScript', 'Node.js', 'Vue', 'Webpack', '性能优化'],
      matchScore: 92,
    },
    potentialLevel: 'S',
    tags: ['高潜力', '985背景', '大厂经验', '技术博客'],
    status: 'interview',
    lastFollowUpAt: '2026-06-15T10:00:00Z',
    nextFollowUpAt: '2026-06-19T14:00:00Z',
    notes: '技术能力非常强，沟通顺畅，终面通过，等待谈薪',
    addedAt: '2026-05-10T00:00:00Z',
    matchJobs: [
      { jobId: 'j1', jobTitle: '高级前端工程师', score: 92 },
      { jobId: 'j2', jobTitle: '前端技术专家', score: 85 },
      { jobId: 'j3', jobTitle: '全栈开发工程师', score: 78 },
    ],
  },
  {
    id: '2',
    userId: 'u2',
    userSummary: {
      name: '林雨桐',
      avatar: '',
      currentJob: '产品经理',
      yearsOfExperience: 4,
      keySkills: ['需求分析', 'Axure', '用户研究', '数据分析', 'B端产品'],
      matchScore: 88,
    },
    potentialLevel: 'A',
    tags: ['跨行业经验', '创业经历', '英语流利'],
    status: 'screening',
    lastFollowUpAt: '2026-06-16T15:30:00Z',
    nextFollowUpAt: '2026-06-18T10:00:00Z',
    notes: '初筛通过，安排技术面',
    addedAt: '2026-05-20T00:00:00Z',
    matchJobs: [
      { jobId: 'j2', jobTitle: '资深产品经理', score: 88 },
      { jobId: 'j4', jobTitle: 'B端产品经理', score: 82 },
    ],
  },
  {
    id: '3',
    userId: 'u3',
    userSummary: {
      name: '王浩然',
      avatar: '',
      currentJob: '后端开发工程师',
      yearsOfExperience: 6,
      keySkills: ['Java', 'Spring', 'MySQL', 'Redis', '微服务', 'Kafka'],
      matchScore: 85,
    },
    potentialLevel: 'A',
    tags: ['高并发经验', '架构能力', '团队管理'],
    status: 'contacted',
    lastFollowUpAt: '2026-06-17T09:00:00Z',
    nextFollowUpAt: '2026-06-20T11:00:00Z',
    notes: '对岗位很感兴趣，初筛待安排',
    addedAt: '2026-06-01T00:00:00Z',
    matchJobs: [
      { jobId: 'j3', jobTitle: '后端开发工程师', score: 85 },
      { jobId: 'j5', jobTitle: 'Java架构师', score: 75 },
    ],
  },
  {
    id: '4',
    userId: 'u4',
    userSummary: {
      name: '张梦瑶',
      avatar: '',
      currentJob: '数据分析师',
      yearsOfExperience: 3,
      keySkills: ['SQL', 'Python', 'Tableau', 'A/B测试', '用户行为分析'],
      matchScore: 90,
    },
    potentialLevel: 'S',
    tags: ['名校硕士', '算法竞赛', '数据驱动'],
    status: 'offer',
    lastFollowUpAt: '2026-06-14T16:00:00Z',
    nextFollowUpAt: '2026-06-19T10:00:00Z',
    notes: '已发Offer，等待回复，薪资在谈',
    addedAt: '2026-05-05T00:00:00Z',
    matchJobs: [
      { jobId: 'j4', jobTitle: '数据分析师', score: 90 },
      { jobId: 'j6', jobTitle: '高级数据分析师', score: 82 },
    ],
  },
  {
    id: '5',
    userId: 'u5',
    userSummary: {
      name: '刘子豪',
      avatar: '',
      currentJob: 'UI/UX设计师',
      yearsOfExperience: 4,
      keySkills: ['Figma', 'Sketch', '用户体验', '交互设计', '设计系统', '动效'],
      matchScore: 87,
    },
    potentialLevel: 'B',
    tags: ['设计作品集优秀', '移动端经验'],
    status: 'new',
    lastFollowUpAt: undefined,
    nextFollowUpAt: '2026-06-20T09:30:00Z',
    notes: '',
    addedAt: '2026-06-17T00:00:00Z',
    matchJobs: [
      { jobId: 'j7', jobTitle: 'UI/UX设计师', score: 87 },
    ],
  },
  {
    id: '6',
    userId: 'u6',
    userSummary: {
      name: '赵雅婷',
      avatar: '',
      currentJob: '全栈开发工程师',
      yearsOfExperience: 5,
      keySkills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL'],
      matchScore: 83,
    },
    potentialLevel: 'A',
    tags: ['独立项目经验', '开源贡献', '海外背景'],
    status: 'interview',
    lastFollowUpAt: '2026-06-16T14:00:00Z',
    nextFollowUpAt: '2026-06-18T15:00:00Z',
    notes: '技术面通过，终面安排中',
    addedAt: '2026-05-15T00:00:00Z',
    matchJobs: [
      { jobId: 'j3', jobTitle: '全栈开发工程师', score: 83 },
      { jobId: 'j1', jobTitle: '高级前端工程师', score: 78 },
    ],
  },
  {
    id: '7',
    userId: 'u7',
    userSummary: {
      name: '孙博文',
      avatar: '',
      currentJob: '资深后端工程师',
      yearsOfExperience: 8,
      keySkills: ['Go', 'Kubernetes', '分布式系统', 'gRPC', '云原生', '微服务架构'],
      matchScore: 79,
    },
    potentialLevel: 'B',
    tags: ['架构经验', '技术分享'],
    status: 'screening',
    lastFollowUpAt: '2026-06-15T11:00:00Z',
    nextFollowUpAt: '2026-06-19T09:00:00Z',
    notes: '简历不错，薪资期望略高',
    addedAt: '2026-06-05T00:00:00Z',
    matchJobs: [
      { jobId: 'j3', jobTitle: '后端开发工程师', score: 79 },
    ],
  },
  {
    id: '8',
    userId: 'u8',
    userSummary: {
      name: '周晓琳',
      avatar: '',
      currentJob: '产品运营',
      yearsOfExperience: 3,
      keySkills: ['活动策划', '内容运营', '用户增长', '数据分析', '社群运营'],
      matchScore: 76,
    },
    potentialLevel: 'C',
    tags: ['增长黑客经验'],
    status: 'archived',
    lastFollowUpAt: '2026-06-10T10:00:00Z',
    nextFollowUpAt: undefined,
    notes: '薪资不匹配，后续有合适岗位再联系',
    addedAt: '2026-05-01T00:00:00Z',
    matchJobs: [
      { jobId: 'j8', jobTitle: '产品运营经理', score: 76 },
    ],
  },
];

const AVATAR_COLORS = [
  'from-lavender-400 to-purple-500',
  'from-space-indigo-400 to-space-indigo-600',
  'from-emerald-400 to-teal-500',
  'from-amber-gold-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-cyan-400 to-blue-500',
];

const TalentRow: React.FC<{
  talent: TalentPoolEntry;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onViewDetail: (id: string) => void;
  onQuickPreview: (talent: TalentPoolEntry) => void;
}> = ({ talent, index, selected, onSelect, onViewDetail, onQuickPreview }) => {
  const statusCfg = STATUS_CONFIG[talent.status];
  const potentialCfg = POTENTIAL_COLORS[talent.potentialLevel];
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = talent.userSummary.name.charAt(0);

  const daysUntilNext = useMemo(() => {
    if (!talent.nextFollowUpAt) return null;
    const now = new Date();
    const next = new Date(talent.nextFollowUpAt);
    const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [talent.nextFollowUpAt]);

  const isOverdue = daysUntilNext !== null && daysUntilNext < 0;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'border-b border-slate-100 group transition-all',
        selected ? 'bg-lavender-50/40' : 'hover:bg-gradient-to-r hover:from-space-indigo-50/40 hover:via-lavender-50/20 hover:to-emerald-50/30'
      )}
    >
      <td className="px-5 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(talent.id)}
          className="w-4 h-4 rounded border-slate-300 text-space-indigo-600 focus:ring-space-indigo-400 cursor-pointer"
        />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className={cn(
              'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-heading font-bold text-lg shadow-md',
              avatarColor
            )}>
              {initial}
            </div>
            <div className={cn(
              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br',
              potentialCfg.bg
            )}>
              {talent.potentialLevel}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{talent.userSummary.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-500">
                {talent.userSummary.currentJob} · {talent.userSummary.yearsOfExperience}年
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {talent.userSummary.keySkills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                >
                  {skill}
                </span>
              ))}
              {talent.userSummary.keySkills.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-space-indigo-50 text-space-indigo-600">
                  +{talent.userSummary.keySkills.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Badge variant={STATUS_VARIANT_MAP[talent.status] as any} withDot size="sm">
            {statusCfg.label}
          </Badge>
          {talent.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {talent.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-gold-50 text-amber-gold-700 border border-amber-gold-200/60"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <ProgressRing percent={talent.userSummary.matchScore} size={52} strokeWidth={5} />
          <div>
            <div className="text-sm text-slate-500">适配岗位</div>
            <div className="flex items-center gap-1 mt-1">
              <Target className="w-3.5 h-3.5 text-lavender-500" />
              <span className="font-bold text-lavender-700">{talent.matchJobs.length}</span>
              <span className="text-xs text-slate-400">个</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>上次: {talent.lastFollowUpAt
              ? new Date(talent.lastFollowUpAt).toLocaleDateString('zh-CN')
              : '-'
            }</span>
          </div>
          {talent.nextFollowUpAt ? (
            <div className={cn(
              'flex items-center gap-1.5 font-medium',
              isOverdue ? 'text-red-600' : 'text-space-indigo-600'
            )}>
              {isOverdue ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <CalendarClock className="w-3.5 h-3.5" />
              )}
              <span>
                下次: {new Date(talent.nextFollowUpAt).toLocaleDateString('zh-CN')}
                {daysUntilNext !== null && (
                  <span className={cn(
                    'ml-1 px-1.5 py-0.5 rounded text-[10px]',
                    isOverdue
                      ? 'bg-red-100 text-red-700'
                      : daysUntilNext === 0
                      ? 'bg-amber-gold-100 text-amber-gold-700'
                      : 'bg-space-indigo-100 text-space-indigo-700'
                  )}>
                    {isOverdue ? `逾期${-daysUntilNext}天` : daysUntilNext === 0 ? '今天' : `${daysUntilNext}天后`}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>下次: 未安排</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuickPreview(talent)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(talent.id)}
          >
            <Star className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 group-hover:hidden">
          <Badge variant={potentialCfg.variant as any} size="sm">
            查看
          </Badge>
        </div>
      </td>
    </motion.tr>
  );
};

const TalentQuickPreview: React.FC<{
  talent: TalentPoolEntry | null;
  onClose: () => void;
  onViewDetail: (id: string) => void;
}> = ({ talent, onClose, onViewDetail }) => {
  if (!talent) return null;
  const avatarColor = AVATAR_COLORS[parseInt(talent.id) % AVATAR_COLORS.length];
  const initial = talent.userSummary.name.charAt(0);
  const statusCfg = STATUS_CONFIG[talent.status];
  const potentialCfg = POTENTIAL_COLORS[talent.potentialLevel];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-screen w-96 bg-white/95 backdrop-blur-2xl border-l border-slate-200 shadow-2xl z-50 flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-heading font-bold text-lg text-slate-800">人才画像预览</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center">
            <div className={cn(
              'w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br flex items-center justify-center text-white font-heading font-bold text-3xl shadow-xl',
              avatarColor
            )}>
              {initial}
            </div>
            <h2 className="mt-4 text-2xl font-heading font-bold text-slate-800">
              {talent.userSummary.name}
            </h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant={STATUS_VARIANT_MAP[talent.status] as any} withDot>
                {statusCfg.label}
              </Badge>
              <Badge variant={potentialCfg.variant as any}>
                潜力 {talent.potentialLevel}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {talent.userSummary.currentJob} · {talent.userSummary.yearsOfExperience}年经验
            </p>
          </div>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <ProgressRing percent={talent.userSummary.matchScore} size={72} strokeWidth={7} />
              <p className="mt-2 text-xs text-slate-500">综合匹配度</p>
            </div>
            <div className="text-center">
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-lavender-50 to-emerald-50 flex flex-col items-center justify-center border border-lavender-200/60">
                <Target className="w-5 h-5 text-lavender-500" />
                <span className="text-lg font-bold text-lavender-700 mt-1">{talent.matchJobs.length}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">适配岗位</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-lavender-500" />
              核心技能
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {talent.userSummary.keySkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {talent.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-gold-500" />
                人才标签
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {talent.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-gold-50 to-amber-gold-100/60 text-amber-gold-700 border border-amber-gold-200/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              适配岗位推荐
            </h4>
            <div className="space-y-2">
              {talent.matchJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-3 rounded-xl bg-gradient-to-r from-space-indigo-50/50 via-lavender-50/30 to-emerald-50/50 border border-space-indigo-100/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{job.jobTitle}</span>
                    <span className="text-sm font-bold text-emerald-600">{job.score}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-space-indigo-400 via-lavender-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${job.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {talent.notes && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                HR 备注
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">{talent.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 shrink-0 space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => onViewDetail(talent.id)}
          >
            <Eye className="w-4 h-4" />
            查看完整画像
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" fullWidth>
              <MessageSquarePlus className="w-4 h-4" />
              添加跟进
            </Button>
            <Button variant="outline" fullWidth>
              <CheckCircle2 className="w-4 h-4" />
              标记潜力
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const HRTalentPool: React.FC = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<TalentPoolEntry[]>(mockTalentPool);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchKw, setSearchKw] = useState('');
  const [filterPotential, setFilterPotential] = useState<PotentialLevel | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TalentStatus | 'ALL'>('ALL');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [previewTalent, setPreviewTalent] = useState<TalentPoolEntry | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(mockTalentPool.length);
  const pageSize = 10;

  const allTags = useMemo(() => {
    const set = new Set<string>();
    mockTalentPool.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, []);

  const filteredTalents = useMemo(() => {
    return talents.filter((t) => {
      if (searchKw && !t.userSummary.name.toLowerCase().includes(searchKw.toLowerCase()) &&
          !t.userSummary.currentJob.toLowerCase().includes(searchKw.toLowerCase()) &&
          !t.userSummary.keySkills.some((s) => s.toLowerCase().includes(searchKw.toLowerCase()))) {
        return false;
      }
      if (filterPotential !== 'ALL' && t.potentialLevel !== filterPotential) return false;
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (activeTagFilter && !t.tags.includes(activeTagFilter)) return false;
      return true;
    });
  }, [talents, searchKw, filterPotential, filterStatus, activeTagFilter]);

  const displayedTalents = filteredTalents.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredTalents.length / pageSize) || 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        const res: PaginatedResponse<TalentPoolEntry> = await hrApi.getHrTalentPool({
          page,
          pageSize,
          keyword: searchKw || undefined,
          potentialLevel: filterPotential === 'ALL' ? undefined : filterPotential,
          status: filterStatus === 'ALL' ? undefined : filterStatus,
        });
        if (res?.data) {
          setTalents(res.data);
          setTotal(res.total);
        }
      } catch (e) {
        setTalents(mockTalentPool);
        setTotal(mockTalentPool.length);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedTalents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedTalents.map((t) => t.id)));
    }
  };

  return (
    <div className="p-8 min-h-screen relative">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold gradient-text">人才池</h1>
            <p className="text-slate-500 mt-1">
              共 <span className="font-bold text-space-indigo-600">{filteredTalents.length}</span> 位候选人
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4" />
              导出数据
            </Button>
            <Button variant="primary">
              <UserPlus className="w-4 h-4" />
              新增人才
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity:  1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card variant="glass">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索姓名、岗位、技能..."
                    value={searchKw}
                    onChange={(e) => {
                      setSearchKw(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 focus:ring-2 focus:ring-space-indigo-200/50 outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">筛选:</span>
                </div>
                <select
                  value={filterPotential}
                  onChange={(e) => {
                    setFilterPotential(e.target.value as any);
                    setPage(1);
                  }}
                  className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="ALL">全部潜力</option>
                  <option value="S">S 级潜力</option>
                  <option value="A">A 级潜力</option>
                  <option value="B">B 级潜力</option>
                  <option value="C">C 级潜力</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700"
                >
                  <option value="ALL">全部状态</option>
                  <option value="new">新入库</option>
                  <option value="contacted">已联系</option>
                  <option value="screening">初筛中</option>
                  <option value="interview">面试中</option>
                  <option value="offer">发Offer</option>
                  <option value="archived">已归档</option>
                </select>
                <select className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700">
                  <option>跟进时间: 全部</option>
                  <option>近7天</option>
                  <option>近30天</option>
                  <option>超过30天</option>
                  <option>逾期未跟进</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">标签:</span>
                <button
                  onClick={() => setActiveTagFilter(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    activeTagFilter === null
                      ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  全部
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveTagFilter(activeTagFilter === tag ? null : tag);
                      setPage(1);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                      activeTagFilter === tag
                        ? 'bg-gradient-to-r from-amber-gold-400 to-orange-400 text-white shadow-sm'
                        : 'bg-amber-gold-50 text-amber-gold-700 border border-amber-gold-200/60 hover:bg-amber-gold-100'
                    )}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </button>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-lavender-50 via-space-indigo-50/80 to-emerald-50 border border-space-indigo-200/60"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-slate-700">
                      已选中 <span className="font-bold text-space-indigo-600">{selectedIds.size}</span> 位候选人
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">批量标记潜力</Button>
                    <Button variant="ghost" size="sm">批量添加跟进</Button>
                    <Button variant="ghost" size="sm">批量导出</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      className="text-red-600 hover:bg-red-50"
                    >
                      取消选择
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-space-indigo-50/80 via-lavender-50/50 to-emerald-50/60">
                    <th className="text-left px-5 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === displayedTalents.length && displayedTalents.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-space-indigo-600 focus:ring-space-indigo-400 cursor-pointer"
                      />
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-5 py-4">
                      候选人
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      潜力 / 标签
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      匹配度
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">
                      跟进状态
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-5 py-4">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTalents.map((talent, idx) => (
                    <TalentRow
                      key={talent.id}
                      talent={talent}
                      index={idx}
                      selected={selectedIds.has(talent.id)}
                      onSelect={toggleSelect}
                      onViewDetail={(id) => navigate(`/hr/talent/${id}`)}
                      onQuickPreview={setPreviewTalent}
                    />
                  ))}
                  {displayedTalents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Search className="w-8 h-8 text-slate-300" />
                          </div>
                          <div>没有找到匹配的候选人</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <div className="text-sm text-slate-500">
                显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredTalents.length)} 条，
                共 {filteredTalents.length} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                        page === pageNum
                          ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <TalentQuickPreview
        talent={previewTalent}
        onClose={() => setPreviewTalent(null)}
        onViewDetail={(id) => {
          setPreviewTalent(null);
          navigate(`/hr/talent/${id}`);
        }}
      />
    </div>
  );
};

export default HRTalentPool;
