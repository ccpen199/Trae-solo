import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-float hover:shadow-[0_20px_52px_-12px_rgba(255,122,61,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg',
  secondary:
    'bg-teal-gradient text-white shadow-[0_8px_24px_-10px_rgba(46,196,182,0.5)] hover:shadow-[0_16px_40px_-12px_rgba(46,196,182,0.55)] hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'bg-transparent text-ink-600 hover:bg-cream-100 hover:text-ink-900',
  outline:
    'bg-white text-ink-700 border border-ink-200 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 shadow-soft',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl2',
  lg: 'h-12 px-7 text-base gap-2 rounded-xl2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'lg' ? 18 : size === 'xs' ? 12 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        {children && <span className="whitespace-nowrap">{children}</span>}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
