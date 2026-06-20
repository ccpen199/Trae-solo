import { config } from '../config';

export interface FreightCalcParams {
  weight: number;
  itemType?: string;
  hasInsurance?: boolean;
  declaredValue?: number;
}

export interface FreightResult {
  basePrice: number;
  weightPrice: number;
  insuranceFee: number;
  total: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

export const freightCalculator = {
  calculate(params: FreightCalcParams): FreightResult {
    const { weight, hasInsurance = false, declaredValue = 0 } = params;

    if (weight <= 0) {
      throw new Error('重量必须大于0');
    }

    const basePrice = config.freight.basePrice;
    const weightPrice = Math.max(0, weight - 1) * config.freight.pricePerKg;
    const insuranceFee = hasInsurance && declaredValue > 0
      ? Number((declaredValue * config.freight.insuranceRate).toFixed(2))
      : 0;

    const total = Number((basePrice + weightPrice + insuranceFee).toFixed(2));

    const breakdown: FreightResult['breakdown'] = [
      { label: '基础运费', amount: basePrice },
    ];

    if (weightPrice > 0) {
      breakdown.push({
        label: `续重费用 (${(weight - 1).toFixed(2)}kg)`,
        amount: Number(weightPrice.toFixed(2)),
      });
    }

    if (insuranceFee > 0) {
      breakdown.push({
        label: `保价费 (${declaredValue}元)`,
        amount: insuranceFee,
      });
    }

    return {
      basePrice,
      weightPrice: Number(weightPrice.toFixed(2)),
      insuranceFee,
      total,
      breakdown,
    };
  },
};
