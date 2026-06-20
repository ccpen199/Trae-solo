import { Breadcrumb, type BreadcrumbProps } from 'antd';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  breadcrumb?: BreadcrumbProps['items'];
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  title,
  breadcrumb,
  subtitle,
  extra,
  className,
  showBack,
  onBack,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb
            className="mb-2"
            separator={<ChevronRight className="w-3 h-3 text-neutral-600" />}
            items={breadcrumb.map((item, index) => ({
              ...item,
              className: cn(
                index === breadcrumb.length - 1
                  ? '!text-neutral-400'
                  : '!text-neutral-500 hover:!text-neutral-300',
                item.className
              ),
            }))}
          />
        )}

        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-serif font-semibold text-white m-0">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {extra && (
        <div className="flex items-center gap-3 flex-wrap">{extra}</div>
      )}
    </div>
  );
}
