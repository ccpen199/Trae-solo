import { Link } from 'react-router-dom'
import { Building } from '@/types'
import { getBuildingCoverImage } from '@/utils/visuals'

interface BuildingCardProps {
  building: Building
  matchHighlights?: {
    name: boolean
    district: boolean
    developer: boolean
  }
}

const statusMap: Record<string, { label: string; className: string }> = {
  selling: { label: '在售', className: 'bg-emerald-500/90 text-white' },
  soon: { label: '待开', className: 'bg-amber-500/90 text-white' },
  sold: { label: '售罄', className: 'bg-gray-500/90 text-white' },
  pending: { label: '待定', className: 'bg-gray-500/90 text-white' },
}

export default function BuildingCard({ building, matchHighlights }: BuildingCardProps) {
  const tags = Array.isArray(building.tags) ? building.tags : (typeof building.tags === 'string' ? JSON.parse(building.tags || '[]') : [])
  const priceChange = building.priceHistory && building.priceHistory.length >= 2
    ? ((building.priceHistory[building.priceHistory.length - 1].avgPrice - building.priceHistory[building.priceHistory.length - 2].avgPrice) / building.priceHistory[building.priceHistory.length - 2].avgPrice * 100).toFixed(1)
    : null

  const statusInfo = statusMap[building.status] || statusMap.pending

  return (
    <Link to={`/building/${building.id}`} className="card overflow-hidden group block">
      <div className="relative h-48 overflow-hidden bg-brand-50">
        <img
          src={getBuildingCoverImage(building)}
          alt={building.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-lg font-semibold text-white truncate">{building.name}</h3>
          <p className="text-white/80 text-xs mt-0.5">{building.district} · {building.address}</p>
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className={`badge text-[10px] ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          {matchHighlights && (
            <div className="flex flex-col items-end gap-1">
              {matchHighlights.name && (
                <span className="badge text-[10px] bg-emerald-500 text-white">名称匹配</span>
              )}
              {matchHighlights.district && (
                <span className="badge text-[10px] bg-blue-500 text-white">区域匹配</span>
              )}
              {matchHighlights.developer && (
                <span className="badge text-[10px] bg-yellow-500 text-white">开发商匹配</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-gold font-bold text-2xl">{(building.avgPrice / 10000).toFixed(0)}</span>
            <span className="text-charcoal/50 text-sm ml-1">万/m²</span>
          </div>
          {priceChange && (
            <span className={`text-xs font-medium ${Number(priceChange) >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {Number(priceChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(priceChange))}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="badge-info text-[10px]">{tag.trim()}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-charcoal/60">
          <div>建面 {building.areaMin}-{building.areaMax}m²</div>
          <div>可售 {building.availableUnits}套</div>
          <div>交付 {building.deliveryDate || '待定'}</div>
          <div>均价 {(building.minPrice / 10000).toFixed(0)}-{(building.maxPrice / 10000).toFixed(0)}万</div>
        </div>
      </div>
    </Link>
  )
}
