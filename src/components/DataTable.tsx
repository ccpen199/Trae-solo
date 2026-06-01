import { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column {
  key: string
  title: string
  dataIndex?: string
  render?: (value: any, record: any, index: number) => ReactNode
  width?: string
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number) => void
  }
  onRowClick?: (record: any) => void
  className?: string
}

export default function DataTable({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
  className,
}: DataTableProps) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  const renderCell = (column: Column, record: any, index: number) => {
    if (column.render) {
      const value = column.dataIndex ? record[column.dataIndex] : record[column.key]
      return column.render(value, record, index)
    }
    const dataKey = column.dataIndex || column.key
    const val = record[dataKey]
    return val != null ? String(val) : "-"
  }

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto" />
                  <p className="mt-2 text-slate-500">加载中...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={record.id ?? index}
                  className={cn(
                    "hover:bg-slate-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-slate-700">
                      {renderCell(column, record, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            共 {pagination.total} 条，第 {pagination.current}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - pagination.current) <= 1)
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-1 text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => pagination.onChange(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm",
                      page === pagination.current
                        ? "bg-sky-500 text-white"
                        : "hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    {page}
                  </button>
                </span>
              ))}
            <button
              disabled={pagination.current >= totalPages}
              onClick={() => pagination.onChange(pagination.current + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
