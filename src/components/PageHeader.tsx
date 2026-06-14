import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from 'antd';
import { cn } from '@/lib/utils';

interface PageHeaderAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: PageHeaderAction[];
  extra?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  breadcrumb?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  icon,
  actions,
  extra,
  showBack = false,
  onBack,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {showBack && (
            <Button
              type="text"
              icon={<ChevronLeft className="h-5 w-5" />}
              onClick={onBack}
              className="!mr-1 !px-2"
            />
          )}

          {icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-50 text-medical-600">
              {icon}
            </div>
          )}

          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extra}
          {actions?.map((action) => (
            <Button
              key={action.key}
              type={action.type || 'default'}
              icon={action.icon}
              onClick={action.onClick}
              danger={action.danger}
              disabled={action.disabled}
              loading={action.loading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
