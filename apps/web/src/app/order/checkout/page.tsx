'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Ticket, Coins, CreditCard, Wallet } from 'lucide-react';
import { useAvailableCoupons } from '@/hooks/use-shop';
import { AddressSelector } from '@/components/shop/address-selector';
import { cn, formatPrice } from '@/lib/utils';
import api, { ENDPOINTS } from '@/lib/api';
import type { OrderAddress } from '@pet/shared/types';

const MOCK_ADDRESSES: (OrderAddress & { id: string })[] = [
  {
    id: 'addr1',
    name: '张三',
    phone: '138****1234',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '某某路123号',
  },
];

const PAYMENT_METHODS = [
  { key: 'alipay', label: '支付宝', icon: Wallet, color: 'text-blue-500' },
  { key: 'wechat', label: '微信支付', icon: CreditCard, color: 'text-green-500' },
  { key: 'balance', label: '余额支付', icon: Coins, color: 'text-pet-orange' },
];

interface CheckoutItem {
  skuId: string;
  productName: string;
  productImage: string;
  attributes: Record<string, string>;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const [selectedAddressId, setSelectedAddressId] = useState('addr1');
  const [selectedCouponId, setSelectedCouponId] = useState<string>();
  const [usePoints, setUsePoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: coupons } = useAvailableCoupons();

  const checkoutItems: CheckoutItem[] = [];

  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems],
  );

  const couponDiscount = useMemo(() => {
    if (!selectedCouponId || !coupons) return 0;
    return 0;
  }, [selectedCouponId, coupons]);

  const pointsDiscount = usePoints ? 0 : 0;
  const shippingFee = subtotal >= 99 ? 0 : 10;
  const actualAmount = Math.max(0, subtotal - couponDiscount - pointsDiscount + shippingFee);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.order.create(), {
        addressId: selectedAddressId,
        items: checkoutItems.map((item) => ({
          skuId: item.skuId,
          quantity: item.quantity,
        })),
        couponId: selectedCouponId,
        usePoints,
        pointAmount: pointsDiscount * 100,
        paymentMethod,
        remark,
      });
    } catch (error) {
      console.error('Create order failed:', error);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, selectedAddressId, checkoutItems, selectedCouponId, usePoints, pointsDiscount, paymentMethod, remark]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/cart" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          返回购物车
        </Link>
      </div>

      <h1 className="mb-6 text-xl font-bold text-foreground">确认订单</h1>

      <div className="space-y-4">
        <AddressSelector
          addresses={MOCK_ADDRESSES}
          selectedId={selectedAddressId}
          onSelect={(addr) => setSelectedAddressId((addr as OrderAddress & { id: string }).id)}
        />

        {checkoutItems.length > 0 ? (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">商品清单</h3>
            <div className="space-y-3">
              {checkoutItems.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' / ')}
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
        ) : (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">商品清单</h3>
            <p className="text-sm text-muted-foreground">暂无结算商品</p>
          </div>
        )}

        {coupons && coupons.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-pet-orange" />
              <h3 className="text-sm font-medium text-foreground">优惠券</h3>
            </div>
            <div className="mt-3 space-y-2">
              <button
                className={cn(
                  'w-full rounded-md border p-2 text-left text-sm transition-colors',
                  !selectedCouponId ? 'border-pet-orange bg-pet-cream/50' : 'hover:border-pet-orange/50',
                )}
                onClick={() => setSelectedCouponId(undefined)}
              >
                不使用优惠券
              </button>
              {coupons.map((coupon) => (
                <button
                  key={coupon.id}
                  className={cn(
                    'w-full rounded-md border p-2 text-left text-sm transition-colors',
                    selectedCouponId === coupon.id ? 'border-pet-orange bg-pet-cream/50' : 'hover:border-pet-orange/50',
                  )}
                  onClick={() => setSelectedCouponId(coupon.id)}
                >
                  {coupon.code} - 满{0}减{0}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-pet-orange" />
              <span className="text-sm font-medium text-foreground">积分抵扣</span>
            </div>
            <button
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                usePoints ? 'bg-pet-orange' : 'bg-muted',
              )}
              onClick={() => setUsePoints(!usePoints)}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                  usePoints ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
          {usePoints && (
            <p className="mt-2 text-xs text-muted-foreground">
              当前可用积分：0，可抵扣 {formatPrice(0)}
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">支付方式</h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.key}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border p-3 transition-colors',
                  paymentMethod === method.key
                    ? 'border-pet-orange bg-pet-cream/50'
                    : 'hover:border-pet-orange/50',
                )}
                onClick={() => setPaymentMethod(method.key)}
              >
                <method.icon className={cn('h-5 w-5', method.color)} />
                <span className="text-sm font-medium text-foreground">{method.label}</span>
                <div
                  className={cn(
                    'ml-auto flex h-4 w-4 items-center justify-center rounded-full border-2',
                    paymentMethod === method.key ? 'border-pet-orange bg-pet-orange' : 'border-border',
                  )}
                >
                  {paymentMethod === method.key && (
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">订单备注</label>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pet-orange"
            rows={2}
            placeholder="选填，请输入备注信息"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">商品金额</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">优惠券</span>
                <span className="text-pet-orange">-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">积分抵扣</span>
                <span className="text-pet-orange">-{formatPrice(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">运费</span>
              <span className="text-foreground">
                {shippingFee === 0 ? '免运费' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="border-t pt-1.5">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">实付金额</span>
                <span className="text-lg font-bold text-pet-orange">{formatPrice(actualAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <span className="text-sm text-muted-foreground">实付：</span>
            <span className="text-lg font-bold text-pet-orange">{formatPrice(actualAmount)}</span>
          </div>
          <button
            className="rounded-lg bg-pet-orange px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pet-coral disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting || !selectedAddressId || checkoutItems.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? '提交中...' : '提交订单'}
          </button>
        </div>
      </div>
    </div>
  );
}
