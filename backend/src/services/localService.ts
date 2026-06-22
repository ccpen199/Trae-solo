import type {
  LocalServiceCoupon,
  CouponOrder,
  XiaohuSyncResult
} from '../types';
import { db } from '../data/database';
import { RiskControlEngine } from '../core/riskControlEngine';

export class LocalServiceIntegration {
  private static readonly XIAOHU_MOCK_DELAY = 500;

  static listCoupons(options: {
    city?: string;
    category?: LocalServiceCoupon['category'];
    page?: number;
    pageSize?: number;
    keyword?: string;
  } = {}): { items: LocalServiceCoupon[]; total: number } {
    let coupons = Array.from(db.coupons.values());
    if (options.city) coupons = coupons.filter(c => c.city === options.city);
    if (options.category) coupons = coupons.filter(c => c.category === options.category);
    if (options.keyword) {
      const kw = options.keyword.toLowerCase();
      coupons = coupons.filter(c =>
        c.title.toLowerCase().includes(kw) ||
        c.merchantName.toLowerCase().includes(kw) ||
        c.tags.some(t => t.toLowerCase().includes(kw))
      );
    }
    coupons.sort((a, b) => b.averageRating - a.averageRating);

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    return {
      items: coupons.slice(start, start + pageSize),
      total: coupons.length
    };
  }

  static getCouponDetail(couponId: string): LocalServiceCoupon | null {
    return db.coupons.get(couponId) || null;
  }

  static purchaseCoupon(
    userId: string,
    couponId: string,
    quantity: number = 1,
    activityId?: string
  ): { success: boolean; order?: CouponOrder; error?: string } {
    const coupon = db.coupons.get(couponId);
    const user = db.users.get(userId);
    if (!coupon || !user) return { success: false, error: '优惠券或用户不存在' };
    if (coupon.stock < quantity) return { success: false, error: '库存不足' };
    if (new Date() > coupon.validUntil) return { success: false, error: '优惠券已过期' };
    if (user.creditScore < 550) return { success: false, error: '信用分不足' };

    const freq = RiskControlEngine.recordAndCheckHighFrequency(userId, 'match');
    if (!freq.allowed) return { success: false, error: '操作过于频繁' };

    const externalOrderId = `XH-ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const redemptionCode = this.generateRedemptionCode();

    const order: CouponOrder = {
      id: db.generateId(),
      userId,
      couponId,
      externalOrderId,
      activityId,
      quantity,
      unitPrice: coupon.discountedPrice,
      totalPrice: Math.round(coupon.discountedPrice * quantity * 100) / 100,
      redemptionCode,
      redemptionStatus: 'pending',
      syncedWithXiaohu: false,
      createdAt: new Date(),
      expiresAt: new Date(coupon.validUntil.getTime())
    };

    db.couponOrders.set(order.id, order);
    coupon.stock -= quantity;
    coupon.soldCount += quantity;

    this.syncWithXiaohu(order.id);
    return { success: true, order };
  }

  private static generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async syncWithXiaohu(orderId: string): Promise<XiaohuSyncResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const order = db.couponOrders.get(orderId);
        if (!order) {
          resolve({
            success: false,
            errorMessage: '订单不存在',
            syncedAt: new Date()
          });
          return;
        }
        order.syncedWithXiaohu = true;
        order.lastSyncAt = new Date();
        resolve({
          success: true,
          externalOrderId: order.externalOrderId,
          status: order.redemptionStatus,
          syncedAt: new Date()
        });
      }, this.XIAOHU_MOCK_DELAY);
    });
  }

  static redeemCoupon(
    orderId: string,
    location?: string
  ): { success: boolean; result?: XiaohuSyncResult; error?: string } {
    const order = db.couponOrders.get(orderId);
    if (!order) return { success: false, error: '订单不存在' };
    if (order.redemptionStatus !== 'pending') {
      return { success: false, error: `订单状态为${order.redemptionStatus}` };
    }
    if (new Date() > order.expiresAt) {
      order.redemptionStatus = 'expired';
      return { success: false, error: '订单已过期' };
    }
    order.redemptionStatus = 'redeemed';
    order.redeemedAt = new Date();
    order.redeemedLocation = location || '线下门店';

    const user = db.users.get(order.userId);
    if (user) {
      RiskControlEngine.addCreditScore(order.userId, 1, 'activity_feedback', '使用小壶优选消费核销');
    }

    if (order.activityId) {
      const activity = db.activities.get(order.activityId);
      if (activity?.coupons) {
        const activityCoupon = activity.coupons.find(c => c.couponId === order.couponId);
        if (activityCoupon) {
          activityCoupon.redemptionStatus = 'redeemed';
          activityCoupon.redeemedAt = new Date();
          activityCoupon.externalOrderId = order.externalOrderId;
        }
      }
    }

    return {
      success: true,
      result: {
        success: true,
        externalOrderId: order.externalOrderId,
        status: 'redeemed',
        syncedAt: new Date()
      }
    };
  }

  static getUserOrders(
    userId: string,
    status?: CouponOrder['redemptionStatus']
  ): CouponOrder[] {
    let orders = Array.from(db.couponOrders.values())
      .filter(o => o.userId === userId);
    if (status) orders = orders.filter(o => o.redemptionStatus === status);
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static getActivityCoupons(activityId: string): (CouponOrder & { coupon?: LocalServiceCoupon })[] {
    const orders = Array.from(db.couponOrders.values())
      .filter(o => o.activityId === activityId);
    return orders.map(o => ({
      ...o,
      coupon: db.coupons.get(o.couponId)
    }));
  }

  static getSyncStatus(orderId: string): XiaohuSyncResult {
    const order = db.couponOrders.get(orderId);
    if (!order) {
      return {
        success: false,
        errorMessage: '订单不存在',
        syncedAt: new Date()
      };
    }
    return {
      success: true,
      externalOrderId: order.externalOrderId,
      status: order.redemptionStatus,
      syncedAt: order.lastSyncAt || new Date()
    };
  }
}
