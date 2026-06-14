import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { validateBody, validateQuery, validateParams } from "../middleware/validation";
import { success, error } from "../utils/response";
import { UserRole, RiskLevel, IndicatorStatus } from "../types/enums";
import prisma from "../lib/prisma";
import logger from "../utils/logger";

const router = Router();

const analyzeSchema = z.object({
  indicators: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string().optional(),
      category: z.string().optional(),
    })
  ),
  age: z.number().min(0).max(120).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  height: z.number().min(50).max(250).optional(),
  weight: z.number().min(20).max(300).optional(),
  smoker: z.boolean().optional(),
  alcohol: z.boolean().optional(),
  exerciseFrequency: z.enum(["NEVER", "RARELY", "OCCASIONALLY", "REGULARLY", "FREQUENTLY"]).optional(),
  familyHistory: z.array(z.string()).optional(),
});

const idParamSchema = z.object({
  id: z.string(),
});

interface RiskAnalysisResult {
  diabetes: {
    risk: RiskLevel;
    score: number;
    factors: string[];
    suggestions: string[];
  };
  hypertension: {
    risk: RiskLevel;
    score: number;
    factors: string[];
    suggestions: string[];
  };
  cardiovascular: {
    risk: RiskLevel;
    score: number;
    factors: string[];
    suggestions: string[];
  };
  overall: {
    score: number;
    level: RiskLevel;
    summary: string;
  };
}

