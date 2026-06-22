import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Clock, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaoliaoComment } from '@/types';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';

interface CommentItemProps {
  comment: BaoliaoComment;
  className?: string;
  onLike?: (id: string) => void;
  onReply?: (id: string) => void;
  depth?: number;
}

export default function CommentItem({ comment, className, onLike, onReply, depth = 0 }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
    onLike?.(comment.id);
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReplyInput(!showReplyInput);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply?.(comment.id);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-3 py-4', depth > 0 && 'ml-10 pl-4 border-l-2 border-neutral-100', className)}
    >
      <Avatar
        size="sm"
        name={comment.user.nickname}
        src={comment.user.avatar}
        online={Math.random() > 0.7}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-800">{comment.user.nickname}</span>
            {comment.user.role !== 'user' && (
              <span className="text-xs px-1.5 py-0.5 bg-westlake-100 text-westlake-600 rounded">
                {comment.user.role === 'government' ? '官方' : comment.user.role === 'creator' ? '创作者' : '管理员'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Clock className="w-3 h-3" />
            <span>{formatDate(comment.createdAt)}</span>
          </div>
        </div>

        <p className="text-neutral-700 mb-3 leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1 transition-colors',
              isLiked ? 'text-red-500' : 'text-neutral-400 hover:text-red-500'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
            <span>{likeCount}</span>
          </button>

          {depth < 1 && (
            <button
              onClick={handleReplyClick}
              className="flex items-center gap-1 text-neutral-400 hover:text-westlake-500 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>回复</span>
            </button>
          )}
        </div>

        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-start gap-2">
                <CornerDownRight className="w-4 h-4 text-neutral-300 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`回复 ${comment.user.nickname}...`}
                    className="w-full p-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-westlake-500 text-sm"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyInput(false)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                    >
                      发送
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
