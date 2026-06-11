export interface InsuranceDetail {
  type: 'pension' | 'medical' | 'unemployment' | 'injury' | 'maternity'
  typeName: string
  status: 'active' | 'suspended' | 'none'
  months: number
  baseAmount: number
  companyPay: number
  personalPay: number
  companyRatio: number
  personalRatio: number
  color: string
  icon: string
  records: PaymentRecord[]
  benefitInfo: BenefitInfo
  dataSource: string
}

export interface PaymentRecord {
  month: string
  baseAmount: number
  companyPay: number
  personalPay: number
  companyRatio: number
  personalRatio: number
  totalPay: number
  payStatus: '已到账' | '缴纳中' | '待缴纳'
  payDate: string
}

export interface BenefitInfo {
  personalBalance: number
  companyTotal: number
  personalTotal: number
  lastBenefitDate: string | null
  monthlyBenefit: number | null
}

export interface CertificateInfo {
  certificateNo: string
  userName: string
  idCard: string
  city: string
  cityCode: string
  socialSecurityNo: string
  insurances: { typeName: string; status: string; months: number; baseAmount: number; companyPay: number; personalPay: number }[]
  generateTime: string
  verifyCode: string
  dataSource: string
}

const cityConfig: Record<string, { baseAmount: number; monthsFactor: number; code: string;社保系统: string }> = {
  '广州': { baseAmount: 8800, monthsFactor: 1.0, code: '4401', 社保系统: '广州市社保基金管理系统' },
  '深圳': { baseAmount: 9200, monthsFactor: 0.95, code: '4403', 社保系统: '深圳市社保基金管理系统' },
  '珠海': { baseAmount: 7600, monthsFactor: 0.88, code: '4404', 社保系统: '珠海市社保基金管理系统' },
  '佛山': { baseAmount: 7200, monthsFactor: 0.92, code: '4406', 社保系统: '佛山市社保基金管理系统' },
  '东莞': { baseAmount: 7000, monthsFactor: 0.85, code: '4419', 社保系统: '东莞市社保基金管理系统' },
  '中山': { baseAmount: 6800, monthsFactor: 0.83, code: '4420', 社保系统: '中山市社保基金管理系统' },
  '惠州': { baseAmount: 6500, monthsFactor: 0.78, code: '4413', 社保系统: '惠州市社保基金管理系统' },
  '江门': { baseAmount: 6200, monthsFactor: 0.75, code: '4407', 社保系统: '江门市社保基金管理系统' },
  '汕头': { baseAmount: 5800, monthsFactor: 0.70, code: '4405', 社保系统: '汕头市社保基金管理系统' },
  '湛江': { baseAmount: 5500, monthsFactor: 0.68, code: '4408', 社保系统: '湛江市社保基金管理系统' },
  '茂名': { baseAmount: 5300, monthsFactor: 0.65, code: '4409', 社保系统: '茂名市社保基金管理系统' },
  '肇庆': { baseAmount: 5600, monthsFactor: 0.72, code: '4412', 社保系统: '肇庆市社保基金管理系统' },
}

