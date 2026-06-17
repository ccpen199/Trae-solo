import { useState } from 'react'
import { ArrowRightLeft, ShieldAlert, DollarSign, UserX, Zap, AlertTriangle } from 'lucide-react'

interface InterventionAction {
  id: string
  type: 'force_transfer' | 'circuit_break' | 'price_control' | 'rider_control'
  title: string
  description: string
  icon: typeof ArrowRightLeft
  color: string
}

const actions: InterventionAction[] = [
  {
    id: 'force_transfer',
    type: 'force_transfer',
    title: '强制转单',
    description: '将订单强制转移给其他骑手，适用于骑手无法完成配送的情况',
    icon: ArrowRightLeft,
    color: '#3B82F6',
  },
  {
    id: 'circuit_break',
    type: 'circuit_break',
    title: '熔断调度',
    description: '暂停指定区域的自动调度，改为人工干预模式',
    icon: ShieldAlert,
    color: '#EF4444',
  },
  {
    id: 'price_control',
    type: 'price_control',
    title: '价格调控',
    description: '动态调整配送费和溢价策略，应对供需波动',
    icon: DollarSign,
    color: '#F59E0B',
  },
  {
    id: 'rider_control',
    type: 'rider_control',
    title: '骑手管控',
    description: '对骑手进行临时封禁、降级或强制下线操作',
    icon: UserX,
    color: '#8B5CF6',
  },
]

const mockActiveInterventions = [
  { id: '1', type: 'price_control' as const, area: '朝阳区', detail: '高峰溢价 +30%', startTime: '2024-01-15 11:30', operator: '管理员A' },
  { id: '2', type: 'circuit_break' as const, area: '海淀区中关村', detail: '暂停自动调度', startTime: '2024-01-15 10:00', operator: '管理员B' },
  { id: '3', type: 'rider_control' as const, area: '全城', detail: '骑手 R001 临时封禁', startTime: '2024-01-15 09:15', operator: '管理员A' },
]

export default function Intervention() {
  const [selectedAction, setSelectedAction] = useState<InterventionAction | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleAction = (action: InterventionAction) => {
    setSelectedAction(action)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    setSelectedAction(null)
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">人工干预</h1>
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span>当前 {mockActiveInterventions.length} 项干预进行中</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: action.color + '20' }}
              >
                <action.icon className="w-6 h-6" style={{ color: action.color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{action.description}</p>
                <button
                  onClick={() => handleAction(action)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: action.color + '20', color: action.color }}
                >
                  执行操作
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">进行中的干预</h3>
        </div>
        <div className="space-y-3">
          {mockActiveInterventions.map((intervention) => {
            const actionInfo = actions.find((a) => a.type === intervention.type)
            return (
              <div
                key={intervention.id}
                className="flex items-center justify-between bg-slate-900/60 rounded-xl p-4 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  {actionInfo && (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: actionInfo.color + '20' }}
                    >
                      <actionInfo.icon className="w-4 h-4" style={{ color: actionInfo.color }} />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">{intervention.detail}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {intervention.area} · {intervention.startTime} · {intervention.operator}
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors">
                  撤销
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {confirmOpen && selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: selectedAction.color + '20' }}
              >
                <selectedAction.icon className="w-5 h-5" style={{ color: selectedAction.color }} />
              </div>
              <h3 className="text-lg font-semibold text-white">确认执行</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              确定要执行「{selectedAction.title}」操作吗？此操作可能影响线上服务。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
