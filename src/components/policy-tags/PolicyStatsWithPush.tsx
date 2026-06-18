import { FileText, Tag, Plus, Settings, Bell, Users, Link2, Search } from 'lucide-react'
import { useState } from 'react'

const stats = [
  { label: '政策文件总数', value: 24, icon: FileText, color: '#165DFF', bg: '#E8F0FF' },
  { label: '标签总数', value: 156, icon: Tag, color: '#00B42A', bg: '#E8FFEA' },
  { label: '本月新增政策', value: 3, icon: Plus, color: '#FF7D00', bg: '#FFF3E8' },
]

export default function PolicyStatsWithPush() {
  const [crowdPush, setCrowdPush] = useState(true)
  const [bizPush, setBizPush] = useState(true)
  const [keywordPush, setKeywordPush] = useState(false)

  return (
    <div className="grid grid-cols-12 gap-4 mb-6">
      <div className="col-span-7 grid grid-cols-3 gap-4">
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

      <div className="col-span-5 border border-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">智能推送配置</h3>
          </div>
          <button className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors">
            <Settings size={12} />
            推送规则管理
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">人群定向推送</span>
            </div>
            <button
              onClick={() => setCrowdPush(!crowdPush)}
              className={`relative w-10 h-5 rounded-full transition-colors ${crowdPush ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${crowdPush ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">业务关联推送</span>
            </div>
            <button
              onClick={() => setBizPush(!bizPush)}
              className={`relative w-10 h-5 rounded-full transition-colors ${bizPush ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${bizPush ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">关键词匹配推送</span>
            </div>
            <button
              onClick={() => setKeywordPush(!keywordPush)}
              className={`relative w-10 h-5 rounded-full transition-colors ${keywordPush ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${keywordPush ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
