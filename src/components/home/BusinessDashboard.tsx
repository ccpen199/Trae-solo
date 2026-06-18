import { useNavigate } from 'react-router-dom'
import { User, MapPin, Calendar, Clock, FileText, Wallet } from 'lucide-react'
import { useStore } from '@/store'

const stats = [
  { label: '参保年限', value: '20年3个月', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
  { label: '待办事项', value: '2项', icon: Clock, color: 'text-danger', bg: 'bg-danger/10' },
  { label: '在办业务', value: '1项', icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
  { label: '本月待遇', value: '3200元', icon: Wallet, color: 'text-success', bg: 'bg-success/10' },
]

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const { user } = useStore()

  const displayUser = user || {
    name: '张三',
    identityType: '企业职工',
    insuredLocation: '浙江省杭州市',
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-xl font-semibold text-gray-900">个人业务看板</h2>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{displayUser.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {displayUser.identityType}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={14} />
                  {displayUser.insuredLocation}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate('/personal')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-sm text-gray-500">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
