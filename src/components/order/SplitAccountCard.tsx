import { useState } from 'react'
import { ChevronDown, ChevronUp, Building2, Palette, Factory, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import PriceTag from '@/components/common/PriceTag'
import { OrderSplitDetails } from '@/types'

interface SplitAccountCardProps {
  splitDetails: OrderSplitDetails
  totalAmount: number
  className?: string
}

interface SplitItem {
  key: keyof OrderSplitDetails
  label: string
  icon: typeof Building2
  color: string
  bgColor: string
}

const splitItems: SplitItem[] = [
  { key: 'platformFee', label: '平台服务费', icon: Building2, color: 'text-brand-600', bgColor: 'bg-brand-500' },
  { key: 'designerRoyalty', label: '设计师版税', icon: Palette, color: 'text-gold-600', bgColor: 'bg-gold-500' },
  { key: 'factoryCost', label: '工厂成本', icon: Factory, color: 'text-forest-600', bgColor: 'bg-forest-500' },
]

export default function SplitAccountCard({ splitDetails, totalAmount, className }: SplitAccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalSplit = splitItems.reduce((sum, item) => sum + splitDetails[item.key], 0)

  const getPercentage = (value: number) => {
    if (totalAmount === 0) return 0
    return (value / totalAmount) * 100
  }

  return (
    <div className={cn('rounded-lg bg-white shadow-soft overflow-hidden', className)}>
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-paper-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
            <Receipt className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-paper-900">
              金额明细
            </h3>
            <p className="text-xs text-paper-500">
              共 {splitItems.length} 项分账
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PriceTag price={totalAmount} size="md" />
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-paper-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-paper-400" />
          )}
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="border-t border-paper-100 p-4">
          <div className="relative mb-6 h-4 w-full overflow-hidden rounded-full bg-paper-100">
            <div className="absolute inset-0 flex">
              {splitItems.map((item, index) => {
                const percentage = getPercentage(splitDetails[item.key])
                if (percentage === 0) return null

                return (
                  <div
                    key={item.key}
                    className={cn('h-full transition-all duration-500', item.bgColor)}
                    style={{
                      width: `${percentage}%`,
                      marginLeft: index === 0 ? 0 : '0px',
                    }}
                  />
                )
              })}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 pointer-events-none" />
          </div>

          <div className="space-y-3">
            {splitItems.map(item => {
              const value = splitDetails[item.key]
              const percentage = getPercentage(value)
              const Icon = item.icon

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg p-3 bg-paper-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', item.color, 'bg-opacity-10')}>
                      <Icon className={cn('h-4 w-4', item.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-paper-800">{item.label}</p>
                      <p className="text-xs text-paper-500">
                        占比 {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <PriceTag price={value} size="sm" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-dashed border-paper-200 pt-4">
            <span className="text-sm font-medium text-paper-700">合计</span>
            <PriceTag price={totalSplit} size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
