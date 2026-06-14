import type {
  MortgageParams,
  MortgageResult,
  MonthlyDetail,
  TaxParams,
  TaxResult,
  TaxBreakdown,
  ApiResponse
} from '../../shared/types.js'

export class CalculatorService {
  async calculateMortgage(params: MortgageParams): Promise<ApiResponse<MortgageResult>> {
    try {
      const { totalPrice, downPaymentRatio, loanYears, interestRate, repaymentType } = params

      const downPayment = totalPrice * downPaymentRatio
      const loanAmount = totalPrice - downPayment
      const monthlyRate = interestRate / 100 / 12
      const totalMonths = loanYears * 12

      let monthlyPayment: number
      let totalPayment: number
      let totalInterest: number
      const monthlyDetails: MonthlyDetail[] = []

      if (repaymentType === 'equal-interest') {
        monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1)
        totalPayment = monthlyPayment * totalMonths
        totalInterest = totalPayment - loanAmount

        let remaining = loanAmount
        for (let i = 1; i <= totalMonths; i++) {
          const interest = remaining * monthlyRate
          const principal = monthlyPayment - interest
          remaining -= principal
          monthlyDetails.push({
            month: i,
            principal: Math.round(principal * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            remaining: Math.max(0, Math.round(remaining * 100) / 100)
          })
        }
      } else {
        const monthlyPrincipal = loanAmount / totalMonths
        let remaining = loanAmount
        totalPayment = 0
        totalInterest = 0

        for (let i = 1; i <= totalMonths; i++) {
          const interest = remaining * monthlyRate
          const principal = monthlyPrincipal
          const payment = principal + interest
          remaining -= principal
          totalPayment += payment
          totalInterest += interest
          monthlyDetails.push({
            month: i,
            principal: Math.round(principal * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            remaining: Math.max(0, Math.round(remaining * 100) / 100)
          })
        }

        monthlyPayment = monthlyDetails[0]?.principal + monthlyDetails[0]?.interest || 0
      }

      return {
        success: true,
        data: {
          downPayment: Math.round(downPayment * 100) / 100,
          loanAmount: Math.round(loanAmount * 100) / 100,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalPayment: Math.round(totalPayment * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          monthlyDetails
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '房贷计算失败'
      }
    }
  }

  async calculateTax(params: TaxParams): Promise<ApiResponse<TaxResult>> {
    try {
      const { propertyType, totalPrice, area, isFirstHouse, isFiveYears, isOnlyOne, originalPrice } = params

      const breakdown: TaxBreakdown[] = []
      let deedTax = 0
      let incomeTax = 0
      let valueAddedTax = 0
      let stampDuty = 0
      let agencyFee = 0

      if (propertyType === 'new') {
        let deedTaxRate = 0.03
        if (isFirstHouse) {
          if (area <= 90) {
            deedTaxRate = 0.01
          } else if (area <= 144) {
            deedTaxRate = 0.015
          }
        }
        deedTax = totalPrice * deedTaxRate
        breakdown.push({
          name: '契税',
          amount: Math.round(deedTax * 100) / 100,
          rate: `${(deedTaxRate * 100).toFixed(1)}%`
        })

        stampDuty = totalPrice * 0.0005
        breakdown.push({
          name: '印花税',
          amount: Math.round(stampDuty * 100) / 100,
          rate: '0.05%'
        })

        agencyFee = totalPrice * 0.025
        breakdown.push({
          name: '中介费',
          amount: Math.round(agencyFee * 100) / 100,
          rate: '2.5%'
        })
      } else {
        let deedTaxRate = 0.03
        if (isFirstHouse) {
          if (area <= 90) {
            deedTaxRate = 0.01
          } else if (area <= 144) {
            deedTaxRate = 0.015
          }
        }
        deedTax = totalPrice * deedTaxRate
        breakdown.push({
          name: '契税',
          amount: Math.round(deedTax * 100) / 100,
          rate: `${(deedTaxRate * 100).toFixed(1)}%`
        })

        if (!(isFiveYears && isOnlyOne)) {
          if (originalPrice) {
            incomeTax = (totalPrice - originalPrice) * 0.2
          } else {
            incomeTax = totalPrice * 0.01
          }
          breakdown.push({
            name: '个人所得税',
            amount: Math.round(incomeTax * 100) / 100,
            rate: originalPrice ? '差额20%' : '全额1%'
          })
        }

        if (!isFiveYears) {
          valueAddedTax = totalPrice * 0.056
          breakdown.push({
            name: '增值税及附加',
            amount: Math.round(valueAddedTax * 100) / 100,
            rate: '5.6%'
          })
        }

        stampDuty = totalPrice * 0.0005
        breakdown.push({
          name: '印花税',
          amount: Math.round(stampDuty * 100) / 100,
          rate: '0.05%'
        })

        agencyFee = totalPrice * 0.025
        breakdown.push({
          name: '中介费',
          amount: Math.round(agencyFee * 100) / 100,
          rate: '2.5%'
        })
      }

      const total = deedTax + incomeTax + valueAddedTax + stampDuty + agencyFee

      return {
        success: true,
        data: {
          deedTax: Math.round(deedTax * 100) / 100,
          incomeTax: Math.round(incomeTax * 100) / 100,
          valueAddedTax: Math.round(valueAddedTax * 100) / 100,
          stampDuty: Math.round(stampDuty * 100) / 100,
          agencyFee: Math.round(agencyFee * 100) / 100,
          total: Math.round(total * 100) / 100,
          breakdown
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '税费计算失败'
      }
    }
  }
}

export const calculatorService = new CalculatorService()
