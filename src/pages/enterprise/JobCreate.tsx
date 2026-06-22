import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, Check, FileText, Briefcase, DollarSign, Calendar, MapPin, Users } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(2, '职位名称至少2个字符'),
  jd: z.string().min(50, '岗位JD至少50个字符，请详细描述岗位职责和任职要求'),
  salaryMin: z.number().min(1000, '最低薪资不能低于1000元'),
  salaryMax: z.number().min(1000, '最高薪资不能低于1000元'),
  arrivalTime: z.string().min(1, '请选择到岗时间'),
  employmentType: z.enum(['fulltime', 'parttime', 'project'], {
    errorMap: () => ({ message: '请选择用工性质' }),
  }),
  location: z.string().min(2, '请填写工作地点'),
});

type FormData = z.infer<typeof formSchema>;
type FormStep = 'basic' | 'detail' | 'review';

export default function JobCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FormStep>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    title: '',
    jd: '',
    salaryMin: 8000,
    salaryMax: 15000,
    arrivalTime: '',
    employmentType: 'fulltime',
    location: '昆明市五华区',
  });

  const updateField = (key: keyof FormData, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: '' }));
    }
  };

  const validateStep = (s: FormStep): boolean => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (s === 'basic') {
      fieldsToValidate = ['title', 'employmentType', 'location'];
    } else if (s === 'detail') {
      fieldsToValidate = ['salaryMin', 'salaryMax', 'arrivalTime', 'jd'];
    }

    const partialData: Partial<FormData> = {};
    fieldsToValidate.forEach((k) => {
      (partialData as Record<string, string | number>)[k] = form[k];
    });

    const result = formSchema.partial().safeParse(partialData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    if (s === 'detail' && form.salaryMax <= form.salaryMin) {
      setErrors({ salaryMax: '最高薪资必须大于最低薪资' });
      return false;
    }

    setErrors({});
    return true;
  };

  const isStepComplete = (s: FormStep): boolean => {
    if (s === 'basic') {
      return form.title.length >= 2 && form.location.length >= 2 && !!form.employmentType;
    }
    if (s === 'detail') {
      return form.jd.length >= 50 && form.arrivalTime && form.salaryMin >= 1000 && form.salaryMax > form.salaryMin;
    }
    if (s === 'review') {
      return isStepComplete('basic') && isStepComplete('detail');
    }
    return false;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step === 'basic') setStep('detail');
    else if (step === 'detail') setStep('review');
  };

  const prevStep = () => {
    if (step === 'detail') setStep('basic');
    else if (step === 'review') setStep('detail');
  };

  const handleSubmit = () => {
    const result = formSchema.safeParse(form);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }
    alert('职位发布成功！');
    navigate('/enterprise/jobs');
  };

  const steps: { key: FormStep; label: string; icon: typeof FileText; fields: string[] }[] = [
    { key: 'basic', label: '基本信息', icon: Briefcase, fields: ['职位名称', '用工性质', '工作地点'] },
    { key: 'detail', label: '详细信息', icon: FileText, fields: ['薪资范围', '到岗时间', '岗位JD'] },
    { key: 'review', label: '确认发布', icon: Check, fields: ['信息核对、提交发布'] },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  const employmentTypes = [
    { value: 'fulltime', label: '全职', desc: '长期稳定的正式岗位' },
    { value: 'parttime', label: '兼职', desc: '按工作时间结算的灵活岗位' },
    { value: 'project', label: '项目制', desc: '按项目周期交付的岗位' },
  ];

  const typeLabel: Record<string, string> = {
    fulltime: '全职',
    parttime: '兼职',
    project: '项目制',
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="card p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ash-700">发布新职位</h2>
            <p className="text-sm text-ash-500 mt-1">完成以下三步，即可发布职位开始招聘</p>
          </div>
          <div className="text-sm text-ash-500">
            当前进度：<span className="font-semibold text-terracotta-600">{currentStepIdx + 1}</span> / {steps.length}
          </div>
        </div>

        <div className="flex items-stretch justify-between mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentStepIdx;
            const isCompleted = i < currentStepIdx;
            const isComplete = isStepComplete(s.key);

            return (
              <div key={s.key} className="flex items-stretch flex-1">
                <button
                  onClick={() => {
                    if (i < currentStepIdx || (i === currentStepIdx)) setStep(s.key);
                  }}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                    isCompleted
                      ? 'border-spruce-200 bg-spruce-50 cursor-pointer hover:bg-spruce-50'
                      : isActive
                        ? 'border-terracotta-500 bg-terracotta-50'
                        : 'border-ash-100 bg-white cursor-default opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-spruce-500 text-white'
                          : isActive
                            ? 'bg-terracotta-500 text-white'
                            : 'bg-ash-100 text-ash-400'
                      }`}
                    >
                      {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isActive || isCompleted ? 'text-ash-700' : 'text-ash-500'}`}>
                        第{i + 1}步 · {s.label}
                      </div>
                      <div className="text-xs text-ash-400 mt-0.5 truncate">
                        {s.fields.join('、')}
                      </div>
                    </div>
                    {isComplete && (
                      <Check size={16} className="text-spruce-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
                {i < steps.length - 1 && (
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    <ChevronRight
                      size={20}
                      className={i < currentStepIdx ? 'text-spruce-400' : 'text-ash-200'}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {step === 'basic' && (
          <div className="space-y-6">
            <div className="p-4 bg-terracotta-50 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-terracotta-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-terracotta-700">基本信息</p>
                <p className="text-sm text-terracotta-600 mt-1">
                  请填写职位的基础信息。下一步将填写薪资范围、到岗时间和岗位JD等详细信息。
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                职位名称 <span className="text-terracotta-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="如：高级前端开发工程师、Java后端开发、市场专员"
                className={`input-field ${errors.title ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
              />
              {errors.title && (
                <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-3">
                用工性质 <span className="text-terracotta-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {employmentTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => updateField('employmentType', t.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.employmentType === t.value
                        ? 'border-terracotta-500 bg-terracotta-50'
                        : 'border-ash-100 hover:border-ash-200'
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        form.employmentType === t.value ? 'text-terracotta-600' : 'text-ash-700'
                      }`}
                    >
                      {t.label}
                    </p>
                    <p className="text-xs text-ash-500 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
              {errors.employmentType && (
                <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.employmentType}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                工作地点 <span className="text-terracotta-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-400" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="如：云南省昆明市五华区**路**大厦"
                  className={`input-field pl-11 ${errors.location ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.location}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 'detail' && (
          <div className="space-y-6">
            <div className="p-4 bg-spruce-50 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-spruce-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-spruce-700">详细信息</p>
                <p className="text-sm text-spruce-600 mt-1">
                  薪资、到岗时间和岗位JD是候选人重点关注的信息，请如实详细填写。
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                薪资范围（元/月）<span className="text-terracotta-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-400" />
                    <input
                      type="number"
                      value={form.salaryMin}
                      onChange={(e) => updateField('salaryMin', Number(e.target.value))}
                      placeholder="最低薪资"
                      className={`input-field pl-11 ${errors.salaryMin ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
                    />
                  </div>
                  {errors.salaryMin && (
                    <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.salaryMin}
                    </p>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-400" />
                    <input
                      type="number"
                      value={form.salaryMax}
                      onChange={(e) => updateField('salaryMax', Number(e.target.value))}
                      placeholder="最高薪资"
                      className={`input-field pl-11 ${errors.salaryMax ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
                    />
                  </div>
                  {errors.salaryMax && (
                    <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.salaryMax}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                预计到岗时间 <span className="text-terracotta-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-400" />
                <input
                  type="date"
                  value={form.arrivalTime}
                  onChange={(e) => updateField('arrivalTime', e.target.value)}
                  className={`input-field pl-11 ${errors.arrivalTime ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
                />
              </div>
              {errors.arrivalTime && (
                <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.arrivalTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                岗位JD <span className="text-terracotta-500">*</span>
                <span className="text-ash-400 font-normal ml-2">（至少50字，详细的JD更能吸引精准候选人）</span>
              </label>
              <div className="mb-2 p-3 bg-ash-50 rounded-lg text-sm text-ash-500 flex items-start gap-2">
                <Users size={16} className="flex-shrink-0 mt-0.5" />
                <span>建议包含：岗位职责（3-5条）、任职要求（学历、经验、技能等）、加分项、公司福利等。</span>
              </div>
              <textarea
                value={form.jd}
                onChange={(e) => updateField('jd', e.target.value)}
                rows={14}
                placeholder={`岗位职责：\n1. 负责公司前端项目的开发和维护，参与技术方案设计\n2. 与产品、UI、后端紧密配合，确保项目高质量交付\n3. 持续优化产品用户体验，提升页面性能和稳定性\n\n任职要求：\n1. 本科及以上学历，计算机相关专业，3年以上前端开发经验\n2. 熟练掌握 React、TypeScript、Vite 等现代前端技术栈\n3. 熟悉 Node.js，有 Webpack/Vite 配置和工程化经验优先\n4. 具备良好的沟通能力和团队协作精神`}
                className={`input-field resize-none leading-relaxed ${errors.jd ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
              />
              <div className="flex justify-between mt-1.5">
                {errors.jd ? (
                  <p className="text-sm text-terracotta-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.jd}
                  </p>
                ) : (
                  <span></span>
                )}
                <p className={`text-sm ${form.jd.length >= 50 ? 'text-spruce-600' : 'text-ash-400'}`}>
                  已输入 {form.jd.length} 字{form.jd.length >= 50 ? ' ✓' : ` / 需50字`}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="p-4 bg-spruce-50 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-spruce-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-spruce-700">请确认职位信息</p>
                <p className="text-sm text-spruce-600 mt-1">
                  请仔细核对以下信息，确认无误后点击发布。职位发布后将立即展示给求职者。
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-ash-50 rounded-lg">
                  <p className="text-sm text-ash-500">职位名称</p>
                  <p className="font-medium text-ash-700 mt-1">{form.title || '-'}</p>
                </div>
                <div className="p-4 bg-ash-50 rounded-lg">
                  <p className="text-sm text-ash-500">用工性质</p>
                  <p className="font-medium text-ash-700 mt-1">{typeLabel[form.employmentType]}</p>
                </div>
                <div className="p-4 bg-ash-50 rounded-lg">
                  <p className="text-sm text-ash-500">薪资范围</p>
                  <p className="font-medium text-terracotta-600 mt-1">
                    {form.salaryMin / 1000}K - {form.salaryMax / 1000}K /月
                  </p>
                </div>
                <div className="p-4 bg-ash-50 rounded-lg">
                  <p className="text-sm text-ash-500">预计到岗时间</p>
                  <p className="font-medium text-ash-700 mt-1">{form.arrivalTime || '-'}</p>
                </div>
              </div>
              <div className="p-4 bg-ash-50 rounded-lg">
                <p className="text-sm text-ash-500">工作地点</p>
                <p className="font-medium text-ash-700 mt-1">{form.location || '-'}</p>
              </div>
              <div className="p-4 bg-ash-50 rounded-lg">
                <p className="text-sm text-ash-500 mb-2">岗位JD</p>
                <div className="text-ash-700 whitespace-pre-wrap leading-relaxed text-sm bg-white rounded-lg p-4 border border-ash-100">
                  {form.jd || <span className="text-ash-400">未填写</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        {step !== 'basic' ? (
          <button onClick={prevStep} className="btn-secondary">
            上一步
          </button>
        ) : (
          <button onClick={() => navigate('/enterprise/jobs')} className="btn-secondary">
            取消
          </button>
        )}
        {step !== 'review' ? (
          <button onClick={nextStep} className="btn-primary flex items-center gap-2">
            下一步
            <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-success">
            确认发布
          </button>
        )}
      </div>
    </div>
  );
}
