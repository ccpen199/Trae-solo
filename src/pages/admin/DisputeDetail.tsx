import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Printer, FileDown, Send, Users, Video, ArrowUpRight,
  Clock, CheckCircle2, AlertCircle, MessageSquare, User, Building2, Shield,
  FileText, Image as ImageIcon, Calendar, Gavel, AlertTriangle, BadgeCheck,
  PenLine, X, ZoomIn, Sparkles, ChevronRight, Handshake, Award,
  History, Activity, Paperclip, Mic, Phone, MoreHorizontal, Download,
  Copy, CheckCircle, AlertOctagon,
} from 'lucide-react';
import {
  Steps, DatePicker, Modal, Input, InputNumber, Slider, Tag, message, Tabs,
  Avatar, Rate, Space, Drawer, Progress,
} from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface ChatMsg {
  id: string;
  sender: 'mediator' | 'owner' | 'company' | 'system';
  senderName: string;
  content: string;
  time: string;
}

const MOCK_CASE = {
  id: 'DSP-20260528',
  caseNumber: 'DSP-20260528',
  createdAt: '2026-05-28 09:15',
  category: '工期延误',
  status: 'mediating' as const,
  priority: 'P1' as const,
  amount: 320000,
  projectName: '海淀区中关村南大街甲18号 · 张先生雅居',
  projectStage: '安装阶段',
  owner: {
    name: '王先生',
    phone: '138****2345',
    statement: '合同约定3月1日开工，工期60个工作日，应5月1日完工。至今5月28日仍未完工，泥瓦工程才做了一半。工长频繁更换，每次更换都停工3-5天。多次催促无果，要求赔偿延期损失。',
    submittedAt: '2026-05-28 09:15',
  },
  company: {
    name: '东易日盛',
    contact: '李工长',
    phone: '139****8901',
    statement: '承认工期延误，但原因是业主中途多次变更设计方案导致返工。2月20日变更厨房布局，3月15日变更卫生间防水方案，4月初又要求增加阳台封闭工程。每次变更都需要重新采购材料并调整施工计划。愿意协商延期责任分担。',
    submittedAt: '2026-05-29 14:30',
    respondedAt: '2026-05-29 14:30',
  },
  mediator: { id: 'U-20240312', name: '张慧', title: '高级调解员', rating: 4.8, cases: 156 },
  timeline: [
    { time: '2026-05-28 09:15', event: '业主发起投诉', type: 'complaint' as const, user: '系统' },
    { time: '2026-05-28 09:15', event: '平台生成工单 DSP-20260528', type: 'system' as const, user: '系统' },
    { time: '2026-05-28 10:00', event: '通知服务商响应（限48小时）', type: 'system' as const, user: '系统' },
    { time: '2026-05-29 14:30', event: '服务商提交陈述与证据（3份变更确认单）', type: 'response' as const, user: '东易日盛' },
    { time: '2026-05-30 10:00', event: '调解员 张慧 介入处理', type: 'mediator' as const, user: '张慧' },
    { time: '2026-05-30 11:20', event: '与业主首次电话沟通，确认延期情况属实', type: 'note' as const, user: '张慧' },
    { time: '2026-06-01 15:00', event: '调解记录：建议业主承担30%，公司承担70%', type: 'note' as const, user: '张慧' },
  ],
  evidences: [
    { id: 'e1', submittedBy: 'owner' as const, type: 'image' as const, url: 'https://picsum.photos/seed/dsp1/600/400', description: '施工现场现状（未完工墙面）', uploadedAt: '05-28 09:20' },
    { id: 'e2', submittedBy: 'owner' as const, type: 'image' as const, url: 'https://picsum.photos/seed/dsp2/600/400', description: '合同工期页面截图', uploadedAt: '05-28 09:22' },
    { id: 'e3', submittedBy: 'owner' as const, type: 'contract' as const, url: '', description: '装修合同扫描件（PDF，45页）', uploadedAt: '05-28 09:25' },
    { id: 'e4', submittedBy: 'company' as const, type: 'image' as const, url: 'https://picsum.photos/seed/dsp3/600/400', description: '设计变更确认单 01', uploadedAt: '05-29 14:32' },
    { id: 'e5', submittedBy: 'company' as const, type: 'document' as const, url: '', description: '设计变更确认单 02', uploadedAt: '05-29 14:35' },
    { id: 'e6', submittedBy: 'company' as const, type: 'document' as const, url: '', description: '新增工程确认单（阳台封闭）', uploadedAt: '05-29 14:38' },
  ],
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: '待受理', color: 'text-carbon-600', bg: 'bg-ivory-100 border-ivory-300', dot: 'bg-carbon-500' },
  mediating: { label: '调解中', color: 'text-haze-700', bg: 'bg-haze-50 border-haze-200', dot: 'bg-haze-500' },
  verdict: { label: '待裁决', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  reached: { label: '已达成', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  escalated: { label: '已升级', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

const TYPE_ICONS = {
  complaint: <AlertCircle className="w-4 h-4 text-rose-500" />,
  system: <Clock className="w-4 h-4 text-ivory-400" />,
  response: <Building2 className="w-4 h-4 text-haze-500" />,
  mediator: <Shield className="w-4 h-4 text-terracotta-500" />,
  note: <MessageSquare className="w-4 h-4 text-wood-500" />,
};

const STEP_ITEMS = [
  { title: '受理登记', subTitle: '提交+审核材料', status: 'finish', icon: FileText },
  { title: '证据收集', subTitle: '双方上传材料', status: 'finish', icon: ImageIcon },
  { title: '调解会议', subTitle: '线上/线下沟通', status: 'process', icon: Users },
  { title: '调解结果', subTitle: '方案+双方确认', status: 'wait', icon: Handshake },
  { title: '归档关闭', subTitle: '结案+存档', status: 'wait', icon: BadgeCheck },
];

const INITIAL_CHAT: ChatMsg[] = [
  { id: 'm0', sender: 'system', senderName: '系统', content: '调解工作群已创建，邀请业主「王先生」和装修公司「东易日盛」加入', time: '05-30 10:00' },
  { id: 'm1', sender: 'mediator', senderName: '张调解员', content: '大家好，我是本案调解员张慧。请双方简要陈述诉求和理由，方便梳理争议焦点。', time: '05-30 10:05' },
  { id: 'm2', sender: 'owner', senderName: '王先生（业主）', content: '合同写的5月1日完工，现在6月了还在做泥瓦！工长换了3个，必须赔偿我在外租房+误工费共3.2万！', time: '05-30 10:08' },
  { id: 'm3', sender: 'company', senderName: '李工长（东易日盛）', content: '工期确实延误。但业主多次变更：厨房、水电、加阳台封闭，每次都要重排材料和工期，不能全算我们的错。', time: '05-30 10:12' },
  { id: 'm4', sender: 'mediator', senderName: '张调解员', content: '收到！初步总结：①延期27天双方认可；②业主认为是施工管理问题，公司认为是多次变更；③赔偿差距大（3.2万 vs 0.8万）。下一步核查证据再开正式会议。', time: '05-30 10:20' },
];

const OPERATION_LOGS = [
  { time: '2026-06-01 15:00', user: '张调解员', role: '调解员', action: '录入调解方案', detail: '业主30% / 公司70%，建议赔偿1.8万元', ip: '10.1.2.33' },
  { time: '2026-05-31 16:40', user: '张调解员', role: '调解员', action: '查看证据', detail: '查看业主合同扫描件（证据 e3）', ip: '10.1.2.33' },
  { time: '2026-05-30 15:12', user: '张调解员', role: '调解员', action: '接手工单', detail: '从待受理池接手工单 DSP-20260528', ip: '10.1.2.33' },
  { time: '2026-05-29 14:30', user: '东易日盛', role: '服务商', action: '提交证据', detail: '上传3份设计变更/新增工程确认单', ip: '223.104.xx.88' },
  { time: '2026-05-28 09:15', user: '王先生', role: '业主', action: '发起投诉', detail: '业主端提交"工期延误"类型纠纷申请', ip: '117.136.xx.12' },
];

export default function DisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = MOCK_CASE;
  const sc = STATUS_STYLES[c.status];

  const [activeTab, setActiveTab] = useState('chat');
  const [noteText, setNoteText] = useState('');
  const [chatMsg, setChatMsg] = useState<ChatMsg[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ owner: false, company: false });
  const [escalateReason, setEscalateReason] = useState('');
  const [planForm, setPlanForm] = useState({
    description: '经调解：业主承担30%延期责任，装修公司承担70%。装修公司于7个工作日内支付业主18,000元赔偿款，双方承诺不再就本工期问题提出其他索赔。',
    amount: 18000,
    ownerLiability: 30,
    companyLiability: 70,
    deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  });
  const [signDrawers, setSignDrawers] = useState({ owner: false, company: false });

  const chatBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMsg.length, activeTab]);

  const sendChatMsg = () => {
    if (!chatInput.trim()) return;
    setChatMsg([
      ...chatMsg,
      { id: 'm' + Date.now(), sender: 'mediator', senderName: '张调解员', content: chatInput, time: dayjs().format('MM-DD HH:mm') },
    ]);
    setChatInput('');
    message.success('消息已发送');
  };

  const doClose = () => {
    if (!confirmState.owner || !confirmState.company) {
      message.warning('请等待业主和装修公司双方完成电子签名确认');
      return;
    }
    message.loading({ content: '正在生成调解结案报告...', key: 'close-case', duration: 0 });
    setTimeout(() => {
      message.success({ content: `✅ 工单 ${c.caseNumber} 已达成一致并结案！报告已同步双方邮箱`, key: 'close-case', duration: 5 });
      navigate('/admin/disputes');
    }, 1800);
  };

  const doEscalate = () => {
    if (!escalateReason.trim()) { message.warning('请填写升级仲裁的理由'); return; }
    message.loading({ content: '正在提交升级仲裁申请...', key: 'upg', duration: 0 });
    setTimeout(() => {
      message.error({ content: `已升级至平台仲裁委员会，理由：${escalateReason.slice(0, 15)}...`, key: 'upg', duration: 4 });
      setEscalateOpen(false);
    }, 1200);
  };

  const ownerSignRef = useRef<HTMLCanvasElement>(null);
  const companySignRef = useRef<HTMLCanvasElement>(null);
  const bindSign = (ref: React.RefObject<HTMLCanvasElement>) => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d'); if (!ctx) return;
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    let drawing = false, lastX = 0, lastY = 0;
    const getPos = (e: MouseEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e: MouseEvent) => { drawing = true; const { x, y } = getPos(e); lastX = x; lastY = y; };
    const move = (e: MouseEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke();
      lastX = x; lastY = y;
    };
    const up = () => { drawing = false; };
    ref.current.addEventListener('mousedown', down);
    ref.current.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  useEffect(() => { if (signDrawers.owner) setTimeout(() => bindSign(ownerSignRef), 50); }, [signDrawers.owner]);
  useEffect(() => { if (signDrawers.company) setTimeout(() => bindSign(companySignRef), 50); }, [signDrawers.company]);

  const confirmSign = (who: 'owner' | 'company') => {
    setConfirmState({ ...confirmState, [who]: true });
    setSignDrawers({ ...signDrawers, [who]: false });
    message.success(`${who === 'owner' ? '业主' : '装修公司'}电子签名已确认 ✅`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/admin/disputes" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="section-title mb-0">工单 {c.caseNumber}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />{sc.label}
              </span>
              <Tag color="orange" className="!rounded-full !text-[11px]">⚡ {c.priority}</Tag>
              <Tag color="cyan" className="!rounded-full !text-[11px]">📂 {c.category}</Tag>
            </div>
            <p className="text-sm text-ivory-500 mt-1.5 flex items-center gap-3 flex-wrap">
              <span>创建于 {c.createdAt}</span><span>·</span>
              <span className="text-terracotta-600">涉事金额 ¥{c.amount.toLocaleString()}</span><span>·</span>
              <span>{c.projectStage}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost !py-2" onClick={() => message.success('已发送到打印机')}><Printer className="w-4 h-4" /> 打印</button>
          <button className="btn-ghost !py-2" onClick={() => { message.loading({ content: '正在生成 PDF 报告...', duration: 0, key: 'pdf' }); setTimeout(() => message.success({ content: '结案报告已生成下载', key: 'pdf' }), 1500); }}>
            <FileDown className="w-4 h-4" /> 导出PDF
          </button>
          <button onClick={() => setCloseOpen(true)} className="btn-primary !py-2 inline-flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4" /> 达成一致 · 关单
          </button>
        </div>
      </div>

      {/* 5步工作流 */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif font-semibold text-carbon-800 text-lg">调解工作流进度</h3>
            <p className="text-xs text-ivory-500 mt-0.5">标准化5步流程，全环节可追溯</p>
          </div>
          <div className="flex items-center gap-3">
            <Progress type="circle" percent={60} size={56} strokeColor={{ from: '#C4623A', to: '#6B8E9F' }} format={p => <span className="text-xs font-bold text-terracotta-600">{p}%</span>} />
            <div className="text-sm"><div className="font-semibold text-carbon-800">Step 3/5</div><div className="text-xs text-ivory-500">预计 2-4 工作日</div></div>
          </div>
        </div>
        <Steps current={2} items={STEP_ITEMS.map(s => ({ title: <span className="text-sm font-medium">{s.title}</span>, subTitle: <span className="text-[11px] text-ivory-500">{s.subTitle}</span>, icon: <s.icon className="w-4 h-4" />, status: s.status as any }))} labelPlacement="vertical" />
      </div>

      {/* 基本信息 + SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-carbon-800 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-terracotta-500" /> SLA 处理时效 · 48小时标准</h4>
              <span className="font-mono text-sm text-terracotta-600 font-bold flex items-center gap-1"><span className="w-2 h-2 bg-terracotta-500 rounded-full animate-pulse" />剩余 36h 12m</span>
            </div>
            <Progress percent={25} showInfo={false} strokeColor={{ from: '#10b981', to: '#C4623A' }} strokeWidth={10} />
            <div className="flex justify-between text-[10px] text-ivory-400 mt-1.5 font-mono"><span>0h 发起</span><span>12h 受理</span><span>24h 调前</span><span>36h 调解</span><span>48h 裁决</span></div>
          </div>
          <div className="card-base p-5">
            <h4 className="font-serif font-semibold text-carbon-800 mb-4">📋 项目与纠纷信息</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: '项目名称', value: c.projectName },
                { label: '装修公司', value: c.company.name + ' · ' + c.company.contact },
                { label: '业主', value: c.owner.name + ' · ' + c.owner.phone },
                { label: '合同工期', value: '2026-03-01 ~ 2026-05-01（60 工作日）' },
                { label: '争议类型', value: c.category + '（延期约 27 天）' },
                { label: '期望赔偿', value: '业主要求 ¥32,000 / 公司建议 ¥8,000' },
              ].map((k, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-ivory-500 w-24 shrink-0">{k.label}</span>
                  <span className="text-carbon-800 flex-1">{k.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card-base p-5 bg-gradient-to-br from-haze-50/70 to-ivory-50 border-haze-200">
          <h4 className="font-serif font-semibold text-carbon-800 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-haze-600" /> 指定调解员</h4>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-haze-500 to-haze-700 flex items-center justify-center text-white text-xl font-bold shadow-sm shadow-haze-200">{c.mediator.name[0]}</div>
            <div><p className="font-semibold text-carbon-800">{c.mediator.name}</p><p className="text-xs text-ivory-500">{c.mediator.title} · {c.mediator.id}</p></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between"><span className="text-xs text-ivory-500">专业评分</span><Rate disabled allowHalf value={c.mediator.rating} className="!text-[12px] !-my-1" /></div>
            <div className="flex items-center justify-between text-xs"><span className="text-ivory-500">调解案件</span><span className="font-mono font-bold text-carbon-800">{c.mediator.cases} 件</span></div>
            <div className="flex items-center justify-between text-xs"><span className="text-ivory-500">结案率</span><span className="font-mono font-bold text-emerald-600">91.3%</span></div>
            <div className="flex items-center justify-between text-xs"><span className="text-ivory-500">擅长</span><span className="text-haze-700">工期/质量</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-2.5 py-2 rounded-lg bg-white text-haze-700 border border-haze-200 hover:bg-haze-50 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors" onClick={() => message.info('正在呼叫...（模拟）')}>
              <Phone className="w-3 h-3" />电话
            </button>
            <button className="px-2.5 py-2 rounded-lg bg-white text-haze-700 border border-haze-200 hover:bg-haze-50 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors" onClick={() => message.success('已发送私信通知')}>
              <MessageSquare className="w-3 h-3" />私信
            </button>
          </div>
        </div>
      </div>

      {/* 双方陈述证据左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { side: 'owner', cfg: { title: '业主陈述', name: c.owner.name, info: c.owner.name + ' · ' + c.owner.phone, bg: 'bg-haze-50/40', border: 'border-haze-200/60', text: 'text-haze-800', avatar: 'from-haze-400 to-haze-600', card: 'border-haze-200', shadow: 'shadow-haze-100' }, statement: c.owner.statement, submittedAt: c.owner.submittedAt, submittedBy: 'owner' as const, ip: 'IP 117.136.xx.12' },
          { side: 'company', cfg: { title: '装修公司陈述', name: c.company.name, info: '✓已响应 · ' + c.company.contact, bg: 'bg-terracotta-50/40', border: 'border-terracotta-200/60', text: 'text-terracotta-800', avatar: 'from-terracotta-400 to-terracotta-600', card: 'border-terracotta-200', shadow: 'shadow-terracotta-100' }, statement: c.company.statement, submittedAt: c.company.submittedAt, submittedBy: 'company' as const, ip: 'IP 223.104.xx.88' },
        ].map((side) => {
          const filtered = c.evidences.filter(e => e.submittedBy === side.submittedBy);
          const signed = side.side === 'owner' ? confirmState.owner : confirmState.company;
          return (
            <div key={side.side} className="card-base overflow-hidden">
              <div className={`p-5 ${side.cfg.bg} border-b ${side.cfg.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-serif font-semibold ${side.cfg.text} flex items-center gap-2`}>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${side.cfg.avatar} flex items-center justify-center text-white text-sm font-bold`}>{side.cfg.name[0]}</div>
                    <div><span>{side.cfg.title}</span><div className="text-[11px] text-ivory-500 font-normal mt-0.5">{side.cfg.info}</div></div>
                  </h3>
                  {signed
                    ? <Tag icon={<CheckCircle className="w-3 h-3" />} color="success" className="!rounded-full">✓ 已电子签名</Tag>
                    : <Tag color="default" className="!rounded-full">待确认方案</Tag>}
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="rounded-xl bg-ivory-50 p-4 text-sm text-carbon-700 leading-relaxed border border-ivory-100">{side.statement}</div>
                <div>
                  <h5 className="text-xs font-semibold text-ivory-600 mb-2.5 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> 上传证据（{filtered.length}项）</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filtered.map(e => (
                      <div key={e.id} onClick={() => e.type === 'image' && setPreviewImage({ url: e.url, title: e.description })} className={`rounded-xl border overflow-hidden transition-all group cursor-pointer ${e.type === 'image' ? `${side.cfg.card} hover:shadow-md hover:${side.cfg.shadow}` : 'border-ivory-200 bg-ivory-50/60 hover:bg-ivory-100'}`}>
                        {e.type === 'image' ? (
                          <div className="h-24 relative bg-haze-100 overflow-hidden">
                            <img src={e.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-carbon-900/0 group-hover:bg-carbon-900/40 transition-colors flex items-center justify-center"><ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" /></div>
                          </div>
                        ) : (
                          <div className="p-3"><div className={`w-9 h-9 rounded-lg ${side.side === 'owner' ? 'bg-haze-100' : 'bg-terracotta-100'} flex items-center justify-center mb-2`}><FileText className={`w-4 h-4 ${side.side === 'owner' ? 'text-haze-600' : 'text-terracotta-600'}`} /></div></div>
                        )}
                        <div className="p-2"><p className="text-[11px] text-carbon-800 leading-tight line-clamp-2">{e.description}</p><p className="text-[10px] text-ivory-400 font-mono mt-1">{e.uploadedAt}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-ivory-400 font-mono border-t border-ivory-100 pt-3">提交于 {side.submittedAt} · {side.ip}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs: 时间线+聊天+操作日志 */}
      <div className="card-base overflow-hidden">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" className="border-b border-ivory-200 px-6" items={[
          { key: 'timeline', label: <span className="flex items-center gap-1.5 text-sm"><History className="w-4 h-4" />完整时间线</span> },
          { key: 'chat', label: <span className="flex items-center gap-1.5 text-sm"><MessageSquare className="w-4 h-4" />调解沟通群<span className="ml-1 px-1.5 py-0.5 bg-haze-100 text-haze-700 rounded-full text-[10px]">{chatMsg.length}</span></span> },
          { key: 'operations', label: <span className="flex items-center gap-1.5 text-sm"><Activity className="w-4 h-4" />操作留痕日志</span> },
        ]} />
        <div className="p-6 min-h-[500px]">
          {activeTab === 'timeline' && (
            <div className="space-y-0 pl-2">
              {c.timeline.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-7 relative last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white border-2 border-ivory-200 flex items-center justify-center shrink-0 z-10 shadow-sm">{TYPE_ICONS[item.type]}</div>
                    {idx < c.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-haze-200 to-ivory-100 mt-1" />}
                  </div>
                  <div className="flex-1 pt-1.5 pb-2 bg-ivory-50/40 rounded-xl p-4 border border-ivory-100">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1"><p className="text-sm font-medium text-carbon-800">{item.event}</p><span className="text-[11px] text-ivory-500 font-mono">{item.time}</span></div>
                    <div className="text-[11px] text-ivory-500 flex items-center gap-1.5"><span className="inline-flex items-center gap-0.5"><User className="w-3 h-3" />{item.user}</span><span className="px-1.5 py-0.5 bg-ivory-100 rounded-full capitalize">{item.type}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[500px]">
              <div ref={chatBoxRef} className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-thin">
                {chatMsg.map(m => {
                  const isSelf = m.sender === 'mediator';
                  const isSystem = m.sender === 'system';
                  const colorMap = {
                    mediator: { name: '调', avatar: 'from-haze-400 to-haze-600', self: true, bubble: 'bg-haze-50 border-haze-200' },
                    owner: { name: '业', avatar: 'from-terracotta-400 to-terracotta-600', self: false, bubble: 'bg-white border-ivory-200' },
                    company: { name: '装', avatar: 'from-terracotta-500 to-wood-600', self: false, bubble: 'bg-terracotta-50/60 border-terracotta-200' },
                    system: { name: 'S', avatar: 'from-ivory-400 to-ivory-600', self: false, bubble: 'bg-ivory-100 border-ivory-200' },
                  } as const;
                  const cfg = colorMap[m.sender] || colorMap.system;
                  if (isSystem) return <div key={m.id} className="flex justify-center"><div className="px-3 py-1.5 rounded-full bg-ivory-100 border border-ivory-200 text-[11px] text-ivory-600 inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3" /><span>{m.content}</span></div></div>;
                  return (
                    <div key={m.id} className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl shrink-0 bg-gradient-to-br ${cfg.avatar} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>{cfg.name}</div>
                      <div className={`max-w-[70%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1 px-1"><span className={`text-[11px] font-semibold ${isSelf ? 'text-haze-700' : m.sender === 'owner' ? 'text-terracotta-700' : 'text-wood-700'}`}>{m.senderName}</span><span className="text-[10px] text-ivory-400 font-mono">{m.time}</span></div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${cfg.bubble} ${isSelf ? 'rounded-tr-md' : 'rounded-tl-md'} shadow-sm`}><p dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>') }} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-ivory-200">
                <div className="flex gap-2 items-end">
                  <div className="flex gap-1">
                    {[Paperclip, ImageIcon, Mic].map((Icon, i) => (
                      <button key={i} className="w-9 h-9 rounded-xl bg-ivory-50 hover:bg-haze-50 text-ivory-500 hover:text-haze-600 transition-colors inline-flex items-center justify-center" onClick={() => message.info('功能模拟')}>
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 relative"><TextArea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg(); } }} placeholder="Enter发送，Shift+Enter换行..." rows={2} style={{ borderRadius: 14 }} /></div>
                  <button onClick={sendChatMsg} className="h-full px-5 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white hover:shadow-md hover:shadow-terracotta-200 transition-all inline-flex items-center gap-1.5 font-semibold text-sm"><Send className="w-4 h-4" />发送</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'operations' && (
            <div className="rounded-xl border border-ivory-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ivory-50"><tr>
                  {['操作时间', '操作人', '角色', '操作', '详情', 'IP 地址'].map(h => <th key={h} className={`text-${h.startsWith('IP') ? 'right' : 'left'} px-4 py-3 text-xs font-semibold text-ivory-600`}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {OPERATION_LOGS.map((log, i) => (
                    <tr key={i} className="border-t border-ivory-100 hover:bg-ivory-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-carbon-700">{log.time}</td>
                      <td className="px-4 py-3 text-xs font-medium text-carbon-800">{log.user}</td>
                      <td className="px-4 py-3"><Tag color={log.role === '调解员' ? 'blue' : log.role === '业主' ? 'green' : log.role === '服务商' ? 'orange' : 'default'} className="!rounded-full !text-[10px]">{log.role}</Tag></td>
                      <td className="px-4 py-3 text-xs text-carbon-700 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-xs text-ivory-600 max-w-[320px] truncate">{log.detail}</td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] text-ivory-400">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 调解操作工作台 */}
      <div className="card-base p-5 border-amber-200 bg-gradient-to-r from-amber-50/50 to-ivory-50 sticky bottom-4 z-30 shadow-lg shadow-ivory-200/60">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-serif font-semibold text-carbon-800 flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" />调解操作工作台</h3>
            <p className="text-xs text-ivory-500 mt-0.5">标准化操作，全流程留痕</p>
          </div>
          {(confirmState.owner || confirmState.company) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 animate-pulse" />双方确认中<span className="text-[10px] font-mono text-emerald-600">{Number(confirmState.owner) + Number(confirmState.company)}/2</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: Video, title: '发起调解会议', sub: '视频/电话/现场', tag: '选择时间并发送通知', color: 'haze', onClick: () => setMeetingOpen(true) },
            { icon: PenLine, title: '录入调解方案', sub: '赔偿金额·责任划分', tag: '百分比滑块分配责任', color: 'terracotta', onClick: () => setPlanOpen(true) },
            {
              icon: BadgeCheck, title: '双方确认签名', sub: '电子签名·平台存证',
              tag: `业主${confirmState.owner ? '✓' : '待签'} · 公司${confirmState.company ? '✓' : '待签'}`,
              color: 'amber', onClick: () => { if (!planForm.description) { message.warning('请先录入调解方案'); setPlanOpen(true); return; } setSignDrawers({ ...signDrawers, owner: true }); message.info('已通知双方查看方案并签名确认'); }
            },
            { icon: CheckCircle2, title: '达成一致·关单', sub: '结案报告+PDF归档', tag: '双方签名后生效', color: 'emerald', onClick: () => setCloseOpen(true) },
            { icon: Gavel, title: '升级平台仲裁', sub: '调解失败·专家介入', tag: '需填写仲裁理由', color: 'rose', onClick: () => setEscalateOpen(true) },
          ].map((b, i) => {
            const cmap: Record<string, { bd: string; hovbd: string; hovsh: string; icbg: string; iccol: string; text: string; bgtag: string; coltag: string }> = {
              haze: { bd: 'border-haze-200', hovbd: 'hover:border-haze-400', hovsh: 'hover:shadow-haze-100', icbg: 'bg-haze-50 group-hover:bg-haze-100', iccol: 'text-haze-600', text: 'text-carbon-800', bgtag: 'bg-haze-50', coltag: 'text-haze-600' },
              terracotta: { bd: 'border-terracotta-200', hovbd: 'hover:border-terracotta-400', hovsh: 'hover:shadow-terracotta-100', icbg: 'bg-terracotta-50 group-hover:bg-terracotta-100', iccol: 'text-terracotta-600', text: 'text-carbon-800', bgtag: 'bg-terracotta-50', coltag: 'text-terracotta-600' },
              amber: { bd: 'border-amber-200', hovbd: 'hover:border-amber-400', hovsh: 'hover:shadow-amber-100', icbg: 'bg-amber-50 group-hover:bg-amber-100', iccol: 'text-amber-600', text: 'text-carbon-800', bgtag: 'bg-amber-50', coltag: 'text-amber-700' },
              emerald: { bd: 'border-emerald-200', hovbd: 'hover:border-emerald-400', hovsh: 'hover:shadow-emerald-100', icbg: 'bg-emerald-50/60 group-hover:bg-emerald-100', iccol: 'text-emerald-600', text: 'text-emerald-800', bgtag: 'bg-white/70', coltag: 'text-emerald-700' },
              rose: { bd: 'border-rose-200', hovbd: 'hover:border-rose-400', hovsh: 'hover:shadow-rose-100', icbg: 'bg-rose-50/60 group-hover:bg-rose-100', iccol: 'text-rose-600', text: 'text-rose-800', bgtag: 'bg-white/70', coltag: 'text-rose-700' },
            } as const;
            const bc = cmap[b.color] || cmap.haze;
            const bg = b.color === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : b.color === 'rose' ? 'bg-gradient-to-br from-rose-50 to-rose-100' : 'bg-white';
            return (
              <button key={i} onClick={b.onClick} className={`group relative rounded-xl ${bg} border ${bc.bd} ${bc.hovbd} hover:shadow-md ${bc.hovsh} transition-all p-4 text-left overflow-hidden`}>
                <div className={`absolute top-3 right-3 w-10 h-10 rounded-full ${bc.icbg} flex items-center justify-center transition-colors`}><b.icon className={`w-5 h-5 ${bc.iccol}`} /></div>
                <p className={`font-semibold ${bc.text} text-sm`}>{b.title}</p>
                <p className="text-[11px] text-ivory-500 mt-1">{b.sub}</p>
                <div className={`mt-2.5 text-[10px] font-mono ${bc.coltag} ${bc.bgtag} inline-flex items-center gap-1 px-2 py-0.5 rounded-full`}><Calendar className="w-3 h-3" />{b.tag}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 调解备注 */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-carbon-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-wood-600" /> 添加调解备注（内部）</h4>
          <span className="text-[10px] text-ivory-400">💡 仅调解员和运营后台可见</span>
        </div>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="记录调解要点、待跟进事项、下一步计划..." className="input-base min-h-[80px] resize-none mb-3" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { if (!noteText.trim()) return message.warning('请输入备注内容'); message.success(`调解备注已保存：${noteText.slice(0, 15)}...`); setNoteText(''); }} className="btn-primary text-sm"><Send className="w-4 h-4" /> 保存记录</button>
          <button onClick={() => setMeetingOpen(true)} className="btn-secondary text-sm"><Video className="w-4 h-4" /> 安排线上会议</button>
          <button onClick={() => message.success('调解方案已推送至双方小程序')} className="btn-ghost text-sm text-emerald-700 hover:bg-emerald-50"><ArrowUpRight className="w-4 h-4" /> 推送调解方案</button>
          <button onClick={() => setEscalateOpen(true)} className="btn-ghost text-sm text-rose-700 hover:bg-rose-50 ml-auto"><Gavel className="w-4 h-4" /> 升级仲裁</button>
        </div>
      </div>

      {/* 图片预览 Modal */}
      {previewImage && (
        <Modal open={!!previewImage} onCancel={() => setPreviewImage(null)} footer={null} width={820} centered title={<div className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-haze-600" /><span className="font-serif">{previewImage.title}</span></div>}>
          <div className="rounded-xl overflow-hidden bg-carbon-900 p-3"><img src={previewImage.url} alt="" className="w-full rounded-lg" /></div>
        </Modal>
      )}

      {/* 发起调解会议 Modal */}
      <Modal
        open={meetingOpen}
        onCancel={() => setMeetingOpen(false)}
        title={<div className="flex items-center gap-2"><Video className="w-5 h-5 text-haze-600" /><span className="font-serif">发起调解会议</span></div>}
        width={680}
        okText="发送会议通知"
        cancelText="取消"
        onOk={() => {
          message.loading({ content: '正在创建会议并发送通知...', key: 'meet', duration: 0 });
          setTimeout(() => {
            message.success({ content: '✅ 调解会议已创建！线上会议室链接已通过短信+小程序通知双方', key: 'meet', duration: 4 });
            setMeetingOpen(false);
            setChatMsg([...chatMsg, { id: 'm' + Date.now(), sender: 'system', senderName: '系统', content: '调解员安排了调解会议，时间：6月5日 14:00，请双方准时参加。', time: dayjs().format('MM-DD HH:mm') }]);
          }, 1300);
        }}
      >
        <div className="space-y-5 -mt-2">
          <div className="p-4 rounded-xl bg-haze-50/60 border border-haze-200 space-y-1.5">
            <p className="text-xs font-semibold text-haze-800">📌 会议须知</p>
            <ul className="text-[11px] text-haze-700 space-y-1 list-disc pl-4">
              <li>线上会议默认使用平台视频会议室，支持屏幕共享展示证据</li>
              <li>会议将全程录音录像，作为调解档案留存</li>
              <li>请提前10分钟进入会议室测试音视频</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">会议方式</label>
              <select className="input-base text-sm">
                <option>🎥 平台视频会议（推荐）</option>
                <option>📞 电话会议</option>
                <option>🏢 线下调解中心（北京朝阳）</option>
                <option>🏢 线下调解中心（上海浦东）</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">预约日期</label>
              <DatePicker defaultValue={dayjs().add(3, 'day')} className="!w-full" style={{ height: 40, borderRadius: 10 }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">开始时间</label>
              <select className="input-base text-sm">
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">预计时长</label>
              <select className="input-base text-sm">
                <option>30 分钟</option><option>60 分钟（推荐）</option><option>90 分钟</option><option>120 分钟</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">会议议题（将同步给双方）</label>
            <TextArea rows={3} defaultValue="1. 双方陈述工期延误的核心原因；2. 核对设计变更单等证据材料；3. 协商延期责任比例和赔偿金额；4. 确定后续完工时间节点。" className="!rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">参会人员</label>
            <div className="space-y-2">
              {[
                { who: '业主', name: c.owner.name, phone: c.owner.phone, color: 'haze', checked: true },
                { who: '装修公司', name: c.company.contact + '（' + c.company.name + '）', phone: c.company.phone, color: 'terracotta', checked: true },
                { who: '调解员', name: c.mediator.name + '（主持）', phone: '135****6677', color: 'wood', checked: true },
              ].map((p, i) => (
                <label key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-ivory-50/60 border border-ivory-100 hover:bg-ivory-50 cursor-pointer transition-colors">
                  <input type="checkbox" defaultChecked={p.checked} className="w-4 h-4 accent-terracotta-500" />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.color === 'haze' ? 'bg-haze-100 text-haze-700' : p.color === 'terracotta' ? 'bg-terracotta-100 text-terracotta-700' : 'bg-wood-100 text-wood-700'}`}>{p.who}</span>
                  <span className="text-sm text-carbon-800 font-medium">{p.name}</span>
                  <span className="text-[11px] text-ivory-500 font-mono ml-auto">{p.phone}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 录入调解方案 Modal */}
      <Modal
        open={planOpen}
        onCancel={() => setPlanOpen(false)}
        title={<div className="flex items-center gap-2"><PenLine className="w-5 h-5 text-terracotta-600" /><span className="font-serif">录入调解方案</span></div>}
        width={780}
        okText="保存并推送双方"
        cancelText="存为草稿"
        onOk={() => {
          message.loading({ content: '正在生成调解方案并推送...', key: 'plan', duration: 0 });
          setTimeout(() => {
            message.success({ content: '✅ 调解方案已推送！双方可在小程序查看并电子签名确认', key: 'plan', duration: 4 });
            setPlanOpen(false);
          }, 1400);
        }}
      >
        <div className="space-y-5 -mt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1">
              <p className="text-[11px] text-ivory-500 font-mono">涉事项目</p>
              <p className="text-sm font-medium text-carbon-800">{c.projectName}</p>
              <p className="text-[11px] text-ivory-500 mt-1">争议类型：{c.category} · 延期约27天</p>
            </div>
            <div className="p-4 rounded-xl bg-terracotta-50/50 border border-terracotta-200 space-y-1">
              <p className="text-[11px] text-terracotta-600 font-mono">争议金额区间</p>
              <p className="text-sm font-semibold text-carbon-800">¥8,000 ~ ¥32,000</p>
              <p className="text-[11px] text-ivory-500 mt-1">业主诉求 / 公司提议</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">责任划分（%） · 拖动滑块分配</label>
            <div className="p-5 rounded-xl border border-ivory-200 bg-gradient-to-r from-haze-50/40 to-terracotta-50/40 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-haze-700"><User className="w-4 h-4" />业主责任 {planForm.ownerLiability}%</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-terracotta-700"><Building2 className="w-4 h-4" />装修公司责任 {planForm.companyLiability}%</span>
              </div>
              <Slider
                range={false}
                min={0} max={100} step={5}
                value={planForm.ownerLiability}
                tooltip={{ formatter: v => `业主 ${v}% / 公司 ${100 - (v || 0)}%` }}
                onChange={v => setPlanForm({ ...planForm, ownerLiability: v as number, companyLiability: 100 - (v as number) })}
                styles={{ track: { background: 'linear-gradient(to right, #6B8E9F, #C4623A)' }, handle: { borderColor: '#8B6914' } }}
              />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-[11px] text-haze-700 bg-white/70 p-2.5 rounded-lg border border-haze-100">
                  <p className="font-semibold mb-1">业主原因（占比）</p>
                  <ul className="list-disc pl-4 space-y-0.5"><li>中途变更厨房布局</li><li>新增阳台封闭工程</li></ul>
                </div>
                <div className="text-[11px] text-terracotta-700 bg-white/70 p-2.5 rounded-lg border border-terracotta-100">
                  <p className="font-semibold mb-1">装修公司原因（占比）</p>
                  <ul className="list-disc pl-4 space-y-0.5"><li>工长频繁更换管理混乱</li><li>变更后工期评估不足</li></ul>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block flex items-center gap-1"><span className="text-terracotta-600">¥</span>赔偿金额（元）</label>
              <InputNumber
                prefix={<span className="text-terracotta-600 font-semibold">¥</span>}
                value={planForm.amount}
                onChange={v => setPlanForm({ ...planForm, amount: Number(v) || 0 })}
                className="!w-full"
                style={{ height: 42, borderRadius: 10 }}
                step={1000}
                min={0}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => Number(v!.replace(/\$\s?|(,*)/g, ''))}
              />
              <p className="text-[10px] text-ivory-500 mt-1">参照：日租金约 ¥260 × 27天 = ¥7,020 + 误工费估算</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />付款截止日期</label>
              <DatePicker
                defaultValue={dayjs(planForm.deadline)}
                onChange={d => setPlanForm({ ...planForm, deadline: d?.format('YYYY-MM-DD') || '' })}
                className="!w-full"
                style={{ height: 42, borderRadius: 10 }}
                disabledDate={d => d && d.valueOf() < Date.now()}
              />
              <p className="text-[10px] text-ivory-500 mt-1">逾期未付平台将从保证金直接划扣</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">方案详细描述（双方权利义务）</label>
            <TextArea
              rows={5}
              value={planForm.description}
              onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
              className="!rounded-xl text-sm"
            />
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 space-y-0.5">
              <p className="font-semibold">推送须知</p>
              <p>1. 方案推送后双方有 <span className="font-bold">72小时</span> 电子签名确认期；</p>
              <p>2. 任一方拒绝签署视为调解失败，可升级平台仲裁；</p>
              <p>3. 双方签署后方案即时生效，平台将全程监督执行。</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* 达成一致关单 Modal */}
      <Modal
        open={closeOpen}
        onCancel={() => setCloseOpen(false)}
        title={<div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-emerald-600" /><span className="font-serif">达成一致 · 结案确认</span></div>}
        width={720}
        okText={confirmState.owner && confirmState.company ? '✓ 确认结案并归档' : '请先完成双方签名'}
        okButtonProps={{ disabled: !(confirmState.owner && confirmState.company) }}
        cancelText="返回继续调解"
        onOk={doClose}
      >
        <div className="space-y-5 -mt-1">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-haze-50 border-2 border-emerald-200 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 mb-3">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-serif font-bold text-xl text-carbon-800 mb-1.5">🎉 双方已达成一致</h3>
            <p className="text-sm text-ivory-600">即将完成结案归档，以下是本次调解的核心摘要</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-ivory-200 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${confirmState.owner ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-ivory-200'}`}>{c.owner.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-carbon-800">{c.owner.name}（业主）</p>
                  {confirmState.owner
                    ? <p className="text-[11px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 已签名确认 · {dayjs().format('MM-DD HH:mm')}</p>
                    : <button onClick={() => setSignDrawers({ owner: true, company: signDrawers.company })} className="text-[11px] text-terracotta-600 underline hover:text-terracotta-700">待签名 · 点击打开签名页</button>}
                </div>
              </div>
              <div className="text-[10px] text-ivory-400 font-mono border-t border-ivory-100 pt-2">IP 117.136.xx.12 · 设备 iOS 17</div>
            </div>
            <div className="p-4 rounded-xl border border-ivory-200 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${confirmState.company ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-ivory-200'}`}>{c.company.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-carbon-800">{c.company.name}（装修公司）</p>
                  {confirmState.company
                    ? <p className="text-[11px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 已签名确认 · {dayjs().format('MM-DD HH:mm')}</p>
                    : <button onClick={() => setSignDrawers({ owner: signDrawers.owner, company: true })} className="text-[11px] text-terracotta-600 underline hover:text-terracotta-700">待签名 · 点击打开签名页</button>}
                </div>
              </div>
              <div className="text-[10px] text-ivory-400 font-mono border-t border-ivory-100 pt-2">IP 223.104.xx.88 · 设备 Win11 Chrome</div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-ivory-200 bg-ivory-50/40 space-y-2.5">
            <p className="text-xs font-semibold text-carbon-700 flex items-center gap-1.5"><FileText className="w-4 h-4" />调解方案核心摘要</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex gap-2"><span className="text-ivory-500 shrink-0 w-24">责任划分</span><span className="text-carbon-800">业主 {planForm.ownerLiability}% / 公司 {planForm.companyLiability}%</span></div>
              <div className="flex gap-2"><span className="text-ivory-500 shrink-0 w-24">赔偿金额</span><span className="text-terracotta-700 font-mono font-bold">¥ {planForm.amount.toLocaleString()}</span></div>
              <div className="flex gap-2"><span className="text-ivory-500 shrink-0 w-24">付款期限</span><span className="text-carbon-800">{planForm.deadline} 前</span></div>
              <div className="flex gap-2"><span className="text-ivory-500 shrink-0 w-24">结案后约束</span><span className="text-carbon-800">双方不再就工期问题索赔</span></div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">确认结案后，调解方案将同步 <span className="font-semibold">区块链存证</span>，双方需严格履行。逾期平台将从服务商保证金划扣赔偿款，并对违约方启动信用评分扣减。</p>
          </div>
        </div>
      </Modal>

      {/* 升级平台仲裁 Modal */}
      <Modal
        open={escalateOpen}
        onCancel={() => setEscalateOpen(false)}
        title={<div className="flex items-center gap-2"><Gavel className="w-5 h-5 text-rose-600" /><span className="font-serif">升级至平台仲裁</span></div>}
        width={700}
        okText="提交仲裁申请"
        okButtonProps={{ danger: true }}
        cancelText="返回继续调解"
        onOk={doEscalate}
      >
        <div className="space-y-5 -mt-1">
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertOctagon className="w-5 h-5" />
              <span className="font-bold text-sm">⚠️ 升级仲裁须知（请调解员认真阅读）</span>
            </div>
            <ul className="text-[11px] text-rose-800/80 space-y-1 list-disc pl-6">
              <li>仲裁由平台仲裁委员会（3名资深专家）审理，<span className="font-semibold">结果为最终裁决</span>，不可申诉；</li>
              <li>仲裁周期约 <span className="font-semibold">7~10 个工作日</span>，期间项目可正常施工；</li>
              <li>仲裁费用按涉案金额的 3% 收取，由<span className="font-semibold">败诉方承担</span>；</li>
              <li>涉及违法违规的将同步移交住建和市场监管部门。</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">申请方</label>
              <select className="input-base text-sm">
                <option>业主 王先生</option>
                <option>装修公司 东易日盛</option>
                <option>调解员 建议升级（调解破裂）</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">仲裁原因分类</label>
              <select className="input-base text-sm">
                <option>调解方案双方无法达成一致</option>
                <option>一方拒绝参与调解</option>
                <option>涉及合同条款重大歧义</option>
                <option>存在疑似欺诈或违规行为</option>
                <option>其他（请在理由中说明）</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">升级仲裁理由（必填，不少于30字）</label>
            <TextArea
              rows={4}
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              placeholder="请详细说明调解过程、双方主要争议焦点、无法达成一致的核心原因、以及建议仲裁委重点核查的内容..."
              className="!rounded-xl text-sm"
            />
            <div className="flex justify-between mt-1 text-[10px]">
              <span className={escalateReason.length > 30 ? 'text-emerald-600' : 'text-ivory-400'}>字数：{escalateReason.length} / 30</span>
              <button onClick={() => setEscalateReason('经过2轮调解会议，双方在延期责任划分比例上存在根本分歧。业主坚持公司承担90%以上责任，公司坚持最多承担40%。调解员尝试了4种中间方案均被一方或双方拒绝。证据显示双方都有过错，但赔偿金额差距达¥24,000，继续调解已无实质性进展，建议移交仲裁委员会审理裁决。')} className="text-haze-600 hover:text-haze-700 font-mono underline decoration-dotted">📋 使用调解总结模板</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-carbon-700 mb-1.5 block">补充仲裁证据（可选）</label>
            <div className="border-2 border-dashed border-ivory-200 rounded-xl p-6 text-center hover:border-haze-300 hover:bg-haze-50/30 transition-colors cursor-pointer group" onClick={() => message.info('模拟：打开文件选择器')}>
              <Paperclip className="w-8 h-8 text-ivory-300 mx-auto mb-2 group-hover:text-haze-400 transition-colors" />
              <p className="text-sm text-carbon-700">点击或拖拽上传补充证据材料</p>
              <p className="text-[11px] text-ivory-400 mt-1">支持 PDF、图片、Word，单个文件不超过 30MB</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-ivory-50/60 border border-ivory-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-wood-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-ivory-700 leading-relaxed">提交后平台将在 24 小时内完成仲裁立案，<span className="font-semibold">系统会自动冻结本案相关服务商保证金</span>（如适用），并同步通知双方准备仲裁陈述材料。</p>
          </div>
        </div>
      </Modal>

      {/* 业主电子签名 Drawer */}
      <Drawer
        open={signDrawers.owner}
        onClose={() => setSignDrawers({ ...signDrawers, owner: false })}
        title={<div className="flex items-center gap-2"><PenLine className="w-5 h-5 text-haze-600" /><span className="font-serif">业主电子签名 · {c.owner.name}</span></div>}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { const ctx = ownerSignRef.current?.getContext('2d'); if (ctx) ctx.clearRect(0, 0, ownerSignRef.current!.width, ownerSignRef.current!.height); message.info('画布已清空'); }} className="btn-ghost !text-sm"><X className="w-4 h-4" /> 清除重签</button>
            <button onClick={() => { setSignDrawers({ ...signDrawers, owner: false, company: true }); message.info('业主暂不签名，跳转公司签名...'); }} className="btn-secondary !text-sm">跳过 · 公司先签</button>
            <button onClick={() => confirmSign('owner')} className="btn-primary !text-sm inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4" /> 确认签名有效</button>
          </div>
        }
      >
        <div className="space-y-4 -mt-2">
          <div className="p-4 rounded-xl bg-haze-50/60 border border-haze-200 space-y-1.5 text-[11px] text-haze-800">
            <p className="font-semibold">📝 签名前请认真阅读</p>
            <ul className="list-disc pl-4 space-y-0.5"><li>本人已知晓调解方案全部内容，接受责任划分与赔偿条款；</li><li>本签名等同于手写签名，具备同等法律效力；</li><li>签名数据将同步区块链存证，不可篡改。</li></ul>
          </div>
          <div className="p-4 rounded-xl border border-ivory-200 bg-white space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-ivory-500">调解方案编号</span><span className="font-mono text-carbon-800">MED-{c.id}-{dayjs().format('YYYYMMDD')}</span></div>
            <div className="flex justify-between"><span className="text-ivory-500">赔偿金额</span><span className="font-mono font-bold text-terracotta-700">¥ {planForm.amount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-ivory-500">本人责任占比</span><span className="font-mono font-bold text-carbon-800">{planForm.ownerLiability}%</span></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-carbon-700 mb-2">✍️ 请在下方空白区域手写签名</p>
            <div className="border-2 border-dashed border-haze-300 rounded-2xl bg-white overflow-hidden">
              <canvas ref={ownerSignRef} width={500} height={220} className="w-full block cursor-crosshair touch-none" />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-ivory-400">
              <span>💡 建议使用鼠标或触控笔书写，确保签名清晰可辨</span>
              <span className="font-mono">Canvas 500 × 220px</span>
            </div>
          </div>
        </div>
      </Drawer>

      {/* 公司电子签名 Drawer */}
      <Drawer
        open={signDrawers.company}
        onClose={() => setSignDrawers({ ...signDrawers, company: false })}
        title={<div className="flex items-center gap-2"><PenLine className="w-5 h-5 text-terracotta-600" /><span className="font-serif">装修公司电子签名 · {c.company.name}</span></div>}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { const ctx = companySignRef.current?.getContext('2d'); if (ctx) ctx.clearRect(0, 0, companySignRef.current!.width, companySignRef.current!.height); message.info('画布已清空'); }} className="btn-ghost !text-sm"><X className="w-4 h-4" /> 清除重签</button>
            <button onClick={() => { setSignDrawers({ owner: true, company: false }); message.info('跳转业主签名...'); }} className="btn-secondary !text-sm">返回 · 业主先签</button>
            <button onClick={() => confirmSign('company')} className="btn-primary !text-sm inline-flex items-center gap-1.5"><BadgeCheck className="w-4 h-4" /> 确认签名有效</button>
          </div>
        }
      >
        <div className="space-y-4 -mt-2">
          <div className="p-4 rounded-xl bg-terracotta-50/50 border border-terracotta-200 space-y-1.5 text-[11px] text-terracotta-800">
            <p className="font-semibold">📝 签名前请认真阅读（授权人：{c.company.contact}）</p>
            <ul className="list-disc pl-4 space-y-0.5"><li>本人已获得公司授权，有权代表公司签署本调解方案；</li><li>公司已知晓方案全部内容，接受责任划分与赔偿条款；</li><li>逾期不付平台有权从保证金直接划扣对应金额。</li></ul>
          </div>
          <div className="p-4 rounded-xl border border-ivory-200 bg-white space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-ivory-500">调解方案编号</span><span className="font-mono text-carbon-800">MED-{c.id}-{dayjs().format('YYYYMMDD')}</span></div>
            <div className="flex justify-between"><span className="text-ivory-500">赔偿金额</span><span className="font-mono font-bold text-terracotta-700">¥ {planForm.amount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-ivory-500">公司责任占比</span><span className="font-mono font-bold text-carbon-800">{planForm.companyLiability}%</span></div>
            <div className="flex justify-between"><span className="text-ivory-500">付款截止</span><span className="font-mono font-bold text-wood-700">{planForm.deadline}</span></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-carbon-700 mb-2">✍️ 请授权代表在下方手写签名</p>
            <div className="border-2 border-dashed border-terracotta-300 rounded-2xl bg-white overflow-hidden">
              <canvas ref={companySignRef} width={500} height={220} className="w-full block cursor-crosshair touch-none" />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-ivory-400">
              <span>💡 签名需与营业执照授权代表人姓名一致</span>
              <span className="font-mono">Canvas 500 × 220px</span>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
