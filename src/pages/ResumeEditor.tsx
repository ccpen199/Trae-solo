import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Save,
  X,
} from 'lucide-react'
import { useStore } from '@/store'
import type { ResumeSection } from '@/types'

const SECTION_META: Record<string, { label: string; icon: typeof User }> = {
  personal: { label: '个人信息', icon: User },
  education: { label: '教育经历', icon: GraduationCap },
  experience: { label: '工作经历', icon: Briefcase },
  skills: { label: '技能特长', icon: Wrench },
  projects: { label: '项目经历', icon: FolderOpen },
}

function SortableItem({
  section,
  expanded,
  onToggle,
  onDelete,
  onUpdate,
  children,
}: {
  section: ResumeSection
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onUpdate: (content: Record<string, unknown>) => void
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })
  const meta = SECTION_META[section.type] || SECTION_META.personal
  const Icon = meta.icon

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border border-navy-100 mb-2">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-default">
        <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="cursor-grab text-navy-300 hover:text-navy-500">
          <GripVertical size={16} />
        </button>
        <Icon size={16} className="text-amber-500" />
        <span className="flex-1 text-sm font-medium text-navy-700">{meta.label}</span>
        <button onClick={onToggle} className="text-navy-400 hover:text-navy-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <button onClick={onDelete} className="text-navy-300 hover:text-coral">
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && <div className="px-4 pb-3 border-t border-navy-50 pt-3">{children}</div>}
    </div>
  )
}

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block mb-2">
      <span className="text-xs text-navy-400 mb-0.5 block">{label}</span>
      <input
        className="input-field text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function SectionForm({ section, onUpdate }: { section: ResumeSection; onUpdate: (c: Record<string, unknown>) => void }) {
  const c = section.content
  const set = (key: string, val: unknown) => onUpdate({ ...c, [key]: val })

  if (section.type === 'personal') {
    return (
      <>
        <FieldRow label="姓名" value={(c.name as string) || ''} onChange={(v) => set('name', v)} />
        <FieldRow label="邮箱" value={(c.email as string) || ''} onChange={(v) => set('email', v)} />
        <FieldRow label="电话" value={(c.phone as string) || ''} onChange={(v) => set('phone', v)} />
        <FieldRow label="所在地" value={(c.location as string) || ''} onChange={(v) => set('location', v)} />
        <label className="block mb-2">
          <span className="text-xs text-navy-400 mb-0.5 block">个人简介</span>
          <textarea className="input-field text-sm min-h-[60px]" value={(c.summary as string) || ''} onChange={(e) => set('summary', e.target.value)} />
        </label>
      </>
    )
  }

  if (section.type === 'education' || section.type === 'experience') {
    const items = (c.items as Record<string, unknown>[]) || [c]
    if (!Array.isArray(c.items)) {
      const keys = section.type === 'education'
        ? ['school', 'degree', 'major', 'period']
        : ['company', 'position', 'period', 'description']
      const labels = section.type === 'education'
        ? ['学校', '学位', '专业', '时间']
        : ['公司', '职位', '时间', '描述']
      return (
        <>
          {keys.map((key, i) => (
            <FieldRow key={key} label={labels[i]} value={(c[key] as string) || ''} onChange={(v) => set(key, v)} />
          ))}
          <button className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 mt-1" onClick={() => onUpdate({ ...c, items: [{ ...c }] })}>
            <Plus size={12} /> 添加更多
          </button>
        </>
      )
    }
    return (
      <>
        {items.map((item, idx) => (
          <div key={idx} className="mb-3 pb-2 border-b border-navy-50 last:border-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-navy-500">#{idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => { const n = items.filter((_, i) => i !== idx); onUpdate({ ...c, items: n }); }} className="text-xs text-coral hover:text-red-500"><X size={12} /></button>
              )}
            </div>
            {Object.entries(item).map(([key, val]) => (
              <FieldRow key={key} label={key} value={String(val || '')} onChange={(v) => { const n = [...items]; n[idx] = { ...n[idx], [key]: v }; onUpdate({ ...c, items: n }); }} />
            ))}
          </div>
        ))}
        <button className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1" onClick={() => onUpdate({ ...c, items: [...items, {}] })}>
          <Plus size={12} /> 添加更多
        </button>
      </>
    )
  }

  if (section.type === 'skills') {
    const tags = (c.items as string[]) || []
    const [input, setInput] = useState('')
    return (
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag, i) => (
            <span key={i} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              {tag}
              <button onClick={() => onUpdate({ ...c, items: tags.filter((_, j) => j !== i) })} className="hover:text-coral"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input className="input-field text-sm flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { onUpdate({ ...c, items: [...tags, input.trim()] }); setInput(''); } }} placeholder="输入技能后回车" />
          <button className="btn-primary text-xs px-3 py-1.5" onClick={() => { if (input.trim()) { onUpdate({ ...c, items: [...tags, input.trim()] }); setInput(''); } }}>
            <Plus size={14} />
          </button>
        </div>
      </div>
    )
  }

  if (section.type === 'projects') {
    return (
      <>
        <FieldRow label="项目名" value={(c.name as string) || ''} onChange={(v) => set('name', v)} />
        <FieldRow label="角色" value={(c.role as string) || ''} onChange={(v) => set('role', v)} />
        <FieldRow label="描述" value={(c.description as string) || ''} onChange={(v) => set('description', v)} />
        <FieldRow label="链接" value={(c.link as string) || ''} onChange={(v) => set('link', v)} />
      </>
    )
  }

  return null
}

