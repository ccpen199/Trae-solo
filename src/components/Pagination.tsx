import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  className?: string;
}

export default function Pagination({ page, pageSize, total, onChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (page <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
    }
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="text-sm text-vms-text-muted">
        显示 {start} - {end}，共 {total} 条
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1, pageSize)}
          className="p-2 rounded-lg border border-vms-border hover:bg-vms-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-vms-text" />
        </button>
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={i} className="px-2 text-vms-text-muted">...</span>
          ) : (
            <button
              key={i}
              onClick={() => onChange(p, pageSize)}
              className={cn(
                "min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors",
                page === p
                  ? "bg-vms-primary text-white shadow-vms-glow"
                  : "hover:bg-vms-surface-2 text-vms-text-muted hover:text-vms-text"
              )}
            >
              {p}
            </button>
          )
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1, pageSize)}
          className="p-2 rounded-lg border border-vms-border hover:bg-vms-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-vms-text" />
        </button>
        <select
          value={pageSize}
          onChange={(e) => onChange(1, parseInt(e.target.value))}
          className="ml-3 px-2 py-1.5 rounded-lg bg-vms-surface-2 border border-vms-border text-sm text-vms-text focus:outline-none focus:border-vms-primary"
        >
          <option value={10}>10条/页</option>
          <option value={20}>20条/页</option>
          <option value={50}>50条/页</option>
        </select>
      </div>
    </div>
  );
}
