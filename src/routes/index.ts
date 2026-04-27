import { Router } from 'express';
import { demandController, orderController, auditController } from '../controllers';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '家具定制订单系统运行正常',
    timestamp: new Date().toISOString()
  });
});

const demandRouter = Router();

demandRouter.post('/', demandController.createDemand);
demandRouter.get('/', demandController.getMyDemands);
demandRouter.get('/pending', demandController.getPendingDemands);
demandRouter.get('/:demandId', demandController.getDemandById);
demandRouter.post('/:demandId/assign-designer', demandController.assignDesigner);

router.use('/demands', demandRouter);

const orderRouter = Router();

orderRouter.post('/', orderController.createOrder);
orderRouter.get('/', orderController.getMyOrders);
orderRouter.get('/:orderId', orderController.getOrderById);
orderRouter.post('/:orderId/sign-contract', orderController.signContract);
orderRouter.post('/:orderId/payment', orderController.recordPayment);
orderRouter.get('/:orderId/status-history', orderController.getOrderStatusHistory);

router.use('/orders', orderRouter);

const auditRouter = Router();

auditRouter.get('/my-logs', auditController.getMyAuditLogs);
auditRouter.get('/exceptions', auditController.getExceptionLogs);
auditRouter.get('/entity/:entityType/:entityId', auditController.getAuditLogsByEntity);
auditRouter.get('/order/:orderId', auditController.getOrderAuditTrail);
auditRouter.post('/exceptions/:exceptionId/handle', auditController.handleException);

router.use('/audit', auditRouter);

export default router;
