'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@pet/shared/enums';

interface OrderStatusBarProps {
  currentStatus: OrderStatus;
  className?: string;
}

const ORDER_STATUS_STEPS = [
  { status: OrderStatus.PENDING_PAYMENT, label: '待付款', icon: '💳' },
  { status: OrderStatus.PENDING_CONFIRM, label: '待确认', icon: '📋' },
  { status: OrderStatus.PENDING_SHIPMENT, label: '待发货', icon: '📦' },
  { status: OrderStatus.SHIPPED, label: '已发货', icon: '🚚' },
  { status: OrderStatus.DELIVERED, label: '已送达', icon: '📍' },
  { status: OrderStatus.COMPLETED, label: '已完成', icon: '✅' },
];

const STATUS_INDEX: Record<string, number> = {
  [OrderStatus.PENDING_PAYMENT]: 0,
  [OrderStatus.PENDING_CONFIRM]: 1,
  [OrderStatus.PENDING_SHIPMENT]: 2,
  [OrderStatus.SHIPPED]: 3,
  [OrderStatus.DELIVERED]: 4,
  [OrderStatus.COMPLETED]: 5,
  [OrderStatus.CANCELLED]: -1,
  [OrderStatus.REFUNDING]: -1,
  [OrderStatus.REFUNDED]: -1,
};

export const OrderStatusBar = memo(function OrderStatusBar({
  currentStatus,
  className,
}: OrderStatusBarProps) {
  const currentIndex = STATUS_INDEX[currentStatus] ?? -1;
  const isCancelled = currentIndex === -1;

  if (isCancelled) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)}>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">
            {currentStatus === OrderStatus.CANCELLED ? '❌' : '🔄'}
          </span>
          <span className="text-sm font-medium text-destructive">
            {currentStatus === OrderStatus.CANCELLED ? '订单已取消' : '退款处理中'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-center justify-between">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                    isCompleted
                      ? 'bg-pet-teal text-white'
                      : isCurrent
                        ? 'bg-pet-orange text-white animate-pulse'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <span
                  className={cn(
                    'mt-1 text-[10px]',
                    isCurrent ? 'font-medium text-pet-orange' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < ORDER_STATUS_STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-0.5 flex-1',
                    index < currentIndex ? 'bg-pet-teal' : 'bg-muted',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
