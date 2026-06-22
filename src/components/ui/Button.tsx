import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: React.ElementType;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, as, asChild, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-gradient-brand text-white shadow-soft hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0',
      secondary: 'bg-white text-paper-900 border border-paper-300 shadow-soft hover:border-brand-400 hover:text-brand-600',
      ghost: 'text-paper-700 hover:bg-paper-200',
      outline: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-5 text-sm gap-2',
      lg: 'h-12 px-7 text-base gap-2.5',
    };

    const buttonContent = (
      <>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </>
    );

    const buttonClassName = cn(baseStyles, variants[variant], sizes[size], className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement;
      return React.cloneElement(child, {
        className: cn(buttonClassName, child.props.className),
        disabled: disabled || isLoading,
        ...props,
      } as React.HTMLAttributes<HTMLElement>);
    }

    if (as) {
      const Component = as as React.ElementType;
      return (
        <Component
          ref={ref}
          className={buttonClassName}
          disabled={disabled || isLoading}
          {...props}
        >
          {buttonContent}
        </Component>
      );
    }

    return (
      <button
        ref={ref}
        className={buttonClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
