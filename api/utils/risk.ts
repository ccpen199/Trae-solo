import { db } from '../mock/data.js'

export interface RiskResult {
  riskScore: number
  maxPrepayRatio: number
  autoApprove: boolean
  needReview: boolean
  reject: boolean
  suggestion: string
}

export function evaluatePrepayRisk(driverId: string, shipperId: string, orderPrice: number): RiskResult {
  const driver = db.users.find(u => u.id === driverId)
  const shipper = db.users.find(u => u.id === shipperId)

  if (!driver || !shipper) {
    return {
      riskScore: 0,
      maxPrepayRatio: 0,
      autoApprove: false,
      needReview: false,
      reject: true,
      suggestion: '用户信息不存在',
    }
  }

  const driverCredit = driver.creditScore
  const shipperCredit = shipper.creditScore

  const driverTotalOrders = db.orders.filter(o => o.driverId === driverId).length
  const driverCompletedOrders = db.orders.filter(o => o.driverId === driverId && o.status === 'completed').length
  const driverCompletionRate = driverTotalOrders > 0 ? driverCompletedOrders / driverTotalOrders : 0.5

  const creditNorm = Math.min(1, Math.max(0, (driverCredit - 300) / 600))
  const completionNorm = driverCompletionRate

  const priceRisk = orderPrice > 15000 ? 0.7 : orderPrice > 8000 ? 0.85 : 1

  const riskScore = Math.round(
    40 * creditNorm +
    30 * completionNorm +
    20 * priceRisk +
    10 * Math.min(1, (shipperCredit - 300) / 600),
  )

  if (riskScore >= 80) {
    return {
      riskScore,
      maxPrepayRatio: 0.5,
      autoApprove: true,
      needReview: false,
      reject: false,
      suggestion: '高信用司机，自动审批50%预付',
    }
  } else if (riskScore >= 60) {
    return {
      riskScore,
      maxPrepayRatio: 0.3,
      autoApprove: false,
      needReview: true,
      reject: false,
      suggestion: '中等风险，建议人工复核后最高审批30%预付',
    }
  } else {
    return {
      riskScore,
      maxPrepayRatio: 0,
      autoApprove: false,
      needReview: true,
      reject: true,
      suggestion: '风险过高，建议拒绝预支申请',
    }
  }
}
