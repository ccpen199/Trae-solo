export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CompanyStatus = 'active' | 'cancelled' | 'revoked';
export type CaseStatus = 'pending' | 'first' | 'second' | 'enforcement' | 'closed';
export type PartyRole = 'plaintiff' | 'defendant' | 'third_party';

export interface Shareholder {
  id: string;
  name: string;
  type: 'person' | 'company';
  ratio: number;
  amount: string;
}

export interface Lawsuit {
  id: string;
  caseNumber: string;
  title: string;
  cause: string;
  court: string;
  date: string;
  status: CaseStatus;
  role: PartyRole;
  amount?: string;
}

export interface Execution {
  id: string;
  caseNumber: string;
  court: string;
  amount: string;
  date: string;
  status: 'ongoing' | 'completed' | 'terminated';
}

export interface Bid {
  id: string;
  projectName: string;
  tenderer: string;
  amount: string;
  date: string;
  status: 'bidding' | 'won' | 'lost';
}

export interface Company {
  id: string;
  name: string;
  creditCode: string;
  legalPerson: string;
  registeredCapital: string;
  establishDate: string;
  status: CompanyStatus;
  industry: string;
  province: string;
  city: string;
  address: string;
  businessScope: string;
  riskLevel: RiskLevel;
  riskScore: number;
  shareholders: Shareholder[];
  lawsuits: Lawsuit[];
  executions: Execution[];
  bids: Bid[];
}

export interface SearchFilters {
  keyword?: string;
  industry?: string;
  province?: string;
  city?: string;
  riskLevel?: RiskLevel[];
  registeredCapitalMin?: number;
  registeredCapitalMax?: number;
  establishDateFrom?: string;
  establishDateTo?: string;
  hasLawsuit?: boolean;
  hasExecution?: boolean;
}

export interface SearchResult {
  total: number;
  page: number;
  pageSize: number;
  items: Company[];
}
