import { useAppStore } from '@/store/appStore';
import { mockCompensationRules } from '@/data/mockData';
import type { DisputeType, Evidence, Dispute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Image, Video, CheckCircle, Clock, AlertCircle,
  ChevronDown, FileText, Scale, Plus, X, Gavel, UserCheck,
  ShieldCheck, Award, Send,
} from 'lucide-react';
import { useRef, useState } from 'react';

type TabKey = 'list' | 'submit' | 'rules';

const DISPUTE_TYPES = [
  { value: 'service_quality' as DisputeType, label: '服务质量', color: 'bg-blue-500' },
  { value: 'delay' as DisputeType, label: '服务延误', color: 'bg-amber-500' },
  { value: 'overcharge' as DisputeType, label: '乱收费', color: 'bg-rose-500' },
  { value: 'damage' as DisputeType, label: '物品损坏', color: 'bg-purple-500' },
];

const STATUS_STYLES = {
  submitted: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Clock },
  reviewing: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: AlertCircle },
  resolved: { bg: 'bg-mint-50', text: 'text-mint-600', border: 'border-mint-200', icon: CheckCircle },
} as const;

const TIMELINE = [
  { label: '提交纠纷', icon: Send },
  { label: '客服介入', icon: UserCheck },
  { label: '核实证据', icon: ShieldCheck },
  { label: '仲裁结果', icon: Gavel },
  { label: '赔付完成', icon: Award },
];

const inputCls = 'w-full px-4 py-3 rounded-xl2 border border-warm-card bg-warm-bg text-brand placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all';

