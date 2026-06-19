import { get, post } from './api'

export interface CreateAlipayOrderParams {
  amount: number
  rechargeId?: string
}

export interface CreateAlipayOrderResponse {
  orderId: string
  payUrl: string
  amount: number
  bonus: number
}

export interface TransactionItem {
  id: string
  orderNo: string
  deviceId: string
  deviceName: string
  temperature: 'cold' | 'warm' | 'hot'
  volume: number
  amount: number
  avgTemp: number
  pricePerLiter: number
  startTime: string
  endTime: string
  status: 'success' | 'failed' | 'processing'
}

export interface TransactionDetail {
  id: string
  orderNo: string
  deviceId: string
  deviceName: string
  deviceLocation: string
  temperature: 'cold' | 'warm' | 'hot'
  temperatureName: string
  volume: number
  amount: number
  avgTemp: number
  pricePerLiter: number
  startTime: string
  endTime: string
  duration: number
  feeDetails: {
    item: string
    value: string
  }[]
  electronicSignature: string
  signatureTime: string
}

export interface RechargeOption {
  id: string
  amount: number
  bonus: number
  popular?: boolean
}

export const paymentApi = {
  getRechargeOptions: () => get<RechargeOption[]>('/api/v1/payment/recharge-options'),

  createAlipayOrder: (params: CreateAlipayOrderParams) =>
    post<CreateAlipayOrderResponse>('/api/v1/payment/alipay/create', params),

  queryPayStatus: (orderId: string) =>
    get<{ status: 'pending' | 'success' | 'failed' }>(`/api/v1/payment/status/${orderId}`),

  getTransactions: (params?: { page?: number; pageSize?: number; month?: string }) =>
    get<{
      list: TransactionItem[]
      total: number
      page: number
      pageSize: number
      monthlyStats: {
        totalVolume: number
        totalAmount: number
        cumulativeVolume: number
      }
    }>('/api/v1/transaction/', params),

  getBillDetail: (id: string) =>
    get<TransactionDetail>(`/api/v1/transaction/bill/${id}`)
}
