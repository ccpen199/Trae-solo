import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  MapPin,
  Banknote,
  Users,
  Award,
  Clock,
  Car,
  FlaskConical,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Tag,
  FileCheck,
  X,
  Trash2,
  Save,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Check,
} from 'lucide-react'
import { usePositionStore } from '../store/PositionStore'
import { skillTags, certifications } from '../data/mockData'
import type { JobPosition, JobConstraint } from '../data/mockData'

const statusConfig: Record<JobPosition['status'], { label: string; color: string }> = {
  active: { label: '招聘中', color: 'bg-emerald-100 text-emerald-700' },
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
  paused: { label: '已暂停', color: 'bg-amber-100 text-amber-700' },
  closed: { label: '已关闭', color: 'bg-red-100 text-red-700' },
}

const constraintIconMap: Record<JobConstraint['type'], React.ElementType> = {
  certification: ShieldCheck,
  experience: Clock,
  vehicle_model: Car,
  test_field: FlaskConical,
  education: GraduationCap,
}

const constraintLabelMap: Record<JobConstraint['type'], string> = {
  certification: '认证资质',
  experience: '经验要求',
  vehicle_model: '车型绑定',
  test_field: '试验场',
  education: '学历要求',
}

const constraintTypeOptions: { value: JobConstraint['type']; label: string }[] = [
  { value: 'certification', label: '认证资质' },
  { value: 'experience', label: '经验要求' },
  { value: 'vehicle_model', label: '车型绑定' },
  { value: 'test_field', label: '试验场' },
  { value: 'education', label: '学历要求' },
]

const defaultForm = (): Omit<JobPosition, 'id'> => ({
  title: '智能驾驶功能安全经理',
  department: '自动驾驶事业部',
  location: '北京/上海/合肥',
  salary: '50-80K',
  description: '负责L2+/L3车型功能安全管理，覆盖HARA分析、ASIL分解、ASPICE流程协同、试验场验证与量产复盘。',
  requiredSkills: ['功能安全 ISO 26262', 'ASPICE', 'AUTOSAR'],
  preferredSkills: ['CAN/LIN通信', 'MATLAB/Simulink'],
  requiredCertifications: ['c1', 'c3'],
  vehicleModelBinding: 'L3自动驾驶量产车型 / 800V高压平台',
  testFieldRequired: '黑河冬季测试场 + 襄阳综合试验场',
  iatfRequired: true,
  constraints: [
    { type: 'experience', label: '量产经验', value: '至少参与1个L2+或L3车型量产项目并可提供项目节点证明', required: true },
    { type: 'education', label: '学历要求', value: '车辆工程、自动化、计算机相关专业硕士及以上', required: true },
  ],
  status: 'draft',
  createdAt: new Date().toISOString().slice(0, 10),
  applicants: 0,
})

