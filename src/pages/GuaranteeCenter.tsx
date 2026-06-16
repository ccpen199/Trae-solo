import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Star, Clock, Scale, FileCheck, Wallet, ArrowRight, CheckCircle,
  AlertTriangle, Users, Zap, Award, Headphones, ThumbsUp, ThumbsDown,
  MapPin, Phone, FileText, User, BadgeCheck, Home, Stethoscope,
  TrendingUp, AlertCircle, CheckSquare, ChevronDown, MessageSquare,
  Receipt, PiggyBank, Landmark, Eye, UserCheck, Search, FileText as FileTextIcon,
  Gavel, Calculator, StarHalf, ShieldCheck, Download, Building2, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const guaranteeSections = [
  {
    id: 'credit',
    tabId: 'reviews',
    icon: Star,
    title: '双向信用评价体系',
    desc: '基于真实交易的评价机制，建立可信的技能服务生态',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    features: [
      '交易完成后双方互评，评价公开透明',
      '累计信用等级，影响订单匹配优先级',
      '虚假评价自动识别并删除',
      '恶意差评可申诉，平台人工复核',
    ],
  },
  {
    id: 'trace',
    tabId: 'trace',
    icon: Clock,
    title: '服务过程留痕',
    desc: '全流程记录可追溯，保障双方权益',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    features: [
      '订单状态实时更新，时间线清晰展示',
      '沟通记录云端存储，随时可查',
      '服务签到/签出，精确计算服务时长',
      '文件上传留痕，成果物可追溯',
    ],
  },
  {
    id: 'arbitration',
    tabId: 'disputes',
    icon: Scale,
    title: '争议仲裁机制',
    desc: '专业仲裁团队介入，公平公正处理纠纷',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    features: [
      '24小时内响应，快速介入处理',
      '基于服务留痕记录客观判定',
      '支持双方举证，充分听取陈述',
      '仲裁结果可申诉，二次复核机制',
    ],
  },
  {
    id: 'insurance',
    tabId: 'insurance',
    icon: Shield,
    title: '家政投保保障',
    desc: '家政类服务强制投保，全方位保障服务安全',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    features: [
      '家政类服务自动投保服务责任险',
      '保障额度最高50万元',
      '出险快速理赔通道',
      '可选升级保障方案',
    ],
  },
  {
    id: 'settlement',
    tabId: 'settlement',
    icon: Wallet,
    title: '资金分账结算',
    desc: '平台资金托管，服务完成后自动分账',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    features: [
      '定金由平台托管，服务完成后结算',
      '平台收取15%服务费，明码标价',
      '支持税务代缴，合规结算',
      'T+1提现到账，资金安全有保障',
    ],
  },
  {
    id: 'review',
    tabId: 'reviews',
    icon: FileCheck,
    title: '保险保障体系',
    desc: '严格的内容审核机制，保障平台生态健康',
    color: 'from-primary-400 to-primary-600',
    bgColor: 'bg-primary-50',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    features: [
      'AI智能初审 + 人工复审双审核',
      '敏感内容实时拦截',
      '违规内容举报通道',
      '创作者资质认证审核',
    ],
  },
];

const processSteps = [
  { step: 1, title: '发布需求/课程', desc: '需求方发布定制需求或创作者发布课程', icon: FileCheck },
  { step: 2, title: '匹配合约', desc: '系统智能匹配或双方自主选择达成合作', icon: Users },
  { step: 3, title: '支付定金', desc: '定金支付至平台托管账户，锁定服务', icon: Wallet },
  { step: 4, title: '服务履约', desc: '按约定提供服务，全程留痕记录', icon: Zap },
  { step: 5, title: '验收评价', desc: '服务完成后双方验收并互评', icon: Star },
  { step: 6, title: '资金结算', desc: '平台扣除服务费后结算给创作者', icon: Award },
];

