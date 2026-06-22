import * as React from 'react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  fallback?: React.ReactNode;
}

const sizes: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const statusColors = {
  online: 'bg-forest-500',
  offline: 'bg-paper-400',
  busy: 'bg-darkroom-500',
  away: 'bg-gold-500',
};

const statusSizes: Record<AvatarSize, string> = {
  sm: 'w-2.5 h-2.5 border-2',
  md: 'w-3 h-3 border-2',
  lg: 'w-4 h-4 border-3',
  xl: 'w-5 h-5 border-4',
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', name, size = 'md', status, fallback, children, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const getInitials = (name: string): string => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const renderContent = () => {
      if (src && !imageError) {
        return (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        );
      }

      if (name) {
        return (
          <span className="font-medium text-white">
            {getInitials(name)}
          </span>
        );
      }

      if (fallback) {
        return fallback;
      }

      return children;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gradient-brand overflow-hidden ring-2 ring-white',
          sizes[size],
          className
        )}
        {...props}
      >
        {renderContent()}

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-white',
              statusColors[status],
              statusSizes[size]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
