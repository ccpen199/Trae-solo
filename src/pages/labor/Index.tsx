import { useNavigate } from 'react-router-dom'
import { FileSignature, AlertTriangle, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { salaryReports } from '@/mocks/labor'
import { cn } from '@/lib/utils'

const entries = [
  { label: '劳动合同签署', icon: FileSignature, color: 'bg-primary-500', hoverColor: 'hover:bg-primary-600', path: '/labor/contract' },
  { label: '欠薪线索直报', icon: AlertTriangle, color: 'bg-accent-500', hoverColor: 'hover:bg-accent-600', path: '/labor/report' },
  { label: '法律咨询', icon: BookOpen, color: 'bg-green-500', hoverColor: 'hover:bg-green-600', path: '' },
]

const statusBadge: Record<string, string> = {
  submitted: 'gov-badge-info',
  accepted: 'gov-badge-info',
  investigating: 'gov-badge-warning',
  processing: 'gov-badge-warning',
  resolved: 'gov-badge-success',
  closed: 'gov-badge-success',
}

export default function LaborIndex() {
  const navigate = useNavigate()
  const [showHotline, setShowHotline] = useState(false)

  const handleEntryClick = (entry: typeof entries[number]) => {
    if (entry.path) {
      navigate(entry.path)
    } else {
      setShowHotline(true)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="gov-section-title">劳动维权服务</h2>
        <p className="text-gov-muted text-sm mt-2 pl-4">维护劳动者合法权益，共建和谐劳动关系</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {entries.map((entry) => (
          <button
            key={entry.label}
            onClick={() => handleEntryClick(entry)}
            className="gov-card flex flex-col items-center py-8 px-4 cursor-pointer group"
          >
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg',
              entry.color,
              entry.hoverColor
            )}>
              <entry.icon className="w-9 h-9" />
            </div>
            <span className="mt-4 text-sm font-medium text-gov-text">{entry.label}</span>
          </button>
        ))}
      </div>

      <div>
        <h3 className="gov-section-title mb-4">我的举报记录</h3>
        <div className="space-y-3">
          {salaryReports.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate(`/labor/track/${report.id}`)}
              className="gov-card w-full p-4 flex items-center justify-between cursor-pointer text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gov-text truncate">{report.companyName}</p>
                <p className="text-sm text-gov-muted mt-1">
                  欠薪金额：<span className="text-accent-500 font-medium">¥{report.amount.toLocaleString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                <span className={cn('text-xs', statusBadge[report.status])}>
                  {report.statusName}
                </span>
                <span className="text-xs text-gov-muted">{report.createTime.split(' ')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showHotline && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowHotline(false)}>
          <div className="bg-white rounded-xl p-8 shadow-elevated max-w-sm w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gov-text mb-2">法律咨询热线</h3>
              <p className="text-3xl font-bold text-primary-500 mb-2">12333</p>
              <p className="text-sm text-gov-muted mb-6">全国人力资源和社会保障服务热线</p>
              <button onClick={() => setShowHotline(false)} className="gov-btn-primary w-full">
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
