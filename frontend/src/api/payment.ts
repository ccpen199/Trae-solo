import { get, post } from './http'

export interface PaymentParams {
  orderId: number
  paymentMethod: 'wechat' | 'alipay' | 'balance' | 'card'
}

export function createPaymentApi(data: PaymentParams) {
  return post(`/orders/${data.orderId}/pay`, { payMethod: data.paymentMethod })
}

export function getPaymentStatusApi(paymentId: number) {
  return get(`/payments/${paymentId}/status`)
}

export function getPaymentMethodsApi() {
  return Promise.resolve({
    code: 200,
    message: 'success',
    data: [
      { code: 'wechat', name: '微信支付', enabled: true },
      { code: 'alipay', name: '支付宝', enabled: true },
      { code: 'balance', name: '余额支付', enabled: true },
      { code: 'card', name: '银行卡', enabled: true }
    ]
  })
}
