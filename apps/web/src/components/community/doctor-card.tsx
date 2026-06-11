import Link from 'next/link';
import { Star, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DoctorProfile } from '@pet/shared/types';

interface DoctorCardProps {
  doctor: DoctorProfile;
  compact?: boolean;
}

export function DoctorCard({ doctor, compact = false }: DoctorCardProps) {
  return (
    <Link href={`/community/doctor/${doctor.id}`}>
      <div className={cn(
        'rounded-lg border bg-card transition-shadow hover:shadow-md',
        compact ? 'p-3' : 'p-4'
      )}>
        <div className="flex gap-3">
          <div className={cn(
            'shrink-0 rounded-full bg-muted flex items-center justify-center font-medium text-pet-navy',
            compact ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-lg'
          )}>
            {doctor.avatar ? (
              <img src={doctor.avatar} alt={doctor.realName} className="h-full w-full rounded-full object-cover" />
            ) : (
              doctor.realName.charAt(0)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'font-semibold text-foreground',
                compact ? 'text-sm' : 'text-base'
              )}>
                {doctor.realName}
              </span>
              {doctor.isOnline ? (
                <span className="flex items-center gap-0.5 text-xs text-green-600">
                  <Wifi className="h-3 w-3" />
                  在线
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <WifiOff className="h-3 w-3" />
                  离线
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mb-1">
              <span>{doctor.title}</span>
              <span>·</span>
              <span>{doctor.department}</span>
              <span>·</span>
              <span>{doctor.hospital}</span>
            </div>

            {!compact && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {doctor.introduction}
              </p>
            )}

            <div className="flex flex-wrap gap-1 mb-2">
              {doctor.specialties.slice(0, compact ? 2 : 4).map((spec) => (
                <span key={spec} className="rounded bg-pet-cream px-1.5 py-0.5 text-xs text-pet-orange">
                  {spec}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {doctor.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {doctor.consultationCount}次问诊
              </span>
              <span className="text-pet-orange font-medium">
                ¥{doctor.consultationFee}/次
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
