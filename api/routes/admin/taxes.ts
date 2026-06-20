import { Router, Response } from 'express';
import { z } from 'zod';
import { successResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../../utils/response.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../../middleware/auth.js';
import { UserRole } from '@shared/types';
import { mockTaxRules } from '../../utils/pricing.js';

const router = Router();

const taxRuleSchema = z.object({
  countryCode: z.string().length(2),
  state: z.string().optional(),
  city: z.string().optional(),
  taxType: z.enum(['VAT', 'GST', 'SALES_TAX', 'CITY_TAX', 'TOURISM_TAX', 'SERVICE_FEE', 'OTHER']),
  name: z.string(),
  description: z.string().optional(),
  rate: z.number().min(0).max(100),
  calculationBase: z.enum(['ROOM_RATE', 'TOTAL_AMOUNT', 'PER_NIGHT', 'PER_GUEST', 'FIXED']),
  isPercentage: z.boolean().default(true),
  fixedAmount: z.number().optional(),
  appliesTo: z.enum(['ALL', 'RESIDENT', 'NON_RESIDENT', 'SPECIFIC_NATIONALITIES']).default('ALL'),
  nationalities: z.string().array().optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  isIncludedInPrice: z.boolean().default(false),
});

router.get('/', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeRules = mockTaxRules.filter(r => r.isActive);
    const inactiveRules = mockTaxRules.filter(r => !r.isActive);

    const countries = [...new Set(mockTaxRules.map(r => r.countryCode))].sort();
    const taxTypes = ['VAT', 'GST', 'SALES_TAX', 'CITY_TAX', 'TOURISM_TAX', 'SERVICE_FEE', 'OTHER'];

    successResponse(res, {
      activeRules,
      inactiveRules,
      countries,
      taxTypes,
      stats: {
        totalRules: mockTaxRules.length,
        activeCountries: countries.length,
        totalTaxTypes: taxTypes.length,
      },
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/country/:countryCode', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { countryCode } = req.params;
    const rules = mockTaxRules.filter(r => r.countryCode === countryCode.toUpperCase() && r.isActive);

    const countryInfo: Record<string, { name: string; currency: string; defaultTaxRate: number }> = {
      'FR': { name: '法国', currency: 'EUR', defaultTaxRate: 10 },
      'JP': { name: '日本', currency: 'JPY', defaultTaxRate: 10 },
      'US': { name: '美国', currency: 'USD', defaultTaxRate: 7 },
      'GB': { name: '英国', currency: 'GBP', defaultTaxRate: 20 },
      'AE': { name: '阿联酋', currency: 'AED', defaultTaxRate: 5 },
      'SG': { name: '新加坡', currency: 'SGD', defaultTaxRate: 8 },
      'TH': { name: '泰国', currency: 'THB', defaultTaxRate: 7 },
      'ES': { name: '西班牙', currency: 'EUR', defaultTaxRate: 10 },
      'CN': { name: '中国', currency: 'CNY', defaultTaxRate: 6 },
    };

    successResponse(res, {
      country: countryInfo[countryCode.toUpperCase()] || { name: countryCode, currency: 'USD', defaultTaxRate: 0 },
      rules,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = taxRuleSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const newRule = {
      id: `tax-${Date.now()}`,
      ...validated.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (mockTaxRules as any[]).push(newRule);

    successResponse(res, newRule, 'Tax rule created successfully', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/:ruleId', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const rule = mockTaxRules.find(r => r.id === ruleId);

    if (!rule) {
      notFoundResponse(res, 'TaxRule');
      return;
    }

    const validated = taxRuleSchema.partial().safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    Object.assign(rule, validated.data, { updatedAt: new Date().toISOString() });

    successResponse(res, rule, 'Tax rule updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.delete('/:ruleId', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const index = mockTaxRules.findIndex(r => r.id === ruleId);

    if (index === -1) {
      notFoundResponse(res, 'TaxRule');
      return;
    }

    mockTaxRules.splice(index, 1);

    successResponse(res, null, 'Tax rule deleted successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/calculate', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, countryCode, state, city, roomRate, nights, guests, isResident, nationality } = req.body;

    const applicableRules = mockTaxRules.filter(r => {
      if (r.countryCode !== countryCode.toUpperCase()) return false;
      if (r.state && state && r.state !== state) return false;
      if (r.city && city && r.city !== city) return false;
      if (!r.isActive) return false;
      if (r.appliesTo === 'RESIDENT' && !isResident) return false;
      if (r.appliesTo === 'NON_RESIDENT' && isResident) return false;
      if (r.appliesTo === 'SPECIFIC_NATIONALITIES' && r.nationalities && !r.nationalities.includes(nationality)) return false;
      return true;
    });

    const breakdown = applicableRules.map(rule => {
      let taxAmount = 0;

      switch (rule.calculationBase) {
        case 'ROOM_RATE':
          taxAmount = rule.isPercentage ? (roomRate * rule.rate / 100) * nights : rule.fixedAmount || 0;
          break;
        case 'TOTAL_AMOUNT':
          taxAmount = rule.isPercentage ? amount * rule.rate / 100 : rule.fixedAmount || 0;
          break;
        case 'PER_NIGHT':
          taxAmount = rule.isPercentage ? (amount * rule.rate / 100) : (rule.fixedAmount || 0) * nights;
          break;
        case 'PER_GUEST':
          taxAmount = rule.isPercentage ? (amount * rule.rate / 100) : (rule.fixedAmount || 0) * guests;
          break;
        case 'FIXED':
          taxAmount = rule.fixedAmount || 0;
          break;
      }

      return {
        rule,
        amount: Math.round(taxAmount * 100) / 100,
        isIncludedInPrice: rule.isIncludedInPrice,
      };
    });

    const totalTax = breakdown.reduce((sum, b) => sum + b.amount, 0);
    const totalTaxIncluded = breakdown.filter(b => b.isIncludedInPrice).reduce((sum, b) => sum + b.amount, 0);
    const totalTaxAdditional = breakdown.filter(b => !b.isIncludedInPrice).reduce((sum, b) => sum + b.amount, 0);

    successResponse(res, {
      amount,
      countryCode,
      breakdown,
      totalTax: Math.round(totalTax * 100) / 100,
      totalTaxIncluded: Math.round(totalTaxIncluded * 100) / 100,
      totalTaxAdditional: Math.round(totalTaxAdditional * 100) / 100,
      grandTotal: Math.round((amount + totalTaxAdditional) * 100) / 100,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/compliance', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complianceInfo = {
      regulations: [
        {
          code: 'GDPR',
          name: '通用数据保护条例',
          region: '欧盟',
          description: '规范个人数据处理和自由流动的法规',
          requirements: ['数据主体权利响应通道', '数据保护影响评估', '数据泄露通知'],
          penalties: '最高全球营业额4%或2000万欧元',
        },
        {
          code: 'VAT_OSS',
          name: '一站式服务增值税机制',
          region: '欧盟',
          description: '简化跨境服务增值税申报的机制',
          requirements: ['VAT注册', '季度申报', '税金缴纳'],
          penalties: '滞纳金 + 罚款',
        },
        {
          code: 'STANDARD_RATED_VAT',
          name: '标准税率增值税',
          region: '全球',
          description: '各国标准增值税率',
          requirements: ['正确计算税额', '发票合规', '税务申报'],
          penalties: '滞纳金 + 罚款',
        },
      ],
      taxReportingDeadlines: [
        { country: 'FR', type: 'VAT', frequency: 'MONTHLY', deadline: '每月20日' },
        { country: 'JP', type: 'VAT', frequency: 'QUARTERLY', deadline: '每季度末后2个月' },
        { country: 'US', type: 'SALES_TAX', frequency: 'MONTHLY', deadline: '每月20日' },
        { country: 'GB', type: 'VAT', frequency: 'QUARTERLY', deadline: '每季度末后1个月' },
        { country: 'SG', type: 'GST', frequency: 'QUARTERLY', deadline: '每季度末后30天' },
      ],
      invoiceRequirements: {
        mandatoryFields: ['发票号码', '日期', '供应商税号', '客户名称', '税率', '税额'],
        retentionPeriod: '至少7年',
        digitalInvoicing: ['FR', 'IT', 'ES', 'JP'],
      },
    };

    successResponse(res, complianceInfo);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
