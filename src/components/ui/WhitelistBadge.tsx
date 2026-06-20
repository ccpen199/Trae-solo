import { cn } from '@/lib/utils';
import type { WhitelistStatus } from '@shared/types';

const statusConfig: Record<WhitelistStatus, { bg: string; text: string; label: string }> = {
  whitelist: { bg: 'bg-success-50 border-success-500', text: 'text-success-700', label: '白名单' },
  graylist: { bg: 'bg-gray-50 border-gray-400', text: 'text-gray-700', label: '灰名单' },
  blacklist: { bg: 'bg-danger-50 border-danger-500', text: 'text-danger-700', label: '黑名单' },
};

interface Props {
  status: WhitelistStatus;
  className?: string;
}

export default function WhitelistBadge({ status, className }: Props) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border',
      config.bg,
      config.text,
      className
    )}>
      {config.label}
    </span>
  );
}
