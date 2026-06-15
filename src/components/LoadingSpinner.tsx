import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'accent' | 'white';
  className?: string;
  text?: string;
}

const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className,
  text,
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const variants = {
    primary: 'border-primary-200 border-t-primary-500',
    accent: 'border-accent-200 border-t-accent-500',
    white: 'border-white/30 border-t-white',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          sizes[size],
          variants[variant]
        )}
      />
      {text && (
        <span className={cn(textSizes[size], 'text-zinc-500 font-medium')}>
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
