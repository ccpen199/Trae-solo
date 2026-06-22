import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

interface LoadingSpinnerProps {
  fullscreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  fullscreen = false,
  size = 'md',
  text = '加载中...',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper-50/90 backdrop-blur-sm">
        <div className="relative">
          <div
            className={cn(
              'rounded-full border-2 border-paper-200 border-t-brand-500 animate-spin',
              sizeClasses[size]
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera
              className={cn(
                'text-brand-500',
                iconSizeClasses[size]
              )}
            />
          </div>
        </div>
        {text && (
          <p className={cn('mt-4 text-paper-500', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8',
        className
      )}
    >
      <div className="relative">
        <div
          className={cn(
            'rounded-full border-2 border-paper-200 border-t-brand-500 animate-spin',
            sizeClasses[size]
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Camera
            className={cn(
              'text-brand-500',
              iconSizeClasses[size]
            )}
          />
        </div>
      </div>
      {text && (
        <p className={cn('mt-3 text-paper-500', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

export function FilmStripLoader({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-3 h-6 bg-brand-400 rounded-sm animate-pulse"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  );
}

export function DotsLoader({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
