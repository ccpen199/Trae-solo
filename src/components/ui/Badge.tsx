import { cn } from '@/lib/utils';

type BadgeVariant = 'mint' | 'coral' | 'purple' | 'sky' | 'amber';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  mint: 'bg-mood-mint/15 text-mood-mint border-mood-mint/30',
  coral: 'bg-mood-coral/15 text-mood-coral border-mood-coral/30',
  purple: 'bg-mood-purple/15 text-mood-purple border-mood-purple/30',
  sky: 'bg-mood-sky/15 text-mood-sky border-mood-sky/30',
  amber: 'bg-amber-orange/15 text-amber-orange border-amber-orange/30',
};

const sizeMap: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function Badge({
  variant = 'amber',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variantMap[variant],
        sizeMap[size],
        className
      )}
    >
      {children}
    </span>
  );
}
