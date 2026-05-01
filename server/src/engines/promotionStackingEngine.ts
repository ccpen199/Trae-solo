import _ from 'lodash';
import { AppDataSource } from '../database/dataSource';
import { StackingRuleEntity, CouponInstanceEntity } from '../entities';
import { CouponType, CouponStatus, AuditAction, StackingRule } from '../types';
import { auditService } from '../services/auditService';

export interface StackingContext {
  orderAmount: number;
  userId: string;
  storeId?: string;
  productCategories?: string[];
  availableCoupons: CouponInstanceEntity[];
  traceId: string;
}

export interface StackingOption {
  coupons: CouponInstanceEntity[];
  totalDiscount: number;
  finalAmount: number;
  priority: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface StackingResult {
  success: boolean;
  bestOption?: StackingOption;
  allOptions: StackingOption[];
  errors: string[];
  traceId: string;
}

export class PromotionStackingEngine {
  private static instance: PromotionStackingEngine;
  private rules: StackingRule[] = [];

  private constructor() {}

  static getInstance(): PromotionStackingEngine {
    if (!PromotionStackingEngine.instance) {
      PromotionStackingEngine.instance = new PromotionStackingEngine();
    }
    return PromotionStackingEngine.instance;
  }

  async initialize(): Promise<void> {
    await this.loadRules();
  }

  private async loadRules(): Promise<void> {
    const ruleRepository = AppDataSource.getRepository(StackingRuleEntity);
    const rules = await ruleRepository.find({ where: { isActive: true }, order: { priority: 'ASC' } });
    this.rules = rules as unknown as StackingRule[];
  }

  async calculateBestOption(context: StackingContext): Promise<StackingResult> {
    const traceId = context.traceId;
    const errors: string[] = [];
    const allOptions: StackingOption[] = [];

    if (context.orderAmount <= 0) {
      errors.push('Order amount must be greater than 0');
      return { success: false, allOptions, errors, traceId };
    }

    const validCoupons = context.availableCoupons.filter(c => 
      c.status === CouponStatus.PENDING_USE &&
      new Date() >= c.validFrom &&
      new Date() <= c.validTo
    );

    if (validCoupons.length === 0) {
      errors.push('No valid coupons available');
      return { success: false, allOptions, errors, traceId };
    }

    const couponGroups = this.groupByType(validCoupons);
    const combinations = this.generateCombinations(couponGroups);

    for (const combination of combinations) {
      const option = await this.evaluateCombination(combination, context);
      allOptions.push(option);
    }

    allOptions.sort((a, b) => {
      if (a.isValid !== b.isValid) return a.isValid ? -1 : 1;
      if (a.totalDiscount !== b.totalDiscount) return b.totalDiscount - a.totalDiscount;
      return a.priority - b.priority;
    });

    const bestOption = allOptions.find(o => o.isValid);

    await auditService.log({
      action: AuditAction.STACKING_CALCULATION,
      userId: context.userId,
      userRole: 'customer' as any,
      resourceType: 'system',
      details: {
        orderAmount: context.orderAmount,
        storeId: context.storeId,
        productCategories: context.productCategories,
        availableCoupons: validCoupons.length,
        bestOption: bestOption ? {
          coupons: bestOption.coupons.map(c => c.id),
          totalDiscount: bestOption.totalDiscount,
          finalAmount: bestOption.finalAmount
        } : null,
        allOptionsCount: allOptions.length
      },
      traceId
    });

    return {
      success: true,
      bestOption,
      allOptions,
      errors: [],
      traceId
    };
  }

  private groupByType(coupons: CouponInstanceEntity[]): Map<CouponType, CouponInstanceEntity[]> {
    const groups = new Map<CouponType, CouponInstanceEntity[]>();
    for (const coupon of coupons) {
      if (!groups.has(coupon.type)) {
        groups.set(coupon.type, []);
      }
      groups.get(coupon.type)!.push(coupon);
    }
    return groups;
  }

  private generateCombinations(groups: Map<CouponType, CouponInstanceEntity[]>): CouponInstanceEntity[][] {
    const combinations: CouponInstanceEntity[][] = [];
    const types = Array.from(groups.keys());
    
    const maxCoupons = this.getMaxStackCount();
    
    for (let i = 1; i <= Math.min(maxCoupons, types.length); i++) {
      const typeCombinations = this.combinations(types, i);
      for (const typeCombo of typeCombinations) {
        const couponSelections: CouponInstanceEntity[][] = typeCombo.map(type => 
          groups.get(type) || []
        );
        
        const product = this.cartesianProduct(couponSelections);
        combinations.push(...product);
      }
    }
    
    const singleCoupons = types.flatMap(type => 
      (groups.get(type) || []).map(c => [c])
    );
    combinations.unshift(...singleCoupons);
    
    return _.uniqWith(combinations, _.isEqual);
  }

