import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Search, Filter, Clock, ArrowUpRight, Eye, User, Building2,
  FileText, UserCheck, AlertOctagon, Shield, Scale, Gavel, BadgeCheck,
  ChevronRight, Flame, CheckCircle2, XCircle, Zap, Users, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Select, Input, DatePicker, Tag, message, Modal, Space, Rate } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const TREND_DATA = [
  { week: '5月第1周', 新增: 5, 结案: 3 },
  { week: '5月第2周', 新增: 8, 结案: 6 },
  { week: '5月第3周', 新增: 4, 结案: 5 },
  { week: '5月第4周', 新增: 7, 结案: 4 },
  { week: '6月第1周', 新增: 6, 结案: 7 },
  { week: '6月第2周', 新增: 3, 结案: 5 },
];

const TYPE_DIST = [
  { name: '增项争议', value: 12, color: '#C4623A' },
  { name: '质量问题', value: 8, color: '#8B6914' },
  { name: '工期延误', value: 6, color: '#6B8E9F' },
  { name: '退款纠纷', value: 4, color: '#9B7CC4' },
  { name: '其他', value: 3, color: '#9A9489' },
];

type DisputeStatus = 'pending' | 'mediating' | 'verdict' | 'reached' | 'escalated';
type DisputeCategory = 'extra' | 'quality' | 'delay' | 'refund' | 'other';
type DisputePriority = 'P0' | 'P1' | 'P2';

interface DisputeItem {
  id: string;
  createdAt: string;
  address: string;
  city: string;
  category: DisputeCategory;
  owner: string;
  ownerPhone: string;
  company: string;
  companyContact: string;
  status: DisputeStatus;
  handler: string;
  handlerId?: string;
  slaHours: number;
  priority: DisputePriority;
  amount?: number;
  projectStage: string;
  description: string;
}

