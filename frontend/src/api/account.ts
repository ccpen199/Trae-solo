import request from '@/utils/request'

export function getBalance() {
  return request({
    url: '/account/balance',
    method: 'get'
  })
}

export function recharge(amount: number) {
  return request({
    url: '/account/recharge',
    method: 'post',
    data: { amount }
  })
}

export function withdraw(amount: number) {
  return request({
    url: '/account/withdraw',
    method: 'post',
    data: { amount }
  })
}

export function getTransactions(params?: { type?: string; page?: number; pageSize?: number }) {
  return request({
    url: '/account/transactions',
    method: 'get',
    params
  })
}

export function getInvestments(params?: { status?: string; page?: number; pageSize?: number }) {
  return request({
    url: '/account/investments',
    method: 'get',
    params
  })
}

export function getRepaymentPlans() {
  return request({
    url: '/account/repayment-plans',
    method: 'get'
  })
}
