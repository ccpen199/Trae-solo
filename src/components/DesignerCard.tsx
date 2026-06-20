import { Link } from 'react-router-dom'
import { Star, ShieldCheck, Calendar, FileText, ArrowRight, Heart } from 'lucide-react'
import type { DesignerItem } from '@/lib/types'
import { CERT_LABELS, CERT_COLORS } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useAppStore } from '@/hooks/useAppStore'

const AVATAR_FALLBACK =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional+architect+portrait+headshot&image_size=square_hd'

export default function DesignerCard({ designer, showActions = true }: { designer: DesignerItem; showActions?: boolean }) {
  const { toggleFavorite, isFavorite } = useAppStore()
  const liked = isFavorite(designer.id)

  return (
    <div className="card-hover flex flex-col gap-4 rounded-xl bg-white p-4">
      <div className="relative">
        <Link to={`/designers/${designer.id}`} className="flex gap-4">
          <img
            src={designer.avatar || AVATAR_FALLBACK}
            alt={designer.name}
            className="h-20 w-20 flex-shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-sand-900">
                  {designer.name}
                </h3>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${CERT_COLORS[designer.certification]}`}
                >
                  <ShieldCheck size={12} />
                  {CERT_LABELS[designer.certification]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-sand-900/50">{designer.region}</p>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {designer.styles.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-sand-100 px-2 py-0.5 text-xs text-sand-600"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.round(designer.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-sand-200'
                    }
                  />
                ))}
                <span className="ml-1 text-xs text-sand-900/60">{designer.rating}</span>
              </div>
              <span className="text-xs text-sand-400">
                ¥{formatPrice(designer.priceMin)}-{formatPrice(designer.priceMax)}/㎡
              </span>
            </div>
          </div>
        </Link>
        <button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(designer.id, 'designer')
          }}
          className="absolute top-0 right-0 z-10 rounded-full bg-white/20 p-1.5 backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <Heart
            size={14}
            className={liked ? 'fill-red-500 text-red-500' : 'text-sand-900/40'}
          />
        </button>
      </div>
      {showActions && (
        <div className="flex gap-2 border-t border-sand-100 pt-3">
          <Link
            to={`/designers/${designer.id}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-sand-200 py-2 text-xs font-medium text-sand-700 transition-colors hover:bg-sand-100"
          >
            <ArrowRight size={12} /> 详情
          </Link>
          <Link
            to={`/designers/${designer.id}?action=appointment`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sage-400/10 py-2 text-xs font-medium text-sage-600 transition-colors hover:bg-sage-400/20"
          >
            <Calendar size={12} /> 预约量房
          </Link>
          <Link
            to={`/designers/${designer.id}?action=quote`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sand-400/10 py-2 text-xs font-medium text-sand-600 transition-colors hover:bg-sand-400/20"
          >
            <FileText size={12} /> 方案报价
          </Link>
        </div>
      )}
    </div>
  )
}