const reviewSamples = [
  {
    id: 'r1',
    orderNo: 'ORD202406010001',
    service: '爵士舞私教课程',
    fromUser: '学生小李',
    toUser: '林舞蹈家',
    rating: 5,
    content: '老师非常专业，讲解细致，零基础也能跟上节奏。强烈推荐！',
    tags: ['教学专业', '耐心细致', '环境舒适'],
    date: '2024-06-10',
    reply: '感谢您的认可，期待下次继续学习~',
  },
  {
    id: 'r2',
    orderNo: 'ORD202405280015',
    service: '家政保洁服务',
    fromUser: '业主张女士',
    toUser: '保洁阿姨王姐',
    rating: 5,
    content: '打扫得非常干净，角角落落都照顾到了，准时上门态度好。',
    tags: ['干净整洁', '准时上门', '态度友好'],
    date: '2024-06-08',
    reply: null,
  },
  {
    id: 'r3',
    orderNo: 'ORD202405200032',
    service: '吉他入门教学',
    fromUser: '学员小明',
    toUser: '吉他手阿杰',
    rating: 4,
    content: '整体还不错，就是进度有点快，希望能多些基础练习。',
    tags: ['教学专业'],
    date: '2024-06-05',
    reply: '收到您的反馈啦，后续会调整节奏，多增加基础练习~',
  },
];

const serviceTraceSteps = [
  { time: '2024-06-01 09:00', title: '需求发布', desc: '需求方发布"上门爵士舞基础"定制需求，预算¥500/次', icon: FileText, status: 'done' },
  { time: '2024-06-01 14:30', title: '创作者接单', desc: '林舞蹈家接单并发起邀约，服务时间6月5日10:00', icon: User, status: 'done' },
  { time: '2024-06-01 16:00', title: '需求方确认', desc: '需求方确认接单并支付定金¥200至平台托管', icon: Wallet, status: 'done' },
  { time: '2024-06-05 09:55', title: '服务签到', desc: '林舞蹈家到达服务地址并签到（朝阳区xxx小区）', icon: MapPin, status: 'done' },
  { time: '2024-06-05 11:00', title: '服务中', desc: '服务进行中，已完成3个基础动作教学', icon: Zap, status: 'done' },
  { time: '2024-06-05 12:05', title: '服务完成', desc: '服务结束并签退，实际时长2小时10分钟', icon: CheckCircle, status: 'done' },
  { time: '2024-06-05 18:30', title: '双方评价', desc: '双方完成互评，均为5星好评', icon: Star, status: 'done' },
  { time: '2024-06-06 10:00', title: '资金结算', desc: '平台扣除15%服务费后，¥425结算至创作者账户', icon: PiggyBank, status: 'current' },
];

const disputeCases = [
  {
    id: 'd1',
    orderNo: 'ORD202405150008',
    title: '服务时长争议',
    type: '服务时长不足',
    status: 'processing',
    submitTime: '2024-06-02 10:30',
    progress: 60,
    currentStep: '平台审核中',
    nextStep: '预计24小时内给出判定结果',
    applicant: '需求方',
  },
  {
    id: 'd2',
    orderNo: 'ORD202405100023',
    title: '服务质量不符',
    type: '质量问题',
    status: 'resolved',
    submitTime: '2024-05-28 15:00',
    progress: 100,
    currentStep: '已完成',
    nextStep: '双方接受判定结果，退款30%',
    applicant: '需求方',
  },
  {
    id: 'd3',
    orderNo: 'ORD202405050011',
    title: '创作者爽约',
    type: '违约',
    status: 'resolved',
    submitTime: '2024-05-12 09:00',
    progress: 100,
    currentStep: '已完成',
    nextStep: '判定创作者违约，双倍退还定金',
    applicant: '需求方',
  },
];

