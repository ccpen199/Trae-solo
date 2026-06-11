'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Phone,
  MessageCircle,
  Truck,
  Copy,
} from 'lucide-react';
import { useOrder } from '@/hooks/use-shop';
import { OrderStatusBar } from '@/components/shop/order-status-bar';
import { formatPrice } from '@/lib/utils';
import { OrderStatus, PaymentMethod } from '@pet/shared/enums';
import api, { ENDPOINTS } from '@/lib/api';

const PAYMENT_LABELS: Record<string, string> = {
  [PaymentMethod.ALIPAY]: '支付宝',
  [PaymentMethod.WECHAT]: '微信支付',
  [PaymentMethod.BALANCE]: '余额支付',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(params.id);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    try {
      await api.post(ENDPOINTS.order.cancel(), { orderId: order.id });
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  }, [order]);

  const handleConfirmReceive = useCallback(async () => {
    if (!order) return;
    try {
      await api.post(ENDPOINTS.order.confirmReceive(), { orderId: order.id });
    } catch (error) {
      console.error('Confirm receive failed:', error);
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">订单不存在</p>
        <Link href="/order" className="mt-4 text-pet-orange hover:text-pet-coral">
          返回订单列表
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/order" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          返回订单
        </Link>
      </div>

      <OrderStatusBar currentStatus={order.status} className="mb-4" />

      {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) && (
        <div className="mb-4 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-pet-teal" />
            <h3 className="text-sm font-medium text-foreground">物流信息</h3>
          </div>
          {order.trackingCompany && (
            <p className="mt-2 text-sm text-muted-foreground">
              {order.trackingCompany}：{order.trackingNo}
              <button
                className="ml-2 inline-flex text-pet-orange hover:text-pet-coral"
                onClick={() => navigator.clipboard.writeText(order.trackingNo || '')}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </p>
          )}
        </div>
      )}

      <div className="mb-4 rounded-lg border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">收货地址</h3>
        <div className="text-sm text-muted-foreground">
          <p>{order.shippingAddress.name} {order.shippingAddress.phone}</p>
          <p>
            {order.shippingAddress.province}{order.shippingAddress.city}
            {order.shippingAddress.district} {order.shippingAddress.detail}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">商品清单</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
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
                  <span className="text-sm text-foreground">{formatPrice(item.price)}</span>
                  <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">订单信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">订单号</span>
            <span className="text-foreground">
              {order.orderNo}
              <button
                className="ml-2 inline-flex text-pet-orange hover:text-pet-coral"
                onClick={() => navigator.clipboard.writeText(order.orderNo)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">下单时间</span>
            <span className="text-foreground">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          {order.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">支付方式</span>
              <span className="text-foreground">{PAYMENT_LABELS[order.paymentMethod]}</span>
            </div>
          )}
          {order.remark && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">备注</span>
              <span className="text-foreground">{order.remark}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">商品总额</span>
              <span className="text-foreground">{formatPrice(order.totalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">优惠金额</span>
                <span className="text-pet-orange">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">运费</span>
                <span className="text-foreground">{formatPrice(order.shippingFee)}</span>
              </div>
            )}
            {order.pointUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">积分抵扣</span>
                <span className="text-pet-orange">-{formatPrice(order.pointUsed / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span className="text-foreground">实付金额</span>
              <span className="text-lg text-pet-orange">{formatPrice(order.actualAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-8">
        {order.status === OrderStatus.PENDING_PAYMENT && (
          <>
            <button
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={handleCancel}
            >
              取消订单
            </button>
            <button className="flex-1 rounded-lg bg-pet-orange py-2.5 text-sm font-medium text-white hover:bg-pet-coral">
              立即付款
            </button>
          </>
        )}
        {order.status === OrderStatus.SHIPPED && (
          <button
            className="flex-1 rounded-lg bg-pet-orange py-2.5 text-sm font-medium text-white hover:bg-pet-coral"
            onClick={handleConfirmReceive}
          >
            确认收货
          </button>
        )}
        {order.status === OrderStatus.COMPLETED && (
          <>
            <button className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
              再次购买
            </button>
            <button className="flex-1 rounded-lg bg-pet-orange py-2.5 text-sm font-medium text-white hover:bg-pet-coral">
              去评价
            </button>
          </>
        )}
        <button className="flex items-center justify-center gap-1 rounded-lg border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
          <Phone className="h-4 w-4" />
          联系客服
        </button>
      </div>
    </div>
  );
}
