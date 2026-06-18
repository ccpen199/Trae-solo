import { Shield, Wallet, ClipboardList } from 'lucide-react'

const entries = [
  { icon: Shield, title: '我的参保', desc: '查看参保状态和缴费详情', bg: 'bg-primary', text: 'text-white' },
  { icon: Wallet, title: '我的待遇', desc: '查询待遇发放和领取情况', bg: 'bg-success', text: 'text-white' },
  { icon: ClipboardList, title: '我的申请', desc: '跟踪业务办理进度', bg: 'bg-warning', text: 'text-white' },
]

export default function QuickEntry() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-xl font-semibold text-gray-900">快捷入口</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {entries.map((e) => (
          <button
            key={e.title}
            className={`${e.bg} ${e.text} rounded-xl px-6 py-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            <e.icon size={32} />
            <div className="text-left">
              <div className="font-semibold text-lg">{e.title}</div>
              <div className="text-sm opacity-80 mt-0.5">{e.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
