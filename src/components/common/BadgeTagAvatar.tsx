import * as React from 'react';
import { cn } from '@/utils/common';
import { getInitials } from '@/utils/common';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  accent: 'bg-accent-100 text-accent-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs rounded-full',
  md: 'px-2.5 py-1 text-sm rounded-full',
  lg: 'px-3 py-1.5 text-base rounded-full',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium', variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
}

type TagVariant = 'primary' | 'mint' | 'accent' | 'neutral';

const tagVariantClasses: Record<TagVariant, string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  mint: 'bg-mint-50 text-mint-700 border-mint-200',
  accent: 'bg-accent-50 text-accent-700 border-accent-200',
  neutral: 'bg-neutral-50 text-neutral-600 border-neutral-200',
};

export interface TagProps {
  variant?: TagVariant;
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Tag({ variant = 'primary', className, children, onClose }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 text-sm font-medium border rounded-lg',
        'transition-colors duration-200',
        tagVariantClasses[variant],
        className
      )}
    >
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1.5 hover:text-current opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}

const avatarSizeClasses: Record<string, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-neutral-400',
  busy: 'bg-red-500',
};

export function Avatar({ src, alt = '', name, size = 'md', status, className, ...props }: AvatarProps) {
  return (
    <div className={cn('relative inline-block', className)} {...props}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center text-white font-semibold',
          avatarSizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          name ? getInitials(name) : <span>?</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusColors[status],
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: { src?: string; name: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="border-2 border-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center text-neutral-600 font-medium',
            avatarSizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
