import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requestDoorAccess, syncPaymentBills, submitRepairToThirdParty, callPropertyApi } from '../services/property-gateway.js';
import type { PropertyServiceType } from '@neighborhood/shared';

const router = Router();

const openDoorSchema = z.object({
  deviceId: z.string().min(1),
});

const payBillSchema = z.object({
  paymentMethod: z.enum(['wechat', 'alipay', 'balance']),
});

const submitRepairSchema = z.object({
  householdId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string().url()).optional(),
  category: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  appointmentTime: z.string().datetime().optional(),
});

const updateRepairSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['submitted', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  appointmentTime: z.string().datetime().optional(),
});

const rateRepairSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
});

const submitComplaintSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string().url()).optional(),
});

router.post('/access-control/open', authMiddleware, validate(openDoorSchema), async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const result = await requestDoorAccess(req.user!.id, deviceId);

    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.error ?? 'Failed to open door' });
    }

    return res.json({ code: 0, data: { message: 'Door opened successfully' } });
  } catch (error) {
    next(error);
  }
});

router.get('/bills', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;

    await syncPaymentBills(req.user!.tenantId).catch(() => {});

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [bills, total] = await Promise.all([
      prisma.paymentBill.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.paymentBill.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: bills, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.post('/bills/:id/pay', authMiddleware, validate(payBillSchema), async (req, res, next) => {
  try {
    const bill = await prisma.paymentBill.findUnique({ where: { id: req.params.id } });
    if (!bill) {
      return res.status(404).json({ code: 404, message: 'Bill not found' });
    }

    if (bill.userId !== req.user!.id) {
      return res.status(403).json({ code: 403, message: 'Not your bill' });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({ code: 400, message: 'Bill already paid' });
    }

    const { paymentMethod } = req.body;

    if (paymentMethod === 'balance') {
      const wallet = await prisma.userWallet.findUnique({ where: { userId: req.user!.id } });
      if (!wallet || wallet.balance < bill.unpaidAmount) {
        return res.status(400).json({ code: 400, message: 'Insufficient balance' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.userWallet.update({
          where: { userId: req.user!.id },
          data: { balance: { decrement: bill.unpaidAmount } },
        });

        await tx.paymentBill.update({
          where: { id: bill.id },
          data: {
            paidAmount: bill.totalAmount,
            unpaidAmount: 0,
            status: 'paid',
            paidAt: new Date(),
          },
        });
      });
    } else {
      await prisma.paymentBill.update({
        where: { id: bill.id },
        data: {
          paidAmount: bill.totalAmount,
          unpaidAmount: 0,
          status: 'paid',
          paidAt: new Date(),
        },
      });
    }

    return res.json({ code: 0, data: { status: 'paid' } });
  } catch (error) {
    next(error);
  }
});

router.post('/repairs', authMiddleware, validate(submitRepairSchema), async (req, res, next) => {
  try {
    const { householdId, title, description, images, category, priority, appointmentTime } = req.body;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const orderNo = `RPR${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const repair = await prisma.repairRequest.create({
      data: {
        orderNo,
        tenantId,
        userId: req.user!.id,
        householdId,
        title,
        description,
        images,
        category,
        priority,
        status: 'submitted',
        appointmentTime: appointmentTime ? new Date(appointmentTime) : undefined,
      },
    });

    submitRepairToThirdParty(repair.id).catch(() => {});

    return res.status(201).json({ code: 0, data: repair });
  } catch (error) {
    next(error);
  }
});

router.get('/repairs', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [repairs, total] = await Promise.all([
      prisma.repairRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.repairRequest.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: repairs, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.put('/repairs/:id', authMiddleware, validate(updateRepairSchema), async (req, res, next) => {
  try {
    const repair = await prisma.repairRequest.findUnique({ where: { id: req.params.id } });
    if (!repair) {
      return res.status(404).json({ code: 404, message: 'Repair request not found' });
    }

    if (repair.userId !== req.user!.id && req.user!.role !== 'property_admin' && req.user!.role !== 'tenant_admin') {
      return res.status(403).json({ code: 403, message: 'No permission' });
    }

    const updateData: Record<string, unknown> = { ...req.body };
    if (req.body.appointmentTime) {
      updateData.appointmentTime = new Date(req.body.appointmentTime);
    }

    const updated = await prisma.repairRequest.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.json({ code: 0, data: updated });
  } catch (error) {
    next(error);
  }
});

router.post('/repairs/:id/rate', authMiddleware, validate(rateRepairSchema), async (req, res, next) => {
  try {
    const repair = await prisma.repairRequest.findUnique({ where: { id: req.params.id } });
    if (!repair) {
      return res.status(404).json({ code: 404, message: 'Repair request not found' });
    }

    if (repair.userId !== req.user!.id) {
      return res.status(403).json({ code: 403, message: 'Not your repair request' });
    }

    if (repair.status !== 'completed') {
      return res.status(400).json({ code: 400, message: 'Can only rate completed repairs' });
    }

    const { rating, feedback } = req.body;

    await prisma.repairRequest.update({
      where: { id: req.params.id },
      data: { rating, feedback },
    });

    return res.json({ code: 0, data: { rating, feedback } });
  } catch (error) {
    next(error);
  }
});

router.post('/complaints', authMiddleware, validate(submitComplaintSchema), async (req, res, next) => {
  try {
    const { category, title, description, images } = req.body;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const orderNo = `CMP${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const complaint = await prisma.complaint.create({
      data: {
        orderNo,
        tenantId,
        userId: req.user!.id,
        category,
        title,
        description,
        images,
        status: 'submitted',
      },
    });

    return res.status(201).json({ code: 0, data: complaint });
  } catch (error) {
    next(error);
  }
});

router.get('/complaints', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.complaint.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: complaints, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const [notifications, total] = await Promise.all([
      prisma.propertyNotification.findMany({
        where: {
          tenantId,
          publishedAt: { not: null },
          OR: [
            { targetAudience: 'all' },
          ],
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.propertyNotification.count({
        where: {
          tenantId,
          publishedAt: { not: null },
          OR: [{ targetAudience: 'all' }],
        },
      }),
    ]);

    return res.json({ code: 0, data: { list: notifications, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.post('/gateway/:serviceType', authMiddleware, async (req, res, next) => {
  try {
    const { serviceType } = req.params;
    const { endpoint, method, data } = req.body as { endpoint: string; method: string; data?: Record<string, unknown> };

    const validServiceTypes: PropertyServiceType[] = ['access_control', 'payment', 'repair', 'complaint', 'notification'];
    if (!validServiceTypes.includes(serviceType as PropertyServiceType)) {
      return res.status(400).json({ code: 400, message: 'Invalid service type' });
    }

    const tenantId = req.tenant?.id ?? req.user!.tenantId;
    const result = await callPropertyApi(tenantId, serviceType as PropertyServiceType, endpoint, method, data);

    if (!result.success) {
      return res.status(502).json({ code: 502, message: result.error ?? 'Third-party API call failed' });
    }

    return res.json({ code: 0, data: result.data });
  } catch (error) {
    next(error);
  }
});

export default router;
