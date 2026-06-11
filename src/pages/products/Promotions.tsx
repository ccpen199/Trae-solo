import { Tag, Plus, Calendar, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { promotions } from '@/data/mockData'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: '进行中', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} /> },
  upcoming: { label: '即将开始', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> },
  ended: { label: '已结束', color: 'bg-gray-100 text-gray-500', icon: <XCircle size={12} /> },
}

const typeColors: Record<string, string> = {
  '满减': 'bg-blue-50 text-blue-700',
  '折扣': 'bg-purple-50 text-purple-700',
  '赠品': 'bg-amber-50 text-amber-700',
}

export default function Promotions() {
  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="促销活动" subtitle="促销规则引擎与活动管理" actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
          <Plus size={16} />
          创建活动
        </button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promo, i) => {
          const status = statusConfig[promo.status]
          const typeColor = typeColors[promo.type] || 'bg-gray-50 text-gray-700'
          return (
            <div
              key={promo.id}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Tag size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{promo.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor}`}>{promo.type}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-600">{promo.rule}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={14} />
                    <span>{promo.startDate} ~ {promo.endDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">参与产品</span>
                    <span className="text-gray-700 font-medium">{promo.productCount}个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">参与人次</span>
                    <span className="text-gray-700 font-medium">
                      {promo.participationCount > 0 ? `${promo.participationCount}人` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Users size={12} />
                  <span>活动详情</span>
                </div>
                <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
