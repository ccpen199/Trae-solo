import { db } from '../database';
import { now } from '../utils';

export interface DiscountRule {
  type: 'full_reduction' | 'percentage' | 'cashback';
  threshold?: number;
  value: number;
  priority?: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'full_reduction' | 'percentage' | 'cashback';
  rules: {
    type: string;
    threshold?: number;
    value: number;
    stackable?: boolean;
    scope?: { productIds?: string[]; categoryIds?: string[] };
  };
  priority: number;
  startTime?: number;
  endTime?: number;
  status: number;
}

export interface CalculateInput {
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    categoryId?: string;
  }[];
  userId?: string;
  couponCode?: string;
}

export interface DiscountDetail {
  promotionId: string;
  promotionName: string;
  type: string;
  discountAmount: number;
  description: string;
}

export interface CalculateResult {
  originalAmount: number;
  discountDetails: DiscountDetail[];
  totalDiscount: number;
  cashbackAmount: number;
  finalAmount: number;
}

class PromotionEngine {
  getActivePromotions(): Promotion[] {
    const t = now();
    const rows: any[] = db.prepare(`
      SELECT * FROM promotions
      WHERE status = 1
      AND (start_time IS NULL OR start_time <= ?)
      AND (end_time IS NULL OR end_time >= ?)
      ORDER BY priority DESC
    `).all(t, t);
    return rows.map(r => ({ ...r, rules: JSON.parse(r.rules) }));
  }

  calculate(input: CalculateInput): CalculateResult {
    const originalAmount = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const promotions = this.getActivePromotions();

    let runningAmount = originalAmount;
    let totalDiscount = 0;
    let cashbackAmount = 0;
    const discountDetails: DiscountDetail[] = [];

    for (const promo of promotions) {
      if (!this.isPromotionApplicable(promo, input)) continue;

      const discount = this.calculatePromotionDiscount(promo, input, runningAmount, originalAmount);

      if (discount.reduction > 0) {
        discountDetails.push({
          promotionId: promo.id,
          promotionName: promo.name,
          type: promo.type,
          discountAmount: discount.reduction,
          description: discount.description
        });

        if (promo.type === 'cashback') {
          cashbackAmount += discount.reduction;
        } else {
          totalDiscount += discount.reduction;
          runningAmount -= discount.reduction;
        }

        if (!promo.rules.stackable) break;
      }
    }

    const finalAmount = Math.max(0.01, originalAmount - totalDiscount);

    return {
      originalAmount,
      discountDetails,
      totalDiscount,
      cashbackAmount,
      finalAmount
    };
  }

  private isPromotionApplicable(promo: Promotion, input: CalculateInput): boolean {
    const scope = promo.rules.scope;
    if (!scope) return true;

    const productIds = input.items.map(i => i.productId);
    const categoryIds = input.items.map(i => i.categoryId).filter(Boolean) as string[];

    if (scope.productIds && scope.productIds.length > 0) {
      if (!productIds.some(pid => scope.productIds!.includes(pid))) return false;
    }
    if (scope.categoryIds && scope.categoryIds.length > 0) {
      if (!categoryIds.some(cid => scope.categoryIds!.includes(cid))) return false;
    }
    return true;
  }

  private calculatePromotionDiscount(
    promo: Promotion,
    input: CalculateInput,
    runningAmount: number,
    originalAmount: number
  ): { reduction: number; description: string } {
    const rules = promo.rules;

    switch (promo.type) {
      case 'full_reduction': {
        if (rules.threshold && originalAmount < rules.threshold) {
          return { reduction: 0, description: '' };
        }
        return {
          reduction: Math.min(runningAmount, rules.value),
          description: `满${rules.threshold}减${rules.value}`
        };
      }
      case 'percentage': {
        const discount = runningAmount * (1 - rules.value / 100);
        return {
          reduction: Math.round(discount * 100) / 100,
          description: `${rules.value}折优惠`
        };
      }
      case 'cashback': {
        if (rules.threshold && originalAmount < rules.threshold) {
          return { reduction: 0, description: '' };
        }
        return {
          reduction: rules.value,
          description: `满${rules.threshold}返${rules.value}元`
        };
      }
      default:
        return { reduction: 0, description: '' };
    }
  }
}

export const promotionEngine = new PromotionEngine();
