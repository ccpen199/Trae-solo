export enum LoanType {
  COMMERCIAL = 'commercial',
  PROVIDENT_FUND = 'provident_fund',
  COMBINED = 'combined'
}

export enum RepaymentMethod {
  EQUAL_PRINCIPAL_INTEREST = 'equal_principal_interest',
  EQUAL_PRINCIPAL = 'equal_principal'
}

export enum EarlyRepaymentType {
  FULL_PAYOFF = 'full_payoff',
  PARTIAL_REDUCE_TERM = 'partial_reduce_term',
  PARTIAL_REDUCE_PAYMENT = 'partial_reduce_payment'
}

export interface ScheduleItem {
  month: number
  date: string
  payment: number
  principal: number
  interest: number
  remainingPrincipal: number
  totalPrincipalPaid: number
  totalInterestPaid: number
  isEarlyRepayment?: boolean
  earlyRepaymentAmount?: number
}

export interface MortgageResult {
  summary: {
    totalLoan: number
    totalInterest: number
    totalPayment: number
    monthlyPaymentFirst: number
    monthlyPaymentLast: number
    years: number
    totalMonths: number
    effectiveMonths: number
    interestSaved?: number
    earlyRepayment?: {
      month: number
      amount: number
      type: string
      interestSaved: number
      originalTotalInterest: number
    }
  }
  schedule: ScheduleItem[]
  breakdown: {
    commercial: {
      amount: number
      rate: number
      interest: number
      payment: number
    }
    providentFund: {
      amount: number
      rate: number
      interest: number
      payment: number
    }
  }
}

export interface MortgageInput {
  loanType: LoanType
  totalAmount?: number
  commercialAmount?: number
  providentFundAmount?: number
  years: number
  commercialRate: number
  providentFundRate: number
  repaymentMethod: RepaymentMethod
  startDate: string
  region?: string
  earlyRepayment?: {
    type: EarlyRepaymentType
    month: number
    amount: number
  }
}

export enum IncomeType {
  SALARY = 'salary',
  LABOR = 'labor',
  AUTHORSHIP = 'authorship',
  ROYALTY = 'royalty',
  BUSINESS = 'business',
  INTEREST = 'interest',
  RENTAL = 'rental',
  PROPERTY_TRANSFER = 'property_transfer',
  INCIDENTAL = 'incidental'
}

export enum SpecialDeductionType {
  CHILD_EDUCATION = 'child_education',
  CONTINUING_EDUCATION = 'continuing_education',
  SERIOUS_ILLNESS = 'serious_illness',
  HOUSING_LOAN_INTEREST = 'housing_loan_interest',
  HOUSING_RENT = 'housing_rent',
  ELDERLY_SUPPORT = 'elderly_support',
  INFANT_CARE = 'infant_care'
}

export interface IncomeItem {
  type: IncomeType
  amount: number
  monthly?: boolean
}

export interface SpecialDeduction {
  type: SpecialDeductionType
  amount: number
  months?: number
}

export interface OtherDeduction {
  name: string
  amount: number
  category: string
  monthly?: boolean
}

export interface TaxResult {
  summary: {
    totalIncome: number
    comprehensiveIncome: number
    otherIncome: number
    totalTaxableIncome: number
    totalTax: number
    averageTaxRate: number
    marginalTaxRate: number
    netIncome: number
    totalDeductions: {
      basic: number
      special: number
      other: number
      total: number
    }
  }
  breakdown: {
    byIncomeType: Array<{
      type: string
      name: string
      grossAmount: number
      taxableAmount: number
      tax: number
      effectiveRate: number
    }>
    byDeduction: Array<{
      type: string
      name: string
      amount: number
    }>
  }
  monthlyBreakdown?: Array<{
    month: number
    income: number
    cumulativeIncome: number
    taxableIncome: number
    cumulativeTaxable: number
    taxWithheld: number
    cumulativeTaxWithheld: number
    taxPayable: number
    netIncome: number
  }>
  taxBracket: {
    bracket: string
    rate: number
    quickDeduction: number
  }
}

export interface TaxInput {
  taxYear: number
  incomes: IncomeItem[]
  specialDeductions: SpecialDeduction[]
  otherDeductions: OtherDeduction[]
  basicDeductionPerMonth?: number
  region?: string
  includeMonthlyBreakdown?: boolean
}

export interface KnowledgeDoc {
  id: number
  title: string
  content: string
  category: string
  summary?: string
  tags: Array<{ id: number; name: string; color: string }>
  created_at: string
  updated_at: string
}

export interface KnowledgeCategory {
  id: string
  name: string
  color: string
}

export interface KnowledgeTag {
  id: number
  name: string
  color: string
  docCount?: number
}

export interface LPRRecord {
  id: number
  effective_date: string
  one_year_rate: number
  five_year_rate: number
  created_at: string
}

export interface RegionPolicy {
  id: number
  code: string
  name: string
  provident_fund_rate: number
  commercial_rate_floor: number
  commercial_rate_ceiling: number
  max_provident_fund_loan: number
  down_payment_ratio_first: number
  down_payment_ratio_second: number
  policy_enabled: number
  created_at: string
  updated_at: string
}

export interface PolicyConfig {
  region: string
  regionName: string
  providentFundRate: number
  commercialRateBasedOnLPR: number
  maxProvidentFundLoan: number
  downPaymentFirstHome: number
  downPaymentSecondHome: number
  isFirstHome: boolean
  hasHousingFund: boolean
}
