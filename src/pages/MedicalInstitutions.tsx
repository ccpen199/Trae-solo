import { useState, useMemo } from 'react'
import { Map, List } from 'lucide-react'
import FilterPanel from '@/components/medical/FilterPanel'
import MapView from '@/components/medical/MapView'
import ListView from '@/components/medical/ListView'
import DetailModal from '@/components/medical/DetailModal'
import { type FilterState, defaultFilter, mockInstitutions, type Institution } from '@/components/medical/data'

export default function MedicalInstitutions() {
  const [filter, setFilter] = useState<FilterState>(defaultFilter)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null)

  const filtered = useMemo(() => {
    return mockInstitutions.filter((inst) => {
      if (filter.keyword && !inst.name.includes(filter.keyword)) return false
      if (filter.type !== 'all' && inst.type !== filter.type) return false
      if (filter.level !== 'all' && inst.level !== filter.level) return false
      if (filter.departments.length > 0 && !filter.departments.some((d) => inst.departments.includes(d)))
        return false
      if (filter.medicine && !inst.medicines.some((m) => m.includes(filter.medicine))) return false
      if (inst.distance > filter.distance) return false
      return true
    })
  }, [filter])

  return (
    <div className="flex gap-5 h-[calc(100vh-7rem)]">
      <FilterPanel
        filter={filter}
        onChange={setFilter}
        onReset={() => setFilter(defaultFilter)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">共找到 {filtered.length} 家机构</p>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-primary shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map size={16} />
              地图视图
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={16} />
              列表视图
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {viewMode === 'map' ? (
            <MapView institutions={filtered} onSelect={setSelectedInst} />
          ) : (
            <ListView institutions={filtered} onSelect={setSelectedInst} />
          )}
        </div>
      </div>

      {selectedInst && (
        <DetailModal institution={selectedInst} onClose={() => setSelectedInst(null)} />
      )}
    </div>
  )
}