const insuranceConfigs = [
  { type: 'pension' as const, typeName: '养老保险', companyRatio: 0.16, personalRatio: 0.08, color: '#1A4B8C', icon: '🏦' },
  { type: 'medical' as const, typeName: '医疗保险', companyRatio: 0.085, personalRatio: 0.02, color: '#38A169', icon: '🏥' },
  { type: 'unemployment' as const, typeName: '失业保险', companyRatio: 0.007, personalRatio: 0.003, color: '#D69E2E', icon: '📋' },
  { type: 'injury' as const, typeName: '工伤保险', companyRatio: 0.005, personalRatio: 0, color: '#E53E3E', icon: '🛡️' },
  { type: 'maternity' as const, typeName: '生育保险', companyRatio: 0.006, personalRatio: 0, color: '#E86830', icon: '👶' },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const generateRecords = (baseAmount: number, companyRatio: number, personalRatio: number, seed: number): PaymentRecord[] => {
  const records: PaymentRecord[] = []
  const rand = seededRandom(seed)
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const variation = 1 + (rand() - 0.5) * 0.04
    const ba = Math.round(baseAmount * variation)
    const cp = Math.round(ba * companyRatio)
    const pp = Math.round(ba * personalRatio)
    const payDay = new Date(d.getFullYear(), d.getMonth() + 1, Math.floor(rand() * 10) + 10)
    const payStatuses: ('已到账' | '缴纳中' | '待缴纳')[] = ['已到账', '已到账', '已到账', '缴纳中', '待缴纳']
    const statusIdx = i === 0 ? 3 : i === 1 ? 4 : 0
    records.push({
      month,
      baseAmount: ba,
      companyPay: cp,
      personalPay: pp,
      companyRatio,
      personalRatio,
      totalPay: cp + pp,
      payStatus: payStatuses[Math.min(statusIdx, payStatuses.length - 1)],
      payDate: `${payDay.getFullYear()}-${String(payDay.getMonth() + 1).padStart(2, '0')}-${String(payDay.getDate()).padStart(2, '0')}`,
    })
  }
  return records.reverse()
}

export function getInsuranceListByCity(city: string): InsuranceDetail[] {
  const config = cityConfig[city] || cityConfig['广州']
  const baseSeed = city.charCodeAt(0) * 1000 + city.charCodeAt(1) * 100

  return insuranceConfigs.map((ic, idx) => {
    const baseMonths = Math.round(186 * config.monthsFactor * (1 - idx * 0.02))
    const ba = config.baseAmount
    const cp = Math.round(ba * ic.companyRatio)
    const pp = Math.round(ba * ic.personalRatio)

    return {
      type: ic.type,
      typeName: ic.typeName,
      status: 'active' as const,
      months: baseMonths,
      baseAmount: ba,
      companyPay: cp,
      personalPay: pp,
      companyRatio: ic.companyRatio,
      personalRatio: ic.personalRatio,
      color: ic.color,
      icon: ic.icon,
      records: generateRecords(ba, ic.companyRatio, ic.personalRatio, baseSeed + idx * 100),
      benefitInfo: {
        personalBalance: Math.round(pp * baseMonths * (1 + idx * 0.3)),
        companyTotal: Math.round(cp * baseMonths),
        personalTotal: Math.round(pp * baseMonths),
        lastBenefitDate: ic.type === 'pension' ? '2026-05-15' : ic.type === 'medical' ? '2026-06-03' : null,
        monthlyBenefit: ic.type === 'pension' ? Math.round(ba * 0.035) : null,
      },
      dataSource: config.社保系统,
    }
  })
}

export function getCertificateInfoByCity(city: string): CertificateInfo {
  const config = cityConfig[city] || cityConfig['广州']
  const insurances = getInsuranceListByCity(city)
  const now = new Date()
  const certNo = `GD${config.code}${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9000) + 1000)}`
  const verifyCode = `${certNo.slice(-6)}${String(Math.floor(Math.random() * 900) + 100)}`

  return {
    certificateNo: certNo,
    userName: '张伟',
    idCard: '4401061990****2518',
    city,
    cityCode: config.code,
    socialSecurityNo: `GD${config.code}20260609001`,
    insurances: insurances.map((i) => ({
      typeName: i.typeName,
      status: i.status === 'active' ? '参保中' : '未参保',
      months: i.months,
      baseAmount: i.baseAmount,
      companyPay: i.companyPay,
      personalPay: i.personalPay,
    })),
    generateTime: now.toLocaleString('zh-CN', { hour12: false }),
    verifyCode,
    dataSource: config.社保系统,
  }
}

export function getChartData(city: string) {
  const insurances = getInsuranceListByCity(city)
  return insurances[0].records.map((r) => {
    const entry: Record<string, string | number> = { month: r.month.slice(5) }
    insurances.forEach((ins) => {
      const rec = ins.records.find((rec) => rec.month === r.month)
      if (rec) entry[ins.typeName] = rec.companyPay + rec.personalPay
    })
    return entry
  })
}

export const insuranceList = getInsuranceListByCity('广州')

export const certificateInfo = getCertificateInfoByCity('广州')
