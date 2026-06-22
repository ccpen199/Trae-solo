import { Search, Filter, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ItemCategory, SubjectType } from '../types'
import { categoryLabels, subjectLabels } from '../data/constants'

export default function SearchFilters() {
  const { filters, setFilters } = useApp()

  const categories: (ItemCategory | 'all')[] = ['all', 'household', 'education', 'traffic', 'social_security', 'medical', 'housing', 'business']
  const subjectTypes: (SubjectType | 'all')[] = ['all', 'personal', 'enterprise']

  const clearFilters = () => {
    setFilters({ keyword: '', category: 'all', subjectType: 'all' })
  }

  const hasActiveFilters = filters.keyword || filters.category !== 'all' || filters.subjectType !== 'all'

  return (
    <div className="card p-6 space-y-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索办事事项、部门、材料名称..."
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
        />
        {filters.keyword && (
          <button
            onClick={() => setFilters({ ...filters, keyword: '' })}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
            <Filter className="w-4 h-4" />
            <span>事项类型：</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilters({ ...filters, category: cat })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.category === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? '全部' : categoryLabels[cat]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium w-20">
            <span>办理主体：</span>
          </div>
          {subjectTypes.map((st) => (
            <button
              key={st}
              onClick={() => setFilters({ ...filters, subjectType: st })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.subjectType === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st === 'all' ? '全部' : subjectLabels[st]}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
