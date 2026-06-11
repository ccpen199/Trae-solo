import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: string
  label: string
  variant?: BadgeVariant
}

const variantMap: Record<string, BadgeVariant> = {
  delivered: 'success',
  resolved: 'success',
  issued: 'success',
  picked_up: 'success',
  in_transit: 'info',
  assigned: 'info',
  processing: 'info',
  confirmed: 'info',
  pending: 'warning',
  created: 'warning',
  cancelled: 'neutral',
  returned: 'danger',
  failed: 'danger',
  damage: 'danger',
  lost: 'danger',
  delay: 'warning',
}

export default function StatusBadge({ status, label, variant }: StatusBadgeProps) {
  const v = variant || variantMap[status] || 'neutral'
  const classes = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  }[v]
  return <span className={classes}>{label}</span>
}
