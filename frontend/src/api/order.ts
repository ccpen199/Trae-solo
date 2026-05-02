import request from '@/utils/request'
import type { ApiResponse, PageData } from '@/utils/request'

export interface Order {
  id: number
  orderNo: string
  platformOrderNo: string
  storeId: number
  merchantId: number
  platformType: number
  platformTypeName: string
  orderStatus: number
  orderStatusName: string
  receiveType: number
  customerName: string
  customerPhone: string
  deliveryAddress: string
  orderAmount: number
  goodsAmount: number
  deliveryFee: number
  packageFee: number
  discountAmount: number
  paidAmount: number
  orderRemark: string
  printed: number
  printCount: number
  hasAfterSale: number
  createTime: string
  receiveTime: string
  prepareStartTime: string
  prepareEndTime: string
  riderTakeTime: string
  deliveryStartTime: string
  deliveryEndTime: string
  completeTime: string
}

export interface OrderDetail extends Order {
  details: OrderItem[]
  statusHistory: StatusLog[]
  auditTrail: AuditLog[]
}

export interface OrderItem {
  id: number
  platformGoodsId: number
  platformGoodsName: string
  platformSpecName: string
  mappedGoodsId: number
  mappedGoodsName: string
  mappedSpecName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  goodsRemark: string
  matchType: number
  matchRule: string
}

export interface StatusLog {
  id: number
  orderId: number
  fromStatus: number
  fromStatusName: string
  toStatus: number
  toStatusName: string
  eventCode: string
  eventName: string
  sourceType: string
  sourceName: string
  operatorId: number
  operatorName: string
  reason: string
  createTime: string
}

export interface AuditLog {
  id: number
  traceId: string
  businessType: string
  businessId: number
  businessNo: string
  sourceType: string
  sourceName: string
  operatorId: number
  operatorName: string
  operatorRole: string
  action: string
  actionName: string
  fromStatus: number
  fromStatusName: string
  toStatus: number
  toStatusName: string
  detail: string
  operateTime: string
  extInfo: string
}

export function getOrderList(params: {
  storeId?: number
  status?: number
  page: number
  size: number
  startDate?: string
  endDate?: string
  keyword?: string
}): Promise<ApiResponse<PageData<Order>>> {
  return request.get('/api/order/list', { params })
}

export function getOrderDetail(id: number): Promise<ApiResponse<OrderDetail>> {
  return request.get(`/api/order/${id}`)
}

export function getOrderByNo(orderNo: string): Promise<ApiResponse<OrderDetail>> {
  return request.get(`/api/order/by-no/${orderNo}`)
}

export function receiveOrder(id: number, type: 'auto' | 'manual'): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/receive`, { type })
}

export function cancelOrder(id: number, reason: string): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/cancel`, { reason })
}

export function completeOrder(id: number): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/complete`)
}

export function startPrepare(id: number): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/start-prepare`)
}

export function finishPrepare(id: number): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/finish-prepare`)
}

export function riderTakeOrder(id: number): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/rider-take`)
}

export function startDelivery(id: number): Promise<ApiResponse<null>> {
  return request.post(`/api/order/${id}/start-delivery`)
}
