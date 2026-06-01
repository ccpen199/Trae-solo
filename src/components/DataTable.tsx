import { Loader2, Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  footerRender?: (data: T[]) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  emptyText?: string
  showFooter?: boolean
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  onRowClick,
  emptyText = '暂无数据',
  showFooter = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Inbox className="w-10 h-10 mb-2" />
        <span className="text-sm">{emptyText}</span>
      </div>
    )
  }

  const alignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={alignClass(col.align)}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className={alignClass(col.align)}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {showFooter && data.length > 0 && (
          <tfoot className="bg-slate-50 font-semibold">
            <tr>
              {columns.map((col) => (
                <td key={col.key} className={alignClass(col.align)}>
                  {col.footerRender ? col.footerRender(data) : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
