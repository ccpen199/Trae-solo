import paymentRepository, { type PaymentOrder } from '../repositories/paymentRepository.js'
import insuranceRepository from '../repositories/insuranceRepository.js'
import userRepository from '../repositories/userRepository.js'
import goldenTaxService from './external/GoldenTaxService.js'
import type { PaginationParams, PaginationResult } from '../repositories/base.js'

interface CreateOrderRequest {
  insuranceType: string
  payYear: number
  payGrade: number
  channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank'
}

interface CreateOrderParams {
  userId: number
  insuranceType: string
  payYear: number
  payGrade: number
  channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank'
}

interface CreateOrderResult {
  success: boolean
  order?: PaymentOrder
  error?: string
}

interface PayOrderResult {
  success: boolean
  order?: PaymentOrder
  error?: string
}

interface OrderStatusResult {
  success: boolean
  order?: PaymentOrder
  allSynced?: boolean
  syncStatus?: {
    taxInvoice: string
    finance: string
    medicalCredit: string
  }
  error?: string
}

interface UserOrdersResult {
  success: boolean
  items?: PaymentOrder[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  error?: string
}

const PAY_GRADE_AMOUNTS: Record<number, number> = {
  1: 200,
  2: 300,
  3: 500,
  4: 800,
  5: 1000,
  6: 1500,
  7: 2000,
  8: 3000,
  9: 5000,
}

class PaymentService {
  private static instance: PaymentService

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  private generateOrderNo(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `ORD${year}${month}${day}${Date.now()}${random}`
  }

  private calculateAmount(payGrade: number): number {
    return PAY_GRADE_AMOUNTS[payGrade] || 500
  }

  getOrderList(userId: number, pagination: PaginationParams = {}): UserOrdersResult {
    const result = paymentRepository.findByUserId(userId, pagination)

    return {
      success: true,
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }
  }

  createOrder(userId: number, params: CreateOrderRequest): CreateOrderResult
  createOrder(params: CreateOrderParams): CreateOrderResult
  createOrder(
    userIdOrParams: number | CreateOrderParams,
    params?: CreateOrderRequest): CreateOrderResult {
    let userId: number
    let insuranceType: string
    let payYear: number
    let payGrade: number
    let channel: 'wechat' | 'alipay' | 'dc_epay' | 'bank'

    if (typeof userIdOrParams === 'number') {
      userId = userIdOrParams
      insuranceType = params!.insuranceType
      payYear = params!.payYear
      payGrade = params!.payGrade
      channel = params!.channel
    } else {
      userId = userIdOrParams.userId
      insuranceType = userIdOrParams.insuranceType
      payYear = userIdOrParams.payYear
      payGrade = userIdOrParams.payGrade
      channel = userIdOrParams.channel
    }

    const insurance = insuranceRepository.findByUserIdAndType(userId, insuranceType)
    if (!insurance) {
      return {
        success: false,
        error: '未查询到对应险种参保信息',
      }
    }

    if (insurance.status !== 'insured') {
      return {
        success: false,
        error: '参保状态异常，无法缴费',
      }
    }

    const amount = this.calculateAmount(payGrade)
    const orderNo = this.generateOrderNo()

    const result = paymentRepository.create({
      orderNo,
      userId,
      insuranceType,
      payYear,
      payGrade,
      amount,
      channel,
    })

    const order = paymentRepository.findById(result.id)

    return {
      success: true,
      order,
    }
  }

  payOrder(userId: number, orderId: number): Promise<PayOrderResult>
  payOrder(orderId: number, userId: number): Promise<PayOrderResult>
  payOrder(
    userIdOrOrderId: number,
    orderIdOrUserId: number): Promise<PayOrderResult> {
    let userId: number
    let orderId: number

    if (userIdOrOrderId < orderIdOrUserId || orderIdOrUserId > 1000000) {
      userId = userIdOrOrderId
      orderId = orderIdOrUserId
    } else {
      orderId = userIdOrOrderId
      userId = orderIdOrUserId
    }

    return this._payOrder(orderId, userId)
  }

