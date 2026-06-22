import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
  showHome?: boolean;
}

export default function Breadcrumb({
  items = [],
  separator,
  className,
  showHome = true,
}: BreadcrumbProps) {
  const defaultItems: BreadcrumbItem[] = showHome
    ? [{ label: '首页', path: '/' }, ...items]
    : items;

  const Separator = separator || (
    <ChevronRight className="w-4 h-4 text-paper-400" />
  );

  return (
    <nav
      aria-label="breadcrumb"
      className={cn('flex items-center gap-1.5 text-sm', className)}
    >
      {defaultItems.map((item, index) => {
        const isLast = index === defaultItems.length - 1;
        const isHome = index === 0 && showHome;

        return (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-paper-300">{Separator}</span>}
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="flex items-center gap-1 text-paper-500 hover:text-brand-500 transition-colors"
              >
                {isHome && <Home className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  'flex items-center gap-1',
                  isLast ? 'text-paper-800 font-medium' : 'text-paper-500'
                )}
              >
                {isHome && <Home className="w-4 h-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
