import { ReactNode } from 'react';
import { Camera, Search, ShoppingCart, Heart, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateType = 'default' | 'search' | 'cart' | 'favorites' | 'data';

interface EmptyStateActionObject {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode | EmptyStateActionObject;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<EmptyStateType, ReactNode> = {
  default: <Camera className="w-12 h-12" />,
  search: <Search className="w-12 h-12" />,
  cart: <ShoppingCart className="w-12 h-12" />,
  favorites: <Heart className="w-12 h-12" />,
  data: <FileText className="w-12 h-12" />,
};

const titleMap: Record<EmptyStateType, string> = {
  default: '暂无内容',
  search: '未找到相关内容',
  cart: '购物车是空的',
  favorites: '暂无收藏',
  data: '暂无数据',
};

const descriptionMap: Record<EmptyStateType, string> = {
  default: '还没有任何内容，快来添加吧~',
  search: '换个关键词试试吧',
  cart: '快去挑选心仪的商品吧',
  favorites: '去发现喜欢的内容吧',
  data: '数据正在赶来的路上',
};

export default function EmptyState({
  type = 'default',
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const IconComponent = icon || iconMap[type];
  const displayTitle = title || titleMap[type];
  const displayDescription = description || descriptionMap[type];

  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-20',
  };

  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-paper-100 text-paper-400 mb-4',
          size === 'sm' && 'w-16 h-16',
          size === 'md' && 'w-20 h-20',
          size === 'lg' && 'w-28 h-28'
        )}
      >
        <div className={cn(iconSizeClasses[size])}>{IconComponent}</div>
      </div>

      <h3
        className={cn(
          'font-display font-semibold text-paper-800 mb-2',
          titleSizeClasses[size]
        )}
      >
        {displayTitle}
      </h3>

      <p
        className={cn(
          'text-paper-500 mb-6 max-w-sm',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}
      >
        {displayDescription}
      </p>

      {action && (
        typeof action === 'object' && action !== null && 'label' in (action as any) ? (
          (action as EmptyStateActionObject).href ? (
            <a
              href={(action as EmptyStateActionObject).href}
              className={cn(
                'btn-primary',
                size === 'sm' && 'text-sm px-4 py-2',
                size === 'md' && 'px-5 py-2.5',
                size === 'lg' && 'text-lg px-6 py-3'
              )}
            >
              {(action as EmptyStateActionObject).label}
            </a>
          ) : (
            <button
              onClick={(action as EmptyStateActionObject).onClick}
              className={cn(
                'btn-primary',
                size === 'sm' && 'text-sm px-4 py-2',
                size === 'md' && 'px-5 py-2.5',
                size === 'lg' && 'text-lg px-6 py-3'
              )}
            >
              {(action as EmptyStateActionObject).label}
            </button>
          )
        ) : (
          action as React.ReactNode
        )
      )}
    </div>
  );
}
