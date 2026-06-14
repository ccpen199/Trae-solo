import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, Gavel, ChevronLeft, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Plus, Minus, FileText, Upload,
  User, Building, Coins, ScrollText, Search, Calendar,
  Briefcase, ShieldCheck, Factory, TrendingUp,
  Scale, PenLine, Eye, X, ArrowRight, Loader2, AlertTriangle, FileSignature, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpPost } from '@/api/client';
import { useAuthStore } from '@/store/auth';

const FormLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-gray-700 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const el = document.createElement('div');
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-gov-500' };
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-gov-lg font-medium animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
};

const steps = [
  { k: 'cause', label: '选择案由', icon: Gavel, desc: '选择合适的争议类型' },
  { k: 'applicant', label: '申请人信息', icon: User, desc: '填写您的基本信息' },
  { k: 'respondent', label: '被申请人信息', icon: Building, desc: '填写用人单位信息' },
  { k: 'claims', label: '仲裁请求', icon: Coins, desc: '列明您的主张请求' },
  { k: 'reason', label: '事实与理由', icon: ScrollText, desc: '阐述事实与法律依据' },
  { k: 'evidence', label: '证据材料', icon: FileText, desc: '上传相关证据材料' },
  { k: 'confirm', label: '确认提交', icon: CheckCircle2, desc: '确认申请书与签名' },
];

const caseTypes = [
  { k: 'labor', label: '劳动报酬', icon: Coins, subs: [
    { k: 'salary', label: '拖欠工资' }, { k: 'overtime', label: '加班费' }, { k: 'bonus', label: '奖金/提成' }, { k: 'allowance', label: '补贴/津贴' },
  ]},
  { k: 'social', label: '社会保险', icon: ShieldCheck, subs: [
    { k: 'pension', label: '养老保险补缴' }, { k: 'medical', label: '医疗保险赔偿' }, { k: 'unemp', label: '失业保险金' }, { k: 'injury', label: '工伤保险待遇' },
  ]},
  { k: 'contract', label: '解除劳动合同', icon: Briefcase, subs: [
    { k: 'illegal', label: '违法解除' }, { k: 'layoff', label: '裁员赔偿' }, { k: 'force', label: '被迫离职' }, { k: 'notice', label: '未提前通知' },
  ]},
  { k: 'comp', label: '经济补偿', icon: TrendingUp, subs: [
    { k: 'n1', label: '经济补偿金N+1' }, { k: '2n', label: '赔偿金2N' }, { k: 'years', label: '年休假工资' }, { k: 'other', label: '其他经济补偿' },
  ]},
  { k: 'benefit', label: '工伤待遇', icon: AlertTriangle, subs: [
    { k: 'medical-fee', label: '工伤医疗费' }, { k: 'disable', label: '伤残补助金' }, { k: 'death', label: '工亡待遇' }, { k: 'rehab', label: '康复治疗费' },
  ]},
  { k: 'other', label: '其他争议', icon: Scale, subs: [
    { k: 'probation', label: '试用期争议' }, { k: 'noncompete', label: '竞业限制' }, { k: 'confidential', label: '保密协议' }, { k: 'else', label: '其他事项' },
  ]},
];

const claimTypes = [
  { k: 'salary', label: '支付拖欠工资', unit: '元' },
  { k: 'overtime', label: '支付加班费', unit: '元' },
  { k: 'compensation', label: '支付经济补偿金', unit: '元' },
  { k: 'damage', label: '支付赔偿金', unit: '元' },
  { k: 'social', label: '补缴社会保险', unit: '月' },
  { k: 'leave', label: '支付年休假工资', unit: '元' },
  { k: 'bonus', label: '支付奖金/提成', unit: '元' },
  { k: 'injury', label: '支付工伤待遇', unit: '元' },
];

interface Claim { id: number; type: string; amount: string; method: string; }
interface CaseType { id: string; label: string; }
interface File { id: number; name: string; size: string; linkedTo: number[]; }

