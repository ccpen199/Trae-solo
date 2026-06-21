import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type SettlementBatch, type SettlementDetail, type SettlementStatus, type CycleType } from '../mock/data.js'
import { genBatchNo, genOrderNo } from '../mock/data.js'
import { calculateSettlement, generateSettlementBatch } from '../services/settlementEngine.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

function getOrderName(orderId: string): string | undefined {
  const o = db.orders.find(x => x.id === orderId)
  return o?.orderNo || o?.title
}

function getUserName(userId?: string): string | undefined {
  const u = db.users.find(x => x.id === userId)
  return u?.realName || u?.nickname
}

router.post('/batch/generate', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin' && user.role !== 'finance') {
    fail(res, '无权限生成结算批次', 403, 403)
    return
  }

  const { cycleType = 'monthly_1', startDate, endDate, driverIds } = req.body as {
    cycleType?: CycleType; startDate?: string; endDate?: string; driverIds?: string[]
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  let actualStartDate: Date
  let actualEndDate: Date

  if (startDate && endDate) {
    actualStartDate = new Date(startDate)
    actualEndDate = new Date(endDate)
  } else {
    if (cycleType === 'monthly_1') {
      actualStartDate = new Date(year, month - 1, 21, 0, 0, 0)
      actualEndDate = new Date(year, month, 1, 0, 0, 0)
    } else if (cycleType === 'monthly_11') {
      actualStartDate = new Date(year, month, 1, 0, 0, 0)
      actualEndDate = new Date(year, month, 11, 0, 0, 0)
    } else {
      actualStartDate = new Date(year, month, 11, 0, 0, 0)
      actualEndDate = new Date(year, month, 21, 0, 0, 0)
    }
  }

  const completedOrders = db.orders.filter(o => {
    if (o.status !== 'completed') return false
    const completedAt = new Date(o.completedAt || o.arrivedAt || Date.now())
    if (completedAt < actualStartDate || completedAt >= actualEndDate) return false
    if (!o.driverId) return false
    if (driverIds?.length && !driverIds.includes(o.driverId)) return false
    const alreadySettled = db.settlementDetails.some(d => d.orderId === o.id && d.status !== 'failed')
    return !alreadySettled
  })

  if (!completedOrders.length) {
    fail(res, '未找到可结算的已完成运单')
    return
  }

  const result = generateSettlementBatch(completedOrders, db.users, db.driverProfiles, db.shipperProfiles, db.prepayOrders, {
    cycleType,
    startDate: actualStartDate.toISOString(),
    endDate: actualEndDate.toISOString(),
  })

  const batchId = uuidv4()
  const batchNo = genBatchNo(cycleType)
  const nowIso = now.toISOString()
  const status: SettlementStatus = 'pending'

  const batch: SettlementBatch = {
    id: batchId,
    batchNo,
    cycleType,
    periodStart: actualStartDate.toISOString(),
    periodEnd: actualEndDate.toISOString(),
    totalAmount: result.totalBatchAmount,
    totalCount: result.details.length,
    totalPrepay: result.totalPrepay,
    totalFuelCost: result.totalFuelCost,
    totalEtc: result.totalEtc,
    totalFee: result.totalFee,
    totalPlatformFee: result.totalPlatformFee,
    status,
    generatedBy: user.id,
    generatedAt: nowIso,
  }
  db.settlementBatches.push(batch)

  result.details.forEach(d => {
    const detail: SettlementDetail = {
      id: uuidv4(),
      batchId,
      orderId: d.orderId,
      driverId: d.driverId,
      shipperId: d.shipperId,
      freightAmount: d.freightAmount,
      fuelCost: d.fuelCost,
      etcCost: d.etcCost,
      insuranceCost: d.insuranceCost,
      prepayDeducted: d.prepayDeducted,
      platformFee: d.platformFee,
      netAmount: d.netAmount,
      status: 'pending',
      settlementCalc: d,
      createdAt: nowIso,
    }
    db.settlementDetails.push(detail)
  })

  success(res, {
    batchId: batch.id,
    batchNo,
    status,
    cycleType,
    periodStart: actualStartDate.toISOString(),
    periodEnd: actualEndDate.toISOString(),
    totalCount: result.details.length,
    totalAmount: result.totalBatchAmount,
    totalPrepay: result.totalPrepay,
    totalPlatformFee: result.totalPlatformFee,
  }, `结算批次生成成功，共${result.details.length}笔运单`)
})

