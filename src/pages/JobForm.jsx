import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { api } from '../utils/api'

const industries = ['互联网', '人工智能', '金融科技', '医疗健康', '智能制造', '教育', '新能源', '电商']
const levels = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9']
const functions = ['技术', '产品', '数据', '设计', '运营', '市场']
const statuses = [{ value: 'draft', label: '草稿' }, { value: 'published', label: '发布' }]

export default function JobForm() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [enterprises, setEnterprises] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [form, setForm] = useState({
    enterprise_id: '', title: '', department: '', industry: '互联网',
    function_type: '技术', required_level: 'P6', min_experience_years: 3,
    salary_min: '', salary_max: '', location: '', tech_stack: '',
    description: '', requirements: '', benefits: '', status: 'draft',
  })

  useEffect(() => {
    api.get('/admin/enterprises').then((data) => {
      const items = Array.isArray(data) ? data : data.items || []
      setEnterprises(items)
      if (items.length > 0 && !form.enterprise_id) {
        setForm((prev) => ({ ...prev, enterprise_id: String(items[0].id) }))
      }
    }).catch(() => {})
  }, [])

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationErrors([])
  }

  function validate() {
    const errors = []
    if (!form.enterprise_id) errors.push('请选择所属企业')
    if (!form.title.trim()) errors.push('职位名称为必填项')
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max)) {
      errors.push('薪资范围最低不能高于最高')
    }
    if (!form.tech_stack.trim()) errors.push('请填写技术栈要求，这是匹配引擎的核心依据')
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
        salary_min: Number(form.salary_min) || null,
        salary_max: Number(form.salary_max) || null,
        min_experience_years: Number(form.min_experience_years) || 0,
        enterprise_id: Number(form.enterprise_id),
      }
      const result = await api.post('/jobs', payload)
      setSaveSuccess(true)
      setTimeout(() => navigate(`/jobs/${result.id}`), 800)
    } catch (err) {
      setValidationErrors([`保存失败: ${err.message}`])
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
  const requiredMark = <span className="text-red-500 ml-0.5">*</span>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/jobs')} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-slate-900">发布新职位</h1>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-1">
            <AlertCircle size={16} />请修正以下问题
          </div>
          <ul className="space-y-1 text-sm text-red-700 ml-6">
            {validationErrors.map((err, i) => <li key={i}>• {err}</li>)}
          </ul>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />保存成功，正在跳转到职位详情...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">职位基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>所属企业 {requiredMark}</label>
              <select
                className={`${inputCls} ${!form.enterprise_id && enterprises.length > 0 ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                value={form.enterprise_id}
                onChange={(e) => updateForm('enterprise_id', e.target.value)}
              >
                {enterprises.length === 0 && <option value="">加载中...</option>}
                {enterprises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>职位名称 {requiredMark}</label>
              <input
                className={`${inputCls} ${!form.title.trim() ? 'border-slate-300' : ''}`}
                placeholder="如 高级前端架构师"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
              />
            </div>
            <div><label className={labelCls}>部门</label><input className={inputCls} placeholder="如 技术部" value={form.department} onChange={(e) => updateForm('department', e.target.value)} /></div>
            <div><label className={labelCls}>行业</label><select className={inputCls} value={form.industry} onChange={(e) => updateForm('industry', e.target.value)}>{industries.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className={labelCls}>职能</label><select className={inputCls} value={form.function_type} onChange={(e) => updateForm('function_type', e.target.value)}>{functions.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className={labelCls}>要求职级 {requiredMark}</label><select className={inputCls} value={form.required_level} onChange={(e) => updateForm('required_level', e.target.value)}>{levels.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className={labelCls}>最低经验年限</label><input type="number" min="0" className={inputCls} value={form.min_experience_years} onChange={(e) => updateForm('min_experience_years', e.target.value)} /></div>
            <div><label className={labelCls}>工作城市</label><input className={inputCls} placeholder="如 北京" value={form.location} onChange={(e) => updateForm('location', e.target.value)} /></div>
            <div><label className={labelCls}>薪资范围最低(元/年)</label><input type="number" className={inputCls} placeholder="如 500000" value={form.salary_min} onChange={(e) => updateForm('salary_min', e.target.value)} /></div>
            <div><label className={labelCls}>薪资范围最高(元/年)</label><input type="number" className={inputCls} placeholder="如 700000" value={form.salary_max} onChange={(e) => updateForm('salary_max', e.target.value)} /></div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>技术栈要求 {requiredMark}</label>
            <input className={inputCls} placeholder="逗号分隔，如 React,TypeScript,微前端,性能优化" value={form.tech_stack} onChange={(e) => updateForm('tech_stack', e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">技术栈是匹配引擎的核心依据，请尽量完整填写</p>
          </div>
          <div className="mt-4"><label className={labelCls}>职位描述</label><textarea rows={4} className={inputCls} placeholder="描述该职位的核心职责和工作内容" value={form.description} onChange={(e) => updateForm('description', e.target.value)} /></div>
          <div className="mt-4"><label className={labelCls}>任职要求</label><textarea rows={4} className={inputCls} placeholder="描述候选人的必备条件" value={form.requirements} onChange={(e) => updateForm('requirements', e.target.value)} /></div>
          <div className="mt-4"><label className={labelCls}>福利待遇</label><input className={inputCls} placeholder="逗号分隔，如 六险一金,弹性工作" value={form.benefits} onChange={(e) => updateForm('benefits', e.target.value)} /></div>
          <div className="mt-4">
            <label className={labelCls}>初始状态</label>
            <select className={inputCls} value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
              {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {form.status === 'published' && (
              <p className="text-xs text-amber-600 mt-1">发布后将立即对外可见</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/jobs')} className="px-6 py-2.5 text-sm font-medium rounded-lg border border-border text-slate-700 hover:bg-slate-50">取消</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"><Save size={16} />{saving ? '保存中...' : '保存职位'}</button>
        </div>
      </form>
    </div>
  )
}
