import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, X, Check, AlertCircle, Award, Car, Gauge } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import type { Field, SkillCategory, ConstraintType } from '@/types'

const FIELD_OPTIONS: Field[] = ['汽车制造', '零部件', '新能源', '智能驾驶']
const SKILL_CATEGORIES: SkillCategory[] = ['硬技能', '软技能', '认证']
const LEVELS = ['初级', '中级', '高级', '专家']
const CONSTRAINT_TYPES: { type: ConstraintType; icon: any; desc: string }[] = [
  { type: '车型项目经验', icon: Car, desc: '如: 全新平台车型、SUV/轿车项目' },
  { type: '试验场测试经历', icon: Gauge, desc: '如: 高寒/高温/高原试验' },
  { type: 'IATF16949内审员', icon: Award, desc: 'IATF16949 体系内审员资质' },
  { type: '功能安全认证', icon: Award, desc: 'ISO 26262 功能安全认证' },
  { type: 'ASPICE认证', icon: Award, desc: 'ASPICE 过程评估认证' },
]

const COMMON_CERTS = ['IATF16949内审员', 'ISO 26262功能安全', 'ASPICE CL2', 'ASPICE CL3', 'PMP', '六西格玛', '绿带', '黑带']
const COMMON_HARD_SKILLS = ['CATIA', 'UG NX', 'ANSYS', 'MATLAB/Simulink', 'AutoSAR', 'Python', 'C/C++', 'ROS2', 'ADAS', 'CAN/LIN']

interface SkillReq {
  name: string
  category: SkillCategory
  preferredLevel: string
  required: boolean
}

interface Constraint {
  type: ConstraintType
  value: string
  required: boolean
}

