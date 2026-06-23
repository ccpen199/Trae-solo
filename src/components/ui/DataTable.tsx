import type { ReactNode, ThHTMLAttributes } from 'react'
import { cn } from '../../utils'

interface Column<T> {
  key: string
  title: string
  render?: (row: T, index: number) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey?: (row: T, index: number) => string
  emptyText?: string
  hover?: boolean
  compact?: boolean
}

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  emptyText = '暂无数据',
  hover = true,
  compact = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-logistics-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 font-medium text-logistics-muted',
                  compact ? 'py-2 text-xs' : 'py-3 text-sm',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-logistics-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                className={cn(
                  'border-b border-logistics-border/50 transition-colors',
                  hover && 'hover:bg-logistics-border/20'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 text-logistics-text',
                      compact ? 'py-2.5 text-sm' : 'py-3.5 text-sm',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render ? col.render(row, idx) : (Reflect.get(row, col.key) as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
