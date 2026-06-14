import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { encryptionMiddleware } from "../middleware/encryption";
import { validateBody, validateQuery, validateParams } from "../middleware/validation";
import { success, error } from "../utils/response";
import { UserRole, PackageStatus, InstitutionStatus, BookingStatus, PaymentStatus } from "../types/enums";
import prisma from "../lib/prisma";
import encryptionService from "../services/encryptionService";

const router = Router();

const bookingSchema = z.object({
  packageId: z.string(),
  checkupDate: z.string().datetime(),
  checkupTime: z.string(),
  checkupPerson: z.object({
    name: z.string(),
    idCard: z.string(),
    phone: z.string(),
    gender: z.string(),
  }),
});

const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

const packageQuerySchema = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  ageMin: z.string().optional(),
  ageMax: z.string().optional(),
  gender: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const institutionQuerySchema = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string(),
});

router.get(
  "/institutions",
  validateQuery(institutionQuerySchema),
  auditMiddleware({ action: "LIST_INSTITUTIONS", targetType: "INSTITUTION" }),
  async (req: Request, res: Response): Promise<void> => {
    const { city, type, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = { status: InstitutionStatus.APPROVED };
    if (city) where.city = city;
    if (type) where.type = type;

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
      }),
      prisma.institution.count({ where }),
    ]);

    success(res, { list: institutions, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/institutions/:id",
  validateParams(idParamSchema),
  auditMiddleware({ action: "GET_INSTITUTION_DETAIL", targetType: "INSTITUTION" }),
  async (req: Request, res: Response): Promise<void> => {
    const institution = await prisma.institution.findUnique({
      where: { id: req.params.id as string },
      include: {
        healthPackages: {
          where: { status: PackageStatus.PUBLISHED },
          take: 10,
        },
      },
    });

    if (!institution) {
      error(res, "NOT_FOUND", "机构不存在", undefined, 404);
      return;
    }

    success(res, institution);
  }
);

router.get(
  "/packages",
  validateQuery(packageQuerySchema),
  auditMiddleware({ action: "LIST_PACKAGES", targetType: "HEALTH_PACKAGE" }),
  async (req: Request, res: Response): Promise<void> => {
    const { city, type, priceMin, priceMax, ageMin, ageMax, gender, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = { status: PackageStatus.PUBLISHED };
    if (city) where.city = city;
    if (type) where.type = type;
    if (gender) where.gender = gender;

    if (priceMin || priceMax) {
      where.price = {} as Record<string, number>;
      if (priceMin) (where.price as Record<string, number>).gte = Number(priceMin);
      if (priceMax) (where.price as Record<string, number>).lte = Number(priceMax);
    }

    if (ageMin || ageMax) {
      where.OR = [] as Record<string, unknown>[];
      if (ageMin) {
        (where.OR as Record<string, unknown>[]).push({ ageMax: { gte: Number(ageMin) } });
      }
      if (ageMax) {
        (where.OR as Record<string, unknown>[]).push({ ageMin: { lte: Number(ageMax) } });
      }
    }

    const [packages, total] = await Promise.all([
      prisma.healthPackage.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              type: true,
              level: true,
              logoUrl: true,
            },
          },
        },
      }),
      prisma.healthPackage.count({ where }),
    ]);

    success(res, { list: packages, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/packages/:id",
  validateParams(idParamSchema),
  auditMiddleware({ action: "GET_PACKAGE_DETAIL", targetType: "HEALTH_PACKAGE" }),
  async (req: Request, res: Response): Promise<void> => {
    const pkg = await prisma.healthPackage.findUnique({
      where: { id: req.params.id as string },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
            address: true,
            phone: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!pkg) {
      error(res, "NOT_FOUND", "套餐不存在", undefined, 404);
      return;
    }

    success(res, pkg);
  }
);

router.post(
  "/bookings",
  authenticate,
  validateBody(bookingSchema),
  encryptionMiddleware,
  auditMiddleware({ action: "CREATE_BOOKING", targetType: "BOOKING", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = bookingSchema.parse(req.body);

      const pkg = await prisma.healthPackage.findUnique({
        where: { id: data.packageId },
      });

      if (!pkg) {
        error(res, "NOT_FOUND", "套餐不存在", undefined, 404);
        return;
      }

      if (pkg.status !== PackageStatus.PUBLISHED) {
        error(res, "INVALID_PACKAGE", "套餐不可预约", undefined, 400);
        return;
      }

      const checkupPersonEncrypted = req.body.checkupPersonEncrypted || encryptionService.encryptObject(data.checkupPerson);

      const booking = await prisma.booking.create({
        data: {
          userId: req.user!.id,
          packageId: data.packageId,
          checkupDate: new Date(data.checkupDate),
          checkupTime: data.checkupTime,
          checkupPersonEncrypted,
          amount: pkg.price,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
        },
      });

      success(res, booking, "预约成功", 201);
    } catch (err) {
      if (err instanceof Error) {
        error(res, "BOOKING_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

router.get(
  "/bookings",
  authenticate,
  auditMiddleware({ action: "LIST_BOOKINGS", targetType: "BOOKING" }),
  async (req: Request, res: Response): Promise<void> => {
    const { status, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          healthPackage: {
            include: {
              institution: {
                select: { name: true, address: true, phone: true },
              },
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const decryptedBookings = bookings.map((booking) => {
      let checkupPerson = undefined;
      try {
        checkupPerson = encryptionService.decryptObject<{ name: string; phone: string }>(booking.checkupPersonEncrypted);
        if (checkupPerson?.phone) {
          checkupPerson.phone = encryptionService.maskPhone(checkupPerson.phone);
        }
      } catch (e) {
        // 解密失败
      }
      return { ...booking, checkupPerson };
    });

    success(res, { list: decryptedBookings, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/bookings/:id",
  authenticate,
  validateParams(idParamSchema),
  auditMiddleware({ action: "GET_BOOKING_DETAIL", targetType: "BOOKING" }),
  async (req: Request, res: Response): Promise<void> => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: {
        healthPackage: {
          include: {
            institution: {
              select: { name: true, address: true, phone: true },
            },
          },
        },
      },
    });

    if (!booking) {
      error(res, "NOT_FOUND", "预约不存在", undefined, 404);
      return;
    }

    if (booking.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
      error(res, "FORBIDDEN", "无权查看此预约", undefined, 403);
      return;
    }

    let checkupPerson = undefined;
    try {
      checkupPerson = encryptionService.decryptObject<{ name: string; phone: string; idCard: string }>(booking.checkupPersonEncrypted);
      if (checkupPerson?.phone) {
        checkupPerson.phone = encryptionService.maskPhone(checkupPerson.phone);
      }
      if (checkupPerson?.idCard) {
        checkupPerson.idCard = encryptionService.maskIdCard(checkupPerson.idCard);
      }
    } catch (e) {
      // 解密失败
    }

    success(res, { ...booking, checkupPerson });
  }
);

router.put(
  "/bookings/:id/status",
  authenticate,
  validateParams(idParamSchema),
  validateBody(bookingStatusSchema),
  auditMiddleware({ action: "UPDATE_BOOKING_STATUS", targetType: "BOOKING", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id as string },
      });

      if (!booking) {
        error(res, "NOT_FOUND", "预约不存在", undefined, 404);
        return;
      }

      if (booking.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN && req.user!.role !== UserRole.INSTITUTION_ADMIN) {
        error(res, "FORBIDDEN", "无权更新此预约状态", undefined, 403);
        return;
      }

      if (status === BookingStatus.CANCELLED && (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED)) {
        error(res, "INVALID_STATUS", "此状态下无法取消预约", undefined, 400);
        return;
      }

      const updated = await prisma.booking.update({
        where: { id: req.params.id as string },
        data: { status },
      });

      success(res, updated, "状态更新成功");
    } catch (err) {
      if (err instanceof Error) {
        error(res, "UPDATE_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

export default router;
