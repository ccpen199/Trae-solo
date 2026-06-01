import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '@/api/jobs';

const categories = ['餐饮服务', '零售促销', '活动执行', '家政服务', '线上兼职', '物流配送', '教育培训', '其他'];
const payTypes = [
  { value: 'daily', label: '日结' },
  { value: 'weekly', label: '周结' },
  { value: 'project', label: '项目制' },
  { value: 'online', label: '线上' },
];
const skillOptions = ['服务经验', '驾驶技能', '健康证明', '教学能力', '电脑操作', '沟通能力', '体力劳动', '外语能力'];

export default function JobCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    pay_type: 'daily',
    pay_amount: '',
    pay_unit: '元/天',
    location: '',
    work_start: '',
    work_end: '',
    safety_level: 1,
    required_count: 1,
    required_skills: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter((s) => s !== skill)
        : [...prev.required_skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createJob({
        ...form,
        pay_amount: Number(form.pay_amount),
      });
      navigate('/jobs');
    } catch (err: any) {
      alert(err.response?.data?.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">发布岗位</h1>

      <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-5">
        <div>
          <label className="label-text">岗位标题 *</label>
          <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} className="input-field" placeholder="请输入岗位标题" required />
        </div>

        <div>
          <label className="label-text">岗位描述</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field min-h-[120px]" placeholder="详细描述岗位内容、要求等" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-text">分类</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)} className="select-field">
              <option value="">请选择</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">薪资类型 *</label>
            <select value={form.pay_type} onChange={(e) => update('pay_type', e.target.value)} className="select-field">
              {payTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-text">薪资金额 *</label>
            <input type="number" value={form.pay_amount} onChange={(e) => update('pay_amount', e.target.value)} className="input-field" placeholder="0" min="0" required />
          </div>
          <div>
            <label className="label-text">薪资单位</label>
            <input type="text" value={form.pay_unit} onChange={(e) => update('pay_unit', e.target.value)} className="input-field" placeholder="元/天" />
          </div>
        </div>

        <div>
          <label className="label-text">工作地点</label>
          <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="工作地点" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-text">开始日期</label>
            <input type="date" value={form.work_start} onChange={(e) => update('work_start', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">结束日期</label>
            <input type="date" value={form.work_end} onChange={(e) => update('work_end', e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-text">招聘人数</label>
            <input type="number" value={form.required_count} onChange={(e) => update('required_count', Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div>
            <label className="label-text">安全等级</label>
            <select value={form.safety_level} onChange={(e) => update('safety_level', Number(e.target.value))} className="select-field">
              <option value={1}>低风险</option>
              <option value={2}>中风险</option>
              <option value={3}>高风险</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-text">技能要求</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  form.required_skills.includes(skill) ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? '发布中...' : '发布岗位'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">取消</button>
        </div>
      </form>
    </div>
  );
}
