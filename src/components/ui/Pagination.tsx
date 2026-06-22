import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showJumpTo?: boolean;
  disabled?: boolean;
  siblingCount?: number;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showJumpTo = false,
  disabled = false,
  siblingCount = 1,
  className,
}) => {
  const [jumpValue, setJumpValue] = React.useState('');

  const getPageNumbers = (): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + 1 + i
      );
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return [];
  };

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const handleJump = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue('');
    }
  };

  const pages = getPageNumbers();

  const renderPageButton = (page: number | string, index: number) => {
    if (page === '...') {
      return (
        <span
          key={`ellipsis-${index}`}
          className="flex items-center justify-center w-9 h-9 text-paper-500"
        >
          ...
        </span>
      );
    }

    const isActive = page === currentPage;

    return (
      <button
        key={page}
        onClick={() => handlePageChange(page as number)}
        disabled={disabled || isActive}
        className={cn(
          'flex items-center justify-center w-9 h-9 text-sm font-medium rounded-md',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          isActive
            ? 'bg-gradient-brand text-white shadow-soft'
            : 'text-paper-700 hover:bg-paper-100',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {page}
      </button>
    );
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showFirstLast && (
        <button
          onClick={() => handlePageChange(1)}
          disabled={disabled || currentPage === 1}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md',
            'text-paper-600 hover:bg-paper-100',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md',
          'text-paper-600 hover:bg-paper-100',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1">
        {pages.map(renderPageButton)}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md',
          'text-paper-600 hover:bg-paper-100',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {showFirstLast && (
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md',
            'text-paper-600 hover:bg-paper-100',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}

      {showJumpTo && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-paper-600">跳至</span>
          <input
            type="number"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            min={1}
            max={totalPages}
            className="w-16 h-9 px-2 text-sm text-center rounded-md border border-paper-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
          <span className="text-sm text-paper-600">页</span>
        </div>
      )}
    </div>
  );
};

Pagination.displayName = 'Pagination';

export { Pagination };
