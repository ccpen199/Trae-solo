import Link from 'next/link';
import { MapPin, Heart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdoptionPost } from '@pet/shared/types';
import { PET_TYPE_LABELS } from '@pet/shared/constants';

interface AdoptionCardProps {
  adoption: AdoptionPost;
  compact?: boolean;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  open: { label: '待领养', className: 'bg-green-100 text-green-700' },
  pending: { label: '审核中', className: 'bg-amber-100 text-amber-700' },
  adopted: { label: '已领养', className: 'bg-blue-100 text-blue-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-700' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
};

export function AdoptionCard({ adoption, compact = false }: AdoptionCardProps) {
  const statusInfo = statusLabels[adoption.status] || statusLabels.open;

  return (
    <Link href={`/community/adoption/${adoption.id}`}>
      <div className={cn(
        'rounded-lg border bg-card transition-shadow hover:shadow-md',
        compact ? 'p-3' : 'p-4'
      )}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className={cn(
              'font-semibold text-foreground',
              compact ? 'text-sm' : 'text-base'
            )}>
              {adoption.petName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="rounded bg-pet-cream px-1.5 py-0.5 text-pet-orange">
                {PET_TYPE_LABELS[adoption.petType] || adoption.petType}
              </span>
              <span>{adoption.breed}</span>
              {adoption.petAge && <span>{adoption.petAge}岁</span>}
            </div>
          </div>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusInfo.className)}>
            {statusInfo.label}
          </span>
        </div>

        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {adoption.healthCondition}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-2">
          {adoption.vaccinated && (
            <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">已疫苗</span>
          )}
          {adoption.neutered && (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">已绝育</span>
          )}
          <span className={cn(
            'rounded px-1.5 py-0.5 text-xs',
            adoption.adoptionType === 'free'
              ? 'bg-pet-teal/10 text-pet-teal'
              : 'bg-pet-orange/10 text-pet-orange'
          )}>
            {adoption.adoptionType === 'free' ? '免费领养' : `¥${adoption.adoptionFee}`}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {adoption.location}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {adoption.applicantCount}人申请
          </span>
          {!compact && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(adoption.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
