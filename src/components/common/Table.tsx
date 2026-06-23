import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty } from './Empty';

export interface Column<T> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  onRowClick?: (record: T) => void;
}

type SortOrder = 'asc' | 'desc' | null;

export function Table<T extends object>({
  columns,
  data,
  rowKey,
  loading = false,
  pagination = true,
  pageSize = 10,
  className,
  onRowClick,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.dataIndex) return data;
    return [...data].sort((a, b) => {
      const aVal = a[col.dataIndex!];
      const bVal = b[col.dataIndex!];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortOrder, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      const next: SortOrder = sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? null : 'asc';
      setSortOrder(next);
      setSortKey(next ? key : null);
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getRowKey = (record: T, index: number): string =>
    typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey] ?? index);

  const getPageNumbers = (): number[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none hover:bg-gray-100'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'center' && 'justify-center w-full',
                      col.align === 'right' && 'justify-end w-full'
                    )}
                  >
                    {col.title}
                    {col.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp className={cn('-mb-1 h-3 w-3', sortKey === col.key && sortOrder === 'asc' ? 'text-primary' : 'text-gray-300')} />
                        <ChevronDown className={cn('-mt-1 h-3 w-3', sortKey === col.key && sortOrder === 'desc' ? 'text-primary' : 'text-gray-300')} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="py-12">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}><Empty /></td>
              </tr>
            ) : (
              paginatedData.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-gray-50')}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render
                        ? col.render(record, (currentPage - 1) * pageSize + index)
                        : col.dataIndex
                        ? String(record[col.dataIndex] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && sortedData.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-500">共 {sortedData.length} 条，第 {currentPage} / {totalPages} 页</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'min-w-8 rounded-lg px-2 py-1 text-sm font-medium transition-colors',
                  currentPage === page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
