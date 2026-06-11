import { useState } from 'react'
import { useStore } from '@/store'
import Card from '@/components/Card'
import { Search, Filter, Ticket, MapPin, Users, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = ['全部', '政务补贴', '民生优惠', '商业促销'] as const
type Category = typeof categories[number]

const typeBorder: Record<string, string> = {
  '政务补贴': 'border-l-[#1B2A4A]',
  '民生优惠': 'border-l-[#2ECC71]',
  '商业促销': 'border-l-[#E8A838]',
}

const typeIcon: Record<string, typeof Ticket> = {
  '政务补贴': Users,
  '民生优惠': MapPin,
  '商业促销': ShoppingBag,
}

export default function CitizenExplore() {
  const { couponActivities } = useStore()
  const [activeCategory, setActiveCategory] = useState<Category>('全部')
  const [search, setSearch] = useState('')

  const activeActivities = couponActivities.filter((a) => a.status === 'active')
  const filtered = activeActivities.filter((a) => {
    const matchCategory = activeCategory === '全部' || a.type === activeCategory
    const matchSearch = a.name.includes(search)
    return matchCategory && matchSearch
  })

  return (
    <div className="rounded-t-2xl bg-bg min-h-screen -mt-2 p-4">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A99]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索优惠券活动..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50"
        />
        <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A99]" />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === cat
                ? 'bg-accent text-white'
                : 'bg-white text-[#6B7A99] border border-border'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((activity) => {
          const remaining = activity.totalCount - activity.usedCount
          const Icon = typeIcon[activity.type] || Ticket
          return (
            <Card key={activity.id} className={cn('!p-3 border-l-4', typeBorder[activity.type])}>
              <div className="flex items-center gap-1 mb-2">
                <Icon size={12} className="text-[#6B7A99]" />
                <span className="text-xs text-[#6B7A99]">{activity.type}</span>
              </div>
              <p className="text-2xl font-bold text-accent mb-1">¥{activity.faceValue}</p>
              <p className="text-xs font-medium text-primary leading-snug mb-1 line-clamp-2">{activity.name}</p>
              <span className="inline-block text-xs px-1.5 py-0.5 bg-gray-50 text-[#6B7A99] rounded mb-2">
                {activity.strategy}
              </span>
              <p className="text-xs text-[#6B7A99] mb-2">剩余 {remaining.toLocaleString()} 张</p>
              <button className="w-full py-1.5 bg-accent text-white text-xs rounded-lg font-medium">
                领取
              </button>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-[#6B7A99]">
          <Ticket size={32} className="mx-auto mb-2 opacity-30" />
          暂无符合条件的活动
        </div>
      )}
    </div>
  )
}
