import { Heart, MessageSquare, Share2, Flag, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from './StatusBadge'

interface PostCardProps {
  post: any
  onLike: (id: number) => void
  onComment: (post: any) => void
  onReport: (post: any) => void
  index: number
}

export default function PostCard({ post, onLike, onComment, onReport, index }: PostCardProps) {
  const getImageGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count === 3) return 'grid-cols-3'
    return 'grid-cols-2'
  }

  const getImageHeightClass = (count: number) => {
    if (count === 1) return 'h-64'
    if (count === 4) return 'h-32'
    return 'h-40'
  }

  const images = post.images || []
  const displayImages = images.slice(0, 4)
  const hasMoreImages = images.length > 4

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm overflow-hidden opacity-0 animate-slideUp',
        `stagger-${Math.min(index + 1, 6)}`
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.avatar || `https://picsum.photos/seed/user${post.author?.id}/40/40`}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">{post.author?.name}</span>
              {post.status === 'pending' && (
                <StatusBadge status="pending" label="AI审核中" />
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="w-3 h-3" />
              {post.createdAt || '2024-01-15 14:30'}
            </span>
          </div>
        </div>
        {post.content && (
          <p className="mt-3 text-text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag: string, i: number) => (
              <span key={i} className="text-xs text-primary bg-primary/5 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {images.length > 0 && (
        <div className={cn('grid gap-0.5', getImageGridClass(images.length))}>
          {displayImages.map((img: string, i: number) => (
            <div key={i} className={cn('relative overflow-hidden', getImageHeightClass(images.length))}>
              <img
                src={img || `https://picsum.photos/seed/post${post.id}-${i}/400/300`}
                alt=""
                className="w-full h-full object-cover"
              />
              {hasMoreImages && i === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-3 border-t border-stone-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onLike(post.id)}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm transition-colors',
              post.liked ? 'text-red-500' : 'text-text-secondary hover:text-red-500'
            )}
          >
            <Heart className={cn('w-5 h-5', post.liked && 'fill-current')} />
            <span>{post.likeCount || 0}</span>
          </button>
          <button
            onClick={() => onComment(post)}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{post.commentCount || 0}</span>
          </button>
          <button className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
            <Share2 className="w-5 h-5" />
            <span>分享</span>
          </button>
          <button
            onClick={() => onReport(post)}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-red-500 transition-colors"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
