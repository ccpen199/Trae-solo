const express = require('express')
const prisma = require('../lib/prisma')
const { successResponse, paginateResponse, AppError, generateAlarmNo } = require('../utils/response')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)
router.use(roleMiddleware('STATION_OPERATOR', 'ADMIN'))

router.get('/overview', async (req, res, next) => {
  try {
    const stationId = req.user.stationId

    if (!stationId) {
      throw new AppError('未绑定场站', 400)
    }

    const [station, chargers, todayOrders, activeAlarms, todayStats] = await Promise.all([
      prisma.station.findUnique({ where: { id: stationId } }),
      prisma.charger.findMany({ where: { stationId } }),
      prisma.order.count({
        where: {
          stationId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.alarm.count({
        where: {
          stationId,
          status: 'UNHANDLED',
        },
      }),
      prisma.stationStats.findFirst({
        where: {
          stationId,
          statsDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    const statusCounts = chargers.reduce((acc, charger) => {
      acc[charger.status] = (acc[charger.status] || 0) + 1
      return acc
    }, {})

    successResponse(res, {
      station,
      totalChargers: chargers.length,
      statusCounts,
      todayOrders,
      activeAlarms,
      todayRevenue: todayStats?.totalRevenue || 0,
      todayChargingKw: todayStats?.totalChargingKw || 0,
      utilizationRate: todayStats?.utilizationRate || 0,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/chargers', async (req, res, next) => {
  try {
    const { status, type, page = 1, pageSize = 20 } = req.query
    const stationId = req.user.stationId

    const where = { stationId }
    if (status) where.status = status
    if (type) where.type = type

    const [chargers, total] = await Promise.all([
      prisma.charger.findMany({
        where,
        include: {
          currentOrder: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  phone: true,
                },
              },
            },
          },
          alarms: {
            where: { status: 'UNHANDLED' },
            take: 3,
          },
          healthRecords: {
            take: 1,
            orderBy: { checkTime: 'desc' },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.charger.count({ where }),
    ])

    paginateResponse(res, chargers, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.post('/chargers', async (req, res, next) => {
  try {
    const { name, serialNumber, type, maxPower, protocol, ipAddress, firmwareVersion } = req.body
    const stationId = req.user.stationId

    if (!name || !serialNumber || !type || !maxPower) {
      throw new AppError('请填写完整充电桩信息', 400)
    }

    const existing = await prisma.charger.findUnique({ where: { serialNumber } })
    if (existing) {
      throw new AppError('设备序列号已存在', 400)
    }

    const charger = await prisma.charger.create({
      data: {
        stationId,
        name,
        serialNumber,
        type,
        maxPower: parseFloat(maxPower),
        protocol: protocol || 'OCPP1.6',
        ipAddress,
        firmwareVersion,
        status: 'OFFLINE',
      },
    })

    await prisma.station.update({
      where: { id: stationId },
      data: { totalPiles: { increment: 1 } },
    })

    successResponse(res, charger, '充电桩添加成功')
  } catch (error) {
    next(error)
  }
})

router.put('/chargers/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, maxPower, status, protocol, ipAddress, firmwareVersion } = req.body
    const stationId = req.user.stationId

    const charger = await prisma.charger.findUnique({ where: { id } })
    if (!charger) {
      throw new AppError('充电桩不存在', 404)
    }

    if (charger.stationId !== stationId) {
      throw new AppError('无权操作此设备', 403)
    }

    const updated = await prisma.charger.update({
      where: { id },
      data: {
        name,
        maxPower: maxPower ? parseFloat(maxPower) : undefined,
        status,
        protocol,
        ipAddress,
        firmwareVersion,
      },
    })

    successResponse(res, updated, '充电桩更新成功')
  } catch (error) {
    next(error)
  }
})

router.post('/chargers/:id/remote-control', async (req, res, next) => {
  try {
    const { id } = req.params
    const { action, params } = req.body
    const stationId = req.user.stationId

    const charger = await prisma.charger.findUnique({ where: { id } })
    if (!charger || charger.stationId !== stationId) {
      throw new AppError('无权操作此设备', 403)
    }

    let result = { action, timestamp: new Date() }

    switch (action) {
      case 'REBOOT':
        result.message = '设备重启指令已发送'
        break
      case 'STOP_CHARGING':
        if (charger.currentOrderId) {
          await prisma.order.update({
            where: { id: charger.currentOrderId },
            data: { status: 'CANCELLED', endTime: new Date() },
          })
          await prisma.charger.update({
            where: { id },
            data: { status: 'AVAILABLE', currentOrderId: null, currentPower: 0 },
          })
        }
        result.message = '停止充电指令已发送'
        break
      case 'SET_POWER_LIMIT':
        result.message = `功率限制已设置为 ${params?.power}kW`
        break
      case 'UNLOCK':
        result.message = '设备解锁指令已发送'
        break
      default:
        throw new AppError('不支持的操作', 400)
    }

    successResponse(res, result, '操作成功')
  } catch (error) {
    next(error)
  }
})

router.get('/alarms', async (req, res, next) => {
  try {
    const { status, level, page = 1, pageSize = 20 } = req.query
    const stationId = req.user.stationId

    const where = { stationId }
    if (status) where.status = status
    if (level) where.level = level

    const [alarms, total] = await Promise.all([
      prisma.alarm.findMany({
        where,
        include: {
          charger: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.alarm.count({ where }),
    ])

    paginateResponse(res, alarms, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.post('/alarms/:id/handle', async (req, res, next) => {
  try {
    const { id } = req.params
    const { handledNote } = req.body
    const stationId = req.user.stationId

    const alarm = await prisma.alarm.findUnique({ where: { id } })
    if (!alarm || alarm.stationId !== stationId) {
      throw new AppError('无权操作此告警', 403)
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        status: 'HANDLED',
        handledAt: new Date(),
        handledBy: req.user.username,
        handledNote,
      },
    })

    successResponse(res, updated, '告警处理成功')
  } catch (error) {
    next(error)
  }
})

router.post('/alarms/simulate', async (req, res, next) => {
  try {
    const { chargerId, type, level, title, description } = req.body
    const stationId = req.user.stationId

    if (chargerId) {
      const charger = await prisma.charger.findUnique({ where: { id: chargerId } })
      if (!charger || charger.stationId !== stationId) {
        throw new AppError('无权操作此设备', 403)
      }
    }

    const alarm = await prisma.alarm.create({
      data: {
        alarmNo: generateAlarmNo(),
        stationId,
        chargerId,
        type: type || 'OVER_TEMPERATURE',
        level: level || 'WARNING',
        title: title || '设备告警',
        description,
      },
    })

    successResponse(res, alarm, '模拟告警创建成功')
  } catch (error) {
    next(error)
  }
})

router.get('/stats/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    const stationId = req.user.stationId

    const where = { stationId }
    if (startDate) where.statsDate = { gte: new Date(startDate) }
    if (endDate) where.statsDate = { ...where.statsDate, lte: new Date(endDate) }

    const stats = await prisma.stationStats.findMany({
      where,
      orderBy: { statsDate: 'asc' },
      take: 30,
    })

    const summary = stats.reduce(
      (acc, stat) => ({
        totalOrders: acc.totalOrders + stat.totalOrders,
        totalChargingKw: acc.totalChargingKw + stat.totalChargingKw,
        totalRevenue: acc.totalRevenue + stat.totalRevenue,
        avgUtilization: acc.avgUtilization + stat.utilizationRate,
      }),
      { totalOrders: 0, totalChargingKw: 0, totalRevenue: 0, avgUtilization: 0 }
    )

    if (stats.length > 0) {
      summary.avgUtilization = Number((summary.avgUtilization / stats.length).toFixed(2))
    }

    successResponse(res, {
      summary,
      dailyStats: stats,
      hourlyDistribution: [
        { hour: 0, orders: 5, kw: 120 },
        { hour: 6, orders: 15, kw: 280 },
        { hour: 10, orders: 25, kw: 450 },
        { hour: 12, orders: 30, kw: 520 },
        { hour: 14, orders: 22, kw: 380 },
        { hour: 18, orders: 45, kw: 780 },
        { hour: 22, orders: 20, kw: 350 },
      ],
    })
  } catch (error) {
    next(error)
  }
})

router.get('/stats/profile', async (req, res, next) => {
  try {
    const stationId = req.user.stationId

    const [station, recentOrders, stats7d] = await Promise.all([
      prisma.station.findUnique({ where: { id: stationId } }),
      prisma.order.findMany({
        where: { stationId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.stationStats.findMany({
        where: { stationId },
        orderBy: { statsDate: 'desc' },
        take: 7,
      }),
    ])

    const totalDuration = recentOrders.reduce((acc, o) => acc + o.durationSeconds, 0)
    const avgStayMinutes = recentOrders.length > 0 ? totalDuration / recentOrders.length / 60 : 0
    const totalRevenue = recentOrders.reduce((acc, o) => acc + o.totalAmount, 0)
    const avgOrderAmount = recentOrders.length > 0 ? totalRevenue / recentOrders.length : 0

    const peakHours = Array(24).fill(0)
    recentOrders.forEach((order) => {
      if (order.startTime) {
        const hour = new Date(order.startTime).getHours()
        peakHours[hour]++
      }
    })

    let maxPeak = 0
    let peakHourStart = 18
    for (let i = 0; i < 24; i++) {
      const windowSum = peakHours[i] + peakHours[(i + 1) % 24]
      if (windowSum > maxPeak) {
        maxPeak = windowSum
        peakHourStart = i
      }
    }

    const vehicleDistribution = [
      { type: '比亚迪', count: 35, percentage: 35 },
      { type: '特斯拉', count: 25, percentage: 25 },
      { type: '蔚来', count: 15, percentage: 15 },
      { type: '小鹏', count: 12, percentage: 12 },
      { type: '其他', count: 13, percentage: 13 },
    ]

    successResponse(res, {
      stationName: station?.name,
      trafficDensity: Number((recentOrders.length / 7).toFixed(1)),
      avgStayMinutes: Number(avgStayMinutes.toFixed(1)),
      avgOrderAmount: Number(avgOrderAmount.toFixed(2)),
      peakHourStart,
      peakHourEnd: (peakHourStart + 2) % 24,
      vehicleDistribution,
      weeklyStats: stats7d,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/services', async (req, res, next) => {
  try {
    const stationId = req.user.stationId

    const services = [
      { id: 1, type: 'carwash', name: '洗车服务', status: 'OPEN', waitTime: 5, price: 35 },
      { id: 2, type: 'restaurant', name: '便利店/简餐', status: 'OPEN', waitTime: 0, price: null },
      { id: 3, type: 'restroom', name: '卫生间', status: 'OPEN', waitTime: 0, price: null },
      { id: 4, type: 'wifi', name: '免费WiFi', status: 'OPEN', waitTime: 0, price: null },
      { id: 5, type: 'lounge', name: '休息区', status: 'OPEN', waitTime: 0, price: null },
    ]

    successResponse(res, services)
  } catch (error) {
    next(error)
  }
})

module.exports = router
