export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'collaborator' | 'admin';
  createdAt: string;
}

export interface Account {
  id: number;
  userId: number;
  name: string;
  type: 'cash' | 'bank' | 'fund' | 'stock' | 'real_estate' | 'vehicle' | 'loan' | 'credit_card' | 'other';
  category: 'asset' | 'liability';
  currency: string;
  description?: string;
  isActive: boolean;
  currentValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Valuation {
  id: number;
  accountId: number;
  marketValue: number;
  costValue: number;
  exchangeRate: number;
  valuationDate: string;
  dataSource: string;
  manualAdjustReason?: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  accountId: number;
  userId: number;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  tags: string[];
  member?: string;
  project?: string;
  description?: string;
  transactionDate: string;
  attachment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  userId: number;
  amount: number;
  currency: string;
  exchangeRate?: number;
  fee?: number;
  description?: string;
  transferDate: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  parentId?: number;
  userId?: number;
  isSystem: boolean;
}

export interface Tag {
  id: number;
  name: string;
  userId: number;
  color?: string;
}

export interface DashboardSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtRatio: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyCashFlow: number;
  savingsRate: number;
}

export interface TrendPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface AssetStructureItem {
  type: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface MonthlyReview {
  year: number;
  month: number;
  netWorthChange: number;
  netWorthChangePercent: number;
  changeReasons: string[];
  abnormalExpenses: Array<{ category: string; amount: number; threshold: number; percentage: number }>;
  debtPlan: { current: number; target: number; progress: number };
  savingsRate: number;
  topExpenses: Array<{ category: string; amount: number; percentage: number }>;
  topIncomes: Array<{ category: string; amount: number; percentage: number }>;
  nextActions: string[];
}

export interface OperationLog {
  id: number;
  userId?: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  success?: boolean;
  error?: string;
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const AccountTypeLabels: Record<Account['type'], string> = {
  cash: '现金',
  bank: '银行卡',
  fund: '基金',
  stock: '股票',
  real_estate: '房产',
  vehicle: '车辆',
  loan: '贷款',
  credit_card: '信用卡',
  other: '其他',
};

export const AccountTypeColors: Record<Account['type'], string> = {
  cash: 'success',
  bank: 'primary',
  fund: 'warning',
  stock: 'danger',
  real_estate: 'dark',
  vehicle: 'warning',
  loan: 'danger',
  credit_card: 'danger',
  other: 'dark',
};

export const AccountCategoryLabels: Record<Account['category'], string> = {
  asset: '资产',
  liability: '负债',
};
