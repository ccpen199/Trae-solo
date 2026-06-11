import { Package, Truck, Check } from 'lucide-react'

const sampleRecords = [
  { id: 'sam1', name: '秋季羊绒混纺样品', status: 'received', date: '2026-06-05', tracking: 'SF1234567890' },
  { id: 'sam2', name: '冬季拉链衫样品', status: 'shipped', date: '2026-06-08', tracking: 'YT0987654321' },
  { id: 'sam3', name: '春季开衫样品', status: 'pending', date: '2026-06-10', tracking: '' },
]

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Package, color: 'text-navy-400', label: '待寄送' },
  shipped: { icon: Truck, color: 'text-amber-500', label: '运输中' },
  received: { icon: Check, color: 'text-teal-500', label: '已签收' },
}

export default function SampleManagement() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="font-serif text-base font-semibold text-navy-700 mb-4">样品管理</h3>
      <div className="grid grid-cols-3 gap-3">
        {sampleRecords.map((s) => {
          const cfg = statusConfig[s.status]
          const Icon = cfg.icon
          return (
            <div key={s.id} className="border border-navy-100 rounded-lg p-3 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={cfg.color} />
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
              <h4 className="text-sm font-medium text-navy-700 mb-1">{s.name}</h4>
              <p className="text-[10px] text-navy-400">{s.date}</p>
              {s.tracking && (
                <p className="text-[10px] text-navy-400 mt-1">单号: {s.tracking}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
