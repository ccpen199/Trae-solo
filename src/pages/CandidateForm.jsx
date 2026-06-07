import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { api } from '../utils/api'

const industries = ['互联网', '人工智能', '金融科技', '医疗健康', '智能制造', '教育', '新能源', '电商']
const levels = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9']
const educations = ['本科', '硕士', '博士', 'MBA']
const statuses = [{ value: 'open', label: '开放机会' }, { value: 'exploring', label: '深度沟通' }, { value: 'closed', label: '暂不求职' }]
const skillCategories = ['前端', '后端', 'AI/ML', '数据', '运维', '设计', '产品', '架构', '工程化', '数据库', '可视化']

export default function CandidateForm() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', current_title: '', current_company: '',
    industry: '互联网', experience_years: 0, career_level: 'P5',
    expected_salary_min: '', expected_salary_max: '', education: '本科',
    location: '', job_status: 'open', summary: '',
  })
  const [skills, setSkills] = useState([{ skill_name: '', category: '前端', proficiency: 3, years_used: 1, weight: 1.0 }])
  const [projects, setProjects] = useState([])

  const skillsVector = useMemo(() => {
    return skills
      .filter((s) => s.skill_name.trim())
      .map((s) => s.skill_name.trim())
      .join(',')
  }, [skills])

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationErrors([])
  }

  function addSkill() {
    setSkills((prev) => [...prev, { skill_name: '', category: '前端', proficiency: 3, years_used: 1, weight: 1.0 }])
  }

  function updateSkill(index, field, value) {
    setSkills((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeSkill(index) {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  function addProject() {
    setProjects((prev) => [...prev, {
      project_name: '', role: '', tech_stack: '', start_date: '', end_date: '',
      description: '', quantified_outcome: '', revenue_impact: '', efficiency_gain: '',
      team_size: '', user_scale: '',
    }])
  }

  function updateProject(index, field, value) {
    setProjects((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removeProject(index) {
    setProjects((prev) => prev.filter((_, i) => i !== index))
  }

  function validate() {
    const errors = []
    if (!form.name.trim()) errors.push('姓名为必填项')
    if (form.expected_salary_min && form.expected_salary_max && Number(form.expected_salary_min) > Number(form.expected_salary_max)) {
      errors.push('期望薪资最低不能高于最高')
    }
    const emptySkills = skills.filter((s) => s.skill_name.trim())
    if (emptySkills.length === 0) errors.push('请至少填写一项技能')
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setSaving(true)
    setValidationErrors([])
    setSaveSuccess(false)
    try {
      const payload = {
        ...form,
        expected_salary_min: Number(form.expected_salary_min) || null,
        expected_salary_max: Number(form.expected_salary_max) || null,
        experience_years: Number(form.experience_years) || 0,
        skills_vector: skillsVector,
        skills: skills.filter((s) => s.skill_name.trim()).map((s) => ({
          ...s,
          proficiency: Number(s.proficiency) || 3,
          years_used: Number(s.years_used) || 0,
          weight: Number(s.weight) || 1.0,
        })),
        projects: projects.filter((p) => p.project_name.trim()).map((p) => ({
          ...p,
          revenue_impact: p.revenue_impact ? Number(p.revenue_impact) : null,
          efficiency_gain: p.efficiency_gain ? Number(p.efficiency_gain) : null,
        })),
      }
      const result = await api.post('/candidates', payload)
      setSaveSuccess(true)
      setTimeout(() => navigate(`/candidates/${result.id}`), 800)
    } catch (err) {
      setValidationErrors([`保存失败: ${err.message}`])
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/candidates')} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-slate-900">新建候选人</h1>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <ul className="space-y-1 text-sm text-red-700">
            {validationErrors.map((err, i) => <li key={i}>• {err}</li>)}
          </ul>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          保存成功，正在跳转到候选人详情...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>姓名 *</label><input className={inputCls} value={form.name} onChange={(e) => updateForm('name', e.target.value)} required /></div>
            <div><label className={labelCls}>邮箱</label><input type="email" className={inputCls} value={form.email} onChange={(e) => updateForm('email', e.target.value)} /></div>
            <div><label className={labelCls}>电话</label><input className={inputCls} value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} /></div>
            <div><label className={labelCls}>当前职位</label><input className={inputCls} value={form.current_title} onChange={(e) => updateForm('current_title', e.target.value)} /></div>
            <div><label className={labelCls}>当前公司</label><input className={inputCls} value={form.current_company} onChange={(e) => updateForm('current_company', e.target.value)} /></div>
            <div><label className={labelCls}>行业</label><select className={inputCls} value={form.industry} onChange={(e) => updateForm('industry', e.target.value)}>{industries.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className={labelCls}>经验年限</label><input type="number" min="0" className={inputCls} value={form.experience_years} onChange={(e) => updateForm('experience_years', e.target.value)} /></div>
            <div><label className={labelCls}>职级</label><select className={inputCls} value={form.career_level} onChange={(e) => updateForm('career_level', e.target.value)}>{levels.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className={labelCls}>期望薪资最低(元/年)</label><input type="number" className={inputCls} value={form.expected_salary_min} onChange={(e) => updateForm('expected_salary_min', e.target.value)} /></div>
            <div><label className={labelCls}>期望薪资最高(元/年)</label><input type="number" className={inputCls} value={form.expected_salary_max} onChange={(e) => updateForm('expected_salary_max', e.target.value)} /></div>
            <div><label className={labelCls}>学历</label><select className={inputCls} value={form.education} onChange={(e) => updateForm('education', e.target.value)}>{educations.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            <div><label className={labelCls}>所在城市</label><input className={inputCls} value={form.location} onChange={(e) => updateForm('location', e.target.value)} /></div>
            <div><label className={labelCls}>求职状态</label><select className={inputCls} value={form.job_status} onChange={(e) => updateForm('job_status', e.target.value)}>{statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          </div>
          <div className="mt-4"><label className={labelCls}>个人简介</label><textarea rows={3} className={inputCls} value={form.summary} onChange={(e) => updateForm('summary', e.target.value)} /></div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">技能标签</h2>
              <p className="text-xs text-slate-400 mt-0.5">技能将自动生成向量用于匹配计算：{skillsVector || '(请填写技能名称)'}</p>
            </div>
            <button type="button" onClick={addSkill} className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark"><Plus size={16} />添加技能</button>
          </div>
          {skills.map((skill, i) => (
            <div key={i} className="flex items-end gap-3 mb-3">
              <div className="flex-1"><label className={labelCls}>技能名称</label><input className={inputCls} placeholder="如 React、PyTorch" value={skill.skill_name} onChange={(e) => updateSkill(i, 'skill_name', e.target.value)} /></div>
              <div className="w-32"><label className={labelCls}>类别</label><select className={inputCls} value={skill.category} onChange={(e) => updateSkill(i, 'category', e.target.value)}>{skillCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="w-24"><label className={labelCls}>熟练度(1-5)</label><input type="number" min="1" max="5" className={inputCls} value={skill.proficiency} onChange={(e) => updateSkill(i, 'proficiency', Number(e.target.value))} /></div>
              <div className="w-20"><label className={labelCls}>年限</label><input type="number" min="0" className={inputCls} value={skill.years_used} onChange={(e) => updateSkill(i, 'years_used', Number(e.target.value))} /></div>
              <div className="w-20"><label className={labelCls}>权重</label><input type="number" min="0.5" max="2" step="0.1" className={inputCls} value={skill.weight} onChange={(e) => updateSkill(i, 'weight', Number(e.target.value))} /></div>
              <button type="button" onClick={() => removeSkill(i)} className="p-2 text-red-400 hover:text-red-600 mb-0.5"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">项目经历与成果量化</h2>
              <p className="text-xs text-slate-400 mt-0.5">量化成果是匹配引擎的重要参考，请尽量填写</p>
            </div>
            <button type="button" onClick={addProject} className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark"><Plus size={16} />添加项目</button>
          </div>
          {projects.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-sm text-slate-400 mb-3">暂未添加项目经历</p>
              <button type="button" onClick={addProject} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                <Plus size={14} />添加项目
              </button>
            </div>
          )}
          {projects.map((proj, i) => (
            <div key={i} className="mb-5 p-5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-semibold text-slate-700">项目 {i + 1}</span>
                <button type="button" onClick={() => removeProject(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelCls}>项目名称 *</label><input className={inputCls} placeholder="如 企业级微前端平台" value={proj.project_name} onChange={(e) => updateProject(i, 'project_name', e.target.value)} /></div>
                <div><label className={labelCls}>担任角色</label><input className={inputCls} placeholder="如 技术负责人、核心开发" value={proj.role} onChange={(e) => updateProject(i, 'role', e.target.value)} /></div>
                <div><label className={labelCls}>技术栈</label><input className={inputCls} placeholder="逗号分隔，如 React,TypeScript" value={proj.tech_stack} onChange={(e) => updateProject(i, 'tech_stack', e.target.value)} /></div>
                <div><label className={labelCls}>起止时间</label><div className="flex gap-2"><input type="month" className={`flex-1 ${inputCls}`} value={proj.start_date} onChange={(e) => updateProject(i, 'start_date', e.target.value)} /><span className="self-center text-slate-400">-</span><input type="month" className={`flex-1 ${inputCls}`} value={proj.end_date} onChange={(e) => updateProject(i, 'end_date', e.target.value)} /></div></div>
              </div>
              <div className="mt-3"><label className={labelCls}>项目描述</label><textarea rows={2} className={inputCls} placeholder="简述项目背景、目标和你的核心职责" value={proj.description} onChange={(e) => updateProject(i, 'description', e.target.value)} /></div>

              <div className="mt-4 p-4 rounded-lg bg-white border border-primary/20">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5"><TrendingUp size={14} />成果量化（核心匹配依据）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className={labelCls}>量化成果描述 *</label>
                    <input className={inputCls} placeholder="如 首屏加载时间降低60%，开发效率提升40%" value={proj.quantified_outcome} onChange={(e) => updateProject(i, 'quantified_outcome', e.target.value)} />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-1"><DollarSign size={13} className="text-emerald-500" />营收影响(元)</label>
                    <input type="number" className={inputCls} placeholder="如 5000000" value={proj.revenue_impact} onChange={(e) => updateProject(i, 'revenue_impact', e.target.value)} />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-1"><Zap size={13} className="text-amber-500" />效率提升(%)</label>
                    <input type="number" className={inputCls} placeholder="如 40" value={proj.efficiency_gain} onChange={(e) => updateProject(i, 'efficiency_gain', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/candidates')} className="px-6 py-2.5 text-sm font-medium rounded-lg border border-border text-slate-700 hover:bg-slate-50">取消</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"><Save size={16} />{saving ? '保存中...' : '保存候选人'}</button>
        </div>
      </form>
    </div>
  )
}
