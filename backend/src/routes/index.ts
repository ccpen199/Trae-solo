import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as orderController from '../controllers/order.controller';
import * as withdrawController from '../controllers/withdraw.controller';
import * as commissionController from '../controllers/commission.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 认证路由
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// 需要认证的路由
router.use(authMiddleware);

// 用户信息
router.get('/auth/profile', authController.getProfile);
router.post('/auth/apply-distributor', authController.applyDistributor);

// 订单路由
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getUserOrders);
router.get('/orders/:orderId', orderController.getOrder);
router.post('/orders/:orderId/pay', orderController.confirmPayment);
router.post('/orders/:orderId/attribute', orderController.confirmAttribution);
router.post('/orders/:orderId/deliver', orderController.confirmDelivery);
router.post('/orders/:orderId/complete', orderController.completeAfterSale);
router.post('/orders/:orderId/cancel', orderController.cancelOrder);

// 佣金路由
router.get('/commissions/stats', commissionController.getCommissionStats);
router.get('/commissions', commissionController.getCommissions);
router.get('/commissions/transactions', commissionController.getTransactions);
router.get('/commissions/performance', commissionController.getPerformanceStats);

// 提现路由
router.post('/withdraws', withdrawController.createWithdraw);
router.get('/withdraws', withdrawController.getUserWithdraws);

// 运营/财务角色路由
router.use(roleMiddleware('OPERATOR', 'FINANCE', 'ADMIN'));

// 财务审核
router.get('/withdraws/pending', withdrawController.getPendingWithdraws);
router.post('/withdraws/:withdrawId/review', withdrawController.reviewWithdraw);
router.post('/withdraws/:withdrawId/pay', withdrawController.processPayment);

// 报表
router.get('/reports/settlement', commissionController.getSettlementReport);

export default router;
