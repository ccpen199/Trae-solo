import { useAppStore } from '@/store/appStore';
import { mockCompensationRules } from '@/data/mockData';
import type { DisputeType, Evidence, Dispute, SeverityLevel, ExpectedSolution, OrderInfo } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Video, CheckCircle, Clock, AlertCircle, ChevronDown, FileText, Scale, Plus, X, Award, Send, MessageCircle, ChevronLeft, Package, User, RotateCcw, Clock3, Shield, ThumbsUp, ArrowRight, MessageSquare, Headphones, XCircle, Zap } from 'lucide-react';
import { useRef, useState } from 'react';

type TabKey = 'list' | 'submit' | 'rules';

const DISPUTE_TYPES = [
  { value: 'service_quality' as DisputeType, label: '服务质量', color: 'bg-blue-500', scenarios: ['服务未达预期', '与描述不符', '不专业', '遗漏项目'] },
  { value: 'delay' as DisputeType, label: '服务延误', color: 'bg-amber-500', scenarios: ['未按时到达', '服务超时', '临时取消', '多次改期'] },
  { value: 'overcharge' as DisputeType, label: '乱收费', color: 'bg-rose-500', scenarios: ['未明码标价', '额外收费', '价格不符', '强制消费'] },
  { value: 'damage' as DisputeType, label: '物品损坏', color: 'bg-purple-500', scenarios: ['物品损坏', '遗失物品', '家具划痕', '装修损坏'] },
];
const STATUS_STYLES = {
  submitted: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Clock },
  reviewing: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: AlertCircle },
  resolved: { bg: 'bg-mint-50', text: 'text-mint-600', border: 'border-mint-200', icon: CheckCircle },
} as const;
const SEVERITY_OPTS = [
  { value: 'mild' as SeverityLevel, label: '轻微', cls: 'bg-gray-100 text-gray-600' },
  { value: 'normal' as SeverityLevel, label: '一般', cls: 'bg-blue-100 text-blue-600' },
  { value: 'serious' as SeverityLevel, label: '严重', cls: 'bg-orange-100 text-orange-600' },
  { value: 'critical' as SeverityLevel, label: '非常严重', cls: 'bg-rose-100 text-rose-600' },
];
const SOLUTION_OPTS = [
  { value: 'refund' as ExpectedSolution, label: '退款', icon: Zap },
  { value: 'redo' as ExpectedSolution, label: '重做', icon: RotateCcw },
  { value: 'compensation' as ExpectedSolution, label: '赔偿', icon: Award },
  { value: 'apology' as ExpectedSolution, label: '道歉', icon: ThumbsUp },
];
const PAYMENT_STEPS = [
  { label: '提交申请', desc: '填写信息上传证据' },
  { label: '平台受理', desc: '24小时内介入' },
  { label: '调查核实', desc: '双方举证判定' },
  { label: '仲裁结果', desc: '出具仲裁决定' },
  { label: '赔付到账', desc: '1-3工作日到账' },
];
const FAQ_QUICK = ['如何上传更多证据？', '仲裁需要多长时间？', '对结果不满意怎么办？', '赔偿款多久到账？'];
const inputCls = 'w-full px-4 py-3 rounded-xl2 border border-warm-card bg-warm-bg text-brand placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all';
const cardCls = 'bg-white rounded-3xl2 shadow-soft border border-warm-card';

