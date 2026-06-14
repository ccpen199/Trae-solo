import React from 'react';
import { Breadcrumb, Space, Typography } from 'antd';
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb';
import { cn } from '@/lib/utils';
import BreadcrumbNav from '@/components/layout/Breadcrumb';

const { Title } = Typography;

export interface PageContainerProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  breadcrumb?: BreadcrumbItemType[];
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showBreadcrumb?: boolean;
  ghost?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subTitle,
  extra,
  breadcrumb,
  children,
  className,
  contentClassName,
  showBreadcrumb = true,
  ghost = false,
}) => {
  return (
    <div className={cn('min-h-full', ghost ? '' : 'bg-neutral-50 dark:bg-neutral-900', className)}>
      <div className={cn(ghost ? '' : 'px-6 py-4', 'bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700')}>
        {showBreadcrumb && (breadcrumb ? (
          <Breadcrumb items={breadcrumb} className="mb-3" />
        ) : (
          <BreadcrumbNav className="mb-3" />
        ))}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <Title level={4} className="!m-0 !text-neutral-800 dark:!text-white">
                {title}
              </Title>
            )}
            {subTitle && (
              <div className="text-sm text-neutral-500 mt-1">{subTitle}</div>
            )}
          </div>
          {extra && <Space>{extra}</Space>}
        </div>
      </div>
      <div className={cn(ghost ? '' : 'p-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