function extractKeywords(sections: ResumeSection[]) {
  const allText = sections
    .map((s) => Object.values(s.content).join(' '))
    .join(' ')
  const words = allText.split(/[\s,，.。;；:：、/\\()\[\]{}|!！?？@#$%^&*]+/).filter((w) => w.length > 1)
  const freq: Record<string, number> = {}
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1 })
  const total = words.length || 1
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, density: +((count / total) * 100).toFixed(1) }))
}

function ResumePreview({ sections, title }: { sections: ResumeSection[]; title: string }) {
  return (
    <div className="bg-white shadow-xl rounded-lg mx-auto" style={{ width: '100%', aspectRatio: '210/297', padding: '12% 10%' }}>
      <h1 className="text-lg font-bold text-navy-700 mb-3 border-b-2 border-amber-400 pb-2 font-display">{title}</h1>
      {sections.map((s) => {
        const meta = SECTION_META[s.type]
        if (!meta) return null
        const Icon = meta.icon
        const c = s.content
        return (
          <div key={s.id} className="mb-3">
            <h2 className="text-sm font-semibold text-navy-600 flex items-center gap-1.5 mb-1 border-b border-navy-100 pb-0.5">
              <Icon size={13} className="text-amber-500" />{meta.label}
            </h2>
            {s.type === 'personal' && (
              <div className="text-xs text-graphite leading-relaxed">
                <p className="font-medium">{(c.name as string) || ''}</p>
                <p>{[c.email, c.phone, c.location].filter(Boolean).join(' · ')}</p>
                {c.summary && <p className="mt-1 text-navy-400 italic">{c.summary as string}</p>}
              </div>
            )}
            {s.type === 'education' && (
              <div className="text-xs text-graphite">
                <p className="font-medium">{(c.school as string) || ''} — {(c.major as string) || ''}</p>
                <p className="text-navy-400">{(c.degree as string) || ''} | {(c.period as string) || ''}</p>
              </div>
            )}
            {s.type === 'experience' && (
              <div className="text-xs text-graphite">
                <p className="font-medium">{(c.company as string) || ''} · {(c.position as string) || ''}</p>
                <p className="text-navy-400">{(c.period as string) || ''}</p>
                {c.description && <p className="mt-0.5">{c.description as string}</p>}
              </div>
            )}
            {s.type === 'skills' && (
              <div className="flex flex-wrap gap-1">
                {((c.items as string[]) || []).map((t, i) => (
                  <span key={i} className="text-xs bg-navy-50 text-navy-600 px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
            {s.type === 'projects' && (
              <div className="text-xs text-graphite">
                <p className="font-medium">{(c.name as string) || ''} · {(c.role as string) || ''}</p>
                {c.description && <p>{c.description as string}</p>}
                {c.link && <p className="text-amber-600">{c.link as string}</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ResumeEditor() {
  const { id } = useParams()
  const { resumes, updateResume } = useStore()
  const resume = useMemo(
    () => resumes.find((r) => r.id === id) || resumes[0],
    [resumes, id]
  )

  const [title, setTitle] = useState(resume?.title || '')
  const [lang, setLang] = useState<'zh' | 'en'>(resume?.lang || 'zh')
  const [sections, setSections] = useState<ResumeSection[]>(resume?.sections || [])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ personal: true })

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }))
  const updateSection = (sid: string, content: Record<string, unknown>) => {
    setSections((p) => p.map((s) => (s.id === sid ? { ...s, content } : s)))
  }
  const deleteSection = (sid: string) => setSections((p) => p.filter((s) => s.id !== sid))
  const addSection = (type: ResumeSection['type']) => {
    const id = `s-${Date.now()}`
    const defaults: Record<string, Record<string, unknown>> = {
      education: { school: '', degree: '', major: '', period: '' },
      experience: { company: '', position: '', period: '', description: '' },
      skills: { items: [] },
      projects: { name: '', role: '', description: '', link: '' },
      custom: { title: '自定义模块', content: '' },
    }
    setSections((p) => [...p, { id, type, order: p.length + 1, content: defaults[type] || {} }])
    setExpanded((prev) => ({ ...prev, [id]: true }))
  }

  const handleSave = () => {
    if (!resume) return
    updateResume(resume.id, { title, lang, sections })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections((p) => {
      const oldIdx = p.findIndex((s) => s.id === active.id)
      const newIdx = p.findIndex((s) => s.id === over.id)
      return arrayMove(p, oldIdx, newIdx).map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const keywords = useMemo(() => extractKeywords(sections), [sections])
  const atsScore = useMemo(() => {
    if (!keywords.length) return 0
    const avgDensity = keywords.reduce((s, k) => s + k.density, 0) / keywords.length
    return Math.min(100, Math.round(40 + avgDensity * 15 + keywords.length * 3))
  }, [keywords])
  const maxCount = Math.max(...keywords.map((k) => k.count), 1)

  if (!resume) return <div className="p-8 text-center text-navy-400">未找到简历数据</div>

  return (
    <div className="h-screen flex flex-col bg-ivory">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-navy-100">
        <input className="input-field max-w-xs font-medium" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${lang === 'zh' ? 'bg-navy-500 text-white border-navy-500' : 'border-navy-200 text-navy-500 hover:bg-navy-50'}`}
          onClick={() => setLang('zh')}
        >中</button>
        <button
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${lang === 'en' ? 'bg-navy-500 text-white border-navy-500' : 'border-navy-200 text-navy-500 hover:bg-navy-50'}`}
          onClick={() => setLang('en')}
        >EN</button>
        <div className="flex-1" />
        <button className="btn-amber flex items-center gap-1.5 text-sm" onClick={handleSave}>
          <Save size={15} /> 保存
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-4 border-r border-navy-100">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((s) => (
                <SortableItem
                  key={s.id}
                  section={s}
                  expanded={!!expanded[s.id]}
                  onToggle={() => toggleExpand(s.id)}
                  onDelete={() => deleteSection(s.id)}
                  onUpdate={(c) => updateSection(s.id, c)}
                >
                  <SectionForm section={{ ...s, content: { ...s.content } }} onUpdate={(c) => updateSection(s.id, c)} />
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['education', 'experience', 'skills', 'projects'] as const).map((type) => (
              <button key={type} className="text-xs border border-dashed border-navy-200 text-navy-400 px-3 py-1.5 rounded-lg hover:border-amber-400 hover:text-amber-500 transition flex items-center gap-1" onClick={() => addSection(type)}>
                <Plus size={12} /> {SECTION_META[type].label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-1/2 overflow-y-auto p-4 bg-navy-50/40">
          <ResumePreview sections={sections} title={title} />
          <div className="mt-4 bg-white rounded-lg border border-navy-100 p-4">
            <h3 className="text-sm font-semibold text-navy-700 mb-3">关键词密度</h3>
            <div className="space-y-2">
              {keywords.map((k) => (
                <div key={k.word} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate text-navy-600">{k.word}</span>
                  <div className="flex-1 bg-navy-50 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${(k.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-navy-400">{k.density}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 pt-3 border-t border-navy-50">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8EDF2" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D4A853" strokeWidth="3" strokeDasharray={`${atsScore} ${100 - atsScore}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-navy-700">{atsScore}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-700">ATS友好度</p>
                <p className="text-xs text-navy-400">{atsScore >= 80 ? '优秀' : atsScore >= 60 ? '良好' : '需优化'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
