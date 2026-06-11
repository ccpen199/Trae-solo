import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Wrench, Calendar, Tag } from 'lucide-react'

const craftOptions = ['横机编织', '圆机编织', '提花', '缝盘', '洗水', '整烫', '缩绒', '绣花', '印花']
const locationOptions = ['濮院', '大朗', '汕头', '苏州', '杭州', '宁波', '绍兴', '桐乡', '义乌', '温州']

interface FilterState {
  location: string
  crafts: string[]
  quantityRange: [number, number]
  deadlineRange: string
}

interface FilterPanelProps {
  filters: FilterState
  onChange: (f: FilterState) => void
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCraft = (craft: string) => {
    const crafts = filters.crafts.includes(craft)
      ? filters.crafts.filter((c) => c !== craft)
      : [...filters.crafts, craft]
    onChange({ ...filters, crafts })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-50">
        <h3 className="font-medium text-sm text-navy-700">筛选条件</h3>
        <button onClick={() => setCollapsed(!collapsed)} className="text-navy-400 hover:text-navy-600">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><MapPin size={12} />地域</label>
            <select
              value={filters.location}
              onChange={(e) => onChange({ ...filters, location: e.target.value })}
              className="w-full border border-navy-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="">全部地域</option>
              {locationOptions.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><Wrench size={12} />工艺类型</label>
            <div className="flex flex-wrap gap-1.5">
              {craftOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCraft(c)}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                    filters.crafts.includes(c)
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><Tag size={12} />数量范围</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="最小"
                value={filters.quantityRange[0] || ''}
                onChange={(e) => onChange({ ...filters, quantityRange: [Number(e.target.value), filters.quantityRange[1]] })}
                className="w-full border border-navy-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <span className="text-navy-300 text-xs">-</span>
              <input
                type="number"
                placeholder="最大"
                value={filters.quantityRange[1] || ''}
                onChange={(e) => onChange({ ...filters, quantityRange: [filters.quantityRange[0], Number(e.target.value)] })}
                className="w-full border border-navy-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><Calendar size={12} />交期范围</label>
            <select
              value={filters.deadlineRange}
              onChange={(e) => onChange({ ...filters, deadlineRange: e.target.value })}
              className="w-full border border-navy-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="">不限</option>
              <option value="1m">1个月内</option>
              <option value="2m">2个月内</option>
              <option value="3m">3个月内</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
