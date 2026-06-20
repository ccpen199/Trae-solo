import { cn } from '@/lib/utils';
import type { EhsRating } from '@shared/types';

const ratingConfig: Record<EhsRating, { bg: string; text: string; border: string; label: string }> = {
  A: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-500', label: 'A' },
  B: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-500', label: 'B' },
  C: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-500', label: 'C' },
  D: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-500', label: 'D' },
};

interface Props {
  rating: EhsRating;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export default function EhsBadge({ rating, score, size = 'md', showScore = false }: Props) {
  const config = ratingConfig[rating];
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div className={cn(
        'rounded-lg flex items-center justify-center font-black border-2',
        sizeMap[size],
        config.bg,
        config.text,
        config.border
      )}>
        {config.label}
      </div>
      {showScore && score !== undefined && (
        <span className={cn('text-sm font-semibold', config.text)}>
          {score}分
        </span>
      )}
    </div>
  );
}
