import Link from 'next/link';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@pet/shared/types';

interface MomentCardProps {
  moment: Post;
  author?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  onLike?: (id: string) => void;
}

export function MomentCard({ moment, author, onLike }: MomentCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Link href={author ? `/user/${author.id}` : '#'}>
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {author?.avatar ? (
              <img src={author.avatar} alt={author.nickname} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              author?.nickname?.charAt(0) || '?'
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={author ? `/user/${author.id}` : '#'} className="text-sm font-semibold text-foreground hover:text-pet-orange">
              {author?.nickname || '匿名用户'}
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date(moment.createdAt).toLocaleDateString()}
            </span>
          </div>

          <Link href={`/social/moment/${moment.id}`}>
            <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
              {moment.content}
            </p>
          </Link>

          {moment.images && moment.images.length > 0 && (
            <div className={cn(
              'grid gap-2 mb-3',
              moment.images.length === 1 ? 'grid-cols-1 max-w-xs' :
              moment.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            )}>
              {moment.images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {moment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {moment.tags.map((tag) => (
                <span key={tag} className="text-xs text-pet-teal">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-5 text-muted-foreground">
            <button
              onClick={() => onLike?.(moment.id)}
              className="flex items-center gap-1 text-xs hover:text-pet-orange transition-colors"
            >
              <Heart className={cn('h-4 w-4')} />
              {moment.likeCount}
            </button>
            <Link
              href={`/social/moment/${moment.id}`}
              className="flex items-center gap-1 text-xs hover:text-pet-teal transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {moment.commentCount}
            </Link>
            <button className="flex items-center gap-1 text-xs hover:text-foreground transition-colors">
              <Share2 className="h-4 w-4" />
              {moment.shareCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
