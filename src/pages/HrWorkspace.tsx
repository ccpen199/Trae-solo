import { useState } from 'react'
import { useStore } from '@/store'
import type { CompanyTemplate, ScoringCriteria } from '@/types'
import { Plus, FileText, Trash2, Edit3, Save, LayoutTemplate, CheckCircle, XCircle, Eye, ShieldAlert, RotateCcw } from 'lucide-react'

const MOCK_TEMPLATES: CompanyTemplate[] = [
  { id: 't-001', companyId: 'c-001', name: '前端工程师模板', sections: [{ id: 's1', type: 'experience', order: 1, content: {} }, { id: 's2', type: 'skills', order: 2, content: {} }, { id: 's3', type: 'education', order: 3, content: {} }], scoringCriteria: { dimensions: [{ name: '技能匹配', weight: 35 }, { name: '经验相关性', weight: 25 }, { name: '教育背景', weight: 15 }, { name: '语言能力', weight: 10 }, { name: '项目经验', weight: 15 }], thresholds: { autoAdvance: 80, autoReject: 40 } } },
  { id: 't-002', companyId: 'c-001', name: '产品经理模板', sections: [{ id: 's4', type: 'experience', order: 1, content: {} }, { id: 's5', type: 'projects', order: 2, content: {} }], scoringCriteria: { dimensions: [{ name: '技能匹配', weight: 20 }, { name: '经验相关性', weight: 35 }, { name: '教育背景', weight: 10 }, { name: '语言能力', weight: 15 }, { name: '项目经验', weight: 20 }], thresholds: { autoAdvance: 75, autoReject: 35 } } },
  { id: 't-003', companyId: 'c-001', name: '数据分析师模板', sections: [{ id: 's6', type: 'education', order: 1, content: {} }, { id: 's7', type: 'skills', order: 2, content: {} }, { id: 's8', type: 'experience', order: 3, content: {} }, { id: 's9', type: 'projects', order: 4, content: {} }], scoringCriteria: { dimensions: [{ name: '技能匹配', weight: 30 }, { name: '经验相关性', weight: 20 }, { name: '教育背景', weight: 25 }, { name: '语言能力', weight: 5 }, { name: '项目经验', weight: 20 }], thresholds: { autoAdvance: 78, autoReject: 38 } } },
]

const ATS_VALID: Record<string, boolean> = {
  't-001': true,
  't-002': true,
  't-003': false,
}

const SECTION_OPTIONS = [
  { type: 'personal', label: '个人信息' },
  { type: 'education', label: '教育背景' },
  { type: 'experience', label: '工作经验' },
  { type: 'skills', label: '技能清单' },
  { type: 'projects', label: '项目经验' },
] as const

const DIMENSION_LABELS = ['技能匹配', '经验相关性', '教育背景', '语言能力', '项目经验']

function AccessDenied({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="glass-card p-10 text-center max-w-md">
        <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
          <ShieldAlert className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="font-display text-xl font-semibold text-navy-700 mb-2">访问受限</h2>
        <p className="text-graphite/60 mb-6">该功能仅限HR角色访问</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={onSwitch}>
          <RotateCcw className="h-4 w-4" /> 切换至HR角色
        </button>
      </div>
    </div>
  )
}

