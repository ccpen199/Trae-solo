type StatusCategory = 'order' | 'inspection' | 'settlement' | 'logistics';

const STATUS_MAP: Record<StatusCategory, Record<string, { label: string; color: string }>> = {
  order: {
    pending: { label: '待派单', color: 'bg-yellow-100 text-yellow-700' },
    dispatched: { label: '已派单', color: 'bg-blue-100 text-blue-700' },
    picked_up: { label: '已取件', color: 'bg-indigo-100 text-indigo-700' },
    inspecting: { label: '质检中', color: 'bg-purple-100 text-purple-700' },
    priced: { label: '已估价', color: 'bg-mint-100 text-forest-600' },
    confirmed: { label: '已确认', color: 'bg-forest-100 text-forest-700' },
    settled: { label: '已结算', color: 'bg-green-100 text-green-700' },
    donated: { label: '已捐赠', color: 'bg-accent-light/30 text-accent-dark' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  },
  inspection: {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    ai_screening: { label: 'AI初筛中', color: 'bg-blue-100 text-blue-700' },
    manual_check: { label: '人工质检', color: 'bg-purple-100 text-purple-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    rejected: { label: '不合格', color: 'bg-red-100 text-red-700' },
  },
  settlement: {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    failed: { label: '失败', color: 'bg-red-100 text-red-700' },
  },
  logistics: {
    dispatched: { label: '已派单', color: 'bg-blue-100 text-blue-700' },
    picking_up: { label: '取件中', color: 'bg-yellow-100 text-yellow-700' },
    picked_up: { label: '已取件', color: 'bg-indigo-100 text-indigo-700' },
    in_transit: { label: '运输中', color: 'bg-purple-100 text-purple-700' },
    delivered: { label: '已送达', color: 'bg-green-100 text-green-700' },
  },
};

interface StatusBadgeProps {
  status: string;
  category: StatusCategory;
}

export default function StatusBadge({ status, category }: StatusBadgeProps) {
  const config = STATUS_MAP[category]?.[status];
  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
