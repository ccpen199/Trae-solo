import { useStore } from '@/store'
import MetricCard from '@/components/MetricCard'
import Card from '@/components/Card'
import { Store, ScanLine, Banknote, TrendingUp, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const quickActions = [
  { label: '核销操作', icon: ScanLine, route: '/merchant/verify', color: 'from-blue-600 to-blue-400' },
  { label: '券活动管理', icon: Store, route: '/merchant/coupons', color: 'from-emerald-600 to-emerald-400' },
  { label: '核销对账', icon: Banknote, route: '/merchant/reconciliation', color: 'from-amber-600 to-amber-400' },
  { label: '核销率预警', icon: TrendingUp, route: '/merchant/alert', color: 'from-rose-600 to-rose-400' },
]

export default function MerchantOverview() {
  const { merchants } = useStore()
  const navigate = useNavigate()
  const merchant = merchants[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-primary">{merchant.name}</h1>
        <p className="text-sm text-[#6B7A99] mt-0.5">{merchant.category} · {merchant.district}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="核销笔数"
          value={merchant.verifyCount}
          suffix="笔"
          icon={<ScanLine className="w-5 h-5" />}
          gradient="from-blue-600 to-blue-400"
        />
        <MetricCard
          label="核销金额"
          value={`¥${merchant.verifyAmount.toLocaleString()}`}
          suffix="元"
          icon={<Banknote className="w-5 h-5" />}
          gradient="from-emerald-600 to-emerald-400"
        />
        <MetricCard
          label="核销率"
          value={(merchant.verifyRate * 100).toFixed(0)}
          suffix="%"
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="from-amber-600 to-amber-400"
        />
        <MetricCard
          label="参与活动数"
          value={4}
          suffix="个"
          icon={<Store className="w-5 h-5" />}
          gradient="from-indigo-600 to-indigo-400"
        />
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <div key={action.label} onClick={() => navigate(action.route)}>
              <Card className="cursor-pointer group hover:shadow-md transition-shadow" padding={false}>
                <div className="p-5 flex flex-col items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
