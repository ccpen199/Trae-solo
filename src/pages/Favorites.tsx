import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CaseCard from '@/components/CaseCard'
import DesignerCard from '@/components/DesignerCard'
import { fetchApi } from '@/lib/api'
import { useAppStore } from '@/hooks/useAppStore'
import { cn } from '@/lib/utils'
import type { CaseItem, DesignerItem } from '@/lib/types'

const TABS = [
  { key: 'case', label: '案例收藏' },
  { key: 'designer', label: '设计师收藏' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function Favorites() {
  const { currentUserId } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('case')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [designers, setDesigners] = useState<DesignerItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchApi<CaseItem[]>(`/api/favorites?user_id=${currentUserId}`)
      .then((data) => setCases(Array.isArray(data) ? data : []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [currentUserId])

  useEffect(() => {
    setLoading(true)
    fetchApi<DesignerItem[]>(`/api/favorites?user_id=${currentUserId}&type=designer`)
      .then((data) => setDesigners(Array.isArray(data) ? data : []))
      .catch(() => setDesigners([]))
      .finally(() => setLoading(false))
  }, [currentUserId])

  const isEmpty = activeTab === 'case' ? cases.length === 0 : designers.length === 0

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <header className="border-b border-sand-200 bg-white/60">
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-sand-900">我的收藏</h1>
          <div className="mt-4 flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.key ? 'bg-sand-400 text-white' : 'bg-white text-sand-900/70 hover:bg-sand-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className={cn('grid gap-6', activeTab === 'case' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2')}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn('animate-pulse rounded-xl bg-sand-200', activeTab === 'case' ? 'aspect-[4/3]' : 'h-28')} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-sand-200/60">
              <Heart size={40} className="text-sand-300" />
            </div>
            <p className="font-display text-xl text-sand-900/40">
              {activeTab === 'case' ? '暂无收藏案例' : '暂无收藏设计师'}
            </p>
            <p className="mt-2 text-sm text-sand-900/30">浏览内容时点击❤️即可收藏</p>
          </div>
        ) : activeTab === 'case' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => <CaseCard key={c.id} item={c} />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {designers.map((d) => <DesignerCard key={d.id} designer={d} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
