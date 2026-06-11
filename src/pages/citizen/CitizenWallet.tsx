import { useState } from 'react'
import { useStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'
import { Wallet, QrCode, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { key: 'unused' as const, label: '待使用', icon: Wallet },
  { key: 'used' as const, label: '已使用', icon: CheckCircle },
  { key: 'expired' as const, label: '已过期', icon: Clock },
]

const typeColor: Record<string, string> = {
  '政务补贴': 'bg-blue-50 text-blue-700',
  '民生优惠': 'bg-green-50 text-green-700',
  '商业促销': 'bg-amber-50 text-amber-700',
}

export default function CitizenWallet() {
  const { citizenCoupons } = useStore()
  const [activeTab, setActiveTab] = useState<'unused' | 'used' | 'expired'>('unused')

  const filtered = citizenCoupons.filter((c) => c.status === activeTab)
  const counts = {
    unused: citizenCoupons.filter((c) => c.status === 'unused').length,
    used: citizenCoupons.filter((c) => c.status === 'used').length,
    expired: citizenCoupons.filter((c) => c.status === 'expired').length,
  }

  return (
    <div className="rounded-t-2xl bg-bg min-h-screen -mt-2 p-4">
      <div className="flex bg-white rounded-xl border border-border p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-accent text-white'
                : 'text-[#6B7A99]'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className={cn(
              'ml-0.5 px-1.5 py-0.5 rounded-full text-xs',
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#6B7A99]'
            )}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((coupon) => (
          <div
            key={coupon.id}
            className={cn(
              'bg-white rounded-xl border border-border p-4',
              coupon.status === 'expired' && 'opacity-50'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', typeColor[coupon.type])}>
                    {coupon.type}
                  </span>
                  <StatusBadge status={coupon.status} />
                </div>
                <p className="text-sm font-medium text-primary">{coupon.activityName}</p>
                <p className="text-xs text-[#6B7A99] mt-1">有效期至 {coupon.expiredAt}</p>
                {coupon.status === 'used' && coupon.merchantName && (
                  <p className="text-xs text-[#6B7A99] mt-0.5">
                    核销商户：{coupon.merchantName}
                    {coupon.usedAt && ` · ${coupon.usedAt.slice(0, 16)}`}
                  </p>
                )}
              </div>
              <div className="text-right ml-3">
                <p className="text-xl font-bold text-accent">¥{coupon.faceValue}</p>
                {coupon.status === 'unused' && (
                  <button className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-xs rounded-full font-medium">
                    <QrCode size={12} />
                    扫码核销
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-[#6B7A99]">
          <Wallet size={32} className="mx-auto mb-2 opacity-30" />
          暂无{tabs.find((t) => t.key === activeTab)?.label}优惠券
        </div>
      )}
    </div>
  )
}
