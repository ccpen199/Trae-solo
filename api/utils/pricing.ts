import {
  TaxRule,
  RatePlan,
  Currency,
  TaxType,
  TaxCalculationBasis,
  PricingDetail,
  TaxItem,
  FeeItem,
  DiscountItem,
  PriceCurrency,
  MemberTier,
} from '@shared/types';

export const mockTaxRules: TaxRule[] = [
  {
    id: 'tax-fr-001',
    countryCode: 'FR',
    type: TaxType.VAT,
    rate: 20,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'French VAT on hotel accommodation',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-fr-002',
    countryCode: 'FR',
    type: TaxType.CITY_TAX,
    rate: 1.58,
    calculationBasis: TaxCalculationBasis.PER_NIGHT,
    appliesTo: 'all',
    description: 'Paris city tax per person per night',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-jp-001',
    countryCode: 'JP',
    type: TaxType.VAT,
    rate: 10,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'Japanese consumption tax',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-us-001',
    countryCode: 'US',
    region: 'NY',
    type: TaxType.VAT,
    rate: 8.875,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'NYC sales tax',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-us-002',
    countryCode: 'US',
    region: 'NY',
    type: TaxType.CITY_TAX,
    rate: 14.75,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'NYC hotel occupancy tax',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-us-003',
    countryCode: 'US',
    region: 'NY',
    type: TaxType.SERVICE_FEE,
    rate: 3.5,
    calculationBasis: TaxCalculationBasis.PER_NIGHT,
    appliesTo: 'all',
    description: 'NYC hotel facility fee per night',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-gb-001',
    countryCode: 'GB',
    type: TaxType.VAT,
    rate: 20,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'UK VAT',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-ae-001',
    countryCode: 'AE',
    type: TaxType.VAT,
    rate: 5,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'UAE VAT',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-ae-002',
    countryCode: 'AE',
    type: TaxType.TOURISM_TAX,
    rate: 15,
    calculationBasis: TaxCalculationBasis.PER_NIGHT,
    appliesTo: 'all',
    description: 'Dubai Tourism Dirham per room per night',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-ae-003',
    countryCode: 'AE',
    type: TaxType.SERVICE_FEE,
    rate: 10,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'Service charge',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-sg-001',
    countryCode: 'SG',
    type: TaxType.VAT,
    rate: 8,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'Singapore GST',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-sg-002',
    countryCode: 'SG',
    type: TaxType.SERVICE_FEE,
    rate: 10,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'Service charge',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-th-001',
    countryCode: 'TH',
    type: TaxType.VAT,
    rate: 7,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'Thai VAT',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-th-002',
    countryCode: 'TH',
    type: TaxType.TOURISM_TAX,
    rate: 10,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'non_residents',
    description: 'Thailand tourism tax for non-residents',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tax-es-001',
    countryCode: 'ES',
    type: TaxType.VAT,
    rate: 10,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all',
    description: 'Spanish IVA reduced rate for hotels',
    effectiveFrom: '2024-01-01T00:00:00Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export function getTaxRulesByCountry(countryCode: string, region?: string): TaxRule[] {
  return mockTaxRules.filter(
    rule => rule.countryCode === countryCode && rule.isActive && (!region || rule.region === region)
  );
}

export function calculatePricing(
  ratePlan: RatePlan,
  nights: number,
  guestCount: { adults: number; children?: number; infants?: number },
  countryCode: string,
  region?: string,
  memberTier?: MemberTier,
  promoCode?: string
): PricingDetail {
  const currency = ratePlan.price.currency;
  const basePrice = ratePlan.price.amount * nights;

  const taxRules = getTaxRulesByCountry(countryCode, region);
  const taxItems: TaxItem[] = [];
  let totalTax = 0;

  for (const rule of taxRules) {
    let taxAmount = 0;
    switch (rule.calculationBasis) {
      case TaxCalculationBasis.ROOM_RATE:
        taxAmount = basePrice * (rule.rate / 100);
        break;
      case TaxCalculationBasis.PER_NIGHT:
        taxAmount = rule.rate * nights;
        break;
      case TaxCalculationBasis.PER_GUEST:
        const totalGuests = (guestCount.adults || 0) + (guestCount.children || 0);
        taxAmount = rule.rate * totalGuests * nights;
        break;
    }
    taxAmount = Math.round(taxAmount * 100) / 100;
    totalTax += taxAmount;

    let displayName = '';
    switch (rule.type) {
      case TaxType.VAT:
        displayName = `VAT (${rule.rate}%)`;
        break;
      case TaxType.CITY_TAX:
        displayName = rule.calculationBasis === TaxCalculationBasis.ROOM_RATE
          ? `City Tax (${rule.rate}%)`
          : `City Tax (${currencySymbol(currency)}${rule.rate}/night)`;
        break;
      case TaxType.TOURISM_TAX:
        displayName = rule.calculationBasis === TaxCalculationBasis.ROOM_RATE
          ? `Tourism Tax (${rule.rate}%)`
          : `Tourism Tax (${currencySymbol(currency)}${rule.rate}/night)`;
        break;
      case TaxType.SERVICE_FEE:
        displayName = rule.calculationBasis === TaxCalculationBasis.ROOM_RATE
          ? `Service Charge (${rule.rate}%)`
          : `Facility Fee (${currencySymbol(currency)}${rule.rate}/night)`;
        break;
    }

    taxItems.push({
      name: rule.description || displayName,
      rate: rule.rate,
      amount: { amount: taxAmount, currency },
      type: rule.type,
    });
  }

  const feeItems: FeeItem[] = [];
  let totalFees = 0;

  const discountItems: DiscountItem[] = [];
  let totalDiscounts = 0;

  if (memberTier === MemberTier.GOLD) {
    const goldDiscount = Math.round(basePrice * 0.1 * 100) / 100;
    totalDiscounts += goldDiscount;
    discountItems.push({
      name: 'Gold Member Discount',
      code: 'GOLD10',
      amount: { amount: goldDiscount, currency },
      percentage: 10,
    });
  } else if (memberTier === MemberTier.SILVER) {
    const silverDiscount = Math.round(basePrice * 0.05 * 100) / 100;
    totalDiscounts += silverDiscount;
    discountItems.push({
      name: 'Silver Member Discount',
      code: 'SILVER5',
      amount: { amount: silverDiscount, currency },
      percentage: 5,
    });
  }

  if (promoCode) {
    const promoDiscount = Math.round(basePrice * 0.08 * 100) / 100;
    totalDiscounts += promoDiscount;
    discountItems.push({
      name: 'Promo Code Discount',
      code: promoCode,
      amount: { amount: promoDiscount, currency },
      percentage: 8,
    });
  }

  const grandTotal = Math.round((basePrice + totalTax + totalFees - totalDiscounts) * 100) / 100;

  return {
    roomTotal: { amount: basePrice, currency },
    taxes: {
      amount: { amount: Math.round(totalTax * 100) / 100, currency },
      breakdown: taxItems,
    },
    fees: {
      amount: { amount: totalFees, currency },
      breakdown: feeItems,
    },
    discounts: {
      amount: { amount: Math.round(totalDiscounts * 100) / 100, currency },
      breakdown: discountItems,
    },
    grandTotal: { amount: grandTotal, currency },
  };
}

function currencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    [Currency.CNY]: '¥',
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.JPY]: '¥',
    [Currency.GBP]: '£',
    [Currency.AED]: 'AED ',
    [Currency.SGD]: 'S$',
    [Currency.THB]: '฿',
  };
  return symbols[currency] || '';
}
