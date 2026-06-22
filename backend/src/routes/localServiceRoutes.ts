import { Router } from 'express';
import { LocalServiceIntegration } from '../services/localService';
import { asyncHandler, getAuthUserId } from '../middleware';

const router = Router();

router.get('/coupons', asyncHandler((req, res) => {
  const result = LocalServiceIntegration.listCoupons({
    city: req.query.city as string,
    category: req.query.category as never,
    keyword: req.query.keyword as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  });
  return res.json({
    ...result,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
    totalPages: Math.ceil(result.total / (parseInt(req.query.pageSize as string) || 20)),
    hasMore: (parseInt(req.query.page as string) || 1) * (parseInt(req.query.pageSize as string) || 20) < result.total
  });
}));

router.get('/coupons/:id', asyncHandler((req, res) => {
  const coupon = LocalServiceIntegration.getCouponDetail(req.params.id);
  if (!coupon) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '优惠券不存在' };
    return res.json(null);
  }
  return res.json(coupon);
}));

router.post('/coupons/:id/purchase', asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  const { quantity, activityId } = req.body;
  const result = LocalServiceIntegration.purchaseCoupon(userId, req.params.id, quantity || 1, activityId);
  if (!result.success || !result.order) {
    res.status(400);
    res.locals.error = { code: 'PURCHASE_FAILED', message: result.error || '购买失败' };
    return res.json(null);
  }
  await LocalServiceIntegration.syncWithXiaohu(result.order.id);
  return res.json(result.order);
}));

router.post('/orders/:id/redeem', asyncHandler((req, res) => {
  const { location } = req.body as { location?: string };
  const result = LocalServiceIntegration.redeemCoupon(req.params.id, location);
  if (!result.success) {
    res.status(400);
    res.locals.error = { code: 'REDEEM_FAILED', message: result.error || '核销失败' };
    return res.json(null);
  }
  return res.json(result.result);
}));

router.get('/orders/list', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const orders = LocalServiceIntegration.getUserOrders(userId, req.query.status as never);
  return res.json(orders.map(o => ({
    ...o,
    coupon: LocalServiceIntegration.getCouponDetail(o.couponId)
  })));
}));

router.get('/orders/:id/sync-status', asyncHandler(async (req, res) => {
  await LocalServiceIntegration.syncWithXiaohu(req.params.id);
  const status = LocalServiceIntegration.getSyncStatus(req.params.id);
  return res.json(status);
}));

router.get('/activity/:id/coupons', asyncHandler((req, res) => {
  const items = LocalServiceIntegration.getActivityCoupons(req.params.id);
  return res.json(items);
}));

export default router;
