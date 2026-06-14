interface InvoiceInfo {
  orderNo: string
  userId: number
  insuranceType: string
  payYear: number
  amount: number
  payerName: string
  payerIdCard: string
}

interface TaxDeclarationInfo {
  declarationPeriod: string
  totalAmount: number
  taxAmount: number
  declarationType: string
  operatorId: number
}

interface InvoiceResult {
  success: boolean
  invoiceNo?: string
  invoiceCode?: string
  issuedAt?: string
  errorMessage?: string
}

interface TaxDeclarationResult {
  success: boolean
  declarationNo?: string
  receivedAt?: string
  errorMessage?: string
}

class GoldenTaxService {
  private static instance: GoldenTaxService

  private constructor() {}

  static getInstance(): GoldenTaxService {
    if (!GoldenTaxService.instance) {
      GoldenTaxService.instance = new GoldenTaxService()
    }
    return GoldenTaxService.instance
  }

  issueInvoice(orderInfo: InvoiceInfo): Promise<InvoiceResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05

        if (success) {
          resolve({
            success: true,
            invoiceNo: 'INV' + Date.now().toString(),
            invoiceCode: 'GTS' + orderInfo.payYear,
            issuedAt: new Date().toISOString(),
          })
        } else {
          resolve({
            success: false,
            errorMessage: '金税三期系统繁忙，请稍后重试',
          })
        }
      }, 800 + Math.random() * 1200)
    })
  }

  submitTaxDeclaration(declarationInfo: TaxDeclarationInfo): Promise<TaxDeclarationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.03

        if (success) {
          resolve({
            success: true,
            declarationNo: 'TAX' + Date.now().toString(),
            receivedAt: new Date().toISOString(),
          })
        } else {
          resolve({
            success: false,
            errorMessage: '税务申报提交失败，请检查数据后重试',
          })
        }
      }, 1000 + Math.random() * 2000)
    })
  }
}

const goldenTaxService = GoldenTaxService.getInstance()

export default goldenTaxService
export { GoldenTaxService, type InvoiceInfo, type TaxDeclarationInfo, type InvoiceResult, type TaxDeclarationResult }
