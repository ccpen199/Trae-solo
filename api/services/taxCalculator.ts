import { getTaxRuleByHSCodeStringAndCountry } from '../models/taxRule.js';

export interface CalculationItem {
  lineNumber: number;
  productName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CalculationInput {
  orderId: string;
  countryCode: string;
  currency: string;
  exchangeRate?: number;
  items: CalculationItem[];
  shippingFee?: number;
  insuranceFee?: number;
  platformWithholding?: number;
  createdBy?: string;
}

export interface ItemCalculationResult {
  lineNumber: number;
  productName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  customsValue: number;
  dutyRate: number;
  dutyAmount: number;
  vatRate: number;
  vatAmount: number;
  exciseRate: number;
  exciseAmount: number;
  calculationDetails: string;
  warnings?: string[];
}

export interface CalculationResult {
  orderId: string;
  countryCode: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  insuranceFee: number;
  totalCustomsValue: number;
  dutyAmount: number;
  vatAmount: number;
  exciseAmount: number;
  platformWithholding: number;
  totalTax: number;
  items: ItemCalculationResult[];
  calculationDetails: string;
  warnings?: string[];
}

const LOW_VALUE_THRESHOLDS: Record<string, number> = {
  'EU': 150,
  'UK': 135,
  'US': 800,
  'JP': 10000,
  'AU': 1000,
};

export function calculateTaxes(input: CalculationInput): CalculationResult {
  const warnings: string[] = [];
  const itemResults: ItemCalculationResult[] = [];
  const exchangeRate = input.exchangeRate || 1;
  
  let totalDuty = 0;
  let totalVat = 0;
  let totalExcise = 0;
  let totalSubtotal = 0;
  let totalDiscount = 0;

  for (const item of input.items) {
    const itemDiscount = item.discount || 0;
    const itemSubtotal = (item.unitPrice * item.quantity) - itemDiscount;
    totalSubtotal += item.unitPrice * item.quantity;
    totalDiscount += itemDiscount;

    const taxRule = getTaxRuleByHSCodeStringAndCountry(item.hsCode, input.countryCode);
    const itemWarnings: string[] = [];

    if (!taxRule) {
      itemWarnings.push(`未找到 HS 编码 ${item.hsCode} 在 ${input.countryCode} 的税率规则`);
      warnings.push(`商品 ${item.productName} (${item.hsCode}) 未找到税率规则`);
    }

    const dutyRate = taxRule?.duty_rate || 0;
    const vatRate = taxRule?.vat_rate || 0;
    const exciseRate = taxRule?.excise_rate || 0;

    let dutyAmount = itemSubtotal * dutyRate;
    let vatAmount = (itemSubtotal + dutyAmount) * vatRate;
    let exciseAmount = itemSubtotal * exciseRate;

    const threshold = LOW_VALUE_THRESHOLDS[input.countryCode];
    if (threshold && itemSubtotal < threshold) {
      if (dutyAmount > 0) {
        itemWarnings.push(`低值免税：商品价值低于 ${threshold} ${input.currency}，免征关税`);
        dutyAmount = 0;
      }
    }

    const details = [
      `商品价值: ${itemSubtotal.toFixed(2)} ${input.currency}`,
      `关税: ${(dutyRate * 100).toFixed(2)}% × ${itemSubtotal.toFixed(2)} = ${dutyAmount.toFixed(2)}`,
      `增值税: ${(vatRate * 100).toFixed(2)}% × (${itemSubtotal.toFixed(2)} + ${dutyAmount.toFixed(2)}) = ${vatAmount.toFixed(2)}`,
      exciseAmount > 0 ? `消费税: ${(exciseRate * 100).toFixed(2)}% × ${itemSubtotal.toFixed(2)} = ${exciseAmount.toFixed(2)}` : null,
    ].filter(Boolean).join('; ');

    totalDuty += dutyAmount;
    totalVat += vatAmount;
    totalExcise += exciseAmount;

    itemResults.push({
      lineNumber: item.lineNumber,
      productName: item.productName,
      hsCode: item.hsCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: itemDiscount,
      customsValue: itemSubtotal,
      dutyRate,
      dutyAmount,
      vatRate,
      vatAmount,
      exciseRate,
      exciseAmount,
      calculationDetails: details,
      warnings: itemWarnings,
    });
  }

  const shippingFee = input.shippingFee || 0;
  const insuranceFee = input.insuranceFee || 0;
  const platformWithholding = input.platformWithholding || 0;
  const totalCustomsValue = totalSubtotal - totalDiscount + shippingFee + insuranceFee;
  const totalTax = totalDuty + totalVat + totalExcise + platformWithholding;

  const calculationDetails = [
    `订单: ${input.orderId}`,
    `目的国: ${input.countryCode}`,
    `汇率: 1 ${input.currency} = ${exchangeRate.toFixed(4)} ${input.currency}`,
    `商品小计: ${totalSubtotal.toFixed(2)}`,
    `折扣: -${totalDiscount.toFixed(2)}`,
    `运费: +${shippingFee.toFixed(2)}`,
    `保险费: +${insuranceFee.toFixed(2)}`,
    `完税价格: ${totalCustomsValue.toFixed(2)}`,
    `关税总额: ${totalDuty.toFixed(2)}`,
    `增值税总额: ${totalVat.toFixed(2)}`,
    totalExcise > 0 ? `消费税总额: ${totalExcise.toFixed(2)}` : null,
    `平台代扣: ${platformWithholding.toFixed(2)}`,
    `总税费: ${totalTax.toFixed(2)} ${input.currency}`,
  ].filter(Boolean).join('\n');

  return {
    orderId: input.orderId,
    countryCode: input.countryCode,
    currency: input.currency,
    exchangeRate,
    subtotal: totalSubtotal,
    discount: totalDiscount,
    shippingFee,
    insuranceFee,
    totalCustomsValue,
    dutyAmount: totalDuty,
    vatAmount: totalVat,
    exciseAmount: totalExcise,
    platformWithholding,
    totalTax,
    items: itemResults,
    calculationDetails,
    warnings,
  };
}
