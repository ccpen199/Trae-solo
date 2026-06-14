import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Home, Banknote, AlertCircle, FileUp, CheckCircle, XCircle,
  User, Building2, Calendar, Users, MapPin, Info, Sparkles,
  ArrowRight, CircleCheck, CircleX, Clock, ShieldCheck, Percent
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

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

interface PreCheckResult {
  passed: boolean;
  estimatedAmount: number;
  estimatedTerm: number;
  interestRate: number;
  reasons: string[];
  suggestions: string[];
  applicationNo: string;
}

const educationOptions = ['初中及以下', '高中/中专', '大专', '本科', '硕士', '博士'];
const industryOptions = [
  '制造业', '批发零售', '住宿餐饮', '信息技术服务', '商务服务业',
  '交通运输', '建筑业', '农业', '教育', '文化娱乐', '其他'
];
const purposeOptions = ['进货采购', '店铺扩张', '设备购置', '研发投入', '人员工资', '流动资金', '其他'];

export default function EntrepreneurLoanPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [preResult, setPreResult] = useState<PreCheckResult | null>(null);
  const [selfTestPassed, setSelfTestPassed] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    realName: '',
    idCard: '',
    phone: '',
    education: '',
    enterpriseName: '',
    creditCode: '',
    establishDate: '',
    industry: '',
    employeeCount: '',
    registerAddress: '',
    loanAmount: 150000,
    loanTerm: 24,
    loanPurpose: '',
    businessDesc: '',
    workYears: 2,
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selfTestQuestions = [
    { q: '您是否为本市户籍或持有本市居住证？', weight: 20 },
    { q: '您是否有固定经营场所？', weight: 20 },
    { q: '您是否已办理工商营业执照？', weight: 20 },
    { q: '您的信用记录是否良好（无逾期90天以上）？', weight: 20 },
    { q: '您是否有稳定经营收入（半年以上）？', weight: 20 },
  ];
  const [selfTestAnswers, setSelfTestAnswers] = useState<(boolean | null)[]>(selfTestQuestions.map(() => null));

  const calculateSelfTest = () => {
    if (selfTestAnswers.some((a) => a === null)) {
      toast('请完成所有资格自测题', 'error');
      return;
    }
    const score = selfTestAnswers.reduce((acc, ans, i) => acc + (ans ? selfTestQuestions[i].weight : 0), 0);
    setSelfTestPassed(score >= 60);
    if (score >= 60) {
      toast(`自测通过！得分：${score}分`, 'success');
    } else {
      toast(`自测未通过，得分：${score}分，建议得分60分以上再申请`, 'error');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.realName.trim()) errs.realName = '请输入姓名';
    if (!/^\d{17}[\dXx]$/.test(form.idCard)) errs.idCard = '请输入有效的18位身份证号';
    if (!/^1[3-9]\d{9}$/.test(form.phone)) errs.phone = '请输入有效的11位手机号';
    if (!form.education) errs.education = '请选择学历';
    if (!form.enterpriseName.trim()) errs.enterpriseName = '请输入企业名称';
    if (form.creditCode && !/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(form.creditCode)) {
      errs.creditCode = '请输入有效的18位统一社会信用代码';
    }
    if (!form.establishDate) errs.establishDate = '请选择成立时间';
    if (!form.industry) errs.industry = '请选择所属行业';
    if (!form.employeeCount || Number(form.employeeCount) < 0) errs.employeeCount = '请输入有效的员工人数';
    if (!form.registerAddress.trim()) errs.registerAddress = '请输入注册地址';
    if (form.loanAmount < 10000) errs.loanAmount = '贷款金额至少1万元';
    if (!form.loanPurpose) errs.loanPurpose = '请选择贷款用途';
    if (!form.businessDesc.trim() || form.businessDesc.length < 20) errs.businessDesc = '经营情况描述至少20字';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpload = () => {
    const mockFiles: UploadedFile[] = [
      { id: Date.now().toString() + '1', name: '营业执照.jpg', size: '2.3MB' },
      { id: Date.now().toString() + '2', name: '身份证正反面.pdf', size: '1.1MB' },
    ];
    setUploadedFiles([...uploadedFiles, ...mockFiles]);
    toast('材料上传成功（模拟）', 'success');
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (selfTestPassed === null) {
      toast('请先完成资格自测', 'error');
      return;
    }
    if (!selfTestPassed) {
      toast('资格自测未通过，无法提交预审', 'error');
      return;
    }
    if (!validate()) {
      toast('请完善所有必填信息', 'error');
      return;
    }
    setLoading(true);
    try {
      const resp = await httpPost('/employment/entrepreneur-loan', {
        userId: user?.id || 1,
        realName: form.realName,
        idCard: form.idCard,
        phone: form.phone,
        enterpriseName: form.enterpriseName,
        creditCode: form.creditCode,
        loanAmount: Number(form.loanAmount),
        loanTerm: Number(form.loanTerm),
        loanPurpose: form.loanPurpose,
        businessAddress: form.registerAddress,
        remark: `学历：${form.education}，行业：${form.industry}，员工人数：${form.employeeCount}，成立时间：${form.establishDate}，经营描述：${form.businessDesc}`,
        workYears: Number(form.workYears),
      });
      if (resp.code === 0) {
        const r = resp.data.preCheckResult;
        setPreResult({
          passed: r.passed,
          estimatedAmount: r.estimatedAmount,
          estimatedTerm: r.estimatedTerm,
          interestRate: r.interestRate,
          reasons: r.reasons || [],
          suggestions: r.suggestions || [],
          applicationNo: resp.data.applicationNo,
        });
        toast(r.passed ? '预审通过！' : '预审完成，请查看结果', r.passed ? 'success' : 'info');
      } else {
        toast(resp.message || '预审失败', 'error');
      }
    } catch (e: any) {
      toast(e?.response?.data?.message || '预审失败，请稍后重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Home className="w-4 h-4 cursor-pointer" onClick={() => navigate('/')} />
        <ChevronRight className="w-4 h-4" />
        <span className="cursor-pointer hover:text-gov-600" onClick={() => navigate('/employment/entrepreneur-loan')}>就业服务</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-600 font-medium">创业担保贷款</span>
      </div>

      <div className="gov-card p-6 md:p-8">
        <div className="flex items-start gap-3 mb-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-gov">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gov-700 font-serif">创业担保贷款 · 在线预审</h1>
            <p className="text-sm text-gray-500 mt-1">最高300万额度 · 政府贴息 · 快速审批 · 助力创业</p>
          </div>
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-200">
            <Sparkles className="w-4 h-4 text-gold-600" />
            <span className="text-sm font-semibold text-gold-700">政府贴息 LPR-150BP</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gov-50 via-blue-50 to-gov-50 rounded-xl p-5 border border-gov-100 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gov-500 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gov-700 mb-2 flex items-center gap-2">
                申请须知
                <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">必读</span>
              </h3>
              <ul className="text-sm text-gray-600 space-y-1.5 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <li className="flex items-start gap-2"><span className="text-gov-500 font-bold">1.</span> 申请人为法定劳动年龄内的城乡创业者</li>
                <li className="flex items-start gap-2"><span className="text-gov-500 font-bold">2.</span> 个人最高20万，小微企业最高300万</li>
                <li className="flex items-start gap-2"><span className="text-gov-500 font-bold">3.</span> 贷款期限最长3年，可享受财政贴息</li>
                <li className="flex items-start gap-2"><span className="text-gov-500 font-bold">4.</span> 需提供相关经营证明材料及反担保措施</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-dashed border-gov-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-bold text-gov-700 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gov-500" />
              资格自测 · 快速预审
              {selfTestPassed !== null && (
                selfTestPassed
                  ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1"><CircleCheck className="w-3 h-3" /> 通过</span>
                  : <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full flex items-center gap-1"><CircleX className="w-3 h-3" /> 未通过</span>
              )}
            </h3>
            <button
              onClick={calculateSelfTest}
              className="px-4 py-2 rounded-lg bg-gov-50 text-gov-600 text-sm font-medium hover:bg-gov-100 transition-colors flex items-center gap-1"
            >
              计算得分 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {selfTestQuestions.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-gov-500 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-sm text-gray-700 truncate">{item.q}</span>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => {
                      const arr = [...selfTestAnswers]; arr[i] = true; setSelfTestAnswers(arr);
                    }}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-sm font-medium transition-all border-2',
                      selfTestAnswers[i] === true
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                    )}
                  >
                    是
                  </button>
                  <button
                    onClick={() => {
                      const arr = [...selfTestAnswers]; arr[i] = false; setSelfTestAnswers(arr);
                    }}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-sm font-medium transition-all border-2',
                      selfTestAnswers[i] === false
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                    )}
                  >
                    否
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!preResult ? (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-3 border-b border-gray-100 mb-5">
                <User className="w-5 h-5 text-gov-500" /> 个人信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FormLabel required>姓名</FormLabel>
                  <input
                    type="text"
                    value={form.realName}
                    onChange={(e) => setForm({ ...form, realName: e.target.value })}
                    className={cn('gov-input', errors.realName && 'border-red-400')}
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
                    className={cn('gov-input', errors.idCard && 'border-red-400')}
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
                    className={cn('gov-input', errors.phone && 'border-red-400')}
                    placeholder="11位手机号"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                </div>
                <div>
                  <FormLabel required>学历</FormLabel>
                  <select
                    value={form.education}
                    onChange={(e) => setForm({ ...form, education: e.target.value })}
                    className={cn('gov-input', errors.education && 'border-red-400')}
                  >
                    <option value="">请选择学历</option>
                    {educationOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.education && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.education}</p>}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-3 border-b border-gray-100 mb-5">
                <Building2 className="w-5 h-5 text-gov-500" /> 企业信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <FormLabel required>企业名称</FormLabel>
                  <input
                    type="text"
                    value={form.enterpriseName}
                    onChange={(e) => setForm({ ...form, enterpriseName: e.target.value })}
                    className={cn('gov-input', errors.enterpriseName && 'border-red-400')}
                    placeholder="请输入营业执照上的企业全称"
                  />
                  {errors.enterpriseName && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.enterpriseName}</p>}
                </div>
                <div>
                  <FormLabel>统一社会信用代码</FormLabel>
                  <input
                    type="text"
                    value={form.creditCode}
                    maxLength={18}
                    onChange={(e) => setForm({ ...form, creditCode: e.target.value.toUpperCase() })}
                    className={cn('gov-input', errors.creditCode && 'border-red-400')}
                    placeholder="选填，小微企业请填写"
                  />
                  {errors.creditCode && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.creditCode}</p>}
                </div>
                <div>
                  <FormLabel required>成立时间</FormLabel>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={form.establishDate}
                      onChange={(e) => setForm({ ...form, establishDate: e.target.value })}
                      className={cn('gov-input pl-10', errors.establishDate && 'border-red-400')}
                    />
                  </div>
                  {errors.establishDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.establishDate}</p>}
                </div>
                <div>
                  <FormLabel required>所属行业</FormLabel>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className={cn('gov-input', errors.industry && 'border-red-400')}
                  >
                    <option value="">请选择所属行业</option>
                    {industryOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.industry && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.industry}</p>}
                </div>
                <div>
                  <FormLabel required>员工人数</FormLabel>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      value={form.employeeCount}
                      onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                      className={cn('gov-input pl-10 pr-12', errors.employeeCount && 'border-red-400')}
                      placeholder="企业现有员工人数"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">人</span>
                  </div>
                  {errors.employeeCount && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.employeeCount}</p>}
                </div>
                <div className="md:col-span-2">
                  <FormLabel required>注册地址</FormLabel>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-4 top-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.registerAddress}
                      onChange={(e) => setForm({ ...form, registerAddress: e.target.value })}
                      className={cn('gov-input pl-10', errors.registerAddress && 'border-red-400')}
                      placeholder="营业执照注册地址（省/市/区/街道/门牌号）"
                    />
                  </div>
                  {errors.registerAddress && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.registerAddress}</p>}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-3 border-b border-gray-100 mb-5">
                <Banknote className="w-5 h-5 text-gold-500" /> 贷款信息
              </h2>
              <div className="space-y-5">
                <div>
                  <FormLabel required>贷款金额</FormLabel>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-500 mb-1">申请金额</p>
                      <p className="text-4xl font-bold text-gov-600 font-serif">¥{Number(form.loanAmount).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {[100000, 150000, 200000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setForm({ ...form, loanAmount: amount })}
                          className={cn(
                            'px-5 py-2 rounded-lg font-semibold transition-all border-2',
                            form.loanAmount === amount
                              ? 'bg-gov-500 text-white border-gov-500 shadow-md'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gov-300'
                          )}
                        >
                          {amount / 10000}万
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="3000000"
                      step="10000"
                      value={form.loanAmount}
                      onChange={(e) => setForm({ ...form, loanAmount: Number(e.target.value) })}
                      className="w-full accent-gov-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1万</span><span>300万（小微企业上限）</span>
                    </div>
                  </div>
                  {errors.loanAmount && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.loanAmount}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FormLabel required>贷款期限</FormLabel>
                    <div className="flex gap-2">
                      {[12, 24, 36].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, loanTerm: m })}
                          className={cn(
                            'flex-1 py-3 rounded-lg font-semibold transition-all border-2',
                            form.loanTerm === m
                              ? 'bg-gold-500 text-white border-gold-500 shadow-md'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gold-300'
                          )}
                        >
                          {m / 12}年（{m}月）
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FormLabel required>贷款用途</FormLabel>
                    <select
                      value={form.loanPurpose}
                      onChange={(e) => setForm({ ...form, loanPurpose: e.target.value })}
                      className={cn('gov-input', errors.loanPurpose && 'border-red-400')}
                    >
                      <option value="">请选择贷款用途</option>
                      {purposeOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    {errors.loanPurpose && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.loanPurpose}</p>}
                  </div>
                </div>
                <div>
                  <FormLabel required>经营情况描述</FormLabel>
                  <textarea
                    value={form.businessDesc}
                    onChange={(e) => setForm({ ...form, businessDesc: e.target.value })}
                    rows={4}
                    className={cn('gov-input resize-none', errors.businessDesc && 'border-red-400')}
                    placeholder="请简要描述近半年经营情况（营收、利润、市场情况等），至少20个字。"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.businessDesc && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.businessDesc}</p>}
                    <span className="text-xs text-gray-400 ml-auto">{form.businessDesc.length}字</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gov-700 font-serif flex items-center gap-2 pb-3 border-b border-gray-100 mb-5">
                <FileUp className="w-5 h-5 text-gov-500" /> 预审材料上传
              </h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gov-300 hover:bg-gov-50/30 transition-colors cursor-pointer" onClick={handleUpload}>
                <FileUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-gray-400">支持 JPG/PDF 格式，单个文件不超过10MB</p>
                <p className="text-xs text-gray-400 mt-1">建议上传：营业执照、身份证正反面、近6个月银行流水</p>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-gov-50 flex items-center justify-center shrink-0">
                          <FileUp className="w-4 h-4 text-gov-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                          <p className="text-xs text-gray-400">{f.size}</p>
                        </div>
                      </div>
                      <button onClick={removeFile.bind(null, f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="gov-btn px-12 py-3.5 text-base flex items-center gap-2"
              >
                {loading ? '预审计算中...' : '立即预审'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className={cn(
              'rounded-2xl overflow-hidden shadow-gov-lg',
              preResult.passed
                ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700'
                : 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700'
            )}>
              <div className="p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-10 right-10 w-40 h-40 border-2 border-white rounded-full"></div>
                  <div className="absolute bottom-10 left-10 w-60 h-60 border-2 border-white rounded-full"></div>
                </div>
                <div className="relative z-10">
                  {preResult.passed ? (
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
                      <Info className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div className="text-xs text-white/80 mb-1">预审结果</div>
                  <h2 className="text-3xl font-bold font-serif mb-2">{preResult.passed ? '预审通过' : '需进一步审核'}</h2>
                  <p className="text-sm text-white/90 mb-6">办件编号：<span className="font-mono">{preResult.applicationNo}</span></p>

                  <div className="inline-block bg-white/15 backdrop-blur-sm rounded-2xl px-10 py-6 border border-white/20 mb-4">
                    <div className="text-xs text-white/70 mb-1 flex items-center justify-center gap-1">
                      <Banknote className="w-3.5 h-3.5" /> 预估可贷额度
                    </div>
                    <div className="text-5xl font-bold font-serif">
                      <span className="text-gold-300">¥</span>
                      {preResult.estimatedAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="bg-gradient-to-br from-gov-50 to-blue-50 rounded-xl p-5 border border-gov-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gov-500" />
                      <span className="text-xs text-gray-500">建议期限</span>
                    </div>
                    <div className="text-2xl font-bold text-gov-700 font-serif">{preResult.estimatedTerm}<span className="text-base font-normal text-gray-500 ml-1">个月</span></div>
                  </div>
                  <div className="bg-gradient-to-br from-gold-50 to-orange-50 rounded-xl p-5 border border-gold-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-gold-600" />
                      <span className="text-xs text-gray-500">贴息利率</span>
                    </div>
                    <div className="text-2xl font-bold text-gold-700 font-serif">{preResult.interestRate}<span className="text-base font-normal text-gray-500 ml-1">%</span></div>
                    <div className="text-xs text-gold-600/80 mt-1">LPR-150BP 政府贴息后</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs text-gray-500">对接数据核验</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-1 text-xs"><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-gray-600">税务 - 纳税正常</span></div>
                      <div className="flex items-center gap-1 text-xs"><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-gray-600">市监 - 工商注册有效</span></div>
                      <div className="flex items-center gap-1 text-xs"><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-gray-600">医保 - 社保连续</span></div>
                    </div>
                  </div>
                </div>

                {preResult.reasons.length > 0 && (
                  <div className="mb-5">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" /> 说明事项
                    </h4>
                    <ul className="space-y-1">
                      {preResult.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-orange-50 rounded-lg px-4 py-2">
                          <span className="text-orange-500 font-bold">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {preResult.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gov-500" /> 建议
                    </h4>
                    <ul className="space-y-1">
                      {preResult.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gov-50 rounded-lg px-4 py-2">
                          <span className="text-gov-500 font-bold">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-5 border-t border-gray-100">
                  <button onClick={() => navigate('/user/applications')} className="gov-btn px-8">
                    查看办件进度
                  </button>
                  <button onClick={() => { setPreResult(null); }} className="px-8 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                    再申请一笔
                  </button>
                  <button onClick={() => navigate('/')} className="px-8 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
