import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RotateCcw, ChevronDown, BookOpen } from 'lucide-react'
import { useStore } from '@/store'

const INDUSTRIES = ['互联网', '金融', '制造', '医疗', '教育']
const LEVELS = ['P5/P6', 'P7/P8', 'P9+', '总监/VP']
const COMPANIES = ['阿里巴巴', '腾讯', '字节跳动', '美团', '华为']

interface Filters {
  industry: string
  level: string
  company: string
}

function matchLevel(caseLevel: string, filter: string): boolean {
  if (!filter) return true
  const map: Record<string, string[]> = {
    'P5/P6': ['P5', 'P6'],
    'P7/P8': ['P7', 'P8'],
    'P9+': ['P9', 'P10'],
    '总监/VP': ['总监', 'VP'],
  }
  const allowed = map[filter]
  return allowed ? allowed.some((l) => caseLevel.includes(l)) : caseLevel.includes(filter)
}

export default function CaseLibrary() {
  const navigate = useNavigate()
  const { cases } = useStore()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>({
    industry: '',
    level: '',
    company: '',
  })
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (filters.industry && !c.industry.includes(filters.industry)) return false
      if (filters.level && !matchLevel(c.level, filters.level)) return false
      if (filters.company && !c.company.includes(filters.company)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.summary.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [cases, filters, search])

  function resetFilters() {
    setFilters({ industry: '', level: '', company: '' })
    setSearch('')
  }

  function toggleDropdown(key: string) {
    setOpenDropdown((prev) => (prev === key ? null : key))
  }

  function selectFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }))
    setOpenDropdown(null)
  }

  const dropdownConfig: { key: keyof Filters; label: string; options: string[] }[] = [
    { key: 'industry', label: '行业', options: INDUSTRIES },
    { key: 'level', label: '职级', options: LEVELS },
    { key: 'company', label: '公司', options: COMPANIES },
  ]

  return (
    <div className="min-h-screen bg-ivory">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">大牛案例库</h1>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-graphite/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索案例..."
              className="input-field pl-9"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="w-56 shrink-0">
            <div className="glass-card p-4 space-y-4 sticky top-24">
              <h3 className="font-display text-sm font-semibold text-navy-500 uppercase tracking-wider">
                筛选条件
              </h3>

              {dropdownConfig.map(({ key, label, options }) => (
                <div key={key} className="relative">
                  <button
                    onClick={() => toggleDropdown(key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-navy-100 bg-white text-sm text-left hover:border-amber-400/50 transition-colors duration-200"
                  >
                    <span className={filters[key] ? 'text-navy-700 font-medium' : 'text-graphite/50'}>
                      {filters[key] || label}
                    </span>
                    <ChevronDown className="h-4 w-4 text-graphite/40" />
                  </button>
                  {openDropdown === key && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-navy-100 shadow-lg py-1 animate-fade-in">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => selectFilter(key, opt)}
                          className={`w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 ${
                            filters[key] === opt
                              ? 'bg-amber-400/10 text-amber-600 font-medium'
                              : 'text-graphite/70 hover:bg-navy-50 hover:text-navy-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm text-graphite/50 hover:text-coral hover:bg-coral/5 transition-colors duration-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重置筛选
              </button>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="glass-card p-5 hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge-ats">{c.industry}</span>
                      <span className="badge-score">{c.level}</span>
                    </div>

                    <h3 className="font-semibold text-navy-700 mb-1">{c.company}</h3>

                    <p className="text-sm text-graphite/60 line-clamp-2 mb-3">
                      {c.summary}
                    </p>

                    {c.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {c.highlights.slice(0, 2).map((h, i) => (
                          <span
                            key={i}
                            className="bg-amber-400/10 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full"
                          >
                            {h.length > 12 ? h.slice(0, 12) + '…' : h}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-navy-50 text-graphite/60 text-xs px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-navy-50">
                      <button
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="text-sm font-medium text-navy-500 hover:text-amber-500 transition-colors duration-200"
                      >
                        查看详情 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
                <div className="bg-navy-50 p-4 rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-navy-300" />
                </div>
                <p className="text-graphite/50 mb-1">暂无匹配案例</p>
                <p className="text-sm text-graphite/40">尝试调整筛选条件查看更多案例</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
