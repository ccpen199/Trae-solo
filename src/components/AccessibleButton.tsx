import React from 'react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speakText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<NonNullable<AccessibleButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
  secondary: 'bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  ghost: 'bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20 border-2 border-primary',
};

const sizeClasses: Record<NonNullable<AccessibleButtonProps['size']>, string> = {
  sm: 'min-h-[48px] min-w-[48px] px-4 py-2 text-lg',
  md: 'min-h-[56px] min-w-[56px] px-6 py-3 text-xl',
  lg: 'min-h-[64px] min-w-[64px] px-8 py-4 text-2xl',
  xl: 'min-h-[72px] min-w-[72px] px-10 py-5 text-3xl',
};

export default function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  speakText,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  ...props
}: AccessibleButtonProps) {
  const { speak } = useVoice();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const textToSpeak = speakText || (typeof children === 'string' ? children : undefined);
    if (textToSpeak) {
      speak(textToSpeak);
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-2xl font-bold transition-all duration-200',
        'flex items-center justify-center gap-3',
        'focus:outline-none focus:ring-4 focus:ring-primary/30',
        'active:scale-[0.98]',
        'shadow-md hover:shadow-lg',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
}
