import { FileText, Tag, Plus } from 'lucide-react'

const stats = [
  { label: '政策文件总数', value: 24, icon: FileText, color: '#165DFF', bg: '#E8F0FF' },
  { label: '标签总数', value: 10, icon: Tag, color: '#00B42A', bg: '#E8FFEA' },
  { label: '本月新增政策', value: 3, icon: Plus, color: '#FF7D00', bg: '#FFF3E8' },
]

export default function PolicyStatsCards() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-4 rounded-lg border border-gray-100 px-5 py-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
            <s.icon size={20} style={{ color: s.color }} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
