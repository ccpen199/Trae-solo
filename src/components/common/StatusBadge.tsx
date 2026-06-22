import { classNames } from '@/utils/formatters';
import {
  colorForBillStatus,
  colorForPropertyStatus,
  colorForTenantStatus,
} from '@/utils/formatters';
import {
  BILL_STATUS_LABEL,
  PROPERTY_STATUS_LABEL,
  TENANT_STATUS_LABEL,
} from '@/types';

type Variant = 'property' | 'tenant' | 'bill' | 'custom';

export interface StatusBadgeProps {
  variant?: Variant;
  status?: string;
  label?: string;
  className?: string;
}

export default function StatusBadge({
  variant = 'custom',
  status,
  label,
  className,
}: StatusBadgeProps) {
  const s = status ?? '';
  const l = label ?? resolveLabel(variant, s);
  const cls = resolveClass(variant, s);

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
        cls,
        className
      )}
    >
      <span
        className={classNames(
          'w-1.5 h-1.5 rounded-full',
          variant === 'property' && s === 'rented' && 'bg-emerald-500',
          variant === 'property' && s === 'vacant' && 'bg-amber-500',
          variant === 'property' && s === 'maintenance' && 'bg-sky-500',
          variant === 'property' && s === 'sold' && 'bg-slate-400',
          variant === 'tenant' && s === 'living' && 'bg-emerald-500',
          variant === 'tenant' && s === 'moved' && 'bg-slate-400',
          variant === 'tenant' && s === 'pending' && 'bg-amber-500',
          variant === 'bill' && s === 'paid' && 'bg-emerald-500',
          variant === 'bill' && s === 'pending' && 'bg-slate-400',
          variant === 'bill' && s === 'overdue' && 'bg-rose-500 animate-pulse',
          variant === 'bill' && s === 'partial' && 'bg-amber-500',
          variant === 'bill' && s === 'cancelled' && 'bg-slate-300'
        )}
      />
      {l}
    </span>
  );
}

function resolveLabel(v: Variant, s: string): string {
  if (v === 'property') return PROPERTY_STATUS_LABEL[s as keyof typeof PROPERTY_STATUS_LABEL] ?? s;
  if (v === 'tenant') return TENANT_STATUS_LABEL[s as keyof typeof TENANT_STATUS_LABEL] ?? s;
  if (v === 'bill') return BILL_STATUS_LABEL[s as keyof typeof BILL_STATUS_LABEL] ?? s;
  return s;
}

function resolveClass(v: Variant, s: string): string {
  if (v === 'property') return colorForPropertyStatus(s);
  if (v === 'tenant') return colorForTenantStatus(s);
  if (v === 'bill') return colorForBillStatus(s);
  return 'bg-slate-100 text-slate-600';
}
