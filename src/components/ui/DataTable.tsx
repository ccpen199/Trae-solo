import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Button } from "./Button";
import { Empty } from "./Empty";
import { Skeleton } from "./Skeleton";
import { cn } from "@/utils";

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  ellipsis?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (record: T, index: number) => void;
  rowClassName?: (record: T, index: number) => string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  emptyText?: string;
  emptyDescription?: string;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends object>({
  columns,
  data,
  rowKey = "id" as keyof T,
  loading = false,
  pagination,
  onRowClick,
  rowClassName,
  showSearch = false,
  searchPlaceholder = "搜索...",
  onSearch,
  emptyText = "暂无数据",
  emptyDescription,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchValue, setSearchValue] = useState("");

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return String((record as Record<string, unknown>)[rowKey as string] ?? index);
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue ?? "");
      const bStr = String(bValue ?? "");
      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className={cn("w-full", className)}>
      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.sortable && "cursor-pointer select-none",
                      "whitespace-nowrap"
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1",
                        col.align === "center" && "justify-center w-full",
                        col.align === "right" && "justify-end w-full"
                      )}
                    >
                      {col.title}
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortKey === col.key ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: pagination?.pageSize || 10 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col, j) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton variant="text" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <Empty title={emptyText} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginatedData.map((record, index) => (
                    <motion.tr
                      key={getRowKey(record, index)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        "transition-colors",
                        onRowClick && "cursor-pointer hover:bg-slate-50",
                        rowClassName?.(record, index)
                      )}
                      onClick={() => onRowClick?.(record, index)}
                    >
                      {columns.map((col) => {
                        const value = (record as Record<string, unknown>)[col.dataIndex as string] as T[keyof T];
                        const content: React.ReactNode = col.render
                          ? col.render(value, record, index)
                          : value == null
                            ? ""
                            : String(value);

                        return (
                          <td
                            key={col.key}
                            className={cn(
                              "px-4 py-3 text-sm text-slate-700",
                              col.align === "center" && "text-center",
                              col.align === "right" && "text-right",
                              col.ellipsis &&
                                "max-w-xs truncate whitespace-nowrap"
                            )}
                            title={col.ellipsis ? String(value ?? "") : undefined}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-600">
              共 <span className="font-semibold">{pagination.total}</span> 条记录，
              第 <span className="font-semibold">{pagination.current}</span> /{" "}
              <span className="font-semibold">{totalPages}</span> 页
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pagination.onChange(1, pagination.pageSize)}
                disabled={pagination.current === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  pagination.onChange(pagination.current - 1, pagination.pageSize)
                }
                disabled={pagination.current === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (pagination.current <= 3) {
                  page = i + 1;
                } else if (pagination.current >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = pagination.current - 2 + i;
                }

                return (
                  <Button
                    key={page}
                    variant={pagination.current === page ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => pagination.onChange(page, pagination.pageSize)}
                    className="min-w-8"
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  pagination.onChange(pagination.current + 1, pagination.pageSize)
                }
                disabled={pagination.current === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pagination.onChange(totalPages, pagination.pageSize)}
                disabled={pagination.current === totalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
