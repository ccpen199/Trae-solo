import { Download, CheckCircle, XCircle } from 'lucide-react'
import { type RiskAlert, severityConfig, statusConfig } from './data'

interface AlertListProps {
  alerts: RiskAlert[]
  onProcess: (alert: RiskAlert) => void
  onIgnore: (id: string) => void
}

export default function AlertList({ alerts, onProcess, onIgnore }: AlertListProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">实时预警</h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={14} />
          导出
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {alerts.map((alert) => {
          const sev = severityConfig[alert.severity]
          const stat = statusConfig[alert.status]
          return (
            <div key={alert.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{alert.description}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${sev.color} bg-opacity-10`} style={{ backgroundColor: sev.dot === 'bg-danger' ? '#F53F3F10' : sev.dot === 'bg-warning' ? '#FF7D0010' : sev.dot === 'bg-yellow-500' ? '#EAB30810' : '#165DFF10' }}>
                    {sev.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{alert.user}</span>
                  {alert.amount !== '-' && <span>{alert.amount}</span>}
                  <span>{alert.time}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md font-medium flex-shrink-0 ${stat.className}`}>
                {stat.label}
              </span>
              {alert.status === 'pending' && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onProcess(alert)}
                    className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
                    title="处理"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => onIgnore(alert.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
                    title="忽略"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