const MOCK_DISPUTES: DisputeItem[] = [
  {
    id: 'DSP-20260612-0891',
    createdAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
    address: '朝阳区望京花园东区3-2-1801',
    city: '北京',
    category: 'quality',
    owner: '刘女士',
    ownerPhone: '138****1234',
    company: '锦华装饰',
    companyContact: '项目经理 张工',
    status: 'pending',
    handler: '—',
    slaHours: 42,
    priority: 'P1',
    amount: 18600,
    projectStage: '油漆阶段',
    description: '墙面平整度不符合约定，误差超5mm，已拍照留证',
  },
  {
    id: 'DSP-20260610-0876',
    createdAt: dayjs().subtract(2, 'day').subtract(3, 'hour').format('YYYY-MM-DD HH:mm'),
    address: '海淀区中关村南大街甲18号',
    city: '北京',
    category: 'delay',
    owner: '王先生',
    ownerPhone: '139****5678',
    company: '东易日盛',
    companyContact: '设计师 李工',
    status: 'mediating',
    handler: '张调解员',
    handlerId: 'U-20240312',
    slaHours: 24,
    priority: 'P0',
    amount: 320000,
    projectStage: '安装阶段',
    description: '原计划4月30日完工，现已延期43天，要求按合同赔付违约金',
  },
  {
    id: 'DSP-20260601-0851',
    createdAt: dayjs().subtract(11, 'day').format('YYYY-MM-DD HH:mm'),
    address: '丰台区丽泽SOHO A座2305',
    city: '北京',
    category: 'extra',
    owner: '陈先生',
    ownerPhone: '135****9012',
    company: '业之峰装饰',
    companyContact: '店长 赵经理',
    status: 'verdict',
    handler: '李调解员',
    handlerId: 'U-20240108',
    slaHours: 12,
    priority: 'P1',
    amount: 89500,
    projectStage: '竣工验收',
    description: '施工中新增17项增项，合计¥89,500未经业主签字确认',
  },
  {
    id: 'DSP-20260528-0823',
    createdAt: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm'),
    address: '西城区金融街融达国际1602',
    city: '北京',
    category: 'refund',
    owner: '赵女士',
    ownerPhone: '186****3456',
    company: '龙发装饰',
    companyContact: '客服部 王经理',
    status: 'reached',
    handler: '王调解员',
    handlerId: 'U-20231120',
    slaHours: 0,
    priority: 'P2',
    amount: 45000,
    projectStage: '泥木阶段',
    description: '瓷砖品牌与合同约定不符，达成赔偿¥12,000并重做协议',
  },
  {
    id: 'DSP-20260515-0791',
    createdAt: dayjs().subtract(28, 'day').format('YYYY-MM-DD HH:mm'),
    address: '通州区运河核心区II-05地块',
    city: '北京',
    category: 'other',
    owner: '孙先生',
    ownerPhone: '137****7890',
    company: '今朝装饰',
    companyContact: '项目总监 刘总',
    status: 'escalated',
    handler: '平台仲裁委',
    slaHours: 0,
    priority: 'P0',
    amount: 560000,
    projectStage: '全部完工',
    description: '双方对调解方案均不认可，已升级至平台仲裁委员会',
  },
  {
    id: 'DSP-20260609-0866',
    createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    address: '浦东新区陆家嘴环路1288号',
    city: '上海',
    category: 'quality',
    owner: '周女士',
    ownerPhone: '131****2234',
    company: '尚品宅配',
    companyContact: '工程监理 吴工',
    status: 'mediating',
    handler: '陈调解员',
    handlerId: 'U-20240518',
    slaHours: 36,
    priority: 'P1',
    amount: 24800,
    projectStage: '水电阶段',
    description: '卫生间防水工艺不符合国家标准，闭水试验漏水',
  },
  {
    id: 'DSP-20260611-0882',
    createdAt: dayjs().subtract(1, 'day').subtract(8, 'hour').format('YYYY-MM-DD HH:mm'),
    address: '南山区科技园南区T3栋',
    city: '深圳',
    category: 'delay',
    owner: '吴先生',
    ownerPhone: '159****5566',
    company: '名雕装饰',
    companyContact: '项目经理 黄工',
    status: 'pending',
    handler: '—',
    slaHours: 48,
    priority: 'P0',
    amount: 680000,
    projectStage: '拆改阶段',
    description: '签订合同已23天，现场仅完成拆除工作，施工队严重拖期',
  },
];

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending: { label: '待受理', color: 'text-carbon-600', bgColor: 'bg-ivory-100 border-ivory-300', dotColor: 'bg-carbon-500' },
  mediating: { label: '调解中', color: 'text-haze-700', bgColor: 'bg-haze-50 border-haze-200', dotColor: 'bg-haze-500' },
  verdict: { label: '待裁决', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', dotColor: 'bg-amber-500' },
  reached: { label: '已达成', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500' },
  escalated: { label: '已升级', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200', dotColor: 'bg-rose-500' },
};

const CATEGORY_CONFIG: Record<DisputeCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  extra: { label: '增项争议', icon: FileText, color: 'text-terracotta-700', bg: 'bg-terracotta-50 border-terracotta-200' },
  quality: { label: '质量问题', icon: Shield, color: 'text-wood-700', bg: 'bg-wood-50 border-wood-200' },
  delay: { label: '工期延误', icon: Clock, color: 'text-haze-700', bg: 'bg-haze-50 border-haze-200' },
  refund: { label: '退款纠纷', icon: Scale, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  other: { label: '其他', icon: AlertTriangle, color: 'text-ivory-700', bg: 'bg-ivory-100 border-ivory-300' },
};

const PRIORITY_CONFIG: Record<DisputePriority, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  P0: { label: '紧急', color: 'text-rose-700', icon: Flame },
  P1: { label: '高', color: 'text-amber-700', icon: Zap },
  P2: { label: '普通', color: 'text-ivory-700', icon: Sparkles },
};

const MEDIATORS = [
  { id: 'U-20240312', name: '张调解员', rating: 4.8, cases: 156, specialty: '工期/质量' },
  { id: 'U-20240108', name: '李调解员', rating: 4.9, cases: 203, specialty: '合同/增项' },
  { id: 'U-20231120', name: '王调解员', rating: 4.7, cases: 118, specialty: '退款/售后' },
  { id: 'U-20240518', name: '陈调解员', rating: 4.6, cases: 74, specialty: '水电/工艺' },
  { id: 'U-20240201', name: '赵调解员', rating: 4.9, cases: 189, specialty: '综合纠纷' },
];

type StatusFilter = 'all' | DisputeStatus;

export default function DisputeList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<{ id: string; handler: string } | null>(null);
  const [escalateTarget, setUpgradeTarget] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState('');

  const filtered = useMemo(() => MOCK_DISPUTES.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false;
    if (cityFilter !== 'all' && d.city !== cityFilter) return false;
    if (search && !d.id.includes(search) && !d.address.includes(search) && !d.owner.includes(search) && !d.company.includes(search)) return false;
    return true;
  }), [statusFilter, categoryFilter, priorityFilter, cityFilter, search]);

  const stats = {
    pending: MOCK_DISPUTES.filter((d) => d.status === 'pending').length,
    mediating: MOCK_DISPUTES.filter((d) => d.status === 'mediating').length,
    escalated: MOCK_DISPUTES.filter((d) => d.status === 'escalated').length,
    closeRate: Math.round((MOCK_DISPUTES.filter((d) => d.status === 'reached').length / MOCK_DISPUTES.length) * 100),
  };

  const handleAccept = (d: DisputeItem) => {
    Modal.confirm({
      title: `受理工单 ${d.id}？`,
      content: (
        <div className="pt-2 space-y-2">
          <p className="text-sm text-carbon-700">📋 纠纷摘要：</p>
          <div className="bg-ivory-50 rounded-lg p-3 text-sm text-carbon-700 space-y-1">
            <p>• <span className="text-ivory-600">类型：</span>{CATEGORY_CONFIG[d.category].label}</p>
            <p>• <span className="text-ivory-600">优先级：</span>{PRIORITY_CONFIG[d.priority].label}</p>
            <p>• <span className="text-ivory-600">涉事金额：</span>¥{d.amount?.toLocaleString() ?? '—'}</p>
            <p className="pt-1 text-carbon-800">{d.description}</p>
          </div>
        </div>
      ),
      okText: '确认受理',
      okButtonProps: { style: { backgroundColor: '#C4623A' } },
      cancelText: '取消',
      onOk: () => message.success(`✅ 工单 ${d.id} 已受理，SLA 48小时倒计时已启动`),
    });
  };

  const doAssign = () => {
    if (!assignTarget) return;
    const name = MEDIATORS.find(m => m.id === assignTarget.handler)?.name;
    message.loading({ content: `正在分配调解员...`, key: 'assign-' + assignTarget.id, duration: 0 });
    setTimeout(() => {
      message.success({ content: `✅ ${name} 已成功分配至 ${assignTarget.id}，已发送短信通知`, key: 'assign-' + assignTarget.id });
      setAssignTarget(null);
    }, 900);
  };

  const doEscalate = () => {
    if (!escalateReason.trim()) {
      message.warning('请填写升级仲裁的理由');
      return;
    }
    message.loading({ content: `正在提交升级申请...`, key: 'upg', duration: 0 });
    setTimeout(() => {
      message.error({ content: `已升级至平台仲裁委员会，理由：${escalateReason.slice(0, 20)}...`, key: 'upg', duration: 4 });
      setUpgradeTarget(null);
      setEscalateReason('');
    }, 1000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <style>{`
        @keyframes slaBlink {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(244,63,94,0.45); }
          50% { opacity: 0.75; box-shadow: 0 0 12px 4px rgba(244,63,94,0.18); }
        }
        .sla-blink { animation: slaBlink 1.1s ease-in-out infinite; }
      `}</style>

      <div>
        <h1 className="section-title">纠纷工单管理</h1>
        <p className="section-subtitle">装修纠纷在线调解工作流 · 5态 SLA 管控</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '待受理纠纷', value: stats.pending, color: 'from-carbon-500 to-carbon-700', icon: Clock, hint: '需 48h 内响应', badgeColor: 'bg-rose-500' },
          { label: '调解中', value: stats.mediating, color: 'from-haze-500 to-haze-700', icon: Users, hint: '正在进行调解', badgeColor: 'bg-haze-500' },
          { label: '已升级仲裁', value: stats.escalated, color: 'from-rose-500 to-rose-700', icon: Gavel, hint: '进入仲裁程序', badgeColor: 'bg-rose-600' },
          { label: '本月结案率', value: `${stats.closeRate}%`, color: 'from-emerald-500 to-emerald-700', icon: BadgeCheck, hint: `目标 ≥ 80%`, badgeColor: 'bg-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="card-base p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${s.color} opacity-10 rounded-bl-full`} />
            {s.value !== 0 && typeof s.value === 'number' && s.value > 0 && (
              <span className={`absolute top-4 right-4 inline-flex h-2.5 w-2.5 rounded-full ${s.badgeColor} animate-pulse`} />
            )}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-ivory-500">{s.label}</p>
                <p className="text-2xl font-serif font-bold text-carbon-800 mt-0.5">{s.value}</p>
              </div>
            </div>
            <p className="text-[11px] text-ivory-400 mt-2.5 pl-0.5">💡 {s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-semibold text-carbon-800">近30天纠纷趋势</h3>
              <p className="text-xs text-ivory-500 mt-0.5">新增 vs 结案数量对比</p>
            </div>
            <Tag color="blue" className="!text-xs">环比 -12%</Tag>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TREND_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#757064' }} stroke="#9A9489" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#757064' }} stroke="#9A9489" axisLine={false} tickLine={false} />
                <ReTooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E8E4DD', borderRadius: '12px', fontSize: '13px' }}
                  cursor={{ fill: '#FAF8F5' }}
                />
                <Bar dataKey="新增" fill="#C4623A" radius={[5, 5, 0, 0]} />
                <Bar dataKey="结案" fill="#6B8E9F" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-serif font-semibold text-carbon-800">纠纷类型分布</h3>
              <p className="text-xs text-ivory-500 mt-0.5">按纠纷原因占比</p>
            </div>
          </div>
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={TYPE_DIST} cx="50%" cy="50%" innerRadius={42} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {TYPE_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] space-y-1.5 pl-2">
              {TYPE_DIST.map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-carbon-700 flex-1 truncate">{t.name}</span>
                  <span className="text-xs font-mono font-bold text-ivory-600">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-base p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-ivory-100 rounded-xl p-1">
            {(['all', 'pending', 'mediating', 'verdict', 'reached', 'escalated'] as StatusFilter[]).map((s) => {
              const count = s === 'all' ? MOCK_DISPUTES.length : MOCK_DISPUTES.filter(d => d.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                    statusFilter === s ? 'bg-white shadow-sm text-terracotta-700 ring-1 ring-terracotta-200' : 'text-ivory-600 hover:text-carbon-800'
                  }`}
                >
                  {s !== 'all' && <span className={`inline-block w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotColor}`} />}
                  {s === 'all' ? '全部' : STATUS_CONFIG[s].label}
                  <span className={`text-[10px] font-mono px-1.5 rounded-full ${statusFilter === s ? 'bg-terracotta-100 text-terracotta-700' : 'bg-ivory-200 text-ivory-600'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="h-8 w-px bg-ivory-200 mx-1 hidden md:block" />

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={categoryFilter === 'all' ? undefined : categoryFilter} onChange={v => setCategoryFilter(v ?? 'all')} placeholder="类型" allowClear style={{ width: 130, borderRadius: 10 }} size="middle">
              {(Object.entries(CATEGORY_CONFIG) as [DisputeCategory, typeof CATEGORY_CONFIG.extra][]).map(([k, v]) => (
                <Option key={k} value={k}>{v.label}</Option>
              ))}
            </Select>
            <Select value={priorityFilter === 'all' ? undefined : priorityFilter} onChange={v => setPriorityFilter(v ?? 'all')} placeholder="优先级" allowClear style={{ width: 110, borderRadius: 10 }} size="middle">
              <Option value="P0">🔴 P0 紧急</Option>
              <Option value="P1">🟠 P1 高</Option>
              <Option value="P2">🟢 P2 普通</Option>
            </Select>
            <Select value={cityFilter === 'all' ? undefined : cityFilter} onChange={v => setCityFilter(v ?? 'all')} placeholder="城市" allowClear style={{ width: 100, borderRadius: 10 }} size="middle">
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="深圳">深圳</Option>
            </Select>
            <RangePicker size="middle" style={{ borderRadius: 10 }} placeholder={['开始', '结束']} />
          </div>

          <div className="relative flex-1 min-w-[240px] ml-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索工单编号 / 地址 / 业主 / 装修公司"
              className="input-base pl-10"
            />
          </div>

          <button className="btn-ghost">
            <Filter className="w-4 h-4" /> 高级筛选
          </button>
        </div>

        <div className="overflow-x-auto -mx-5 -mb-5 px-5 pb-5">
          <table className="w-full text-sm min-w-[1400px]">
            <thead>
              <tr className="bg-ivory-50/80 border-b border-ivory-200 sticky top-0">
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">工单编号</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">创建时间</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">优先级</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">纠纷类型</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">项目信息</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">涉事双方</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">状态</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">调解员</th>
                <th className="text-left px-4 py-3.5 font-medium text-ivory-600 text-xs">SLA 倒计时</th>
                <th className="text-center px-4 py-3.5 font-medium text-ivory-600 text-xs min-w-[260px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const sc = STATUS_CONFIG[d.status];
                const cc = CATEGORY_CONFIG[d.category];
                const pc = PRIORITY_CONFIG[d.priority];
                const PIcon = pc.icon;
                const CIcon = cc.icon;
                const isSLACritical = d.slaHours > 0 && d.slaHours <= 24;
                const isSLAWarn = d.slaHours > 0 && d.slaHours <= 48 && d.slaHours > 24;
                const totalSLA = 48;
                const slaPct = Math.max(0, Math.min(100, (d.slaHours / totalSLA) * 100));
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-ivory-100 hover:bg-ivory-50/60 transition-colors ${
                      isSLACritical ? 'bg-rose-50/40' : d.priority === 'P0' ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-wood-500 shrink-0" />
                        <span className="font-mono font-bold text-sm text-wood-700">{d.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-mono text-xs text-carbon-700">{dayjs(d.createdAt).format('MM-DD HH:mm')}</div>
                        <div className="text-[10px] text-ivory-400 mt-0.5">{dayjs(d.createdAt).fromNow()}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
                        d.priority === 'P0' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        d.priority === 'P1' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-ivory-100 text-ivory-700 border-ivory-300'
                      }`}>
                        <PIcon className={`w-3 h-3 ${d.priority === 'P0' ? 'animate-pulse' : ''}`} />
                        {pc.label} · {d.priority}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${cc.bg} ${cc.color}`}>
                        <CIcon className="w-3.5 h-3.5" />
                        {cc.label}
                      </div>
                      {d.amount && (
                        <div className="text-[10px] font-mono text-terracotta-600 mt-1">
                          💰 ¥{d.amount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-xs font-medium text-carbon-800 truncate">{d.address}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Tag color="geekblue" className="!text-[10px] !mx-0 !px-1.5 !py-0">{d.city}</Tag>
                        <span className="text-[10px] text-ivory-500">{d.projectStage}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{d.owner[0]}</div>
                          <div className="min-w-0">
                            <div className="text-xs text-carbon-800 font-medium truncate">{d.owner}</div>
                            <div className="text-[10px] text-ivory-400 font-mono truncate">{d.ownerPhone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-haze-400 to-haze-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{d.company[0]}</div>
                          <div className="min-w-0">
                            <div className="text-xs text-haze-700 font-medium truncate">{d.company}</div>
                            <div className="text-[10px] text-ivory-400 truncate">{d.companyContact}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${sc.bgColor} ${sc.color}`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${sc.dotColor} ${d.status === 'pending' || d.status === 'verdict' ? 'animate-pulse' : ''}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.handler === '—' ? (
                        <span className="text-[11px] text-ivory-400 italic">未分配</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[11px] font-bold">
                            {d.handler[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-carbon-800 truncate">{d.handler}</div>
                            {d.handlerId && <div className="text-[10px] text-ivory-400 font-mono truncate">{d.handlerId}</div>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.slaHours > 0 ? (
                        <div className={`max-w-[140px] ${isSLACritical ? 'sla-blink p-1.5 rounded-lg bg-rose-50 border border-rose-200 -m-1.5' : ''}`}>
                          <div className={`flex items-center justify-between mb-1 ${
                            isSLACritical ? 'text-rose-600 font-bold' : isSLAWarn ? 'text-amber-600 font-semibold' : 'text-ivory-600'
                          }`}>
                            <Clock className={`w-3.5 h-3.5 ${isSLACritical ? 'animate-pulse' : ''}`} />
                            <span className="font-mono text-xs">
                              {d.slaHours}h {isSLACritical && <span className="ml-0.5">🚨</span>}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-ivory-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSLACritical ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                                isSLAWarn ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              }`}
                              style={{ width: `${slaPct}%` }}
                            />
                          </div>
                          {isSLACritical && (
                            <div className="text-[9px] text-rose-600 mt-1 font-medium">
                              ⚠ 即将超时 请立即处理
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-[140px]">
                          <div className="flex items-center gap-1 text-emerald-600 text-[11px]">
                            {d.status === 'reached' ? <CheckCircle2 className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                            <span className="font-medium">{d.status === 'reached' ? '已达成' : '已升级'}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-emerald-100 mt-1 overflow-hidden">
                            <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {d.status === 'pending' && (
                          <button
                            onClick={() => handleAccept(d)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white hover:shadow-md hover:shadow-terracotta-200 transition-all inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />受理
                          </button>
                        )}
                        {(d.status === 'pending' || d.status === 'mediating') && d.handler === '—' && (
                          <button
                            onClick={() => setAssignTarget({ id: d.id, handler: MEDIATORS[0].id })}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-haze-50 text-haze-700 border border-haze-200 hover:bg-haze-100 transition-colors inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />分配
                          </button>
                        )}
                        {d.status === 'mediating' && (
                          <button
                            onClick={() => Modal.confirm({
                              title: `为 ${d.id} 发起调解会议`,
                              content: (
                                <div className="space-y-3 pt-2">
                                  <div>
                                    <label className="block text-xs text-ivory-600 mb-1.5">会议时间</label>
                                    <DatePicker showTime style={{ width: '100%', borderRadius: 8 }} placeholder="选择会议时间" />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-ivory-600 mb-1.5">会议形式</label>
                                    <Select defaultValue="video" style={{ width: '100%', borderRadius: 8 }}>
                                      <Option value="video">📹 线上视频会议（推荐）</Option>
                                      <Option value="phone">📞 电话调解</Option>
                                      <Option value="onsite">🚗 现场调解</Option>
                                    </Select>
                                  </div>
                                </div>
                              ),
                              okText: '确认发起',
                              okButtonProps: { style: { backgroundColor: '#6B8E9F' } },
                              cancelText: '取消',
                              onOk: () => message.success(`调解会议邀请已发送至业主和装修公司`),
                            })}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" />调解
                          </button>
                        )}
                        {d.status === 'mediating' && (
                          <button
                            onClick={() => {
                              setUpgradeTarget(d.id);
                              setEscalateReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Gavel className="w-3 h-3" />升级
                          </button>
                        )}
                        <Link
                          to={`/admin/disputes/${d.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-haze-700 border border-haze-200 hover:bg-haze-50 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />详情
                          <ChevronRight className="w-3 h-3 -mr-1" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <AlertOctagon className="w-10 h-10 mx-auto text-ivory-300 mb-2" />
                    <p className="text-sm text-ivory-500">暂无符合筛选条件的纠纷工单</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-haze-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-haze-700" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-carbon-800">分配调解员 · {assignTarget?.id}</h3>
              <p className="text-xs text-ivory-500">选择经验匹配的调解员以提高调解成功率</p>
            </div>
          </div>
        }
        open={!!assignTarget}
        onCancel={() => setAssignTarget(null)}
        onOk={doAssign}
        okText="确认分配"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#6B8E9F' } }}
        width={640}
      >
        <div className="space-y-3 pt-2">
          {assignTarget && (
            <Select
              value={assignTarget.handler}
              onChange={v => setAssignTarget({ ...assignTarget, handler: v })}
              placeholder="请选择调解员"
              style={{ width: '100%', borderRadius: 10 }}
              size="large"
            >
              {MEDIATORS.map(m => (
                <Option key={m.id} value={m.id}>
                  <div className="flex items-center justify-between w-full pr-6">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-ivory-400">
                      <span className="text-amber-500 mr-2">★ {m.rating}</span>
                      <span className="font-mono mr-2">{m.cases} 案</span>
                      <Tag color="blue" className="!text-[10px] !mx-0">{m.specialty}</Tag>
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          )}
          <div className="rounded-xl border border-ivory-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ivory-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-ivory-600">调解员</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-ivory-600">专业</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-ivory-600">评分</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-ivory-600">案件数</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-ivory-600">结案率</th>
                </tr>
              </thead>
              <tbody>
                {MEDIATORS.map(m => (
                  <tr key={m.id} className="border-t border-ivory-100 hover:bg-ivory-50/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-haze-500 flex items-center justify-center text-white text-[11px] font-bold">{m.name[0]}</div>
                        <span className="text-xs font-medium text-carbon-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-haze-700">{m.specialty}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Rate disabled allowHalf value={m.rating} className="!text-[12px] !-my-1" />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-xs font-bold text-carbon-800">{m.cases}</td>
                    <td className="px-3 py-2 text-center text-xs font-bold text-emerald-600">
                      {85 + Math.floor(Math.random() * 12)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-carbon-800">升级至平台仲裁 · {escalateTarget}</h3>
              <p className="text-xs text-ivory-500">调解失败，交由平台仲裁委员会处理</p>
            </div>
          </div>
        }
        open={!!escalateTarget}
        onCancel={() => setUpgradeTarget(null)}
        onOk={doEscalate}
        okText="确认升级"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={580}
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1.5">
              <p className="font-semibold">升级仲裁须知</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>仲裁结果具有平台规则约束力，双方需强制执行</li>
                <li>仲裁周期通常为 3-7 个工作日</li>
                <li>败诉方将扣除平台信用分 10-50 分</li>
              </ul>
            </div>
          </div>
          <div>
            <label className="block text-xs text-ivory-600 mb-1.5 font-medium">升级仲裁理由 *</label>
            <TextArea
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              rows={4}
              placeholder="请详细描述调解过程中遇到的障碍、双方争议焦点、申请仲裁的具体原因..."
              style={{ borderRadius: 10 }}
            />
          </div>
          <div>
            <label className="block text-xs text-ivory-600 mb-1.5">附件证据（可选）</label>
            <div className="rounded-xl border-2 border-dashed border-ivory-300 bg-ivory-50/50 p-6 text-center">
              <FileText className="w-8 h-8 mx-auto text-ivory-400 mb-1" />
              <p className="text-xs text-carbon-600">点击或拖拽上传相关证据文件</p>
              <p className="text-[10px] text-ivory-400 mt-1">支持 PDF/JPG/PNG，最大 20MB</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
