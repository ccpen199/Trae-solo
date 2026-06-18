import { Card } from 'antd-mobile'
import './index.css'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

function EmptyState({ icon = '📭', title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
    </div>
  )
}

export default EmptyState
