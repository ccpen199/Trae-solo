import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  src?: string;
  name?: string;
  online?: boolean;
  onClick?: () => void;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const onlineSizeClasses: Record<AvatarSize, string> = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'md', src, name, online = false, onClick, ...props }, ref) => {
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getColorFromName = (name: string) => {
      const colors = [
        'from-westlake-400 to-westlake-600',
        'from-honghua-400 to-honghua-600',
        'from-chaojing-400 to-chaojing-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-orange-400 to-orange-600',
      ];
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      return colors[index];
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br overflow-hidden flex-shrink-0',
          onClick && 'cursor-pointer',
          sizeClasses[size],
          getColorFromName(name || 'user'),
          className
        )}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.95 } : undefined}
        {...props as any}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'avatar'}
            className="w-full h-full object-cover"
          />
        ) : name ? (
          <span className="text-white font-semibold">{getInitials(name)}</span>
        ) : (
          <User className="text-white w-1/2 h-1/2" />
        )}
        {online && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full bg-honghua-500 border-2 border-white',
              onlineSizeClasses[size]
            )}
          />
        )}
      </motion.div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
