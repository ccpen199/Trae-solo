import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-westlake-500 to-westlake-600 text-white shadow-button hover:shadow-button-hover hover:-translate-y-0.5 focus:ring-westlake-500',
  secondary:
    'bg-white border-2 border-westlake-500 text-westlake-600 hover:bg-westlake-50 focus:ring-westlake-500',
  success:
    'bg-gradient-to-r from-honghua-500 to-honghua-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-honghua-500',
  warning:
    'bg-gradient-to-r from-chaojing-500 to-chaojing-600 text-neutral-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-chaojing-500',
  ghost:
    'text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-400',
  outline:
    'bg-transparent border-2 border-neutral-300 text-neutral-700 hover:border-westlake-500 hover:text-westlake-600 focus:ring-westlake-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-button font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