  private combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k > arr.length) return [];
    
    const result: T[][] = [];
    for (let i = 0; i <= arr.length - k; i++) {
      const head = arr[i];
      const tailCombos = this.combinations(arr.slice(i + 1), k - 1);
      for (const combo of tailCombos) {
        result.push([head, ...combo]);
      }
    }
    return result;
  }

  private cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce((a, b) => 
      a.flatMap(x => b.map(y => [...x, y])),
      [[]] as T[][]
    );
  }

  private getMaxStackCount(): number {
    if (this.rules.length === 0) return 2;
    return Math.max(...this.rules.map(r => r.maxStackCount));
  }

  private async evaluateCombination(
    coupons: CouponInstanceEntity[],
    context: StackingContext
  ): Promise<StackingOption> {
    const validationErrors: string[] = [];
    let isValid = true;

    for (const rule of this.rules) {
      const ruleValidation = this.validateAgainstRule(coupons, rule, context);
      if (!ruleValidation.passed) {
        validationErrors.push(...ruleValidation.errors);
      }
    }

    for (const coupon of coupons) {
      if (coupon.minOrderAmount > context.orderAmount) {
        validationErrors.push(`Coupon ${coupon.id} requires minimum order amount ${coupon.minOrderAmount}`);
        isValid = false;
      }
    }

    if (validationErrors.length > 0) {
      isValid = false;
    }

    const totalDiscount = this.calculateTotalDiscount(coupons, context.orderAmount);
    const finalAmount = Math.max(0, context.orderAmount - totalDiscount);

    const priority = this.calculatePriority(coupons);

    return {
      coupons,
      totalDiscount,
      finalAmount,
      priority,
      isValid,
      validationErrors
    };
  }

  private validateAgainstRule(
    coupons: CouponInstanceEntity[],
    rule: StackingRule,
    context: StackingContext
  ): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    let passed = true;

    const couponTypes = coupons.map(c => c.type);
    const hasAllowedType = couponTypes.some(t => rule.allowedTypes.includes(t));
    
    if (!hasAllowedType) {
      return { passed: true, errors: [] };
    }

    if (coupons.length > rule.maxStackCount) {
      errors.push(`Rule '${rule.name}' allows max ${rule.maxStackCount} coupons`);
      passed = false;
    }

    if (rule.conditions?.minOrderAmount && context.orderAmount < rule.conditions.minOrderAmount) {
      errors.push(`Rule '${rule.name}' requires minimum order amount ${rule.conditions.minOrderAmount}`);
      passed = false;
    }

    if (rule.conditions?.sameStore && !context.storeId) {
      errors.push(`Rule '${rule.name}' requires store context`);
      passed = false;
    }

    return { passed, errors };
  }

  private calculateTotalDiscount(coupons: CouponInstanceEntity[], orderAmount: number): number {
    let remainingAmount = orderAmount;
    let totalDiscount = 0;

    const sortedCoupons = [...coupons].sort((a, b) => {
      if (a.type === CouponType.PERCENTAGE_DISCOUNT && b.type !== CouponType.PERCENTAGE_DISCOUNT) {
        return -1;
      }
      if (a.type !== CouponType.PERCENTAGE_DISCOUNT && b.type === CouponType.PERCENTAGE_DISCOUNT) {
        return 1;
      }
      return (a.value || 0) - (b.value || 0);
    });

    for (const coupon of sortedCoupons) {
      if (remainingAmount <= 0) break;

      let discount = 0;
      switch (coupon.type) {
        case CouponType.FIXED_DISCOUNT:
          discount = Math.min(coupon.value, remainingAmount);
          break;
        case CouponType.PERCENTAGE_DISCOUNT:
          discount = (coupon.value / 100) * remainingAmount;
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
          }
          break;
        case CouponType.FREE_SHIPPING:
          discount = coupon.value;
          break;
        default:
          discount = 0;
      }

      totalDiscount += discount;
      remainingAmount -= discount;
    }

    return Math.min(totalDiscount, orderAmount);
  }

  private calculatePriority(coupons: CouponInstanceEntity[]): number {
    let totalPriority = 0;
    for (const coupon of coupons) {
      totalPriority += coupon.stackPriority || 0;
    }
    return totalPriority;
  }

  async refreshRules(): Promise<void> {
    await this.loadRules();
  }
}

export const promotionStackingEngine = PromotionStackingEngine.getInstance();