const insuranceRecords = [
  {
    id: 'i1',
    policyNo: 'PICC20240601000001',
    receiptNo: 'RC20240601000001',
    orderNo: 'ORD202406010002',
    type: '家政服务责任险',
    amount: 500000,
    premium: 12,
    status: 'active',
    startDate: '2024-06-05',
    endDate: '2024-07-05',
    service: '深度保洁服务',
    provider: '中国人民财产保险',
    period: '服务开始前 2 小时至服务结束后 30 天',
    range: ['第三者财产损失', '服务人员意外伤害', '家政服务过失责任', '盗抢损失保障'],
    docking: [
      { step: 1, title: '平台发起投保', status: 'done', time: '2024-06-01 09:30:15' },
      { step: 2, title: '保险公司承保', status: 'done', time: '2024-06-01 09:32:08', policyNo: 'PICC20240601000001' },
      { step: 3, title: '保单生效', status: 'done', time: '2024-06-01 09:35:00' },
    ],
  },
  {
    id: 'i2',
    policyNo: 'PICC20240528000015',
    receiptNo: 'RC20240528000015',
    orderNo: 'ORD202405280015',
    type: '家政服务责任险',
    amount: 500000,
    premium: 12,
    status: 'expired',
    startDate: '2024-05-30',
    endDate: '2024-06-29',
    service: '日常保洁服务',
    provider: '中国人民财产保险',
    period: '服务开始前 2 小时至服务结束后 30 天',
    range: ['第三者财产损失', '服务人员意外伤害', '家政服务过失责任', '盗抢损失保障'],
    docking: [
      { step: 1, title: '平台发起投保', status: 'done', time: '2024-05-28 14:20:33' },
      { step: 2, title: '保险公司承保', status: 'done', time: '2024-05-28 14:22:15', policyNo: 'PICC20240528000015' },
      { step: 3, title: '保单生效', status: 'done', time: '2024-05-28 14:25:00' },
    ],
  },
  {
    id: 'i3',
    policyNo: 'PICC2024052000032',
    receiptNo: 'RC2024052000032',
    orderNo: 'ORD202405200032',
    type: '家政服务责任险',
    amount: 500000,
    premium: 12,
    status: 'claimed',
    startDate: '2024-05-22',
    endDate: '2024-06-21',
    service: '家电清洗服务',
    provider: '中国人民财产保险',
    period: '服务开始前 2 小时至服务结束后 30 天',
    range: ['第三者财产损失', '服务人员意外伤害', '家政服务过失责任', '盗抢损失保障'],
    claimDesc: '清洁过程中损坏油烟机滤网，已理赔¥380',
    claimProgress: [
      { step: 1, title: '提交理赔申请', status: 'done', time: '2024-05-23 10:15:00', desc: '用户上传损坏照片及维修报价' },
      { step: 2, title: '保险公司审核', status: 'done', time: '2024-05-23 14:30:00', desc: '材料核验通过，理赔金额确认' },
      { step: 3, title: '理赔到账', status: 'done', time: '2024-05-24 09:00:00', desc: '¥380 已赔付至用户账户' },
    ],
    docking: [
      { step: 1, title: '平台发起投保', status: 'done', time: '2024-05-20 16:45:22' },
      { step: 2, title: '保险公司承保', status: 'done', time: '2024-05-20 16:47:11', policyNo: 'PICC2024052000032' },
      { step: 3, title: '保单生效', status: 'done', time: '2024-05-20 16:50:00' },
    ],
  },
];

const settlementRecords = [
  {
    id: 's1',
    orderNo: 'ORD202406010001',
    service: '爵士舞私教课程',
    creator: '林舞蹈家',
    orderAmount: 500,
    platformFee: 75,
    creatorIncome: 425,
    status: 'settled',
    settleTime: '2024-06-06 10:00',
    txnId: 'TXN2024060600001',
  },
  {
    id: 's2',
    orderNo: 'ORD202405280015',
    service: '家政保洁服务',
    creator: '保洁阿姨王姐',
    orderAmount: 200,
    platformFee: 30,
    creatorIncome: 170,
    status: 'settled',
    settleTime: '2024-05-29 09:30',
    txnId: 'TXN2024052900023',
  },
  {
    id: 's3',
    orderNo: 'ORD202405200032',
    service: '吉他入门教学',
    creator: '吉他手阿杰',
    orderAmount: 300,
    platformFee: 45,
    creatorIncome: 255,
    status: 'pending',
    settleTime: '预计2024-06-15',
    txnId: 'TXN2024061500045',
  },
  {
    id: 's4',
    orderNo: 'ORD202405150008',
    service: '瑜伽私教课程',
    creator: '瑜伽导师Lily',
    orderAmount: 350,
    platformFee: 52.5,
    creatorIncome: 297.5,
    status: 'frozen',
    settleTime: '争议处理中，资金冻结',
    txnId: 'TXN2024061500056',
  },
];

