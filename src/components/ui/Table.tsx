import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface TableColumn<T> {
  key: keyof T | string;
  title: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

const TableSkeleton = ({ columns }: { columns: any[] }) => (
  <tbody>
    {Array.from({ length: 5 }).map((_, rowIndex) => (
      <tr key={rowIndex} className="animate-pulse">
        {columns.map((_, colIndex) => (
          <td key={colIndex} className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const TableEmpty = ({ text }: { text: string }) => (
  <tbody>
    <tr>
      <td colSpan={100} className="px-6 py-16">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Package className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">{text}</p>
          <p className="text-sm mt-1">暂无数据</p>
        </div>
      </td>
    </tr>
  </tbody>
);

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  rowKey,
  onRowClick,
  className,
}: TableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (rowKey && row[rowKey]) {
      return String(row[rowKey]);
    }
    return String(index);
  };

  const getCellValue = (row: T, column: TableColumn<T>, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row, index);
    }
    const key = column.key as keyof T;
    return row[key] as React.ReactNode;
  };

  return (
    <div className={cn('overflow-x-auto bg-white rounded-lg shadow', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <TableSkeleton columns={columns} />
          ) : data.length === 0 ? (
            <TableEmpty text={emptyText} />
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn('px-6 py-4 text-sm text-gray-900', column.className)}
                  >
                    {getCellValue(row, column, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
