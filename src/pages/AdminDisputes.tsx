import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Search, Gavel, Eye, Filter, User, Clock,
  FileText, Check, X, ChevronDown, ChevronRight, Calendar,
  MessageSquare, Image as ImageIcon, UserCircle, Scale,
  ThumbsUp, ThumbsDown, Minus, Award, AlertCircle,
  Clock3, Sparkles, History, ArrowLeftRight, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

type DisputeStatus = 'all' | 'pending' | 'evidence' | 'arbitrating' | 'ruled' | 'closed';
type DisputeType = 'conclusion' | 'certificate' | 'service' | 'other';
type Urgency = 'normal' | 'important' | 'urgent';
type ArbitrationStage = 1 | 2 | 3;
type RulingType = 'support_user' | 'support_expert' | 'partial' | 'reappraise';
type ExpertPenalty = 'none' | 'warning' | 'demote' | 'suspend7' | 'revoke';

interface EvidenceItem {
  id: string;
  uploader: 'user' | 'expert' | 'platform';
  name: string;
  type: 'image' | 'pdf' | 'text';
  url?: string;
  content?: string;
  time: string;
}

interface QAItem {
  id: string;
  question: string;
  from: 'platform';
  to: 'user' | 'expert' | 'both';
  userAnswer?: string;
  expertAnswer?: string;
  time: string;
}

interface Arbitrator {
  id: string;
  name: string;
  avatar: string;
  title: string;
  isChief: boolean;
}

interface PastRuling {
  id: string;
  type: string;
  result: string;
  userSatisfaction: number;
  expertSatisfaction: number;
  date: string;
}

interface Dispute {
  id: string;
  orderId: string;
  artworkName: string;
  artworkThumb: string;
  user: { name: string; avatar: string };
  expert: { name: string; avatar: string; level: string };
  type: DisputeType;
  reason: string;
  status: DisputeStatus;
  urgency: Urgency;
  createdAt: string;
  currentHours: number;
  stage: ArbitrationStage;
  userEvidence: EvidenceItem[];
  expertEvidence: EvidenceItem[];
  userSupplement?: EvidenceItem[];
  expertDefense?: EvidenceItem[];
  qaList?: QAItem[];
  platformOpinion?: string;
  arbitrators?: Arbitrator[];
  ruling?: {
    type: RulingType;
    refundRatio: number;
    penalty: ExpertPenalty;
    reason: string;
    time?: string;
  };
  pastReference?: PastRuling[];
}

const statusTabConfig: { key: DisputeStatus; label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }[] = [
  { key: 'all', label: '全部', variant: 'default' },
  { key: 'pending', label: '待受理', variant: 'warning' },
  { key: 'evidence', label: '举证中', variant: 'info' },
  { key: 'arbitrating', label: '仲裁中', variant: 'warning' },
  { key: 'ruled', label: '已裁决', variant: 'success' },
  { key: 'closed', label: '已结案', variant: 'success' },
];

const disputeTypeConfig: Record<DisputeType, { label: string; color: string }> = {
  conclusion: { label: '鉴定结论争议', color: 'bg-porcelain-100 text-porcelain-700 border-porcelain-200' },
  certificate: { label: '证书信息错误', color: 'bg-gold-100 text-gold-700 border-gold-200' },
  service: { label: '专家服务问题', color: 'bg-jade-100 text-jade-700 border-jade-200' },
  other: { label: '其他纠纷', color: 'bg-rice-200 text-jade-600 border-gold-200' },
};

const urgencySidebar: Record<Urgency, string> = {
  normal: 'bg-jade-400',
  important: 'bg-porcelain-500',
  urgent: 'bg-cinnabar-500',
};

const urgencyLabel: Record<Urgency, { text: string; color: string }> = {
  normal: { text: '普通', color: 'text-jade-600 bg-jade-50 border-jade-200' },
  important: { text: '重要', color: 'text-porcelain-600 bg-porcelain-50 border-porcelain-200' },
  urgent: { text: '紧急', color: 'text-cinnabar-600 bg-cinnabar-50 border-cinnabar-200' },
};

const stageLabels = ['受理登记', '举证质证', '仲裁裁决'];
const stageIcons = [FileText, ArrowLeftRight, Scale];

const rulingTypeOptions: { key: RulingType; label: string; icon: typeof ThumbsUp; color: string }[] = [
  { key: 'support_user', label: '支持用户', icon: ThumbsUp, color: 'text-jade-600 bg-jade-50 border-jade-300' },
  { key: 'support_expert', label: '支持专家', icon: Award, color: 'text-gold-600 bg-gold-50 border-gold-300' },
  { key: 'partial', label: '部分支持', icon: Minus, color: 'text-porcelain-600 bg-porcelain-50 border-porcelain-300' },
  { key: 'reappraise', label: '发回重鉴', icon: Sparkles, color: 'text-cinnabar-600 bg-cinnabar-50 border-cinnabar-300' },
];

const penaltyOptions: { key: ExpertPenalty; label: string; desc: string }[] = [
  { key: 'none', label: '无处罚', desc: '不采取任何处罚措施' },
  { key: 'warning', label: '警告', desc: '给予书面警告，记入档案' },
  { key: 'demote', label: '降星', desc: '降低专家星级评分' },
  { key: 'suspend7', label: '暂停接单7天', desc: '临时冻结接单权限一周' },
  { key: 'revoke', label: '取消认证', desc: '永久取消平台专家资质' },
];