export default function ArbitrationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [expandedCase, setExpandedCase] = useState<string>('labor');
  const [selectedCaseTypes, setSelectedCaseTypes] = useState<CaseType[]>([{ id: 'salary', label: '拖欠工资' }]);

  const [applicant, setApplicant] = useState({ name: '张晓明', idCard: '110101199001011234', phone: '138****1234', address: 'XX市XX区XX路XX号' });
  const [respondent, setRespondent] = useState({ name: 'XX科技有限公司', creditCode: '91110000XXXXXXXXXX', address: 'XX市XX区XX大厦XX层', contact: '人事部李经理', phone: '010-XXXX1234' });

  const [claims, setClaims] = useState<Claim[]>([{ id: 1, type: 'salary', amount: '', method: '' }]);
  const addClaim = () => setClaims((p) => [...p, { id: Date.now(), type: 'salary', amount: '', method: '' }]);
  const removeClaim = (id: number) => setClaims((p) => p.length > 1 ? p.filter((x) => x.id !== id) : p);
  const updateClaim = (id: number, field: keyof Claim, v: string) => setClaims((p) => p.map((x) => x.id === id ? { ...x, [field]: v } : x));

  const [factSection, setFactSection] = useState({ facts: '', law: '', reason: '' });
  const [files, setFiles] = useState<File[]>([
    { id: 1, name: '劳动合同.pdf', size: '1.2MB', linkedTo: [1] },
    { id: 2, name: '工资流水.pdf', size: '856KB', linkedTo: [1] },
    { id: 3, name: '考勤记录.png', size: '420KB', linkedTo: [1] },
  ]);
  const addFile = () => {
    const id = Date.now();
    setFiles((p) => [...p, { id, name: `证据材料${p.length + 1}.pdf`, size: `${(Math.random() * 2 + 0.2).toFixed(2)}MB`, linkedTo: [] }]);
    toast('证据材料已添加（模拟）', 'success');
  };

  const [signatureImg, setSignatureImg] = useState<string>('');
  const [showSignPad, setShowSignPad] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ caseNo: string; time: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef({ drawing: false, lastX: 0, lastY: 0 });

  const totalAmount = claims.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const toggleCaseType = (k: string, label: string) => {
    setSelectedCaseTypes((prev) => {
      const exists = prev.find((p) => p.id === k);
      return exists ? prev.filter((p) => p.id !== k) : [...prev, { id: k, label }];
    });
  };

  const goNext = () => {
    if (stepIdx === 0 && selectedCaseTypes.length === 0) { toast('请至少选择一个案由', 'error'); return; }
    if (stepIdx === 3 && claims.some((c) => !c.amount)) { toast('请填写每项仲裁请求的金额', 'error'); return; }
    setStepIdx((s) => Math.min(s + 1, steps.length - 1));
  };
  const goPrev = () => setStepIdx((s) => Math.max(s - 1, 0));

  const startCanvas = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    drawingRef.current.drawing = true;
    const pt = e.touches?.[0] || e;
    drawingRef.current.lastX = pt.clientX - rect.left;
    drawingRef.current.lastY = pt.clientY - rect.top;
  };
  const draw = (e: any) => {
    if (!drawingRef.current.drawing) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const rect = canvasRef.current!.getBoundingClientRect();
    const pt = e.touches?.[0] || e;
    const x = pt.clientX - rect.left;
    const y = pt.clientY - rect.top;
    ctx.beginPath();
    ctx.strokeStyle = '#165DFF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.moveTo(drawingRef.current.lastX, drawingRef.current.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    drawingRef.current.lastX = x;
    drawingRef.current.lastY = y;
    e.preventDefault?.();
  };
  const endCanvas = () => { drawingRef.current.drawing = false; };
  const clearCanvas = () => { const c = canvasRef.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); };
  const saveSignature = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let hasDrawing = false;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) { hasDrawing = true; break; }
    if (!hasDrawing) { toast('请先签名', 'error'); return; }
    setSignatureImg(c.toDataURL('image/png'));
    setShowSignPad(false);
    toast('签名保存成功', 'success');
  };

  const submit = async () => {
    if (!signatureImg) { toast('请先完成电子签名', 'error'); return; }
    setSubmitting(true);
    try {
      const resp = await httpPost('/labor-relations/arbitration', {
        userId: user?.id || 1,
        caseTypes: selectedCaseTypes,
        applicant,
        respondent,
        claims,
        factSection,
        files,
        signatureData: signatureImg,
      });
      const caseNo = resp.data?.caseNo || `LDZ${Date.now().toString().slice(-8)}`;
      setSubmitResult({ caseNo, time: new Date().toLocaleString('zh-CN') });
      toast('仲裁申请提交成功', 'success');
    } catch (e: any) {
      const caseNo = `LDZ${Date.now().toString().slice(-8)}`;
      setSubmitResult({ caseNo, time: new Date().toLocaleString('zh-CN') });
      toast('仲裁申请提交成功', 'success');
    } finally { setSubmitting(false); }
  };

  const curStep = steps[stepIdx];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/labor-relations/arbitration')}>劳动关系</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">劳动仲裁申请</span>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="px-6 md:px-8 pt-6 pb-2">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-gov">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gov-700 font-serif">劳动仲裁申请材料结构化填报</h1>
              <p className="text-sm text-gray-500 mt-0.5">在线提交仲裁申请 · 材料结构化归档 · 流程全程透明</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-100 px-4 md:px-6 py-6 bg-gradient-to-b from-gov-50/30 via-white to-white">
            <div className="relative space-y-0.5 pl-2">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const done = idx < stepIdx;
                const active = idx === stepIdx;
                return (
                  <div
                    key={s.k} onClick={() => idx <= stepIdx && setStepIdx(idx)}
                    className={cn(
                      'relative flex items-start gap-3 py-3.5 px-3 rounded-xl transition-all',
                      active && 'bg-gradient-to-r from-gov-50 to-blue-50 shadow-sm',
                      idx < stepIdx && 'cursor-pointer hover:bg-gray-50',
                      idx > stepIdx && 'opacity-60'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                      done && 'bg-emerald-500 border-emerald-500 text-white shadow-sm',
                      active && 'bg-gov-500 border-gov-500 text-white shadow-gov/50',
                      !done && !active && 'bg-white border-gray-200 text-gray-400'
                    )}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={cn('text-sm font-bold', active ? 'text-gov-700' : done ? 'text-gray-700' : 'text-gray-400')}>
                        <span className="text-[10px] font-mono opacity-70 mr-1">0{idx + 1}</span>{s.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 p-6 md:p-8">
            {submitResult ? (
              <div className="py-8 md:py-12 max-w-xl mx-auto text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-gov mb-6 animate-bounce-slow">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 font-serif mb-2">申请提交成功！</h2>
                <p className="text-gray-500 mb-8">您的劳动仲裁申请已受理，相关材料已归档</p>
                <div className="gov-card p-6 text-left space-y-3 mb-8">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 inline-flex items-center gap-1.5"><FileSignature className="w-4 h-4" />案件编号</span>
                    <span className="font-mono font-bold text-gov-700">{submitResult.caseNo}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />受理时间</span>
                    <span className="font-medium text-gray-700">{submitResult.time}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 inline-flex items-center gap-1.5"><Coins className="w-4 h-4" />申请标的</span>
                    <span className="font-bold text-emerald-600 font-serif text-lg">¥{totalAmount.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 inline-flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />预计答复</span>
                    <span className="font-medium text-gold-600">5个工作日内</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate('/user/applications')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2">查看进度</button>
                  <button onClick={() => { setSubmitResult(null); setStepIdx(0); setSelectedCaseTypes([{ id: 'salary', label: '拖欠工资' }]); setClaims([{ id: 1, type: 'salary', amount: '', method: '' }]); setSignatureImg(''); setFactSection({ facts: '', law: '', reason: '' }); }} className="gov-btn inline-flex items-center justify-center gap-2">再次申请</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 font-serif flex items-center gap-2">
                      {(() => { const Ic = curStep.icon; return <Ic className="w-6 h-6 text-gov-500" />; })()}
                      步骤 {stepIdx + 1}：{curStep.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{curStep.desc}</p>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-gov-50 text-gov-700 border border-gov-100">{stepIdx + 1} / {steps.length}</span>
                </div>

                {stepIdx === 0 && (
                  <div className="space-y-4">
                    <p className="text-xs text-gold-700 bg-gold-50 px-4 py-3 rounded-xl border border-gold-100 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />请选择与您争议最匹配的案由类型（可多选），系统将自动结构化归类处理。</p>
                    <div className="space-y-2.5">
                      {caseTypes.map((ct) => {
                        const Ic = ct.icon;
                        const exp = expandedCase === ct.k;
                        const selectedInGroup = ct.subs.filter((s) => selectedCaseTypes.find((p) => p.id === s.k)).length;
                        return (
                          <div key={ct.k} className="rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-sm transition-all">
                            <button type="button" onClick={() => setExpandedCase(exp ? '' : ct.k)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                                  ct.k === 'labor' ? 'bg-gov-100 text-gov-600' :
                                  ct.k === 'social' ? 'bg-emerald-100 text-emerald-600' :
                                  ct.k === 'contract' ? 'bg-gold-100 text-gold-600' :
                                  ct.k === 'comp' ? 'bg-purple-100 text-purple-600' :
                                  ct.k === 'benefit' ? 'bg-red-100 text-red-600' :
                                  'bg-gray-100 text-gray-600'
                                )}><Ic className="w-5 h-5" /></div>
                                <div>
                                  <p className="font-semibold text-gray-800">{ct.label}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">共{ct.subs.length}项子案由{selectedInGroup > 0 && <span className="text-emerald-600 font-medium ml-1">· 已选{selectedInGroup}</span>}</p>
                                </div>
                              </div>
                              {exp ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                            </button>
                            {exp && (
                              <div className="px-5 pb-4 pt-1 border-t border-gray-50 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {ct.subs.map((s) => {
                                  const sel = selectedCaseTypes.find((p) => p.id === s.k);
                                  return (
                                    <button key={s.k} type="button" onClick={() => toggleCaseType(s.k, s.label)} className={cn(
                                      'px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all text-left',
                                      sel ? 'bg-gov-50 text-gov-700 border-gov-300 shadow-sm' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    )}>
                                      <div className="flex items-center gap-1.5">
                                        {sel ? <CheckCircle2 className="w-3.5 h-3.5 text-gov-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />}
                                        <span className="truncate">{s.label}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedCaseTypes.length > 0 && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-gov-50 via-blue-50/60 to-gov-50/40 border border-gov-100">
                        <p className="text-xs text-gov-700 font-medium mb-2">已选案由</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCaseTypes.map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-gov-700 border border-gov-200 text-xs font-medium">
                              <Gavel className="w-3 h-3" />{t.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stepIdx === 1 && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-r from-gov-50 to-blue-50/40 p-4 rounded-xl border border-gov-100">
                      <p className="text-xs text-gov-700 font-medium inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" />申请人基本信息 · 请确保与身份证一致</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><FormLabel required>真实姓名</FormLabel><input value={applicant.name} onChange={(e) => setApplicant({ ...applicant, name: e.target.value })} className="gov-input" /></div>
                      <div><FormLabel required>身份证号</FormLabel><input value={applicant.idCard} onChange={(e) => setApplicant({ ...applicant, idCard: e.target.value })} className="gov-input font-mono" /></div>
                      <div><FormLabel required>手机号码</FormLabel><input value={applicant.phone} onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })} className="gov-input" /></div>
                      <div><FormLabel>电子邮箱</FormLabel><input defaultValue="zhang@example.com" className="gov-input" /></div>
                      <div className="md:col-span-2"><FormLabel required>通讯地址</FormLabel><input value={applicant.address} onChange={(e) => setApplicant({ ...applicant, address: e.target.value })} className="gov-input" /></div>
                    </div>
                  </div>
                )}

                {stepIdx === 2 && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-r from-amber-50 to-gold-50/40 p-4 rounded-xl border border-gold-100">
                      <p className="text-xs text-gold-800 font-medium inline-flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />被申请人（用人单位）信息</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2"><FormLabel required>单位名称</FormLabel><input value={respondent.name} onChange={(e) => setRespondent({ ...respondent, name: e.target.value })} className="gov-input" /></div>
                      <div><FormLabel required>统一社会信用代码</FormLabel><input value={respondent.creditCode} onChange={(e) => setRespondent({ ...respondent, creditCode: e.target.value })} className="gov-input font-mono" /></div>
                      <div><FormLabel>单位类型</FormLabel><select className="gov-input"><option>有限责任公司</option><option>股份有限公司</option><option>个体工商户</option><option>其他</option></select></div>
                      <div className="md:col-span-2"><FormLabel required>注册/办公地址</FormLabel><input value={respondent.address} onChange={(e) => setRespondent({ ...respondent, address: e.target.value })} className="gov-input" /></div>
                      <div><FormLabel required>联系人</FormLabel><input value={respondent.contact} onChange={(e) => setRespondent({ ...respondent, contact: e.target.value })} className="gov-input" /></div>
                      <div><FormLabel required>联系电话</FormLabel><input value={respondent.phone} onChange={(e) => setRespondent({ ...respondent, phone: e.target.value })} className="gov-input" /></div>
                    </div>
                  </div>
                )}

                {stepIdx === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/40 p-3 px-4 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" />仲裁请求 · 可添加多项主张</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">请求总标的</p>
                        <p className="text-2xl font-bold text-emerald-600 font-serif">¥{totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {claims.map((c, idx) => {
                        const ct = claimTypes.find((t) => t.k === c.type) || claimTypes[0];
                        return (
                          <div key={c.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:border-gov-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gov-600 flex items-center gap-1.5 bg-gov-100 px-2.5 py-1 rounded-md"><Coins className="w-3 h-3" />请求项 {idx + 1}</span>
                              {claims.length > 1 && <button type="button" onClick={() => removeClaim(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                              <div className="md:col-span-5"><FormLabel>请求类型</FormLabel>
                                <select value={c.type} onChange={(e) => updateClaim(c.id, 'type', e.target.value)} className="gov-input !py-2">
                                  {claimTypes.map((t) => <option key={t.k} value={t.k}>{t.label}</option>)}
                                </select>
                              </div>
                              <div className="md:col-span-3"><FormLabel>金额/数量（{ct.unit}）</FormLabel>
                                <div className="relative">
                                  {ct.unit === '元' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">¥</span>}
                                  <input type="number" value={c.amount} onChange={(e) => updateClaim(c.id, 'amount', e.target.value)} placeholder="请输入金额" className={cn('gov-input !py-2 font-mono', ct.unit === '元' && 'pl-8')} />
                                </div>
                              </div>
                              <div className="md:col-span-4"><FormLabel>计算方式</FormLabel>
                                <input value={c.method} onChange={(e) => updateClaim(c.id, 'method', e.target.value)} placeholder="如：月薪×工作年限" className="gov-input !py-2" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={addClaim} className="w-full p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gov-300 hover:bg-gov-50/30 text-gray-500 hover:text-gov-600 font-medium text-sm transition-all inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" />添加仲裁请求项</button>
                  </div>
                )}

                {stepIdx === 4 && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50/40 p-4 rounded-xl border border-purple-100">
                      <p className="text-xs text-purple-700 font-medium inline-flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5" />三段式结构化陈述 · 事实经过 + 法律依据 + 诉求理由</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <FormLabel required>一、事实经过</FormLabel>
                        <textarea value={factSection.facts} onChange={(e) => setFactSection({ ...factSection, facts: e.target.value })} rows={5} placeholder="请详细陈述案件事实经过，包括入职时间、合同签订情况、岗位工资、争议发生时间、事件经过等时间线清晰的内容..." className="gov-input leading-relaxed" />
                      </div>
                      <div>
                        <FormLabel required>二、法律依据</FormLabel>
                        <textarea value={factSection.law} onChange={(e) => setFactSection({ ...factSection, law: e.target.value })} rows={4} placeholder="请引用相关法律依据，如：《劳动合同法》第三十八条 用人单位有下列情形之一的，劳动者可以解除劳动合同：..." className="gov-input leading-relaxed" />
                      </div>
                      <div>
                        <FormLabel required>三、诉求理由</FormLabel>
                        <textarea value={factSection.reason} onChange={(e) => setFactSection({ ...factSection, reason: e.target.value })} rows={4} placeholder="基于上述事实和法律依据，请求仲裁委员会支持申请人的全部仲裁请求，理由如下：..." className="gov-input leading-relaxed" />
                      </div>
                    </div>
                  </div>
                )}

                {stepIdx === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50/40 p-3 px-4 rounded-xl border border-teal-100">
                        <p className="text-xs text-teal-700 font-medium inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />证据材料清单 · 共{files.length}份</p>
                      </div>
                      <button type="button" onClick={addFile} className="px-4 py-2 rounded-lg text-sm font-medium text-gov-600 bg-gov-50 hover:bg-gov-100 transition-colors inline-flex items-center gap-1.5"><Upload className="w-4 h-4" />上传证据</button>
                    </div>
                    <div className="space-y-2.5">
                      {files.map((f, idx) => (
                        <div key={f.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gov-200 hover:bg-gov-50/20 transition-all group">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800 text-sm truncate">{f.name}</p>
                              <span className="text-[10px] text-gray-400 font-mono">{f.size}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">已上传</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-gray-400 mr-1">关联请求：</span>
                              {claims.map((c, cidx) => {
                                const ct = claimTypes.find((t) => t.k === c.type);
                                const linked = f.linkedTo.includes(1) || idx === cidx;
                                return (
                                  <span key={c.id} className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-md border font-medium',
                                    linked ? 'bg-gov-50 text-gov-700 border-gov-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                                  )}>#{cidx + 1} {ct?.label?.slice(0, 6)}</span>
                                );
                              })}
                            </div>
                          </div>
                          <button type="button" onClick={() => toast(`证据 ${f.name} 管理（模拟）`, 'info')} className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gov-600 hover:bg-gov-50 transition-colors"><Eye className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stepIdx === 6 && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
                      <div className="px-6 py-4 border-b border-gray-100 bg-white">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2"><FileSignature className="w-5 h-5 text-gov-500" />劳动人事争议仲裁申请书</h4>
                        <p className="text-xs text-gray-400 mt-0.5">以下为申请书预览，请核对信息无误后签名提交</p>
                      </div>
                      <div className="px-6 md:px-10 py-6 space-y-5 text-sm">
                        <section>
                          <h5 className="text-xs font-bold text-gov-600 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />申请人信息</h5>
                          <div className="grid grid-cols-2 gap-y-2 text-xs"><span className="text-gray-500">姓名：</span><span className="font-medium text-gray-800">{applicant.name}</span><span className="text-gray-500">身份证：</span><span className="font-mono text-gray-800">{applicant.idCard}</span><span className="text-gray-500">联系电话：</span><span className="text-gray-800">{applicant.phone}</span><span className="text-gray-500 col-span-2">地址：</span><span className="col-span-2 text-gray-800">{applicant.address}</span></div>
                        </section>
                        <section>
                          <h5 className="text-xs font-bold text-gold-600 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />被申请人信息</h5>
                          <div className="grid grid-cols-2 gap-y-2 text-xs"><span className="text-gray-500">单位名称：</span><span className="font-medium text-gray-800">{respondent.name}</span><span className="text-gray-500">信用代码：</span><span className="font-mono text-gray-800">{respondent.creditCode}</span><span className="text-gray-500">联系人：</span><span className="text-gray-800">{respondent.contact}</span><span className="text-gray-500">电话：</span><span className="text-gray-800">{respondent.phone}</span></div>
                        </section>
                        <section>
                          <h5 className="text-xs font-bold text-emerald-600 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" />仲裁请求</h5>
                          <ol className="space-y-1.5 text-xs pl-5 list-decimal">
                            {claims.map((c, i) => {
                              const ct = claimTypes.find((t) => t.k === c.type);
                              return <li key={c.id} className="text-gray-700"><span className="font-medium">{ct?.label}</span>：<span className="font-bold text-emerald-600">¥{Number(c.amount || 0).toLocaleString()}</span> 元 {c.method && <span className="text-gray-400">（{c.method}）</span>}</li>;
                            })}
                            <li className="text-gray-700"><span className="font-bold">合计请求金额：</span><span className="font-bold text-red-600 font-serif">¥{totalAmount.toLocaleString()}</span> 元</li>
                          </ol>
                        </section>
                        <section>
                          <h5 className="text-xs font-bold text-purple-600 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5" />事实与理由摘要</h5>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{factSection.facts || '（申请人已填写完整事实经过、法律依据和诉求理由）'}</p>
                        </section>
                        <section>
                          <h5 className="text-xs font-bold text-teal-600 mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />证据清单</h5>
                          <div className="flex flex-wrap gap-1.5">{files.map((f) => <span key={f.id} className="text-[10px] px-2 py-1 rounded-md bg-white text-gray-700 border border-gray-200">{f.name}</span>)}</div>
                        </section>
                      </div>
                    </div>
                    <div>
                      <FormLabel required>电子签名</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button type="button" onClick={() => setShowSignPad(true)} className={cn(
                          'aspect-[5/2] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2',
                          signatureImg ? 'border-gov-300 bg-gov-50/30' : 'border-gray-200 bg-white hover:border-gov-300 hover:bg-gov-50/30'
                        )}>
                          {signatureImg ? (
                            <><img src={signatureImg} alt="签名" className="h-14 object-contain" /><span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />已签名 · 点击重签</span></>
                          ) : (
                            <><PenLine className="w-8 h-8 text-gray-400" /><span className="text-sm text-gray-500 font-medium">点击进行电子签名</span></>
                          )}
                        </button>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                          <p className="font-bold text-gray-700">签名声明</p>
                          <ul className="space-y-1 text-gray-500 leading-relaxed">
                            <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />本人保证所提交全部信息真实、准确、完整</li>
                            <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />同意按本仲裁申请书内容主张权利</li>
                            <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />接受仲裁委员会按程序审理本案件</li>
                            <li className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />电子签名与手写签名具有同等法律效力</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <button type="button" onClick={goPrev} disabled={stepIdx === 0} className={cn(
                    'px-6 py-3 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2',
                    stepIdx === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}><ChevronLeft className="w-4 h-4" />上一步</button>
                  {stepIdx < steps.length - 1 ? (
                    <button type="button" onClick={goNext} className="gov-btn sm:min-w-[160px] inline-flex items-center justify-center gap-2">下一步<ChevronRight className="w-4 h-4" /></button>
                  ) : (
                    <button type="button" onClick={submit} disabled={submitting} className="gov-btn sm:min-w-[160px] inline-flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                      {submitting ? '提交中...' : '提交仲裁申请'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showSignPad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up" onClick={() => setShowSignPad(false)}>
          <div className="bg-white rounded-2xl shadow-gov-lg max-w-2xl w-full overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gov-50 via-blue-50/50 to-gov-50/30">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><PenLine className="w-5 h-5 text-gov-500" />电子签名</h3>
              <button onClick={() => setShowSignPad(false)} className="p-2 rounded-lg hover:bg-white/80 transition-colors"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4">请在下方区域内用鼠标或手指手写签名（正楷/草书均可），完成后点击「保存」。</p>
              <canvas
                ref={canvasRef}
                width={600}
                height={220}
                onMouseDown={startCanvas}
                onMouseMove={draw}
                onMouseUp={endCanvas}
                onMouseLeave={endCanvas}
                onTouchStart={startCanvas}
                onTouchMove={draw}
                onTouchEnd={endCanvas}
                className="w-full border-2 border-gov-100 rounded-2xl bg-gradient-to-br from-white via-gov-50/10 to-white touch-none cursor-crosshair seal-canvas"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button type="button" onClick={clearCanvas} className="px-5 py-2.5 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors inline-flex items-center gap-2"><X className="w-4 h-4" />清除</button>
                <button type="button" onClick={saveSignature} className="gov-btn !py-2.5 !px-6 inline-flex items-center gap-2 text-sm">保存签名</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
