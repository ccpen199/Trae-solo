import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart, MessageCircle, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Baoliao } from '@/types';
import Avatar from '@/components/common/Avatar';
import Tag from '@/components/common/Tag';

interface BaoliaoCardProps {
  baoliao: Baoliao;
  className?: string;
  onLike?: (id: string) => void;
}

const categoryColors: Record<string, 'westlake' | 'honghua' | 'chaojing' | 'neutral'> = {
  traffic: 'westlake',
  environment: 'honghua',
  facility: 'chaojing',
  livelihood: 'westlake',
  emergency: 'neutral',
  other: 'neutral',
};

const sentimentColors: Record<string, string> = {
  positive: 'text-green-500',
  neutral: 'text-neutral-500',
  negative: 'text-red-500',
};

export default function BaoliaoCard({ baoliao, className, onLike }: BaoliaoCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/baoliao/${baoliao.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(baoliao.id);
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
    <motion.article
      className={cn(
        'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
        className
      )}
      onClick={handleClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-28 h-28 md:w-36 md:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
          {baoliao.images.length > 0 ? (
            <img
              src={baoliao.images[0]}
              alt={baoliao.title}
              className="w-full h-full object-cover"
            />
          ) : baoliao.video ? (
            <div className="relative w-full h-full bg-gradient-to-br from-westlake-400 to-westlake-600 flex items-center justify-center">
              <Play className="w-10 h-10 text-white" />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
              <span className="text-neutral-400 text-xs">暂无图片</span>
            </div>
          )}
          {baoliao.images.length > 1 && (
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {baoliao.images.length}图
            </span>
          )}
          {baoliao.video && (
            <span className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              视频
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-800 line-clamp-2 mb-2 hover:text-westlake-600 transition-colors">
            {baoliao.title}
          </h3>

          <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
            {baoliao.content}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag color={categoryColors[baoliao.category] || 'neutral'} size="sm">
              {baoliao.categoryName}
            </Tag>
            <div className="flex items-center text-xs text-neutral-400">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate max-w-[120px]">{baoliao.location.district}</span>
            </div>
            {baoliao.sentiment !== 'neutral' && (
              <span className={cn('text-xs font-medium', sentimentColors[baoliao.sentiment])}>
                {baoliao.sentiment === 'positive' ? '正面' : '负面'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar size="xs" name={baoliao.user.nickname} src={baoliao.user.avatar} />
              <span className="text-xs text-neutral-500">{baoliao.user.nickname}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1 transition-colors',
                  baoliao.isLiked ? 'text-red-500' : 'hover:text-red-500'
                )}
              >
                <Heart className={cn('w-3.5 h-3.5', baoliao.isLiked && 'fill-current')} />
                <span>{baoliao.likes}</span>
              </button>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{baoliao.comments}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(baoliao.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
