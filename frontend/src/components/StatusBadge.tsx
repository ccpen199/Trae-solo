import { TASK_STATUS_MAP } from '../types';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-50 text-blue-600',
  bidding: 'bg-indigo-50 text-indigo-600',
  selected: 'bg-purple-50 text-purple-600',
  in_progress: 'bg-amber-50 text-amber-600',
  reviewing: 'bg-cyan-50 text-cyan-600',
  completed: 'bg-green-50 text-green-600',
  disputed: 'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-50 text-yellow-600',
  resolved: 'bg-green-50 text-green-600',
  approved: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
};

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  const label = TASK_STATUS_MAP[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
