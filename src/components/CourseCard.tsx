import { useNavigate } from 'react-router-dom';
import { Users, Play } from 'lucide-react';
import type { Course } from '../../shared/types';
import { cn } from '../lib/utils';
import RatingStars from './RatingStars';
import Badge from './Badge';
import StatusBadge from './StatusBadge';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact';
  showStatus?: boolean;
  className?: string;
}

const CourseCard = ({ course, variant = 'default', showStatus = false, className }: CourseCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex gap-4 p-3 bg-white rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01]',
          className
        )}
      >
        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          {course.coverImage ? (
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Play className="w-8 h-8 text-white/80" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-900 text-sm line-clamp-2 mb-1">
            {course.title}
          </h4>
          <div className="flex items-center gap-2 mb-1">
            <RatingStars rating={course.rating} size="sm" showValue />
            <span className="text-xs text-zinc-500">({course.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-accent-600 font-bold">
              ¥{course.price}
            </span>
            {showStatus && <StatusBadge status={course.status} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        {course.coverImage ? (
          <img
            src={course.coverImage}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Play className="w-16 h-16 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {course.category && (
            <Badge variant="primary" size="sm">
              {course.category}
            </Badge>
          )}
          {showStatus && <StatusBadge status={course.status} />}
        </div>
        {course.isSubscription && (
          <div className="absolute top-3 right-3">
            <Badge variant="accent" size="sm">
              订阅制
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>

        {course.creator && (
          <div className="flex items-center gap-2 mb-3">
            {course.creator.avatar ? (
              <img
                src={course.creator.avatar}
                alt={course.creator.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-medium">
                {course.creator.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-zinc-600">{course.creator.username}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <RatingStars rating={course.rating} size="sm" showValue />
          <div className="flex items-center gap-1 text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">{course.studentCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div>
            <span className="text-xl font-bold text-accent-600">
              ¥{course.price}
            </span>
            {course.subscriptionPrice && (
              <span className="text-xs text-zinc-500 ml-2">
                / ¥{course.subscriptionPrice}/月
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">
            {course.chapterCount || course.chapters?.length || 0} 章节
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
