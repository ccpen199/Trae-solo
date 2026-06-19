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
  ChevronDown,
  Video,
  MessageCircle,
  Calendar,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { hrApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { TalentPoolEntry, PotentialLevel, TalentStatus, PaginatedResponse, FollowUpType } from '@shared/types';
import { useNavigate } from 'react-router-dom';

const POTENTIAL_COLORS: Record<PotentialLevel, { variant: string; bg: string; border: string; label: string }> = {
  S: { variant: 'purple', bg: 'from-purple-500 to-lavender-500', border: 'border-purple-200', label: 'S级 · 顶尖潜力' },
  A: { variant: 'indigo', bg: 'from-space-indigo-500 to-space-indigo-400', border: 'border-space-indigo-200', label: 'A级 · 高潜力' },
  B: { variant: 'info', bg: 'from-blue-500 to-blue-400', border: 'border-blue-200', label: 'B级 · 良好潜力' },
  C: { variant: 'default', bg: 'from-slate-500 to-slate-400', border: 'border-slate-200', label: 'C级 · 待观察' },
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

const FOLLOW_UP_ICONS: Record<FollowUpType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  interview: Video,
  'check-in': MessageCircle,
};

const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  call: '电话沟通',
  email: '邮件跟进',
  interview: '面试安排',
  'check-in': '定期回访',
};

