import { useStore } from '@/store'
import Card from '@/components/Card'
import { Sparkles, Ticket, Clock, MapPin, ChevronRight, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeColor: Record<string, string> = {
  '政务补贴': 'bg-blue-50 text-blue-700',
  '民生优惠': 'bg-green-50 text-green-700',
  '商业促销': 'bg-amber-50 text-amber-700',
}

export default function CitizenHome() {
  const { citizenCoupons, couponActivities } = useStore()
  const unusedCount = citizenCoupons.filter((c) => c.status === 'unused').length
  const activeActivities = couponActivities.filter((a) => a.status === 'active')
  const recommended = activeActivities.slice(0, 3)
  const hotActivities = activeActivities
    .slice()
    .sort((a, b) => b.usedCount / b.totalCount - a.usedCount / a.totalCount)
    .slice(0, 3)

  return (
    <div className="rounded-t-2xl bg-bg min-h-screen -mt-2 p-4">
      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B7A99]">你好，沈阳市民</p>
            <p className="text-lg font-bold text-primary mt-1">
              你有 <span className="text-accent">{unusedCount}</span> 张券待使用
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Ticket className="text-accent" size={24} />
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={16} className="text-accent" />
          <h2 className="text-sm font-bold text-primary">智能推荐</h2>
        </div>
        <div className="space-y-3">
          {recommended.map((activity) => (
            <Card key={activity.id} className="!p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', typeColor[activity.type])}>
                      {activity.type}
                    </span>
                    <span className="text-xs text-[#6B7A99]">{activity.strategy}</span>
                  </div>
                  <p className="text-sm font-medium text-primary leading-snug">{activity.name}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7A99]">
                    <span className="flex items-center gap-0.5"><Clock size={10} /> {activity.endDate}到期</span>
                    <span className="flex items-center gap-0.5"><MapPin size={10} /> {activity.strategy === '地理围栏' ? '限定区域' : '全市通用'}</span>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="text-2xl font-bold text-accent">¥{activity.faceValue}</p>
                  <button className="mt-1 px-3 py-1 bg-accent text-white text-xs rounded-full font-medium">
                    立即领取
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Flame size={16} className="text-orange-500" />
          <h2 className="text-sm font-bold text-primary">热门活动</h2>
          <ChevronRight size={14} className="text-[#6B7A99] ml-auto" />
        </div>
        <div className="space-y-3">
          {hotActivities.map((activity) => {
            const progress = Math.round((activity.usedCount / activity.totalCount) * 100)
            return (
              <Card key={activity.id} className="!p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-primary">{activity.name}</p>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', typeColor[activity.type])}>
                    {activity.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#6B7A99] mb-1.5">
                  <span>已领用 {progress}%</span>
                  <span>剩余 {(activity.totalCount - activity.usedCount).toLocaleString()} 张</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
