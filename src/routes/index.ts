import { Router } from 'express';
import { demandController, measurementController, designController, quoteController, orderController, splitController, productionController, installationController, auditController } from '../controllers';

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

const measurementRouter = Router();

measurementRouter.post('/', measurementController.createMeasurement);
measurementRouter.get('/', measurementController.getMyMeasurements);
measurementRouter.get('/:measurementId', measurementController.getMeasurementById);
measurementRouter.post('/:measurementId/start', measurementController.startMeasurement);
measurementRouter.post('/:measurementId/complete', measurementController.completeMeasurement);
measurementRouter.post('/:measurementId/review', measurementController.reviewMeasurement);

router.use('/measurements', measurementRouter);

const designRouter = Router();

designRouter.post('/', designController.createDesign);
designRouter.get('/', designController.getMyDesigns);
designRouter.get('/:designId', designController.getDesignById);
designRouter.put('/:designId', designController.updateDesign);
designRouter.post('/:designId/submit', designController.submitDesign);
designRouter.post('/:designId/review', designController.reviewDesign);

router.use('/designs', designRouter);

const quoteRouter = Router();

quoteRouter.post('/', quoteController.generateQuote);
quoteRouter.get('/design/:designId', quoteController.getQuotesByDesign);
quoteRouter.get('/:quoteId', quoteController.getQuoteById);
quoteRouter.post('/:quoteId/submit', quoteController.submitQuote);
quoteRouter.post('/:quoteId/confirm', quoteController.confirmQuote);
quoteRouter.post('/:quoteId/reject', quoteController.rejectQuote);

router.use('/quotes', quoteRouter);

const orderRouter = Router();

orderRouter.post('/', orderController.createOrder);
orderRouter.get('/', orderController.getMyOrders);
orderRouter.get('/:orderId', orderController.getOrderById);
orderRouter.post('/:orderId/sign-contract', orderController.signContract);
orderRouter.post('/:orderId/payment', orderController.recordPayment);
orderRouter.get('/:orderId/status-history', orderController.getOrderStatusHistory);

router.use('/orders', orderRouter);

const splitRouter = Router();

splitRouter.post('/', splitController.startSplit);
splitRouter.get('/', splitController.getMySplits);
splitRouter.get('/:splitId', splitController.getSplitById);
splitRouter.post('/:splitId/execute', splitController.executeSplit);
splitRouter.post('/:splitId/submit', splitController.submitSplit);
splitRouter.post('/:splitId/review', splitController.reviewSplit);

router.use('/splits', splitRouter);

const productionRouter = Router();

productionRouter.post('/', productionController.createProductionTask);
productionRouter.get('/', productionController.getMyProductionTasks);
productionRouter.get('/order/:orderId', productionController.getProductionTasksByOrder);
productionRouter.get('/:taskId', productionController.getProductionTaskById);
productionRouter.post('/:taskId/start', productionController.startProductionTask);
productionRouter.post('/:taskId/progress', productionController.updateProductionProgress);
productionRouter.post('/:taskId/complete', productionController.completeProductionTask);

router.use('/production', productionRouter);

const installationRouter = Router();

installationRouter.post('/', installationController.createInstallationTask);
installationRouter.get('/', installationController.getMyInstallations);
installationRouter.get('/order/:orderId', installationController.getInstallationsByOrder);
installationRouter.get('/:installationId', installationController.getInstallationById);
installationRouter.post('/:installationId/auto-assign', installationController.executeAutoAssignment);
installationRouter.post('/:installationId/assign', installationController.assignInstaller);
installationRouter.post('/:installationId/start', installationController.startInstallation);
installationRouter.post('/:installationId/complete', installationController.completeInstallation);
installationRouter.post('/:installationId/accept', installationController.acceptInstallation);

router.use('/installations', installationRouter);

const auditRouter = Router();

auditRouter.get('/my-logs', auditController.getMyAuditLogs);
auditRouter.get('/exceptions', auditController.getExceptionLogs);
auditRouter.get('/entity/:entityType/:entityId', auditController.getAuditLogsByEntity);
auditRouter.get('/order/:orderId', auditController.getOrderAuditTrail);
auditRouter.post('/exceptions/:exceptionId/handle', auditController.handleException);

router.use('/audit', auditRouter);

export default router;
