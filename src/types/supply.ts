export interface Supplier {
  id: string;
  name: string;
  logo?: string;
  category: string;
  subCategory: string;
  scale: string;
  region: string;
  marketShare: number;
  rating: number;
  projectCount: number;
  totalContractAmount: number;
  establishedYear: number;
  stockCode?: string;
}

export interface SupplyRelation {
  id: string;
  supplierId: string;
  supplierName: string;
  developerId: string;
  developerName: string;
  projectId?: string;
  projectName?: string;
  cooperationType: string;
  contractAmount: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'ended' | 'terminated';
}

export interface SupplyChainCategory {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  supplierCount: number;
  totalMarketSize: number;
}

export interface SupplyFilter {
  category?: string;
  subCategory?: string;
  region?: string[];
  scale?: string[];
  minRating?: number;
  keyword?: string;
}