const disputeTypes = ['全部类型', '鉴定结论争议', '证书信息错误', '专家服务问题', '其他纠纷'];

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number;
    let frame: number;
    const animate = (current: number) => {
      if (!startTime) startTime = current;
      const progress = Math.min((current - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased) * 10 / 10);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function StatCard({
  icon: Icon, label, value, suffix = '', color, delay = 0, decimals = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay?: number;
  decimals?: number;
}) {
  const rawValue = useCountUp(value * Math.pow(10, decimals));
  const displayValue = (rawValue / Math.pow(10, decimals)).toFixed(decimals);
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

const mockDisputes: Dispute[] = [
  {
    id: 'DISP-2024-0089',
    orderId: 'ORD-20240612-0156',
    artworkName: '清乾隆青花缠枝莲纹赏瓶',
    artworkThumb: '',
    user: { name: '藏友小王', avatar: '' },
    expert: { name: '张明清', avatar: '', level: '国家级' },
    type: 'conclusion',
    reason: '用户认为鉴定结论有误，该赏瓶应为道光时期仿品，非乾隆本朝',
    status: 'pending',
    urgency: 'urgent',
    createdAt: '2024-06-18 09:15',
    currentHours: 36,
    stage: 1,
    userEvidence: [
      { id: 'e1', uploader: 'user', name: '藏品底部照片.jpg', type: 'image', time: '2024-06-18 09:15' },
      { id: 'e2', uploader: 'user', name: '款识微距图.jpg', type: 'image', time: '2024-06-18 09:16' },
      { id: 'e3', uploader: 'user', name: '另一鉴定机构报告.pdf', type: 'pdf', time: '2024-06-18 09:18' },
      { id: 'e4', uploader: 'user', name: '藏品来源证明.pdf', type: 'pdf', time: '2024-06-18 09:20' },
    ],
    expertEvidence: [
      { id: 'e5', uploader: 'expert', name: '鉴定报告原文.pdf', type: 'pdf', time: '2024-06-18 14:30' },
      { id: 'e6', uploader: 'expert', name: '青料比对分析.docx', type: 'text', content: '采用乾隆典型浙料，色浓艳有层次...', time: '2024-06-18 14:32' },
    ],
  },
  {
    id: 'DISP-2024-0087',
    orderId: 'ORD-20240608-0092',
    artworkName: '齐白石虾趣图立轴',
    artworkThumb: '',
    user: { name: '书画收藏家李先生', avatar: '' },
    expert: { name: '李书远', avatar: '', level: '省级' },
    type: 'certificate',
    reason: '鉴定证书中的创作年份标注错误，应为1942年而非1952年',
    status: 'evidence',
    urgency: 'important',
    createdAt: '2024-06-16 14:22',
    currentHours: 62,
    stage: 2,
    userEvidence: [
      { id: 'e7', uploader: 'user', name: '齐白石年谱节选.pdf', type: 'pdf', time: '2024-06-16 14:22' },
    ],
    expertEvidence: [],
    userSupplement: [
      { id: 'e8', uploader: 'user', name: '同类作品比对图.jpg', type: 'image', time: '2024-06-17 10:05' },
      { id: 'e9', uploader: 'user', name: '专家落款对比分析.pdf', type: 'pdf', time: '2024-06-17 11:20' },
    ],
    expertDefense: [
      { id: 'e10', uploader: 'expert', name: '辩护意见书.pdf', type: 'pdf', time: '2024-06-18 09:00' },
    ],
    qaList: [
      { id: 'q1', question: '请问鉴定时的断代依据主要有哪些？', from: 'platform', to: 'expert', expertAnswer: '依据笔法风格、墨色、印章特征及款识书法综合判断', time: '2024-06-17 15:30' },
      { id: 'q2', question: '请提供此作品的流传经过', from: 'platform', to: 'user', userAnswer: '此作为家父1980年代于北京荣宝斋购得，有原始购买凭证', time: '2024-06-17 16:45' },
    ],
  },
  {
    id: 'DISP-2024-0085',
    orderId: 'ORD-20240605-0078',
    artworkName: '宋代建窑兔毫盏',
    artworkThumb: '',
    user: { name: '茶道玩家阿林', avatar: '' },
    expert: { name: '王德宝', avatar: '', level: '行内资深' },
    type: 'service',
    reason: '专家回复速度过慢，且沟通态度不佳，影响了用户体验',
    status: 'arbitrating',
    urgency: 'normal',
    createdAt: '2024-06-14 16:40',
    currentHours: 90,
    stage: 3,
    userEvidence: [
      { id: 'e11', uploader: 'user', name: '聊天记录截图1.png', type: 'image', time: '2024-06-14 16:40' },
      { id: 'e12', uploader: 'user', name: '聊天记录截图2.png', type: 'image', time: '2024-06-14 16:41' },
    ],
    expertEvidence: [
      { id: 'e13', uploader: 'expert', name: '工作时间说明.pdf', type: 'pdf', time: '2024-06-15 09:30' },
    ],
    arbitrators: [
      { id: 'a1', name: '周文博', avatar: '', title: '平台首席仲裁官', isChief: true },
      { id: 'a2', name: '吴雅琴', avatar: '', title: '用户权益专员', isChief: false },
      { id: 'a3', name: '郑明道', avatar: '', title: '专家委员会代表', isChief: false },
    ],
    pastReference: [
      { id: 'p1', type: '专家服务纠纷', result: '部分支持用户', userSatisfaction: 85, expertSatisfaction: 70, date: '2024-06-10' },
      { id: 'p2', type: '专家服务纠纷', result: '支持专家', userSatisfaction: 60, expertSatisfaction: 95, date: '2024-06-05' },
      { id: 'p3', type: '沟通时效争议', result: '部分支持用户', userSatisfaction: 80, expertSatisfaction: 75, date: '2024-06-01' },
      { id: 'p4', type: '服务态度纠纷', result: '支持用户', userSatisfaction: 90, expertSatisfaction: 65, date: '2024-05-28' },
      { id: 'p5', type: '服务纠纷', result: '部分支持', userSatisfaction: 75, expertSatisfaction: 72, date: '2024-05-20' },
      { id: 'p6', type: '回复时效问题', result: '警告专家', userSatisfaction: 82, expertSatisfaction: 68, date: '2024-05-15' },
      { id: 'p7', type: '服务纠纷', result: '支持专家', userSatisfaction: 55, expertSatisfaction: 92, date: '2024-05-10' },
      { id: 'p8', type: '态度问题', result: '双方调解', userSatisfaction: 78, expertSatisfaction: 80, date: '2024-05-05' },
      { id: 'p9', type: '服务争议', result: '部分支持用户', userSatisfaction: 83, expertSatisfaction: 70, date: '2024-04-28' },
      { id: 'p10', type: '沟通纠纷', result: '警告专家', userSatisfaction: 88, expertSatisfaction: 65, date: '2024-04-20' },
    ],
  },
  {
    id: 'DISP-2024-0080',
    orderId: 'ORD-20240601-0051',
    artworkName: '战国齐三字刀币',
    artworkThumb: '',
    user: { name: '古钱藏家老赵', avatar: '' },
    expert: { name: '王德宝', avatar: '', level: '行内资深' },
    type: 'conclusion',
    reason: '对刀币真伪结论有异议，用户认为是真品但专家判定为仿品',
    status: 'ruled',
    urgency: 'important',
    createdAt: '2024-06-10 11:20',
    currentHours: 0,
    stage: 3,
    userEvidence: [],
    expertEvidence: [],
    arbitrators: [
      { id: 'a4', name: '周文博', avatar: '', title: '平台首席仲裁官', isChief: true },
      { id: 'a5', name: '孙明远', avatar: '', title: '钱币学会顾问', isChief: false },
      { id: 'a6', name: '李芳', avatar: '', title: '法务专员', isChief: false },
    ],
    ruling: {
      type: 'support_expert',
      refundRatio: 0,
      penalty: 'none',
      reason: '经三位仲裁员共同审议，专家鉴定依据充分，从铜质、文字风格、铸造工艺等多方面综合判断，该刀币确属现代仿品。用户提供的对比图片缺乏说服力。',
      time: '2024-06-14 15:30',
    },
  },
];

export default function AdminDisputes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<DisputeStatus>('all');
  const [activeType, setActiveType] = useState('全部类型');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stage, setStage] = useState<ArbitrationStage>(1);
  const [platformOpinion, setPlatformOpinion] = useState('');
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [newQA, setNewQA] = useState({ question: '', to: 'both' as 'user' | 'expert' | 'both' });
  const [qaList, setQaList] = useState<QAItem[]>([]);
  const [evidenceTab, setEvidenceTab] = useState<'report' | 'compare' | 'qualification' | 'chat'>('report');
  const [ruling, setRuling] = useState({
    type: 'partial' as RulingType,
    refundRatio: 50,
    penalty: 'warning' as ExpertPenalty,
    reason: '',
  });
  const rulingTemplates = [
    '经仲裁庭审议，双方均存在一定责任，建议部分退款处理。',
    '现有证据不足以推翻原鉴定结论，维持专家意见。',
    '鉴定过程存在程序瑕疵，建议发回重新鉴定。',
  ];

  useEffect(() => {
    if (selectedDispute?.qaList) setQaList(selectedDispute.qaList);
    if (selectedDispute?.platformOpinion) setPlatformOpinion(selectedDispute.platformOpinion || '');
    if (selectedDispute) setStage(selectedDispute.stage);
  }, [selectedDispute]);

  const filteredDisputes = mockDisputes.filter((d) => {
    if (activeStatus !== 'all' && d.status !== activeStatus) return false;
    if (activeType !== '全部类型' && disputeTypeConfig[d.type].label !== activeType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!d.id.toLowerCase().includes(term) && !d.orderId.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const addQA = () => {
    if (!newQA.question.trim()) return;
    setQaList([...qaList, {
      id: `q${Date.now()}`,
      question: newQA.question,
      from: 'platform',
      to: newQA.to,
      time: new Date().toLocaleString('zh-CN'),
    }]);
    setNewQA({ question: '', to: 'both' });
  };

  const openDetail = (d: Dispute) => {
    setSelectedDispute(d);
    setShowDetailModal(true);
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
                <span className="w-1.5 h-8 bg-cinnabar-500 rounded-full" />
                纠纷仲裁中心
              </h1>
              <p className="text-jade-500 mt-2 ml-4.5">受理登记 → 举证质证 → 仲裁裁决 · 全流程透明可追溯</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>仲裁规则</Button>
              <Button variant="primary" size="sm" leftIcon={<Gavel className="w-4 h-4" />}>快速裁决</Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={AlertTriangle} label="待处理" value={mockDisputes.filter(d => ['pending', 'evidence', 'arbitrating'].includes(d.status)).length} suffix="件" color="bg-cinnabar-500" delay={0} />
          <StatCard icon={Sparkles} label="本周新增" value={18} suffix="件" color="bg-gold-500" delay={0.1} />
          <StatCard icon={Clock3} label="平均结案" value={48.5} suffix="小时" color="bg-porcelain-500" delay={0.2} decimals={1} />
          <StatCard icon={ThumbsUp} label="用户满意度" value={92} suffix="%" color="bg-jade-500" delay={0.3} />
        </div>

        <Card className="mb-6">
          <Card.Content className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索纠纷编号 / 订单号..."
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
                        {mockDisputes.filter((d) => d.status === tab.key).length}
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
                更多筛选
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
                  <div className="pt-4 border-t border-gold-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label-field">纠纷类型</label>
                      <div className="flex flex-wrap gap-1.5">
                        {disputeTypes.map((t) => (
                          <button
                            key={t}
                            onClick={() => setActiveType(t)}
                            className={cn(
                              'px-3 py-1.5 text-xs rounded-md font-medium border transition-all',
                              activeType === t
                                ? 'border-gold-400 bg-gold-50 text-gold-700'
                                : 'border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300',
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label-field">申请时间范围</label>
                      <div className="flex gap-2 items-center">
                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="input-field text-sm flex-1" />
                        <span className="text-jade-400">至</span>
                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="input-field text-sm flex-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card.Content>
        </Card>

        {filteredDisputes.length === 0 ? (
          <Card>
            <Card.Content className="py-12">
              <EmptyState
                icon={<AlertTriangle className="w-16 h-16 text-gold-400" />}
                title="暂无符合条件的纠纷"
                description="尝试调整筛选条件或搜索关键词"
              />
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((d, idx) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card className="relative overflow-hidden hover:shadow-gold-glow hover:border-gold-400 transition-all duration-300">
                  <div className={cn('absolute left-0 top-0 bottom-0 w-1', urgencySidebar[d.urgency])} />
                  <Card.Content className="pl-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="lg:w-72 flex-shrink-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag variant="seal" className="!text-[10px] !px-2 !py-0.5">#{d.id.slice(-4)}</Tag>
                            <span className={cn('text-[10px] px-2 py-0.5 rounded border font-medium', urgencyLabel[d.urgency].color)}>
                              {urgencyLabel[d.urgency].text}
                            </span>
                          </div>
                          <Badge variant={statusTabConfig.find((s) => s.key === d.status)?.variant || 'default'} dot>
                            {statusTabConfig.find((s) => s.key === d.status)?.label}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-jade-400 font-mono">订单：{d.orderId}</div>
                          <span className={cn('inline-block px-2 py-0.5 text-[10px] rounded border font-medium', disputeTypeConfig[d.type].color)}>
                            {disputeTypeConfig[d.type].label}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-rice-100 to-gold-50 flex items-center justify-center border border-gold-200 flex-shrink-0 overflow-hidden">
                            {d.artworkThumb ? (
                              <img src={d.artworkThumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-gold-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-serif text-base font-bold text-jade-800 mb-1 truncate">{d.artworkName}</h3>
                            <p className="text-xs text-jade-500 line-clamp-2 leading-relaxed">{d.reason}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-ink-gradient flex items-center justify-center">
                              <User className="w-3 h-3 text-gold-300" />
                            </div>
                            <span className="text-jade-500">{d.user.name}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gold-400" />
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-jade-500 to-jade-700 flex items-center justify-center">
                              <UserCircle className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-jade-700">{d.expert.name}</span>
                            <span className="text-[10px] px-1.5 py-px bg-gold-100 text-gold-700 rounded">{d.expert.level}</span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-52 flex-shrink-0 lg:border-l lg:border-gold-100 lg:pl-5 space-y-2">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-jade-500">
                            <Calendar className="w-3 h-3" />
                            <span>{d.createdAt}</span>
                          </div>
                          {d.currentHours > 0 && (
                            <div className={cn(
                              'flex items-center gap-1.5 font-medium',
                              d.currentHours > 72 ? 'text-cinnabar-600' : d.currentHours > 48 ? 'text-gold-600' : 'text-jade-500',
                            )}>
                              <Clock className="w-3 h-3" />
                              <span>停留 {d.currentHours}h {d.currentHours > 48 && <AlertCircle className="w-3 h-3 inline ml-0.5 animate-pulse" />}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 py-1">
                          {stageIcons.map((Icon, i) => {
                            const isActive = i + 1 <= d.stage;
                            const isCurrent = i + 1 === d.stage;
                            return (
                              <div key={i} className="flex-1 flex items-center">
                                <div className={cn(
                                  'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                                  isActive
                                    ? isCurrent
                                      ? 'bg-gold-gradient text-white border-gold-400 shadow-gold-glow'
                                      : 'bg-jade-500 text-white border-jade-500'
                                    : 'bg-rice-100 text-jade-300 border-gold-200',
                                )}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                {i < 2 && <div className={cn('h-0.5 flex-1', isActive ? 'bg-jade-300' : 'bg-gold-100')} />}
                              </div>
                            );
                          })}
                        </div>
                        <Button variant="primary" size="sm" fullWidth leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => openDetail(d)}>
                          处理仲裁
                        </Button>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="xl"
        className="!max-w-6xl"
        title={
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-serif text-xl font-bold text-jade-800">纠纷仲裁详情</h2>
              <Tag variant="seal" className="!text-[10px]">{selectedDispute?.id}</Tag>
              {selectedDispute && (
                <span className={cn('text-[10px] px-2 py-0.5 rounded border font-medium', urgencyLabel[selectedDispute.urgency].color)}>
                  {urgencyLabel[selectedDispute.urgency].text}
                </span>
              )}
            </div>
            <p className="text-xs text-jade-500">{selectedDispute?.artworkName} · 订单号：{selectedDispute?.orderId}</p>
          </div>
        }
        footer={
          stage === 1 ? (
            <>
              <Button variant="ghost" onClick={() => setShowDetailModal(false)}>暂存关闭</Button>
              <Button variant="ghost" className="!text-cinnabar-600 hover:!bg-cinnabar-50" leftIcon={<X className="w-4 h-4" />}>驳回申诉</Button>
              <Button variant="primary" leftIcon={<Check className="w-4 h-4" />} onClick={() => setStage(2)}>受理立案 → 进入举证</Button>
            </>
          ) : stage === 2 ? (
            <>
              <Button variant="ghost" onClick={() => setShowDetailModal(false)}>暂存关闭</Button>
              <Button variant="primary" leftIcon={<Gavel className="w-4 h-4" />} onClick={() => setStage(3)}>证据交换结束 → 进入仲裁</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setShowDetailModal(false)}>暂存关闭</Button>
              <Button variant="primary" leftIcon={<Gavel className="w-4 h-4" />} onClick={() => setShowConfirmPublish(true)}>公布裁决</Button>
            </>
          )
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rice-50 via-gold-50/40 to-rice-50 rounded-xl border border-gold-200">
            {stageLabels.map((label, i) => {
              const Icon = stageIcons[i];
              const isActive = i + 1 <= stage;
              const isCurrent = i + 1 === stage;
              return (
                <div key={label} className="flex-1 flex items-center">
                  <button
                    onClick={() => i + 1 <= (selectedDispute?.stage || 1) && setStage((i + 1) as ArbitrationStage)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all group',
                      isCurrent && 'bg-ink-gradient text-white shadow-gold-glow',
                      isActive && !isCurrent && 'text-jade-700 hover:bg-jade-50',
                      !isActive && 'text-jade-300 cursor-not-allowed',
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                      isCurrent ? 'border-white/50' : isActive ? 'border-jade-500 bg-jade-50 text-jade-600' : 'border-gold-200 bg-rice-100',
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs opacity-70">阶段 {i + 1}</div>
                      <div className="text-sm font-bold">{label}</div>
                    </div>
                  </button>
                  {i < 2 && (
                    <div className={cn('h-0.5 flex-1 mx-2', isActive ? 'bg-jade-300' : 'bg-gold-200')} />
                  )}
                </div>
              );
            })}
          </div>

          {stage === 1 && selectedDispute && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <Card>
                  <Card.Header className="!pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-ink-gradient flex items-center justify-center">
                        <User className="w-4 h-4 text-gold-300" />
                      </div>
                      <div>
                        <Card.Title className="!text-base">申诉方：{selectedDispute.user.name}</Card.Title>
                        <Card.Description className="!text-xs">申诉内容</Card.Description>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-sm text-jade-700 leading-relaxed mb-4 bg-rice-50/70 rounded-lg p-3 border border-gold-100">
                      {selectedDispute.reason}
                    </p>
                    <div className="text-xs text-jade-500 mb-2 font-medium flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> 用户举证材料（{selectedDispute.userEvidence.length}份）
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedDispute.userEvidence.map((ev) => (
                        <motion.div
                          key={ev.id}
                          whileHover={{ scale: 1.05 }}
                          className="aspect-square rounded-lg border-2 border-dashed border-gold-200 bg-gradient-to-br from-rice-50 to-gold-50/30 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-gold-400 transition-colors group"
                        >
                          {ev.type === 'image' ? (
                            <ImageIcon className="w-6 h-6 text-jade-400 group-hover:text-gold-500 transition-colors" />
                          ) : (
                            <FileText className="w-6 h-6 text-cinnabar-400 group-hover:text-gold-500 transition-colors" />
                          )}
                          <p className="text-[10px] text-jade-500 mt-1 text-center truncate w-full">{ev.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header className="!pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jade-500 to-jade-700 flex items-center justify-center">
                        <UserCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <Card.Title className="!text-base">被诉方：{selectedDispute.expert.name}</Card.Title>
                        <Card.Description className="!text-xs">{selectedDispute.expert.level}专家 · 回应内容</Card.Description>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    {selectedDispute.expertEvidence.length > 0 ? (
                      <>
                        <p className="text-sm text-jade-700 leading-relaxed mb-4 bg-jade-50/50 rounded-lg p-3 border border-jade-100">
                          专家已提交书面回应与佐证材料，详见下方举证列表。
                        </p>
                        <div className="text-xs text-jade-500 mb-2 font-medium flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> 专家举证材料（{selectedDispute.expertEvidence.length}份）
                        </div>
                        <div className="space-y-1.5">
                          {selectedDispute.expertEvidence.map((ev) => (
                            <div key={ev.id} className="flex items-center gap-2 px-3 py-2 bg-rice-50 rounded-md border border-gold-100 hover:border-gold-300 cursor-pointer group transition-colors">
                              <FileText className="w-4 h-4 text-jade-400 group-hover:text-gold-500" />
                              <span className="text-xs text-jade-700 flex-1 truncate">{ev.name}</span>
                              <span className="text-[10px] text-jade-400">{ev.time.slice(5)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gold-200 rounded-lg">
                        <Clock className="w-10 h-10 text-gold-300 mx-auto mb-2" />
                        <p className="text-sm text-jade-400">等待专家回应中...</p>
                      </div>
                    )}
                  </Card.Content>
                </Card>
              </div>

              <Card>
                <Card.Header className="!pb-3">
                  <Card.Title className="!text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gold-500" />
                    平台受理意见
                  </Card.Title>
                  <Card.Description className="!text-xs">填写受理意见，将展示给双方当事人</Card.Description>
                </Card.Header>
                <Card.Content>
                  <textarea
                    rows={3}
                    className="input-field resize-none text-sm"
                    placeholder="请填写平台初步受理意见，如：经初步审核，该申诉材料齐全，符合受理条件，决定予以立案。"
                    value={platformOpinion}
                    onChange={(e) => setPlatformOpinion(e.target.value)}
                  />
                </Card.Content>
              </Card>
            </div>
          )}

          {stage === 2 && selectedDispute && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <Card>
                  <Card.Header className="!pb-3">
                    <div className="flex items-center justify-between">
                      <Card.Title className="!text-base flex items-center gap-2">
                        <div className="w-2 h-6 bg-ink-gradient rounded-full" />
                        用户补充证据
                      </Card.Title>
                      <Badge variant="info">{(selectedDispute.userSupplement || []).length} 份新材料</Badge>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                      {(selectedDispute.userSupplement || []).length === 0 ? (
                        <div className="text-center py-6 text-jade-400 text-sm">用户未补充新证据</div>
                      ) : (
                        (selectedDispute.userSupplement || []).map((ev, i) => (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-3 bg-gradient-to-r from-rice-50 to-transparent rounded-lg border-l-2 border-gold-400"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-jade-700 flex items-center gap-1.5">
                                {ev.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-gold-500" /> : <FileText className="w-3.5 h-3.5 text-cinnabar-500" />}
                                {ev.name}
                              </span>
                              <span className="text-[10px] text-jade-400">{ev.time}</span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header className="!pb-3">
                    <div className="flex items-center justify-between">
                      <Card.Title className="!text-base flex items-center gap-2">
                        <div className="w-2 h-6 bg-jade-500 rounded-full" />
                        专家辩护材料
                      </Card.Title>
                      <Badge variant="success">{(selectedDispute.expertDefense || []).length} 份</Badge>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                      {(selectedDispute.expertDefense || []).length === 0 ? (
                        <div className="text-center py-6 text-jade-400 text-sm">专家未提交辩护材料</div>
                      ) : (
                        (selectedDispute.expertDefense || []).map((ev, i) => (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-3 bg-gradient-to-l from-jade-50/50 to-transparent rounded-lg border-r-2 border-jade-400"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-jade-700 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-jade-500" />
                                {ev.name}
                              </span>
                              <span className="text-[10px] text-jade-400">{ev.time}</span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </div>

              <Card>
                <Card.Header className="!pb-3">
                  <div className="flex items-center justify-between">
                    <Card.Title className="!text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gold-500" />
                      平台提问 Q&A
                    </Card.Title>
                    <Badge variant="default">{qaList.length} 条</Badge>
                  </div>
                </Card.Header>
                <Card.Content className="space-y-4">
                  {qaList.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                      {qaList.map((q, i) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="p-4 bg-rice-50 rounded-xl border border-gold-100"
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <div className="w-6 h-6 rounded bg-gold-gradient text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">Q</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-jade-700">{q.question}</span>
                                <Badge variant="info" className="!text-[9px] !py-0">
                                  提问：{q.to === 'both' ? '双方' : q.to === 'user' ? '用户' : '专家'}
                                </Badge>
                                <span className="text-[10px] text-jade-400 ml-auto">{q.time}</span>
                              </div>
                            </div>
                          </div>
                          {(q.userAnswer || q.expertAnswer) && (
                            <div className="ml-8 space-y-2">
                              {q.userAnswer && (
                                <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-gold-100">
                                  <span className="w-5 h-5 rounded bg-ink-gradient text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">U</span>
                                  <p className="text-xs text-jade-600">{q.userAnswer}</p>
                                </div>
                              )}
                              {q.expertAnswer && (
                                <div className="flex items-start gap-2 p-2 bg-jade-50/50 rounded-lg border border-jade-100">
                                  <span className="w-5 h-5 rounded bg-jade-500 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">E</span>
                                  <p className="text-xs text-jade-600">{q.expertAnswer}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {!q.userAnswer && !q.expertAnswer && (q.to === 'user' || q.to === 'both') && (
                            <div className="ml-8 text-[10px] text-gold-600 bg-gold-50 px-2 py-1 rounded inline-block animate-pulse">等待用户回复...</div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-gold-100">
                    <div className="flex gap-2">
                      <div className="w-24 flex-shrink-0">
                        <select
                          value={newQA.to}
                          onChange={(e) => setNewQA({ ...newQA, to: e.target.value as 'user' | 'expert' | 'both' })}
                          className="input-field text-xs h-full"
                        >
                          <option value="both">向双方</option>
                          <option value="user">向用户</option>
                          <option value="expert">向专家</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="输入向双方或单方提出的问题..."
                          value={newQA.question}
                          onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQA())}
                        />
                      </div>
                      <Button variant="secondary" onClick={addQA}>发送提问</Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {stage === 3 && selectedDispute && (
            <div className="space-y-5">
              {selectedDispute.arbitrators && (
                <Card>
                  <Card.Header className="!pb-3">
                    <Card.Title className="!text-base flex items-center gap-2">
                      <Scale className="w-4 h-4 text-cinnabar-500" />
                      仲裁庭组成
                    </Card.Title>
                    <Card.Description className="!text-xs">3位仲裁员共同审议，1人担任首席</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedDispute.arbitrators.map((a) => (
                        <div
                          key={a.id}
                          className={cn(
                            'p-4 rounded-xl border-2 text-center transition-all',
                            a.isChief
                              ? 'bg-gradient-to-br from-gold-50 to-rice-50 border-gold-400 shadow-gold-glow relative'
                              : 'bg-rice-50 border-gold-200 hover:border-gold-300',
                          )}
                        >
                          {a.isChief && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <span className="px-2 py-0.5 bg-gold-gradient text-white text-[10px] rounded-full font-bold shadow">首席仲裁员</span>
                            </div>
                          )}
                          <div className={cn(
                            'w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center border-2',
                            a.isChief ? 'bg-ink-gradient border-gold-400' : 'bg-jade-500 border-jade-400',
                          )}>
                            {a.avatar ? (
                              <img src={a.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-7 h-7 text-white" />
                            )}
                          </div>
                          <div className="font-serif font-bold text-jade-800">{a.name}</div>
                          <div className="text-[11px] text-jade-500 mt-0.5">{a.title}</div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </Card>
              )}

              <Card>
                <Card.Header className="!pb-3">
                  <Card.Title className="!text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-500" />
                    证据材料回顾
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {([
                      { key: 'report', label: '鉴定报告', icon: FileText },
                      { key: 'compare', label: '样品对比图', icon: ImageIcon },
                      { key: 'qualification', label: '专家资质', icon: Award },
                      { key: 'chat', label: '对话记录', icon: MessageSquare },
                    ] as const).map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setEvidenceTab(t.key)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-1.5',
                            evidenceTab === t.key
                              ? 'bg-ink-gradient text-white border-gold-400 shadow-gold-glow'
                              : 'bg-rice-50 text-jade-600 border-gold-200 hover:border-gold-300',
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-rice-100 via-gold-50/30 to-rice-100 rounded-xl border-2 border-dashed border-gold-200 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gold-400 mx-auto mb-2" />
                      <p className="font-serif text-sm text-jade-700">【{evidenceTab === 'report' ? '鉴定报告原图' : evidenceTab === 'compare' ? '样品对比图' : evidenceTab === 'qualification' ? '专家资质证书' : '双方对话记录'}】</p>
                      <p className="text-xs text-jade-400 mt-1">点击上方标签切换查看不同证据材料</p>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <div className="grid md:grid-cols-5 gap-5">
                <Card className="md:col-span-3">
                  <Card.Header className="!pb-3">
                    <Card.Title className="!text-base flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-cinnabar-500" />
                      裁决结果
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="space-y-5">
                    <div>
                      <label className="label-field">裁决类型 *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {rulingTypeOptions.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => setRuling({ ...ruling, type: opt.key })}
                              className={cn(
                                'p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2',
                                ruling.type === opt.key
                                  ? `${opt.color} border-current shadow-md ring-2 ring-offset-2 ring-gold-200`
                                  : 'bg-rice-50 text-jade-400 border-gold-200 hover:border-gold-300 hover:text-jade-600',
                              )}
                            >
                              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-sm font-bold">{opt.label}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="label-field flex items-center justify-between">
                        <span>退款比例</span>
                        <span className="font-mono font-bold text-jade-800 text-lg">{ruling.refundRatio}%</span>
                      </label>
                      <div className="relative pt-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={ruling.refundRatio}
                          onChange={(e) => setRuling({ ...ruling, refundRatio: Number(e.target.value) })}
                          className="w-full h-2 bg-gold-100 rounded-full appearance-none cursor-pointer accent-gold-500"
                        />
                        <div className="flex justify-between text-[10px] text-jade-400 mt-1">
                          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="label-field">专家处罚</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {penaltyOptions.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => setRuling({ ...ruling, penalty: p.key })}
                            className={cn(
                              'px-2 py-2 rounded-lg text-[11px] font-medium border transition-all text-center',
                              ruling.penalty === p.key
                                ? 'bg-cinnabar-50 text-cinnabar-700 border-cinnabar-300 shadow-sm'
                                : 'bg-rice-50 text-jade-500 border-gold-200 hover:border-gold-300',
                            )}
                            title={p.desc}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-jade-400 mt-1.5">
                        {penaltyOptions.find((p) => p.key === ruling.penalty)?.desc}
                      </p>
                    </div>

                    <div>
                      <label className="label-field">裁决理由 *</label>
                      <textarea
                        rows={4}
                        className="input-field resize-none text-sm"
                        placeholder="详细陈述裁决理由，做到有理有据，让双方信服..."
                        value={ruling.reason}
                        onChange={(e) => setRuling({ ...ruling, reason: e.target.value })}
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-jade-400">快速模板：</span>
                        {rulingTemplates.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setRuling({ ...ruling, reason: t })}
                            className="px-2 py-1 text-[10px] bg-rice-100 text-jade-600 rounded hover:bg-gold-50 hover:text-gold-700 border border-gold-200 transition-colors"
                          >
                            模板{i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                <Card className="md:col-span-2">
                  <Card.Header className="!pb-3">
                    <Card.Title className="!text-base flex items-center gap-2">
                      <History className="w-4 h-4 text-gold-500" />
                      裁决历史参考
                    </Card.Title>
                    <Card.Description className="!text-xs">过往10个相似案例</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
                      {(selectedDispute.pastReference || []).map((ref, i) => (
                        <motion.div
                          key={ref.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="p-3 bg-gradient-to-r from-rice-50 to-transparent rounded-xl border border-gold-100 hover:border-gold-300 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-jade-400 font-mono">{ref.date}</span>
                            <Badge variant="default" className="!text-[9px] !py-0 !px-1.5">{ref.type}</Badge>
                          </div>
                          <div className="text-xs font-semibold text-jade-700 mb-2 group-hover:text-gold-600 transition-colors">{ref.result}</div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1" title="用户满意度">
                                <ThumbsUp className="w-3 h-3 text-jade-500" />
                                <div className="w-14 h-1.5 bg-rice-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-jade-500 rounded-full" style={{ width: `${ref.userSatisfaction}%` }} />
                                </div>
                                <span className="text-[9px] text-jade-500 font-medium tabular-nums">{ref.userSatisfaction}</span>
                              </div>
                              <div className="flex items-center gap-1" title="专家满意度">
                                <Award className="w-3 h-3 text-gold-500" />
                                <div className="w-14 h-1.5 bg-rice-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-gold-500 rounded-full" style={{ width: `${ref.expertSatisfaction}%` }} />
                                </div>
                                <span className="text-[9px] text-gold-600 font-medium tabular-nums">{ref.expertSatisfaction}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-jade-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </motion.div>
                      ))}
                      {(selectedDispute.pastReference || []).length === 0 && (
                        <div className="text-center py-8 text-jade-400 text-sm">
                          <History className="w-10 h-10 mx-auto mb-2 text-gold-300" />
                          暂无历史参考案例
                        </div>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showConfirmPublish}
        onClose={() => setShowConfirmPublish(false)}
        title="确认公布裁决结果"
        description="此操作将通知双方当事人，裁决结果不可撤销"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowConfirmPublish(false)}>返回修改</Button>
            <Button variant="primary" leftIcon={<Gavel className="w-4 h-4" />} onClick={() => { setShowConfirmPublish(false); setShowDetailModal(false); }}>
              双方无异议，确认公布
            </Button>
          </>
        }
      >
        {selectedDispute && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <Card.Content className="!p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-ink-gradient flex items-center justify-center">
                    <User className="w-6 h-6 text-gold-300" />
                  </div>
                  <div className="font-serif font-bold text-jade-800 mb-1">{selectedDispute.user.name}</div>
                  <div className="text-xs text-jade-500 mb-2">申诉方</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-jade-50 text-jade-700 border border-jade-200 text-xs">
                    {ruling.refundRatio > 0 ? (
                      <><ThumbsUp className="w-3 h-3" /> 退款 ¥{Math.round(ruling.refundRatio * 15.8)}</>
                    ) : (
                      <><ThumbsDown className="w-3 h-3" /> 诉求不支持</>
                    )}
                  </div>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="!p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-jade-500 to-jade-700 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-serif font-bold text-jade-800 mb-1">{selectedDispute.expert.name}</div>
                  <div className="text-xs text-jade-500 mb-2">被诉方 · {selectedDispute.expert.level}</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cinnabar-50 text-cinnabar-700 border border-cinnabar-200 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {penaltyOptions.find(p => p.key === ruling.penalty)?.label || '无处罚'}
                  </div>
                </Card.Content>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-gold-50/50 via-rice-50 to-gold-50/50 border-gold-300">
              <Card.Content className="!p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="success" dot>
                    {rulingTypeOptions.find(r => r.key === ruling.type)?.label}
                  </Badge>
                  <span className="text-xs text-jade-400">退款比例：<strong className="text-jade-700 tabular-nums">{ruling.refundRatio}%</strong></span>
                </div>
                <div className="pt-3 border-t border-gold-200">
                  <p className="text-xs text-jade-500 mb-1.5 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> 仲裁庭裁决理由
                  </p>
                  <p className="text-sm text-jade-700 leading-relaxed bg-white/60 rounded-lg p-3 border border-gold-100">
                    {ruling.reason || '（未填写裁决理由）'}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gold-200">
                  <div className="flex -space-x-2">
                    {(selectedDispute.arbitrators || []).map(a => (
                      <div key={a.id} className={cn(
                        'w-8 h-8 rounded-full border-2 border-rice-50 flex items-center justify-center',
                        a.isChief ? 'bg-gold-gradient' : 'bg-jade-500'
                      )}>
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-jade-500">
                    {(selectedDispute.arbitrators || []).length}位仲裁员共同审议
                  </span>
                  <Star className="w-3 h-3 text-gold-400 ml-auto fill-current" />
                  <span className="text-xs font-bold text-gold-700">裁决结果已公证存证</span>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

