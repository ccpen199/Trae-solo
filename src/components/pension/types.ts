export type PensionIdentity = 'employee' | 'flexible' | 'resident'

export interface EmployeeFormData {
  gender: 'male' | 'female'
  birthMonth: string
  retireAge: number
  paymentYears: number
  avgPaymentBase: number
  personalAccountBalance: number
  localAvgSalary: number
  deemedPaymentYears: number
  transitionalPension: number
}

export interface FlexibleFormData {
  gender: 'male' | 'female'
  birthMonth: string
  retireAge: number
  paymentYears: number
  paymentGrade: number
  personalAccountBalance: number
  localAvgSalary: number
}

export interface ResidentFormData {
  gender: 'male' | 'female'
  birthMonth: string
  receiveAge: number
  paymentYears: number
  annualPaymentGrade: number
  governmentSubsidy: number
  personalAccountBalance: number
  basicPensionStandard: number
}

export type PensionFormData = EmployeeFormData | FlexibleFormData | ResidentFormData

export interface PensionResultData {
  monthlyTotal: number
  yearlyTotal: number
  basePension: number
  personalPension: number
  transitionalPension?: number
  localSubsidy?: number
  avgIndex: number
  paymentMonths: number
  retireAge: number
  paymentYears: number
  localAvgSalary: number
  avgPaymentBase: number
  personalAccountBalance: number
  identity: PensionIdentity
}

export interface ComparisonItem {
  name: string
  monthlyPension: number
  totalPayment: number
  paybackYears: number
  returnRate: number
}

export interface HistoryRecord {
  id: string
  identity: PensionIdentity
  timestamp: number
  formData: PensionFormData
  result: PensionResultData
}

export const identityLabels: Record<PensionIdentity, string> = {
  employee: '企业职工',
  flexible: '灵活就业人员',
  resident: '城乡居民',
}

export const residentPaymentGrades = [200, 300, 500, 800, 1000, 2000, 3000, 4000, 5000]

export const PAYMENT_MONTHS_MAP: Record<number, number> = {
  60: 139,
  55: 170,
  50: 195,
  45: 216,
}

export const maleRetireAges = [60, 55, 50]
export const femaleRetireAges = [55, 50, 45]
export const residentReceiveAges = [60]
