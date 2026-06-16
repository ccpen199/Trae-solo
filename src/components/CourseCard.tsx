import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Play, ShoppingCart, ShieldCheck, Clock, X, ChevronRight, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import type { Course } from '../../shared/types';
import { cn } from '../lib/utils';
import RatingStars from './RatingStars';
import Badge from './Badge';
import StatusBadge from './StatusBadge';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact';
  showStatus?: boolean;
  isPurchased?: boolean;
  className?: string;
}

interface PurchaseState {
  purchased: boolean;
  subscribed: boolean;
  orderId?: string;
}

const getAuditBadge = (status: Course['status']) => {
  switch (status) {
    case 'published':
      return { label: '已审核', className: 'bg-green-500 text-white', icon: CheckCircle };
    case 'reviewing':
      return { label: '审核中', className: 'bg-amber-500 text-white', icon: Clock };
    case 'rejected':
      return { label: '未通过', className: 'bg-red-500 text-white', icon: XCircle };
    default:
      return null;
  }
};

const CourseCard = ({ course, variant = 'default', showStatus = false, className }: CourseCardProps) => {
  const navigate = useNavigate();
  const [creatorHover, setCreatorHover] = useState(false);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    purchased: false,
    subscribed: false,
  });

  useEffect(() => {
    try {
      const purchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '{}');
      const subscriptionActive = localStorage.getItem('subscriptionActive') === 'true';
      const purchased = !!purchasedCourses[course.id];
      setPurchaseState({
        purchased,
        subscribed: subscriptionActive,
        orderId: purchasedCourses[course.id]?.orderId,
      });
    } catch {
      setPurchaseState({ purchased: false, subscribed: false });
    }
  }, [course.id]);

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const purchaseLabel = course.isSubscription && course.subscriptionPrice
    ? '订阅课程'
    : course.price > 0
      ? '立即购买'
      : '免费学习';

  const creatorRevenue = (course.price * 0.85).toFixed(2);

  const getReviewBadge = () => {
    const auditBadge = getAuditBadge(course.status || 'published');
    if (!auditBadge) return null;
    const AuditIcon = auditBadge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm ${auditBadge.className}`}>
        <AuditIcon className="w-3 h-3" />
        {auditBadge.label}
      </span>
    );
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
          <div className="absolute top-2 right-2">
            {getReviewBadge()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-900 text-sm line-clamp-2 mb-1">
            {course.title}
          </h4>
          <div className="flex items-center gap-2 mb-1">
            <RatingStars rating={course.rating} size="sm" showValue />
            <span className="text-xs text-zinc-500">({course.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-accent-600 font-bold">
              {course.price > 0 ? `¥${course.price}` : '免费'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              <ShoppingCart className="w-3 h-3" />
              {purchaseLabel}
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
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {getReviewBadge()}
          {course.isSubscription && (
            <Badge variant="accent" size="sm">
              订阅制
            </Badge>
          )}
          {showStatus && <StatusBadge status={course.status} />}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>

        {course.creator && (
          <div className="relative inline-block mb-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setCreatorHover(true)}
              onMouseLeave={() => setCreatorHover(false)}
            >
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
              <span className="text-sm text-zinc-600 hover:text-primary-600 transition-colors">
                {course.creator.username}
              </span>
            </div>
            {creatorHover && course.price > 0 && (
              <div className="absolute left-0 top-full mt-2 z-20 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                ¥{creatorRevenue} 创作者收入
                <div className="text-zinc-400 mt-0.5">已扣除平台费</div>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-zinc-900 rotate-45" />
              </div>
            )}
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
              {course.price > 0 ? `¥${course.price}` : '免费'}
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

        {!purchaseState.purchased && !purchaseState.subscribed && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/courses/${course.id}`);
              }}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
            >
              查看详情
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/courses/${course.id}`);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <ShoppingCart className="w-4 h-4" />
              {purchaseLabel}
            </button>
          </div>
        )}

        {purchaseState.subscribed && !purchaseState.purchased && (
          <div className="mt-4 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100 text-center">
            <span className="inline-flex items-center gap-1 text-purple-700 text-sm font-medium">
              会员权益 · 畅看
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        )}
      </div>

      {purchaseState.purchased && (
        <div
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold flex items-center justify-between cursor-pointer hover:from-green-600 hover:to-green-700 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/courses/${course.id}`);
          }}
        >
          <span>继续学习</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default CourseCard;
