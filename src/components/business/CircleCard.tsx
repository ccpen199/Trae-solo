import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, FileText, Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Circle } from '@/types';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';

interface CircleCardProps {
  circle: Circle;
  variant?: 'grid' | 'list';
  className?: string;
  onJoin?: (id: string) => void;
}

export default function CircleCard({ circle, variant = 'grid', className, onJoin }: CircleCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/circles/${circle.id}`);
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(circle.id);
  };

  if (variant === 'list') {
    return (
      <motion.div
        className={cn(
          'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
          className
        )}
        onClick={handleClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex gap-4 p-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={circle.coverImage}
              alt={circle.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-neutral-800">{circle.name}</h3>
              <Button
                variant={circle.isJoined ? 'outline' : 'primary'}
                size="sm"
                onClick={handleJoin}
              >
                {circle.isJoined ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    已加入
                  </>
                ) : (
                  '+ 加入'
                )}
              </Button>
            </div>

            <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
              {circle.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{circle.memberCount}成员</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{circle.postCount}帖子</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{circle.activityCount}活动</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
        className
      )}
      onClick={handleClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-36">
        <img
          src={circle.coverImage}
          alt={circle.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg">{circle.name}</h3>
          <p className="text-xs text-white/80">{circle.categoryName}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-neutral-500 line-clamp-2 mb-3 h-10">
          {circle.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {circle.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color="neutral" size="sm">
              {tag}
            </Tag>
          ))}
          {circle.tags.length > 3 && (
            <Tag color="neutral" size="sm">
              +{circle.tags.length - 3}
            </Tag>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{circle.memberCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>{circle.postCount}</span>
            </div>
          </div>

          <Button
            variant={circle.isJoined ? 'outline' : 'primary'}
            size="sm"
            onClick={handleJoin}
          >
            {circle.isJoined ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                已加入
              </>
            ) : (
              '+ 加入'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
