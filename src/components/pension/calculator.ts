import type {
  PensionIdentity,
  EmployeeFormData,
  FlexibleFormData,
  ResidentFormData,
  PensionResultData,
  ComparisonItem,
} from './types'
import { PAYMENT_MONTHS_MAP } from './types'

export function calcEmployeePension(form: EmployeeFormData): PensionResultData {
  const avgIndex = form.avgPaymentBase / form.localAvgSalary
  const totalYears = form.paymentYears + form.deemedPaymentYears
  const basePension = (form.localAvgSalary + form.localAvgSalary * avgIndex) / 2 * totalYears * 0.01
  const paymentMonths = PAYMENT_MONTHS_MAP[form.retireAge] ?? 139
  const personalPension = form.personalAccountBalance / paymentMonths
  const transitionalPension = form.transitionalPension
  const monthlyTotal = basePension + personalPension + transitionalPension
  const yearlyTotal = monthlyTotal * 12

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyTotal: Math.round(yearlyTotal * 100) / 100,
    basePension: Math.round(basePension * 100) / 100,
    personalPension: Math.round(personalPension * 100) / 100,
    transitionalPension: Math.round(transitionalPension * 100) / 100,
    avgIndex: Math.round(avgIndex * 1000) / 1000,
    paymentMonths,
    retireAge: form.retireAge,
    paymentYears: totalYears,
    localAvgSalary: form.localAvgSalary,
    avgPaymentBase: form.avgPaymentBase,
    personalAccountBalance: form.personalAccountBalance,
    identity: 'employee',
  }
}

export function calcFlexiblePension(form: FlexibleFormData): PensionResultData {
  const avgPaymentBase = form.localAvgSalary * (form.paymentGrade / 100)
  const avgIndex = form.paymentGrade / 100
  const basePension = (form.localAvgSalary + form.localAvgSalary * avgIndex) / 2 * form.paymentYears * 0.01
  const paymentMonths = PAYMENT_MONTHS_MAP[form.retireAge] ?? 139
  const personalPension = form.personalAccountBalance / paymentMonths
  const monthlyTotal = basePension + personalPension
  const yearlyTotal = monthlyTotal * 12

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyTotal: Math.round(yearlyTotal * 100) / 100,
    basePension: Math.round(basePension * 100) / 100,
    personalPension: Math.round(personalPension * 100) / 100,
    avgIndex: Math.round(avgIndex * 1000) / 1000,
    paymentMonths,
    retireAge: form.retireAge,
    paymentYears: form.paymentYears,
    localAvgSalary: form.localAvgSalary,
    avgPaymentBase: Math.round(avgPaymentBase * 100) / 100,
    personalAccountBalance: form.personalAccountBalance,
    identity: 'flexible',
  }
}

export function calcResidentPension(form: ResidentFormData): PensionResultData {
  const personalPension = form.personalAccountBalance / 139
  const basePension = form.basicPensionStandard
  const monthlyTotal = basePension + personalPension
  const yearlyTotal = monthlyTotal * 12

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyTotal: Math.round(yearlyTotal * 100) / 100,
    basePension: Math.round(basePension * 100) / 100,
    personalPension: Math.round(personalPension * 100) / 100,
    localSubsidy: form.governmentSubsidy,
    avgIndex: 1,
    paymentMonths: 139,
    retireAge: form.receiveAge,
    paymentYears: form.paymentYears,
    localAvgSalary: 0,
    avgPaymentBase: form.annualPaymentGrade,
    personalAccountBalance: form.personalAccountBalance,
    identity: 'resident',
  }
}

export function calcPension(
  identity: PensionIdentity,
  form: EmployeeFormData | FlexibleFormData | ResidentFormData
): PensionResultData {
  switch (identity) {
    case 'employee':
      return calcEmployeePension(form as EmployeeFormData)
    case 'flexible':
      return calcFlexiblePension(form as FlexibleFormData)
    case 'resident':
      return calcResidentPension(form as ResidentFormData)
  }
}

