import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware, requireVerifiedApplicant } from '../middleware/auth';
import { ok, fail, paginated } from '../utils/response';
import { createOrder, assignCourier } from '../services/order.service';
import { createAuditLog, AuditActions } from '../services/audit.service';
import { OrderType, OrderStatus, ViolationSource, maskLicensePlate } from '@platform/shared';
import { config } from '../config';
import { encrypt, hashValue } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const CITY_CODES: Record<string, string> = {
  '广州市': '440100', '深圳市': '440300', '珠海市': '440400', '汕头市': '440500',
  '佛山市': '440600', '韶关市': '440200', '湛江市': '440800', '肇庆市': '441200',
  '江门市': '440700', '茂名市': '440900', '惠州市': '441300', '梅州市': '441400',
  '汕尾市': '441500', '河源市': '441600', '阳江市': '441700', '清远市': '441800',
  '东莞市': '441900', '中山市': '442000', '潮州市': '445100', '揭阳市': '445200',
  '云浮市': '445300',
};

function generateMockViolations(plate: string, count: number) {
  const codes = ['1208', '1039', '1301', '1625', '1225', '1344', '1019'];
  const descs = ['机动车不按导向车道行驶', '机动车违反规定停放', '机动车逆向行驶', '机动车闯红灯', '不系安全带', '违反禁令标志', '违规变道'];
  return Array.from({ length: count }).map((_, i) => ({
    plate,
    violationCode: codes[i % codes.length],
    violationDesc: descs[i % descs.length],
    violationTime: new Date(Date.now() - Math.random() * 90 * 24 * 3600 * 1000),
    violationLocation: `广东省某市某区某路${100 + i}号`,
    fineAmount: [50, 100, 150, 200, 500][Math.floor(Math.random() * 5)],
    lateFee: Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0,
    deductPoints: [0, 1, 2, 3, 6][Math.floor(Math.random() * 5)],
  }));
}

router.post('/violation/query', authMiddleware(), [
  body('plateNumber').notEmpty(),
  body('vehicleType').notEmpty(),
  body('engineNo').optional(),
  body('vinNo').optional(),
  body('ownerName').optional(),
  body('queryScope').optional(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { plateNumber, vehicleType, engineNo, vinNo, ownerName, queryScope = 'NATIONWIDE' } = req.body;

  const batchId = `BATCH${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`;
  const plateMasked = maskLicensePlate(plateNumber);
  const cities = queryScope === 'NATIONWIDE'
    ? [...Object.keys(CITY_CODES)]
    : [...Object.keys(CITY_CODES)].filter(() => Math.random() > 0.5).slice(0, 10);

  const totalViolations: any[] = [];
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const source = Math.random() > 0.5 ? ViolationSource.TRAFFIC_12123 : ViolationSource.MINISTRY_POLICE_DB;
    const hasViolations = Math.random() > 0.6;
    const count = hasViolations ? Math.floor(Math.random() * 4) + 1 : 0;
    const violations = generateMockViolations(plateMasked, count);
    await prisma.violationQueryLog.create({
      data: {
        batchId, cityCode: CITY_CODES[city] || '000000', cityName: city, source, recordCount: count,
        isSuccess: true, apiLatencyMs: Math.floor(100 + Math.random() * 500),
        plateNumberMasked: plateMasked,
      },
    });
    for (let j = 0; j < violations.length; j++) {
      const v = violations[j];
      const rec = await prisma.violationRecord.create({
        data: {
          plateNumberEncrypted: encrypt(plateNumber),
          plateNumberMasked: plateMasked,
          vehicleType,
          violationCode: v.violationCode,
          violationDesc: v.violationDesc,
          violationTime: v.violationTime,
          violationLocation: v.violationLocation,
          fineAmount: v.fineAmount,
          lateFee: v.lateFee,
          deductPoints: v.deductPoints,
          source,
          sourceRecordId: `${source}-${Date.now()}-${i}-${j}-${Math.random().toString(36).slice(2, 8)}`,
          queryBatchId: batchId,
        },
      });
      totalViolations.push({
        id: rec.id, plateMasked, vehicleType: rec.vehicleType,
        violationCode: rec.violationCode, violationDesc: rec.violationDesc,
        violationTime: rec.violationTime, violationLocation: rec.violationLocation,
        fineAmount: rec.fineAmount, lateFee: rec.lateFee, deductPoints: rec.deductPoints,
        source: rec.source, isHandled: rec.isHandled,
      });
    }
  }

  const stats = totalViolations.reduce((acc, v) => ({
    count: acc.count + 1,
    totalFine: acc.totalFine + parseFloat(v.fineAmount),
    totalLate: acc.totalLate + parseFloat(v.lateFee),
    totalPoints: acc.totalPoints + v.deductPoints,
  }), { count: 0, totalFine: 0, totalLate: 0, totalPoints: 0 });

  return ok(res, {
    batchId,
    plateMasked,
    queryScope,
    citiesQueried: cities.length,
    stats,
    violations: totalViolations,
  }, '违章查询完成');
});

