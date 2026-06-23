import { useNavigate } from 'react-router-dom'
import { ShieldCheck, MapPin, Clock, Star, AlertTriangle, Eye, Wallet, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Post } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null || price === 0) return '面议'
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
        'card relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
        post.isTop && 'border-t-2 border-t-accent-500'
      )}
      style={{ borderLeftColor: categoryColor, borderLeftWidth: '3px' }}
    >
      {post.isTop && (
        <span className="absolute top-2 left-2 z-10 badge bg-accent-500 text-white">
          置顶
        </span>
      )}

      <div className="relative">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={post.title}
            className="w-full h-40 object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              const placeholder = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement
              if (placeholder) placeholder.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={cn('w-full h-40 items-center justify-center', primaryImage ? 'hidden' : 'flex')}
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <span className="text-2xl font-bold" style={{ color: categoryColor }}>
            {categoryInfo?.label?.[0] || '信'}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-slate-800 line-clamp-2 mb-1.5 min-h-[2.5rem]">
          {post.title}
        </h3>

        {post.authorType === 'merchant' && post.merchantName && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <BadgeCheck className="w-3 h-3 text-navy-500 shrink-0" />
            <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{post.merchantName}</span>
            {post.merchantDepositStatus === 'paid' && post.merchantDepositAmount !== undefined && post.merchantDepositAmount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5">
                <Wallet className="w-2.5 h-2.5" />
                {post.merchantDepositAmount >= 10000
                  ? `${(post.merchantDepositAmount / 10000).toFixed(0)}万托管`
                  : `${post.merchantDepositAmount.toLocaleString()}托管`}
              </span>
            )}
          </div>
        )}

        {post.attributes && post.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.attributes.slice(0, 2).map((attr) => (
              <span key={attr.key} className="text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                {attr.key}: {attr.value}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-accent-600">
              {formatPrice(post.price)}
            </span>
            {post.merchantRating !== undefined && (
              <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                <Star className="w-3 h-3 fill-current" />
                {post.merchantRating.toFixed(1)}
                {post.merchantReviewCount !== undefined && post.merchantReviewCount > 0 && (
                  <span className="text-slate-400">({post.merchantReviewCount})</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {post.merchantVerified && (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            {post.riskScore >= 40 && (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            {post.status === 'pending' && (
              <span className="badge badge-warning text-[10px] py-0 px-1.5">待审核</span>
            )}
            {post.status === 'reviewing' && (
              <span className="badge badge-info text-[10px] py-0 px-1.5">复审中</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {post.district || post.city || '未定位'}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {post.views || 0}
            <span className="mx-1">·</span>
            <Clock className="w-3 h-3" />
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
