import { ClipboardX, PackageSearch, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  type?: 'orders' | 'search' | 'default';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const iconMap = {
  orders: ClipboardX,
  search: PackageSearch,
  default: Inbox,
};

export default function Empty({
  type = 'default',
  title,
  description,
  action,
  className,
}: EmptyProps) {
  const Icon = iconMap[type];

  const defaultTitle = {
    orders: '暂无订单',
    search: '未找到相关结果',
    default: '暂无内容',
  };

  const defaultDescription = {
    orders: '快去下单体验我们的优质家政服务吧',
    search: '换个关键词或筛选条件试试看',
    default: '这里还没有任何内容',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-50 scale-150" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <Icon className="w-12 h-12 text-primary-400" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-secondary-800 mb-2">
        {title || defaultTitle[type]}
      </h3>
      <p className="text-secondary-500 text-center max-w-sm mb-6">
        {description || defaultDescription[type]}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
