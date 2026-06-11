import Link from 'next/link';
import { Calendar, Users, Gift, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityEvent } from '@pet/shared/types';

interface ActivityCardProps {
  activity: ActivityEvent;
  compact?: boolean;
}

const typeLabels: Record<string, string> = {
  sign_in: '签到',
  post: '发帖',
  like: '点赞',
  comment: '评论',
  share: '分享',
  task: '任务',
  lottery: '抽奖',
};

export function ActivityCard({ activity, compact = false }: ActivityCardProps) {
  const isActive = activity.status === 'active';
  const isEnded = activity.status === 'ended';

  return (
    <Link href={`/social/activity/${activity.id}`}>
      <div className={cn(
        'rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md',
        compact ? '' : ''
      )}>
        {activity.coverImage && (
          <div className="relative aspect-[2/1] bg-muted">
            <img src={activity.coverImage} alt={activity.title} className="h-full w-full object-cover" />
            {activity.isHot && (
              <span className="absolute top-2 left-2 rounded bg-pet-orange px-2 py-0.5 text-xs text-white font-medium">
                热门活动
              </span>
            )}
          </div>
        )}

        <div className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-start justify-between mb-2">
            <h3 className={cn(
              'font-semibold text-foreground line-clamp-1',
              compact ? 'text-sm' : 'text-base'
            )}>
              {activity.title}
            </h3>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ml-2',
              isActive ? 'bg-green-100 text-green-700' :
              isEnded ? 'bg-gray-100 text-gray-500' :
              'bg-amber-100 text-amber-700'
            )}>
              {isActive ? '进行中' : isEnded ? '已结束' : '未开始'}
            </span>
          </div>

          {!compact && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {activity.description}
            </p>
          )}

          <div className="flex items-center gap-2 mb-2">
            {activity.type.map((t) => (
              <span key={t} className="rounded bg-pet-cream px-1.5 py-0.5 text-xs text-pet-orange">
                {typeLabels[t] || t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(activity.endTime) > new Date() ? '进行中' : '已结束'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {activity.participationCount}人参与
            </span>
            {activity.maxParticipants && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                限{activity.maxParticipants}人
              </span>
            )}
            {activity.prizes.length > 0 && (
              <span className="flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" />
                {activity.prizes.length}个奖品
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
