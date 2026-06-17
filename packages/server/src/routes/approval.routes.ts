import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { ok, fail, paginated } from '../utils/response';
import { UserRole, OrderStatus, OrderType } from '@platform/shared';
import { updateOrderStatus, createAlert } from '../services/order.service';
import { createAuditLog, AuditActions } from '../services/audit.service';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const router = Router();

router.get('/pending', authMiddleware([UserRole.APPROVER]), [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 50 }),
  query('orderType').optional(),
], async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const approver = await prisma.approverProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!approver) return fail(res, 404, '审批人资料不存在');
  const where: any = {
    status: { in: [OrderStatus.SUBMITTED_FOR_APPROVAL as any, OrderStatus.APPROVING as any] },
    applicantCity: approver.dutyCity,
  };
  if (req.query.orderType) where.orderType = req.query.orderType;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        visaApplication: true, idCardApplication: true,
        ocrRecords: true,
      },
    }),
    prisma.order.count({ where }),
  ]);
  return paginated(res, orders.map(o => ({
    id: o.id, orderNo: o.orderNo, orderType: o.orderType, status: o.status,
    applicantCity: o.applicantCity, createdAt: o.createdAt, slaDeadline: o.slaDeadline,
    ocrPassed: o.ocrRecords.every(r => r.status === 'SUCCESS' || r.status === 'NEED_MANUAL_REVIEW'),
  })), total, page, pageSize);
});

router.post('/:orderId/submit-gateway', authMiddleware([UserRole.APPROVER]), async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { visaApplication: true, idCardApplication: true } });
  if (!order) return fail(res, 404, '订单不存在');
  const approver = await prisma.approverProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!approver || approver.dutyCity !== order.applicantCity) return fail(res, 403, '无权审批该订单');

  const gatewayReqId = `GW-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.APPROVING, submittedForApprovalAt: new Date() } }),
    prisma.approvalRecord.create({
      data: {
        orderId: order.id,
        approverId: approver.id,
        approvalType: order.orderType,
        decision: 'SUBMITTED',
        gatewayRequestId: gatewayReqId,
        gatewayResponse: { reqId: gatewayReqId, submitted: true, timestamp: new Date() },
      },
    }),
  ]);

  setTimeout(async () => {
    try {
      const passed = Math.random() > 0.08;
      await prisma.approvalRecord.create({
        data: {
          orderId: order.id,
          approverId: approver.id,
          approvalType: order.orderType,
          decision: passed ? 'APPROVED' : 'REJECTED',
          gatewayRequestId: gatewayReqId,
          gatewayResponse: {
            reqId: gatewayReqId,
            decision: passed ? 'PASS' : 'REJECT',
            certificateNo: passed ? `GD${Date.now().toString().slice(-8)}` : undefined,
            rejectReason: passed ? undefined : '材料不完整或不符合要求，请补充',
            timestamp: new Date(),
          },
          approvedAt: passed ? new Date() : undefined,
          rejectReason: passed ? undefined : '材料不完整或不符合要求，请补充',
        },
      });

      if (passed) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CERTIFICATE_PRINTING, approvedAt: new Date() },
        });
        if (order.visaApplication) {
          await prisma.visaApplication.update({
            where: { orderId: order.id },
            data: {
              certificateNo: `GD${Date.now().toString().slice(-8)}`,
              printedAt: new Date(),
              provinceGatewayResp: { reqId: gatewayReqId, decision: 'PASS' },
            },
          });
        }
        if (order.idCardApplication) {
          await prisma.idCardApplication.update({
            where: { orderId: order.id },
            data: {
              policeSyncStatus: 'SYNCED',
              policeSyncResp: { reqId: gatewayReqId, synced: true },
              newIdCardNo: `ID${Date.now().toString().slice(-10)}`,
              populationDbSyncedAt: new Date(),
            },
          });
        }
        setTimeout(async () => {
          try {
            await prisma.$transaction([
              prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PENDING_DELIVERY } }),
              prisma.emsShipment.create({
                data: {
                  orderId: order.id,
                  shipmentNo: `EMS${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  shipmentType: 'CERTIFICATE',
                  status: 'PRINTED',
                },
              }),
            ]);
          } catch {}
        }, 2000);
      } else {
        await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.REJECTED } });
      }

      await createAuditLog({ userId: req.user!.userId }, passed ? AuditActions.APPROVAL_PASS : AuditActions.APPROVAL_REJECT, 'ApprovalRecord', { targetId: order.id });
    } catch (err: any) {
      await createAlert('APPROVAL_DELAY' as any, 'CRITICAL' as any, order.applicantCity,
        '审批系统异常', `订单${order.orderNo}省级网关回调失败：${err.message}`, { orderId: order.id });
    }
  }, 3000);

  await createAuditLog(req.user!, AuditActions.APPROVAL_SUBMIT, 'ApprovalRecord', { targetId: order.id, traceId: req.traceId });
  return ok(res, { gatewayReqId }, '已提交至省级政务系统审批');
});

router.post('/:orderId/approve', authMiddleware([UserRole.APPROVER]), [
  body('decision').isIn(['APPROVED', 'REJECTED']),
  body('rejectReason').optional(),
], async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return fail(res, 404, '订单不存在');
  const approver = await prisma.approverProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!approver || approver.dutyCity !== order.applicantCity) return fail(res, 403, '无权审批');

  const { decision, rejectReason } = req.body;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: decision === 'APPROVED' ? OrderStatus.CERTIFICATE_PRINTING : OrderStatus.REJECTED,
        approvedAt: decision === 'APPROVED' ? new Date() : undefined,
      },
    }),
    prisma.approvalRecord.create({
      data: {
        orderId: order.id, approverId: approver.id,
        approvalType: order.orderType,
        decision, rejectReason,
        approvedAt: decision === 'APPROVED' ? new Date() : undefined,
      },
    }),
  ]);

  await createAuditLog(req.user!, decision === 'APPROVED' ? AuditActions.APPROVAL_PASS : AuditActions.APPROVAL_REJECT, 'ApprovalRecord', { targetId: order.id, traceId: req.traceId });
  return ok(res, null, decision === 'APPROVED' ? '审批通过' : '已驳回');
});

router.post('/ocr/:ocrId/review', authMiddleware([UserRole.APPROVER]), [
  body('status').isIn(['SUCCESS', 'NEED_MANUAL_REVIEW', 'FAILED']),
  body('remark').optional(),
  body('recognizedFields').optional(),
], async (req: Request, res: Response) => {
  const ocr = await prisma.ocrRecord.findUnique({ where: { id: req.params.ocrId } });
  if (!ocr) return fail(res, 404, 'OCR记录不存在');
  const { status, remark, recognizedFields } = req.body;
  const approver = await prisma.approverProfile.findUnique({ where: { userId: req.user!.userId } });
  await prisma.ocrRecord.update({
    where: { id: ocr.id },
    data: {
      status: status as any,
      reviewRemark: remark,
      recognizedFields,
      manualReviewBy: approver?.id,
      completedAt: new Date(),
    },
  });
  return ok(res, null, 'OCR人工复核完成');
});

export default router;
