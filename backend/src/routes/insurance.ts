import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { encryptionMiddleware } from "../middleware/encryption";
import { validateBody, validateQuery, validateParams } from "../middleware/validation";
import { success, error } from "../utils/response";
import {
  UserRole,
  InsuranceOrderStatus,
  PackageStatus,
  InstitutionStatus,
  UnderwritingDecision,
  InsuranceProductType,
} from "../types/enums";
import prisma from "../lib/prisma";
import encryptionService from "../services/encryptionService";
import logger from "../utils/logger";

const router = Router();

const insuranceOrderSchema = z.object({
  productId: z.string(),
  applicant: z.object({
    name: z.string(),
    idCard: z.string(),
    phone: z.string(),
    gender: z.string(),
    birthDate: z.string(),
  }),
  insured: z.object({
    name: z.string(),
    idCard: z.string(),
    phone: z.string(),
    gender: z.string(),
    birthDate: z.string(),
    relationship: z.string(),
  }),
  beneficiary: z.string().optional(),
});

const underwritingEvaluateSchema = z.object({
  productId: z.string(),
  insured: z.object({
    age: z.number().min(0).max(100),
    gender: z.enum(["MALE", "FEMALE"]),
    bmi: z.number().min(10).max(50).optional(),
    bloodPressure: z
      .object({
        systolic: z.number().min(60).max(250),
        diastolic: z.number().min(40).max(150),
      })
      .optional(),
    bloodGlucose: z.number().min(2).max(30).optional(),
    cholesterol: z.number().min(2).max(15).optional(),
    smoker: z.boolean().optional(),
    chronicDiseases: z.array(z.string()).optional(),
    familyHistory: z.array(z.string()).optional(),
  }),
});

const productQuerySchema = z.object({
  type: z.string().optional(),
  companyId: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string(),
});

interface UnderwritingResult {
  decision: UnderwritingDecision;
  riskScore: number;
  premiumAdjustment?: number;
  exclusions?: string[];
  reasons: string[];
  suggestions?: string[];
}

