import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  selectable?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  idKey?: keyof T;
  emptyText?: string;
}

export default function DataTable<T extends { id?: number }>({
  columns,
  data,
  loading = false,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  idKey = 'id',
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const totalPages = Math.ceil(total / pageSize);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      const ids = data.map((item) => item[idKey] as number).filter(Boolean);
      onSelectionChange(ids);
    }
  };

  const handleSelectItem = (id: number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const renderPagination = () => {
    if (!onPageChange) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            共 {total} 条记录
          </span>
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="input w-auto text-sm"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
              <option value={100}>100 条/页</option>
            </select>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-700 px-3">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || totalPages === 0}
            className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages || totalPages === 0}
            className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 text-left w-12">
                    <div className="w-4 h-4 bg-gray-200 animate-pulse" />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    style={{ width: col.width }}
                  >
                    <div className="h-4 bg-gray-200 animate-pulse rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {selectable && (
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-gray-200 animate-pulse" />
                    </td>
                  )}
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(String(col.key))}
                      className="flex items-center gap-1 hover:text-navy-900"
                    >
                      {col.header}
                      {sortKey === col.key && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={String(item[idKey] ?? index)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item[idKey] as number)}
                        onChange={() => handleSelectItem(item[idKey] as number)}
                        className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-gray-900">
                      {col.render
                        ? col.render(item)
                        : (item[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}
