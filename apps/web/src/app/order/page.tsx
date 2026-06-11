'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { useOrders } from '@/hooks/use-shop';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@pet/shared/enums';
import type { Order } from '@pet/shared/types';

const TAB_LIST = [
  { key: 'all', label: '全部', status: undefined },
  { key: 'pending_payment', label: '待付款', status: OrderStatus.PENDING_PAYMENT },
  { key: 'pending_shipment', label: '待发货', status: OrderStatus.PENDING_SHIPMENT },
  { key: 'shipped', label: '待收货', status: OrderStatus.SHIPPED },
  { key: 'completed', label: '已完成', status: OrderStatus.COMPLETED },
] as const;

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING_PAYMENT]: '待付款',
  [OrderStatus.PENDING_CONFIRM]: '待确认',
  [OrderStatus.PENDING_SHIPMENT]: '待发货',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.DELIVERED]: '已送达',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDING]: '退款中',
  [OrderStatus.REFUNDED]: '已退款',
};

export default function OrderListPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const activeStatus = TAB_LIST.find((t) => t.key === activeTab)?.status;

  const { data: ordersData, isLoading } = useOrders(
    activeStatus ? { status: activeStatus } : undefined,
  );

  const orders = ordersData?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">我的订单</h1>
      </div>

      <div className="mb-4 flex border-b">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex-1 border-b-2 px-2 py-3 text-center text-sm transition-colors',
              activeTab === tab.key
                ? 'border-pet-orange font-medium text-pet-orange'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
              <div className="h-4 w-1/4 rounded bg-muted" />
              <div className="mt-3 h-16 rounded bg-muted" />
              <div className="mt-3 h-4 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : !orders.length ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <ClipboardList className="mb-3 h-16 w-16" />
          <p className="text-lg">暂无订单</p>
          <p className="mt-1 text-sm">快去商城挑选商品吧</p>
          <Link
            href="/shop"
            className="mt-4 rounded-lg bg-pet-orange px-6 py-2 text-sm text-white hover:bg-pet-coral"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="block rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  订单号：{order.orderNo}
                </span>
                <span className="text-sm font-medium text-pet-orange">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="space-y-2">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Object.entries(item.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' / ')}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm text-foreground">¥{item.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    共{order.items.length}件商品，查看全部
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  共{order.items.length}件商品
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    实付：<span className="font-medium text-foreground">
                      ¥{order.actualAmount.toFixed(2)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
