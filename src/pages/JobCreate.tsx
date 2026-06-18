import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Plus, X, Check } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import type { Field, SkillCategory, SkillLevel, ConstraintType, SkillRequirement, HardConstraint } from '@/types'

const steps = ['基本信息', '技能要求', '强约束条件', '确认发布']
const fieldOptions: Field[] = ['汽车制造', '零部件', '新能源', '智能驾驶']
const skillCategories: SkillCategory[] = ['硬技能', '软技能', '认证']
const skillLevels: SkillLevel[] = ['初级', '中级', '高级', '专家']
const constraintTypes: ConstraintType[] = ['车型项目经验', '试验场测试经历', 'IATF16949内审员', '功能安全认证', 'ASPICE认证']

const catBadge: Record<SkillCategory, string> = { '硬技能': 'badge-hard', '软技能': 'badge-soft', '认证': 'badge-cert' }

export default function JobCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [field, setField] = useState<Field>('汽车制造')
  const [location, setLocation] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState<SkillRequirement[]>([])
  const [constraints, setConstraints] = useState<HardConstraint[]>([])
  const [sName, setSName] = useState('')
  const [sCat, setSCat] = useState<SkillCategory>('硬技能')
  const [sLevel, setSLevel] = useState<SkillLevel>('中级')
  const [sReq, setSReq] = useState(true)
  const [cType, setCType] = useState<ConstraintType>('车型项目经验')
  const [cValue, setCValue] = useState('')
  const [cReq, setCReq] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const addSkill = () => {
    if (!sName.trim()) return
    setSkills([...skills, { id: crypto.randomUUID(), name: sName, category: sCat, required: sReq, preferredLevel: sLevel }])
    setSName('')
  }
  const removeSkill = (id: string) => setSkills(skills.filter(s => s.id !== id))
  const addConstraint = () => {
    if (!cValue.trim()) return
    setConstraints([...constraints, { id: crypto.randomUUID(), type: cType, value: cValue, required: cReq }])
    setCValue('')
  }
  const removeConstraint = (id: string) => setConstraints(constraints.filter(c => c.id !== id))

  const publish = async () => {
    setSubmitting(true)
    try {
      await fetchApi('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title, company, field, location, description,
          salaryMin: Number(salaryMin) * 1000,
          salaryMax: Number(salaryMax) * 1000,
          requiredSkills: skills, hardConstraints: constraints, status: '招聘中',
        }),
      })
      navigate('/jobs')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gradient">创建职位</h1>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i <= step ? 'bg-amber-500 text-steel-950' : 'bg-steel-700 text-steel-400'}`}>{i + 1}</div>
            <span className={`text-sm ${i <= step ? 'text-amber-400' : 'text-steel-500'}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-steel-600" />}
          </div>
        ))}
      </div>

      <div className="card-glass p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div><label className="text-sm text-steel-400 mb-1 block">职位名称</label><input value={title} onChange={e => setTitle(e.target.value)} className="input-dark w-full" /></div>
            <div><label className="text-sm text-steel-400 mb-1 block">公司</label><input value={company} onChange={e => setCompany(e.target.value)} className="input-dark w-full" /></div>
            <div><label className="text-sm text-steel-400 mb-1 block">领域</label><select value={field} onChange={e => setField(e.target.value as Field)} className="input-dark w-full">{fieldOptions.map(f => <option key={f}>{f}</option>)}</select></div>
            <div><label className="text-sm text-steel-400 mb-1 block">工作地点</label><input value={location} onChange={e => setLocation(e.target.value)} className="input-dark w-full" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-steel-400 mb-1 block">最低薪资(K)</label><input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className="input-dark w-full" /></div>
              <div><label className="text-sm text-steel-400 mb-1 block">最高薪资(K)</label><input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className="input-dark w-full" /></div>
            </div>
            <div><label className="text-sm text-steel-400 mb-1 block">职位描述</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="input-dark w-full" /></div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1"><label className="text-sm text-steel-400 mb-1 block">技能名称</label><input value={sName} onChange={e => setSName(e.target.value)} className="input-dark w-full" /></div>
              <div><label className="text-sm text-steel-400 mb-1 block">类别</label><select value={sCat} onChange={e => setSCat(e.target.value as SkillCategory)} className="input-dark">{skillCategories.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="text-sm text-steel-400 mb-1 block">级别</label><select value={sLevel} onChange={e => setSLevel(e.target.value as SkillLevel)} className="input-dark">{skillLevels.map(l => <option key={l}>{l}</option>)}</select></div>
              <label className="flex items-center gap-1 text-sm text-steel-300 pb-2"><input type="checkbox" checked={sReq} onChange={e => setSReq(e.target.checked)} className="accent-amber-500" />必须</label>
              <button onClick={addSkill} className="btn-primary px-3 py-2"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {skills.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-steel-800/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2"><span className={catBadge[s.category]}>{s.category}</span><span className="text-sm text-steel-200">{s.name}</span><span className="text-xs text-steel-400">{s.preferredLevel}</span>{s.required && <span className="text-xs text-amber-400">必须</span>}</div>
                  <button onClick={() => removeSkill(s.id)}><X className="w-4 h-4 text-steel-500 hover:text-red-400" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div><label className="text-sm text-steel-400 mb-1 block">约束类型</label><select value={cType} onChange={e => setCType(e.target.value as ConstraintType)} className="input-dark">{constraintTypes.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="flex-1"><label className="text-sm text-steel-400 mb-1 block">约束值</label><input value={cValue} onChange={e => setCValue(e.target.value)} className="input-dark w-full" /></div>
              <label className="flex items-center gap-1 text-sm text-steel-300 pb-2"><input type="checkbox" checked={cReq} onChange={e => setCReq(e.target.checked)} className="accent-amber-500" />必须</label>
              <button onClick={addConstraint} className="btn-primary px-3 py-2"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {constraints.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-steel-800/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2"><span className="badge-hard">{c.type}</span><span className="text-sm text-steel-200">{c.value}</span>{c.required && <span className="text-xs text-amber-400">必须</span>}</div>
                  <button onClick={() => removeConstraint(c.id)}><X className="w-4 h-4 text-steel-500 hover:text-red-400" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-steel-400">职位名称</span><p className="text-steel-100">{title}</p></div>
              <div><span className="text-steel-400">公司</span><p className="text-steel-100">{company}</p></div>
              <div><span className="text-steel-400">领域</span><p className="text-steel-100">{field}</p></div>
              <div><span className="text-steel-400">地点</span><p className="text-steel-100">{location}</p></div>
              <div><span className="text-steel-400">薪资范围</span><p className="text-amber-400">{salaryMin}K-{salaryMax}K</p></div>
            </div>
            <div><span className="text-steel-400 text-sm">职位描述</span><p className="text-steel-200 text-sm mt-1">{description}</p></div>
            <div><span className="text-steel-400 text-sm">技能要求 ({skills.length})</span>
              <div className="flex flex-wrap gap-2 mt-1">{skills.map(s => <span key={s.id} className={catBadge[s.category]}>{s.name} · {s.preferredLevel}</span>)}</div>
            </div>
            <div><span className="text-steel-400 text-sm">强约束 ({constraints.length})</span>
              <div className="flex flex-wrap gap-2 mt-1">{constraints.map(c => <span key={c.id} className="badge-hard">{c.type}: {c.value}</span>)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="btn-secondary flex items-center gap-1 disabled:opacity-30"><ChevronLeft className="w-4 h-4" />上一步</button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-1">下一步<ChevronRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={publish} disabled={submitting} className="btn-primary flex items-center gap-1"><Check className="w-4 h-4" />{submitting ? '发布中...' : '确认发布'}</button>
        )}
      </div>
    </div>
  )
}
