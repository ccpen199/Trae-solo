import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  FolderOpen,
  Tag,
  Sparkles,
} from 'lucide-react'
import { useStore } from '@/store'
import type { CaseSection } from '@/types'

const SECTION_ICONS: Record<string, typeof User> = {
  personal: User,
  education: GraduationCap,
  experience: Briefcase,
  skills: Wrench,
  projects: FolderOpen,
}

function renderSectionContent(section: CaseSection) {
  const { content } = section
  if (!content || typeof content !== 'object') return null

  const entries = Object.entries(content)

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <span className="text-xs text-graphite/40 uppercase tracking-wider">{key}</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {value.map((item, i) => (
                  <span
                    key={i}
                    className="bg-navy-50 text-navy-600 text-xs px-2 py-0.5 rounded-full"
                  >
                    {String(item)}
                  </span>
                ))}
              </div>
            </div>
          )
        }
        if (typeof value === 'object' && value !== null) {
          return null
        }
        return (
          <div key={key} className="flex items-baseline gap-2">
            <span className="text-xs text-graphite/40 uppercase tracking-wider shrink-0">
              {key}
            </span>
            <span className="text-sm text-graphite/80">{String(value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cases } = useStore()

  const currentCase = useMemo(() => cases.find((c) => c.id === id), [cases, id])

  const relatedCases = useMemo(() => {
    if (!currentCase) return []
    return cases
      .filter((c) => c.id !== currentCase.id && c.industry === currentCase.industry)
      .slice(0, 2)
  }, [cases, currentCase])

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-navy-500 mb-2">
            案例未找到
          </h2>
          <p className="text-sm text-graphite/60 mb-4">该案例不存在或已被删除</p>
          <button onClick={() => navigate('/cases')} className="btn-primary">
            返回案例库
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-1.5 text-sm text-graphite/50 hover:text-navy-500 transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回案例库
        </button>

        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-ats">{currentCase.industry}</span>
            <span className="badge-score">{currentCase.level}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-navy-500 mb-2">
            {currentCase.company}
          </h1>
          <p className="text-graphite/60">{currentCase.summary}</p>
        </div>

        <div className="glass-card p-6 mb-6">
          <h2 className="font-display text-lg font-semibold text-navy-500 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            核心亮点
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentCase.highlights.map((h, i) => (
              <div
                key={i}
                className="border border-amber-400/30 bg-amber-400/5 rounded-lg p-3"
              >
                <span className="text-amber-500 font-semibold mr-1.5">{i + 1}.</span>
                <span className="text-sm text-graphite/80">{h}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {currentCase.sections.map((section) => {
            const Icon = SECTION_ICONS[section.type] || FolderOpen
            return (
              <div key={section.id} className="glass-card p-6">
                <h3 className="font-display text-base font-semibold text-navy-500 mb-4 flex items-center gap-2">
                  <Icon className="h-4.5 w-4.5 text-amber-400" />
                  {section.title}
                </h3>
                {renderSectionContent(section)}
              </div>
            )
          })}
        </div>

        {currentCase.tags.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h3 className="font-display text-base font-semibold text-navy-500 mb-4 flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-amber-400" />
              标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentCase.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-navy-50 text-graphite/60 text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => alert('功能开发中，敬请期待！')}
          className="btn-amber w-full py-3 mb-8"
        >
          参考此案例优化我的简历
        </button>

        {relatedCases.length > 0 && (
          <div>
            <h2 className="section-title mb-4">相关案例</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedCases.map((c) => (
                <div
                  key={c.id}
                  className="glass-card p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/cases/${c.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-ats">{c.industry}</span>
                    <span className="badge-score">{c.level}</span>
                  </div>
                  <h3 className="font-semibold text-navy-700 mb-1">{c.company}</h3>
                  <p className="text-sm text-graphite/60 line-clamp-2">{c.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
