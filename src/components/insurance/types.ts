export type IdentityType = 'employee' | 'flexible' | 'resident'

export type InsuranceStatus = '正常' | '停缴' | '终止'

export interface InsuranceItem {
  type: string
  status: InsuranceStatus
  startDate: string
  months: number
  totalMonths: number
  balance: string
  monthlyDeposit: string
  lastDate: string
}

export interface PaymentRecord {
  month: string
  base: string
  personal: string
  unit: string
  status: string
  company: string
  location: string
}

export interface BenefitItem {
  name: string
  status: string
  amount: string
  period: string
  lastDate: string
  history: { date: string; amount: string }[]
}

export interface CertificateData {
  certificateNo: string
  name: string
  idCard: string
  insuranceType: string
  status: string
  validFrom: string
  validTo: string
}

export const identityLabels: Record<IdentityType, string> = {
  employee: '职工',
  flexible: '灵活就业',
  resident: '城乡居民',
}
