import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { useState } from "react";

export interface DataTableColumn<T> {
  key: string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  selectable?: boolean;
  rowKey?: keyof T;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  selectable = false,
  rowKey,
  emptyText = "暂无数据",
  onRowClick,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const next = new Set(selectedRows);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(data.map((_, i) => i)));
  };

  const getKey = (row: T, index: number) => (rowKey ? String(row[rowKey]) : String(index));

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-ink-400"
      >
        <Inbox className="mb-3 h-12 w-12 opacity-50" />
        <p className="text-sm">{emptyText}</p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 bg-ink-850/95 backdrop-blur">
              {selectable && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-ink-600 bg-ink-800 text-gold-500 focus:ring-gold-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-4 py-3 font-semibold text-ink-200 ${
                    col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <motion.tr
                key={getKey(row, index)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-white/[0.04] transition-colors ${
                  index % 2 === 0 ? "bg-ink-900/40" : "bg-transparent"
                } ${onRowClick ? "cursor-pointer hover:bg-gold-500/5" : ""} ${
                  selectedRows.has(index) ? "bg-gold-500/10" : ""
                }`}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(index)}
                      onChange={() => toggleRow(index)}
                      className="h-4 w-4 rounded border-ink-600 bg-ink-800 text-gold-500 focus:ring-gold-500"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-ink-200 ${
                      col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.render ? col.render(row, index) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
