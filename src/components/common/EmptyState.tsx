import type { ReactNode } from 'react';
import { FileX } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title = '暂无数据',
  description = '添加第一条记录开始使用',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5 text-slate-300">
        {icon ?? <FileX className="w-9 h-9" />}
      </div>
      <h3 className="font-serif text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