export function generateComparisonData(
  identity: PensionIdentity,
  form: EmployeeFormData | FlexibleFormData | ResidentFormData,
  localAvgSalary: number
): ComparisonItem[] {
  const grades = [
    { name: '低档(60%)', multiplier: 0.6 },
    { name: '中档(100%)', multiplier: 1.0 },
    { name: '高档(300%)', multiplier: 3.0 },
  ]

  return grades.map((grade) => {
    let monthlyPension: number
    let totalPayment: number

    if (identity === 'employee') {
      const f = form as EmployeeFormData
      const avgBase = localAvgSalary * grade.multiplier
      const avgIndex = grade.multiplier
      const totalYears = f.paymentYears + f.deemedPaymentYears
      const baseP = (localAvgSalary + localAvgSalary * avgIndex) / 2 * totalYears * 0.01
      const personalP = (avgBase * 0.08 * 12 * f.paymentYears) / (PAYMENT_MONTHS_MAP[f.retireAge] ?? 139)
      monthlyPension = baseP + personalP + f.transitionalPension
      totalPayment = avgBase * 0.08 * 12 * f.paymentYears
    } else if (identity === 'flexible') {
      const f = form as FlexibleFormData
      const avgBase = localAvgSalary * grade.multiplier
      const avgIndex = grade.multiplier
      const baseP = (localAvgSalary + localAvgSalary * avgIndex) / 2 * f.paymentYears * 0.01
      const personalP = (avgBase * 0.2 * 12 * f.paymentYears * 0.4) / (PAYMENT_MONTHS_MAP[f.retireAge] ?? 139)
      monthlyPension = baseP + personalP
      totalPayment = avgBase * 0.2 * 12 * f.paymentYears
    } else {
      const f = form as ResidentFormData
      const annualAmount = [200, 2000, 5000][grades.indexOf(grade)]
      const personalAcc = annualAmount * f.paymentYears + f.governmentSubsidy * f.paymentYears
      const personalP = personalAcc / 139
      monthlyPension = f.basicPensionStandard + personalP
      totalPayment = annualAmount * f.paymentYears
    }

    const paybackYears = totalPayment / (monthlyPension * 12)
    const returnRate = (monthlyPension * 12 * 20 - totalPayment) / totalPayment * 100

    return {
      name: grade.name,
      monthlyPension: Math.round(monthlyPension * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      paybackYears: Math.round(paybackYears * 10) / 10,
      returnRate: Math.round(returnRate * 10) / 10,
    }
  })
}

export function generateOptimizationTips(
  identity: PensionIdentity,
  form: EmployeeFormData | FlexibleFormData | ResidentFormData,
  result: PensionResultData
): string[] {
  const tips: string[] = []

  if (identity === 'employee') {
    const f = form as EmployeeFormData
    if (f.paymentYears < 30) {
      const extraYears = 1
      const increase = Math.round(result.basePension * (extraYears / result.paymentYears))
      tips.push(`缴费年限每增加1年，每月养老金约增加¥${increase.toLocaleString()}`)
    } else {
      const increase = Math.round((f.localAvgSalary * 1.0 - f.avgPaymentBase) * 0.01 * result.paymentYears)
      tips.push(`缴费基数提高至社平100%档，每月可增加约¥${Math.max(increase, 80).toLocaleString()}`)
    }
    if (f.avgPaymentBase < f.localAvgSalary * 1.0) {
      const newAvgIndex = 1.0
      const totalYears = f.paymentYears + f.deemedPaymentYears
      const newBasePension = (f.localAvgSalary + f.localAvgSalary * newAvgIndex) / 2 * totalYears * 0.01
      const increase = Math.round(newBasePension - result.basePension)
      tips.push(`缴费基数提高至社平100%档，每月可增加约¥${Math.max(increase, 50).toLocaleString()}`)
    } else {
      const increase = Math.round(result.monthlyTotal * 0.12)
      tips.push(`延迟退休至65岁，每月可增加约¥${increase.toLocaleString()}`)
    }
    if (f.retireAge < 65) {
      const paymentMonthsNew = PAYMENT_MONTHS_MAP[65] ?? 101
      const extraPersonalP = f.personalAccountBalance / (paymentMonthsNew ?? 101) - result.personalPension
      const extraBaseP = result.basePension * 0.05
      const increase = Math.round(extraPersonalP + extraBaseP + result.monthlyTotal * 0.05)
      tips.push(`延迟退休至65岁，每月可增加约¥${Math.max(increase, 120).toLocaleString()}`)
    } else {
      tips.push('可通过购买商业养老保险作为补充，提升养老保障水平')
    }
  } else if (identity === 'flexible') {
    const f = form as FlexibleFormData
    if (f.paymentYears < 25) {
      const increase = Math.round(result.basePension * (1 / f.paymentYears))
      tips.push(`缴费年限每增加1年，每月养老金约增加¥${Math.max(increase, 30).toLocaleString()}`)
    } else {
      const increase = Math.round(result.monthlyTotal * 0.08)
      tips.push(`缴费年限每增加1年，每月养老金约增加¥${Math.max(increase, 25).toLocaleString()}`)
    }
    if (f.paymentGrade < 100) {
      const newGrade = 100
      const newAvgIndex = newGrade / 100
      const newBasePension = (f.localAvgSalary + f.localAvgSalary * newAvgIndex) / 2 * f.paymentYears * 0.01
      const increase = Math.round(newBasePension - result.basePension)
      tips.push(`缴费基数提高至社平100%档，每月可增加约¥${Math.max(increase, 60).toLocaleString()}`)
    } else {
      const increase = Math.round(result.monthlyTotal * 0.1)
      tips.push(`缴费基数提高至社平300%档，每月可增加约¥${Math.round(increase * 1.8).toLocaleString()}`)
    }
    if (f.retireAge < 65) {
      const paymentMonthsNew = PAYMENT_MONTHS_MAP[65] ?? 101
      const extraPersonalP = f.personalAccountBalance / (paymentMonthsNew ?? 101) - result.personalPension
      const extraBaseP = result.basePension * 0.05
      const increase = Math.round(extraPersonalP + extraBaseP + result.monthlyTotal * 0.06)
      tips.push(`延迟退休至65岁，每月可增加约¥${Math.max(increase, 100).toLocaleString()}`)
    } else {
      tips.push('建议选择按年缴费，可享受政府补贴和税收优惠政策')
    }
  } else {
    const f = form as ResidentFormData
    if (f.paymentYears < 15) {
      const extraYears = 15 - f.paymentYears
      tips.push(`建议缴满15年，还需缴纳${extraYears}年才能领取完整基础养老金`)
    } else {
      const increase = Math.round(f.basicPensionStandard * 0.02)
      tips.push(`缴费年限每增加1年，每月基础养老金约增加¥${Math.max(increase, 5)}`)
    }
    if (f.annualPaymentGrade < 3000) {
      const newGrade = 3000
      const newPersonalP = (newGrade * f.paymentYears + f.governmentSubsidy * f.paymentYears) / 139
      const increase = Math.round(newPersonalP - result.personalPension)
      tips.push(`年缴费档次提高至3000元，每月个人账户可增加约¥${Math.max(increase, 80)}`)
    } else {
      tips.push('已选择较高缴费档次，可关注地方政府补贴调整政策')
    }
    const increase = Math.round((f.basicPensionStandard * 0.15) + 30)
    tips.push(`延迟退休至65岁，每月可增加约¥${Math.max(increase, 50)}`)
  }

  return tips.slice(0, 3)
}

export function generateChartComparison(
  identity: PensionIdentity,
  form: EmployeeFormData | FlexibleFormData | ResidentFormData,
  localAvgSalary: number
) {
  const grades = [
    { name: '低档(60%)', multiplier: 0.6 },
    { name: '中档(100%)', multiplier: 1.0 },
    { name: '高档(300%)', multiplier: 3.0 },
  ]

  return grades.map((grade) => {
    let baseP = 0
    let personalP = 0

    if (identity === 'employee') {
      const f = form as EmployeeFormData
      const avgBase = localAvgSalary * grade.multiplier
      const avgIndex = grade.multiplier
      const totalYears = f.paymentYears + f.deemedPaymentYears
      baseP = Math.round(((localAvgSalary + localAvgSalary * avgIndex) / 2 * totalYears * 0.01) * 100) / 100
      personalP = Math.round(((avgBase * 0.08 * 12 * f.paymentYears) / (PAYMENT_MONTHS_MAP[f.retireAge] ?? 139)) * 100) / 100
    } else if (identity === 'flexible') {
      const f = form as FlexibleFormData
      const avgBase = localAvgSalary * grade.multiplier
      const avgIndex = grade.multiplier
      baseP = Math.round(((localAvgSalary + localAvgSalary * avgIndex) / 2 * f.paymentYears * 0.01) * 100) / 100
      personalP = Math.round(((avgBase * 0.2 * 12 * f.paymentYears * 0.4) / (PAYMENT_MONTHS_MAP[f.retireAge] ?? 139)) * 100) / 100
    } else {
      const f = form as ResidentFormData
      const annualAmount = [200, 2000, 5000][grades.indexOf(grade)]
      const personalAcc = annualAmount * f.paymentYears + f.governmentSubsidy * f.paymentYears
      baseP = f.basicPensionStandard
      personalP = Math.round((personalAcc / 139) * 100) / 100
    }

    return {
      name: grade.name,
      基础养老金: baseP,
      个人账户: personalP,
      总养老金: Math.round((baseP + personalP) * 100) / 100,
    }
  })
}