const CATEGORY_TAGS = [
  { key: 'tech', label: '技术', color: 'from-space-indigo-500 to-lavender-500' },
  { key: 'product', label: '产品', color: 'from-emerald-500 to-teal-500' },
  { key: 'design', label: '设计', color: 'from-pink-500 to-rose-500' },
  { key: 'operations', label: '运营', color: 'from-amber-gold-500 to-orange-500' },
];

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

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
    tags: ['高潜力', '985背景', '大厂经验', '技术博客', '技术'],
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
    tags: ['跨行业经验', '创业经历', '英语流利', '产品'],
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
    tags: ['高并发经验', '架构能力', '团队管理', '技术'],
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
    tags: ['名校硕士', '算法竞赛', '数据驱动', '技术'],
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
    tags: ['设计作品集优秀', '移动端经验', '设计'],
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
    tags: ['独立项目经验', '开源贡献', '海外背景', '技术'],
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
    tags: ['架构经验', '技术分享', '技术'],
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
    tags: ['增长黑客经验', '运营'],
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

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 top-full mt-2 min-w-[160px] rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-200/60 py-2 overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => (
  <div className="fixed top-20 right-6 z-[100] space-y-3">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 min-w-[280px]',
            toast.type === 'success' && 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
            toast.type === 'error' && 'bg-gradient-to-r from-red-500 to-red-600 text-white',
            toast.type === 'info' && 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="opacity-80 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

function Info(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

interface FollowUpModalProps {
  open: boolean;
  talent: TalentPoolEntry | null;
  onClose: () => void;
  onSubmit: (data: { type: FollowUpType; scheduledAt: string; note: string }) => Promise<void>;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({ open, talent, onClose, onSubmit }) => {
  const [type, setType] = useState<FollowUpType>('call');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      setType('call');
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      setScheduledAt(d.toISOString().slice(0, 16));
      setNote('');
    }
  }, [open]);

  if (!open || !talent) return null;

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        note,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-space-indigo-500 to-lavender-500 flex items-center justify-center text-white">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-800">添加跟进提醒</h3>
                <p className="text-xs text-slate-500 mt-0.5">候选人：{talent.userSummary.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5">跟进类型</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(FOLLOW_UP_LABELS) as FollowUpType[]).map((t) => {
                  const Icon = FOLLOW_UP_ICONS[t];
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        'p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-medium transition-all',
                        active
                          ? 'bg-gradient-to-br from-space-indigo-500 to-lavender-500 text-white shadow-lg shadow-space-indigo-500/25'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {FOLLOW_UP_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-space-indigo-500" />
                跟进时间
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 focus:ring-2 focus:ring-space-indigo-200/50 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5">备注内容</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="请输入跟进内容和备注..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 focus:ring-2 focus:ring-space-indigo-200/50 outline-none transition-all text-sm resize-none"
              />
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <Button variant="outline" fullWidth onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!note.trim() || submitting} isLoading={submitting}>
              <Send className="w-4 h-4" />
              提交跟进
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TalentRow: React.FC<{
  talent: TalentPoolEntry;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onViewDetail: (id: string) => void;
  onQuickPreview: (talent: TalentPoolEntry) => void;
  onAddFollowUp: (talent: TalentPoolEntry) => void;
  onChangePotential: (id: string, level: PotentialLevel) => Promise<void>;
  onChangeStatus: (id: string, status: TalentStatus) => Promise<void>;
}> = ({ talent, index, selected, onSelect, onViewDetail, onQuickPreview, onAddFollowUp, onChangePotential, onChangeStatus }) => {
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
            <Dropdown
              trigger={
                <div
                  className={cn(
                    'absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br cursor-pointer hover:scale-110 transition-transform shadow-md',
                    potentialCfg.bg
                  )}
                >
                  {talent.potentialLevel}
                </div>
              }
              align="right"
            >
              <div className="px-2">
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">调整潜力等级</div>
                {(Object.keys(POTENTIAL_COLORS) as PotentialLevel[]).map((level) => {
                  const cfg = POTENTIAL_COLORS[level];
                  const isActive = level === talent.potentialLevel;
                  return (
                    <button
                      key={level}
                      onClick={() => onChangePotential(talent.id, level)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                        isActive
                          ? 'bg-gradient-to-r from-space-indigo-50 to-lavender-50 text-space-indigo-700'
                          : 'hover:bg-slate-50 text-slate-600'
                      )}
                    >
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br', cfg.bg)}>
                        {level}
                      </span>
                      {cfg.label}
                      {isActive && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </Dropdown>
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
          <Dropdown
            trigger={
              <Badge variant={STATUS_VARIANT_MAP[talent.status] as any} withDot size="sm" className="cursor-pointer hover:shadow-md transition-shadow">
                <span className="flex items-center gap-1">
                  {statusCfg.label}
                  <ChevronDown className="w-3 h-3" />
                </span>
              </Badge>
            }
          >
            <div className="px-2">
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">切换状态</div>
              {(Object.keys(STATUS_CONFIG) as TalentStatus[]).map((st) => {
                const cfg = STATUS_CONFIG[st];
                const isActive = st === talent.status;
                return (
                  <button
                    key={st}
                    onClick={() => onChangeStatus(talent.id, st)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                      isActive
                        ? 'bg-gradient-to-r from-space-indigo-50 to-lavender-50 text-space-indigo-700'
                        : 'hover:bg-slate-50 text-slate-600'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                    {cfg.label}
                    {isActive && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </Dropdown>
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
            onClick={() => onAddFollowUp(talent)}
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

  const radarData = [
    { dimension: '技术深度', score: Math.min(95, talent.userSummary.matchScore + 3) },
    { dimension: '工程能力', score: Math.min(92, talent.userSummary.matchScore) },
    { dimension: '团队协作', score: Math.min(88, talent.userSummary.matchScore - 3) },
    { dimension: '沟通表达', score: Math.min(85, talent.userSummary.matchScore - 5) },
    { dimension: '学习能力', score: Math.min(95, talent.userSummary.matchScore + 5) },
  ];

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
              <Target className="w-4 h-4 text-space-indigo-500" />
              五维能力雷达
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                  <Radar
                    dataKey="score"
                    stroke="#8B5CF6"
                    fill="url(#previewRadarGrad)"
                    fillOpacity={0.6}
                    strokeWidth={2.5}
                  />
                  <defs>
                    <linearGradient id="previewRadarGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#3A5FA8" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v: number) => [`${v}分`, '得分']} />
                </RadarChart>
              </ResponsiveContainer>
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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [previewTalent, setPreviewTalent] = useState<TalentPoolEntry | null>(null);
  const [followUpTalent, setFollowUpTalent] = useState<TalentPoolEntry | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(mockTalentPool.length);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pageSize = 10;

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      if (activeCategoryFilter && !t.tags.includes(activeCategoryFilter)) return false;
      return true;
    });
  }, [talents, searchKw, filterPotential, filterStatus, activeTagFilter, activeCategoryFilter]);

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

  const handleChangePotential = async (id: string, level: PotentialLevel) => {
    try {
      await hrApi.postHrTalentTag(id, { potentialLevel: level });
      setTalents((prev) => prev.map((t) => (t.id === id ? { ...t, potentialLevel: level } : t)));
      addToast('success', `已将潜力等级调整为 ${POTENTIAL_COLORS[level].label}`);
    } catch (e) {
      addToast('error', '调整失败，请重试');
    }
  };

  const handleChangeStatus = async (id: string, status: TalentStatus) => {
    try {
      setTalents((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      addToast('success', `状态已更新为 ${STATUS_CONFIG[status].label}`);
    } catch (e) {
      addToast('error', '更新失败，请重试');
    }
  };

  const handleCreateFollowUp = async (data: { type: FollowUpType; scheduledAt: string; note: string }) => {
    if (!followUpTalent) return;
    try {
      await hrApi.createFollowUp({
        talentId: followUpTalent.id,
        ...data,
      });
      addToast('success', '跟进提醒已创建');
    } catch (e) {
      addToast('error', '创建失败，请重试');
    }
  };

  const handleBatchTagPotential = async (level: PotentialLevel) => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => hrApi.postHrTalentTag(id, { potentialLevel: level }))
      );
      setTalents((prev) => prev.map((t) => (selectedIds.has(t.id) ? { ...t, potentialLevel: level } : t)));
      addToast('success', `已批量标记 ${selectedIds.size} 位候选人为 ${POTENTIAL_COLORS[level].label}`);
      setSelectedIds(new Set());
    } catch (e) {
      addToast('error', '批量操作失败，请重试');
    }
  };

  return (
    <div className="p-8 min-h-screen relative">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

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
                <span className="text-xs text-slate-500 font-medium">类别:</span>
                <button
                  onClick={() => setActiveCategoryFilter(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    activeCategoryFilter === null
                      ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  全部
                </button>
                {CATEGORY_TAGS.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setActiveCategoryFilter(activeCategoryFilter === cat.label ? null : cat.label);
                      setPage(1);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      activeCategoryFilter === cat.label
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-sm`
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
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
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          批量标记潜力
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      }
                      align="right"
                    >
                      <div className="px-2">
                        {(Object.keys(POTENTIAL_COLORS) as PotentialLevel[]).map((level) => {
                          const cfg = POTENTIAL_COLORS[level];
                          return (
                            <button
                              key={level}
                              onClick={() => handleBatchTagPotential(level)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-600 transition-colors mb-0.5"
                            >
                              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br', cfg.bg)}>
                                {level}
                              </span>
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </Dropdown>
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
                  <tr className="border-b border-slate-100">
                    <th className="p-4 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === displayedTalents.length && displayedTalents.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(displayedTalents.map((t) => t.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                        className="rounded border-slate-300 text-space-indigo-600 focus:ring-space-indigo-500"
                      />
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">候选人</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">潜力</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">匹配度</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">跟进</th>
                    <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTalents.map((talent) => {
                    const pcfg = POTENTIAL_COLORS[talent.potentialLevel];
                    const scfg = STATUS_CONFIG[talent.status];
                    const isSelected = selectedIds.has(talent.id);
                    const isOverdue = talent.nextFollowUpAt && new Date(talent.nextFollowUpAt) < new Date();
                    return (
                      <tr
                        key={talent.id}
                        className={cn(
                          'border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer',
                          isSelected && 'bg-space-indigo-50/40'
                        )}
                        onClick={() => setPreviewTalent(talent)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(talent.id);
                              else next.delete(talent.id);
                              setSelectedIds(next);
                            }}
                            className="rounded border-slate-300 text-space-indigo-600 focus:ring-space-indigo-500"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-400 to-emerald-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {talent.userSummary.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{talent.userSummary.name}</p>
                              <p className="text-xs text-slate-500">{talent.userSummary.currentJob}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-br',
                            pcfg.bg
                          )}>
                            {talent.potentialLevel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                            `bg-${scfg.variant}-50 text-${scfg.variant}-700`
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', scfg.dot)} />
                            {scfg.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                style={{ width: `${talent.userSummary.matchScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{talent.userSummary.matchScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {talent.nextFollowUpAt ? (
                            <span className={cn(
                              'text-xs font-medium',
                              isOverdue ? 'text-red-600' : 'text-slate-500'
                            )}>
                              {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                              {new Date(talent.nextFollowUpAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewTalent(talent)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFollowUpTalent(talent)}
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5" />
                            </Button>
                            <Dropdown
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              }
                              align="right"
                            >
                              <button
                                onClick={() => navigate(`/hr/talent-pool/${talent.id}`)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 text-slate-600"
                              >
                                <Eye className="w-4 h-4" />
                                查看详情
                              </button>
                              <button
                                onClick={() => {
                                  hrApi.postHrTalentTag(talent.id, {
                                    potentialLevel: talent.potentialLevel === 'S' ? 'A' : 'S',
                                  }).catch(() => {});
                                  addToast('success', `已将 ${talent.userSummary.name} 标记为 ${talent.potentialLevel === 'S' ? 'A' : 'S'} 级`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 text-slate-600"
                              >
                                <Award className="w-4 h-4" />
                                调整潜力等级
                              </button>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                显示 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredTalents.length)} / 共 {filteredTalents.length} 位
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                        page === p
                          ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <TalentQuickPreview
        talent={previewTalent}
        onClose={() => setPreviewTalent(null)}
        onViewDetail={(id) => navigate(`/hr/talent-pool/${id}`)}
      />

      <FollowUpModal
        open={!!followUpTalent}
        talent={followUpTalent}
        onClose={() => setFollowUpTalent(null)}
        onSubmit={async (data) => {
          addToast('success', `已添加跟进记录：${data.note}`);
          setFollowUpTalent(null);
        }}
      />
    </div>
  );
};

export default HRTalentPool;