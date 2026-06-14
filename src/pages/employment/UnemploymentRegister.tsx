import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, User, FileText, Briefcase, Target, PenLine, CheckCircle,
  Home, AlertCircle, Eraser, RotateCcw, Calendar, Hash, Info, Clock, ShieldCheck, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpPost } from '@/api/client';
import { useAuthStore } from '@/store/auth';

const steps = [
  { id: 1, title: '基本信息', icon: User },
  { id: 2, title: '失业情况', icon: FileText },
  { id: 3, title: '就业意向', icon: Target },
  { id: 4, title: '电子签章', icon: PenLine },
  { id: 5, title: '提交完成', icon: CheckCircle },
];

const unemploymentReasons = [
  '合同期满', '主动辞职', '被辞退', '企业破产', '企业搬迁', '个人原因', '其他'
];

const educationOptions = ['初中及以下', '高中/中专', '大专', '本科', '硕士', '博士'];

const positionOptions = [
  '技术开发', '产品设计', '市场营销', '人力资源', '财务管理',
  '行政管理', '销售业务', '客户服务', '生产制造', '物流仓储'
];

const cityOptions = ['本市', '本省其他城市', '一线城市', '不限'];

const FormLabel = ({ children, required = false, className = '' }: { children: React.ReactNode; required?: boolean; className?: string }) => (
  <label className={cn('block text-sm font-medium text-gray-700 mb-2', className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const el = document.createElement('div');
  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-gov-500'
  };
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-gov-lg font-medium animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
};

export default function UnemploymentRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ id: number; applicationNo: string } | null>(null);

  const [form, setForm] = useState({
    realName: '',
    idCard: '',
    phone: '',
    education: '',
    address: '',
    unemploymentReason: '',
    lastEmployer: '',
    workYears: '',
    lastPosition: '',
    expectedPositions: [] as string[],
    expectedCity: '',
    salaryMin: 4000,
    salaryMax: 8000,
    acceptTraining: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        realName: prev.realName || (user as any).realName || (user as any).name || '张三',
        idCard: prev.idCard || '110101199001011234',
        phone: prev.phone || '13800138001',
        education: prev.education || '本科',
        address: prev.address || '北京市东城区东华门街道88号',
      }));
    }
  }, [user?.id]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [sealInfo, setSealInfo] = useState<{ time: string; person: string; code: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1D2129';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [currentStep]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const data = canvas.toDataURL('image/png');
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        setHasSignature(data !== blank.toDataURL());
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
    setSignatureData('');
    setSealInfo(null);
  };

  const confirmSignature = () => {
    if (!hasSignature) {
      toast('请先完成手写签名', 'error');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    setSignatureData(data);
    const now = new Date();
    setSealInfo({
      time: now.toLocaleString('zh-CN'),
      person: form.realName || user?.name || '本人',
      code: 'SG' + Date.now().toString().slice(-10),
    });
    toast('签章确认成功', 'success');
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.realName.trim()) errs.realName = '请输入真实姓名';
    if (!/^\d{17}[\dXx]$/.test(form.idCard)) errs.idCard = '请输入有效的18位身份证号';
    if (!/^1[3-9]\d{9}$/.test(form.phone)) errs.phone = '请输入有效的11位手机号';
    if (!form.education) errs.education = '请选择学历';
    if (!form.address.trim()) errs.address = '请输入户籍地址';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.unemploymentReason) errs.unemploymentReason = '请选择失业原因';
    if (!form.lastEmployer.trim()) errs.lastEmployer = '请输入最后工作单位';
    if (!form.workYears || Number(form.workYears) < 0) errs.workYears = '请输入有效的工作年限';
    if (!form.lastPosition.trim()) errs.lastPosition = '请输入最后岗位';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (form.expectedPositions.length === 0) errs.expectedPositions = '请至少选择一个意向岗位';
    if (!form.expectedCity) errs.expectedCity = '请选择意向工作地点';
    if (form.salaryMin >= form.salaryMax) errs.salary = '最低薪资必须小于最高薪资';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    if (!hasSignature || !signatureData) {
      toast('请先完成电子签章并确认', 'error');
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    const fieldLabels: Record<string, string> = {
      realName: '真实姓名',
      idCard: '身份证号',
      phone: '手机号',
      education: '学历',
      address: '户籍地址',
      unemploymentReason: '失业原因',
      lastEmployer: '最后工作单位',
      workYears: '工作年限',
      lastPosition: '最后岗位',
      expectedPositions: '意向岗位',
      expectedCity: '意向工作地点',
      salary: '薪资范围',
    };

    let valid = true;
    let stepErrors: Record<string, string> = {};
    if (currentStep === 1) {
      valid = validateStep1();
      stepErrors = valid ? {} : {
        realName: !form.realName.trim() ? '请输入真实姓名' : '',
        idCard: !/^\d{17}[\dXx]$/.test(form.idCard) ? '请输入有效的18位身份证号' : '',
        phone: !/^1[3-9]\d{9}$/.test(form.phone) ? '请输入有效的11位手机号' : '',
        education: !form.education ? '请选择学历' : '',
        address: !form.address.trim() ? '请输入户籍地址' : '',
      };
    }
    else if (currentStep === 2) {
      valid = validateStep2();
      stepErrors = valid ? {} : {
        unemploymentReason: !form.unemploymentReason ? '请选择失业原因' : '',
        lastEmployer: !form.lastEmployer.trim() ? '请输入最后工作单位' : '',
        workYears: !form.workYears || Number(form.workYears) < 0 ? '请输入有效的工作年限' : '',
        lastPosition: !form.lastPosition.trim() ? '请输入最后岗位' : '',
      };
    }
    else if (currentStep === 3) {
      valid = validateStep3();
      stepErrors = valid ? {} : {
        expectedPositions: form.expectedPositions.length === 0 ? '请至少选择一个意向岗位' : '',
        expectedCity: !form.expectedCity ? '请选择意向工作地点' : '',
        salary: form.salaryMin >= form.salaryMax ? '最低薪资必须小于最高薪资' : '',
      };
    }
    else if (currentStep === 4) {
      valid = validateStep4();
    }

    if (!valid) {
      const missingFields = Object.entries(stepErrors)
        .filter(([, v]) => v)
        .map(([k]) => fieldLabels[k] || k)
        .join('、');
      toast(`请完善：${missingFields}`, 'error');
      return;
    }

    if (currentStep === 4) {
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resp = await httpPost('/employment/unemployment-register', {
        userId: user?.id || 1,
        realName: form.realName,
        idCard: form.idCard,
        phone: form.phone,
        registerType: '个人登记',
        education: form.education,
        workYears: Number(form.workYears),
        lastEmployer: form.lastEmployer,
        unemploymentReason: form.unemploymentReason,
        expectedPosition: form.expectedPositions.join(','),
        expectedSalaryMin: form.salaryMin,
        expectedSalaryMax: form.salaryMax,
        signatureData,
        remark: `户籍地址：${form.address}，意向城市：${form.expectedCity}，接受培训：${form.acceptTraining ? '是' : '否'}，最后岗位：${form.lastPosition}`,
      });
      if (resp.code === 0) {
        setSubmittedData({ id: resp.data.id, applicationNo: resp.data.applicationNo });
        setCurrentStep(5);
        toast('提交成功', 'success');
      } else {
        toast(resp.message || '提交失败', 'error');
      }
    } catch (e: any) {
      toast(e?.response?.data?.message || '提交失败，请稍后重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePosition = (pos: string) => {
    setForm((f) => ({
      ...f,
      expectedPositions: f.expectedPositions.includes(pos)
        ? f.expectedPositions.filter((p) => p !== pos)
        : [...f.expectedPositions, pos],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        <ChevronRight className="w-4 h-4" />
        <span onClick={() => navigate('/employment/unemployment-register')} className="cursor-pointer hover:text-gov-600">就业服务</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">失业登记</span>
      </div>

      <div className="gov-card p-6 md:p-8">
        <div className="flex items-start gap-3 mb-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shrink-0 shadow-gov">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gov-700 font-serif">失业登记 + 电子签章</h1>
            <p className="text-sm text-gray-500 mt-1">办理失业登记手续，完成电子签章后享受失业保险待遇及就业援助服务</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 shrink-0">
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;
                const status = isDone ? 'done' : isActive ? 'active' : 'pending';
                return (
                  <div key={step.id} className="relative">
                    <div className={cn(
                      'flex items-center gap-3 py-3 px-3 rounded-lg transition-colors',
                      isActive && 'bg-gov-50'
                    )}>
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 transition-all',
                        status === 'active' && 'bg-gradient-to-br from-gov-500 to-gov-700 text-white shadow-gov',
                        status === 'done' && 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
                        status === 'pending' && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                      )}>
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className={cn(
                          'text-sm font-semibold',
                          status === 'active' && 'text-gov-700',
                          status === 'done' && 'text-emerald-600',
                          status === 'pending' && 'text-gray-400'
                        )}>
                          Step {step.id}
                        </div>
                        <div className={cn(
                          'text-sm font-medium truncate',
                          status === 'active' && 'text-gov-600',
                          status === 'done' && 'text-emerald-700',
                          status === 'pending' && 'text-gray-500'
                        )}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={cn(
                        'absolute left-8 top-[52px] w-0.5 h-6',
                        isDone ? 'bg-emerald-400' : 'bg-gray-200'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-orange-50 border border-gold-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gold-600" />
                <span className="text-sm font-semibold text-gold-700">温馨提示</span>
              </div>
              <ul className="space-y-1 text-xs text-gold-800/80 leading-relaxed">
                <li>• 请如实填写所有信息</li>
                <li>• 电子签章具有法律效力</li>
                <li>• 审核周期约3-5个工作日</li>
              </ul>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User className="w-5 h-5" /> 基本信息填写
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FormLabel required>真实姓名</FormLabel>
                    <input
                      type="text"
                      value={form.realName}
                      onChange={(e) => setForm({ ...form, realName: e.target.value })}
                      className={cn('gov-input', errors.realName && 'border-red-400 focus:ring-red-500/20')}
                      placeholder="请输入真实姓名"
                    />
                    {errors.realName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.realName}</p>}
                  </div>
                  <div>
                    <FormLabel required>身份证号</FormLabel>
                    <input
                      type="text"
                      value={form.idCard}
                      maxLength={18}
                      onChange={(e) => setForm({ ...form, idCard: e.target.value.toUpperCase() })}
                      className={cn('gov-input', errors.idCard && 'border-red-400 focus:ring-red-500/20')}
                      placeholder="18位身份证号"
                    />
                    {errors.idCard && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.idCard}</p>}
                  </div>
                  <div>
                    <FormLabel required>手机号</FormLabel>
                    <input
                      type="tel"
                      value={form.phone}
                      maxLength={11}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                      className={cn('gov-input', errors.phone && 'border-red-400 focus:ring-red-500/20')}
                      placeholder="11位手机号"
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                  </div>
                  <div>
                    <FormLabel required>学历</FormLabel>
                    <select
                      value={form.education}
                      onChange={(e) => setForm({ ...form, education: e.target.value })}
                      className={cn('gov-input', errors.education && 'border-red-400 focus:ring-red-500/20')}
                    >
                      <option value="">请选择学历</option>
                      {educationOptions.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
                    </select>
                    {errors.education && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.education}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel required>户籍地址</FormLabel>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className={cn('gov-input', errors.address && 'border-red-400 focus:ring-red-500/20')}
                      placeholder="请输入详细户籍地址（省/市/区/街道/门牌号）"
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.address}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Briefcase className="w-5 h-5" /> 失业情况填写
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FormLabel required>失业原因</FormLabel>
                    <select
                      value={form.unemploymentReason}
                      onChange={(e) => setForm({ ...form, unemploymentReason: e.target.value })}
                      className={cn('gov-input', errors.unemploymentReason && 'border-red-400 focus:ring-red-500/20')}
                    >
                      <option value="">请选择失业原因</option>
                      {unemploymentReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.unemploymentReason && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.unemploymentReason}</p>}
                  </div>
                  <div>
                    <FormLabel required>工作年限</FormLabel>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={form.workYears}
                        onChange={(e) => setForm({ ...form, workYears: e.target.value })}
                        className={cn('gov-input pr-10', errors.workYears && 'border-red-400 focus:ring-red-500/20')}
                        placeholder="累计工作年限"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">年</span>
                    </div>
                    {errors.workYears && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.workYears}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel required>最后工作单位</FormLabel>
                    <input
                      type="text"
                      value={form.lastEmployer}
                      onChange={(e) => setForm({ ...form, lastEmployer: e.target.value })}
                      className={cn('gov-input', errors.lastEmployer && 'border-red-400 focus:ring-red-500/20')}
                      placeholder="请输入最后工作单位全称"
                    />
                    {errors.lastEmployer && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lastEmployer}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel required>最后岗位</FormLabel>
                    <input
                      type="text"
                      value={form.lastPosition}
                      onChange={(e) => setForm({ ...form, lastPosition: e.target.value })}
                      className={cn('gov-input', errors.lastPosition && 'border-red-400 focus:ring-red-500/20')}
                      placeholder="请输入在最后单位的岗位名称"
                    />
                    {errors.lastPosition && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lastPosition}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Target className="w-5 h-5" /> 就业意向填写
                </h2>
                <div className="space-y-5">
                  <div>
                    <FormLabel required>意向岗位（可多选）</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {positionOptions.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePosition(p)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
                            form.expectedPositions.includes(p)
                              ? 'bg-gov-50 border-gov-500 text-gov-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gov-300'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {errors.expectedPositions && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.expectedPositions}</p>}
                  </div>
                  <div>
                    <FormLabel required>意向工作地点</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {cityOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm({ ...form, expectedCity: c })}
                          className={cn(
                            'px-5 py-2 rounded-lg text-sm font-medium transition-all border-2',
                            form.expectedCity === c
                              ? 'bg-gov-50 border-gov-500 text-gov-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gov-300'
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {errors.expectedCity && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.expectedCity}</p>}
                  </div>
                  <div>
                    <FormLabel required>期望薪资范围</FormLabel>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">最低薪资</p>
                          <p className="text-2xl font-bold text-gov-600">¥{form.salaryMin.toLocaleString()}</p>
                        </div>
                        <div className="text-3xl font-light text-gray-300">—</div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">最高薪资</p>
                          <p className="text-2xl font-bold text-gold-600">¥{form.salaryMax.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <input
                            type="range"
                            min="2000"
                            max="30000"
                            step="500"
                            value={form.salaryMin}
                            onChange={(e) => setForm({ ...form, salaryMin: Math.min(Number(e.target.value), form.salaryMax - 500) })}
                            className="w-full accent-gov-500"
                          />
                        </div>
                        <div>
                          <input
                            type="range"
                            min="2000"
                            max="50000"
                            step="500"
                            value={form.salaryMax}
                            onChange={(e) => setForm({ ...form, salaryMax: Math.max(Number(e.target.value), form.salaryMin + 500) })}
                            className="w-full accent-gold-500"
                          />
                        </div>
                      </div>
                      {errors.salary && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.salary}</p>}
                    </div>
                  </div>
                  <div>
                    <FormLabel>是否接受免费职业技能培训</FormLabel>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={form.acceptTraining === true}
                          onChange={() => setForm({ ...form, acceptTraining: true })}
                          className="w-4 h-4 accent-gov-500"
                        />
                        <span className="text-sm text-gray-700">接受培训推荐</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={form.acceptTraining === false}
                          onChange={() => setForm({ ...form, acceptTraining: false })}
                          className="w-4 h-4 accent-gov-500"
                        />
                        <span className="text-sm text-gray-700">暂不接受</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-2 border-b border-gray-100">
                  <PenLine className="w-5 h-5" /> 电子签章
                </h2>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    请在下方画布内使用鼠标或触屏完成<strong className="text-gov-600">手写签名</strong>，确认后即视为您已阅读并同意《失业登记承诺书》所有条款。
                  </p>
                  <div className="seal-canvas overflow-hidden mb-4">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                      className="w-full bg-white cursor-crosshair"
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Eraser className="w-4 h-4" /> 清除签名
                    </button>
                    <button
                      type="button"
                      onClick={() => { clearSignature(); toast('请重新签名', 'info'); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> 重新签名
                    </button>
                    <button
                      type="button"
                      onClick={confirmSignature}
                      className={cn(
                        'flex items-center gap-2 px-6 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md',
                        hasSignature
                          ? 'bg-gradient-to-r from-gov-500 to-gov-700 hover:shadow-gov hover:scale-[1.02]'
                          : 'bg-gray-300 cursor-not-allowed'
                      )}
                    >
                      <ShieldCheck className="w-4 h-4" /> 确认签章
                    </button>
                  </div>
                </div>
                {sealInfo && signatureData && (
                  <div className="border-2 border-gold-300 rounded-xl overflow-hidden shadow-gov bg-gradient-to-br from-white to-gold-50/30 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-gold-400/20 to-gold-300/10 px-5 py-3 border-b border-gold-200 flex items-center gap-2">
                      <Award className="w-5 h-5 text-gold-600" />
                      <span className="font-bold text-gold-700">电子签章证书信息</span>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2 flex justify-center">
                        <img
                          src={signatureData}
                          alt="电子签名"
                          className="h-24 bg-white rounded-lg border border-gray-200 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">签章时间：</span>
                          <span className="text-sm font-medium text-gray-800">{sealInfo.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">签章人：</span>
                          <span className="text-sm font-medium text-gray-800">{sealInfo.person}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">签章编号：</span>
                          <span className="text-sm font-medium text-gov-600 font-mono">{sealInfo.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-medium text-emerald-600">该签章已备案，具有法律效力</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && submittedData && (
              <div className="text-center py-8 animate-fade-in-up">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-gov animate-float">
                  <CheckCircle className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gov-700 font-serif mb-2">提交成功！</h2>
                <p className="text-gray-500 mb-6">您的失业登记申请已成功提交，请耐心等待审核</p>
                <div className="inline-block bg-gradient-to-r from-gov-50 to-blue-50 border border-gov-200 rounded-xl px-8 py-5 mb-8 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">登记编号</div>
                  <div className="text-2xl font-mono font-bold text-gov-600 tracking-wider">{submittedData.applicationNo}</div>
                  <div className="text-xs text-gray-400 mt-2">内部ID: {submittedData.id}</div>
                </div>
                <div className="max-w-md mx-auto text-left bg-gray-50 rounded-xl p-5 border border-gray-100 mb-8">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gov-500" /> 审核流程时间线
                  </h3>
                  <div className="space-y-4">
                    {[
                      { s: '提交申请', t: new Date().toLocaleString('zh-CN'), done: true },
                      { s: '街道初审', t: '预计 1-2 个工作日', done: false },
                      { s: '区级复核', t: '预计 2-3 个工作日', done: false },
                      { s: '完成登记', t: '预计 3-5 个工作日', done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          item.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                        )}>
                          {item.done ? <CheckCircle className="w-4 h-4" /> : (i + 1)}
                        </div>
                        <div className="flex-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                          <div className={cn('font-medium text-sm', item.done ? 'text-emerald-700' : 'text-gray-600')}>{item.s}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep < 5 && (
              <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all',
                    currentStep === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <ChevronLeft className="w-4 h-4" /> 上一步
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className="gov-btn flex items-center gap-2"
                >
                  {loading ? '提交中...' : currentStep === 4 ? '确认提交' : '下一步'}
                  {!loading && currentStep !== 4 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex justify-center gap-4 pt-8 mt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/user/applications')}
                  className="gov-btn"
                >
                  查看办件进度
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  返回首页
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