const calculateRisk = (score: number): RiskLevel => {
  if (score >= 75) return RiskLevel.VERY_HIGH;
  if (score >= 50) return RiskLevel.HIGH;
  if (score >= 25) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

const analyzeRisks = (data: z.infer<typeof analyzeSchema>): RiskAnalysisResult => {
  const { indicators, age, gender, height, weight, smoker, alcohol, exerciseFrequency, familyHistory } = data;

  let diabetesScore = 0;
  let hypertensionScore = 0;
  let cardiovascularScore = 0;

  const diabetesFactors: string[] = [];
  const hypertensionFactors: string[] = [];
  const cardiovascularFactors: string[] = [];

  const diabetesSuggestions: string[] = [];
  const hypertensionSuggestions: string[] = [];
  const cardiovascularSuggestions: string[] = [];

  const getIndicatorValue = (name: string): number | undefined => {
    const indicator = indicators.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));
    return indicator?.value;
  };

  if (age) {
    if (age >= 65) {
      diabetesScore += 20;
      hypertensionScore += 20;
      cardiovascularScore += 25;
      diabetesFactors.push("年龄≥65岁");
      hypertensionFactors.push("年龄≥65岁");
      cardiovascularFactors.push("年龄≥65岁");
    } else if (age >= 45) {
      diabetesScore += 15;
      hypertensionScore += 15;
      cardiovascularScore += 15;
      diabetesFactors.push("年龄45-64岁");
      hypertensionFactors.push("年龄45-64岁");
      cardiovascularFactors.push("年龄45-64岁");
    } else if (age >= 35) {
      diabetesScore += 8;
      hypertensionScore += 8;
      cardiovascularScore += 8;
    }
  }

  if (gender === "MALE") {
    diabetesScore += 5;
    cardiovascularScore += 10;
    cardiovascularFactors.push("男性");
  }

  if (height && weight) {
    const bmi = weight / ((height / 100) * (height / 100));
    if (bmi >= 30) {
      diabetesScore += 20;
      hypertensionScore += 20;
      cardiovascularScore += 20;
      diabetesFactors.push(`肥胖 (BMI: ${bmi.toFixed(1)})`);
      hypertensionFactors.push(`肥胖 (BMI: ${bmi.toFixed(1)})`);
      cardiovascularFactors.push(`肥胖 (BMI: ${bmi.toFixed(1)})`);
      diabetesSuggestions.push("建议减重，目标BMI<24");
      hypertensionSuggestions.push("建议减重，目标BMI<24");
      cardiovascularSuggestions.push("建议减重，目标BMI<24");
    } else if (bmi >= 24) {
      diabetesScore += 12;
      hypertensionScore += 12;
      cardiovascularScore += 12;
      diabetesFactors.push(`超重 (BMI: ${bmi.toFixed(1)})`);
      hypertensionFactors.push(`超重 (BMI: ${bmi.toFixed(1)})`);
      cardiovascularFactors.push(`超重 (BMI: ${bmi.toFixed(1)})`);
    }
  }

  if (smoker) {
    diabetesScore += 10;
    hypertensionScore += 15;
    cardiovascularScore += 25;
    diabetesFactors.push("吸烟");
    hypertensionFactors.push("吸烟");
    cardiovascularFactors.push("吸烟");
    diabetesSuggestions.push("建议戒烟");
    hypertensionSuggestions.push("建议戒烟");
    cardiovascularSuggestions.push("强烈建议戒烟");
  }

  if (alcohol) {
    diabetesScore += 8;
    hypertensionScore += 10;
    cardiovascularScore += 10;
    diabetesFactors.push("饮酒");
    hypertensionFactors.push("饮酒");
    cardiovascularFactors.push("饮酒");
    diabetesSuggestions.push("建议限酒");
    hypertensionSuggestions.push("建议限酒");
  }

  if (exerciseFrequency === "NEVER" || exerciseFrequency === "RARELY") {
    diabetesScore += 12;
    hypertensionScore += 10;
    cardiovascularScore += 15;
    diabetesFactors.push("缺乏运动");
    hypertensionFactors.push("缺乏运动");
    cardiovascularFactors.push("缺乏运动");
    diabetesSuggestions.push("建议每周至少150分钟中等强度运动");
    hypertensionSuggestions.push("建议每周至少150分钟中等强度运动");
    cardiovascularSuggestions.push("建议每周至少150分钟中等强度运动");
  }

  const fastingGlucose = getIndicatorValue("空腹血糖") || getIndicatorValue("glucose") || getIndicatorValue("血糖");
  if (fastingGlucose) {
    if (fastingGlucose >= 7.0) {
      diabetesScore += 35;
      diabetesFactors.push(`空腹血糖偏高: ${fastingGlucose}mmol/L`);
      diabetesSuggestions.push("建议就医，进一步检查是否已患糖尿病");
    } else if (fastingGlucose >= 6.1) {
      diabetesScore += 20;
      diabetesFactors.push(`空腹血糖受损: ${fastingGlucose}mmol/L`);
      diabetesSuggestions.push("建议进行糖耐量试验，控制饮食");
    }
  }

  const hba1c = getIndicatorValue("糖化血红蛋白") || getIndicatorValue("HbA1c");
  if (hba1c) {
    if (hba1c >= 6.5) {
      diabetesScore += 35;
      diabetesFactors.push(`糖化血红蛋白偏高: ${hba1c}%`);
    } else if (hba1c >= 5.7) {
      diabetesScore += 20;
      diabetesFactors.push(`糖化血红蛋白偏高: ${hba1c}%`);
    }
  }

  const systolic = getIndicatorValue("收缩压") || getIndicatorValue("systolic") || getIndicatorValue("高压");
  const diastolic = getIndicatorValue("舒张压") || getIndicatorValue("diastolic") || getIndicatorValue("低压");
  if (systolic || diastolic) {
    if (systolic && systolic >= 160) {
      hypertensionScore += 35;
      hypertensionFactors.push(`收缩压偏高: ${systolic}mmHg`);
      hypertensionSuggestions.push("建议就医，遵医嘱服用降压药");
    } else if (systolic && systolic >= 140) {
      hypertensionScore += 20;
      hypertensionFactors.push(`收缩压偏高: ${systolic}mmHg`);
      hypertensionSuggestions.push("建议监测血压，低盐饮食");
    }
    if (diastolic && diastolic >= 100) {
      hypertensionScore += 30;
      hypertensionFactors.push(`舒张压偏高: ${diastolic}mmHg`);
    } else if (diastolic && diastolic >= 90) {
      hypertensionScore += 15;
      hypertensionFactors.push(`舒张压偏高: ${diastolic}mmHg`);
    }
  }

  const cholesterol = getIndicatorValue("总胆固醇") || getIndicatorValue("cholesterol");
  if (cholesterol) {
    if (cholesterol >= 6.2) {
      cardiovascularScore += 25;
      cardiovascularFactors.push(`总胆固醇偏高: ${cholesterol}mmol/L`);
      cardiovascularSuggestions.push("建议低脂饮食，必要时服用他汀类药物");
    } else if (cholesterol >= 5.2) {
      cardiovascularScore += 12;
      cardiovascularFactors.push(`总胆固醇偏高: ${cholesterol}mmol/L`);
    }
  }

  const triglyceride = getIndicatorValue("甘油三酯") || getIndicatorValue("triglyceride");
  if (triglyceride) {
    if (triglyceride >= 2.3) {
      cardiovascularScore += 20;
      cardiovascularFactors.push(`甘油三酯偏高: ${triglyceride}mmol/L`);
    }
  }

  const ldl = getIndicatorValue("低密度脂蛋白") || getIndicatorValue("LDL");
  if (ldl) {
    if (ldl >= 4.1) {
      cardiovascularScore += 25;
      cardiovascularFactors.push(`低密度脂蛋白偏高: ${ldl}mmol/L`);
    } else if (ldl >= 3.4) {
      cardiovascularScore += 15;
      cardiovascularFactors.push(`低密度脂蛋白偏高: ${ldl}mmol/L`);
    }
  }

  if (familyHistory) {
    if (familyHistory.includes("diabetes") || familyHistory.includes("糖尿病")) {
      diabetesScore += 15;
      diabetesFactors.push("糖尿病家族史");
    }
    if (familyHistory.includes("hypertension") || familyHistory.includes("高血压")) {
      hypertensionScore += 12;
      hypertensionFactors.push("高血压家族史");
    }
    if (familyHistory.includes("cardiovascular") || familyHistory.includes("心脑血管") || familyHistory.includes("心脏病")) {
      cardiovascularScore += 20;
      cardiovascularFactors.push("心脑血管疾病家族史");
    }
  }

  if (diabetesSuggestions.length === 0) {
    diabetesSuggestions.push("保持健康的生活方式，均衡饮食，适量运动");
  }
  if (hypertensionSuggestions.length === 0) {
    hypertensionSuggestions.push("保持健康的生活方式，低盐饮食，适量运动");
  }
  if (cardiovascularSuggestions.length === 0) {
    cardiovascularSuggestions.push("保持健康的生活方式，均衡饮食，适量运动");
  }

  const overallScore = Math.round((diabetesScore + hypertensionScore + cardiovascularScore) / 3);
  const overallLevel = calculateRisk(overallScore);

  const summaries = {
    [RiskLevel.LOW]: "整体健康状况良好，继续保持健康的生活方式。",
    [RiskLevel.MEDIUM]: "存在一定的健康风险，建议改善生活方式，定期体检。",
    [RiskLevel.HIGH]: "健康风险较高，建议咨询医生，进行针对性的检查和干预。",
    [RiskLevel.VERY_HIGH]: "健康风险很高，建议尽快就医，进行全面检查和治疗。",
  };

  return {
    diabetes: {
      risk: calculateRisk(diabetesScore),
      score: Math.min(diabetesScore, 100),
      factors: diabetesFactors,
      suggestions: diabetesSuggestions,
    },
    hypertension: {
      risk: calculateRisk(hypertensionScore),
      score: Math.min(hypertensionScore, 100),
      factors: hypertensionFactors,
      suggestions: hypertensionSuggestions,
    },
    cardiovascular: {
      risk: calculateRisk(cardiovascularScore),
      score: Math.min(cardiovascularScore, 100),
      factors: cardiovascularFactors,
      suggestions: cardiovascularSuggestions,
    },
    overall: {
      score: overallScore,
      level: overallLevel,
      summary: summaries[overallLevel],
    },
  };
};

