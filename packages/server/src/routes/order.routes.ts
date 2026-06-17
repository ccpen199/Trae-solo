import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware, requireVerifiedApplicant } from '../middleware/auth';
import { ok, fail, paginated } from '../utils/response';
import {
  OrderType, OrderStatus, PaymentChannel, PaymentStatus,
  OcrStatus, VisaType,
} from '@platform/shared';
import { createOrder, updateOrderStatus, assignCourier, buildContactMasked } from '../services/order.service';
import { createAuditLog, AuditActions } from '../services/audit.service';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/visa', authMiddleware(), requireVerifiedApplicant, [
  body('visaType').isIn(Object.values(VisaType)),
  body('validMonths').isInt({ min: 1, max: 120 }),
  body('entryCount').notEmpty(),
  body('pickupAddress').notEmpty(),
  body('pickupContactName').notEmpty(),
  body('pickupContactPhone').isLength({ min: 11, max: 11 }),
  body('deliveryAddress').notEmpty(),
  body('deliveryContactName').notEmpty(),
  body('deliveryContactPhone').isLength({ min: 11, max: 11 }),
  body('applicantCity').isIn(config.gdCities),
  body('passportImages').isArray({ min: 1 }),
  body('pickupAppointmentFrom').optional(),
  body('pickupAppointmentTo').optional(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const {
    visaType, validMonths, entryCount, travelPurpose,
    pickupAddress, pickupContactName, pickupContactPhone, pickupLat, pickupLon,
    pickupAppointmentFrom, pickupAppointmentTo,
    deliveryAddress, deliveryContactName, deliveryContactPhone,
    applicantCity, passportImages,
  } = req.body;

  const cityConfig = await prisma.cityServiceConfig.findUnique({ where: { city: applicantCity } });
  if (!cityConfig || !cityConfig.isVisaEnabled) return fail(res, 400, '该城市暂未开通签注服务');

  const orderType = [VisaType.HK_G_SIGN, VisaType.HK_L_SIGN, VisaType.HK_T_SIGN, VisaType.HK_S_SIGN, VisaType.HK_D_SIGN, VisaType.MACAO_G_SIGN, VisaType.MACAO_L_SIGN].includes(visaType as any)
    ? OrderType.HK_MACAO_VISA
    : OrderType.TAIWAN_VISA;

  const order = await createOrder({
    applicantId: req.user!.userId,
    applicantCity,
    orderType,
    pickupAddress, pickupContactName, pickupContactPhone,
    pickupLat, pickupLon,
    pickupAppointmentFrom: pickupAppointmentFrom ? new Date(pickupAppointmentFrom) : undefined,
    pickupAppointmentTo: pickupAppointmentTo ? new Date(pickupAppointmentTo) : undefined,
    deliveryAddress, deliveryContactName, deliveryContactPhone,
    serviceFee: cityConfig.visaServiceFee.toNumber(),
    governmentFee: 80,
    courierFee: cityConfig.courierFeeStandard.toNumber() * 2,
  }, req.traceId);

  const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.userId } });
  const visaApp = await prisma.visaApplication.create({
    data: {
      orderId: order.id,
      visaType,
      validMonths,
      entryCount,
      travelPurpose,
      passportNoEncrypted: profile?.idCardEncrypted,
      passportNoMasked: profile?.idCardMasked,
    },
  });

  await prisma.ocrRecord.create({
    data: {
      orderId: order.id,
      documentType: 'PASSPORT',
      imageUrls: passportImages,
      status: OcrStatus.PENDING,
      requestId: `OCR-${uuidv4()}`,
    },
  });

  await createAuditLog(req.user!, AuditActions.ORDER_CREATE, 'Order', { targetId: order.id, traceId: req.traceId, afterData: { orderType, visaType } });

  setTimeout(async () => {
    try { await assignCourier(order.id, applicantCity); } catch {}
  }, 1000);

  return ok(res, { orderId: order.id, orderNo: order.orderNo, totalAmount: order.totalAmount }, '签注申请已提交，等待揽收员上门');
});

