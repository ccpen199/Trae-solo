import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
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

  const steps: { key: FormStep; label: string }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'detail', label: '详细信息' },
    { key: 'review', label: '确认发布' },
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
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    i < currentStepIdx
                      ? 'bg-spruce-500 text-white'
                      : i === currentStepIdx
                        ? 'bg-terracotta-500 text-white'
                        : 'bg-ash-100 text-ash-400'
                  }`}
                >
                  {i < currentStepIdx ? '✓' : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    i <= currentStepIdx ? 'text-ash-700' : 'text-ash-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    i < currentStepIdx ? 'bg-spruce-500' : 'bg-ash-100'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                职位名称 <span className="text-terracotta-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="如：高级前端开发工程师"
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
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="如：云南省昆明市五华区**路**大厦"
                className={`input-field ${errors.location ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
              />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-2">
                  最低薪资（元/月）<span className="text-terracotta-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => updateField('salaryMin', Number(e.target.value))}
                  className={`input-field ${errors.salaryMin ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
                />
                {errors.salaryMin && (
                  <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.salaryMin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-2">
                  最高薪资（元/月）<span className="text-terracotta-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => updateField('salaryMax', Number(e.target.value))}
                  className={`input-field ${errors.salaryMax ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
                />
                {errors.salaryMax && (
                  <p className="text-sm text-terracotta-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.salaryMax}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ash-600 mb-2">
                预计到岗时间 <span className="text-terracotta-500">*</span>
              </label>
              <input
                type="date"
                value={form.arrivalTime}
                onChange={(e) => updateField('arrivalTime', e.target.value)}
                className={`input-field ${errors.arrivalTime ? 'border-terracotta-500 focus:ring-terracotta-500/30' : ''}`}
              />
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
              </label>
              <div className="mb-2 p-3 bg-ash-50 rounded-lg text-sm text-ash-500">
                请详细填写岗位职责和任职要求，内容越详细越能吸引精准的候选人。建议包含：岗位职责、任职要求、加分项、公司福利等。
              </div>
              <textarea
                value={form.jd}
                onChange={(e) => updateField('jd', e.target.value)}
                rows={12}
                placeholder={`岗位职责：\n1. \n2. \n3. \n\n任职要求：\n1. \n2. \n3.`}
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
                <p className="text-sm text-ash-400">已输入 {form.jd.length} 字</p>
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

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    {form.salaryMin / 1000}K - {form.salaryMax / 1000}K
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
                <p className="text-sm text-ash-500">岗位JD</p>
                <p className="text-ash-700 mt-2 whitespace-pre-wrap leading-relaxed">{form.jd}</p>
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
