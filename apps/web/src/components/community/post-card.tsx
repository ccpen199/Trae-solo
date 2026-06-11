import Link from 'next/link';
import { MessageCircle, ThumbsUp, Share2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@pet/shared/types';

interface PostCardProps {
  post: Post;
  author?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  compact?: boolean;
}

export function PostCard({ post, author, compact = false }: PostCardProps) {
  return (
    <Link href={`/community/post/${post.id}`}>
      <div className={cn(
        'rounded-lg border bg-card p-4 transition-shadow hover:shadow-md',
        compact ? 'p-3' : 'p-4'
      )}>
        {author && (
          <div className="mb-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {author.avatar ? (
                <img src={author.avatar} alt={author.nickname} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                author.nickname.charAt(0)
              )}
            </div>
            <span className="text-sm font-medium text-foreground">{author.nickname}</span>
            {post.isTop && (
              <span className="rounded bg-pet-orange px-1.5 py-0.5 text-xs text-white">置顶</span>
            )}
            {post.isHot && (
              <span className="rounded bg-pet-coral px-1.5 py-0.5 text-xs text-white">热门</span>
            )}
            {post.isEssence && (
              <span className="rounded bg-pet-teal px-1.5 py-0.5 text-xs text-white">精华</span>
            )}
          </div>
        )}

        {post.title && (
          <h3 className={cn(
            'font-semibold text-foreground mb-2 line-clamp-2',
            compact ? 'text-sm' : 'text-base'
          )}>
            {post.title}
          </h3>
        )}

        <p className={cn(
          'text-muted-foreground line-clamp-3',
          compact ? 'text-xs mb-2' : 'text-sm mb-3'
        )}>
          {post.content}
        </p>

        {post.images && post.images.length > 0 && (
          <div className={cn(
            'grid gap-2 mb-3',
            post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-3'
          )}>
            {post.images.slice(0, compact ? 1 : 3).map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
            {post.images.length > 3 && !compact && (
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted flex items-center justify-center">
                <span className="text-sm text-muted-foreground">+{post.images.length - 3}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {post.shareCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
