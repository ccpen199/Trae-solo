export type CompanyType = 'state-owned' | 'private' | 'mixed';
export type CompanyScale = 'large' | 'medium' | 'small';

export interface Company {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  type: CompanyType;
  industry: string;
  region: string;
  headquarters: string;
  scale: CompanyScale;
  registeredCapital: number;
  establishDate: string;
  legalPerson: string;
  stockCode?: string;
  creditRating: string;
  rank?: number;
  revenue?: number;
  employeeCount?: number;
}

export interface CompanyFilter {
  type?: CompanyType[];
  region?: string[];
  scale?: CompanyScale[];
  keyword?: string;
}
