import { Link } from 'react-router-dom'
import { Star, ShieldCheck } from 'lucide-react'
import type { DesignerItem } from '@/lib/types'
import { CERT_LABELS, CERT_COLORS } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

const AVATAR_FALLBACK =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional+architect+portrait+headshot&image_size=square_hd'

export default function DesignerCard({ designer }: { designer: DesignerItem }) {
  return (
    <Link
      to={`/designers/${designer.id}`}
      className="card-hover flex gap-4 rounded-xl bg-white p-4"
    >
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
  )
}
