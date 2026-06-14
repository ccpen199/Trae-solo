import type { Request, Response } from 'express'

const HUNAN_AVERAGE_SALARY_2024 = 5869

const PENSION_MONTHS: Record<number, number> = {
  40: 233,
  45: 216,
  50: 195,
  55: 170,
  60: 139,
  65: 101,
  70: 56,
}

interface PensionEstimateRequest {
  personalAccount: number
  payYears: number
  averageSalaryIndex: number
  retirementAge: number
  currentAge: number
}

interface PensionEstimateResponse {
  basicPension: number
  personalPension: number
  totalPension: number
  details: {
    hunanAverageSalary: number
    indexedAverageSalary: number
    formula: string
    personalAccountMonths: number
    annualIncrease: number
  }
}

class CalculatorController {
  pensionEstimate(req: Request, res: Response): void {
    try {
      let { personalAccount, payYears, averageSalaryIndex, retirementAge, currentAge, payGrade, retireAge } = req.body

      retirementAge = retirementAge || retireAge
      averageSalaryIndex = averageSalaryIndex || 1.0
      if (!personalAccount && payGrade && payYears) {
        personalAccount = payGrade * payYears * 12
      }

      if (!personalAccount || !payYears || !averageSalaryIndex || !retirementAge || !currentAge) {
        res.status(400).json({
          success: false,
          error: '缺少必要参数：个人账户累计储存额(personalAccount)、缴费年限(payYears)、退休年龄(retirementAge/retireAge)、当前年龄(currentAge)',
        })
        return
      }

      if (payYears < 15) {
        res.status(400).json({
          success: false,
          error: '缴费年限不足15年，不符合领取养老金条件',
        })
        return
      }

      if (retirementAge < 40 || retirementAge > 70) {
        res.status(400).json({
          success: false,
          error: '退休年龄需在40-70岁之间',
        })
        return
      }

      if (currentAge >= retirementAge) {
        res.status(400).json({
          success: false,
          error: '当前年龄不能大于等于退休年龄',
        })
        return
      }

      const indexedAverageSalary = HUNAN_AVERAGE_SALARY_2024 * averageSalaryIndex

      const basicPension = (HUNAN_AVERAGE_SALARY_2024 + indexedAverageSalary) / 2 * (payYears / 100)

      const months = PENSION_MONTHS[retirementAge] || 139
      const personalPension = personalAccount / months

      const totalPension = Math.round((basicPension + personalPension) * 100) / 100
      const roundedBasicPension = Math.round(basicPension * 100) / 100
      const roundedPersonalPension = Math.round(personalPension * 100) / 100

      const yearsToRetirement = retirementAge - currentAge
      const annualIncrease = yearsToRetirement * 100

      const result: PensionEstimateResponse = {
        basicPension: roundedBasicPension,
        personalPension: roundedPersonalPension,
        totalPension,
        details: {
          hunanAverageSalary: HUNAN_AVERAGE_SALARY_2024,
          indexedAverageSalary: Math.round(indexedAverageSalary * 100) / 100,
          formula: `基础养老金 = (${HUNAN_AVERAGE_SALARY_2024} + ${Math.round(indexedAverageSalary * 100) / 100}) / 2 * ${payYears}% = ${roundedBasicPension}元；个人账户养老金 = ${personalAccount} / ${months} = ${roundedPersonalPension}元`,
          personalAccountMonths: months,
          annualIncrease,
        },
      }

      res.status(200).json({
        success: true,
        data: result,
        message: '养老金估算成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '养老金估算失败',
      })
    }
  }
}

const calculatorController = new CalculatorController()

export default calculatorController
export { CalculatorController, type PensionEstimateResponse }
