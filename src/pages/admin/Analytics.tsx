import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useScenicStore } from '@/store/useScenicStore'
import OverviewTab from './analytics/OverviewTab'
import HeatmapTab from './analytics/HeatmapTab'
import BehaviorTab from './analytics/BehaviorTab'

const tabs = [
  { key: 'overview', label: '数据概览' },
  { key: 'heatmap', label: '热力图' },
  { key: 'behavior', label: '行为分析' },
] as const

type TabKey = typeof tabs[number]['key']

const loaded: Record<TabKey, boolean> = { overview: false, heatmap: false, behavior: false }

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const { loadOverview, loadHeatmap, loadBehaviors, selectedScenicId } = useAnalyticsStore()
  const { loadScenicAreas } = useScenicStore()

  useEffect(() => {
    loadScenicAreas()
  }, [loadScenicAreas])

  useEffect(() => {
    if (!loaded.overview) {
      loadOverview(selectedScenicId ?? undefined)
      loaded.overview = true
    }
  }, [loadOverview, selectedScenicId])

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key)
    if (!loaded[key]) {
      switch (key) {
        case 'heatmap':
          if (selectedScenicId) loadHeatmap(selectedScenicId)
          loaded.heatmap = true
          break
        case 'behavior':
          loadBehaviors(selectedScenicId ?? undefined)
          loaded.behavior = true
          break
      }
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-indigo-400" />
        <h1 className="text-2xl font-semibold text-gray-100">数据分析中心</h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-white/5 bg-white/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition',
              activeTab === t.key
                ? 'bg-indigo-900 text-gray-100 shadow'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'heatmap' && <HeatmapTab />}
        {activeTab === 'behavior' && <BehaviorTab />}
      </div>
    </div>
  )
}