const businessViewTabs = [
  { id: 'reviews', label: '信用评价明细', icon: Star, color: 'text-amber-500' },
  { id: 'trace', label: '服务过程留痕', icon: Clock, color: 'text-blue-500' },
  { id: 'disputes', label: '争议仲裁进度', icon: Scale, color: 'text-red-500' },
  { id: 'insurance', label: '家政投保记录', icon: Shield, color: 'text-green-500' },
  { id: 'settlement', label: '资金分账结算', icon: Wallet, color: 'text-purple-500' },
];

const faqItems = [
  {
    q: '如何申请争议仲裁？',
    a: '在订单详情页点击"申请仲裁"按钮，选择争议原因并详细描述情况。平台将在24小时内介入，根据服务留痕记录进行判定。',
  },
  {
    q: '评价可以修改或删除吗？',
    a: '评价提交后不可修改，但如果对方存在恶意评价行为，您可以发起申诉，平台审核后可删除不当评价。',
  },
  {
    q: '家政类保险是强制的吗？',
    a: '是的，家政类服务（如保洁、育儿、护理等）系统会自动投保服务责任险，保障服务过程中的人身和财产安全。',
  },
  {
    q: '资金什么时候结算给创作者？',
    a: '服务完成并经需求方确认后，平台将在T+1个工作日内完成结算。如有争议，资金将冻结至争议解决。',
  },
  {
    q: '平台服务费是多少？',
    a: '平台收取订单金额的15%作为服务费，包含技术支持、客服保障、资金托管、交易担保等服务。',
  },
  {
    q: '创作者如何提现？',
    a: '创作者可在工作台-收益页面申请提现，支持银行卡和支付宝提现，提现金额最低100元，T+1到账。',
  },
];

