import { ThumbsUp, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comment } from '@pet/shared/types';

interface CommentItemProps {
  comment: Comment;
  author?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  replyToAuthor?: {
    id: string;
    nickname: string;
  };
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
}

function CommentItem({ comment, author, replyToAuthor, onLike, onReply }: CommentItemProps) {
  return (
    <div className="flex gap-3 py-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {author?.avatar ? (
          <img src={author.avatar} alt={author.nickname} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          author?.nickname?.charAt(0) || '?'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{author?.nickname || '匿名用户'}</span>
          {replyToAuthor && (
            <>
              <span className="text-xs text-muted-foreground">回复</span>
              <span className="text-sm font-medium text-pet-teal">{replyToAuthor.nickname}</span>
            </>
          )}
        </div>
        <p className="text-sm text-foreground mb-2">{comment.content}</p>
        {comment.images && comment.images.length > 0 && (
          <div className="flex gap-2 mb-2">
            {comment.images.map((img, i) => (
              <div key={i} className="h-20 w-20 overflow-hidden rounded-md bg-muted">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          <button
            onClick={() => onLike?.(comment.id)}
            className="flex items-center gap-1 hover:text-pet-orange transition-colors"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {comment.likeCount}
          </button>
          <button
            onClick={() => onReply?.(comment.id)}
            className="flex items-center gap-1 hover:text-pet-teal transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
            回复
          </button>
        </div>
      </div>
    </div>
  );
}

interface CommentListProps {
  comments: (Comment & {
    author?: { id: string; nickname: string; avatar?: string };
    replyToAuthor?: { id: string; nickname: string };
    replies?: Comment[];
  })[];
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function CommentList({ comments, onLike, onReply, onLoadMore, hasMore }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        暂无评论，快来发表你的看法吧
      </div>
    );
  }

  return (
    <div className="divide-y">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            author={comment.author}
            replyToAuthor={comment.replyToAuthor}
            onLike={onLike}
            onReply={onReply}
          />
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-11 border-l-2 border-muted pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      {hasMore && (
        <div className="py-3 text-center">
          <button
            onClick={onLoadMore}
            className="text-sm text-pet-teal hover:underline"
          >
            加载更多评论
          </button>
        </div>
      )}
    </div>
  );
}
