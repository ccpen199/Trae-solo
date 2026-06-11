import { useNavigate } from 'react-router-dom'
import { GraduationCap, Award, Star, ChevronRight } from 'lucide-react'
import { declarationList } from '@/mocks/talent'
import { useAppStore } from '@/store'

const statusColorMap: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'gov-badge-info',
  initial_review: 'gov-badge-warning',
  re_review: 'gov-badge-warning',
  expert_review: 'gov-badge-info',
  public_notice: 'gov-badge-success',
  issued: 'gov-badge-success',
}

const entryCards = [
  { label: '职称申报', icon: GraduationCap, path: '/talent/declare', gradient: 'from-blue-500 to-purple-500' },
  { label: '技能鉴定', icon: Award, path: '/talent/declare', gradient: 'from-green-500 to-teal-500' },
  { label: '人才认定', icon: Star, path: '/talent/declare', gradient: 'from-orange-500 to-red-500' },
]

export default function TalentIndex() {
  const navigate = useNavigate()
  const { currentUser } = useAppStore()

  return (
    <div className="min-h-screen bg-gov-bg p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="gov-section-title">人才服务</h1>
          <p className="mt-2 text-gov-muted text-sm">职称申报 · 技能鉴定 · 人才认定一站式服务</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {entryCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="gov-card p-6 flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-gov-text font-medium text-base">{card.label}</span>
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="gov-section-title">我的申报</h2>
          </div>

          <div className="space-y-3">
            {declarationList.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/talent/progress/${item.id}`)}
                className="gov-card w-full p-4 flex items-center justify-between cursor-pointer text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded font-medium">{item.category}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColorMap[item.status] || 'gov-badge-info'}`}>
                      {item.statusName}
                    </span>
                  </div>
                  <p className="text-gov-text font-medium truncate">
                    {item.currentTitle} → {item.targetTitle}
                  </p>
                  <p className="text-gov-muted text-xs mt-1">{item.submitTime}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gov-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/talent/review/1')}
              className="gov-btn-accent flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              专家评审入口
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
