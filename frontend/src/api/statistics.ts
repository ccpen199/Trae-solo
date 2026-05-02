import request from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

export interface StatisticsOverview {
  todayOrderCount: number
  todayValidOrderCount: number
  todayTotalAmount: number
  todayValidAmount: number
  todayCancelCount: number
  todayRefundCount: number
  todayCancelRate: number
  todayRefundRate: number
  todayReceiveRate: number
  todayAutoReceiveCount: number
  todayManualReceiveCount: number
  todayPrintCount: number
  todayAvgDeliveryTime: number
  todayAvgPrepareTime: number
  yesterdayOrderCount: number
  yesterdayValidAmount: number
  weekOrderCount: number
  weekValidAmount: number
  weekCancelRate: number
  monthOrderCount: number
  monthValidAmount: number
  monthCancelRate: number
  calculationBasis: string
}

export interface DailyStatistics {
  id: number
  storeId: number
  merchantId: number
  statisticsDate: string
  orderCount: number
  validOrderCount: number
  cancelOrderCount: number
  refundOrderCount: number
  totalAmount: number
  validAmount: number
  cancelAmount: number
  refundAmount: number
  receiveCount: number
  autoReceiveCount: number
  manualReceiveCount: number
  printCount: number
  avgDeliveryTime: number
  avgPrepareTime: number
}

export interface GoodsSalesStat {
  id: number
  storeId: number
  merchantId: number
  goodsId: number
  goodsName: string
  specId: number
  specName: string
  statisticsDate: string
  salesQuantity: number
  salesAmount: number
  refundQuantity: number
  refundAmount: number
}

export function getStatisticsOverview(storeId?: number, date?: string): Promise<ApiResponse<StatisticsOverview>> {
  return request.get('/api/statistics/overview', { params: { storeId, date } })
}

export function getDailyStatistics(params: {
  storeId?: number
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}): Promise<ApiResponse<any>> {
  return request.get('/api/statistics/daily', { params })
}

export function getGoodsSalesStatistics(params: {
  storeId?: number
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}): Promise<ApiResponse<any>> {
  return request.get('/api/statistics/goods-sales', { params })
}

export function calculateDailyStatistics(storeId: number, date: string): Promise<ApiResponse<DailyStatistics>> {
  return request.post('/api/statistics/calculate', { storeId, date })
}
