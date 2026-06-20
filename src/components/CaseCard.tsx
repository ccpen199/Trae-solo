import { Link, useNavigate } from 'react-router-dom'
import { Heart, Layout, Box, List, Clock } from 'lucide-react'
import type { CaseItem } from '@/lib/types'
import { useAppStore } from '@/hooks/useAppStore'
import { formatPrice, formatArea } from '@/lib/utils'
import { cn } from '@/lib/utils'

const FALLBACK_IMAGE =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+interior+design+living+room&image_size=landscape_4_3'

const FEATURE_ICONS: Array<{ key: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; label: string; tab: string; vrParam?: boolean }> = [
  { key: 'floor', icon: Layout, label: '平面图', tab: '平面图' },
  { key: '3d', icon: Box, label: '3D全景', tab: '3D全景', vrParam: true },
  { key: 'materials', icon: List, label: '材料清单', tab: '材料清单' },
  { key: 'nodes', icon: Clock, label: '施工节点', tab: '施工节点' },
]

export default function CaseCard({ item }: { item: CaseItem }) {
  const { toggleFavorite, isFavorite } = useAppStore()
  const navigate = useNavigate()
  const liked = isFavorite(item.id)

  const features = [
    { key: 'floor', enabled: !!item.floorPlan },
    { key: '3d', enabled: true },
    { key: 'materials', enabled: !!(item.materials && item.materials.length > 0) },
    { key: 'nodes', enabled: !!(item.constructionNodes && item.constructionNodes.length > 0) },
  ]

  const handleFeatureClick = (e: React.MouseEvent, feature: typeof FEATURE_ICONS[number], enabled: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (!enabled) return
    const params = new URLSearchParams()
    if (feature.vrParam) params.set('vr', '1')
    params.set('tab', feature.tab)
    navigate(`/cases/${item.id}?${params.toString()}`)
  }

  return (
    <Link
      to={`/cases/${item.id}`}
      className="card-hover group block overflow-hidden rounded-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.coverImage || FALLBACK_IMAGE}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="hero-gradient absolute inset-0" />
        <button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(item.id, 'case')
          }}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <Heart
            size={18}
            className={liked ? 'fill-red-500 text-red-500' : 'text-white'}
          />
        </button>
        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
          {features.map((f) => {
            const Icon = FEATURE_ICONS.find((i) => i.key === f.key)
            if (!Icon) return null
            return (
              <button
                key={f.key}
                onClick={(e) => handleFeatureClick(e, Icon, f.enabled)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-1 text-[10px] backdrop-blur-sm transition-colors',
                  f.enabled
                    ? 'bg-sand-400/90 text-white hover:bg-sand-500/90'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                )}
                title={`${Icon.label}${f.enabled ? '（点击查看）' : '（暂无）'}`}
                disabled={!f.enabled}
              >
                <Icon.icon size={10} />
                <span className="hidden sm:inline">{Icon.label}</span>
              </button>
            )
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{item.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-sand-400/80 px-2.5 py-0.5 text-xs text-white">
              {item.style}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white">
              {item.houseType}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-white/80">
            <span>{formatArea(item.area)}</span>
            <span>
              ¥{formatPrice(item.budgetMin)}-{formatPrice(item.budgetMax)}万
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