router.post(
  "/analyze",
  authenticate,
  validateBody(analyzeSchema),
  auditMiddleware({ action: "RISK_ANALYSIS", targetType: "RISK_ASSESSMENT", logRequest: true }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = analyzeSchema.parse(req.body);

      const result = analyzeRisks(data);

      const assessment = await prisma.riskAssessment.create({
        data: {
          userId: req.user!.id,
          diabetesRisk: result.diabetes.score,
          hypertensionRisk: result.hypertension.score,
          cardiovascularRisk: result.cardiovascular.score,
          overallScore: result.overall.score,
          suggestions: JSON.stringify(result),
        },
      });

      logger.info("慢性病风险分析完成", {
        userId: req.user!.id,
        assessmentId: assessment.id,
        overallScore: result.overall.score,
      });

      success(res, {
        ...result,
        assessmentId: assessment.id,
      });
    } catch (err) {
      if (err instanceof Error) {
        error(res, "ANALYSIS_ERROR", err.message, undefined, 400);
        return;
      }
      throw err;
    }
  }
);

router.get(
  "/assessments",
  authenticate,
  auditMiddleware({ action: "LIST_RISK_ASSESSMENTS", targetType: "RISK_ASSESSMENT" }),
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, pageSize = 20 } = req.query;

    const where = { userId: req.user!.id };

    const [assessments, total] = await Promise.all([
      prisma.riskAssessment.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { assessmentDate: "desc" },
      }),
      prisma.riskAssessment.count({ where }),
    ]);

    const parsedAssessments = assessments.map((a) => {
      let details = undefined;
      try {
        details = JSON.parse(a.suggestions);
      } catch (e) {
        // 解析失败
      }
      return { ...a, details };
    });

    success(res, { list: parsedAssessments, total, page: Number(page), pageSize: Number(pageSize) });
  }
);

export default router;
