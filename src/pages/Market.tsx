import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import FilterPanel from '@/components/market/FilterPanel'
import MarketCard from '@/components/market/MarketCard'
import { useStore } from '@/store'

const tabs = [
  { key: 'procurement' as const, label: '采购找货', color: 'border-l-blue-500' },
  { key: 'processing' as const, label: '加工接单', color: 'border-l-amber-400' },
  { key: 'accessory' as const, label: '辅料供应', color: 'border-l-teal-500' },
]

type TabKey = typeof tabs[number]['key']

interface FilterState {
  location: string
  crafts: string[]
  quantityRange: [number, number]
  deadlineRange: string
}

const PAGE_SIZE = 6

export default function Market() {
  const [activeTab, setActiveTab] = useState<TabKey>('procurement')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    crafts: [],
    quantityRange: [0, 0],
    deadlineRange: '',
  })

  const procurements = useStore((s) => s.procurements)
  const processingOrders = useStore((s) => s.processingOrders)
  const accessories = useStore((s) => s.accessories)

  const items = activeTab === 'procurement'
    ? procurements
    : activeTab === 'processing'
    ? processingOrders
    : accessories

  const filtered = items.filter((item) => {
    if (filters.location && item.location !== filters.location) return false
    if (filters.crafts.length > 0 && 'craftType' in item) {
      const itemCrafts = (item as { craftType: string[] }).craftType
      if (itemCrafts && !filters.crafts.some((c) => itemCrafts.includes(c))) return false
    }
    if (filters.quantityRange[0] && 'quantity' in item) {
      if ((item as { quantity: number }).quantity < filters.quantityRange[0]) return false
    }
    if (filters.quantityRange[1] && 'quantity' in item) {
      if ((item as { quantity: number }).quantity > filters.quantityRange[1]) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeColor = tabs.find((t) => t.key === activeTab)?.color || ''

  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setPage(1) }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-navy-700 text-white shadow-md' : 'bg-white text-navy-500 hover:bg-navy-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            {paged.map((item) => (
              <MarketCard key={item.id} item={item} borderColor={activeColor} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md bg-white border border-navy-200 text-navy-400 disabled:opacity-30 hover:border-navy-300"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-md text-sm ${
                    page === i + 1 ? 'bg-navy-700 text-white' : 'bg-white text-navy-500 border border-navy-200 hover:border-navy-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md bg-white border border-navy-200 text-navy-400 disabled:opacity-30 hover:border-navy-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