export default function JobCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [field, setField] = useState<Field>('汽车制造')
  const [location, setLocation] = useState('')
  const [salaryMin, setSalaryMin] = useState('25000')
  const [salaryMax, setSalaryMax] = useState('45000')
  const [description, setDescription] = useState('')

  const [skillReqs, setSkillReqs] = useState<SkillReq[]>([
    { name: 'CATIA', category: '硬技能', preferredLevel: '高级', required: true },
  ])
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('硬技能')
  const [newSkillLevel, setNewSkillLevel] = useState('中级')
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])

  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [newConstraintType, setNewConstraintType] = useState<ConstraintType>('车型项目经验')
  const [newConstraintValue, setNewConstraintValue] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = '请输入职位名称'
    if (!company.trim()) e.company = '请输入公司名称'
    if (!location.trim()) e.location = '请输入工作地点'
    if (parseInt(salaryMin) <= 0) e.salaryMin = '请输入有效薪资'
    if (parseInt(salaryMax) <= parseInt(salaryMin)) e.salaryMax = '最高薪资需大于最低薪资'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    setErrors({})
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  const addSkill = () => {
    const name = newSkillName.trim()
    if (!name) return
    if (skillReqs.some(s => s.name === name)) return
    setSkillReqs([...skillReqs, { name, category: newSkillCategory, preferredLevel: newSkillLevel, required: true }])
    setNewSkillName('')
    setSkillSuggestions([])
  }

  const removeSkill = (name: string) => {
    setSkillReqs(skillReqs.filter(s => s.name !== name))
  }

  const toggleSkillRequired = (name: string) => {
    setSkillReqs(skillReqs.map(s => s.name === name ? { ...s, required: !s.required } : s))
  }

  const onSkillInputChange = (v: string) => {
    setNewSkillName(v)
    if (v.length > 0) {
      const pool = newSkillCategory === '认证' ? COMMON_CERTS : COMMON_HARD_SKILLS
      setSkillSuggestions(pool.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 6))
    } else {
      setSkillSuggestions([])
    }
  }

  const addConstraint = () => {
    const value = newConstraintValue.trim()
    if (!value) return
    setConstraints([...constraints, { type: newConstraintType, value, required: true }])
    setNewConstraintValue('')
  }

  const removeConstraint = (idx: number) => {
    setConstraints(constraints.filter((_, i) => i !== idx))
  }

  const submitJob = async () => {
    try {
      const res = await fetchApi<any>('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          company,
          field,
          location,
          salary_min: parseInt(salaryMin),
          salary_max: parseInt(salaryMax),
          description,
          status: '招聘中',
          requiredSkills: skillReqs,
          hardConstraints: constraints,
        }),
      })
      if (res?.id) {
        navigate(`/jobs/${res.id}`)
      } else {
        navigate('/jobs')
      }
    } catch {
      alert('创建失败，请重试')
    }
  }

  const steps = ['基本信息', '技能要求', '强约束条件', '确认发布']

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/jobs')} className="text-steel-400 hover:text-steel-200">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gradient">创建职位</h1>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i + 1 === step ? 'text-amber-400' : i + 1 < step ? 'text-green-400' : 'text-steel-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                i + 1 === step ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                i + 1 < step ? 'bg-green-500/20 border-green-500 text-green-400' :
                'bg-steel-800 border-steel-600 text-steel-500'
              }`}>
                {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-sm font-medium">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-green-500/50' : 'bg-steel-700'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card-glass p-6 space-y-5">
          <h2 className="section-title">基本信息</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-steel-400 mb-1.5 block">职位名称 *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className={`input-dark w-full ${errors.title ? 'border-red-500' : ''}`}
                placeholder="如: 整车架构高级工程师" />
              {errors.title && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
            </div>
            <div>
              <label className="text-sm text-steel-400 mb-1.5 block">公司名称 *</label>
              <input value={company} onChange={e => setCompany(e.target.value)}
                className={`input-dark w-full ${errors.company ? 'border-red-500' : ''}`}
                placeholder="如: 上汽集团" />
              {errors.company && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.company}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-steel-400 mb-1.5 block">领域 *</label>
              <select value={field} onChange={e => setField(e.target.value as Field)} className="input-dark w-full">
                {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-steel-400 mb-1.5 block">工作地点 *</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                className={`input-dark w-full ${errors.location ? 'border-red-500' : ''}`}
                placeholder="如: 上海" />
              {errors.location && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.location}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-steel-400 mb-1.5 block">最低月薪 (元) *</label>
              <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                className={`input-dark w-full ${errors.salaryMin ? 'border-red-500' : ''}`} />
              {errors.salaryMin && <p className="text-red-400 text-xs mt-1">{errors.salaryMin}</p>}
            </div>
            <div>
              <label className="text-sm text-steel-400 mb-1.5 block">最高月薪 (元) *</label>
              <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                className={`input-dark w-full ${errors.salaryMax ? 'border-red-500' : ''}`} />
              {errors.salaryMax && <p className="text-red-400 text-xs mt-1">{errors.salaryMax}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm text-steel-400 mb-1.5 block">职位描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="input-dark w-full h-28 resize-none" placeholder="请描述岗位职责与任职要求..." />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card-glass p-6 space-y-5">
          <h2 className="section-title">技能要求</h2>
          <p className="text-sm text-steel-400">添加该职位所需的硬技能、软技能及认证要求。支持行业常见技能快速匹配。</p>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <label className="text-sm text-steel-400 mb-1.5 block">技能名称</label>
              <input value={newSkillName} onChange={e => onSkillInputChange(e.target.value)}
                className="input-dark w-full" placeholder="输入技能名称..."
                onKeyDown={e => e.key === 'Enter' && addSkill()} />
              {skillSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-steel-800 border border-steel-600 rounded-lg z-10 overflow-hidden">
                  {skillSuggestions.map(s => (
                    <button key={s} onClick={() => { setNewSkillName(s); setSkillSuggestions([]) }}
                      className="w-full text-left px-3 py-2 text-sm text-steel-200 hover:bg-steel-700 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-28">
              <label className="text-sm text-steel-400 mb-1.5 block">类别</label>
              <select value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value as SkillCategory)}
                className="input-dark w-full text-sm">
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="text-sm text-steel-400 mb-1.5 block">级别</label>
              <select value={newSkillLevel} onChange={e => setNewSkillLevel(e.target.value)}
                className="input-dark w-full text-sm">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={addSkill} className="btn-primary flex items-center gap-1 h-[34px]">
              <Plus className="w-4 h-4" />添加
            </button>
          </div>

          <div className="space-y-2">
            {skillReqs.length === 0 && (
              <div className="text-center py-8 text-steel-500 text-sm">尚未添加技能要求</div>
            )}
            {skillReqs.map(s => (
              <div key={s.name} className="flex items-center justify-between bg-steel-800/50 rounded-lg px-4 py-3 border border-steel-700">
                <div className="flex items-center gap-3">
                  <span className={s.category === '硬技能' ? 'badge-hard' : s.category === '认证' ? 'badge-cert' : 'badge-soft'}>
                    {s.category}
                  </span>
                  <span className="text-steel-100 font-medium">{s.name}</span>
                  <span className="text-steel-400 text-sm">要求: {s.preferredLevel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSkillRequired(s.name)}
                    className={`text-xs px-2 py-1 rounded border ${
                      s.required ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-steel-700 text-steel-400 border-steel-600'
                    }`}>
                    {s.required ? '必须' : '优先'}
                  </button>
                  <button onClick={() => removeSkill(s.name)} className="text-steel-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-steel-700/50">
            <p className="text-xs text-steel-500 mb-2">💡 快速添加行业常见认证:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_CERTS.filter(c => !skillReqs.some(s => s.name === c)).slice(0, 6).map(c => (
                <button key={c} onClick={() => setSkillReqs([...skillReqs, { name: c, category: '认证', preferredLevel: '中级', required: true }])}
                  className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  + {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card-glass p-6 space-y-5">
          <h2 className="section-title">强约束条件</h2>
          <p className="text-sm text-steel-400">添加汽车行业特有的硬性约束条件，如车型项目经验、试验场经历、体系认证等。</p>

          <div className="grid grid-cols-4 gap-3 mb-4">
            {CONSTRAINT_TYPES.map(ct => (
              <button key={ct.type} onClick={() => setNewConstraintType(ct.type)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  newConstraintType === ct.type
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-steel-800/50 border-steel-700 text-steel-300 hover:border-steel-600'
                }`}>
                <ct.icon className="w-5 h-5 mb-2" />
                <div className="text-sm font-medium">{ct.type}</div>
                <div className="text-xs opacity-60 mt-1">{ct.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm text-steel-400 mb-1.5 block">约束值 / 具体要求</label>
              <input value={newConstraintValue} onChange={e => setNewConstraintValue(e.target.value)}
                className="input-dark w-full" placeholder={`请输入${newConstraintType}的具体要求...`}
                onKeyDown={e => e.key === 'Enter' && addConstraint()} />
            </div>
            <button onClick={addConstraint} className="btn-primary flex items-center gap-1 h-[34px]">
              <Plus className="w-4 h-4" />添加约束
            </button>
          </div>

          <div className="space-y-2">
            {constraints.length === 0 && (
              <div className="text-center py-8 text-steel-500 text-sm">尚未添加强约束条件</div>
            )}
            {constraints.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between bg-steel-800/50 rounded-lg px-4 py-3 border border-steel-700">
                <div className="flex items-center gap-3">
                  <span className="badge-cert">{c.type}</span>
                  <span className="text-steel-100">{c.value}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {c.required ? '必须' : '优先'}
                  </span>
                  <button onClick={() => removeConstraint(idx)} className="text-steel-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="card-glass p-6">
            <h2 className="section-title">职位信息确认</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">职位名称</span>
                <span className="text-steel-100 font-medium">{title || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">公司</span>
                <span className="text-steel-100">{company || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">领域</span>
                <span className="text-steel-100">{field}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">工作地点</span>
                <span className="text-steel-100">{location || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">薪资范围</span>
                <span className="text-amber-400 font-mono">{(parseInt(salaryMin) / 1000).toFixed(0)}K-{(parseInt(salaryMax) / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">技能要求</span>
                <span className="text-steel-100">{skillReqs.length} 项</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/50">
                <span className="text-steel-400">强约束条件</span>
                <span className="text-steel-100">{constraints.length} 项</span>
              </div>
            </div>
          </div>

          <div className="card-glass p-6">
            <h3 className="text-base font-semibold text-steel-100 mb-3">技能要求清单</h3>
            <div className="flex flex-wrap gap-2">
              {skillReqs.map(s => (
                <span key={s.name} className={`text-xs px-2.5 py-1 rounded-full border ${
                  s.category === '硬技能' ? 'badge-hard' : s.category === '认证' ? 'badge-cert' : 'badge-soft'
                }`}>
                  {s.name} · {s.preferredLevel} {s.required ? '(必)' : '(优)'}
                </span>
              ))}
            </div>
          </div>

          {constraints.length > 0 && (
            <div className="card-glass p-6">
              <h3 className="text-base font-semibold text-steel-100 mb-3">强约束清单</h3>
              <div className="space-y-2">
                {constraints.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-steel-300">{c.type}:</span>
                    <span className="text-steel-100">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium text-sm">职位建模完成</p>
              <p className="text-green-300/70 text-xs mt-0.5">
                系统将基于您设置的 {skillReqs.length} 项技能要求和 {constraints.length} 项强约束条件，
                从人才库中智能匹配候选人，并计算语义相似度、人脉热度、地域聚集度三维评分。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={prevStep} disabled={step === 1}
          className="btn-secondary flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />上一步
        </button>
        {step < 4 ? (
          <button onClick={nextStep} className="btn-primary flex items-center gap-1">
            下一步<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={submitJob} className="btn-primary flex items-center gap-1">
            <Check className="w-4 h-4" />发布职位
          </button>
        )}
      </div>
    </div>
  )
}
