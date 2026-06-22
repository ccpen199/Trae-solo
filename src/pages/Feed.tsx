import { useEffect, useState } from 'react'
import { Bell, Building2 } from 'lucide-react'
import type { Building, FeedItem } from '@/types'
import { api } from '@/utils/api'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [activeBuilding, setActiveBuilding] = useState<string>('all')

  useEffect(() => {
    api.getFeed().then(res => setItems(res.data || [])).catch(() => {})
    api.getBuildings().then(res => setBuildings(res.data || [])).catch(() => {})
  }, [])

  const buildingNameMap = Object.fromEntries(buildings.map(b => [b.id, b.name]))

  const uniqueBuildingIds = ['all', ...Array.from(new Set(items.map(i => i.buildingId)))]
  const filtered = activeBuilding === 'all'
    ? items
    : items.filter(i => i.buildingId === activeBuilding)

  const handleSubscribe = async (buildingId: string) => {
    try {
      await api.createSubscription({ buildingId, type: 'feed' })
    } catch {}
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-brand">探盘动态</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {uniqueBuildingIds.map(id => (
            <button
              key={id}
              onClick={() => setActiveBuilding(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeBuilding === id
                  ? 'bg-brand text-white'
                  : 'bg-white text-charcoal/60 hover:bg-brand-50'
              }`}
            >
              {id === 'all' ? '全部' : (buildingNameMap[id] || id)}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {filtered.map(item => (
            <article
              key={item.id}
              className="rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:shadow-md overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    item.type === 'article'
                      ? 'bg-brand-50 text-brand'
                      : 'bg-gold-100 text-gold-dark'
                  }`}>
                    {item.type === 'article' ? '图文' : '动态'}
                  </span>
                  {item.buildingId && (
                    <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-dark">
                      {buildingNameMap[item.buildingId] || item.buildingId}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-charcoal line-clamp-2">{item.title}</h3>
                <p className="mt-2 text-sm text-charcoal/50 line-clamp-3">{item.summary}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {item.source?.charAt(0) || '平'}
                    </div>
                    <span className="text-sm font-medium text-charcoal/70">{item.source}</span>
                  </div>
                  <span className="text-xs text-charcoal/40">{timeAgo(item.createdAt)}</span>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    onClick={() => handleSubscribe(item.buildingId)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-charcoal/40 hover:text-brand transition"
                  >
                    <Bell className="h-4 w-4" />
                    订阅
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Building2 size={40} className="mx-auto text-brand/20 mb-3" />
              <p className="text-charcoal/40">暂无动态</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="rounded-xl border border-brand-100 bg-white px-8 py-3 text-sm font-semibold text-brand transition hover:bg-brand-50">
            加载更多
          </button>
        </div>
      </div>
    </main>
  )
}
