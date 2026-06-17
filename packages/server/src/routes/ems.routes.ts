import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { ok, fail } from '../utils/response';
import { UserRole, OrderStatus } from '@platform/shared';
import { updateOrderStatus } from '../services/order.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/shipments/create', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), [
  body('orderId').notEmpty(),
  body('shipmentType').notEmpty(),
  body('sender').isObject(),
  body('receiver').isObject(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { orderId, shipmentType, sender, receiver, weightKg, insuredAmount } = req.body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail(res, 404, '订单不存在');
  const { encrypt, maskName, maskPhone, maskAddress } = require('../utils/encryption');
  const shipmentNo = `EMS${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const shipment = await prisma.emsShipment.create({
    data: {
      orderId, shipmentNo, shipmentType,
      senderNameMasked: maskName(sender.name),
      senderPhoneMasked: maskPhone(sender.phone),
      senderAddressMasked: maskAddress(sender.address),
      receiverNameMasked: maskName(receiver.name),
      receiverPhoneMasked: maskPhone(receiver.phone),
      receiverAddressMasked: maskAddress(receiver.address),
      weightKg, insuredAmount,
      emsCreateReqId: `EMS-CREATE-${uuidv4()}`,
      emsCreateResp: { shipmentNo, created: true, timestamp: new Date() },
      status: 'PRINTED',
    },
  });
  await prisma.emsTrackingLog.create({
    data: { shipmentId: shipment.id, location: '邮政政务处理中心', statusCode: 'PRINTED', statusDesc: '面单已打印', operator: '系统', occurredAt: new Date() },
  });
  return ok(res, { shipmentId: shipment.id, shipmentNo }, 'EMS运单已创建');
});

router.post('/shipments/:shipmentNo/ship', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), async (req: Request, res: Response) => {
  const shipment = await prisma.emsShipment.findUnique({ where: { shipmentNo: req.params.shipmentNo } });
  if (!shipment) return fail(res, 404, '运单不存在');
  await prisma.$transaction([
    prisma.emsShipment.update({ where: { id: shipment.id }, data: { status: 'IN_TRANSIT', shippedAt: new Date() } }),
    prisma.emsTrackingLog.create({ data: { shipmentId: shipment.id, location: '广州邮政处理中心', statusCode: 'SHIPPED', statusDesc: '已交寄', operator: '邮政处理员', occurredAt: new Date() } }),
    prisma.order.update({ where: { id: shipment.orderId }, data: { status: OrderStatus.IN_DELIVERY as any } }),
  ]);
  setTimeout(async () => {
    const logs = [
      { location: '广州邮政分拨中心', statusCode: 'TRANSIT', statusDesc: '到达分拨中心，正在分拣' },
      { location: '寄达市处理中心', statusCode: 'ARRIVED', statusDesc: '到达寄达城市' },
      { location: '寄达地邮政支局', statusCode: 'OUT_FOR_DELIVERY', statusDesc: '揽收员正在派送中' },
    ];
    for (let i = 0; i < logs.length; i++) {
      setTimeout(async () => {
        try {
          await prisma.emsTrackingLog.create({
            data: { shipmentId: shipment.id, ...logs[i], occurredAt: new Date() },
          });
        } catch {}
      }, (i + 1) * 5000);
    }
  }, 2000);
  return ok(res, null, '已交寄');
});

router.get('/shipments/:shipmentNo/track', authMiddleware(), async (req: Request, res: Response) => {
  const shipment = await prisma.emsShipment.findUnique({
    where: { shipmentNo: req.params.shipmentNo },
    include: { trackingLogs: { orderBy: { occurredAt: 'asc' } } },
  });
  if (!shipment) return fail(res, 404, '运单不存在');
  if (req.user!.role === 'APPLICANT') {
    const order = await prisma.order.findUnique({ where: { id: shipment.orderId } });
    if (order && order.applicantId !== req.user!.userId) return fail(res, 403, '无权查看');
  }
  return ok(res, {
    shipmentNo: shipment.shipmentNo,
    status: shipment.status,
    shippedAt: shipment.shippedAt,
    deliveredAt: shipment.deliveredAt,
    signedByName: shipment.signedByNameMasked,
    signedAt: shipment.signedAt,
    trackingLogs: shipment.trackingLogs.map(l => ({
      location: l.location, statusCode: l.statusCode, statusDesc: l.statusDesc,
      operator: l.operator, occurredAt: l.occurredAt,
    })),
  });
});

router.get('/orders/:orderId/shipments', authMiddleware(), async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return fail(res, 404, '订单不存在');
  if (req.user!.role === 'APPLICANT' && order.applicantId !== req.user!.userId) return fail(res, 403, '无权查看');
  const shipments = await prisma.emsShipment.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'asc' },
    include: { trackingLogs: { orderBy: { occurredAt: 'asc' }, take: 5 } },
  });
  return ok(res, shipments.map(s => ({
    id: s.id, shipmentNo: s.shipmentNo, shipmentType: s.shipmentType,
    status: s.status, shippedAt: s.shippedAt, deliveredAt: s.deliveredAt,
    lastStatus: s.trackingLogs.length ? s.trackingLogs[s.trackingLogs.length - 1] : null,
  })));
});

export default router;