const evaluateUnderwriting = (data: z.infer<typeof underwritingEvaluateSchema>): UnderwritingResult => {
  const { insured } = data;
  let riskScore = 0;
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const exclusions: string[] = [];

  if (insured.age > 60) {
    riskScore += 30;
    reasons.push("年龄超过60岁，属于高风险人群");
    suggestions.push("建议选择老年专属保险产品");
  } else if (insured.age > 50) {
    riskScore += 15;
    reasons.push("年龄超过50岁，风险等级提升");
  }

  if (insured.bmi) {
    if (insured.bmi >= 30) {
      riskScore += 20;
      reasons.push("BMI指数过高（肥胖）");
      suggestions.push("建议控制体重，合理饮食");
    } else if (insured.bmi >= 25) {
      riskScore += 10;
      reasons.push("BMI指数偏高（超重）");
    }
  }

  if (insured.bloodPressure) {
    if (insured.bloodPressure.systolic >= 160 || insured.bloodPressure.diastolic >= 100) {
      riskScore += 25;
      reasons.push("高血压2级及以上");
      exclusions.push("高血压相关并发症");
      suggestions.push("建议定期监测血压，遵医嘱服药");
    } else if (insured.bloodPressure.systolic >= 140 || insured.bloodPressure.diastolic >= 90) {
      riskScore += 15;
      reasons.push("高血压1级");
      suggestions.push("建议改善生活方式，控制血压");
    }
  }

  if (insured.bloodGlucose) {
    if (insured.bloodGlucose >= 11.1) {
      riskScore += 30;
      reasons.push("糖尿病风险极高");
      exclusions.push("糖尿病及相关并发症");
      suggestions.push("建议立即就医，控制血糖");
    } else if (insured.bloodGlucose >= 7.0) {
      riskScore += 20;
      reasons.push("血糖偏高，糖尿病风险");
      suggestions.push("建议定期检测血糖，控制饮食");
    }
  }

  if (insured.cholesterol) {
    if (insured.cholesterol >= 6.2) {
      riskScore += 15;
      reasons.push("总胆固醇偏高");
      suggestions.push("建议低脂饮食，增加运动");
    }
  }

  if (insured.smoker) {
    riskScore += 15;
    reasons.push("吸烟人群，肺部疾病风险增加");
    suggestions.push("建议戒烟");
  }

  if (insured.chronicDiseases && insured.chronicDiseases.length > 0) {
    riskScore += insured.chronicDiseases.length * 10;
    reasons.push(`存在慢性病: ${insured.chronicDiseases.join(", ")}`);
    insured.chronicDiseases.forEach((disease) => {
      exclusions.push(`${disease}相关并发症`);
    });
  }

  if (insured.familyHistory && insured.familyHistory.length > 0) {
    riskScore += insured.familyHistory.length * 5;
    reasons.push(`家族病史: ${insured.familyHistory.join(", ")}`);
  }

  let decision: UnderwritingDecision;
  let premiumAdjustment: number | undefined;

  if (riskScore >= 70) {
    decision = UnderwritingDecision.DECLINE;
  } else if (riskScore >= 50) {
    decision = UnderwritingDecision.SUBSTANDARD;
    premiumAdjustment = 1 + (riskScore - 40) * 0.02;
  } else if (exclusions.length > 0) {
    decision = UnderwritingDecision.EXCLUSION;
    premiumAdjustment = 1 + riskScore * 0.01;
  } else if (riskScore >= 20) {
    decision = UnderwritingDecision.SUBSTANDARD;
    premiumAdjustment = 1 + riskScore * 0.01;
  } else {
    decision = UnderwritingDecision.STANDARD;
    premiumAdjustment = 1;
  }

  return {
    decision,
    riskScore,
    premiumAdjustment,
    exclusions: exclusions.length > 0 ? exclusions : undefined,
    reasons,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
};

router.get(
  "/companies",
  auditMiddleware({ action: "LIST_INSURANCE_COMPANIES", targetType: "INSURANCE_COMPANY" }),
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, pageSize = 20 } = req.query;

    const [companies, total] = await Promise.all([
      prisma.insuranceCompany.findMany({
        where: { status: InstitutionStatus.APPROVED },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
      }),
      prisma.insuranceCompany.count({ where: { status: InstitutionStatus.APPROVED } }),
    ]);

    success(res, { list: companies, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/products",
  validateQuery(productQuerySchema),
  auditMiddleware({ action: "LIST_INSURANCE_PRODUCTS", targetType: "INSURANCE_PRODUCT" }),
  async (req: Request, res: Response): Promise<void> => {
    const { type, companyId, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = { status: PackageStatus.PUBLISHED };
    if (type) where.type = type;
    if (companyId) where.companyId = companyId;

    const [products, total] = await Promise.all([
      prisma.insuranceProduct.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      }),
      prisma.insuranceProduct.count({ where }),
    ]);

    success(res, { list: products, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/products/:id",
  validateParams(idParamSchema),
  auditMiddleware({ action: "GET_INSURANCE_PRODUCT_DETAIL", targetType: "INSURANCE_PRODUCT" }),
  async (req: Request, res: Response): Promise<void> => {
    const product = await prisma.insuranceProduct.findUnique({
      where: { id: req.params.id as string },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            licenseNumber: true,
            contactName: true,
            contactPhone: true,
          },
        },
      },
    });

    if (!product) {
      error(res, "NOT_FOUND", "产品不存在", undefined, 404);
      return;
    }

    success(res, product);
  }
);

router.post(
  "/underwriting/evaluate",
  authenticate,
  validateBody(underwritingEvaluateSchema),
  auditMiddleware({ action: "UNDERWRITING_EVALUATE", targetType: "UNDERWRITING", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = underwritingEvaluateSchema.parse(req.body);

      const product = await prisma.insuranceProduct.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        error(res, "NOT_FOUND", "产品不存在", undefined, 404);
        return;
      }

      if (product.status !== PackageStatus.PUBLISHED) {
        error(res, "INVALID_PRODUCT", "产品不可投保", undefined, 400);
        return;
      }

      const result = evaluateUnderwriting(data);

      logger.info("核保评估完成", {
        userId: req.user!.id,
        productId: data.productId,
        decision: result.decision,
        riskScore: result.riskScore,
      });

      const basePremium = product.premium.toNumber();
      const finalPremium = result.premiumAdjustment ? Number((basePremium * result.premiumAdjustment).toFixed(2)) : basePremium;

      success(res, {
        ...result,
        basePremium,
        finalPremium,
      });
    } catch (err) {
      if (err instanceof Error) {
        error(res, "UNDERWRITING_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

router.post(
  "/orders",
  authenticate,
  validateBody(insuranceOrderSchema),
  encryptionMiddleware,
  auditMiddleware({ action: "CREATE_INSURANCE_ORDER", targetType: "INSURANCE_ORDER", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = insuranceOrderSchema.parse(req.body);

      const product = await prisma.insuranceProduct.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        error(res, "NOT_FOUND", "产品不存在", undefined, 404);
        return;
      }

      if (product.status !== PackageStatus.PUBLISHED) {
        error(res, "INVALID_PRODUCT", "产品不可投保", undefined, 400);
        return;
      }

      const applicantEncrypted = req.body.applicantEncrypted || encryptionService.encryptObject(data.applicant);
      const insuredEncrypted = req.body.insuredEncrypted || encryptionService.encryptObject(data.insured);

      const order = await prisma.insuranceOrder.create({
        data: {
          userId: req.user!.id,
          productId: data.productId,
          applicantEncrypted,
          insuredEncrypted,
          beneficiary: data.beneficiary,
          premium: product.premium,
          status: InsuranceOrderStatus.PENDING_ASSESSMENT,
        },
      });

      success(res, order, "投保成功，请等待核保", 201);
    } catch (err) {
      if (err instanceof Error) {
        error(res, "ORDER_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

router.get(
  "/orders",
  authenticate,
  auditMiddleware({ action: "LIST_INSURANCE_ORDERS", targetType: "INSURANCE_ORDER" }),
  async (req: Request, res: Response): Promise<void> => {
    const { status, page = 1, pageSize = 20 } = req.query;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.insuranceOrder.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: {
              company: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.insuranceOrder.count({ where }),
    ]);

    const decryptedOrders = orders.map((order) => {
      let applicant = undefined;
      let insured = undefined;
      try {
        applicant = encryptionService.decryptObject<{ name: string; phone: string }>(order.applicantEncrypted);
        if (applicant?.phone) applicant.phone = encryptionService.maskPhone(applicant.phone);
        insured = encryptionService.decryptObject<{ name: string; phone: string }>(order.insuredEncrypted);
        if (insured?.phone) insured.phone = encryptionService.maskPhone(insured.phone);
      } catch (e) {
        // 解密失败
      }
      return { ...order, applicant, insured };
    });

    success(res, { list: decryptedOrders, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

router.get(
  "/orders/:id",
  authenticate,
  validateParams(idParamSchema),
  auditMiddleware({ action: "GET_INSURANCE_ORDER_DETAIL", targetType: "INSURANCE_ORDER" }),
  async (req: Request, res: Response): Promise<void> => {
    const order = await prisma.insuranceOrder.findUnique({
      where: { id: req.params.id as string },
      include: {
        product: {
          include: {
            company: {
              select: { name: true, contactPhone: true },
            },
          },
        },
      },
    });

    if (!order) {
      error(res, "NOT_FOUND", "保单不存在", undefined, 404);
      return;
    }

    if (order.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN && req.user!.role !== UserRole.INSURANCE_ADMIN) {
      error(res, "FORBIDDEN", "无权查看此保单", undefined, 403);
      return;
    }

    let applicant = undefined;
    let insured = undefined;
    try {
      applicant = encryptionService.decryptObject<{ name: string; phone: string; idCard: string }>(order.applicantEncrypted);
      if (applicant?.phone) applicant.phone = encryptionService.maskPhone(applicant.phone);
      if (applicant?.idCard) applicant.idCard = encryptionService.maskIdCard(applicant.idCard);
      insured = encryptionService.decryptObject<{ name: string; phone: string; idCard: string }>(order.insuredEncrypted);
      if (insured?.phone) insured.phone = encryptionService.maskPhone(insured.phone);
      if (insured?.idCard) insured.idCard = encryptionService.maskIdCard(insured.idCard);
    } catch (e) {
      // 解密失败
    }

    success(res, { ...order, applicant, insured });
  }
);

export default router;
