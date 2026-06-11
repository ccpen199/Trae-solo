import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { TableColumn, TableAction, PaginationParams } from '@/types';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: TableAction<T>[];
  pagination?: PaginationParams;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((row: T) => string);
  className?: string;
}

function DataTableInner<T extends object>({
  columns,
  data,
  actions,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  onRowClick,
  loading = false,
  emptyText = '暂无数据',
  rowKey = 'id' as keyof T,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    if (!sortKey || !onSort) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortKey, sortOrder, onSort]);

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    const val = (row as Record<string, unknown>)[rowKey as string];
    return val ? String(val) : String(index);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    onSort?.(key, sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className={cn('bg-space-blue-800 border border-space-blue-600 rounded-xl overflow-hidden', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="bg-space-blue-900/50 border-b border-space-blue-600">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-gray-200 select-none',
                    col.width && `w-[${col.width}]`
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.title}
                    {col.sortable && sortKey === col.key && (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="w-3 h-3 text-amber-accent-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-amber-accent-400" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-space-blue-700">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-accent-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-space-blue-700/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3.5 text-sm text-gray-200"
                    >
                      {col.render
                        ? col.render((row as Record<string, unknown>)[col.key as string], row, rowIndex)
                        : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu === getRowKey(row, rowIndex)
                                ? null
                                : getRowKey(row, rowIndex)
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-space-blue-600 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openActionMenu === getRowKey(row, rowIndex) && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenActionMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-32 bg-space-blue-700 border border-space-blue-500 rounded-lg shadow-xl z-20 py-1 animate-slide-up">
                              {actions.map((action) => (
                                <button
                                  key={action.key}
                                  onClick={() => {
                                    action.onClick(row);
                                    setOpenActionMenu(null);
                                  }}
                                  className={cn(
                                    'w-full px-3 py-2 text-left text-sm transition-colors',
                                    action.variant === 'danger'
                                      ? 'text-danger-400 hover:bg-danger-500/10 hover:text-danger-300'
                                      : 'text-gray-300 hover:bg-space-blue-600 hover:text-gray-100'
                                  )}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-space-blue-600">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>共 {pagination.total} 条</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="bg-space-blue-700 border border-space-blue-500 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/50"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-space-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm text-gray-200">
              {pagination.page} / {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-space-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;

export default DataTable;
