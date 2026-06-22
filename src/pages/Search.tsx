import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, Flame } from 'lucide-react'
import { useStore } from '@/store'
import { townships } from '@/data'
import {
  buildResults,
  categoryOptions,
  timeRanges,
  typeBadgeColors,
  type SearchResult,
} from '@/lib/search'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const { interestTags, searchHistory, addSearchHistory, clearSearchHistory } = useStore()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTownship, setSelectedTownship] = useState('')
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  const handleSearch = (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) return
    setSubmitted(trimmed)
    addSearchHistory(trimmed)
  }

  const results = useMemo(() => {
    if (!submitted) return []
    let items = buildResults(submitted)

    if (selectedCategories.length > 0) {
      items = items.filter((r) => selectedCategories.includes(r.type))
    }
    if (selectedTownship) {
      items = items.filter((r) => r.township === selectedTownship)
    }
    if (selectedTimeRange !== 'all') {
      const range = timeRanges.find((t) => t.key === selectedTimeRange)
      if (range && range.ms !== Infinity) {
        const cutoff = Date.now() - range.ms
        items = items.filter((r) => !r.createdAt || new Date(r.createdAt).getTime() >= cutoff)
      }
    }
    return items
  }, [submitted, selectedCategories, selectedTownship, selectedTimeRange])

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach((r) => {
      if (!groups[r.typeLabel]) groups[r.typeLabel] = []
      groups[r.typeLabel].push(r)
    })
    return groups
  }, [results])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rock-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="搜索资讯、招聘、房产、美食、商家…"
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-rock-200 focus:border-jade-500 focus:outline-none text-sm transition-colors bg-white"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-rock-300 hover:text-rock-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!submitted ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-ember-400" />
              <span className="text-sm font-medium text-rock-700">热门搜索</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {interestTags.map((tag) => (
                <button key={tag} onClick={() => { setQuery(tag); handleSearch(tag) }}
                  className="px-3 py-1.5 rounded-full text-sm bg-jade-50 text-jade-600 hover:bg-jade-100 transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rock-400" />
                  <span className="text-sm font-medium text-rock-700">搜索历史</span>
                </div>
                <button onClick={clearSearchHistory} className="text-xs text-rock-400 hover:text-rock-600">清除</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <button key={term} onClick={() => { setQuery(term); handleSearch(term) }}
                    className="px-3 py-1.5 rounded-full text-sm bg-rock-50 text-rock-600 hover:bg-rock-100 transition-colors">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="flex gap-6">
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-20 space-y-5">
              <div>
                <h4 className="text-xs font-medium text-rock-500 mb-2">分类筛选</h4>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 text-sm text-rock-700 cursor-pointer hover:text-jade-600">
                      <input type="checkbox" checked={selectedCategories.includes(opt.key)}
                        onChange={() => toggleCategory(opt.key)} className="accent-jade-500 rounded" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-rock-500 mb-2">乡镇</h4>
                <select value={selectedTownship} onChange={(e) => setSelectedTownship(e.target.value)}
                  className="w-full text-sm border border-rock-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-jade-400">
                  <option value="">全部乡镇</option>
                  {townships.map((t) => <option key={t.code} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <h4 className="text-xs font-medium text-rock-500 mb-2">时间范围</h4>
                <div className="space-y-1">
                  {timeRanges.map((tr) => (
                    <label key={tr.key} className="flex items-center gap-2 text-sm text-rock-700 cursor-pointer hover:text-jade-600">
                      <input type="radio" name="timeRange" checked={selectedTimeRange === tr.key}
                        onChange={() => setSelectedTimeRange(tr.key)} className="accent-jade-500" />
                      {tr.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-rock-500">
                搜索 "<span className="text-rock-800 font-medium">{submitted}</span>" 共
                <span className="text-jade-600 font-mono mx-0.5">{results.length}</span>条结果
              </p>
              <button onClick={() => { setSubmitted(''); setQuery('') }} className="text-sm text-rock-400 hover:text-rock-600">重新搜索</button>
            </div>

            <div className="md:hidden flex flex-wrap gap-2 mb-4">
              {categoryOptions.map((opt) => (
                <button key={opt.key} onClick={() => toggleCategory(opt.key)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedCategories.includes(opt.key) ? 'bg-jade-500 text-white' : 'bg-rock-50 text-rock-600'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {results.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-rock-400">
                  没有找到相关结果
                </motion.div>
              ) : (
                Object.entries(groupedResults).map(([group, items]) => (
                  <div key={group} className="mb-6">
                    <h3 className="text-sm font-medium text-rock-500 mb-3">{group}</h3>
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                          <Link to={item.link} className="block p-3 rounded-lg border border-rock-100 hover:border-jade-200 hover:bg-jade-50/30 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeColors[item.typeLabel] || 'bg-rock-50 text-rock-600'}`}>{item.typeLabel}</span>
                              <span className="text-xs text-rock-400">{item.township}</span>
                            </div>
                            <h4 className="text-sm font-medium text-rock-900 line-clamp-1">{item.title}</h4>
                            <p className="text-xs text-rock-400 line-clamp-1 mt-1">{item.snippet}</p>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
