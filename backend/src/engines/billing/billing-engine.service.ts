import { Injectable } from '@nestjs/common';
import {
  BillingRequest,
  BillingResult,
  BillingBreakdown,
  Discount,
  ExtraCharge,
} from './types/billing.types';

@Injectable()
export class BillingEngineService {
  private readonly PLATFORM_FEE_RATE = 0.1;

  async calculate(request: BillingRequest): Promise<BillingResult> {
    const { mode, pricePerUnit, actualArea, actualHours, fixedPrice } = request;

    let baseAmount = 0;
    let baseType = '';
    let units = 0;

    switch (mode) {
      case 'PER_MU':
        if (actualArea === undefined || actualArea <= 0) {
          throw new Error('按亩计费需要提供实际作业面积');
        }
        baseAmount = actualArea * pricePerUnit;
        baseType = '亩';
        units = actualArea;
        break;

      case 'PER_HOUR':
        if (actualHours === undefined || actualHours <= 0) {
          throw new Error('按时计费需要提供实际作业时长');
        }
        baseAmount = actualHours * pricePerUnit;
        baseType = '小时';
        units = actualHours;
        break;

      case 'FIXED_PRICE':
        if (fixedPrice === undefined || fixedPrice <= 0) {
          throw new Error('包干计费需要提供固定价格');
        }
        baseAmount = fixedPrice;
        baseType = '包干';
        units = 1;
        break;

      default:
        throw new Error(`不支持的计费模式: ${mode}`);
    }

    const { discountAmount, discountBreakdown } = this.calculateDiscounts(
      baseAmount,
      request.discounts || [],
    );

    const { extraAmount, extraBreakdown } = this.calculateExtras(
      request.extras || [],
    );

    const totalAmount = Math.max(0, baseAmount - discountAmount + extraAmount);

    const platformFee = totalAmount * this.PLATFORM_FEE_RATE;
    const operatorAmount = totalAmount - platformFee;

    const breakdown: BillingBreakdown = {
      base: {
        type: baseType,
        units,
        pricePerUnit,
        amount: baseAmount,
      },
      discounts: discountBreakdown,
      extras: extraBreakdown,
      fees: [
        {
          type: '平台服务费',
          rate: this.PLATFORM_FEE_RATE,
          amount: platformFee,
        },
      ],
    };

    return {
      orderId: request.orderId,
      mode,
      baseAmount: this.roundToTwoDecimals(baseAmount),
      discountAmount: this.roundToTwoDecimals(discountAmount),
      extraAmount: this.roundToTwoDecimals(extraAmount),
      totalAmount: this.roundToTwoDecimals(totalAmount),
      platformFee: this.roundToTwoDecimals(platformFee),
      platformFeeRate: this.PLATFORM_FEE_RATE,
      operatorAmount: this.roundToTwoDecimals(operatorAmount),
      breakdown,
    };
  }

  private calculateDiscounts(
    baseAmount: number,
    discounts: Discount[],
  ): {
    discountAmount: number;
    discountBreakdown: { type: string; reason: string; amount: number }[];
  } {
    let totalDiscount = 0;
    const breakdown: { type: string; reason: string; amount: number }[] = [];

    for (const discount of discounts) {
      let discountValue = 0;

      if (discount.type === 'percentage') {
        discountValue = baseAmount * (discount.amount / 100);
      } else if (discount.type === 'fixed') {
        discountValue = discount.amount;
      }

      discountValue = Math.min(discountValue, baseAmount - totalDiscount);

      if (discountValue > 0) {
        totalDiscount += discountValue;
        breakdown.push({
          type: discount.type === 'percentage' ? '百分比折扣' : '固定金额折扣',
          reason: discount.reason,
          amount: this.roundToTwoDecimals(discountValue),
        });
      }
    }

    return {
      discountAmount: totalDiscount,
      discountBreakdown: breakdown,
    };
  }

  private calculateExtras(
    extras: ExtraCharge[],
  ): {
    extraAmount: number;
    extraBreakdown: { type: string; reason: string; amount: number }[];
  } {
    let totalExtra = 0;
    const breakdown: { type: string; reason: string; amount: number }[] = [];

    for (const extra of extras) {
      if (extra.amount > 0) {
        totalExtra += extra.amount;
        breakdown.push({
          type: extra.type,
          reason: extra.reason,
          amount: this.roundToTwoDecimals(extra.amount),
        });
      }
    }

    return {
      extraAmount: totalExtra,
      extraBreakdown: breakdown,
    };
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async estimate(
    mode: string,
    pricePerUnit: number,
    estimatedArea?: number,
    estimatedHours?: number,
  ): Promise<{
    estimatedAmount: number;
    estimatedPlatformFee: number;
    estimatedOperatorAmount: number;
  }> {
    let baseAmount = 0;

    switch (mode) {
      case 'PER_MU':
        if (estimatedArea === undefined) {
          throw new Error('按亩计费需要提供预估作业面积');
        }
        baseAmount = estimatedArea * pricePerUnit;
        break;

      case 'PER_HOUR':
        if (estimatedHours === undefined) {
          throw new Error('按时计费需要提供预估作业时长');
        }
        baseAmount = estimatedHours * pricePerUnit;
        break;

      default:
        throw new Error(`不支持的计费模式: ${mode}`);
    }

    const platformFee = baseAmount * this.PLATFORM_FEE_RATE;
    const operatorAmount = baseAmount - platformFee;

    return {
      estimatedAmount: this.roundToTwoDecimals(baseAmount),
      estimatedPlatformFee: this.roundToTwoDecimals(platformFee),
      estimatedOperatorAmount: this.roundToTwoDecimals(operatorAmount),
    };
  }
}
