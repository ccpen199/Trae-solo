import {
  Inbox,
  FileSearch,
  WifiOff,
  ShieldAlert,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmptyType = 'default' | 'search' | 'network' | 'permission' | 'data';

interface EmptyStateProps {
  type?: EmptyType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const emptyConfig: Record<EmptyType, {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}> = {
  default: {
    icon: Inbox,
    title: '暂无数据',
    description: '当前还没有任何内容，稍后再来看看吧',
    iconColor: 'text-primary-400',
    iconBg: 'bg-primary-500/10',
  },
  search: {
    icon: FileSearch,
    title: '未找到匹配结果',
    description: '试试调整搜索关键词或筛选条件',
    iconColor: 'text-warning-400',
    iconBg: 'bg-warning-500/10',
  },
  network: {
    icon: WifiOff,
    title: '网络连接失败',
    description: '请检查您的网络连接后重试',
    iconColor: 'text-danger-400',
    iconBg: 'bg-danger-500/10',
  },
  permission: {
    icon: ShieldAlert,
    title: '无访问权限',
    description: '您没有权限查看此内容，请联系管理员',
    iconColor: 'text-danger-400',
    iconBg: 'bg-danger-500/10',
  },
  data: {
    icon: Inbox,
    title: '暂无数据',
    description: '开始创建您的第一条数据吧',
    iconColor: 'text-accent-400',
    iconBg: 'bg-accent-500/10',
  },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  icon: CustomIcon,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const config = emptyConfig[type];
  const Icon = CustomIcon || config.icon;

  const sizeConfig = {
    sm: {
      wrapper: 'py-8',
      iconWrapper: 'w-14 h-14',
      icon: 'w-7 h-7',
      title: 'text-base',
      description: 'text-xs',
    },
    md: {
      wrapper: 'py-12',
      iconWrapper: 'w-20 h-20',
      icon: 'w-10 h-10',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      wrapper: 'py-20',
      iconWrapper: 'w-28 h-28',
      icon: 'w-14 h-14',
      title: 'text-xl',
      description: 'text-base',
    },
  }[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeConfig.wrapper,
        className
      )}
    >
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center mb-4',
          sizeConfig.iconWrapper,
          config.iconBg
        )}
      >
        <Icon className={cn(sizeConfig.icon, config.iconColor)} />
      </div>

      <h3 className={cn('font-medium text-white mb-2', sizeConfig.title)}>
        {title || config.title}
      </h3>

      <p className={cn('text-neutral-500 max-w-sm mb-6', sizeConfig.description)}>
        {description || config.description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium transition-all duration-200 hover:from-primary-400 hover:to-primary-500 hover:shadow-glow active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
