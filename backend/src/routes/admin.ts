import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { validateQuery, validateParams } from "../middleware/validation";
import { success, error } from "../utils/response";
import { UserRole, InstitutionStatus, PackageStatus } from "../types/enums";
import prisma from "../lib/prisma";
import auditService from "../services/auditService";

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

const institutionQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const companyQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const auditLogQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string(),
});

router.get(
  "/institutions",
  validateQuery(institutionQuerySchema),
  auditMiddleware({ action: "ADMIN_LIST_INSTITUTIONS", targetType: "INSTITUTION" }),
  async (req: Request, res: Response): Promise<void> => {
    const { status, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

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

router.put(
  "/institutions/:id/approve",
  validateParams(idParamSchema),
  auditMiddleware({ action: "ADMIN_APPROVE_INSTITUTION", targetType: "INSTITUTION", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    const institution = await prisma.institution.findUnique({
      where: { id: req.params.id as string },
    });

    if (!institution) {
      error(res, "NOT_FOUND", "机构不存在", undefined, 404);
      return;
    }

    if (institution.status === InstitutionStatus.APPROVED) {
      error(res, "ALREADY_APPROVED", "机构已审核通过", undefined, 400);
      return;
    }

    const updated = await prisma.institution.update({
      where: { id: req.params.id as string },
      data: {
        status: InstitutionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: req.user!.id,
      },
    });

    success(res, updated, "机构审核通过");
  }
);

router.get(
  "/insurance-companies",
  validateQuery(companyQuerySchema),
  auditMiddleware({ action: "ADMIN_LIST_INSURANCE_COMPANIES", targetType: "INSURANCE_COMPANY" }),
  async (req: Request, res: Response): Promise<void> => {
    const { status, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [companies, total] = await Promise.all([
      prisma.insuranceCompany.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
      }),
      prisma.insuranceCompany.count({ where }),
    ]);

    success(res, { list: companies, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.put(
  "/insurance-companies/:id/approve",
  validateParams(idParamSchema),
  auditMiddleware({ action: "ADMIN_APPROVE_INSURANCE_COMPANY", targetType: "INSURANCE_COMPANY", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    const company = await prisma.insuranceCompany.findUnique({
      where: { id: req.params.id as string },
    });

    if (!company) {
      error(res, "NOT_FOUND", "保险公司不存在", undefined, 404);
      return;
    }

    if (company.status === InstitutionStatus.APPROVED) {
      error(res, "ALREADY_APPROVED", "保险公司已审核通过", undefined, 400);
      return;
    }

    const updated = await prisma.insuranceCompany.update({
      where: { id: req.params.id as string },
      data: {
        status: InstitutionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: req.user!.id,
      },
    });

    success(res, updated, "保险公司审核通过");
  }
);

router.get(
  "/statistics",
  auditMiddleware({ action: "ADMIN_GET_STATISTICS", targetType: "STATISTICS" }),
  async (req: Request, res: Response): Promise<void> => {
    const [
      totalUsers,
      totalUsersByRole,
      totalInstitutions,
      totalInstitutionsPending,
      totalInsuranceCompanies,
      totalInsuranceCompaniesPending,
      totalBookings,
      totalBookingsByStatus,
      totalInsuranceOrders,
      totalInsuranceOrdersByStatus,
      totalRevenue,
      totalHealthArchives,
      totalRiskAssessments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.institution.count(),
      prisma.institution.count({ where: { status: InstitutionStatus.PENDING } }),
      prisma.insuranceCompany.count(),
      prisma.insuranceCompany.count({ where: { status: InstitutionStatus.PENDING } }),
      prisma.booking.count(),
      prisma.booking.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.insuranceOrder.count(),
      prisma.insuranceOrder.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.booking.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { amount: true },
      }),
      prisma.healthArchive.count(),
      prisma.riskAssessment.count(),
    ]);

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [newUsersLast30Days, newBookingsLast30Days, newOrdersLast30Days] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.insuranceOrder.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalInstitutions,
        totalInstitutionsPending,
        totalInsuranceCompanies,
        totalInsuranceCompaniesPending,
        totalBookings,
        totalInsuranceOrders,
        totalHealthArchives,
        totalRiskAssessments,
        totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
      },
      breakdown: {
        usersByRole: totalUsersByRole.map((item) => ({
          role: item.role,
          count: item._count.role,
        })),
        bookingsByStatus: totalBookingsByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        ordersByStatus: totalInsuranceOrdersByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      },
      trends: {
        newUsersLast30Days,
        newBookingsLast30Days,
        newOrdersLast30Days,
      },
    };

    success(res, stats);
  }
);

router.get(
  "/compliance/logs",
  validateQuery(auditLogQuerySchema),
  auditMiddleware({ action: "ADMIN_LIST_AUDIT_LOGS", targetType: "AUDIT_LOG" }),
  async (req: Request, res: Response): Promise<void> => {
    const { userId, action, targetType, page = 1, pageSize = 20 } = req.query;

    const result = await auditService.getLogs(
      userId as string | undefined,
      action as string | undefined,
      targetType as string | undefined,
      Number(page),
      Number(pageSize)
    );

    success(res, { ...result, page: Number(page), pageSize: Number(pageSize) });
  }
);

export default router;
