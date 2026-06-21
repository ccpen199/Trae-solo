import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Search, Check, X, User, Eye, Filter, Clock, FileText,
  ChevronRight, Calendar, Phone, Hash, Star, AlertCircle,
  Send, Ban, RefreshCw, ChevronDown, ZoomIn, Download,
  History, Briefcase, MapPin, Mail, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

type ExpertStatus = 'all' | 'pending' | 'reviewing' | 'approved' | 'rejected' | 'frozen';
type ExpertLevel = 'national' | 'provincial' | 'senior';
type Urgency = 'normal' | 'important' | 'urgent';

interface CredentialFile {
  name: string;
  type: string;
  url: string;
}

interface AuditRecord {
  stage: string;
  reviewer: string;
  time: string;
  comment: string;
  result: 'pass' | 'reject' | 'pending';
}

interface PastCase {
  id: string;
  artworkName: string;
  date: string;
  conclusion: string;
}

interface Expert {
  id: string;
  code: string;
  name: string;
  avatar: string;
  phone: string;
  appliedLevel: ExpertLevel[];
  currentLevel: ExpertLevel | null;
  credentials: CredentialFile[];
  experienceYears: number;
  categories: string[];
  bio: string;
  appliedAt: string;
  pendingHours: number;
  auditStage: number;
  status: ExpertStatus;
  urgency: Urgency;
  email?: string;
  idCard?: string;
  address?: string;
  organization?: string;
  title?: string;
  auditRecords?: AuditRecord[];
  pastCases?: PastCase[];
}

const auditStages = ['未提交', '初审', '复核', '终审', '发证'];

