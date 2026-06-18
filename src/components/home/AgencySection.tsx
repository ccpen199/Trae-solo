import { useNavigate } from 'react-router-dom'
import { Building, FileText, Clock, ChevronRight } from 'lucide-react'

const agencies = [
  {
    level: '省级经办',
    name: '省社会保险事业管理中心',
    businessCount: 128,
    processingCount: 35,
  },
  {
    level: '市级经办',
    name: '杭州市社会保险管理服务局',
    businessCount: 86,
    processingCount: 22,
  },
  {
    level: '县级经办',
    name: '西湖区社会保险经办机构',
    businessCount: 42,
    processingCount: 8,
  },
]

export default function AgencySection() {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-lg font-semibold text-gray-900">经办机构入口</h3>
      </div>
      <div className="space-y-3">
        {agencies.map((agency) => (
          <button
            key={agency.level}
            onClick={() => navigate('/admin')}
            className="w-full text-left p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{agency.level}</div>
                <div className="text-xs text-gray-500 truncate">{agency.name}</div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex items-center gap-4 mt-3 pl-13">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText size={12} />
                <span>办理业务 {agency.businessCount}项</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-warning">
                <Clock size={12} />
                <span>在办 {agency.processingCount}件</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
