import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';

const API = '/api';

const steps = [
  { key: 'basic', label: '基本信息' },
  { key: 'skills', label: '技能要求' },
  { key: 'salary', label: '薪资设置' },
  { key: 'publish', label: '发布范围' },
];

const typeApiMap: Record<string, string> = {
  'summer-winter': 'summer_winter',
  internship: 'internship',
  online: 'online',
};

export default function JobCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', type: 'summer-winter', department: '', description: '',
    skills: [] as string[], salaryMin: '', salaryMax: '', salaryType: 'monthly',
    publishRange: 'school', startDate: '', endDate: '', headcount: '',
  });

  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const availableSkills = ['Office办公', '数据分析', 'Python', '客户服务', '文案写作', '图像处理', '视频剪辑', '英语'];

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (status: 'published' | 'draft') => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        title: form.title,
        type: typeApiMap[form.type] || form.type,
        description: form.description,
        requirements: { skills: form.skills },
        salary_min: Number(form.salaryMin) || 0,
        salary_max: Number(form.salaryMax) || 0,
        org_id: 1,
        status,
        settlement_cycle: form.salaryType,
        headcount: Number(form.headcount) || 0,
      };
      const res = await fetch(`${API}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `请求失败: ${res.status}`);
      }
      navigate('/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/jobs')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-heading font-bold text-gray-800">发布新岗位</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card-base p-5">
          <div className="space-y-1">
            {steps.map((step, i) => (
              <button
                key={step.key}
                onClick={() => setCurrentStep(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  i === currentStep ? 'bg-primary text-white' : i < currentStep ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-500'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentStep ? 'bg-emerald-500 text-white' : i === currentStep ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < currentStep ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-sm font-medium">{step.label}</span>
                {i < currentStep && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
          <div className="mt-6 px-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              步骤 {currentStep + 1} / {steps.length}
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 card-base p-6">
          {currentStep === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">基本信息</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位名称</label>
                <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="请输入岗位名称" className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位类型</label>
                  <select value={form.type} onChange={(e) => updateForm('type', e.target.value)} className="input-base">
                    <option value="summer-winter">寒暑假工</option>
                    <option value="internship">实习</option>
                    <option value="online">线上任务</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">所属部门</label>
                  <input value={form.department} onChange={(e) => updateForm('department', e.target.value)} placeholder="请输入部门" className="input-base" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">开始日期</label>
                  <input type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">结束日期</label>
                  <input type="date" value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">招聘人数</label>
                <input type="number" value={form.headcount} onChange={(e) => updateForm('headcount', e.target.value)} placeholder="请输入招聘人数" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位描述</label>
                <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={4} placeholder="请详细描述岗位职责和要求" className="input-base resize-none" />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">技能要求</h3>
              <p className="text-sm text-gray-500">选择该岗位需要的技能标签</p>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.skills.includes(skill)
                        ? 'bg-accent text-white shadow-md shadow-accent/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {form.skills.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">已选择 {form.skills.length} 项技能</p>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill) => (
                      <span key={skill} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">薪资设置</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">最低薪资</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                    <input type="number" value={form.salaryMin} onChange={(e) => updateForm('salaryMin', e.target.value)} placeholder="0" className="input-base pl-8 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">最高薪资</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                    <input type="number" value={form.salaryMax} onChange={(e) => updateForm('salaryMax', e.target.value)} placeholder="0" className="input-base pl-8 font-mono" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">计薪方式</label>
                <div className="flex gap-3">
                  {[
                    { key: 'monthly', label: '月薪' },
                    { key: 'daily', label: '日薪' },
                    { key: 'hourly', label: '时薪' },
                    { key: 'task', label: '按件计费' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => updateForm('salaryType', opt.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.salaryType === opt.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-heading font-semibold text-gray-800 text-lg">发布范围</h3>
              <div className="space-y-3">
                {[
                  { key: 'school', label: '全校范围', desc: '所有学生均可查看和投递' },
                  { key: 'college', label: '指定学院', desc: '仅特定学院学生可见' },
                  { key: 'major', label: '指定专业', desc: '仅相关专业学生可见' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => updateForm('publishRange', opt.key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      form.publishRange === opt.key ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className={`btn-outline ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              上一步
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                className="btn-outline disabled:opacity-50"
              >
                保存草稿
              </button>
              {currentStep < steps.length - 1 ? (
                <button onClick={() => setCurrentStep(currentStep + 1)} className="btn-primary">
                  下一步
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit('published')}
                  disabled={submitting}
                  className="btn-accent disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '发布岗位'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
