import { useState, useRef, useEffect } from 'react'
import { Search, RotateCcw, ChevronDown, X } from 'lucide-react'
import { type FilterState, defaultFilter, allDepartments } from './data'

interface FilterPanelProps {
  filter: FilterState
  onChange: (filter: FilterState) => void
  onReset: () => void
}

const typeTabs: { key: FilterState['type']; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'hospital', label: '医院' },
  { key: 'community', label: '社区卫生' },
  { key: 'pharmacy', label: '药店' },
]

const levelOptions = [
  { value: 'all', label: '全部等级' },
  { value: '三级', label: '三级' },
  { value: '二级', label: '二级' },
  { value: '一级', label: '一级' },
  { value: '', label: '未定级' },
]

export default function FilterPanel({ filter, onChange, onReset }: FilterPanelProps) {
  const [deptOpen, setDeptOpen] = useState(false)
  const deptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleDept = (dept: string) => {
    const next = filter.departments.includes(dept)
      ? filter.departments.filter((d) => d !== dept)
      : [...filter.departments, dept]
    onChange({ ...filter, departments: next })
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white rounded-xl p-5 shadow-sm border border-gray-100 overflow-y-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">医保定点机构</h1>
        <p className="text-sm text-gray-500 mt-1">查找您身边的定点医院和药店</p>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filter.keyword}
          onChange={(e) => onChange({ ...filter, keyword: e.target.value })}
          placeholder="搜索机构名称..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700 mb-2 block">机构类型</label>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange({ ...filter, type: tab.key })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter.type === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700 mb-2 block">机构等级</label>
        <div className="relative">
          <select
            value={filter.level}
            onChange={(e) => onChange({ ...filter, level: e.target.value })}
            className="w-full appearance-none py-2 px-3 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {levelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="mb-5 relative" ref={deptRef}>
        <label className="text-sm font-medium text-gray-700 mb-2 block">科室筛选</label>
        <button
          onClick={() => setDeptOpen(!deptOpen)}
          className="w-full flex items-center justify-between py-2 px-3 text-sm border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <span className="text-gray-500">
            {filter.departments.length > 0
              ? `已选 ${filter.departments.length} 个科室`
              : '选择科室'}
          </span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
        {deptOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
            {allDepartments.map((dept) => (
              <button
                key={dept}
                onClick={() => toggleDept(dept)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-50"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    filter.departments.includes(dept)
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                  }`}
                >
                  {filter.departments.includes(dept) && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <span className={filter.departments.includes(dept) ? 'text-primary font-medium' : 'text-gray-700'}>
                  {dept}
                </span>
              </button>
            ))}
            {filter.departments.length > 0 && (
              <button
                onClick={() => onChange({ ...filter, departments: [] })}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-danger mt-1"
              >
                <X size={12} />
                清除选择
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700 mb-2 block">药品目录</label>
        <input
          type="text"
          value={filter.medicine}
          onChange={(e) => onChange({ ...filter, medicine: e.target.value })}
          placeholder="输入药品名筛选..."
          className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          距离范围：{filter.distance}公里
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={filter.distance}
          onChange={(e) => onChange({ ...filter, distance: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1km</span>
          <span>10km</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <RotateCcw size={14} />
        重置筛选
      </button>
    </div>
  )
}