router.post('/id-card', authMiddleware(), requireVerifiedApplicant, [
  body('replaceReason').isIn(['LOST', 'DAMAGED', 'EXPIRED', 'INFORMATION_CHANGE']),
  body('pickupAddress').notEmpty(),
  body('deliveryAddress').notEmpty(),
  body('pickupContactName').notEmpty(),
  body('pickupContactPhone').isLength({ min: 11 }),
  body('deliveryContactName').notEmpty(),
  body('deliveryContactPhone').isLength({ min: 11 }),
  body('applicantCity').isIn(config.gdCities),
  body('idCardImages').isArray({ min: 2 }),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const {
    replaceReason, pickupAddress, deliveryAddress,
    pickupContactName, pickupContactPhone, pickupLat, pickupLon,
    deliveryContactName, deliveryContactPhone,
    applicantCity, idCardImages,
  } = req.body;
  const cityConfig = await prisma.cityServiceConfig.findUnique({ where: { city: applicantCity } });
  if (!cityConfig || !cityConfig.isIdCardEnabled) return fail(res, 400, '该城市暂未开通身份证服务');

  const order = await createOrder({
    applicantId: req.user!.userId, applicantCity,
    orderType: OrderType.ID_CARD_REPLACEMENT,
    pickupAddress, pickupContactName, pickupContactPhone, pickupLat, pickupLon,
    deliveryAddress, deliveryContactName, deliveryContactPhone,
    serviceFee: cityConfig.idCardServiceFee.toNumber(),
    governmentFee: 40,
    courierFee: cityConfig.courierFeeStandard.toNumber() * 2,
  }, req.traceId);

  const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.userId } });
  await prisma.idCardApplication.create({
    data: {
      orderId: order.id,
      replaceReason,
      originalIdCardNoEncrypted: profile?.idCardEncrypted,
      newDeliveryAddressEncrypted: require('../utils/encryption').encrypt(deliveryAddress),
    },
  });

  await prisma.ocrRecord.create({
    data: { orderId: order.id, documentType: 'ID_CARD', imageUrls: idCardImages, status: OcrStatus.PENDING, requestId: `OCR-${uuidv4()}` },
  });

  await createAuditLog(req.user!, AuditActions.ORDER_CREATE, 'Order', { targetId: order.id, traceId: req.traceId });
  setTimeout(async () => { try { await assignCourier(order.id, applicantCity); } catch {} }, 1000);

  return ok(res, { orderId: order.id, orderNo: order.orderNo, totalAmount: order.totalAmount }, '身份证补换领申请已提交');
});

router.get('/list', authMiddleware(), [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 50 }),
  query('orderType').optional(),
  query('status').optional(),
], async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const where: any = { applicantId: req.user!.userId };
  if (req.query.orderType) where.orderType = req.query.orderType;
  if (req.query.status) where.status = req.query.status;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        visaApplication: true, idCardApplication: true,
        violationPayment: true, vehicleInspection: true,
      },
    }),
    prisma.order.count({ where }),
  ]);
  const list = orders.map(o => ({
    id: o.id, orderNo: o.orderNo, orderType: o.orderType, status: o.status,
    totalAmount: o.totalAmount, paymentStatus: o.paymentStatus,
    pickupContact: buildContactMasked(o.pickupContactNameEncrypted, o.pickupContactPhoneEncrypted),
    slaDeadline: o.slaDeadline, createdAt: o.createdAt,
  }));
  return paginated(res, list, total, page, pageSize);
});

router.get('/:id', authMiddleware(), [
  param('id').notEmpty(),
], async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      statusLogs: { orderBy: { createdAt: 'asc' } },
      ocrRecords: true,
      paymentRecords: true,
      courierTasks: true,
      emsShipments: { include: { trackingLogs: { orderBy: { occurredAt: 'asc' } } } },
      visaApplication: true,
      idCardApplication: true,
      violationPayment: true,
      vehicleInspection: true,
      electronicReceipt: true,
      approvalRecords: true,
    },
  });
  if (!order) return fail(res, 404, '订单不存在');
  if (order.applicantId !== req.user!.userId && req.user!.role === 'APPLICANT') {
    return fail(res, 403, '无权查看该订单');
  }
  const masked = {
    ...order,
    pickupAddressMasked: order.pickupAddressMasked,
    deliveryAddressMasked: order.deliveryAddressMasked,
    pickupContact: buildContactMasked(order.pickupContactNameEncrypted, order.pickupContactPhoneEncrypted),
    deliveryContact: buildContactMasked(order.deliveryContactNameEncrypted, order.deliveryContactPhoneEncrypted),
  };
  return ok(res, masked);
});

router.post('/:id/cancel', authMiddleware(), async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 404, '订单不存在');
  if (order.applicantId !== req.user!.userId) return fail(res, 403, '无权操作');
  const cancelableStatus = [OrderStatus.CREATED, OrderStatus.PENDING_PICKUP, OrderStatus.COURIER_ASSIGNED];
  if (!cancelableStatus.includes(order.status as any)) return fail(res, 400, '当前状态不可取消');
  await updateOrderStatus(order.id, OrderStatus.CANCELLED, req.user!.userId, req.body.reason || '用户取消', { cancelledBy: 'user' });
  await createAuditLog(req.user!, AuditActions.ORDER_CANCEL, 'Order', { targetId: order.id, traceId: req.traceId });
  return ok(res, null, '订单已取消');
});

export default router;
