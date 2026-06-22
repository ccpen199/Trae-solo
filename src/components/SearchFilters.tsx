import { Search, Filter, X, ChevronDown, ChevronUp, Layers, Clock, Globe, Image } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ItemCategory, SubjectType } from '../types'
import { categoryLabels, subjectLabels } from '../data/constants'

export default function SearchFilters() {
  const { filters, setFilters } = useApp()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const categories: (ItemCategory | 'all')[] = ['all', 'household', 'education', 'traffic', 'social_security', 'medical', 'housing', 'business']
  const subjectTypes: (SubjectType | 'all')[] = ['all', 'personal', 'enterprise']
  const materialCountOptions = [
    { value: 'all', label: '全部' },
    { value: 'few', label: '1-2项（少）' },
    { value: 'medium', label: '3-5项（中）' },
    { value: 'many', label: '6项以上（多）' },
  ]
  const promiseTimeOptions = [
    { value: 'all', label: '全部' },
    { value: 'instant', label: '当日/即时' },
    { value: 'short', label: '1-3工作日' },
    { value: 'medium', label: '4-7工作日' },
    { value: 'long', label: '8工作日以上' },
  ]
  const hasOnlineEntryOptions = [
    { value: 'all', label: '全部' },
    { value: 'yes', label: '可在线办理' },
    { value: 'no', label: '仅线下办理' },
  ]
  const hasExampleImageOptions = [
    { value: 'all', label: '全部' },
    { value: 'yes', label: '有材料示例图' },
    { value: 'no', label: '无示例图' },
  ]

  const clearFilters = () => {
    setFilters({
      keyword: '',
      category: 'all',
      subjectType: 'all',
      materialCount: 'all',
      promiseTime: 'all',
      hasOnlineEntry: 'all',
      hasExampleImage: 'all',
    })
  }

  const hasActiveFilters =
    filters.keyword ||
    filters.category !== 'all' ||
    filters.subjectType !== 'all' ||
    filters.materialCount !== 'all' ||
    filters.promiseTime !== 'all' ||
    filters.hasOnlineEntry !== 'all' ||
    filters.hasExampleImage !== 'all'

  const activeFilterCount = [
    filters.category !== 'all',
    filters.subjectType !== 'all',
    filters.materialCount !== 'all',
    filters.promiseTime !== 'all',
    filters.hasOnlineEntry !== 'all',
    filters.hasExampleImage !== 'all',
  ].filter(Boolean).length

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

        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Filter className="w-4 h-4" />
            <span>更多筛选维度</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium w-28 shrink-0 pt-1.5">
                <Layers className="w-4 h-4" />
                <span>材料数量：</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {materialCountOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, materialCount: opt.value as any })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.materialCount === opt.value
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium w-28 shrink-0 pt-1.5">
                <Clock className="w-4 h-4" />
                <span>承诺时限：</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {promiseTimeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, promiseTime: opt.value as any })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.promiseTime === opt.value
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium w-28 shrink-0 pt-1.5">
                <Globe className="w-4 h-4" />
                <span>办理渠道：</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {hasOnlineEntryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, hasOnlineEntry: opt.value as any })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.hasOnlineEntry === opt.value
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium w-28 shrink-0 pt-1.5">
                <Image className="w-4 h-4" />
                <span>示例图：</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {hasExampleImageOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, hasExampleImage: opt.value as any })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.hasExampleImage === opt.value
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
