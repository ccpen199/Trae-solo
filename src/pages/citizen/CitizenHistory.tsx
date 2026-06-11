import { useStore } from '@/store'
import { Clock, CheckCircle, MapPin } from 'lucide-react'

export default function CitizenHistory() {
  const { citizenCoupons } = useStore()
  const usedCoupons = citizenCoupons.filter((c) => c.status === 'used')
  const totalSaved = usedCoupons.reduce((sum, c) => sum + c.faceValue, 0)

  const grouped: Record<string, typeof usedCoupons> = {}
  usedCoupons.forEach((c) => {
    const date = c.usedAt?.slice(0, 7) || '未知'
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(c)
  })
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="rounded-t-2xl bg-bg min-h-screen -mt-2 p-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-accent">{usedCoupons.length}</p>
          <p className="text-xs text-[#6B7A99] mt-0.5">累计使用（张）</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-accent">¥{totalSaved}</p>
          <p className="text-xs text-[#6B7A99] mt-0.5">累计优惠（元）</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-5">
          {sortedMonths.map((month) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-2 relative">
                <div className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-white shadow z-10" />
                <span className="text-xs font-medium text-primary">{month}</span>
              </div>
              <div className="ml-5 space-y-2.5">
                {grouped[month].map((coupon) => (
                  <div key={coupon.id} className="bg-white rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">{coupon.activityName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7A99]">
                          <span className="flex items-center gap-0.5">
                            <MapPin size={10} />
                            {coupon.merchantName || '—'}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {coupon.usedAt?.slice(11, 16) || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-lg font-bold text-accent">-¥{coupon.faceValue}</p>
                        <span className="flex items-center gap-0.5 text-xs text-green-600 justify-end">
                          <CheckCircle size={10} />
                          已核销
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {usedCoupons.length === 0 && (
        <div className="text-center py-12 text-sm text-[#6B7A99]">
          <Clock size={32} className="mx-auto mb-2 opacity-30" />
          暂无消费记录
        </div>
      )}
    </div>
  )
}
