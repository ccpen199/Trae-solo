import { PACKAGE_STATUS_MAP, TASK_STATUS_MAP, SETTLEMENT_STATUS_MAP, ALERT_LEVEL_MAP, SHOP_ORDER_STATUS_MAP } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  inbound: 'bg-blue-100 text-blue-700',
  stored: 'bg-indigo-100 text-indigo-700',
  outbound: 'bg-cyan-100 text-cyan-700',
  signed: 'bg-green-100 text-green-700',
  exception: 'bg-red-100 text-red-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  confirmed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
  active: 'bg-red-100 text-red-700',
  resolved: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const LABEL_MAPS: Record<string, Record<string, string>> = {
  package: PACKAGE_STATUS_MAP,
  task: TASK_STATUS_MAP,
  settlement: SETTLEMENT_STATUS_MAP,
  alert: ALERT_LEVEL_MAP,
  shopOrder: SHOP_ORDER_STATUS_MAP,
};

interface StatusBadgeProps {
  status: string;
  type?: 'package' | 'task' | 'settlement' | 'alert' | 'shopOrder';
}

export default function StatusBadge({ status, type = 'package' }: StatusBadgeProps) {
  const label = LABEL_MAPS[type]?.[status] || status;
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
