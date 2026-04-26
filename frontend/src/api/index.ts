import { request } from '@/utils/request'
import type { QualityLevel, Notification, AuditLog, PageResult, VirtualAccount } from '@/types'

export const qualityApi = {
  calculatePriceAdjustment(
    subOrderId: string,
    gradePrices: Array<{
      level: QualityLevel
      weight: number
      price?: number
    }>
  ) {
    return request.post('/engine/price-adjustment/calculate', {
      subOrderId,
      gradePrices,
    })
  },

  executePriceAdjustment(
    subOrderId: string,
    gradePrices: Array<{
      level: QualityLevel
      weight: number
      price?: number
    }>,
    remark?: string
  ) {
    return request.post('/engine/price-adjustment/execute', {
      subOrderId,
      gradePrices,
      remark,
    })
  },
}

export const coldChainApi = {
  getOrderStatus(orderId: string) {
    return request.get(`/engine/cold-chain/orders/${orderId}/status`)
  },

  calculateCompensation(exceptionId: string) {
    return request.post(`/engine/cold-chain/exceptions/${exceptionId}/calculate`)
  },

  executeCompensation(exceptionId: string, compensationAmount?: number, remark?: string) {
    return request.post('/engine/cold-chain/exceptions/compensate', {
      exceptionId,
      compensationAmount,
      remark,
    })
  },
}

export const clearingApi = {
  checkWeightTolerance(orderId: string) {
    return request.get(`/engine/clearing/orders/${orderId}/tolerance-check`)
  },

  calculateClearing(orderId: string) {
    return request.get(`/engine/clearing/orders/${orderId}/calculate`)
  },

  executeSettlement(
    orderId: string,
    items: Array<{
      subOrderId: string
      amount: number
      taxAmount: number
      taxRate: number
    }>,
    remark?: string
  ) {
    return request.post('/engine/clearing/settle', {
      orderId,
      items,
      remark,
    })
  },

  processOverdueOrder(orderId: string) {
    return request.post(`/engine/clearing/orders/${orderId}/process-overdue`)
  },
}

export const auditApi = {
  getOrderTraceability(orderId: string) {
    return request.get(`/audit/orders/${orderId}/traceability`)
  },

  getEntityLogs(entityType: string, entityId: string, page = 1, pageSize = 20) {
    return request.get(`/audit/entity/${entityType}/${entityId}`, {
      params: { page, pageSize },
    })
  },

  getMyLogs(page = 1, pageSize = 20): Promise<PageResult<AuditLog>> {
    return request.get('/audit/my-logs', { params: { page, pageSize } })
  },
}

export const notificationApi = {
  getList(page = 1, pageSize = 20): Promise<PageResult<Notification>> {
    return request.get('/notifications', { params: { page, pageSize } })
  },

  getUnreadCount(): Promise<number> {
    return request.get('/notifications/unread-count')
  },

  markAsRead(id: string): Promise<void> {
    return request.put(`/notifications/${id}/read`)
  },

  markAllAsRead(): Promise<void> {
    return request.put('/notifications/read-all')
  },
}

export const accountApi = {
  getMyAccount(): Promise<VirtualAccount> {
    return request.get('/accounts/me')
  },

  recharge(amount: number): Promise<void> {
    return request.post('/accounts/recharge', { amount })
  },

  withdraw(amount: number): Promise<void> {
    return request.post('/accounts/withdraw', { amount })
  },

  getTransactions(page = 1, pageSize = 20) {
    return request.get('/accounts/transactions', { params: { page, pageSize } })
  },
}
