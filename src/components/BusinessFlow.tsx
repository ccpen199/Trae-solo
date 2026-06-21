import { useLocation, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

const STEPS = [
  { path: '/search', label: '搜索房源' },
  { path: '/listing/', label: '查看详情' },
  { path: '/appointment', label: '预约看房' },
  { path: '/contract', label: '签署合同' },
  { path: '/payment', label: '租金支付' },
  { path: '/service', label: '租后服务' },
]

export default function BusinessFlow() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  const getStepStatus = (step: { path: string }, idx: number) => {
    if (currentPath.startsWith(step.path) || (step.path === '/listing/' && currentPath.includes('/listing/'))) {
      return 'active'
    }
    const activeIdx = STEPS.findIndex(s =>
      currentPath.startsWith(s.path) || (s.path === '/listing/' && currentPath.includes('/listing/'))
    )
    if (idx < activeIdx) return 'completed'
    return 'pending'
  }

  return (
    <div className="bg-white border-b border-space-100 px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-1">
        <span className="text-xs text-space-400 mr-2 flex-shrink-0">业务流程</span>
        {STEPS.map((step, idx) => {
          const status = getStepStatus(step, idx)
          return (
            <div key={step.path} className="flex items-center">
              {idx > 0 && (
                <div className={`w-6 h-px ${status === 'completed' || status === 'active' ? 'bg-ccb-500' : 'bg-space-200'}`} />
              )}
              <button
                onClick={() => navigate(step.path)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  status === 'active'
                    ? 'bg-ccb-500 text-white shadow-sm'
                    : status === 'completed'
                    ? 'bg-ccb-50 text-ccb-500 hover:bg-ccb-100'
                    : 'bg-space-50 text-space-400 hover:bg-space-100'
                }`}
              >
                {status === 'completed' && <Check className="w-3 h-3" />}
                {step.label}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
