import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { Users, MapPin, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const strategies = [
  {
    key: '人群包' as const,
    name: '人群包投放',
    description: '基于标签人群包精准投放，适用于定向补贴和专项惠民',
    icon: Users,
    accent: 'text-blue-600 bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    key: '地理围栏' as const,
    name: '地理围栏触发',
    description: '进入指定地理区域自动触发发放，适用于商圈促销和区域活动',
    icon: MapPin,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    key: '满减触发' as const,
    name: '消费满减自动发放',
    description: '消费达到指定金额自动触发，适用于促消费和场景化优惠',
    icon: ShoppingBag,
    accent: 'text-orange-600 bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100 text-orange-600',
  },
]

export default function StrategyConfig() {
  const { couponActivities } = useStore()

  return (
    <div>
      <PageHeader title="策略配置" description="管理券发放策略类型及关联活动" />

      <div className="space-y-6">
        {strategies.map((s) => {
          const activities = couponActivities.filter((a) => a.strategy === s.key)
          return (
            <Card key={s.key} className={cn('border', s.accent.split(' ').find(c => c.startsWith('border-')) || 'border-border')}>
              <div className="flex items-start gap-4 mb-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', s.iconBg)}>
                  <s.icon size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">{s.name}</h3>
                  <p className="text-sm text-[#6B7A99] mt-0.5">{s.description}</p>
                </div>
              </div>

              {activities.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg/30">
                      <th className="text-left px-3 py-2 font-medium text-[#6B7A99]">活动名称</th>
                      <th className="text-left px-3 py-2 font-medium text-[#6B7A99]">类型</th>
                      <th className="text-right px-3 py-2 font-medium text-[#6B7A99]">面额</th>
                      <th className="text-center px-3 py-2 font-medium text-[#6B7A99]">状态</th>
                      <th className="text-right px-3 py-2 font-medium text-[#6B7A99]">已用/总量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium text-primary">{a.name}</td>
                        <td className="px-3 py-2 text-[#6B7A99]">{a.type}</td>
                        <td className="px-3 py-2 text-right">¥{a.faceValue}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                            a.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                            a.status === 'paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            a.status === 'expired' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          )}>
                            {{ active: '进行中', paused: '已暂停', expired: '已过期', draft: '草稿' }[a.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-[#6B7A99]">
                          {a.usedCount.toLocaleString()} / {a.totalCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[#6B7A99] py-3">暂无使用此策略的活动</p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
