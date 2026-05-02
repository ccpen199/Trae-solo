import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { addMonths } from 'date-fns';
import { AuthRequest, authenticate, requireAdmin, requireStudent, getOrganizationId, getUserId, getUserRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { checkRenewalNeeded } from '../engines/consumption.engine';
import { PaymentStatus } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, '学员ID不能为空'),
  courseId: z.string().min(1, '课程ID不能为空'),
  coursePackageId: z.string().optional(),
  totalHours: z.coerce.number().min(1, '课时数至少1'),
  startDate: z.coerce.date().default(() => new Date()),
  validMonths: z.coerce.number().min(1, '有效期至少1个月').default(12),
  paymentAmount: z.coerce.number().min(0, '金额不能为负数'),
  discount: z.coerce.number().min(0, '折扣不能为负数').default(0),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

const renewEnrollmentSchema = z.object({
  totalHours: z.coerce.number().min(1, '课时数至少1'),
  validMonths: z.coerce.number().min(1, '有效期至少1个月').default(12),
  paymentAmount: z.coerce.number().min(0, '金额不能为负数'),
  discount: z.coerce.number().min(0, '折扣不能为负数').default(0),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

const createPaymentSchema = z.object({
  enrollmentId: z.string().min(1, '报名ID不能为空'),
  amount: z.coerce.number().min(0, '金额不能为负数'),
  discount: z.coerce.number().min(0, '折扣不能为负数').default(0),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const status = req.query.status as string | undefined;
    const studentId = req.query.studentId as string | undefined;
    const courseId = req.query.courseId as string | undefined;

    const where: Record<string, unknown> = {
      organizationId,
    };

    if (userRole === 'STUDENT' || userRole === 'PARENT') {
      where.studentId = userId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }
    if (courseId) {
      where.courseId = courseId;
    }

    const total = await prisma.enrollment.count({ where });

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            realName: true,
            phone: true,
            studentProfile: true,
          },
        },
        course: true,
        coursePackage: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        consumptions: {
          orderBy: { consumedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { attendances: true, consumptions: true, payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    sendPaginated(res, enrollments, { page, pageSize, total });
  })
);

router.get(
  '/renewal-check',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const thresholdHours = parseInt(req.query.thresholdHours as string) || 5;
    const thresholdDays = parseInt(req.query.thresholdDays as string) || 14;

    const results = await checkRenewalNeeded(
      organizationId,
      thresholdHours,
      thresholdDays
    );

    sendSuccess(res, {
      thresholdHours,
      thresholdDays,
      count: results.length,
      enrollments: results,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        student: {
          select: {
            id: true,
            realName: true,
            phone: true,
            email: true,
            avatar: true,
            studentProfile: true,
          },
        },
        course: true,
        coursePackage: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        consumptions: {
          include: {
            schedule: {
              include: {
                teacher: true,
                classroom: true,
              },
            },
          },
          orderBy: { consumedAt: 'desc' },
        },
        attendances: {
          include: {
            schedule: true,
            consumption: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('报名记录不存在');
    }

    sendSuccess(res, enrollment);
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const validated = createEnrollmentSchema.parse(req.body);

    const student = await prisma.user.findFirst({
      where: {
        id: validated.studentId,
        organizationId,
        isActive: true,
      },
    });

    if (!student) {
      throw new NotFoundError('学员不存在或已禁用');
    }

    const course = await prisma.course.findFirst({
      where: {
        id: validated.courseId,
        organizationId,
        isActive: true,
      },
    });

    if (!course) {
      throw new NotFoundError('课程不存在或已禁用');
    }

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validated.studentId,
        courseId: validated.courseId,
        organizationId,
        status: 'ACTIVE',
      },
    });

    if (existingEnrollment) {
      throw new BadRequestError('该学员已报名此课程且报名有效');
    }

    const startDate = validated.startDate;
    const endDate = addMonths(startDate, validated.validMonths);

    const enrollment = await prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          organizationId,
          studentId: validated.studentId,
          courseId: validated.courseId,
          coursePackageId: validated.coursePackageId,
          totalHours: validated.totalHours,
          remainingHours: validated.totalHours,
          usedHours: 0,
          startDate,
          endDate,
          status: 'ACTIVE',
        },
        include: {
          student: true,
          course: true,
          coursePackage: true,
        },
      });

      if (validated.paymentAmount > 0) {
        await tx.payment.create({
          data: {
            organizationId,
            enrollmentId: newEnrollment.id,
            studentId: validated.studentId,
            amount: validated.paymentAmount,
            paidAmount: validated.paymentAmount,
            discount: validated.discount,
            paymentMethod: validated.paymentMethod,
            transactionId: validated.transactionId,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            notes: validated.notes,
          },
        });
      }

      return newEnrollment;
    });

    logger.info('报名创建成功', {
      enrollmentId: enrollment.id,
      organizationId,
      studentId: validated.studentId,
      courseId: validated.courseId,
    });

    sendCreated(res, enrollment);
  })
);

router.post(
  '/:id/renew',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const validated = renewEnrollmentSchema.parse(req.body);

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        student: true,
        course: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('报名记录不存在');
    }

    const newTotalHours = enrollment.totalHours + validated.totalHours;
    const newRemainingHours = enrollment.remainingHours + validated.totalHours;
    const newEndDate = addMonths(
      enrollment.endDate > new Date() ? enrollment.endDate : new Date(),
      validated.validMonths
    );

    const updatedEnrollment = await prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id },
        data: {
          totalHours: newTotalHours,
          remainingHours: newRemainingHours,
          endDate: newEndDate,
          lastRenewalAt: new Date(),
          status: 'ACTIVE',
        },
        include: {
          student: true,
          course: true,
        },
      });

      if (validated.paymentAmount > 0) {
        await tx.payment.create({
          data: {
            organizationId,
            enrollmentId: id,
            studentId: enrollment.studentId,
            amount: validated.paymentAmount,
            paidAmount: validated.paymentAmount,
            discount: validated.discount,
            paymentMethod: validated.paymentMethod,
            transactionId: validated.transactionId,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            notes: validated.notes ? `续费: ${validated.notes}` : '续费',
          },
        });
      }

      return updated;
    });

    logger.info('续费成功', {
      enrollmentId: id,
      organizationId,
      addedHours: validated.totalHours,
    });

    sendSuccess(res, {
      message: '续费成功',
      enrollment: updatedEnrollment,
      addedHours: validated.totalHours,
      newTotalHours: newTotalHours,
      newRemainingHours: newRemainingHours,
      newEndDate: newEndDate,
    });
  })
);

router.post(
  '/:id/payment',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const validated = createPaymentSchema.parse(req.body);

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: validated.enrollmentId,
        organizationId,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('报名记录不存在');
    }

    const payment = await prisma.payment.create({
      data: {
        organizationId,
        enrollmentId: validated.enrollmentId,
        studentId: enrollment.studentId,
        amount: validated.amount,
        paidAmount: validated.amount,
        discount: validated.discount,
        paymentMethod: validated.paymentMethod,
        transactionId: validated.transactionId,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        notes: validated.notes,
      },
    });

    logger.info('支付记录创建成功', {
      paymentId: payment.id,
      enrollmentId: validated.enrollmentId,
      organizationId,
      amount: validated.amount,
    });

    sendCreated(res, payment);
  })
);

router.get(
  '/:id/payments',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const where = {
      enrollmentId: id,
      organizationId,
    };

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    sendPaginated(res, payments, { page, pageSize, total });
  })
);

export default router;
