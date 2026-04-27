export type BillingMode = 'PER_MU' | 'PER_HOUR' | 'FIXED_PRICE';

export type BillingRequest = {
  orderId: string;
  mode: BillingMode;
  pricePerUnit: number;
  actualArea?: number;
  actualHours?: number;
  fixedPrice?: number;
  discounts?: Discount[];
  extras?: ExtraCharge[];
};

export type Discount = {
  type: 'percentage' | 'fixed';
  amount: number;
  reason: string;
  relatedId?: string;
};

export type ExtraCharge = {
  type: string;
  amount: number;
  reason: string;
};

export type BillingResult = {
  orderId: string;
  mode: BillingMode;
  baseAmount: number;
  discountAmount: number;
  extraAmount: number;
  totalAmount: number;
  platformFee: number;
  platformFeeRate: number;
  operatorAmount: number;
  breakdown: BillingBreakdown;
};

export type BillingBreakdown = {
  base: {
    type: string;
    units: number;
    pricePerUnit: number;
    amount: number;
  };
  discounts: {
    type: string;
    reason: string;
    amount: number;
  }[];
  extras: {
    type: string;
    reason: string;
    amount: number;
  }[];
  fees: {
    type: string;
    rate: number;
    amount: number;
  }[];
};
