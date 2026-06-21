import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, IdCard, Baby, ArrowRight, Clock, Tag } from 'lucide-react'
import { useUserStore } from '@/store/user'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { HouseholdBiz, HouseholdBizType } from '../../shared/types'

const bizCards: { type: HouseholdBizType; title: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { type: 'settle', title: '落户申请', icon: Home, desc: '符合本市落户条件，可在线提交落户申请' },
  { type: 'residence', title: '居住证申领', icon: IdCard, desc: '居住满半年可申领居住证，享受市民待遇' },
  { type: 'newborn', title: '新生儿入户', icon: Baby, desc: '新生儿出生后可在线申报户口登记' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: '已提交', color: 'bg-blue-50 text-primary' },
  reviewing: { label: '审核中', color: 'bg-yellow-50 text-yellow-600' },
  material: { label: '补材料', color: 'bg-orange-50 text-orange-600' },
  approved: { label: '已通过', color: 'bg-green-50 text-green-600' },
  rejected: { label: '已驳回', color: 'bg-red-50 text-red-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
}

const typeLabels: Record<HouseholdBizType, string> = {
  settle: '落户',
  residence: '居住证',
  newborn: '新生儿',
}

export default function Household() {
  const [list, setList] = useState<HouseholdBiz[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)

  useEffect(() => {
    api.get('/household/list')
      .then((res) => setList(res.data?.data ?? res.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-dark">户籍业务</h1>
        <p className="text-sm text-text-muted mt-1">{user ? `${user.name}，您好` : '选择需要办理的业务'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bizCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={card.type}
              className={cn(
                'bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all animate-slideUp',
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-text-dark">{card.title}</h3>
              </div>
              <p className="text-sm text-text-muted mb-4">{card.desc}</p>
              <button
                onClick={() => navigate(`/household/apply/${card.type}`)}
                className="w-full h-10 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"
              >
                立即办理
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-dark mb-3">我的办理</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-shimmer bg-[length:200%_100%]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">暂无办理记录</div>
        ) : (
          <div className="space-y-3">
            {list.map((item) => {
              const st = statusMap[item.status] ?? statusMap.draft
              return (
                <Link
                  key={item.id}
                  to={`/household/progress/${item.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {typeLabels[item.type]}
                      </span>
                      <span className="font-medium text-text-dark truncate">{item.title}</span>
                    </div>
                    {item.submittedAt && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {item.submittedAt}
                      </div>
                    )}
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium shrink-0', st.color)}>
                    {st.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
