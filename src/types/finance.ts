export interface AnnualReport {
  id: string;
  companyId: string;
  companyName: string;
  year: number;
  revenue: number;
  revenueGrowth: number;
  netProfit: number;
  netProfitGrowth: number;
  grossMargin: number;
  netMargin: number;
  totalAssets: number;
  totalLiabilities: number;
  debtRatio: number;
  cashFlow: number;
  salesCollectionRate: number;
  roe: number;
  roa: number;
}

export interface Bond {
  id: string;
  companyId: string;
  companyName: string;
  bondName: string;
  bondCode: string;
  issueAmount: number;
  couponRate: number;
  issueDate: string;
  maturityDate: string;
  term: number;
  status: 'normal' | 'default' | 'matured';
  rating: string;
}

export interface LandReserve {
  id: string;
  companyId: string;
  companyName: string;
  region: string;
  city: string;
  area: number;
  landPrice: number;
  floorPrice: number;
  acquireDate: string;
  landUse: string;
  plotRatio: number;
}

export interface FinanceCompareItem {
  companyId: string;
  companyName: string;
  metrics: Record<string, number>;
}
