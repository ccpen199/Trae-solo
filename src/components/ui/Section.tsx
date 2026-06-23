import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, subtitle, actions, children, className = '' }: SectionProps) {
  return (
    <div className={`panel overflow-hidden ${className}`}>
      <div className="panel-header">
        <div>
          <h3 className="text-base font-semibold text-logistics-text">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-logistics-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
