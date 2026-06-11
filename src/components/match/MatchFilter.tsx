import { MapPin, Wrench, Calendar, Tag } from 'lucide-react'
import type { MatchWeights } from '@/store'

const craftOptions = ['横机编织', '圆机编织', '提花', '缝盘', '洗水', '整烫', '缩绒', '绣花', '印花']
const locationOptions = ['濮院', '大朗', '汕头', '苏州', '杭州', '宁波', '绍兴', '桐乡']

interface MatchFilterProps {
  type: string
  location: string
  crafts: string[]
  quantity: number
  deadline: string
  budgetRange: [number, number]
  weights: MatchWeights
  onTypeChange: (v: string) => void
  onLocationChange: (v: string) => void
  onCraftsChange: (v: string[]) => void
  onQuantityChange: (v: number) => void
  onDeadlineChange: (v: string) => void
  onBudgetChange: (v: [number, number]) => void
  onWeightsChange: (w: MatchWeights) => void
  onMatch: () => void
}

export default function MatchFilter(props: MatchFilterProps) {
  const toggleCraft = (c: string) => {
    props.onCraftsChange(
      props.crafts.includes(c) ? props.crafts.filter((x) => x !== c) : [...props.crafts, c]
    )
  }

  const weightItems: { key: keyof MatchWeights; label: string }[] = [
    { key: 'location', label: '地理位置' },
    { key: 'capacity', label: '产能档期' },
    { key: 'craft', label: '工艺能力' },
    { key: 'price', label: '历史成交价' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 space-y-5">
      <div>
        <label className="text-xs text-navy-500 mb-1.5 block">需求类型</label>
        <select value={props.type} onChange={(e) => props.onTypeChange(e.target.value)}
          className="w-full border border-navy-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400">
          <option value="procurement">采购需求</option>
          <option value="processing">加工需求</option>
          <option value="accessory">辅料需求</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><MapPin size={12} />地域</label>
        <select value={props.location} onChange={(e) => props.onLocationChange(e.target.value)}
          className="w-full border border-navy-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400">
          <option value="">不限</option>
          {locationOptions.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><Wrench size={12} />工艺类型</label>
        <div className="flex flex-wrap gap-1.5">
          {craftOptions.map((c) => (
            <button key={c} onClick={() => toggleCraft(c)}
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                props.crafts.includes(c) ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-navy-200 text-navy-500'
              }`}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><Tag size={12} />数量</label>
        <input type="range" min={0} max={20000} step={500} value={props.quantity}
          onChange={(e) => props.onQuantityChange(Number(e.target.value))}
          className="w-full accent-amber-500" />
        <div className="flex justify-between text-[10px] text-navy-300">
          <span>0</span><span>{props.quantity.toLocaleString()}件</span><span>20,000</span>
        </div>
      </div>
      <div>
        <label className="text-xs text-navy-500 mb-1.5 block flex items-center gap-1"><Calendar size={12} />交期</label>
        <select value={props.deadline} onChange={(e) => props.onDeadlineChange(e.target.value)}
          className="w-full border border-navy-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400">
          <option value="">不限</option>
          <option value="1m">1个月内</option>
          <option value="2m">2个月内</option>
          <option value="3m">3个月内</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-navy-500 mb-1.5 block">预算范围(元/件)</label>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="最低" value={props.budgetRange[0] || ''}
            onChange={(e) => props.onBudgetChange([Number(e.target.value), props.budgetRange[1]])}
            className="w-full border border-navy-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
          <span className="text-navy-300 text-xs">-</span>
          <input type="number" placeholder="最高" value={props.budgetRange[1] || ''}
            onChange={(e) => props.onBudgetChange([props.budgetRange[0], Number(e.target.value)])}
            className="w-full border border-navy-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400" />
        </div>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <h4 className="text-xs font-medium text-navy-700 mb-3">权重调节</h4>
        {weightItems.map(({ key, label }) => (
          <div key={key} className="mb-3">
            <div className="flex justify-between text-xs text-navy-500 mb-1">
              <span>{label}</span><span>{props.weights[key]}%</span>
            </div>
            <input type="range" min={0} max={100} value={props.weights[key]}
              onChange={(e) => props.onWeightsChange({ ...props.weights, [key]: Number(e.target.value) })}
              className="w-full accent-amber-500" />
          </div>
        ))}
      </div>

      <button onClick={props.onMatch}
        className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm">
        开始匹配
      </button>
    </div>
  )
}
