'use client';

import { memo } from 'react';
import { Ticket } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { CouponTemplate } from '@pet/shared/types';

interface CouponCardProps {
  coupon: CouponTemplate;
  received?: boolean;
  onReceive?: (id: string) => void;
}

export const CouponCard = memo(function CouponCard({
  coupon,
  received = false,
  onReceive,
}: CouponCardProps) {
  const discountLabel =
    coupon.type === 'fixed'
      ? formatPrice(coupon.value)
      : coupon.type === 'percentage'
        ? `${coupon.value}折`
        : '免运费';

  return (
    <div className="flex overflow-hidden rounded-lg border bg-card shadow-sm">
      <div
        className={cn(
          'flex flex-shrink-0 flex-col items-center justify-center px-4 py-3 text-white',
          received ? 'bg-muted' : 'bg-pet-orange',
        )}
        style={{ minWidth: 90 }}
      >
        <span className="text-2xl font-bold">{discountLabel}</span>
        {coupon.type !== 'shipping' && coupon.minAmount > 0 && (
          <span className="mt-0.5 text-[10px] opacity-90">
            满{coupon.minAmount}可用
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-center gap-1">
            <Ticket className="h-3.5 w-3.5 text-pet-orange" />
            <h4 className="text-sm font-medium text-foreground">{coupon.name}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {coupon.scope === 'all'
              ? '全场通用'
              : coupon.scope === 'category'
                ? '指定分类可用'
                : '指定商品可用'}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {coupon.durationType === 'fixed'
              ? `${coupon.validFrom} - ${coupon.validTo}`
              : `领取后${coupon.durationDays}天内有效`}
          </span>
          <button
            disabled={received || coupon.receivedCount >= coupon.totalQuantity}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              received || coupon.receivedCount >= coupon.totalQuantity
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-pet-orange text-white hover:bg-pet-coral',
            )}
            onClick={() => onReceive?.(coupon.id)}
          >
            {received ? '已领取' : coupon.receivedCount >= coupon.totalQuantity ? '已领完' : '领取'}
          </button>
        </div>
      </div>
    </div>
  );
});