router.post('/violation/pay', authMiddleware(), requireVerifiedApplicant, [
  body('violationIds').isArray({ min: 1 }),
  body('applicantCity').isIn(config.gdCities),
  body('plateNumber').notEmpty(),
  body('engineNo').optional(),
  body('vinNo').optional(),
  body('ownerName').optional(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { violationIds, applicantCity, plateNumber, engineNo, vinNo, ownerName } = req.body;

  const records = await prisma.violationRecord.findMany({ where: { id: { in: violationIds }, isHandled: false } });
  if (records.length === 0) return fail(res, 400, '无可处理的违章记录');

  const totalFine = records.reduce((a, b) => a + parseFloat(b.fineAmount as any), 0);
  const totalLate = records.reduce((a, b) => a + parseFloat(b.lateFee as any), 0);
  const totalPoints = records.reduce((a, b) => a + b.deductPoints, 0);

  const cityConfig = await prisma.cityServiceConfig.findUnique({ where: { city: applicantCity } });
  if (!cityConfig || !cityConfig.isViolationEnabled) return fail(res, 400, '该城市暂未开通违章缴费');

  const order = await prisma.order.create({
    data: {
      orderNo: `GDVIO${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      orderType: OrderType.VIOLATION_PAYMENT,
      status: OrderStatus.CREATED,
      applicantId: req.user!.userId,
      applicantCity,
      serviceFee: cityConfig.violationServiceFee.toNumber() * records.length,
      governmentFee: totalFine + totalLate,
      courierFee: 0,
      totalAmount: cityConfig.violationServiceFee.toNumber() * records.length + totalFine + totalLate,
      paymentStatus: 'UNPAID' as any,
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
      pickupAddressEncrypted: encrypt('线上办理，无需收件'),
      pickupAddressMasked: '线上办理，无需收件',
      pickupContactNameEncrypted: encrypt(ownerName || '本人'),
      pickupContactPhoneEncrypted: encrypt('13800000000'),
      deliveryAddressEncrypted: encrypt('线上办理，无需邮寄'),
      deliveryAddressMasked: '线上办理，无需邮寄',
      deliveryContactNameEncrypted: encrypt(ownerName || '本人'),
      deliveryContactPhoneEncrypted: encrypt('13800000000'),
    },
  });

  await prisma.violationPayment.create({
    data: {
      orderId: order.id,
      plateNumberEncrypted: encrypt(plateNumber),
      plateNumberMasked: maskLicensePlate(plateNumber),
      engineNoEncrypted: engineNo ? encrypt(engineNo) : undefined,
      vinNoEncrypted: vinNo ? encrypt(vinNo) : undefined,
      ownerNameEncrypted: ownerName ? encrypt(ownerName) : undefined,
      totalFineAmount: totalFine,
      totalLateFee: totalLate,
      totalDeductPoints: totalPoints,
      violationCount: records.length,
      records: { connect: records.map(r => ({ id: r.id })) },
      traffic12123ReqId: `12123-${uuidv4()}`,
      ministryPoliceReqId: `MPS-${uuidv4()}`,
    },
  });

  await prisma.$transaction(records.map(r =>
    prisma.violationRecord.update({ where: { id: r.id }, data: { paymentId: order.id } })
  ));

  await createAuditLog(req.user!, AuditActions.ORDER_CREATE, 'Order', { targetId: order.id, traceId: req.traceId });
  return ok(res, { orderId: order.id, orderNo: order.orderNo, totalAmount: order.totalAmount, fineBreakdown: { serviceFee: order.serviceFee, governmentFee: order.governmentFee, totalFine, totalLate, totalPoints } }, '违章缴费订单已创建');
});

router.post('/inspection', authMiddleware(), requireVerifiedApplicant, [
  body('plateNumber').notEmpty(),
  body('vehicleType').notEmpty(),
  body('registerDate').notEmpty(),
  body('applicantCity').isIn(config.gdCities),
  body('pickupAddress').notEmpty(),
  body('pickupContactName').notEmpty(),
  body('pickupContactPhone').isLength({ min: 11 }),
  body('deliveryAddress').notEmpty(),
  body('deliveryContactName').notEmpty(),
  body('deliveryContactPhone').isLength({ min: 11 }),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { plateNumber, vehicleType, engineNo, vinNo, registerDate, inspectionStationCode, applicantCity, pickupAddress, pickupContactName, pickupContactPhone, pickupLat, pickupLon, deliveryAddress, deliveryContactName, deliveryContactPhone } = req.body;
  const cityConfig = await prisma.cityServiceConfig.findUnique({ where: { city: applicantCity } });
  if (!cityConfig || !cityConfig.isInspectionEnabled) return fail(res, 400, '该城市暂未开通六年免检服务');

  const order = await createOrder({
    applicantId: req.user!.userId, applicantCity,
    orderType: OrderType.VEHICLE_INSPECTION,
    pickupAddress, pickupContactName, pickupContactPhone, pickupLat, pickupLon,
    deliveryAddress, deliveryContactName, deliveryContactPhone,
    serviceFee: cityConfig.inspectionServiceFee.toNumber(),
    governmentFee: 0,
    courierFee: cityConfig.courierFeeStandard.toNumber() * 2,
  }, req.traceId);

  await prisma.vehicleInspection.create({
    data: {
      orderId: order.id,
      plateNumberEncrypted: encrypt(plateNumber),
      plateNumberMasked: maskLicensePlate(plateNumber),
      vehicleType,
      engineNoEncrypted: engineNo ? encrypt(engineNo) : undefined,
      vinNoEncrypted: vinNo ? encrypt(vinNo) : undefined,
      registerDate: new Date(registerDate),
      inspectionStationCode,
      inspectionStationName: inspectionStationCode ? `检测站${inspectionStationCode}` : undefined,
      stationApiReqId: `STATION-${uuidv4()}`,
    },
  });

  await createAuditLog(req.user!, AuditActions.ORDER_CREATE, 'Order', { targetId: order.id, traceId: req.traceId });
  setTimeout(async () => { try { await assignCourier(order.id, applicantCity); } catch {} }, 1000);

  return ok(res, { orderId: order.id, orderNo: order.orderNo, totalAmount: order.totalAmount }, '六年免检申请已提交');
});

router.get('/violation/history', authMiddleware(), [
  query('plateNumber').notEmpty(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 50 }),
], async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const plateMasked = maskLicensePlate(req.query.plateNumber as string);
  const [list, total] = await Promise.all([
    prisma.violationRecord.findMany({
      where: { plateNumberMasked: plateMasked },
      orderBy: { violationTime: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.violationRecord.count({ where: { plateNumberMasked: plateMasked } }),
  ]);
  return paginated(res, list.map(v => ({
    id: v.id, plateMasked: v.plateNumberMasked, violationCode: v.violationCode,
    violationDesc: v.violationDesc, violationTime: v.violationTime,
    violationLocation: v.violationLocation, fineAmount: v.fineAmount,
    lateFee: v.lateFee, deductPoints: v.deductPoints, isHandled: v.isHandled,
  })), total, page, pageSize);
});

export default router;
