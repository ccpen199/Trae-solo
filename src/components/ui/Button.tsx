import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled = false, loading = false, fullWidth = false, className, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500/50 shadow-md hover:shadow-lg',
      secondary: 'bg-white text-primary-500 border-2 border-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500/30',
      ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500/30',
      danger: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 focus:ring-accent-500/50 shadow-md hover:shadow-lg',
      success: 'bg-mint-500 text-white hover:bg-mint-600 active:bg-mint-700 focus:ring-mint-500/50 shadow-md hover:shadow-lg',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
