import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse, CityCode, InsuranceType, CalculatorResult, CalculatorResultItem } from '../shared/types';
import { cityRatePlans, cityPolicies } from '../shared/mockData';
import { CITY_NAMES, INSURANCE_NAMES } from '../shared/types';

export function sendResponse<T>(data: T, message = 'ok', code = 0): ApiResponse<T> {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
  };
}

export function calcInsurance(
  cityCode: CityCode,
  baseAmount: number,
  selectedItems: InsuranceType[],
  housingFundPercent?: number
): CalculatorResult {
  const ratePlan = cityRatePlans[cityCode];
  const policy = cityPolicies[cityCode];

  const clampedBase = Math.min(Math.max(baseAmount, policy.minBase), policy.maxBase);

  const items: CalculatorResultItem[] = selectedItems.map((type) => {
    const rateItem = ratePlan.items.find((i) => i.type === type)!;
    let personalRate = rateItem.personalRate;
    let companyRate = rateItem.companyRate;

    if (type === 'HOUSING_FUND' && housingFundPercent !== undefined) {
      personalRate = housingFundPercent;
      companyRate = housingFundPercent;
    }

    const personalAmount = Number(((clampedBase * personalRate) / 100).toFixed(2));
    const companyAmount = Number(((clampedBase * companyRate) / 100).toFixed(2));
    const fixedAmount = rateItem.fixedAmount ? Number(rateItem.fixedAmount.toFixed(2)) : 0;

    return {
      type,
      name: INSURANCE_NAMES[type],
      base: clampedBase,
      personalRate,
      companyRate,
      personalAmount: personalAmount + (type === 'MEDICAL' ? fixedAmount : 0),
      companyAmount,
      totalAmount: Number((personalAmount + companyAmount + (type === 'MEDICAL' ? fixedAmount : 0)).toFixed(2)),
      legalBasis: rateItem.legalBasis,
    };
  });

  const personalTotal = Number(items.reduce((sum, i) => sum + i.personalAmount, 0).toFixed(2));
  const companyTotal = Number(items.reduce((sum, i) => sum + i.companyAmount, 0).toFixed(2));
  const grandTotal = Number((personalTotal + companyTotal).toFixed(2));

  return {
    cityCode,
    cityName: CITY_NAMES[cityCode],
    baseAmount: clampedBase,
    items,
    personalTotal,
    companyTotal,
    grandTotal,
  };
}

export function generateId(prefix: string): string {
  return prefix + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function detectIntent(text: string): { intent: any; confidence: number } {
  const lower = text.toLowerCase();
  const patterns: Array<[string, any, RegExp]> = [
    ['断缴|中断|停缴|社保断了', 'PAYMENT_INTERRUPT', /断缴|中断|停缴|社保断了/],
    ['转移|转社保|跨省', 'TRANSFER', /转移|转社保|跨省|转走|转入/],
    ['退休金|养老金|退休能领', 'PENSION_CALCULATE', /退休金|养老金|退休|领多少/],
    ['报销|医保报|看病', 'REIMBURSEMENT', /报销|医保报|看病|住院/],
    ['基数|缴费基数|最低工资', 'BASE_QUESTION', /基数|缴费基数|最低|下限|上限/],
    ['政策|文件|规定|条例', 'POLICY_CONSULT', /政策|文件|规定|条例|通知/],
    ['退款|退费|退钱', 'REFUND', /退款|退费|退钱/],
  ];

  for (const [, intent, regex] of patterns) {
    if (regex.test(lower)) {
      return { intent, confidence: 0.85 + Math.random() * 0.14 };
    }
  }
  return { intent: 'OTHER', confidence: 0.5 + Math.random() * 0.3 };
}

export function calcIndividualTax(taxableIncome: number): number {
  const brackets = [
    { limit: 36000, rate: 0.03, deduct: 0 },
    { limit: 144000, rate: 0.1, deduct: 2520 },
    { limit: 300000, rate: 0.2, deduct: 16920 },
    { limit: 420000, rate: 0.25, deduct: 31920 },
    { limit: 660000, rate: 0.3, deduct: 52920 },
    { limit: 960000, rate: 0.35, deduct: 85920 },
    { limit: Infinity, rate: 0.45, deduct: 181920 },
  ];
  const yearly = taxableIncome * 12;
  let tax = 0;
  for (const b of brackets) {
    if (yearly <= b.limit) {
      tax = yearly * b.rate - b.deduct;
      break;
    }
  }
  return Number((Math.max(tax, 0) / 12).toFixed(2));
}

export const THRESHOLD = 5000;