const mockExperts: Expert[] = [
  {
    id: '1',
    code: 'EXP-2024-0156',
    name: '张明清',
    avatar: '',
    phone: '138****6721',
    appliedLevel: ['national', 'provincial'],
    currentLevel: null,
    credentials: [
      { name: '国家级文物鉴定证书.pdf', type: 'pdf', url: '#' },
      { name: '故宫博物院工作证.jpg', type: 'image', url: '#' },
      { name: '30年从业证明.pdf', type: 'pdf', url: '#' },
      { name: '学术论文集.pdf', type: 'pdf', url: '#' },
    ],
    experienceYears: 32,
    categories: ['陶瓷鉴定', '玉器鉴定', '青铜器'],
    bio: '故宫博物院退休研究员，从事文物鉴定工作30余年，曾任故宫器物部主任。参与国家一级文物定级工作，发表专业论文50余篇。',
    appliedAt: '2024-06-15 09:32',
    pendingHours: 52,
    auditStage: 1,
    status: 'pending',
    urgency: 'urgent',
    email: 'zhangmq@example.com',
    idCard: '110101********1234',
    address: '北京市东城区景山前街4号',
    organization: '故宫博物院（已退休）',
    title: '研究员',
    auditRecords: [
      { stage: '提交申请', reviewer: '系统', time: '2024-06-15 09:32', comment: '申请人提交完整资料', result: 'pass' },
      { stage: '材料初审', reviewer: '—', time: '待处理', comment: '—', result: 'pending' },
    ],
    pastCases: [
      { id: 'CASE-001', artworkName: '清乾隆青花缠枝莲纹赏瓶', date: '2023-11-20', conclusion: '真品，一级文物' },
      { id: 'CASE-002', artworkName: '宋代汝窑天青釉洗', date: '2023-09-15', conclusion: '真品，二级文物' },
      { id: 'CASE-003', artworkName: '明代宣德炉', date: '2023-07-08', conclusion: '仿品' },
    ],
  },
  {
    id: '2',
    code: 'EXP-2024-0148',
    name: '李书远',
    avatar: '',
    phone: '139****2389',
    appliedLevel: ['provincial', 'senior'],
    currentLevel: null,
    credentials: [
      { name: '省级文物鉴定资格证.pdf', type: 'pdf', url: '#' },
      { name: '省博物馆聘书.jpg', type: 'image', url: '#' },
      { name: '书画家协会会员证.jpg', type: 'image', url: '#' },
    ],
    experienceYears: 18,
    categories: ['书画鉴定', '古籍善本'],
    bio: '江苏省文物局特聘专家，南京博物院书画部副主任，擅长明清书画及近现代名家作品鉴定。',
    appliedAt: '2024-06-16 14:21',
    pendingHours: 31,
    auditStage: 2,
    status: 'reviewing',
    urgency: 'important',
    email: 'lishuyuan@example.com',
    idCard: '320101********5678',
    address: '江苏省南京市玄武区中山东路321号',
    organization: '南京博物院',
    title: '副研究员',
    auditRecords: [
      { stage: '提交申请', reviewer: '系统', time: '2024-06-16 14:21', comment: '资料完整', result: 'pass' },
      { stage: '材料初审', reviewer: '王审核', time: '2024-06-17 10:15', comment: '材料齐全，资质达标，进入复核', result: 'pass' },
      { stage: '资质复核', reviewer: '—', time: '处理中', comment: '—', result: 'pending' },
    ],
    pastCases: [],
  },
  {
    id: '3',
    code: 'EXP-2024-0132',
    name: '王德宝',
    avatar: '',
    phone: '137****8812',
    appliedLevel: ['senior'],
    currentLevel: 'senior',
    credentials: [
      { name: '行业资深专家证书.pdf', type: 'pdf', url: '#' },
      { name: '钱币学会理事证明.pdf', type: 'pdf', url: '#' },
    ],
    experienceYears: 25,
    categories: ['钱币鉴定', '徽章杂项'],
    bio: '中国钱币学会理事，深耕古钱币鉴定领域25年，尤其擅长先秦钱币及机制币鉴定。',
    appliedAt: '2024-06-10 08:45',
    pendingHours: 0,
    auditStage: 4,
    status: 'approved',
    urgency: 'normal',
    email: 'wangdb@example.com',
    idCard: '310101********9012',
    address: '上海市黄浦区福州路401号',
    organization: '上海市钱币学会',
    title: '理事',
    auditRecords: [
      { stage: '提交申请', reviewer: '系统', time: '2024-06-10 08:45', comment: '资料完整', result: 'pass' },
      { stage: '材料初审', reviewer: '赵审核', time: '2024-06-10 15:20', comment: '通过', result: 'pass' },
      { stage: '资质复核', reviewer: '钱主管', time: '2024-06-11 11:30', comment: '资质优秀，建议通过', result: 'pass' },
      { stage: '终审', reviewer: '孙总监', time: '2024-06-12 09:00', comment: '批准认证行内资深专家', result: 'pass' },
      { stage: '发证', reviewer: '系统', time: '2024-06-12 14:30', comment: '证书已生成发送', result: 'pass' },
    ],
    pastCases: [
      { id: 'CASE-010', artworkName: '战国齐三字刀币', date: '2024-05-12', conclusion: '真品，极美品' },
      { id: 'CASE-011', artworkName: '袁大头三年壹圆', date: '2024-04-28', conclusion: '真品' },
    ],
  },
  {
    id: '4',
    code: 'EXP-2024-0128',
    name: '陈翠华',
    avatar: '',
    phone: '136****4455',
    appliedLevel: ['provincial'],
    currentLevel: null,
    credentials: [
      { name: '珠宝鉴定师证书.pdf', type: 'pdf', url: '#' },
      { name: 'NGTC证明.jpg', type: 'image', url: '#' },
    ],
    experienceYears: 8,
    categories: ['珠宝玉石', '钻石分级'],
    bio: 'NGTC注册珠宝玉石质量检验师，经验较少，申请省级资质存疑。',
    appliedAt: '2024-06-14 16:30',
    pendingHours: 0,
    auditStage: 2,
    status: 'rejected',
    urgency: 'normal',
    email: 'chench@example.com',
    idCard: '440101********3456',
    address: '广州市天河区珠江新城',
    organization: '某珠宝检测中心',
    title: '检验师',
    auditRecords: [
      { stage: '提交申请', reviewer: '系统', time: '2024-06-14 16:30', comment: '资料完整', result: 'pass' },
      { stage: '材料初审', reviewer: '李审核', time: '2024-06-15 09:20', comment: '通过', result: 'pass' },
      { stage: '资质复核', reviewer: '周主管', time: '2024-06-16 11:00', comment: '从业年限不足10年，不符合省级资质要求', result: 'reject' },
    ],
    pastCases: [],
  },
];