function TemplatePreviewModal({ template, onClose }: { template: CompanyTemplate; onClose: () => void }) {
  const sectionLabel = (type: string) => SECTION_OPTIONS.find((s) => s.type === type)?.label ?? type
  const sorted = [...template.sections].sort((a, b) => a.order - b.order)
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-navy-700 text-lg">模板预览 — {template.name}</h3>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-graphite/50" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-3">
          {sorted.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-ivory rounded-xl">
              <div className="bg-navy-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</div>
              <span className="text-sm font-medium text-navy-700">{sectionLabel(s.type)}</span>
              <span className="text-xs text-graphite/40 ml-auto">模块</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="btn-secondary text-sm" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

function ScoringSimulator({ criteria }: { criteria: ScoringCriteria }) {
  const [scores, setScores] = useState<number[]>(criteria.dimensions.map(() => 50))
  const total = scores.reduce((sum, s, i) => sum + s * criteria.dimensions[i].weight / 100, 0)
  const result = total >= criteria.thresholds.autoAdvance ? 'advance' : total <= criteria.thresholds.autoReject ? 'reject' : 'pending'
  return (
    <div className="glass-card p-5 mt-4">
      <h3 className="font-semibold text-navy-700 mb-4">评分模拟</h3>
      <div className="space-y-3 mb-4">
        {criteria.dimensions.map((dim, idx) => (
          <div key={dim.name} className="flex items-center gap-3">
            <span className="text-xs text-graphite/60 w-20 text-right">{dim.name}</span>
            <input type="range" min={0} max={100} value={scores[idx]}
              onChange={(e) => { const next = [...scores]; next[idx] = Number(e.target.value); setScores(next) }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-500" />
            <span className="text-xs font-medium text-navy-700 w-8">{scores[idx]}</span>
            <span className="text-xs text-graphite/40">×{dim.weight}%</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-navy-700">加权总分</span>
          <span className="text-xl font-bold text-navy-700">{total.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-graphite/60">判定结果:</span>
          {result === 'advance' && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-600">自动通过 (≥{criteria.thresholds.autoAdvance})</span>}
          {result === 'reject' && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-500">自动拒绝 (≤{criteria.thresholds.autoReject})</span>}
          {result === 'pending' && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-600">人工复审</span>}
        </div>
      </div>
    </div>
  )
}

export default function HrWorkspace() {
  const { currentRole, switchRole } = useStore()
  const [templates, setTemplates] = useState(MOCK_TEMPLATES)
  const [selectedId, setSelectedId] = useState(MOCK_TEMPLATES[0].id)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSections, setFormSections] = useState<string[]>([])
  const [criteria, setCriteria] = useState<ScoringCriteria>(MOCK_TEMPLATES[0].scoringCriteria)
  const [previewTemplate, setPreviewTemplate] = useState<CompanyTemplate | null>(null)

  if (currentRole !== 'hr') {
    return <AccessDenied onSwitch={() => switchRole('hr')} />
  }

  const selected = templates.find((t) => t.id === selectedId)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const t = templates.find((tpl) => tpl.id === id)
    if (t) setCriteria(t.scoringCriteria)
  }

  const handleCreate = () => {
    if (!formName) return
    const newTpl: CompanyTemplate = {
      id: `t-${Date.now()}`,
      companyId: 'c-001',
      name: formName,
      sections: formSections.map((type, i) => ({ id: `s-${Date.now()}-${i}`, type: type as CompanyTemplate['sections'][number]['type'], order: i + 1, content: {} })),
      scoringCriteria: { dimensions: DIMENSION_LABELS.map((name) => ({ name, weight: 20 })), thresholds: { autoAdvance: 75, autoReject: 40 } },
    }
    setTemplates([...templates, newTpl])
    setFormName('')
    setFormSections([])
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const remaining = templates.filter((t) => t.id !== id)
    setTemplates(remaining)
    if (selectedId === id && remaining.length > 0) handleSelect(remaining[0].id)
  }

  const handleWeightChange = (idx: number, val: number) => {
    const dims = [...criteria.dimensions]
    dims[idx] = { ...dims[idx], weight: val }
    setCriteria({ ...criteria, dimensions: dims })
  }

  const handleSave = () => {
    setTemplates(templates.map((t) => t.id === selectedId ? { ...t, scoringCriteria: criteria } : t))
  }

  const toggleSection = (type: string) => {
    setFormSections((prev) => prev.includes(type) ? prev.filter((s) => s !== type) : [...prev, type])
  }

  const sectionLabel = (type: string) => SECTION_OPTIONS.find((s) => s.type === type)?.label ?? type

  return (
    <div className="min-h-screen bg-ivory p-6">
      <h1 className="section-title mb-6">HR协作空间</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '企业模板数', value: templates.length, icon: LayoutTemplate, color: 'text-navy-500 bg-navy-50' },
          { label: '活跃岗位', value: 12, icon: FileText, color: 'text-amber-600 bg-amber-50' },
          { label: '本月投递数', value: 247, icon: Plus, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5 flex items-center gap-4">
            <div className={`${s.color} p-3 rounded-xl`}><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-graphite/50">{s.label}</p>
              <p className="text-2xl font-bold text-navy-700">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-700 text-lg">模板管理</h2>
            <button className="btn-amber inline-flex items-center gap-2 text-sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> 新建模板
            </button>
          </div>

          {showForm && (
            <div className="glass-card p-5 mb-4">
              <h3 className="font-semibold text-navy-500 mb-3">新建模板</h3>
              <input placeholder="模板名称" value={formName} onChange={(e) => setFormName(e.target.value)} className="input-field mb-3" />
              <p className="text-xs text-graphite/60 mb-2">选择模块</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {SECTION_OPTIONS.map((s) => (
                  <button key={s.type} onClick={() => toggleSection(s.type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${formSections.includes(s.type) ? 'bg-navy-500 text-white' : 'bg-white/70 text-graphite/60 hover:bg-white'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn-secondary text-sm" onClick={() => setShowForm(false)}>取消</button>
                <button className="btn-primary text-sm" onClick={handleCreate}>创建</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {templates.map((tpl) => {
              const atsOk = ATS_VALID[tpl.id] ?? true
              return (
                <div key={tpl.id} onClick={() => handleSelect(tpl.id)}
                  className={`glass-card p-4 cursor-pointer transition hover:shadow-md ${selectedId === tpl.id ? 'ring-2 ring-navy-500' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-700">{tpl.name}</span>
                      {atsOk
                        ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                        : <XCircle className="h-4 w-4 text-red-400" />}
                      <span className={`text-xs ${atsOk ? 'text-emerald-500' : 'text-red-400'}`}>
                        {atsOk ? 'ATS通过' : 'ATS未通过'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-500" title="模板预览"
                        onClick={(e) => { e.stopPropagation(); setPreviewTemplate(tpl) }}><Eye className="h-3.5 w-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-500" onClick={(e) => { e.stopPropagation() }}><Edit3 className="h-3.5 w-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id) }}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-graphite/50 mb-1.5">模块数: {tpl.sections.length}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.sections.map((s) => (
                      <span key={s.id} className="text-xs bg-navy-50 text-navy-500 px-2 py-0.5 rounded">{sectionLabel(s.type)}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tpl.scoringCriteria.dimensions.slice(0, 3).map((d) => (
                      <span key={d.name} className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">{d.name}: {d.weight}%</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-navy-700 text-lg mb-4">评分标准配置</h2>
          {selected && (
            <>
              <div className="glass-card p-5">
                <p className="text-sm text-graphite/70 mb-4">当前模板: <span className="font-semibold text-navy-700">{selected.name}</span></p>

                <div className="space-y-4 mb-6">
                  {criteria.dimensions.map((dim, idx) => (
                    <div key={dim.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-navy-700">{dim.name}</span>
                        <span className="text-sm font-medium text-amber-600">{dim.weight}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={dim.weight}
                        onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-500" />
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-navy-700 mb-2">权重可视化</p>
                  <div className="space-y-2">
                    {criteria.dimensions.map((dim) => (
                      <div key={dim.name} className="flex items-center gap-3">
                        <span className="text-xs text-graphite/60 w-20 text-right">{dim.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-navy-500 h-full rounded-full transition-all" style={{ width: `${dim.weight}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs text-graphite/60 block mb-1">自动通过分数</label>
                    <input type="number" value={criteria.thresholds.autoAdvance}
                      onChange={(e) => setCriteria({ ...criteria, thresholds: { ...criteria.thresholds, autoAdvance: Number(e.target.value) } })}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs text-graphite/60 block mb-1">自动拒绝分数</label>
                    <input type="number" value={criteria.thresholds.autoReject}
                      onChange={(e) => setCriteria({ ...criteria, thresholds: { ...criteria.thresholds, autoReject: Number(e.target.value) } })}
                      className="input-field" />
                  </div>
                </div>

                <button className="btn-primary inline-flex items-center gap-2 text-sm" onClick={handleSave}>
                  <Save className="h-4 w-4" /> 保存配置
                </button>
              </div>

              <ScoringSimulator criteria={criteria} />
            </>
          )}
        </div>
      </div>

      {previewTemplate && (
        <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  )
}