export default function GuaranteeCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('credit');
  const [activeBusinessTab, setActiveBusinessTab] = useState('reviews');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showPolicyDetailModal, setShowPolicyDetailModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimPolicy, setSelectedClaimPolicy] = useState<any>(null);
  const businessSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['reviews', 'trace', 'disputes', 'insurance', 'settlement'].includes(tab)) {
      setActiveBusinessTab(tab);
      setTimeout(() => {
        businessSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.search]);

  const handleSectionClick = (section: any) => {
    setActiveSection(section.id);
    if (section.tabId) {
      setActiveBusinessTab(section.tabId);
      businessSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const quickEntries = [
    { icon: Shield, label: '我的保单', tab: 'insurance', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Gavel, label: '待处理仲裁', tab: 'disputes', color: 'text-red-600', bg: 'bg-red-50' },
    { icon: Calculator, label: '结算记录', tab: 'settlement', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: StarHalf, label: '评价管理', tab: 'reviews', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              平台保障中心
            </h1>
            <p className="text-xl text-white/80 mb-8">
              六大保障体系，让技能交易更安心
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {['信用评价', '服务留痕', '争议仲裁', '保险保障', '资金托管', '合规审核'].map((item, i) => (
                <div
                  key={i}
                  className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  {item}
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="搜索保单号、订单号、仲裁记录..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/95 backdrop-blur rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {quickEntries.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveBusinessTab(entry.tab);
                    businessSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-5 py-2.5 bg-white/15 backdrop-blur hover:bg-white/25 rounded-xl text-sm text-white flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  <entry.icon className="w-4 h-4" />
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guaranteeSections.map((section, index) => (
              <div
                key={section.id}
                className={`card p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 group ${
                  activeSection === section.id ? 'ring-2 ring-primary-500' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleSectionClick(section)}
              >
                <div className={`w-12 h-12 rounded-2xl ${section.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">{section.title}</h3>
                <p className="text-zinc-500 mb-4">{section.desc}</p>
                <ul className="space-y-2 mb-5">
                  {section.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
                  <span className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    立即查看
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={businessSectionRef} className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <BadgeCheck className="w-10 h-10 text-primary-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-zinc-900 mb-3">业务追踪视图</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              全流程透明可追溯，每一笔交易都有完整记录
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-6 bg-zinc-100 p-1.5 rounded-2xl">
              {businessViewTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveBusinessTab(tab.id)}
                  className={cn(
                    'flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                    activeBusinessTab === tab.id
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  )}
                >
                  <tab.icon className={cn('w-4 h-4', tab.color)} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {activeBusinessTab === 'reviews' && (
                <div className="space-y-4">
                  {reviewSamples.map((review, index) => (
                    <div key={review.id} className="card p-5 animate-fade-in-up group hover:shadow-md transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                            {review.fromUser.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900">{review.fromUser}</div>
                            <div className="text-xs text-zinc-400 flex items-center gap-2">
                              <span>订单: {review.orderNo}</span>
                              <span>·</span>
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-zinc-600 mb-3">{review.content}</div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {review.reply && (
                        <div className="pl-4 border-l-2 border-primary-200 bg-primary-50/50 p-3 rounded-r-xl mb-4">
                          <div className="text-xs text-primary-600 font-medium mb-1 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {review.toUser} 回复
                          </div>
                          <p className="text-sm text-zinc-600">{review.reply}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
                        <button
                          onClick={() => navigate(`/orders/${review.orderNo}`)}
                          className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          查看详情
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
                      查看全部
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeBusinessTab === 'trace' && (
                <div className="space-y-4">
                  {[
                    { orderNo: 'ORD202406010001', service: '上门爵士舞基础 · 2课时', status: 'completed', statusText: '服务完成' },
                    { orderNo: 'ORD202405280015', service: '家政保洁服务 · 日常保洁', status: 'completed', statusText: '服务完成' },
                    { orderNo: 'ORD202405200032', service: '吉他入门教学 · 1对1', status: 'in_progress', statusText: '服务进行中' },
                  ].map((order, orderIndex) => (
                    <div key={order.orderNo} className="card p-5 animate-fade-in-up group hover:shadow-md transition-all" style={{ animationDelay: `${orderIndex * 0.1}s` }}>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-semibold text-zinc-900">订单: {order.orderNo}</h3>
                          <p className="text-sm text-zinc-500">{order.service}</p>
                        </div>
                        <span className={cn(
                          'px-3 py-1 text-xs rounded-full font-medium',
                          order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        )}>
                          {order.statusText}
                        </span>
                      </div>
                      <div className="relative mb-4">
                        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-zinc-200" />
                        <div className="space-y-4">
                          {serviceTraceSteps.slice(0, 4).map((step, index) => (
                            <div key={index} className="relative flex gap-4">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0',
                                step.status === 'done' || step.status === 'current' ? 'bg-green-500 text-white' :
                                'bg-zinc-200 text-zinc-500'
                              )}>
                                <step.icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 pb-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-zinc-900">{step.title}</span>
                                  <span className="text-xs text-zinc-400">{step.time}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5 truncate">{step.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
                        <button
                          onClick={() => navigate(`/orders/${order.orderNo}`)}
                          className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          查看详情
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
                      查看全部
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeBusinessTab === 'disputes' && (
                <div className="space-y-4">
                  {disputeCases.map((dispute, index) => (
                    <div key={dispute.id} className="card p-5 animate-fade-in-up group hover:shadow-md transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-zinc-900 mb-1">{dispute.title}</div>
                          <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <span>订单: {dispute.orderNo}</span>
                            <span>·</span>
                            <span>提交: {dispute.submitTime}</span>
                          </div>
                        </div>
                        <span className={cn(
                          'px-3 py-1 text-xs rounded-full font-medium',
                          dispute.status === 'processing' ? 'bg-amber-100 text-amber-600' :
                          'bg-green-100 text-green-600'
                        )}>
                          {dispute.status === 'processing' ? '处理中' : '已完成'}
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-zinc-500">仲裁进度</span>
                          <span className="text-zinc-700 font-medium">{dispute.progress}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              dispute.status === 'processing' ? 'bg-amber-500' : 'bg-green-500'
                            )}
                            style={{ width: `${dispute.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-zinc-400" />
                          <span className="text-zinc-500">当前:</span>
                          <span className="text-zinc-700">{dispute.currentStep}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-400" />
                          <span className="text-zinc-500">下一步:</span>
                          <span className="text-zinc-700 truncate">{dispute.nextStep}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
                        <button
                          onClick={() => navigate(`/orders/${dispute.orderNo}`)}
                          className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          查看详情
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
                      查看全部
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeBusinessTab === 'insurance' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">家政服务强制投保</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        所有家政/护理类服务自动投保服务责任险，最高保额 50 万元，保费由平台承担。支持升级至 100 万保额。
                      </p>
                    </div>
                  </div>
                  {insuranceRecords.map((record, index) => (
                    <div key={record.id} className="card p-5 animate-fade-in-up group hover:shadow-md transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            record.status === 'active' ? 'bg-green-100' :
                            record.status === 'claimed' ? 'bg-red-100' : 'bg-zinc-100'
                          )}>
                            <ShieldCheck className={cn(
                              'w-5 h-5',
                              record.status === 'active' ? 'text-green-600' :
                              record.status === 'claimed' ? 'text-red-600' : 'text-zinc-500'
                            )} />
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900">{record.type}</div>
                            <div className="text-xs text-zinc-400 flex items-center gap-2">
                              <span>保单号:</span>
                              <span className="font-mono text-zinc-600">{record.policyNo}</span>
                            </div>
                          </div>
                        </div>
                        <span className={cn(
                          'px-3 py-1 text-xs rounded-full font-medium',
                          record.status === 'active' ? 'bg-green-100 text-green-700' :
                          record.status === 'claimed' ? 'bg-red-100 text-red-700' :
                          'bg-zinc-100 text-zinc-500'
                        )}>
                          {record.status === 'active' ? '保障中' :
                           record.status === 'claimed' ? '已理赔' : '已过期'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div className="p-2.5 bg-zinc-50 rounded-lg">
                          <div className="text-zinc-400 text-xs mb-0.5">关联订单</div>
                          <button
                            onClick={() => navigate(`/orders/${record.orderNo}`)}
                            className="text-primary-600 font-medium hover:text-primary-700 hover:underline font-mono text-xs"
                          >
                            {record.orderNo} →
                          </button>
                        </div>
                        <div className="p-2.5 bg-zinc-50 rounded-lg">
                          <div className="text-zinc-400 text-xs mb-0.5">服务项目</div>
                          <div className="text-zinc-700 font-medium">{record.service}</div>
                        </div>
                        <div className="p-2.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                          <div className="text-green-600 text-xs mb-0.5">保障额度</div>
                          <div className="text-green-700 font-bold text-lg">¥{record.amount.toLocaleString()}</div>
                        </div>
                        <div className="p-2.5 bg-zinc-50 rounded-lg">
                          <div className="text-zinc-400 text-xs mb-0.5">保障期限</div>
                          <div className="text-zinc-700 font-medium text-xs">{record.startDate} ~ {record.endDate}</div>
                        </div>
                      </div>

                      {record.claimProgress && record.claimProgress.length > 0 && (
                        <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
                          <div className="text-xs text-red-700 font-semibold mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            理赔进度 · {record.claimDesc}
                          </div>
                          <div className="relative">
                            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-red-200" />
                            <div className="space-y-3">
                              {record.claimProgress.map((claimStep, claimIdx) => (
                                <div key={claimStep.step} className="relative flex gap-3">
                                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 z-10">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 pb-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-zinc-900">{claimStep.title}</span>
                                      <span className="text-xs text-zinc-400">{claimStep.time}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">{claimStep.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100">
                        <button
                          onClick={() => {
                            setSelectedPolicy(record);
                            setShowPolicyDetailModal(true);
                          }}
                          className="flex-1 min-w-[120px] py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-blue-100"
                        >
                          <FileText className="w-4 h-4" />
                          保单详情
                        </button>
                        {record.status === 'active' && (
                          <button
                            onClick={() => {
                              setSelectedClaimPolicy(record);
                              setShowClaimModal(true);
                            }}
                            className="flex-1 min-w-[120px] py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-orange-100"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            理赔申请
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/orders/${record.orderNo}`)}
                          className="flex-1 min-w-[120px] py-2 text-sm bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-zinc-200"
                        >
                          <ArrowRight className="w-4 h-4" />
                          订单详情
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
                      查看全部保单
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeBusinessTab === 'settlement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="card p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">¥850</div>
                      <div className="text-xs text-zinc-500">本月已结算</div>
                    </div>
                    <div className="card p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">¥297.5</div>
                      <div className="text-xs text-zinc-500">待结算</div>
                    </div>
                    <div className="card p-4 text-center">
                      <div className="text-2xl font-bold text-red-500 mb-1">1笔</div>
                      <div className="text-xs text-zinc-500">争议冻结</div>
                    </div>
                  </div>
                  {settlementRecords.map((record, index) => (
                    <div key={record.id} className="card p-5 animate-fade-in-up group hover:shadow-md transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            record.status === 'settled' ? 'bg-green-100' :
                            record.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                          )}>
                            <Receipt className={cn(
                              'w-5 h-5',
                              record.status === 'settled' ? 'text-green-600' :
                              record.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                            )} />
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900">{record.service}</div>
                            <div className="text-xs text-zinc-400">订单: {record.orderNo}</div>
                          </div>
                        </div>
                        <span className={cn(
                          'px-3 py-1 text-xs rounded-full font-medium',
                          record.status === 'settled' ? 'bg-green-100 text-green-600' :
                          record.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                          'bg-red-100 text-red-600'
                        )}>
                          {record.status === 'settled' ? '已结算' :
                           record.status === 'pending' ? '待结算' : '冻结中'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-zinc-400 text-xs mb-1">订单金额</div>
                          <div className="text-zinc-700 font-medium">¥{record.orderAmount}</div>
                        </div>
                        <div>
                          <div className="text-zinc-400 text-xs mb-1">平台服务费(15%)</div>
                          <div className="text-red-500 font-medium">-¥{record.platformFee}</div>
                        </div>
                        <div>
                          <div className="text-zinc-400 text-xs mb-1">创作者收入</div>
                          <div className="text-green-600 font-medium">¥{record.creatorIncome}</div>
                        </div>
                        <div>
                          <div className="text-zinc-400 text-xs mb-1">交易单号</div>
                          <div className="text-zinc-700 font-mono text-xs">{record.txnId}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-4">
                        <span className="text-zinc-400">
                          {record.status === 'settled' ? '结算时间' : '预计结算'}
                        </span>
                        <span className="text-zinc-600">{record.settleTime}</span>
                      </div>
                      <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
                        <button
                          onClick={() => navigate('/workspace/finance')}
                          className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          查看详情
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
                      查看全部
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mb-3">服务流程</h2>
            <p className="text-zinc-500">全流程透明化，每一步都有保障</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 -translate-y-1/2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {processSteps.map((step, index) => (
                <div key={step.step} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 relative z-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {step.step}
                    </div>
                    <h4 className="font-semibold text-zinc-900 mb-2">{step.title}</h4>
                    <p className="text-xs text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-zinc-900 mb-3">常见问题</h2>
              <p className="text-zinc-500">有疑问？看看大家都在问什么</p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl overflow-hidden border border-zinc-100 transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                  >
                    <span className="font-medium text-zinc-900">{item.q}</span>
                    <ArrowRight
                      className={`w-5 h-5 text-zinc-400 transition-transform flex-shrink-0 ${
                        expandedFaq === index ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-5 pb-5 animate-fade-in">
                      <p className="text-zinc-600 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Headphones className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-3">还有其他问题？</h2>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                我们的客服团队随时为您服务，工作日9:00-21:00在线响应
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/orders"
                  className="px-8 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                >
                  立即体验
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#"
                  className="px-8 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                >
                  联系客服
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showPolicyDetailModal && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-green-500 to-emerald-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">保单详情</h2>
                    <p className="text-sm text-green-100">{selectedPolicy?.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPolicyDetailModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <div className="text-center">
                  <div className="text-sm text-zinc-500 mb-1">累计保额</div>
                  <div className="text-4xl font-bold text-green-600">¥{selectedPolicy?.amount?.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1">人身伤害 + 财产损失 双重保障</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保单号</div>
                  <div className="font-mono text-sm font-medium text-zinc-800 break-all">{selectedPolicy?.policyNo}</div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">回执单号</div>
                  <div className="font-mono text-sm font-medium text-zinc-800 break-all">{selectedPolicy?.receiptNo}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保费</div>
                  <div className="font-semibold text-green-600">¥{selectedPolicy?.premium?.toFixed(2)} <span className="text-xs">平台承担</span></div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">关联订单</div>
                  <button
                    onClick={() => {
                      setShowPolicyDetailModal(false);
                      navigate(`/orders/${selectedPolicy?.orderNo}`);
                    }}
                    className="font-mono text-sm font-medium text-primary-600 hover:underline break-all"
                  >
                    {selectedPolicy?.orderNo} →
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-zinc-700">承保公司</span>
                </div>
                <div className="font-medium text-zinc-900">{selectedPolicy?.provider}</div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-zinc-700">保障期限</span>
                </div>
                <div className="font-medium text-sm text-zinc-900">{selectedPolicy?.period}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {selectedPolicy?.startDate} 至 {selectedPolicy?.endDate}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-700 mb-3">保障范围</div>
                <div className="space-y-2">
                  {selectedPolicy?.range?.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-sm text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-700 mb-3">投保对接流程</div>
                <div className="space-y-3">
                  {selectedPolicy?.docking?.map((step: any) => (
                    <div key={step.step} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zinc-900">{step.step}. {step.title}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{step.time}</div>
                        {step.policyNo && (
                          <div className="text-xs text-blue-600 mt-0.5 font-mono">保单号：{step.policyNo}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-3">
              <button
                onClick={() => {
                  alert('电子保单已生成，可用于理赔');
                }}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载电子保单
              </button>
              <button
                onClick={() => setShowPolicyDetailModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showClaimModal && selectedClaimPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">理赔申请</h2>
                    <p className="text-sm text-orange-100">请如实填写理赔信息</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-600">关联保单</span>
                  <span className="font-mono text-xs text-zinc-700">{selectedClaimPolicy?.policyNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">保障额度</span>
                  <span className="font-bold text-orange-600">¥{selectedClaimPolicy?.amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    理赔类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['财产损失', '人身意外', '服务过失', '盗抢损失'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="p-3 text-sm border-2 border-zinc-200 rounded-xl text-zinc-700 hover:border-orange-300 hover:bg-orange-50 transition-all"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    事故描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="请详细描述事故发生时间、经过、损失情况..."
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    预估损失金额
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">¥</span>
                    <input
                      type="number"
                      placeholder="请输入预估金额"
                      className="input-field pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    上传凭证（最多6张）
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <button
                        key={i}
                        type="button"
                        className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-orange-300 hover:bg-orange-50 flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
                      >
                        <FileTextIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs">上传凭证</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">温馨提示</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 请确保提供的信息真实准确，虚假理赔将影响您的平台信用</li>
                      <li>• 平台将在24小时内响应，协助您对接保险公司</li>
                      <li>• 如有疑问，请联系客服电话：400-xxx-xxxx</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-3">
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  alert('理赔申请已提交，平台将在24小时内联系您');
                }}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                提交理赔申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
