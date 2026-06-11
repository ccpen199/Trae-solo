import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { Ticket, ScanLine, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MerchantCoupons() {
  const { couponActivities } = useStore()
  const activeCoupons = couponActivities.filter((c) => c.status === 'active')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="券活动管理"
        description="查看本商户参与的活动券信息"
        actions={
          <span className="inline-flex items-center gap-1.5 text-sm text-[#6B7A99]">
            <Ticket className="w-4 h-4" /> 活跃券 {activeCoupons.length} 个
          </span>
        }
      />

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="px-5 py-3 font-medium text-left">券名称</th>
                <th className="px-5 py-3 font-medium text-left">类型</th>
                <th className="px-5 py-3 font-medium text-left">面额</th>
                <th className="px-5 py-3 font-medium text-left">剩余库存</th>
                <th className="px-5 py-3 font-medium text-left">状态</th>
                <th className="px-5 py-3 font-medium text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {activeCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{coupon.name}</td>
                  <td className="px-5 py-3 text-[#6B7A99]">{coupon.type}</td>
                  <td className="px-5 py-3 font-medium">¥{coupon.faceValue}</td>
                  <td className="px-5 py-3">
                    <span className={cn('font-medium', coupon.totalCount - coupon.usedCount < 1000 ? 'text-red-500' : 'text-gray-800')}>
                      {(coupon.totalCount - coupon.usedCount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={coupon.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <ScanLine className="w-3 h-3" /> 核销
                      </button>
                      <button className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                        <Eye className="w-3 h-3" /> 查看
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
