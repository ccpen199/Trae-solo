import { useNavigate } from 'react-router-dom'
import { Hospital, Pill, MapPin, ChevronRight } from 'lucide-react'

const institutions = [
  {
    type: 'hospital',
    title: '定点医院查询',
    desc: '附近 86 家',
    hot: '热门：内科、外科、妇产科',
    icon: Hospital,
    gradient: 'from-blue-500 to-cyan-500',
    path: '/medical/institutions',
  },
  {
    type: 'pharmacy',
    title: '定点药店查询',
    desc: '附近 124 家',
    hot: '热门：慢病药品、医保结算',
    icon: Pill,
    gradient: 'from-green-500 to-emerald-500',
    path: '/medical/institutions',
  },
]

export default function MedicalSection() {
  const navigate = useNavigate()

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-xl font-semibold text-gray-900">定点医药机构服务</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {institutions.map((item) => (
          <button
            key={item.type}
            onClick={() => navigate(item.path)}
            className="bg-white border border-gray-100 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-lg">{item.title}</div>
                <div className="flex items-center gap-1 text-sm text-primary mt-1">
                  <MapPin size={14} />
                  <span>{item.desc}</span>
                </div>
                <div className="text-xs text-gray-400 mt-2 truncate">{item.hot}</div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
