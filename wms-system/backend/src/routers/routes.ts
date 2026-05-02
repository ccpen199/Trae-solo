import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import * as inboundController from '../controllers/inboundController';
import * as outboundController from '../controllers/outboundController';
import * as auditController from '../controllers/auditController';

const router = Router();

// 预约单相关路由
router.post('/appointments', appointmentController.createAppointment);
router.put('/appointments/:id/confirm', appointmentController.confirmAppointment);
router.put('/appointments/:id/cancel', appointmentController.cancelAppointment);
router.get('/appointments', appointmentController.getAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentById);

// 入库相关路由
router.post('/inbound', inboundController.createInboundOrder);
router.put('/inbound/items/:id', inboundController.processInboundItem);
router.put('/inbound/:id/complete', inboundController.completeInboundOrder);
router.get('/inbound', inboundController.getInboundOrders);
router.get('/inbound/:id', inboundController.getInboundOrderById);

// 出库相关路由
router.post('/outbound', outboundController.createOutboundOrder);
router.post('/outbound/wave-picks', outboundController.generateWavePicks);
router.put('/outbound/items/:id/pick', outboundController.pickItem);
router.put('/outbound/items/:id/pack', outboundController.packItem);
router.put('/outbound/:id/ship', outboundController.shipOrder);
router.get('/outbound', outboundController.getOutboundOrders);
router.get('/outbound/:id', outboundController.getOutboundOrderById);

// 盘点相关路由
router.post('/audits', auditController.createAudit);
router.put('/audits/:id/start', auditController.startAudit);
router.post('/audits/:id/results', auditController.submitAuditResults);
router.put('/audits/:id/adjust', auditController.adjustInventory);
router.get('/audits', auditController.getAudits);
router.get('/audits/:id', auditController.getAuditById);

export default router;