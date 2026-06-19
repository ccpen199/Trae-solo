import { useNavigate } from 'react-router-dom'
import { ShieldCheck, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Post } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null) return '面议'
  if (price >= 10000) return `${(price / 10000).toFixed(1)}万`
  return `¥${price.toLocaleString()}`
}

export default function PostCard({ post }: { post: Post }) {
  const navigate = useNavigate()
  const categoryInfo = CATEGORIES.find((c) => c.key === post.category)
  const categoryColor = categoryInfo?.color || '#6B7280'
  const primaryImage = post.images?.find((img) => img.isPrimary) || post.images?.[0]

  return (
    <div
      onClick={() => navigate(`/list/${post.id}`)}
      className={cn(
        'card rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
        post.isTop && 'border-t-2 border-t-accent-500'
      )}
      style={{ borderLeftColor: categoryColor, borderLeftWidth: '3px' }}
    >
      {post.isTop && (
        <span className="absolute top-2 left-2 badge bg-accent-500 text-white text-xs z-10">
          置顶
        </span>
      )}

      <div className="relative">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={post.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div
            className="w-full h-40 flex items-center justify-center"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <span className="text-2xl font-bold" style={{ color: categoryColor }}>
              {categoryInfo?.label?.[0] || '信'}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">
          {post.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-accent-600">
            {formatPrice(post.price)}
          </span>
          {post.merchantVerified && (
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {post.district}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