  private async _payOrder(orderId: number, userId: number): Promise<PayOrderResult> {
    const order = paymentRepository.findById(orderId)

    if (!order) {
      return {
        success: false,
        error: '订单不存在',
      }
    }

    if (order.userId !== userId) {
      return {
        success: false,
        error: '无权操作该订单',
      }
    }

    if (order.status !== 'pending') {
      return {
        success: false,
        error: '订单状态异常，无法支付',
      }
    }

    const user = userRepository.findById(userId)
    if (!user) {
      return {
        success: false,
        error: '用户不存在',
      }
    }

    paymentRepository.markAsPaid(order.id)

    this.updateTripleEndpointsAsync(order, user)

    const updatedOrder = paymentRepository.findById(order.id)

    return {
      success: true,
      order: updatedOrder,
    }
  }

  private async updateTripleEndpointsAsync(order: PaymentOrder, user: { name: string; idCard: string }): Promise<void> {
    setTimeout(async () => {
      try {
        const invoiceResult = await goldenTaxService.issueInvoice({
          orderNo: order.orderNo,
          userId: order.userId,
          insuranceType: order.insuranceType,
          payYear: order.payYear,
          amount: order.amount,
          payerName: user.name,
          payerIdCard: user.idCard,
        })

        if (invoiceResult.success && invoiceResult.invoiceNo) {
          paymentRepository.updateTaxInvoiceStatus(order.id, 'issued')
        } else {
          paymentRepository.updateTaxInvoiceStatus(order.id, 'failed')
        }
      } catch (error) {
        paymentRepository.updateTaxInvoiceStatus(order.id, 'failed')
      }
    }, 1000 + Math.random() * 2000)

    setTimeout(() => {
      try {
        const success = Math.random() > 0.05
        paymentRepository.updateFinanceStatus(order.id, success ? 'warehoused' : 'failed')
      } catch (error) {
        paymentRepository.updateFinanceStatus(order.id, 'failed')
      }
    }, 1500 + Math.random() * 2500)

    setTimeout(() => {
      try {
        const success = Math.random() > 0.05
        paymentRepository.updateMedicalCreditStatus(order.id, success ? 'credited' : 'failed')

        if (success && (order.insuranceType === 'medical' || order.insuranceType === 'flexible_medical')) {
          const insurance = insuranceRepository.findByUserIdAndType(order.userId, order.insuranceType)
          if (insurance) {
            insuranceRepository.addMonths(insurance.id, 12)
            insuranceRepository.updatePersonalAccount(insurance.id, insurance.personalAccount + order.amount * 0.3)
          }
        }
      } catch (error) {
        paymentRepository.updateMedicalCreditStatus(order.id, 'failed')
      }
    }, 2000 + Math.random() * 3000)
  }

  getOrderStatus(userId: number, orderId: number): OrderStatusResult
  getOrderStatus(orderId: number): OrderStatusResult
  getOrderStatus(
    userIdOrOrderId: number,
    orderId?: number): OrderStatusResult {
    const id = orderId !== undefined ? orderId : userIdOrOrderId

    const order = paymentRepository.findById(id)

    if (!order) {
      return {
        success: false,
        error: '订单不存在',
      }
    }

    const allSynced =
      order.taxInvoiceStatus === 'issued' &&
      order.financeStatus === 'warehoused' &&
      order.medicalCreditStatus === 'credited'

    return {
      success: true,
      order,
      allSynced,
      syncStatus: {
        taxInvoice: order.taxInvoiceStatus,
        finance: order.financeStatus,
        medicalCredit: order.medicalCreditStatus,
      },
    }
  }

  getUserOrders(userId: number, status?: string, page = 1, pageSize = 10): UserOrdersResult {
    let result: PaginationResult<PaymentOrder>

    if (status) {
      result = paymentRepository.findByUserIdAndStatus(userId, status, { page, pageSize })
    } else {
      result = paymentRepository.findByUserId(userId, { page, pageSize })
    }

    return {
      success: true,
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }
  }
}

const paymentService = PaymentService.getInstance()

export default paymentService
export { PaymentService, type CreateOrderRequest, type CreateOrderParams, type CreateOrderResult, type PayOrderResult, type OrderStatusResult, type UserOrdersResult }
