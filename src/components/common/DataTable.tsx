import React from 'react';
import { Table, ConfigProvider, type TableProps } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { cn } from '@/lib/utils';

interface DataTableProps<T> extends TableProps<T> {
  className?: string;
  showHeader?: boolean;
}

export function DataTable<T extends object>({
  className,
  showHeader = true,
  ...props
}: DataTableProps<T>) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorBgContainer: 'transparent',
          colorBorderSecondary: 'rgba(148, 163, 184, 0.08)',
          colorBgElevated: 'rgba(30, 41, 59, 0.95)',
          colorText: '#F1F5F9',
          colorTextSecondary: '#94A3B8',
          colorTextTertiary: '#64748B',
          colorTextQuaternary: '#475569',
          colorFillSecondary: 'rgba(255,255,255,0.03)',
          colorFillTertiary: 'rgba(255,255,255,0.02)',
          colorFillQuaternary: 'rgba(255,255,255,0.01)',
          colorPrimary: '#3366FF',
          colorPrimaryHover: '#5889FF',
          colorPrimaryActive: '#1F4AF0',
          borderRadius: 8,
          borderRadiusLG: 12,
          controlOutline: 'rgba(51, 102, 255, 0.2)',
          fontSize: 14,
          fontFamily: '"Noto Sans SC", sans-serif',
        },
        components: {
          Table: {
            headerBg: 'rgba(15, 23, 42, 0.5)',
            headerColor: '#94A3B8',
            rowHoverBg: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(148, 163, 184, 0.08)',
            headerSplitColor: 'transparent',
            footerBg: 'rgba(15, 23, 42, 0.3)',
          },
          Pagination: {
            itemBg: 'transparent',
            itemActiveBg: 'rgba(51, 102, 255, 0.15)',
            itemInputBg: 'rgba(255, 255, 255, 0.05)',
            colorPrimary: '#5889FF',
          },
        },
      }}
    >
      <Table<T>
        {...props}
        showHeader={showHeader}
        className={cn(
          '[&_.ant-table]:!bg-transparent',
          '[&_.ant-table-container]:!bg-transparent',
          '[&_.ant-table-thead>tr>th]:!bg-white/[0.02]',
          '[&_.ant-table-thead>tr>th]:!text-neutral-400',
          '[&_.ant-table-thead>tr>th]:!font-medium',
          '[&_.ant-table-thead>tr>th]:!text-xs',
          '[&_.ant-table-thead>tr>th]:!uppercase',
          '[&_.ant-table-thead>tr>th]:!tracking-wider',
          '[&_.ant-table-thead>tr>th]:!border-b',
          '[&_.ant-table-thead>tr>th]:!border-white/5',
          '[&_.ant-table-thead>tr>th]:!py-3',
          '[&_.ant-table-thead>tr>th:first-child]:!rounded-tl-lg',
          '[&_.ant-table-thead>tr>th:last-child]:!rounded-tr-lg',
          '[&_.ant-table-tbody>tr>td]:!border-b',
          '[&_.ant-table-tbody>tr>td]:!border-white/[0.03]',
          '[&_.ant-table-tbody>tr>td]:!py-4',
          '[&_.ant-table-tbody>tr]:!transition-colors',
          '[&_.ant-table-tbody>tr:hover]:!bg-white/[0.02]',
          '[&_.ant-table-tbody>tr:hover>td]:!bg-transparent',
          '[&_.ant-table-row-expand-icon]:!bg-white/5',
          '[&_.ant-table-row-expand-icon]:!border-white/10',
          '[&_.ant-table-row-expand-icon:hover]:!bg-white/10',
          '[&_.ant-table-empty]:!bg-transparent',
          '[&_.ant-table-cell-row-hover]:!bg-transparent',
          className
        )}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条数据`,
          pageSizeOptions: ['10', '20', '50', '100'],
          className: cn(
            '[&_.ant-pagination-item]:!border-0',
            '[&_.ant-pagination-item]:!bg-transparent',
            '[&_.ant-pagination-item>a]:!text-neutral-400',
            '[&_.ant-pagination-item-active>a]:!text-primary-400',
            '[&_.ant-pagination-item-active]:!bg-primary-500/10',
            '[&_.ant-pagination-item:hover>a]:!text-white',
            '[&_.ant-pagination-item:hover]:!bg-white/5',
            '[&_.ant-pagination-prev>button]:!text-neutral-400',
            '[&_.ant-pagination-next>button]:!text-neutral-400',
            '[&_.ant-pagination-prev>button:hover]:!text-white',
            '[&_.ant-pagination-next>button:hover]:!text-white',
            '[&_.ant-pagination-total-text]:!text-neutral-500',
            '[&_.ant-pagination-options-size-changer]:!bg-white/5',
            '[&_.ant-pagination-options-size-changer]:!border-white/10',
            '[&_.ant-pagination-options-quick-jumper>input]:!bg-white/5',
            '[&_.ant-pagination-options-quick-jumper>input]:!border-white/10',
            '[&_.ant-pagination-options-quick-jumper]:!text-neutral-500'
          ),
          ...props.pagination,
        }}
      />
    </ConfigProvider>
  );
}