const statusTabConfig: { key: ExpertStatus; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: 'text-jade-600' },
  { key: 'pending', label: '待审核', color: 'text-gold-600' },
  { key: 'reviewing', label: '审核中', color: 'text-porcelain-600' },
  { key: 'approved', label: '已通过', color: 'text-jade-600' },
  { key: 'rejected', label: '已驳回', color: 'text-cinnabar-600' },
  { key: 'frozen', label: '已冻结', color: 'text-gray-500' },
];

const levelFilterConfig: { key: ExpertLevel | 'all'; label: string }[] = [
  { key: 'all', label: '全部等级' },
  { key: 'national', label: '国家级' },
  { key: 'provincial', label: '省级' },
  { key: 'senior', label: '行内资深' },
];

const categories = ['全品类', '陶瓷鉴定', '玉器鉴定', '书画鉴定', '青铜器', '钱币鉴定', '珠宝玉石', '古籍善本', '杂项'];

const urgencyColors: Record<Urgency, string> = {
  normal: '',
  important: 'before:bg-porcelain-500',
  urgent: 'before:bg-cinnabar-500',
};

const levelColors: Record<ExpertLevel, { bg: string; text: string; border: string }> = {
  national: { bg: 'bg-cinnabar-50', text: 'text-cinnabar-700', border: 'border-cinnabar-300' },
  provincial: { bg: 'bg-porcelain-50', text: 'text-porcelain-700', border: 'border-porcelain-300' },
  senior: { bg: 'bg-jade-50', text: 'text-jade-700', border: 'border-jade-300' },
};