router.get('/batch', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const params = parsePagination(req.query as Record<string, unknown>)
  const { status, cycleType, startDate, endDate } = req.query

  let list = [...db.settlementBatches]

  if (user.role !== 'admin' && user.role !== 'finance') {
    const myDriverDetailIds = db.settlementDetails
      .filter(d => d.driverId === user.id)
      .map(d => d.batchId)
    const myShipperDetailIds = db.settlementDetails
      .filter(d => d.shipperId === user.id)
      .map(d => d.batchId)
    const relatedBatchIds = [...new Set([...myDriverDetailIds, ...myShipperDetailIds])]
    list = list.filter(b => relatedBatchIds.includes(b.id))
  }

  if (status) {
    const statusList = (status as string).split(',').filter(Boolean) as SettlementStatus[]
    list = list.filter(b => statusList.includes(b.status))
  }
  if (cycleType) {
    list = list.filter(b => b.cycleType === cycleType)
  }
  if (startDate) {
    const d = new Date(startDate as string).getTime()
    list = list.filter(b => new Date(b.periodStart).getTime() >= d)
  }
  if (endDate) {
    const d = new Date(endDate as string).getTime()
    list = list.filter(b => new Date(b.periodEnd).getTime() <= d)
  }

  list.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(b => ({
      ...b,
      generatedByName: getUserName(b.generatedBy),
      confirmedByName: b.confirmedBy ? getUserName(b.confirmedBy) : undefined,
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
  })
})

router.get('/batch/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const batch = db.settlementBatches.find(b => b.id === id || b.batchNo === id)
  if (!batch) {
    notFound(res, '结算批次不存在')
    return
  }

  const user = req.user!
  const details = db.settlementDetails.filter(d => d.batchId === batch.id)
  const relatedIds = new Set(details.flatMap(d => [d.driverId, d.shipperId]))

  if (user.role !== 'admin' && user.role !== 'finance' && !relatedIds.has(user.id)) {
    fail(res, '无权限查看此结算批次', 403, 403)
    return
  }

  const pendingCount = details.filter(d => d.status === 'pending').length
  const successCount = details.filter(d => d.status === 'settled').length
  const failedCount = details.filter(d => d.status === 'failed').length

  success(res, {
    batch: {
      ...batch,
      generatedByName: getUserName(batch.generatedBy),
      confirmedByName: batch.confirmedBy ? getUserName(batch.confirmedBy) : undefined,
    },
    detailCounts: {
      total: details.length,
      pending: pendingCount,
      success: successCount,
      failed: failedCount,
    },
  })
})

router.get('/batch/:id/details', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const batch = db.settlementBatches.find(b => b.id === id || b.batchNo === id)
  if (!batch) {
    notFound(res, '结算批次不存在')
    return
  }

  const user = req.user!
  const params = parsePagination(req.query as Record<string, unknown>)
  const { status } = req.query

  let list = db.settlementDetails.filter(d => d.batchId === batch.id)
  const relatedIds = new Set(list.flatMap(d => [d.driverId, d.shipperId]))

  if (user.role !== 'admin' && user.role !== 'finance' && !relatedIds.has(user.id)) {
    fail(res, '无权限查看结算明细', 403, 403)
    return
  }

  if (status) {
    list = list.filter(d => d.status === status)
  }
  if (user.role === 'driver') {
    list = list.filter(d => d.driverId === user.id)
  } else if (user.role === 'shipper') {
    list = list.filter(d => d.shipperId === user.id)
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(d => ({
      ...d,
      orderNo: getOrderName(d.orderId),
      driverName: getUserName(d.driverId),
      shipperName: getUserName(d.shipperId),
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    summary: {
      totalFreightAmount: list.reduce((s, d) => s + d.freightAmount, 0),
      totalPrepayDeducted: list.reduce((s, d) => s + d.prepayDeducted, 0),
      totalFuelCost: list.reduce((s, d) => s + d.fuelCost, 0),
      totalPlatformFee: list.reduce((s, d) => s + d.platformFee, 0),
      totalNetAmount: list.reduce((s, d) => s + d.netAmount, 0),
    },
  })
})

router.post('/batch/:id/confirm', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin' && user.role !== 'finance') {
    fail(res, '无权限确认结算批次', 403, 403)
    return
  }

  const { id } = req.params
  const batch = db.settlementBatches.find(b => b.id === id || b.batchNo === id)
  if (!batch) {
    notFound(res, '结算批次不存在')
    return
  }
  if (batch.status !== 'pending') {
    fail(res, `批次状态${batch.status}不可确认`)
    return
  }

  const nowIso = new Date().toISOString()
  const details = db.settlementDetails.filter(d => d.batchId === batch.id)

  batch.status = 'settled'
  batch.confirmedBy = user.id
  batch.confirmedAt = nowIso

  details.forEach(d => {
    d.status = 'settled'
    d.settledAt = nowIso

    const wallet = db.wallets.find(w => w.userId === d.driverId)
    if (wallet && d.netAmount > 0) {
      wallet.balance += d.netAmount
      wallet.totalIncome += d.netAmount
      wallet.lastUpdatedAt = nowIso
      db.transactions.push({
        id: uuidv4(),
        walletId: wallet.id,
        userId: wallet.userId,
        type: 'settlement',
        amount: d.netAmount,
        balanceAfter: wallet.balance,
        relatedOrderId: d.orderId,
        remark: `结算批次 ${batch.batchNo}`,
        createdAt: nowIso,
      })
    }
  })

  success(res, {
    batchId: batch.id,
    batchNo: batch.batchNo,
    status: batch.status,
    confirmedCount: details.length,
    confirmedAt: nowIso,
  }, `结算批次确认成功，共${details.length}笔`)
})

export default router
