import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import type { CaseItem } from '@/lib/types'
import { useAppStore } from '@/hooks/useAppStore'
import { formatPrice, formatArea } from '@/lib/utils'

const FALLBACK_IMAGE =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+interior+design+living+room&image_size=landscape_4_3'

export default function CaseCard({ item }: { item: CaseItem }) {
  const { toggleFavorite, isFavorite } = useAppStore()
  const liked = isFavorite(item.id)

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
            toggleFavorite(item.id)
          }}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <Heart
            size={18}
            className={liked ? 'fill-red-500 text-red-500' : 'text-white'}
          />
        </button>
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
              ¥{formatPrice(item.budgetMin)}-{formatPrice(item.budgetMax)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
