import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { validateBody, validateQuery, validateParams } from "../middleware/validation";
import { success, error } from "../utils/response";
import { UserRole, OcrStatus, IndicatorStatus, AbnormalLevel } from "../types/enums";
import prisma from "../lib/prisma";
import encryptionService from "../services/encryptionService";
import logger from "../utils/logger";

const router = Router();

const uploadReportSchema = z.object({
  bookingId: z.string(),
  reportDate: z.string().datetime().optional(),
  reportUrl: z.string(),
  reportType: z.string().optional(),
});

const trendsQuerySchema = z.object({
  indicator: z.string(),
  limit: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string(),
});

const mockOcrParse = (reportUrl: string, bookingId: string) => {
  const indicators = [
    { category: "血常规", name: "白细胞计数", value: "6.8", unit: "×10^9/L", referenceRange: "4.0-10.0", status: IndicatorStatus.NORMAL },
    { category: "血常规", name: "红细胞计数", value: "4.8", unit: "×10^12/L", referenceRange: "4.0-5.5", status: IndicatorStatus.NORMAL },
    { category: "血常规", name: "血红蛋白", value: "145", unit: "g/L", referenceRange: "120-160", status: IndicatorStatus.NORMAL },
    { category: "血常规", name: "血小板计数", value: "220", unit: "×10^9/L", referenceRange: "100-300", status: IndicatorStatus.NORMAL },
    { category: "肝功能", name: "谷丙转氨酶(ALT)", value: "45", unit: "U/L", referenceRange: "0-40", status: IndicatorStatus.ABNORMAL },
    { category: "肝功能", name: "谷草转氨酶(AST)", value: "35", unit: "U/L", referenceRange: "0-40", status: IndicatorStatus.NORMAL },
    { category: "肝功能", name: "总胆红素", value: "12.5", unit: "μmol/L", referenceRange: "3.4-17.1", status: IndicatorStatus.NORMAL },
    { category: "肾功能", name: "肌酐", value: "78", unit: "μmol/L", referenceRange: "44-133", status: IndicatorStatus.NORMAL },
    { category: "肾功能", name: "尿素氮", value: "5.2", unit: "mmol/L", referenceRange: "2.9-8.2", status: IndicatorStatus.NORMAL },
    { category: "肾功能", name: "尿酸", value: "420", unit: "μmol/L", referenceRange: "150-420", status: IndicatorStatus.NORMAL },
    { category: "血脂", name: "总胆固醇", value: "5.8", unit: "mmol/L", referenceRange: "0-5.2", status: IndicatorStatus.ABNORMAL },
    { category: "血脂", name: "甘油三酯", value: "1.5", unit: "mmol/L", referenceRange: "0-1.7", status: IndicatorStatus.NORMAL },
    { category: "血脂", name: "高密度脂蛋白", value: "1.2", unit: "mmol/L", referenceRange: ">1.0", status: IndicatorStatus.NORMAL },
    { category: "血脂", name: "低密度脂蛋白", value: "3.8", unit: "mmol/L", referenceRange: "0-3.4", status: IndicatorStatus.ABNORMAL },
    { category: "血糖", name: "空腹血糖", value: "6.5", unit: "mmol/L", referenceRange: "3.9-6.1", status: IndicatorStatus.ABNORMAL },
    { category: "血糖", name: "糖化血红蛋白", value: "6.2", unit: "%", referenceRange: "4.0-6.0", status: IndicatorStatus.ABNORMAL },
  ];

  const abnormalIndicators = indicators
    .filter((i) => i.status !== IndicatorStatus.NORMAL)
    .map((i) => {
      let level = AbnormalLevel.MILD;
      if (i.name === "空腹血糖" && parseFloat(i.value) >= 7.0) level = AbnormalLevel.MODERATE;
      if (i.name === "总胆固醇" && parseFloat(i.value) >= 6.2) level = AbnormalLevel.MODERATE;
      return {
        name: i.name,
        value: i.value,
        referenceRange: i.referenceRange,
        level,
        description: `${i.name}异常，建议定期复查并调整生活方式。`,
      };
    });

  const structuredData = {
    reportUrl,
    reportType: "体检报告",
    analysisDate: new Date().toISOString(),
    summary: {
      totalIndicators: indicators.length,
      normalCount: indicators.filter((i) => i.status === IndicatorStatus.NORMAL).length,
      abnormalCount: indicators.filter((i) => i.status !== IndicatorStatus.NORMAL).length,
      criticalCount: indicators.filter((i) => i.status === IndicatorStatus.CRITICAL).length,
    },
    recommendations: [
      "建议控制饮食，减少高脂肪、高糖食物摄入",
      "增加有氧运动，每周至少3次，每次30分钟",
      "定期监测血糖和血脂，建议3个月后复查",
      "保持规律作息，避免熬夜",
      "戒烟限酒，保持健康的生活方式",
    ],
  };

  return { indicators, abnormalIndicators, structuredData };
};

