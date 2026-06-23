import { Home, ChevronRight } from 'lucide-react'
import { cn } from '../../utils'
import type { ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: typeof Home
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm text-logistics-muted', className)}>
      {items.map((item, idx) => {
        const Icon = item.icon
        const isLast = idx === items.length - 1
        return (
          <span key={idx} className="flex items-center gap-1">
            <span className={cn('flex items-center gap-1', isLast && 'text-logistics-text font-medium')}>
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {item.label}
            </span>
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-logistics-border" />}
          </span>
        )
      })}
    </nav>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} className="mb-3" />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-logistics-text">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-logistics-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