const levelLabels: Record<ExpertLevel, string> = {
  national: '国家级',
  provincial: '省级',
  senior: '行内资深',
};

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number;
    let frame: number;
    const animate = (current: number) => {
      if (!startTime) startTime = current;
      const progress = Math.min((current - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function StatCard({
  icon: Icon, label, value, suffix = '', color, delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay?: number;
}) {
  const displayValue = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="card p-5 relative overflow-hidden group"
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 rounded-xl ${color} bg-opacity-15 flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <p className="text-sm text-jade-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-3xl font-bold text-jade-800 tabular-nums tracking-tight">{displayValue}</span>
          {suffix && <span className="text-sm text-jade-500 font-medium">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminExperts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<ExpertStatus>('all');
  const [activeLevel, setActiveLevel] = useState<ExpertLevel | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState('全品类');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [showCredentialPreview, setShowCredentialPreview] = useState<CredentialFile | null>(null);
  const [approveForm, setApproveForm] = useState({ level: 'provincial' as ExpertLevel, code: '', basePrice: '' });
  const [rejectForm, setRejectForm] = useState({ reason: '', allowReapply: true });
  const [supplementItems, setSupplementItems] = useState<string[]>([]);
  const [newSupplementItem, setNewSupplementItem] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);

  const filteredExperts = mockExperts.filter((e) => {
    if (activeStatus !== 'all' && e.status !== activeStatus) return false;
    if (activeLevel !== 'all' && !e.appliedLevel.includes(activeLevel)) return false;
    if (activeCategory !== '全品类' && !e.categories.includes(activeCategory)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!e.name.toLowerCase().includes(term) && !e.phone.includes(term) && !e.code.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const handleOpenDrawer = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowDrawer(true);
  };

  const handleOpenApprove = (expert: Expert) => {
    setSelectedExpert(expert);
    setApproveForm({
      level: expert.appliedLevel[0] || 'senior',
      code: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      basePrice: '',
    });
    setShowApproveModal(true);
  };

  const handleOpenReject = (expert: Expert) => {
    setSelectedExpert(expert);
    setRejectForm({ reason: '', allowReapply: true });
    setShowRejectModal(true);
  };

  const handleOpenSupplement = (expert: Expert) => {
    setSelectedExpert(expert);
    setSupplementItems([]);
    setNewSupplementItem('');
    setShowSupplementModal(true);
  };

  const addSupplementItem = () => {
    if (newSupplementItem.trim()) {
      setSupplementItems([...supplementItems, newSupplementItem.trim()]);
      setNewSupplementItem('');
    }
  };

  const removeSupplementItem = (idx: number) => {
    setSupplementItems(supplementItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-jade-800 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gold-gradient rounded-full" />
                专家资质分级认证
              </h1>
              <p className="text-jade-500 mt-2 ml-4.5">国家级 / 省级 / 行内资深 三级认证体系 · 全流程审核管理</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>导出数据</Button>
              <Button variant="primary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>刷新</Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock} label="待审核" value={12} suffix="人" color="bg-gold-500" delay={0} />
          <StatCard icon={Check} label="本月通过" value={48} suffix="人" color="bg-jade-500" delay={0.1} />
          <StatCard icon={Award} label="累计认证" value={326} suffix="人" color="bg-porcelain-500" delay={0.2} />
          <StatCard icon={Star} label="通过率" value={87} suffix="%" color="bg-cinnabar-500" delay={0.3} />
        </div>

        <Card className="mb-6">
          <Card.Content className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索姓名 / 手机号 / 专家编号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {statusTabConfig.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStatus(tab.key)}
                    className={cn(
                      'px-3.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-300 relative',
                      activeStatus === tab.key
                        ? 'bg-ink-gradient text-white shadow-gold-glow border border-gold-400'
                        : 'bg-rice-100 text-jade-600 border border-transparent hover:border-gold-300 hover:bg-gold-50',
                    )}
                  >
                    {tab.label}
                    {tab.key !== 'all' && (
                      <span className={cn(
                        'ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full',
                        activeStatus === tab.key ? 'bg-white/20' : 'bg-gold-200/50',
                      )}>
                        {mockExperts.filter((e) => e.status === tab.key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterExpanded(!filterExpanded)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-jade-600 bg-rice-100 rounded-md hover:bg-gold-50 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                高级筛选
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', filterExpanded && 'rotate-180')} />
              </button>
            </div>

            <AnimatePresence>
              {filterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-gold-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="label-field">申请等级</label>
                      <div className="flex flex-wrap gap-1.5">
                        {levelFilterConfig.map((lvl) => (
                          <button
                            key={lvl.key}
                            onClick={() => setActiveLevel(lvl.key)}
                            className={cn(
                              'px-3 py-1.5 text-xs rounded-md font-medium border transition-all',
                              activeLevel === lvl.key
                                ? 'border-gold-400 bg-gold-50 text-gold-700'
                                : 'border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300',
                            )}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label-field">擅长品类</label>
                      <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        className="input-field text-sm"
                      >
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="label-field">申请日期范围</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className="input-field text-sm flex-1"
                        />
                        <span className="text-jade-400">至</span>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className="input-field text-sm flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card.Content>
        </Card>

        {filteredExperts.length === 0 ? (
          <Card>
            <Card.Content className="py-12">
              <EmptyState
                icon={<Award className="w-16 h-16 text-gold-400" />}
                title="暂无符合条件的申请"
                description="尝试调整筛选条件或搜索关键词"
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExperts.map((expert, index) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  expert.status === 'pending' && 'hover:shadow-gold-glow hover:border-gold-400',
                )}>
                  <div className={cn(
                    'absolute left-0 top-0 bottom-0 w-1',
                    expert.urgency !== 'normal' && urgencyColors[expert.urgency],
                    expert.status === 'pending' && expert.urgency === 'normal' && 'bg-gold-400',
                    expert.status === 'reviewing' && 'bg-porcelain-400',
                    expert.status === 'approved' && 'bg-jade-400',
                    expert.status === 'rejected' && 'bg-cinnabar-400',
                  )} />
                  <Card.Content className="pl-6 flex flex-col xl:flex-row gap-5">
                    <div className="flex gap-4 xl:w-64 flex-shrink-0">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl bg-ink-gradient flex items-center justify-center flex-shrink-0 border-2 border-gold-400 shadow-lg overflow-hidden">
                          {expert.avatar ? (
                            <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-gold-300" />
                          )}
                        </div>
                        {expert.status === 'approved' && expert.currentLevel && (
                          <div className={cn(
                            'absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-rice-50 shadow-md',
                            levelColors[expert.currentLevel].bg,
                          )}>
                            <Award className={cn('w-3.5 h-3.5', levelColors[expert.currentLevel].text)} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-xl font-semibold text-jade-800 mb-1">{expert.name}</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-jade-500">
                            <Hash className="w-3 h-3" />
                            <span className="font-mono">{expert.code}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-jade-500">
                            <Phone className="w-3 h-3" />
                            <span>{expert.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-jade-500 font-medium">申请等级：</span>
                        {(['national', 'provincial', 'senior'] as ExpertLevel[]).map((lvl) => {
                          const applied = expert.appliedLevel.includes(lvl);
                          const isCurrent = expert.currentLevel === lvl;
                          return (
                            <span
                              key={lvl}
                              className={cn(
                                'px-2.5 py-1 text-xs rounded-md font-medium border transition-all',
                                isCurrent
                                  ? `${levelColors[lvl].bg} ${levelColors[lvl].text} ${levelColors[lvl].border} shadow-sm`
                                  : applied
                                    ? `${levelColors[lvl].bg} ${levelColors[lvl].text} border-dashed ${levelColors[lvl].border}`
                                    : 'bg-rice-100 text-jade-300 border border-gold-100 line-through',
                              )}
                            >
                              {applied && !isCurrent && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                              {isCurrent && <Star className="w-3 h-3 inline mr-1 -mt-0.5 fill-current" />}
                              {levelLabels[lvl]}
                            </span>
                          );
                        })}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText className="w-3.5 h-3.5 text-jade-400" />
                          <span className="text-xs text-jade-500 font-medium">资质文件</span>
                          <span className="text-[10px] text-jade-400">({expert.credentials.length}份)</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {expert.credentials.map((file, i) => (
                            <button
                              key={i}
                              onClick={() => setShowCredentialPreview(file)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-rice-100 text-jade-600 rounded-md border border-gold-200 hover:border-gold-400 hover:bg-gold-50 hover:shadow-sm transition-all group"
                            >
                              <FileText className="w-3 h-3 text-gold-500 group-hover:text-gold-600" />
                              <span className="max-w-[140px] truncate">{file.name}</span>
                              <ZoomIn className="w-3 h-3 text-jade-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-jade-500">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          从业 <strong className="text-jade-700 font-semibold">{expert.experienceYears}</strong> 年
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Tag variant="outline" className="!py-0.5 !text-[10px]">{expert.categories.slice(0, 3).join(' · ')}</Tag>
                        </span>
                      </div>

                      <p className="text-xs text-jade-500 leading-relaxed line-clamp-2 bg-rice-50/50 border-l-2 border-gold-200 pl-3 py-1.5 rounded-r">
                        {expert.bio}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                        <div className="inline-flex items-center gap-1.5 text-jade-500">
                          <Calendar className="w-3 h-3" />
                          <span>{expert.appliedAt}</span>
                        </div>
                        {expert.pendingHours > 0 && (
                          <div className={cn(
                            'inline-flex items-center gap-1.5 font-medium',
                            expert.pendingHours > 48 ? 'text-cinnabar-600' : 'text-gold-600',
                          )}>
                            <Clock className="w-3 h-3" />
                            <span>
                              待审核 {expert.pendingHours} 小时
                              {expert.pendingHours > 48 && (
                                <span className="ml-1 inline-flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3 animate-pulse" />
                                  超时
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="xl:w-64 flex-shrink-0 xl:border-l xl:border-gold-100 xl:pl-5 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-jade-500 font-medium">审核进度</span>
                          <Badge variant={
                            expert.status === 'pending' ? 'warning' :
                            expert.status === 'reviewing' ? 'info' :
                            expert.status === 'approved' ? 'success' : 'error'
                          } dot>
                            {statusTabConfig.find((s) => s.key === expert.status)?.label}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {auditStages.map((stage, idx) => {
                            const isActive = idx === expert.auditStage;
                            const isDone = idx < expert.auditStage;
                            const isFinal = idx === auditStages.length - 1;
                            return (
                              <div key={stage} className="flex items-center gap-2">
                                <div className={cn(
                                  'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all',
                                  isDone && 'bg-jade-500 border-jade-500',
                                  isActive && 'bg-gold-gradient border-gold-400 shadow-gold-glow animate-pulse',
                                  !isDone && !isActive && 'bg-rice-100 border-gold-200',
                                )}>
                                  {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className={cn(
                                  'text-xs font-medium transition-colors',
                                  isDone && 'text-jade-600',
                                  isActive && 'text-gold-700',
                                  !isDone && !isActive && 'text-jade-300',
                                )}>{stage}</span>
                                {!isFinal && <div className={cn('w-0.5 h-2 ml-[7px]', isDone ? 'bg-jade-300' : 'bg-gold-100')} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenDrawer(expert)}
                        >
                          资质详情
                        </Button>
                        {(expert.status === 'pending' || expert.status === 'reviewing') && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                                onClick={() => handleOpenApprove(expert)}
                              >
                                通过
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-cinnabar-600 hover:!bg-cinnabar-50"
                                leftIcon={<X className="w-3.5 h-3.5" />}
                                onClick={() => handleOpenReject(expert)}
                              >
                                驳回
                              </Button>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              fullWidth
                              leftIcon={<Send className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenSupplement(expert)}
                            >
                              补充材料
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDrawer && selectedExpert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-jade-900/50 backdrop-blur-sm z-40"
              onClick={() => setShowDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[560px] bg-rice-50 z-50 shadow-2xl flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gold-200 bg-gradient-to-r from-rice-50 to-gold-50/30 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold text-jade-800">专家资质详情</h2>
                  <p className="text-xs text-jade-500 mt-1 font-mono">{selectedExpert.code}</p>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 text-jade-500 hover:text-jade-700 hover:bg-jade-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-6 space-y-6">
                  <div className="card p-5 bg-gradient-to-br from-rice-50 to-gold-50/30">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-ink-gradient flex items-center justify-center border-2 border-gold-400 shadow-lg">
                        {selectedExpert.avatar ? (
                          <img src={selectedExpert.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <User className="w-10 h-10 text-gold-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-2xl font-bold text-jade-800 mb-2">{selectedExpert.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {selectedExpert.appliedLevel.map((lvl) => (
                            <span key={lvl} className={cn('px-2 py-0.5 text-xs rounded-md font-medium border', levelColors[lvl].bg, levelColors[lvl].text, levelColors[lvl].border)}>
                              {levelLabels[lvl]}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs text-jade-500">
                          <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gold-500" /><span>{selectedExpert.phone}</span></div>
                          <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gold-500" /><span>{selectedExpert.email}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold-500" /><span>{selectedExpert.address}</span></div>
                          <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-gold-500" /><span>{selectedExpert.organization} · {selectedExpert.title}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-jade-800 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gold-gradient rounded-full" />
                      基本信息
                    </h4>
                    <div className="card divide-y divide-gold-100">
                      {[
                        { label: '身份证号', value: selectedExpert.idCard },
                        { label: '从业年限', value: `${selectedExpert.experienceYears} 年` },
                        { label: '擅长品类', value: selectedExpert.categories.join('、') },
                        { label: '申请时间', value: selectedExpert.appliedAt },
                      ].map((item) => (
                        <div key={item.label} className="px-4 py-3 flex text-sm">
                          <span className="text-jade-500 w-24 flex-shrink-0">{item.label}</span>
                          <span className="text-jade-700 font-medium flex-1">{item.value}</span>
                        </div>
                      ))}
                      <div className="px-4 py-3">
                        <span className="text-jade-500 text-sm block mb-2">个人简介</span>
                        <p className="text-jade-700 text-sm leading-relaxed">{selectedExpert.bio}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-jade-800 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gold-gradient rounded-full" />
                      资质证书
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedExpert.credentials.map((file, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowCredentialPreview(file)}
                          className="card p-3 text-left group hover:border-gold-400 hover:shadow-gold-glow transition-all"
                        >
                          <div className="aspect-[4/3] bg-gradient-to-br from-rice-100 to-gold-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                            {file.type === 'image' ? (
                              <div className="w-full h-full bg-jade-100/50 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-jade-400" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-cinnabar-50 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-cinnabar-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-jade-600 font-medium truncate group-hover:text-gold-600 transition-colors">{file.name}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {selectedExpert.auditRecords && selectedExpert.auditRecords.length > 0 && (
                    <div>
                      <h4 className="font-serif text-base font-semibold text-jade-800 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gold-gradient rounded-full" />
                        审核记录
                      </h4>
                      <div className="card p-4">
                        <div className="space-y-4">
                          {selectedExpert.auditRecords.map((record, i) => {
                            const isLast = i === selectedExpert.auditRecords!.length - 1;
                            return (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    'w-3 h-3 rounded-full border-2 flex-shrink-0',
                                    record.result === 'pass' && 'bg-jade-500 border-jade-500',
                                    record.result === 'reject' && 'bg-cinnabar-500 border-cinnabar-500',
                                    record.result === 'pending' && 'bg-rice-50 border-gold-400 animate-pulse',
                                  )} />
                                  {!isLast && <div className="w-0.5 flex-1 bg-gold-100 mt-1" />}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-jade-700">{record.stage}</span>
                                    <span className="text-xs text-jade-400">{record.time}</span>
                                  </div>
                                  <p className="text-xs text-jade-500 mb-1">审核人：{record.reviewer}</p>
                                  <p className="text-xs text-jade-600 bg-rice-50 rounded px-2.5 py-1.5 border border-gold-100">{record.comment}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedExpert.pastCases && selectedExpert.pastCases.length > 0 && (
                    <div>
                      <h4 className="font-serif text-base font-semibold text-jade-800 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gold-gradient rounded-full" />
                        过往鉴定案例
                      </h4>
                      <div className="space-y-2">
                        {selectedExpert.pastCases.map((c) => (
                          <div key={c.id} className="card p-3 hover:border-gold-300 transition-colors">
                            <div className="flex items-start justify-between mb-1.5">
                              <span className="font-serif text-sm font-semibold text-jade-700">{c.artworkName}</span>
                              <span className="text-[10px] text-jade-400 font-mono">{c.id}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-jade-500">{c.date}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-jade-50 text-jade-600 rounded">{c.conclusion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gold-200 bg-rice-50/80 flex gap-2">
                <Button variant="secondary" size="sm" fullWidth onClick={() => setShowDrawer(false)}>关闭</Button>
                {(selectedExpert.status === 'pending' || selectedExpert.status === 'reviewing') && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => { setShowDrawer(false); handleOpenApprove(selectedExpert); }}>通过认证</Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="确认通过认证"
        description="设置最终认证等级和专家基础信息"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowApproveModal(false)}>取消</Button>
            <Button variant="primary" onClick={() => { setShowApproveModal(false); }}>确认通过</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label-field">最终认证等级 *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['national', 'provincial', 'senior'] as ExpertLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setApproveForm({ ...approveForm, level: lvl })}
                  className={cn(
                    'px-3 py-3 rounded-lg text-sm font-medium border-2 transition-all',
                    approveForm.level === lvl
                      ? `${levelColors[lvl].bg} ${levelColors[lvl].text} ${levelColors[lvl].border} shadow-md ring-2 ring-offset-2 ring-gold-300`
                      : 'bg-rice-50 text-jade-500 border-gold-200 hover:border-gold-300',
                  )}
                >
                  <Award className={cn('w-5 h-5 mx-auto mb-1', approveForm.level === lvl ? '' : 'text-jade-300')} />
                  {levelLabels[lvl]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-field">专家编号 *</label>
            <Input
              value={approveForm.code}
              onChange={(e) => setApproveForm({ ...approveForm, code: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">基础报价（元/次）*</label>
            <Input
              type="number"
              placeholder="请输入基础鉴定服务报价"
              value={approveForm.basePrice}
              onChange={(e) => setApproveForm({ ...approveForm, basePrice: e.target.value })}
            />
          </div>
          <div className="bg-gold-50/50 border border-gold-200 rounded-lg p-3 text-xs text-jade-600">
            <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-gold-500" />
            通过后系统将自动生成电子证书并发送通知邮件至 <strong className="text-jade-700">{selectedExpert?.email}</strong>
          </div>
        </div>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回申请"
        description="请详细填写驳回原因，将通知给申请人"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>取消</Button>
            <Button
              variant="primary"
              className="!bg-cinnabar-500 !border-cinnabar-500 hover:!bg-cinnabar-600"
              onClick={() => { setShowRejectModal(false); }}
              disabled={!rejectForm.reason.trim()}
            >
              确认驳回
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label-field">驳回原因 *</label>
            <textarea
              rows={4}
              className="input-field resize-none text-sm"
              placeholder="请详细说明驳回原因，如：资质证明材料不完整、从业年限未达要求等..."
              value={rejectForm.reason}
              onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
            />
            {!rejectForm.reason.trim() && (
              <p className="text-xs text-cinnabar-500 mt-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> 驳回原因为必填项
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 bg-rice-50 rounded-lg border border-gold-200">
            <input
              type="checkbox"
              id="allowReapply"
              checked={rejectForm.allowReapply}
              onChange={(e) => setRejectForm({ ...rejectForm, allowReapply: e.target.checked })}
              className="w-4 h-4 rounded border-gold-300 text-gold-500 focus:ring-gold-400"
            />
            <label htmlFor="allowReapply" className="text-sm text-jade-700 flex-1">
              <span className="font-medium">允许重新申请</span>
              <span className="block text-xs text-jade-500 mt-0.5">勾选后申请人可在30天内补充材料重新提交</span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={showSupplementModal}
        onClose={() => setShowSupplementModal(false)}
        title="要求补充材料"
        description="列出需要申请人补充的材料清单"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSupplementModal(false)}>取消</Button>
            <Button variant="primary" onClick={() => { setShowSupplementModal(false); }} disabled={supplementItems.length === 0}>
              发送通知
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入需要补充的材料名称..."
              value={newSupplementItem}
              onChange={(e) => setNewSupplementItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSupplementItem())}
            />
            <Button variant="secondary" onClick={addSupplementItem}>添加</Button>
          </div>

          <div className="space-y-2 min-h-[120px]">
            {supplementItems.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gold-200 rounded-lg">
                <FileText className="w-10 h-10 text-gold-300 mx-auto mb-2" />
                <p className="text-sm text-jade-400">暂未添加补充材料要求</p>
              </div>
            ) : (
              supplementItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 bg-rice-50 border border-gold-200 rounded-lg group"
                >
                  <span className="w-6 h-6 rounded-md bg-gold-gradient text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                  <span className="text-sm text-jade-700 flex-1">{item}</span>
                  <button
                    onClick={() => removeSupplementItem(idx)}
                    className="p-1 text-jade-300 hover:text-cinnabar-500 hover:bg-cinnabar-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          <div className="bg-porcelain-50/50 border border-porcelain-200 rounded-lg p-3 text-xs text-porcelain-700">
            <History className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            将通过站内信和邮件同步发送材料补充通知
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showCredentialPreview}
        onClose={() => setShowCredentialPreview(null)}
        title={showCredentialPreview?.name || ''}
        size="lg"
      >
        <div className="aspect-[4/3] bg-gradient-to-br from-rice-100 via-gold-50/30 to-rice-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gold-200">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gold-400 mx-auto mb-3" />
            <p className="font-serif text-lg text-jade-700 mb-1">{showCredentialPreview?.name}</p>
            <p className="text-sm text-jade-400">文件预览区域（生产环境接入真实文件流）</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