export default function DisputePage() {
  const { disputes, addDispute, historyOrders, addMessage } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [currentDisputeId, setCurrentDisputeId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [disputeType, setDisputeType] = useState<DisputeType | null>(null);
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);
  const [solution, setSolution] = useState<ExpectedSolution | null>(null);
  const [description, setDescription] = useState('');
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentDispute = disputes.find((d) => d.id === currentDisputeId) || null;
  const selectedOrder = historyOrders.find((o) => o.orderId === selectedOrderId) || null;
  const selectedRule = disputeType ? mockCompensationRules.find((r) => r.type === disputeType) : null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
      const reader = new FileReader();
      reader.onload = (e) => setEvidences((prev) => [...prev, { id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: file.type.startsWith('image/') ? 'image' : 'video', url: e.target?.result as string, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (!selectedOrderId || !disputeType || !severity || !solution || !description.trim()) return;
    const order = historyOrders.find((o) => o.orderId === selectedOrderId)!;
    const t = DISPUTE_TYPES.find((d) => d.value === disputeType)!;
    const orderInfo: OrderInfo = { ...order, disputeAmount: order.amount, claimAmount: Math.round(order.amount * 0.5), platformPayout: 0 };
    addDispute({ orderId: selectedOrderId, type: disputeType, typeLabel: t.label, description, evidences, severity, expectedSolution: solution, orderInfo } as any);
    setSubmittedId(`d-${Date.now()}`);
  };
  const resetSubmit = () => { setSelectedOrderId(''); setDisputeType(null); setSeverity(null); setSolution(null); setDescription(''); setEvidences([]); setSubmittedId(null); };
  const handleSendChat = () => {
    if (!chatInput.trim() || !currentDisputeId) return;
    addMessage(currentDisputeId, { sender: 'user', senderName: '我', content: chatInput, avatar: '' });
    setChatInput('');
  };

  const renderEvidence = (e: Evidence, removable = false, onClick?: () => void) => (
    <div key={e.id} className="relative aspect-square rounded-xl2 overflow-hidden bg-warm-card group cursor-pointer" onClick={onClick}>
      {e.type === 'image' ? <img src={e.url} alt={e.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        : <div className="w-full h-full flex items-center justify-center bg-brand/5"><Video size={20} className="text-brand-300" /></div>}
      {removable && <button onClick={(ev) => { ev.stopPropagation(); setEvidences((p) => p.filter((x) => x.id !== e.id)); }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>}
    </div>
  );

  const renderCard = (d: Dispute) => {
    const ss = STATUS_STYLES[d.status]; const SI = ss.icon; const tm = DISPUTE_TYPES.find((t) => t.value === d.type);
    return (
      <motion.div key={d.id} layout className={`${cardCls} overflow-hidden`}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="font-semibold text-brand">{d.orderInfo.orderId}</span>
            <span className={`${tm?.color} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}>{d.typeLabel}</span>
            <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${ss.bg} ${ss.text} ${ss.border}`}><SI size={12} />{d.statusLabel}</span>
          </div>
          <p className="text-sm text-gray-500 mb-3 line-clamp-1">{d.description}</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[{ l: '订单金额', v: `¥${d.orderInfo.amount}`, c: 'text-brand' },
              { l: '申请赔偿', v: `¥${d.orderInfo.claimAmount || 0}`, c: 'text-rose-500' },
              { l: '平台赔付', v: `¥${d.orderInfo.platformPayout || 0}`, c: 'text-mint-600' }].map((x) => (
              <div key={x.l} className="bg-warm-bg rounded-xl p-2 text-center">
                <div className="text-xs text-gray-400 mb-0.5">{x.l}</div>
                <div className={`font-semibold ${x.c}`}>{x.v}</div>
              </div>
            ))}
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">处理进度</span>
              <span className="text-brand font-medium">{d.progress}%</span>
            </div>
            <div className="w-full h-2 bg-warm-card rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${d.progress}%` }} className="h-full bg-gradient-to-r from-brand to-mint rounded-full" />
            </div>
          </div>
          <button onClick={() => setCurrentDisputeId(d.id)}
            className="w-full py-2.5 rounded-xl2 bg-brand/5 text-brand font-medium hover:bg-brand/10 transition-colors flex items-center justify-center gap-1">
            查看详情 <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderDetail = () => {
    if (!currentDispute) return null;
    const d = currentDispute; const ss = STATUS_STYLES[d.status]; const SI = ss.icon;
    const infoItems = (items: { k: string; v: string; bold?: boolean; red?: boolean; green?: boolean }[]) => items.map((x) => (
      <div key={x.k} className="flex justify-between"><span className="text-gray-500">{x.k}</span><span className={`${x.bold ? 'font-semibold' : ''} ${x.red ? 'text-rose-500 font-semibold' : x.green ? 'text-mint-600 font-semibold' : 'text-brand'}`}>{x.v}</span></div>
    ));
    return (
      <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
        <button onClick={() => setCurrentDisputeId(null)} className="flex items-center gap-1 text-brand hover:underline">
          <ChevronLeft size={16} /> 返回列表
        </button>
        <div className={`${cardCls} p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-brand mb-1">纠纷详情</h2>
              <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${ss.bg} ${ss.text} ${ss.border}`}><SI size={12} />{d.statusLabel}</span>
            </div>
            <span className="text-sm text-gray-400">{d.createdAt}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-warm-bg rounded-xl2 p-4">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Package size={12} /> 订单信息</div>
              <div className="space-y-1.5 text-sm">
                {infoItems([{ k: '订单号', v: d.orderInfo.orderId }, { k: '服务类型', v: d.orderInfo.serviceType },
                  { k: '服务商', v: d.orderInfo.providerName }, { k: '下单时间', v: d.orderInfo.orderTime },
                  { k: '订单金额', v: `¥${d.orderInfo.amount}`, bold: true }])}
              </div>
            </div>
            <div className="bg-warm-bg rounded-xl2 p-4">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><FileText size={12} /> 纠纷信息</div>
              <div className="space-y-1.5 text-sm">
                {infoItems([{ k: '纠纷类型', v: d.typeLabel }, { k: '申请时间', v: d.createdAt },
                  { k: '申请赔偿', v: `¥${d.orderInfo.claimAmount || 0}`, red: true },
                  { k: '平台赔付', v: `¥${d.orderInfo.platformPayout || 0}`, green: true },
                  ...(d.csAgent ? [{ k: '负责客服', v: d.csAgent }] : [])])}
              </div>
            </div>
          </div>
          <div className="bg-mint-50 border border-mint-200 rounded-xl2 p-4">
            <div className="text-sm font-semibold text-mint-700 mb-1">纠纷描述</div>
            <p className="text-sm text-mint-600">{d.description}</p>
          </div>
        </div>
        <div className={`${cardCls} p-6`}>
          <h3 className="font-bold text-brand mb-3 flex items-center gap-2"><Image size={16} /> 证据材料</h3>
          {d.evidences.length > 0
            ? <div className="grid grid-cols-4 md:grid-cols-6 gap-2">{d.evidences.map((e) => renderEvidence(e, false, () => setLightboxUrl(e.url)))}</div>
            : <div className="text-sm text-gray-400 py-6 text-center bg-warm-bg rounded-xl2">暂无证据材料</div>}
        </div>
        <div className={`${cardCls} p-6`}>
          <h3 className="font-bold text-brand mb-4 flex items-center gap-2"><Clock size={16} /> 处理进度</h3>
          <div className="space-y-0">
            {d.timeline.map((step, i) => (
              <div key={i} className="flex gap-4 pb-4 last:pb-0 relative">
                {i < d.timeline.length - 1 && <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${step.done ? 'bg-mint' : 'bg-gray-200'}`} />}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${step.done ? 'bg-mint text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step.done ? <CheckCircle size={14} /> : <Clock size={14} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${step.done ? 'text-brand' : 'text-gray-400'}`}>{step.label}</span>
                    <span className="text-xs text-gray-400">{step.time}</span>
                  </div>
                  {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${cardCls} p-6`}>
          <h3 className="font-bold text-brand mb-4 flex items-center gap-2"><MessageCircle size={16} /> 双方沟通</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {d.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user' ? 'bg-brand text-white' : msg.sender === 'cs' ? 'bg-mint text-white' : 'bg-amber-400 text-white'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : msg.sender === 'cs' ? <Headphones size={14} /> : <Package size={14} />}
                </div>
                <div className={`max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 text-xs text-gray-400 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    <span>{msg.senderName}</span><span>{msg.time}</span>
                  </div>
                  <div className={`rounded-2xl px-4 py-2 text-sm ${
                    msg.sender === 'user' ? 'bg-brand text-white rounded-tr-sm'
                      : msg.sender === 'cs' ? 'bg-mint-50 text-mint-700 rounded-tl-sm border border-mint-100'
                      : 'bg-amber-50 text-amber-700 rounded-tl-sm border border-amber-100'
                  }`}>{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} placeholder="输入留言..."
              className="flex-1 px-4 py-2 rounded-xl2 border border-warm-card bg-warm-bg text-sm text-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            <button onClick={handleSendChat} className="px-4 py-2 bg-brand text-white rounded-xl2 hover:bg-brand-600 transition-colors"><Send size={16} /></button>
          </div>
        </div>
        {d.status === 'resolved' ? (
          <div className="bg-gradient-to-r from-mint-50 to-mint-100 rounded-3xl2 shadow-soft border border-mint-200 p-6">
            <h3 className="font-bold text-mint-700 mb-3 flex items-center gap-2"><Award size={18} /> 仲裁结果</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div><div className="text-xs text-mint-600 mb-1">赔偿金额</div><div className="text-2xl font-bold text-mint-700">¥{d.compensationAmount}</div></div>
              {d.payoutTime && <div><div className="text-xs text-mint-600 mb-1">到账时间</div><div className="text-lg font-semibold text-mint-700">{d.payoutTime}</div></div>}
            </div>
            <p className="text-sm text-mint-600 mb-4">{d.result}</p>
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl2 bg-white text-brand font-medium border border-mint-200 hover:bg-mint-50 transition-colors">申请复查</button>
              <button className="flex-1 py-2.5 rounded-xl2 bg-mint text-white font-medium hover:bg-mint-600 transition-colors">确认无异议</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl2 bg-white text-brand font-medium border border-warm-card hover:bg-warm-bg transition-colors shadow-soft">补充证据</button>
            <button onClick={() => setShowChat(true)} className="flex-1 py-3 rounded-xl2 bg-brand text-white font-medium hover:bg-brand-600 transition-colors shadow-lg shadow-brand/20">联系客服</button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSubmit = () => {
    if (submittedId) {
      return (
        <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`${cardCls} shadow-card p-10 text-center`}>
          <div className="w-20 h-20 rounded-full bg-mint-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-mint" />
          </div>
          <h2 className="text-2xl font-bold text-brand mb-2">提交成功！</h2>
          <p className="text-gray-500 mb-6">您的纠纷申请已成功提交</p>
          <div className="bg-warm-bg rounded-xl2 p-5 mb-6 text-left space-y-2">
            {[{ k: '纠纷编号', v: submittedId, mono: true }, { k: '预计处理时间', v: '3-5个工作日' }, { k: '当前状态', v: '待客服介入', amber: true }].map((x: any) => (
              <div key={x.k} className="flex justify-between text-sm"><span className="text-gray-500">{x.k}</span>
                <span className={`font-medium ${x.mono ? 'text-brand font-mono' : x.amber ? 'text-amber-600' : 'text-brand'}`}>{x.v}</span></div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={resetSubmit} className="flex-1 py-3 rounded-xl2 border border-warm-card text-brand font-medium hover:bg-warm-bg transition-colors">继续提交</button>
            <button onClick={() => { setActiveTab('list'); resetSubmit(); }} className="flex-1 py-3 rounded-xl2 bg-brand text-white font-medium hover:bg-brand-600 transition-colors">查看进度</button>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div key="submit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
        className={`${cardCls} shadow-card p-8`}>
        <h2 className="text-xl font-bold text-brand mb-6 flex items-center gap-2"><Plus size={20} className="text-mint" />提交新纠纷</h2>
        <div className="space-y-5">
          <div className="relative">
            <label className="block text-sm font-medium text-brand mb-2">选择订单</label>
            <button onClick={() => setOrderOpen(!orderOpen)} className={`${inputCls} text-left flex items-center justify-between`}>
              <span className={selectedOrderId ? 'text-brand' : 'text-gray-400'}>
                {selectedOrder ? `${selectedOrder.orderId} - ${selectedOrder.serviceType}` : '请选择关联订单'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            <AnimatePresence>{orderOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-warm-card rounded-xl2 shadow-lg z-20 max-h-60 overflow-y-auto">
                {historyOrders.map((o) => (
                  <button key={o.orderId} onClick={() => { setSelectedOrderId(o.orderId); setOrderOpen(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-warm-bg transition-colors border-b border-warm-card last:border-b-0">
                    <div className="font-medium text-brand text-sm">{o.orderId}</div>
                    <div className="text-xs text-gray-500">{o.serviceType} · {o.providerName} · ¥{o.amount}</div>
                  </button>
                ))}
              </motion.div>
            )}</AnimatePresence>
          </div>
          {selectedOrder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-warm-bg rounded-xl2 p-4">
              <div className="text-xs text-gray-400 mb-2">订单信息预览</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">服务：</span><span className="text-brand">{selectedOrder.serviceType}</span></div>
                <div><span className="text-gray-500">金额：</span><span className="text-brand font-semibold">¥{selectedOrder.amount}</span></div>
                <div><span className="text-gray-500">服务商：</span><span className="text-brand">{selectedOrder.providerName}</span></div>
                <div><span className="text-gray-500">时间：</span><span className="text-brand">{selectedOrder.orderTime}</span></div>
              </div>
            </motion.div>
          )}
          <div>
            <label className="block text-sm font-medium text-brand mb-3">纠纷类型</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{DISPUTE_TYPES.map((t) => (
              <button key={t.value} onClick={() => setDisputeType(t.value)}
                className={`p-4 rounded-xl2 border-2 text-left transition-all ${disputeType === t.value ? 'border-brand bg-brand/5' : 'border-warm-card bg-warm-bg hover:border-brand-200'}`}>
                <div className={`w-2 h-2 rounded-full ${t.color} mb-2`} />
                <div className="font-medium text-brand text-sm">{t.label}</div>
              </button>
            ))}</div>
          </div>
          {selectedRule && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-mint-50 border border-mint-200 rounded-xl2 p-4">
            <div className="flex items-start gap-3"><Scale size={18} className="text-mint-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm"><div className="font-semibold text-mint-700 mb-1">{selectedRule.typeLabel} · 赔偿标准</div>
                <div className="text-mint-600 space-y-0.5"><div>赔付比例：{selectedRule.ratio}</div><div>最高赔偿：¥{selectedRule.maxAmount}</div>
                  <div className="text-mint-500 text-xs mt-1">{selectedRule.description}</div></div></div></div>
          </motion.div>}
          <div>
            <label className="block text-sm font-medium text-brand mb-3">问题严重程度</label>
            <div className="grid grid-cols-4 gap-2">{SEVERITY_OPTS.map((s) => (
              <button key={s.value} onClick={() => setSeverity(s.value)}
                className={`py-2.5 rounded-xl2 text-sm font-medium transition-all ${severity === s.value ? `${s.cls} ring-2 ring-offset-1` : 'bg-warm-bg text-gray-500 hover:bg-warm-card'}`}>
                {s.label}
              </button>
            ))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand mb-3">期望解决方案</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{SOLUTION_OPTS.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.value} onClick={() => setSolution(s.value)}
                  className={`p-3 rounded-xl2 border-2 text-center transition-all ${solution === s.value ? 'border-brand bg-brand/5' : 'border-warm-card bg-warm-bg hover:border-brand-200'}`}>
                  <Icon size={18} className={`mx-auto mb-1 ${solution === s.value ? 'text-brand' : 'text-gray-400'}`} />
                  <div className="text-xs font-medium text-brand">{s.label}</div>
                </button>
              );
            })}</div>
          </div>
          <div><label className="block text-sm font-medium text-brand mb-2">问题描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="请详细描述遇到的问题" className={`${inputCls} resize-none`} /></div>
          <div><label className="block text-sm font-medium text-brand mb-2">举证材料</label>
            <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-brand-200 rounded-xl2 p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all bg-warm-bg">
              <Upload size={28} className="text-brand-300 mx-auto mb-2" /><div className="text-sm text-brand font-medium">点击或拖拽上传</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-3">
                <span className="flex items-center gap-1"><Image size={12} /> 图片</span>
                <span className="flex items-center gap-1"><Video size={12} /> 视频</span></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            {evidences.length > 0 && <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">{evidences.map((e) => renderEvidence(e, true))}</div>}
          </div>
          <button onClick={handleSubmit} disabled={!selectedOrderId || !disputeType || !severity || !solution || !description.trim()}
            className="w-full py-4 rounded-xl2 bg-gradient-to-r from-brand to-brand-400 text-white font-bold text-lg hover:from-brand-600 hover:to-brand-500 transition-all shadow-lg shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Send size={18} />提交纠纷申请</button>
        </div>
      </motion.div>
    );
  };

  const renderRules = () => (
    <motion.div key="rules" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
      <div className={`${cardCls} shadow-card p-6`}>
        <h2 className="text-xl font-bold text-brand mb-4 flex items-center gap-2"><Scale size={20} /> 赔偿标准说明</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {mockCompensationRules.map((rule, idx) => {
            const tm = DISPUTE_TYPES.find((t) => t.value === rule.type);
            return (
              <motion.div key={rule.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className="border border-warm-card rounded-2xl p-5 hover:shadow-soft transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full ${tm?.color}`} />
                  <h3 className="font-bold text-brand text-lg">{rule.typeLabel}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-warm-bg rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-400">赔付比例</div>
                    <div className="font-bold text-brand">{rule.ratio}</div>
                  </div>
                  <div className="bg-mint-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-mint-600">最高赔偿</div>
                    <div className="font-bold text-mint-600">¥{rule.maxAmount}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                <div className="pt-3 border-t border-warm-card">
                  <div className="text-xs text-gray-400 mb-2">常见场景</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tm?.scenarios.map((s) => (
                      <span key={s} className="text-xs px-2 py-1 bg-brand/5 text-brand-600 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className={`${cardCls} shadow-card p-6`}>
        <h3 className="text-lg font-bold text-brand mb-5 flex items-center gap-2"><Zap size={18} className="text-mint" /> 赔付流程</h3>
        <div className="flex items-start justify-between relative">
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200" />
          {PAYMENT_STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center z-10 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-mint text-white flex items-center justify-center font-bold text-sm mb-2 shadow-lg shadow-brand/20">
                {i + 1}
              </div>
              <div className="text-sm font-medium text-brand text-center">{step.label}</div>
              <div className="text-xs text-gray-400 text-center mt-1 max-w-[100px]">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-r from-brand to-brand-600 rounded-3xl2 shadow-card p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield size={18} /> 平台承诺</h3>
        <div className="grid grid-cols-3 gap-4">
          {[{ i: Clock3, t: '24小时', d: '极速响应' }, { i: Award, t: '先行赔付', d: '保障权益' }, { i: RotateCcw, t: '7天复议', d: '不服可申' }].map((x) => (
            <div key={x.t} className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur">
              <x.i size={24} className="mx-auto mb-2 opacity-90" />
              <div className="font-bold text-lg">{x.t}</div>
              <div className="text-xs opacity-75">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`${cardCls} p-5`}>
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <span>平台将根据实际情况进行核实仲裁，最终赔偿金额以仲裁结果为准。如有异议可在收到结果后 7 个工作日内申请复核。</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-warm-bg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-50 rounded-full blur-3xl opacity-60 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-mint-50 rounded-full blur-3xl opacity-50 translate-x-1/4 translate-y-1/4" />
      <div className="relative max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand/5 px-4 py-1.5 rounded-full border border-brand/10 mb-4">
            <Scale size={14} className="text-brand" /><span className="text-sm text-brand font-medium">公正 · 透明 · 高效</span>
          </div>
          <h1 className="text-3xl font-bold text-brand font-display">服务纠纷仲裁中心</h1>
          <p className="text-gray-500 mt-2">专业仲裁团队，保障您的合法权益</p>
        </motion.div>
        {!currentDisputeId && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`${cardCls} shadow-card p-2 mb-8 inline-flex gap-1 mx-auto w-full`}>
            {[{ k: 'list' as TabKey, l: '我的纠纷', i: FileText }, { k: 'submit' as TabKey, l: '提交新纠纷', i: Plus }, { k: 'rules' as TabKey, l: '赔偿标准', i: Scale }].map((t) => {
              const Ic = t.i; const active = activeTab === t.k;
              return (
                <button key={t.k} onClick={() => { setActiveTab(t.k); setSubmittedId(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl2 font-medium transition-all ${active ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-brand hover:bg-warm-bg'}`}>
                  <Ic size={16} />{t.l}
                </button>
              );
            })}
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {currentDisputeId ? renderDetail() : activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              {disputes.length === 0 ? <div className={`${cardCls} p-12 text-center`}>
                <FileText size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">暂无纠纷记录</p>
              </div> : disputes.map(renderCard)}
            </motion.div>
          )}
          {!currentDisputeId && activeTab === 'submit' && renderSubmit()}
          {!currentDisputeId && activeTab === 'rules' && renderRules()}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setLightboxUrl(null)}>
            <button onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 text-white/80 hover:text-white">
              <XCircle size={32} />
            </button>
            <img src={lightboxUrl} alt="preview" className="max-w-full max-h-full rounded-xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setShowChat(!showChat)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-600 text-white shadow-lg shadow-brand/30 flex items-center justify-center z-40">
        <MessageSquare size={22} />
      </motion.button>
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 right-6 w-80 ${cardCls} shadow-card overflow-hidden z-40`}>
            <div className="bg-gradient-to-r from-brand to-brand-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Headphones size={18} /><span className="font-medium">在线客服</span></div>
                <button onClick={() => setShowChat(false)}><X size={18} /></button>
              </div>
              <div className="text-xs text-white/70 mt-1">通常在几分钟内回复</div>
            </div>
            <div className="h-48 overflow-y-auto p-3 bg-warm-bg/50 space-y-2">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-mint flex items-center justify-center text-white flex-shrink-0"><Headphones size={12} /></div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-brand shadow-sm border border-warm-card">
                  您好，我是平台智能客服，请问有什么可以帮您？
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center my-2">常见问题</div>
              {FAQ_QUICK.map((q) => (
                <button key={q} className="w-full text-left text-sm px-3 py-2 bg-white rounded-xl border border-warm-card text-brand hover:bg-brand/5 transition-colors">
                  {q}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-warm-card flex gap-2">
              <input type="text" placeholder="输入消息..." className="flex-1 px-3 py-2 text-sm rounded-xl bg-warm-bg border border-warm-card text-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <button className="px-3 py-2 bg-brand text-white rounded-xl hover:bg-brand-600 transition-colors"><Send size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
