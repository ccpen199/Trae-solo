import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-3 text-sm text-vms-text-muted">
          <Link to="/dashboard" className="hover:text-vms-primary transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
          </Link>
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {item.path ? (
                <Link to={item.path} className="hover:text-vms-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-vms-text">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-wide">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-vms-text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
