import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonVariant, ButtonSize } from '@/types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gold-gradient text-ink-950 font-semibold shadow-gold hover:shadow-gold-sm hover:brightness-110 active:brightness-95 border border-gold-500/40',
  secondary:
    'border-2 border-forest-600 text-forest-300 hover:bg-forest-600/15 hover:border-forest-500 hover:text-forest-200',
  ghost:
    'bg-white/[0.03] border border-white/[0.08] text-ink-100 hover:bg-white/[0.08] hover:border-gold-500/30 backdrop-blur-md',
  danger:
    'bg-coral-500 text-white hover:bg-coral-400 shadow-lg shadow-coral-500/25',
  link:
    'text-gold-400 hover:text-gold-300 underline-offset-4 hover:underline px-1 bg-transparent border-0',
  gold:
    'bg-gradient-to-b from-gold-500 to-gold-700 text-ink-950 font-semibold shadow-lg shadow-gold-600/40 hover:brightness-110 border border-gold-400/50',
  outline:
    'border-2 border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-9 px-4 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-6 text-base rounded-2xl gap-2',
  lg: 'h-14 px-8 text-lg rounded-[16px] gap-2.5',
  xl: 'h-16 px-10 text-xl rounded-3xl gap-3',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-300 ease-out',
          'active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'will-change-transform',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-[1.1em] w-[1.1em] animate-spin shrink-0" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button };
