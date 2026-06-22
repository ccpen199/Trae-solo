import { Router, type Request, type Response } from 'express'

const router = Router()

router.post('/compute', (req: Request, res: Response): void => {
  const {
    totalPrice,
    commercialLoan,
    commercialRate,
    fundLoan,
    fundRate,
    years,
    isFirstHome,
    area
  } = req.body

  if (!totalPrice || !years) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const totalMonths = years * 12
  const cLoan = Number(commercialLoan) || 0
  const fLoan = Number(fundLoan) || 0
  const cRate = (Number(commercialRate) || 3.45) / 100 / 12
  const fRate = (Number(fundRate) || 2.85) / 100 / 12
  const isFirst = Boolean(isFirstHome)
  const totalArea = Number(area) || 0
  const price = Number(totalPrice)

  function calcMonthly(principal: number, monthRate: number, months: number): number {
    if (principal <= 0) return 0
    if (monthRate <= 0) return principal / months
    return principal * monthRate * Math.pow(1 + monthRate, months) / (Math.pow(1 + monthRate, months) - 1)
  }

  const commercialMonthly = calcMonthly(cLoan, cRate, totalMonths)
  const fundMonthly = calcMonthly(fLoan, fRate, totalMonths)
  const monthlyPayment = commercialMonthly + fundMonthly

  const totalRepayment = monthlyPayment * totalMonths
  const totalInterest = totalRepayment - cLoan - fLoan

  const taxes = []

  taxes.push({
    name: '契税',
    rate: isFirst ? (totalArea <= 90 ? '1%' : '1.5%') : '3%',
    amount: Math.round(price * (isFirst ? (totalArea <= 90 ? 0.01 : 0.015) : 0.03)),
    description: isFirst
      ? (totalArea <= 90 ? '首套房且面积≤90㎡，税率为1%' : '首套房且面积>90㎡，税率为1.5%')
      : '非首套房，税率为3%'
  })

  const vatRate = 0.056
  taxes.push({
    name: '增值税',
    rate: '5.6%',
    amount: Math.round(price / 1.05 * vatRate),
    description: '新房由开发商缴纳，含在房价中'
  })

  const incomeTaxRate = isFirst ? (totalArea <= 90 ? 0.01 : 0.015) : 0.03
  taxes.push({
    name: '个人所得税',
    rate: isFirst ? (totalArea <= 90 ? '1%' : '1.5%') : '3%',
    amount: Math.round(price * incomeTaxRate),
    description: '新房一般由开发商承担'
  })

  taxes.push({
    name: '维修基金',
    rate: '约150元/㎡',
    amount: Math.round(totalArea * 150),
    description: '按建筑面积计算，多层约100元/㎡，高层约150元/㎡'
  })

  const repaymentPlan = []
  let cRemaining = cLoan
  let fRemaining = fLoan

  for (let m = 1; m <= totalMonths; m++) {
    const cInterest = cRemaining * cRate
    const cPrincipal = commercialMonthly - cInterest
    cRemaining = Math.max(0, cRemaining - cPrincipal)

    const fInterest = fRemaining * fRate
    const fPrincipal = fundMonthly - fInterest
    fRemaining = Math.max(0, fRemaining - fPrincipal)

    const totalInterestMonth = cInterest + fInterest
    const totalPrincipalMonth = cPrincipal + fPrincipal

    repaymentPlan.push({
      month: m,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(totalPrincipalMonth * 100) / 100,
      interest: Math.round(totalInterestMonth * 100) / 100,
      remainingPrincipal: Math.round((cRemaining + fRemaining) * 100) / 100
    })
  }

  res.json({
    success: true,
    data: {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      commercialMonthly: Math.round(commercialMonthly * 100) / 100,
      fundMonthly: Math.round(fundMonthly * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      taxes,
      repaymentPlan
    }
  })
})

export default router
