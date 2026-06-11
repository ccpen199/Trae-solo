import { useState } from 'react'
import ChinaMap, { RegionPanel, CapacityTrend } from '@/components/map/MapComponents'
import { useStore } from '@/store'

export default function IndustryMap() {
  const regionData = useStore((s) => s.regionData)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const selectedData = selectedRegion ? regionData.find((r) => r.region === selectedRegion) || null : null

  return (
    <div className="animate-fade-in">
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-serif text-lg font-semibold text-navy-700 mb-4">产业地图</h2>
            <ChinaMap regions={regionData} selected={selectedRegion} onSelect={setSelectedRegion} />
            <div className="flex items-center gap-4 mt-3 text-xs text-navy-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />利用率 ≥85%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-500" />利用率 80-85%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-navy-400" />利用率 75-80%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-navy-200" />利用率 &lt;75%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <CapacityTrend />
          </div>
        </div>
        <div className="w-72 shrink-0">
          <RegionPanel region={selectedData} />
        </div>
      </div>
    </div>
  )
}
