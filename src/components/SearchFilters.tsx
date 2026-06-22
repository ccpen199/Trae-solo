import { Search, Filter, X, Layers, Clock, Globe, Image, Scale, Monitor } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ItemCategory, SubjectType } from '../types'
import { categoryLabels, subjectLabels } from '../data/constants'

export default function SearchFilters() {
  const { filters, setFilters, resetFilters } = useApp()

  const categories: (ItemCategory | 'all')[] = ['all', 'household', 'education', 'traffic', 'social_security', 'medical', 'housing', 'business']
  const subjectTypes: (SubjectType | 'all')[] = ['all', 'personal', 'enterprise']
  const materialCountOptions = [
    { value: 'all', label: '全部' },
    { value: 'few', label: '1-3项' },
    { value: 'medium', label: '4-5项' },
    { value: 'many', label: '6项+' },
  ]
  const promiseTimeOptions = [
    { value: 'all', label: '全部' },
    { value: 'instant', label: '当日/即时' },
    { value: 'short', label: '1-3工作日' },
    { value: 'medium', label: '4-7工作日' },
    { value: 'long', label: '8工作日+' },
  ]
  const legalTimeOptions = [
    { value: 'all', label: '全部' },
    { value: 'short', label: '≤5工作日' },
    { value: 'medium', label: '6-15工作日' },
    { value: 'long', label: '16工作日+' },
  ]
  const hasOnlineEntryOptions = [
    { value: 'all', label: '全部' },
    { value: 'yes', label: '可在线办理' },
    { value: 'no', label: '仅线下' },
  ]
  const onlinePlatformOptions = [
    { value: 'all', label: '全部' },
    { value: 'province_gov', label: '省级政务网' },
    { value: 'city_gov', label: '市级政务网' },
    { value: 'wechat_mini', label: '微信小程序' },
    { value: 'app', label: 'APP' },
  ]
  const hasExampleImageOptions = [
    { value: 'all', label: '全部' },
    { value: 'yes', label: '有示例图' },
    { value: 'no', label: '无示例图' },
  ]

  const hasActiveFilters =
    filters.keyword ||
    filters.category !== 'all' ||
    filters.subjectType !== 'all' ||
    filters.materialCount !== 'all' ||
    filters.promiseTime !== 'all' ||
    filters.legalTime !== 'all' ||
    filters.hasOnlineEntry !== 'all' ||
    filters.onlinePlatform !== 'all' ||
    filters.hasExampleImage !== 'all'

  return (
    <div className="card p-6 space-y-4">
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

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Filter className="w-4 h-4" />
            <span>事项类型</span>
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
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Filter className="w-4 h-4" />
            <span>办理主体</span>
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
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Layers className="w-4 h-4" />
            <span>材料数量</span>
          </div>
          {materialCountOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, materialCount: opt.value as any })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.materialCount === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Clock className="w-4 h-4" />
            <span>承诺时限</span>
          </div>
          {promiseTimeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, promiseTime: opt.value as any })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.promiseTime === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Scale className="w-4 h-4" />
            <span>法定时限</span>
          </div>
          {legalTimeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, legalTime: opt.value as any })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.legalTime === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Globe className="w-4 h-4" />
            <span>办理渠道</span>
          </div>
          {hasOnlineEntryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, hasOnlineEntry: opt.value as any })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.hasOnlineEntry === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Monitor className="w-4 h-4" />
            <span>线上平台</span>
          </div>
          {onlinePlatformOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, onlinePlatform: opt.value as any })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.onlinePlatform === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium shrink-0 w-20">
            <Image className="w-4 h-4" />
            <span>示例图</span>
          </div>
          {hasExampleImageOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, hasExampleImage: opt.value as any })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filters.hasExampleImage === opt.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              清除全部筛选条件
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