function PositionForm({
  onSave,
  onCancel,
}: {
  onSave: (pos: JobPosition) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(defaultForm())
  const [newConstraint, setNewConstraint] = useState<JobConstraint>({
    type: 'certification',
    label: '',
    value: '',
    required: true,
  })
  const [skillInput, setSkillInput] = useState('')
  const [prefSkillInput, setPrefSkillInput] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const autoConstraints = useMemo<JobConstraint[]>(() => {
    const auto: JobConstraint[] = []
    if (form.vehicleModelBinding?.trim()) {
      auto.push({ type: 'vehicle_model', label: '车型项目绑定', value: form.vehicleModelBinding, required: true })
    }
    if (form.testFieldRequired?.trim()) {
      auto.push({ type: 'test_field', label: '试验场测试要求', value: form.testFieldRequired, required: true })
    }
    if (form.iatfRequired) {
      auto.push({ type: 'certification', label: 'IATF 16949内审员', value: 'IATF 16949质量管理体系审核资质', required: true })
    }
    return auto
  }, [form.vehicleModelBinding, form.testFieldRequired, form.iatfRequired])

  const allConstraints = useMemo(() => [...autoConstraints, ...form.constraints], [autoConstraints, form.constraints])

  useEffect(() => {
    if (!savedMsg) return
    const timer = setTimeout(() => setSavedMsg(null), 3000)
    return () => clearTimeout(timer)
  }, [savedMsg])

  const addConstraint = () => {
    if (!newConstraint.label.trim() || !newConstraint.value.trim()) return
    setForm((f) => ({ ...f, constraints: [...f.constraints, { ...newConstraint }] }))
    setNewConstraint({ type: 'certification', label: '', value: '', required: true })
  }

  const removeConstraint = (idx: number) => {
    setForm((f) => ({ ...f, constraints: f.constraints.filter((_, i) => i !== idx) }))
  }

  const addSkill = (field: 'requiredSkills' | 'preferredSkills', input: string, setInput: (v: string) => void) => {
    const trimmed = input.trim()
    if (!trimmed || form[field].includes(trimmed)) return
    setForm((f) => ({ ...f, [field]: [...f[field], trimmed] }))
    setInput('')
  }

  const removeSkill = (field: 'requiredSkills' | 'preferredSkills', skill: string) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((s) => s !== skill) }))
  }

  const addCert = (certId: string) => {
    if (form.requiredCertifications.includes(certId)) return
    setForm((f) => ({ ...f, requiredCertifications: [...f.requiredCertifications, certId] }))
  }

  const removeCert = (certId: string) => {
    setForm((f) => ({ ...f, requiredCertifications: f.requiredCertifications.filter((c) => c !== certId) }))
  }

  const handleSubmit = (status: JobPosition['status']) => {
    if (!form.title.trim()) return
    const pos: JobPosition = { ...form, id: `j_${Date.now()}`, status, constraints: allConstraints }
    onSave(pos)
    if (status === 'draft') {
      setSavedMsg('✓ 职位已保存为草稿')
    } else {
      setSavedMsg('✓ 职位已发布，将自动进入匹配引擎')
    }
  }

  const filteredSkills = skillTags.filter(
    (s) =>
      s.name.toLowerCase().includes(skillInput.toLowerCase()) ||
      s.description.toLowerCase().includes(skillInput.toLowerCase()),
  )

  const filteredPrefSkills = skillTags.filter(
    (s) =>
      s.name.toLowerCase().includes(prefSkillInput.toLowerCase()) ||
      s.description.toLowerCase().includes(prefSkillInput.toLowerCase()),
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {savedMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-lg animate-fade-in">
          <Check className="w-4 h-4" />
          {savedMsg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="p-2.5 bg-blue-600 rounded-xl">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">新建职位</h1>
          <p className="text-sm text-slate-500">填写职位信息，设定约束条件，发布后自动进入匹配引擎</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          基本信息
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">职位名称 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="如：功能安全经理"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">所属部门 *</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="如：自动驾驶事业部"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">工作地点</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="如：北京/上海"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">薪资范围</label>
            <input
              type="text"
              value={form.salary}
              onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
              placeholder="如：50-80K"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">职位描述</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="请描述该职位的核心职责与工作内容"
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-4 bg-amber-500 rounded-full" />
          行业强约束条件
        </h2>
        <p className="text-xs text-slate-400 -mt-3">绑定车型项目、试验场测试、IATF16949等汽车行业强约束</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" /> 车型项目绑定
            </label>
            <input
              type="text"
              value={form.vehicleModelBinding || ''}
              onChange={(e) => setForm((f) => ({ ...f, vehicleModelBinding: e.target.value }))}
              placeholder="如：800V高压平台 / 全平台车型"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> 试验场测试要求
            </label>
            <input
              type="text"
              value={form.testFieldRequired || ''}
              onChange={(e) => setForm((f) => ({ ...f, testFieldRequired: e.target.value }))}
              placeholder="如：黑河/牙克石冬季测试"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">IATF 16949 内审员资质要求</span>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, iatfRequired: !f.iatfRequired }))}
            className="flex items-center gap-2"
          >
            {form.iatfRequired ? (
              <>
                <ToggleRight className="w-8 h-8 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">必须</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-medium text-slate-400">未要求</span>
              </>
            )}
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-slate-700">约束条件列表</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{allConstraints.length}</span>
            {autoConstraints.length > 0 && (
              <span className="text-xs text-blue-500 font-medium">（{autoConstraints.length} 项自动同步）</span>
            )}
          </div>

          {allConstraints.length > 0 && (
            <div className="space-y-2 mb-4">
              {allConstraints.map((c, i) => {
                const Icon = constraintIconMap[c.type]
                const isAuto = i < autoConstraints.length
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isAuto ? 'bg-blue-50/50 border-blue-200/60' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded ${c.required ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <Icon className={`w-3.5 h-3.5 ${c.required ? 'text-blue-600' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">{constraintLabelMap[c.type]}</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${c.required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          {c.required ? '必须' : '优先'}
                        </span>
                        {isAuto && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-500">自动</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 truncate">{c.label}: {c.value}</p>
                    </div>
                    {isAuto ? (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5">由上方字段同步</span>
                    ) : (
                      <button onClick={() => removeConstraint(i - autoConstraints.length)} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="p-4 rounded-lg border-2 border-dashed border-slate-200 space-y-3">
            <p className="text-xs font-medium text-slate-500">添加约束条件</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">类型</label>
                <select
                  value={newConstraint.type}
                  onChange={(e) => setNewConstraint((c) => ({ ...c, type: e.target.value as JobConstraint['type'] }))}
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {constraintTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">标签</label>
                <input
                  type="text"
                  value={newConstraint.label}
                  onChange={(e) => setNewConstraint((c) => ({ ...c, label: e.target.value }))}
                  placeholder="如：功能安全认证"
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">具体要求</label>
                <input
                  type="text"
                  value={newConstraint.value}
                  onChange={(e) => setNewConstraint((c) => ({ ...c, value: e.target.value }))}
                  placeholder="如：ISO 26262功能安全工程师"
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setNewConstraint((c) => ({ ...c, required: !c.required }))}
                className="flex items-center gap-2 text-xs"
              >
                {newConstraint.required ? (
                  <><ToggleRight className="w-6 h-6 text-red-500" /><span className="text-red-600 font-medium">必须满足</span></>
                ) : (
                  <><ToggleLeft className="w-6 h-6 text-slate-300" /><span className="text-slate-400 font-medium">优先满足</span></>
                )}
              </button>
              <button
                onClick={addConstraint}
                disabled={!newConstraint.label.trim() || !newConstraint.value.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" /> 添加
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          技能要求
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">必备技能</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.requiredSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                {s}
                <button onClick={() => removeSkill('requiredSkills', s)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill('requiredSkills', skillInput, setSkillInput)}
              placeholder="输入技能名称或从下方选择，回车添加"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          {skillInput && (
            <div className="mt-1.5 max-h-32 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
              {filteredSkills.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { addSkill('requiredSkills', s.name, setSkillInput) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between transition-colors"
                >
                  <span className="text-slate-700">{s.name}</span>
                  <span className="text-[10px] text-slate-400">{s.category === 'hard' ? '硬技能' : s.category === 'cert' ? '认证' : '领域'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">加分技能</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.preferredSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
                {s}
                <button onClick={() => removeSkill('preferredSkills', s)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={prefSkillInput}
              onChange={(e) => setPrefSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill('preferredSkills', prefSkillInput, setPrefSkillInput)}
              placeholder="输入技能名称或从下方选择，回车添加"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          {prefSkillInput && (
            <div className="mt-1.5 max-h-32 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
              {filteredPrefSkills.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { addSkill('preferredSkills', s.name, setPrefSkillInput) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 flex items-center justify-between transition-colors"
                >
                  <span className="text-slate-700">{s.name}</span>
                  <span className="text-[10px] text-slate-400">{s.category === 'hard' ? '硬技能' : s.category === 'cert' ? '认证' : '领域'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-4 bg-amber-500 rounded-full" />
          必备认证
        </h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {form.requiredCertifications.map((cid) => {
            const cert = certifications.find((c) => c.id === cid)
            return (
              <span key={cid} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                {cert?.name || cid}
                <button onClick={() => removeCert(cid)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {certifications.map((cert) => {
            const selected = form.requiredCertifications.includes(cert.id)
            return (
              <button
                key={cert.id}
                onClick={() => (selected ? removeCert(cert.id) : addCert(cert.id))}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selected
                    ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${selected ? 'text-amber-800' : 'text-slate-700'}`}>{cert.name}</span>
                  {selected && <ShieldCheck className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{cert.issuer} · 行业权重 {cert.industryWeight}%</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 pb-4">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => handleSubmit('draft')}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          保存草稿
        </button>
        <button
          onClick={() => handleSubmit('active')}
          disabled={!form.title.trim()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          发布职位
        </button>
      </div>
    </div>
  )
}

function PositionDetail({ position }: { position: JobPosition }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-xl">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">{position.title}</h1>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${statusConfig[position.status].color}`}>
              {statusConfig[position.status].label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{position.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Award, label: '所属部门', value: position.department },
          { icon: MapPin, label: '工作地点', value: position.location },
          { icon: Banknote, label: '薪资范围', value: position.salary },
          { icon: FileCheck, label: '创建日期', value: position.createdAt },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {(position.vehicleModelBinding || position.testFieldRequired || position.iatfRequired) && (
        <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-amber-500 rounded-full" />
            <h2 className="text-sm font-semibold text-amber-900">行业强约束</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {position.vehicleModelBinding && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-amber-100">
                <Car className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-[11px] text-slate-400">车型绑定</p>
                  <p className="text-sm font-medium text-slate-800">{position.vehicleModelBinding}</p>
                </div>
              </div>
            )}
            {position.testFieldRequired && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-amber-100">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-[11px] text-slate-400">试验场要求</p>
                  <p className="text-sm font-medium text-slate-800">{position.testFieldRequired}</p>
                </div>
              </div>
            )}
            {position.iatfRequired && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-amber-100">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-[11px] text-slate-400">质量体系</p>
                  <p className="text-sm font-medium text-slate-800">IATF 16949 内审员</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-slate-200/80">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">职位描述</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{position.description}</p>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          <h2 className="text-sm font-semibold text-slate-800">约束条件</h2>
          <span className="text-xs text-slate-400 ml-1">({position.constraints.length})</span>
        </div>
        {position.constraints.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {position.constraints.map((c, i) => {
              const Icon = constraintIconMap[c.type]
              const typeLabel = constraintLabelMap[c.type]
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${c.required ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${c.required ? 'text-blue-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{typeLabel}</span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          c.required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.required ? '必须' : '优先'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-snug">{c.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">暂无约束条件</p>
        )}
      </div>

      <div className="bg-blue-50/70 rounded-xl p-5 border border-blue-200/70">
        <div className="flex items-center gap-2 mb-3">
          <Check className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-blue-900">保存回写与匹配接续</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white rounded-lg border border-blue-100 p-3">
            <p className="text-[11px] text-slate-400">职位草稿状态</p>
            <p className="mt-1 font-semibold text-slate-800">{statusConfig[position.status].label} · 已回写职位列表</p>
          </div>
          <div className="bg-white rounded-lg border border-blue-100 p-3">
            <p className="text-[11px] text-slate-400">强约束明细</p>
            <p className="mt-1 font-semibold text-slate-800">{position.constraints.length} 项可复查约束</p>
          </div>
          <div className="bg-white rounded-lg border border-blue-100 p-3">
            <p className="text-[11px] text-slate-400">后续接续</p>
            <p className="mt-1 font-semibold text-slate-800">发布后进入匹配引擎候选人回流</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800">必备技能</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {position.requiredSkills.map((sid) => (
              <span key={sid} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                {sid}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-800">加分技能</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {position.preferredSkills.map((sid) => (
              <span key={sid} className="px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
                {sid}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-800">必备认证</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {position.requiredCertifications.length > 0 ? (
              position.requiredCertifications.map((cid) => (
                <span key={cid} className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  {cid}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">无硬性认证要求</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobModeling() {
  const { positions, addPosition } = usePositionStore()
  const [selectedId, setSelectedId] = useState<string | null>(positions[0]?.id ?? null)
  const [showForm, setShowForm] = useState(false)

  const selected = positions.find((p) => p.id === selectedId) ?? positions[0] ?? null

  const handleSave = (pos: JobPosition) => {
    addPosition(pos)
    setSelectedId(pos.id)
    setShowForm(false)
  }

  return (
    <div className="flex h-full">
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">职位列表</h2>
            <span className="text-xs text-slate-400">{positions.length} 个职位</span>
          </div>
          <button
            onClick={() => { setShowForm(true); setSelectedId(null) }}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              showForm
                ? 'bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            新建职位
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {positions.map((pos) => {
            const isActive = pos.id === selectedId && !showForm
            return (
              <div
                key={pos.id}
                onClick={() => { setSelectedId(pos.id); setShowForm(false) }}
                className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                    : 'bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`text-sm font-semibold leading-tight ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                    {pos.title}
                  </h3>
                  <span className={`ml-2 flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-md ${statusConfig[pos.status].color}`}>
                    {statusConfig[pos.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2.5">{pos.department}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {pos.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3 h-3" />
                    {pos.salary}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    {pos.applicants} 位候选人
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-300'}`} />
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      <section className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {showForm ? (
          <PositionForm onSave={handleSave} onCancel={() => { setShowForm(false); setSelectedId(positions[0]?.id ?? null) }} />
        ) : selected ? (
          <PositionDetail position={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>请选择或新建一个职位</p>
          </div>
        )}
      </section>
    </div>
  )
}
