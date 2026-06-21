import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Empty({ 
  title = '暂无数据', 
  description = '请稍后再试', 
  icon, 
  className,
  action
}: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        {icon || <Package className="w-8 h-8 text-slate-400" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default Empty;
