import { httpServer, io } from './app.js'
import cron from 'node-cron'
import { verifyToken } from './utils/auth.js'
import { db, type CycleType } from './mock/data.js'
import { genBatchNo } from './mock/data.js'
import { v4 as uuidv4 } from './utils/uuid.js'

const PORT = 3001

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || (socket.handshake.query?.token as string)
  if (!token) {
    return next(new Error('未授权'))
  }
  const payload = verifyToken(token)
  if (!payload) {
    return next(new Error('token 无效'))
  }
  ;(socket as unknown as { userId?: string; role?: string }).userId = payload.userId
  ;(socket as unknown as { userId?: string; role?: string }).role = payload.role
  next()
})

io.on('connection', (socket) => {
  const userId = (socket as unknown as { userId?: string }).userId
  const role = (socket as unknown as { role?: string }).role

  console.log(`[SOCKET] Connected: userId=${userId}, role=${role}, sid=${socket.id}`)

  socket.join(`user:${userId}`)
  socket.join(`role:${role}`)

  socket.on('track:subscribe', (data: { orderId?: string }) => {
    if (data.orderId) {
      socket.join(`track:subscribe:${data.orderId}`)
      console.log(`[SOCKET] ${socket.id} subscribed to track:subscribe:${data.orderId}`)
    }
  })

  socket.on('track:unsubscribe', (data: { orderId?: string }) => {
    if (data.orderId) {
      socket.leave(`track:subscribe:${data.orderId}`)
    }
  })

  socket.on('track:report', (data: { orderId: string; points: unknown[] }) => {
    if (!data.orderId || !Array.isArray(data.points) || data.points.length === 0) {
      socket.emit('track:error', { message: '参数无效' })
      return
    }
    io.to(`track:subscribe:${data.orderId}`).emit(`track:subscribe:${data.orderId}`, {
      orderId: data.orderId,
      points: data.points,
      latest: data.points[data.points.length - 1],
    })
    io.to(`role:admin`).emit('track:live', {
      orderId: data.orderId,
      count: data.points.length,
      latest: data.points[data.points.length - 1],
    })
    socket.emit('track:ack', { received: data.points.length, orderId: data.orderId })
  })

  socket.on('alert:notify', (alertData) => {
    io.to(`role:admin`).emit('admin:alert', alertData)
    if (alertData?.orderId) {
      io.to(`track:subscribe:${alertData.orderId}`).emit('order:alert', alertData)
    }
  })

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Disconnected: userId=${userId}, sid=${socket.id}`)
  })
})

function triggerSettlement(cycleType: CycleType) {
  console.log(`[CRON] 触发结算批次生成: cycleType=${cycleType} at ${new Date().toISOString()}`)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  let sDay: number, eDay: number, sMonth = month, eMonth = month

  if (cycleType === 'monthly_1') {
    sDay = 21; eDay = 1
    sMonth = month - 1
    if (sMonth < 0) sMonth = 11
  } else if (cycleType === 'monthly_11') {
    sDay = 1; eDay = 11
  } else {
    sDay = 11; eDay = 21
  }

  const sYear = sMonth > month ? year - 1 : year
  const startDate = `${sYear}-${String(sMonth + 1).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`
  const endDate = `${year}-${String(eMonth + 1).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`

  const existing = db.settlementBatches.find(b =>
    b.cycleStartDate.substring(0, 10) === startDate && b.cycleEndDate.substring(0, 10) === endDate
  )
  if (existing) {
    console.log(`[CRON] 批次已存在, 跳过: ${existing.batchNo}`)
    return
  }

  const sd = new Date(startDate + 'T00:00:00Z').getTime()
  const ed = new Date(endDate + 'T23:59:59Z').getTime()

  const settleableOrders = db.orders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false
    const ct = new Date(o.completedAt).getTime()
    if (ct < sd || ct >= ed) return false
    return !db.settlementDetails.some(d => d.orderId === o.id)
  })

  const batchId = uuidv4()
  let totalFreight = 0, totalFuel = 0, totalEtc = 0, totalPrepay = 0, totalNet = 0

  settleableOrders.forEach(order => {
    const driver = db.users.find(u => u.id === order.driverId)
    const shipper = db.users.find(u => u.id === order.shipperId)
    const freight = order.freightAmount
    const fuel = parseFloat((freight * 0.25).toFixed(2))
    const etc = parseFloat((order.distanceKm * 0.6).toFixed(2))
    const prepayOrder = db.prepayOrders.find(p => p.orderId === order.id && p.disbursedAmount > 0)
    const prepay = prepayOrder?.disbursedAmount || 0
    const insurance = order.insuranceAmount || 0
    const platform = parseFloat((freight * 0.02).toFixed(2))
    const net = parseFloat((freight - fuel - etc - prepay - insurance - platform).toFixed(2))

    totalFreight += freight
    totalFuel += fuel
    totalEtc += etc
    totalPrepay += prepay
    totalNet += net

    db.settlementDetails.push({
      id: uuidv4(),
      batchId,
      orderId: order.id,
      orderNo: order.orderNo,
      driverId: order.driverId || '',
      driverName: driver?.realName || driver?.nickname || '',
      shipperId: order.shipperId,
      shipperName: shipper?.realName || shipper?.nickname || '',
      freightAmount: freight,
      fuelAmount: fuel,
      etcAmount: etc,
      prepayDeduction: prepay,
      insuranceAmount: insurance,
      platformFee: platform,
      netAmount: net,
    })
  })

  db.settlementBatches.push({
    id: batchId,
    batchNo: genBatchNo(cycleType),
    cycle: 'monthly',
    cycleStartDate: new Date(startDate).toISOString(),
    cycleEndDate: new Date(endDate).toISOString(),
    status: settleableOrders.length > 0 ? 'processing' : 'draft',
    totalOrders: settleableOrders.length,
    totalFreightAmount: parseFloat(totalFreight.toFixed(2)),
    totalFuelAmount: parseFloat(totalFuel.toFixed(2)),
    totalEtcAmount: parseFloat(totalEtc.toFixed(2)),
    totalPrepayDeduction: parseFloat(totalPrepay.toFixed(2)),
    totalNetAmount: parseFloat(totalNet.toFixed(2)),
    generatedAt: new Date().toISOString(),
    processedBy: 'system-cron',
  })

  console.log(`[CRON] 批次生成完成: batchId=${batchId}, totalOrders=${settleableOrders.length}, totalNet=${parseFloat(totalNet.toFixed(2))}`)

  io?.to('role:admin')?.emit('settlement:batch-created', {
    batchId,
    cycleType,
    totalOrders: settleableOrders.length,
    totalNetAmount: parseFloat(totalNet.toFixed(2)),
  })
}

const tasks: { schedule: string; name: string; cycleType: CycleType }[] = [
  { schedule: '0 2 1 * *', name: 'Settlement Monthly 1st', cycleType: 'monthly_1' },
  { schedule: '0 2 11 * *', name: 'Settlement Monthly 11th', cycleType: 'monthly_11' },
  { schedule: '0 2 21 * *', name: 'Settlement Monthly 21st', cycleType: 'monthly_21' },
]

tasks.forEach(task => {
  const job = cron.schedule(task.schedule, () => triggerSettlement(task.cycleType), {
    scheduled: true,
    timezone: 'Asia/Shanghai',
  })
  console.log(`[CRON] Scheduled: ${task.name} -> ${task.schedule}`)
})

const server = httpServer.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(`  🚀 Freight Platform Server Ready`)
  console.log(`  📡 HTTP Port:   ${PORT}`)
  console.log(`  🔌 WS Path:     /socket.io`)
  console.log(`  🕒 Timezone:    Asia/Shanghai`)
  console.log(`  📅 Cron Jobs:   1/11/21日 02:00 结算`)
  console.log(`========================================\n`)
  console.log(`[API] POST   /api/v1/auth/login              登录(验证码: 000000/123456)`)
  console.log(`[API] GET    /api/v1/health                  健康检查`)
  console.log(`[API] GET    /api/v1/orders                  运单列表`)
  console.log(`[API] GET    /api/v1/matching/recommend/orders  推荐运单`)
  console.log(`[API] GET    /api/v1/fund/wallet             钱包信息`)
  console.log(`[API] GET    /api/v1/stations/nearby         附近油站`)
  console.log(`[API] GET    /api/v1/admin/dashboard/kpi     数据驾驶舱`)
  console.log(``)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('HTTP server closed')
    cron.getTasks().forEach(task => task.stop())
    console.log('Cron tasks stopped')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received (Ctrl+C)')
  server.close(() => {
    console.log('HTTP server closed')
    cron.getTasks().forEach(task => task.stop())
    console.log('Cron tasks stopped')
    process.exit(0)
  })
})

export { httpServer, io, triggerSettlement }
export default httpServer
