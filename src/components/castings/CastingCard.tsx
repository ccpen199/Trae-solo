import React from 'react';
import { MapPin, Calendar, Users, Clock } from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import BudgetRange from './BudgetRange';
import type { Casting } from '@shared/types';

export interface CastingCardProps {
  casting: Casting;
  viewMode?: 'list' | 'grid';
  applicationCount?: number;
  onClick?: () => void;
  className?: string;
}

const categoryColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
  '时装周': 'primary',
  '平面广告': 'secondary',
  '品牌代言': 'success',
  '电商拍摄': 'warning',
  '影视 casting': 'danger',
  '直播带货': 'primary',
  '活动展示': 'secondary',
};

const statusColors: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  published: 'success',
  draft: 'default',
  closed: 'danger',
  completed: 'warning',
};

const statusLabels: Record<string, string> = {
  published: '招募中',
  draft: '草稿',
  closed: '已关闭',
  completed: '已完成',
};

const getDeadlineDisplay = (endDate: Date): { text: string; urgent: boolean } => {
  const now = new Date();
  const end = new Date(endDate);
  const daysLeft = differenceInDays(end, now);
  const hoursLeft = differenceInHours(end, now);

  if (daysLeft < 0) {
    return { text: '已截止', urgent: true };
  }
  if (daysLeft === 0) {
    if (hoursLeft <= 0) return { text: '已截止', urgent: true };
    if (hoursLeft < 6) return { text: `仅剩 ${hoursLeft} 小时`, urgent: true };
    return { text: `今日截止 (${hoursLeft}小时后)`, urgent: true };
  }
  if (daysLeft <= 3) {
    return { text: `剩余 ${daysLeft} 天`, urgent: true };
  }
  if (daysLeft <= 7) {
    return { text: `剩余 ${daysLeft} 天`, urgent: false };
  }
  return { text: format(end, 'MM月dd日截止', { locale: zhCN }), urgent: false };
};

const getImageUrl = (prompt: string): string => {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
};

const CastingCard: React.FC<CastingCardProps> = ({
  casting,
  viewMode = 'grid',
  applicationCount = 0,
  onClick,
  className,
}) => {
  const deadline = getDeadlineDisplay(casting.endDate);
  const badgeVariant = categoryColors[casting.category] || 'default';
  const statusVariant = statusColors[casting.status] || 'default';

  if (viewMode === 'list') {
    return (
      <Card
        variant="glass"
        hoverable
        onClick={onClick}
        className={className}
      >
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative w-full md:w-48 h-32 md:h-28 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={getImageUrl(`fashion casting ${casting.category} professional model photoshoot`)}
                alt={casting.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2">
                <Badge variant={badgeVariant} size="sm">
                  {casting.category}
                </Badge>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-white text-lg line-clamp-2 flex-1">
                  {casting.title}
                </h3>
                <Badge variant={statusVariant} size="sm" dot>
                  {statusLabels[casting.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-midnight-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {casting.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(casting.startDate), 'MM/dd', { locale: zhCN })} - {format(new Date(casting.endDate), 'MM/dd', { locale: zhCN })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {applicationCount} 人申请
                </span>
                <span className={cn('flex items-center gap-1', deadline.urgent && 'text-rose-400 font-medium')}>
                  <Clock className="w-4 h-4" />
                  {deadline.text}
                </span>
              </div>
              <div className="mt-3">
                <BudgetRange min={casting.budgetMin} max={casting.budgetMax} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="glass"
      hoverable
      onClick={onClick}
      className={className}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={getImageUrl(`fashion casting ${casting.category} professional model photoshoot`)}
          alt={casting.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-midnight-900/20 to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge variant={badgeVariant} size="sm">
            {casting.category}
          </Badge>
          <Badge variant={statusVariant} size="sm" dot>
            {statusLabels[casting.status]}
          </Badge>
        </div>
        {deadline.urgent && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-xs font-medium">
              <Clock className="w-3 h-3" />
              {deadline.text}
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
          {casting.title}
        </h3>
        <div className="space-y-2 text-sm text-midnight-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {casting.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {applicationCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(casting.startDate), 'MM/dd', { locale: zhCN })} - {format(new Date(casting.endDate), 'MM/dd', { locale: zhCN })}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-midnight-700/50 flex items-center justify-between">
          <BudgetRange min={casting.budgetMin} max={casting.budgetMax} size="sm" />
          {!deadline.urgent && (
            <span className="text-xs text-midnight-400">{deadline.text}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default CastingCard;