export default function DisputePage() {
  const { disputes, addDispute } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [disputeType, setDisputeType] = useState<DisputeType | null>(null);
  const [description, setDescription] = useState('');
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
      const reader = new FileReader();
      reader.onload = (e) => setEvidences((prev) => [...prev, {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: e.target?.result as string, name: file.name,
      }]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (!orderId.trim() || !disputeType || !description.trim()) return;
    const t = DISPUTE_TYPES.find((d) => d.value === disputeType)!;
    addDispute({ orderId, type: disputeType, typeLabel: t.label, description, evidences });
    setOrderId(''); setDisputeType(null); setDescription(''); setEvidences([]); setActiveTab('list');
  };

  const selectedRule = disputeType ? mockCompensationRules.find((r) => r.type === disputeType) : null;
  const stepIdx = (s: Dispute['status']) => s === 'submitted' ? 0 : s === 'reviewing' ? 2 : 4;

  const renderEvidence = (e: Evidence, removable = false) => (
    <div key={e.id} className="relative aspect-square rounded-xl2 overflow-hidden bg-warm-card group">
      {e.type === 'image' ? <img src={e.url} alt={e.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center bg-brand/5"><Video size={20} className="text-brand-300" /></div>}
      {removable && <button onClick={() => setEvidences((p) => p.filter((x) => x.id !== e.id))}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>}
    </div>
  );

  const renderDisputeCard = (d: Dispute) => {
    const ss = STATUS_STYLES[d.status];
    const SI = ss.icon;
    const expanded = expandedId === d.id;
    const tm = DISPUTE_TYPES.find((t) => t.value === d.type);
    const ci = stepIdx(d.status);
    return (
      <motion.div key={d.id} layout className="bg-white rounded-3xl2 shadow-soft border border-warm-card overflow-hidden">
        <button onClick={() => setExpandedId(expanded ? null : d.id)}
          className="w-full p-5 text-left flex items-center gap-4 hover:bg-warm-bg/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-semibold text-brand">{d.orderId}</span>
              <span className={`${tm?.color} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}>{d.typeLabel}</span>
              <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${ss.bg} ${ss.text} ${ss.border}`}><SI size={12} />{d.statusLabel}</span>
            </div>
            <p className="text-sm text-gray-500 truncate mb-1">{d.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {d.compensationAmount > 0 && <span className="text-mint-600 font-semibold">赔偿 ¥{d.compensationAmount}</span>}
              <span>{d.createdAt}</span>
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown size={20} className="text-gray-400" /></motion.div>
        </button>
        <AnimatePresence>{expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-2 border-t border-warm-card space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-warm-bg rounded-xl2 p-4 space-y-3">
                  <div><div className="text-xs text-gray-400 mb-1">纠纷详情</div><p className="text-sm text-brand">{d.description}</p></div>
                  {d.result && <div className="pt-3 border-t border-warm-card"><div className="text-xs text-gray-400 mb-1">处理结果</div><p className="text-sm text-mint-600">{d.result}</p></div>}
                  {d.csAgent && <div className="pt-3 border-t border-warm-card"><div className="text-xs text-gray-400 mb-1">负责客服</div><p className="text-sm text-brand">{d.csAgent}</p></div>}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">证据材料</div>
                  {d.evidences.length > 0 ? <div className="grid grid-cols-4 gap-2">{d.evidences.map((e) => renderEvidence(e))}</div>
                    : <div className="text-sm text-gray-400 py-8 text-center bg-warm-bg rounded-xl2">暂无证据</div>}
                </div>
              </div>
              <div className="bg-warm-bg rounded-xl2 p-5">
                <div className="text-xs text-gray-400 mb-4">处理进度</div>
                <div className="flex items-start justify-between relative">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-0" />
                  <div className="absolute top-4 left-4 h-0.5 bg-mint -z-0" style={{ width: `${(ci / (TIMELINE.length - 1)) * 100}%` }} />
                  {TIMELINE.map((s, i) => {
                    const Ico = s.icon; const done = i <= ci;
                    return (
                      <div key={s.label} className="flex flex-col items-center gap-2 z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${done ? 'bg-mint border-mint text-white' : 'bg-white border-gray-300 text-gray-400'}`}><Ico size={14} /></div>
                        <span className={`text-xs text-center ${done ? 'text-brand font-medium' : 'text-gray-400'}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}</AnimatePresence>
      </motion.div>
    );
  };

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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl2 shadow-card border border-warm-card p-2 mb-8 inline-flex gap-1 mx-auto w-full">
          {[{ k: 'list' as TabKey, l: '我的纠纷', i: FileText }, { k: 'submit' as TabKey, l: '提交新纠纷', i: Plus }, { k: 'rules' as TabKey, l: '赔偿标准', i: Scale }].map((t) => {
            const Ic = t.i; const active = activeTab === t.k;
            return (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl2 font-medium transition-all ${active ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-brand hover:bg-warm-bg'}`}>
                <Ic size={16} />{t.l}
              </button>
            );
          })}
        </motion.div>
        <AnimatePresence mode="wait">
          {activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-4">
              {disputes.length === 0 ? <div className="bg-white rounded-3xl2 shadow-soft border border-warm-card p-12 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">暂无纠纷记录</p>
              </div> : disputes.map(renderDisputeCard)}
            </motion.div>
          )}
          {activeTab === 'submit' && (
            <motion.div key="submit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl2 shadow-card border border-warm-card p-8">
              <h2 className="text-xl font-bold text-brand mb-6 flex items-center gap-2"><Plus size={20} className="text-mint" />提交新纠纷</h2>
              <div className="space-y-5">
                <div><label className="block text-sm font-medium text-brand mb-2">关联订单号</label>
                  <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="请输入订单号，如 ORD-2026-0615-001" className={inputCls} /></div>
                <div><label className="block text-sm font-medium text-brand mb-3">纠纷类型</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{DISPUTE_TYPES.map((t) => (
                    <button key={t.value} onClick={() => setDisputeType(t.value)}
                      className={`p-4 rounded-xl2 border-2 text-left transition-all ${disputeType === t.value ? 'border-brand bg-brand/5' : 'border-warm-card bg-warm-bg hover:border-brand-200'}`}>
                      <div className={`w-2 h-2 rounded-full ${t.color} mb-2`} /><div className="font-medium text-brand text-sm">{t.label}</div>
                    </button>
                  ))}</div>
                </div>
                {selectedRule && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-mint-50 border border-mint-200 rounded-xl2 p-4">
                  <div className="flex items-start gap-3"><Scale size={18} className="text-mint-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm"><div className="font-semibold text-mint-700 mb-1">{selectedRule.typeLabel} · 赔偿标准预览</div>
                      <div className="text-mint-600 space-y-0.5"><div>赔付比例：{selectedRule.ratio}</div><div>最高赔偿：¥{selectedRule.maxAmount}</div>
                        <div className="text-mint-500 text-xs mt-1">{selectedRule.description}</div></div></div></div>
                </motion.div>}
                <div><label className="block text-sm font-medium text-brand mb-2">问题描述</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                    placeholder="请详细描述遇到的问题，包括时间、地点、具体情况等" className={`${inputCls} resize-none`} /></div>
                <div><label className="block text-sm font-medium text-brand mb-2">举证材料</label>
                  <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    className="border-2 border-dashed border-brand-200 rounded-xl2 p-8 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all bg-warm-bg">
                    <Upload size={32} className="text-brand-300 mx-auto mb-3" /><div className="text-sm text-brand font-medium">点击或拖拽上传</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-3">
                      <span className="flex items-center gap-1"><Image size={12} /> 图片</span>
                      <span className="flex items-center gap-1"><Video size={12} /> 视频</span></div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
                  {evidences.length > 0 && <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">{evidences.map((e) => renderEvidence(e, true))}</div>}
                </div>
                <button onClick={handleSubmit} disabled={!orderId.trim() || !disputeType || !description.trim()}
                  className="w-full py-4 rounded-xl2 bg-gradient-to-r from-brand to-brand-400 text-white font-bold text-lg hover:from-brand-600 hover:to-brand-500 transition-all shadow-lg shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Send size={18} />提交纠纷申请</button>
              </div>
            </motion.div>
          )}
          {activeTab === 'rules' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl2 shadow-card border border-warm-card overflow-hidden">
              <div className="p-6 border-b border-warm-card flex items-center gap-2"><Scale size={20} className="text-brand" /><h2 className="text-xl font-bold text-brand">赔偿标准说明</h2></div>
              <div className="overflow-x-auto"><table className="w-full">
                <thead className="bg-warm-bg"><tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-brand">纠纷类型</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-brand">赔付比例</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-brand">最高赔偿</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-brand">说明</th>
                </tr></thead>
                <tbody>{mockCompensationRules.map((rule, idx) => {
                  const tm = DISPUTE_TYPES.find((t) => t.value === rule.type);
                  return (<motion.tr key={rule.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                    className="border-t border-warm-card hover:bg-warm-bg/50 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${tm?.color}`} /><span className="font-medium text-brand">{rule.typeLabel}</span></div></td>
                    <td className="px-6 py-4 text-brand font-semibold">{rule.ratio}</td>
                    <td className="px-6 py-4 text-mint-600 font-bold">¥{rule.maxAmount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{rule.description}</td>
                  </motion.tr>);
                })}</tbody>
              </table></div>
              <div className="p-5 bg-warm-bg border-t border-warm-card">
                <div className="flex items-start gap-2 text-xs text-gray-500"><AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>平台将根据实际情况进行核实仲裁，最终赔偿金额以仲裁结果为准。如有异议可在收到结果后 3 个工作日内申请复核。</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
