import { Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommunityWork } from '@/types'

interface WorkCardProps {
  work: CommunityWork
  onClick?: () => void
  onLike?: (workId: string) => void
  onComment?: (workId: string) => void
  className?: string
}

export default function WorkCard({ work, onClick, onLike, onComment, className }: WorkCardProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike?.(work.id)
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComment?.(work.id)
  }

  return (
    <div
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium',
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-paper-100">
        <img
          src={work.coverUrl}
          alt={work.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <h3 className="line-clamp-2 font-display text-base font-semibold text-white">
            {work.title}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={work.userAvatar}
            alt={work.userName}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-paper-100"
          />
          <span className="flex-1 truncate text-sm font-medium text-paper-700">
            {work.userName}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              work.isLiked
                ? 'text-brand-500'
                : 'text-paper-500 hover:text-brand-500'
            )}
          >
            <Heart
              className={cn('h-4 w-4', work.isLiked && 'fill-current')}
            />
            <span>{work.likesCount}</span>
          </button>
          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 text-sm text-paper-500 transition-colors hover:text-brand-500"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{work.commentsCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
