import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type PillButtonVariant = 'primary' | 'mint' | 'coral' | 'secondary';
type PillButtonSize = 'sm' | 'md' | 'lg';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: PillButtonVariant;
  size?: PillButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<PillButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-night-400 to-dream-400 text-white shadow-glow-blue hover:brightness-110',
  mint:
    'bg-gradient-mint text-night-800 font-semibold shadow-glow-mint hover:brightness-105',
  coral:
    'bg-gradient-coral text-white font-semibold shadow-glow-coral hover:brightness-105',
  secondary:
    'bg-white/5 border border-white/10 text-silver-200 hover:bg-white/10 hover:border-white/20 hover:text-white',
};

const sizeStyles: Record<PillButtonSize, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 py-4 text-lg gap-2.5',
};

export function PillButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: PillButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        'transition-all duration-300 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
