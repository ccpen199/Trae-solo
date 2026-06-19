import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  type: 'insurance' | 'exam' | 'declaration' | 'contract' | 'warning' | 'auth'
}

type StatusMapping = Record<string, { label: string; className: string }>

const statusMaps: Record<StatusBadgeProps['type'], StatusMapping> = {
  insurance: {
    active: { label: '参保中', className: 'gov-badge-green' },
    suspended: { label: '停缴', className: 'gov-badge-red' },
    transfering: { label: '转移中', className: 'gov-badge-blue' },
  },
  exam: {
    open: { label: '报名中', className: 'gov-badge-green' },
    closed: { label: '已截止', className: 'gov-badge-gray' },
    upcoming: { label: '即将开始', className: 'gov-badge-gold' },
  },
  declaration: {
    pending: { label: '待提交', className: 'gov-badge-gray' },
    submitted: { label: '已提交', className: 'gov-badge-blue' },
    approved: { label: '已通过', className: 'gov-badge-green' },
    rejected: { label: '已驳回', className: 'gov-badge-red' },
    'pre-reviewing': { label: '预审中', className: 'gov-badge-gold' },
    draft: { label: '草稿', className: 'gov-badge-gray' },
  },
  contract: {
    draft: { label: '草稿', className: 'gov-badge-gray' },
    signed: { label: '已签署', className: 'gov-badge-green' },
    notarized: { label: '已公证', className: 'gov-badge-blue' },
    expired: { label: '已过期', className: 'gov-badge-red' },
  },
  warning: {
    active: { label: '待处理', className: 'gov-badge-red' },
    supervised: { label: '督办中', className: 'gov-badge-gold' },
    resolved: { label: '已解决', className: 'gov-badge-green' },
  },
  auth: {
    passed: { label: '通过', className: 'gov-badge-green' },
    failed: { label: '未通过', className: 'gov-badge-red' },
    suspicious: { label: '可疑', className: 'gov-badge-gold' },
  },
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const mapping = statusMaps[type]?.[status]

  if (!mapping) {
    return <span className="gov-badge-gray">{status}</span>
  }

  return (
    <span className={cn(mapping.className)}>
      {mapping.label}
    </span>
  )
}