router.get(
  "/reports",
  authenticate,
  auditMiddleware({ action: "LIST_HEALTH_ARCHIVES", targetType: "HEALTH_ARCHIVE" }),
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, pageSize = 20 } = req.query;

    const where = { userId: req.user!.id };

    const [archives, total] = await Promise.all([
      prisma.healthArchive.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { reportDate: "desc" },
        include: {
          booking: {
            include: {
              healthPackage: {
                select: { name: true },
                institution: {
                  select: { name: true },
                },
              },
            },
          },
          _count: {
            select: {
              indicators: true,
              abnormalIndicators: true,
            },
          },
        },
      }),
      prisma.healthArchive.count({ where }),
    ]);

    success(res, { list: archives, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/reports/:id",
  authenticate,
  validateParams(idParamSchema),
  auditMiddleware({ action: "GET_HEALTH_ARCHIVE_DETAIL", targetType: "HEALTH_ARCHIVE" }),
  async (req: Request, res: Response): Promise<void> => {
    const archive = await prisma.healthArchive.findUnique({
      where: { id: req.params.id as string },
      include: {
        booking: {
          include: {
            healthPackage: {
              select: { id: true, name: true, items: true, institutionId: true },
            },
          },
        },
        indicators: {
          orderBy: { category: "asc" },
        },
        abnormalIndicators: {
          orderBy: { level: "asc" },
        },
      },
    });

    if (!archive) {
      error(res, "NOT_FOUND", "报告不存在", undefined, 404);
      return;
    }

    if (archive.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
      error(res, "FORBIDDEN", "无权查看此报告", undefined, 403);
      return;
    }

    let structuredData = undefined;
    if (archive.structuredData) {
      try {
        structuredData = JSON.parse(archive.structuredData);
      } catch (e) {
        logger.warn("结构化数据解析失败", { archiveId: archive.id });
      }
    }

    success(res, { ...archive, structuredData });
  }
);

router.get(
  "/trends",
  authenticate,
  validateQuery(trendsQuerySchema),
  auditMiddleware({ action: "GET_INDICATOR_TREND", targetType: "HEALTH_INDICATOR" }),
  async (req: Request, res: Response): Promise<void> => {
    const { indicator, limit = 10 } = req.query;

    if (!indicator) {
      error(res, "VALIDATION_ERROR", "请提供指标名称", undefined, 400);
      return;
    }

    const indicators = await prisma.healthIndicator.findMany({
      where: {
        archive: {
          userId: req.user!.id,
        },
        name: String(indicator),
      },
      include: {
        archive: {
          select: {
            reportDate: true,
          },
        },
      },
      orderBy: {
        archive: {
          reportDate: "desc",
        },
      },
      take: Number(limit),
    });

    const trendData = indicators.map((item) => ({
      date: item.archive.reportDate,
      value: item.value,
      unit: item.unit,
      referenceRange: item.referenceRange,
      status: item.status,
    }));

    success(res, {
      indicator: String(indicator),
      data: trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    });
  }
);

router.post(
  "/upload",
  authenticate,
  validateBody(uploadReportSchema),
  auditMiddleware({ action: "UPLOAD_REPORT", targetType: "HEALTH_ARCHIVE", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = uploadReportSchema.parse(req.body);

      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
      });

      if (!booking) {
        error(res, "NOT_FOUND", "预约记录不存在", undefined, 404);
        return;
      }

      if (booking.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        error(res, "FORBIDDEN", "无权上传此预约的报告", undefined, 403);
        return;
      }

      const existingArchive = await prisma.healthArchive.findUnique({
        where: { bookingId: data.bookingId },
      });

      if (existingArchive) {
        error(res, "DUPLICATE_ENTRY", "该预约已有体检报告", undefined, 409);
        return;
      }

      const ocrResult = mockOcrParse(data.reportUrl, data.bookingId);

      const archive = await prisma.$transaction(async (tx) => {
        const newArchive = await tx.healthArchive.create({
          data: {
            userId: req.user!.id,
            bookingId: data.bookingId,
            reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
            reportUrl: data.reportUrl,
            ocrStatus: OcrStatus.COMPLETED,
            structuredData: JSON.stringify(ocrResult.structuredData),
          },
        });

        await tx.healthIndicator.createMany({
          data: ocrResult.indicators.map((i) => ({
            ...i,
            archiveId: newArchive.id,
            measureDate: data.reportDate ? new Date(data.reportDate) : new Date(),
          })),
        });

        await tx.abnormalIndicator.createMany({
          data: ocrResult.abnormalIndicators.map((i) => ({
            ...i,
            archiveId: newArchive.id,
          })),
        });

        await tx.booking.update({
          where: { id: data.bookingId },
          data: {
            status: "COMPLETED",
            reportId: newArchive.id,
          },
        });

        return newArchive;
      });

      logger.info("体检报告上传成功", {
        userId: req.user!.id,
        archiveId: archive.id,
        bookingId: data.bookingId,
      });

      success(res, archive, "报告上传成功，已完成OCR解析", 201);
    } catch (err) {
      if (err instanceof Error) {
        error(res, "UPLOAD_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

export default router;
