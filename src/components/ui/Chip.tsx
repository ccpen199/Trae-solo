import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ChipVariant = 'mint' | 'coral' | 'dream' | 'default';

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ChipVariant, string> = {
  default: 'bg-white/5 border border-white/10 text-silver-300',
  mint: 'bg-mint-400/15 border border-mint-400/30 text-mint-300',
  coral: 'bg-coral-400/15 border border-coral-400/30 text-coral-300',
  dream: 'bg-dream-400/15 border border-dream-400/30 text-dream-300',
};

export function Chip({
  children,
  variant = 'default',
  className,
  leftIcon,
  rightIcon,
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </span>
  );
}
