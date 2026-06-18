import { Store, Building2, MessageSquare, FileText, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

type DataSourceType = 'ecommerce' | 'government' | 'complaint' | 'review' | 'sampling';

interface DataSourceTagProps {
  type: DataSourceType;
  className?: string;
}

const sourceConfig: Record<DataSourceType, { label: string; icon: typeof Store; classes: string }> = {
  ecommerce: {
    label: '电商平台',
    icon: Store,
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  government: {
    label: '政府数据',
    icon: Building2,
    classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  complaint: {
    label: '投诉数据',
    icon: MessageSquare,
    classes: 'bg-danger/10 text-danger border-danger/30',
  },
  review: {
    label: '用户评价',
    icon: FileText,
    classes: 'bg-warning/10 text-warning border-warning/30',
  },
  sampling: {
    label: '抽检数据',
    icon: FlaskConical,
    classes: 'bg-primary/10 text-primary border-primary/30',
  },
};

export function DataSourceTag({ type, className }: DataSourceTagProps) {
  const config = sourceConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        config.classes,
        className
      )}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}
