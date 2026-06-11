const express = require('express')
const prisma = require('../lib/prisma')
const { successResponse, paginateResponse, AppError, generateOrderNo, calculateCarbonReduction } = require('../utils/response')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/stations', async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      city,
      district,
      chargerType,
      minPower,
      status,
      hasAvailable,
      lat,
      lng,
      radius = 5,
    } = req.query

    const where = {}

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { address: { contains: keyword } },
      ]
    }
    if (city) where.city = city
    if (district) where.district = district
    if (status) where.chargers = { some: { status } }
    if (chargerType) where.chargers = { some: { type: chargerType } }
    if (minPower) where.chargers = { some: { maxPower: { gte: parseFloat(minPower) } } }
    if (hasAvailable === 'true') where.availablePiles = { gt: 0 }

    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        include: {
          chargers: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              maxPower: true,
              currentPower: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { rating: 'desc' },
      }),
      prisma.station.count({ where }),
    ])

    const stationsWithDistance = stations.map((station) => {
      let distance = null
      if (lat && lng) {
        const R = 6371
        const dLat = ((parseFloat(lat) - parseFloat(station.latitude)) * Math.PI) / 180
        const dLng = ((parseFloat(lng) - parseFloat(station.longitude)) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((parseFloat(lat) * Math.PI) / 180) *
            Math.cos((parseFloat(station.latitude) * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = Number((R * c).toFixed(2))
      }
      return { ...station, distance }
    })

    if (lat && lng) {
      stationsWithDistance.sort((a, b) => a.distance - b.distance)
    }

    paginateResponse(res, stationsWithDistance, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.get('/stations/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        chargers: {
          include: {
            currentOrder: {
              select: {
                id: true,
                userId: true,
                startTime: true,
                chargedKw: true,
              },
            },
          },
        },
        stationStats: {
          take: 7,
          orderBy: { statsDate: 'desc' },
        },
      },
    })

    if (!station) {
      throw new AppError('充电站不存在', 404)
    }

    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    const reservations = await prisma.reservation.count({
      where: {
        stationId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledStartTime: {
          gte: now,
          lte: oneHourLater,
        },
      },
    })

    const queuePrediction = Math.ceil(reservations / Math.max(station.availablePiles, 1))

    const prices = await prisma.electricityPrice.findMany({
      where: { city: station.city },
    })

    successResponse(res, {
      ...station,
      queuePrediction,
      electricityPrices: prices,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/chargers', async (req, res, next) => {
  try {
    const { stationId, status, type, page = 1, pageSize = 50 } = req.query

    const where = {}
    if (stationId) where.stationId = stationId
    if (status) where.status = status
    if (type) where.type = type

    const [chargers, total] = await Promise.all([
      prisma.charger.findMany({
        where,
        include: {
          station: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          currentOrder: {
            select: {
              id: true,
              userId: true,
              startTime: true,
              chargedKw: true,
              startSoc: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
      }),
      prisma.charger.count({ where }),
    ])

    paginateResponse(res, chargers, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.get('/chargers/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const charger = await prisma.charger.findUnique({
      where: { id },
      include: {
        station: true,
        currentOrder: true,
        healthRecords: {
          take: 10,
          orderBy: { checkTime: 'desc' },
        },
      },
    })

    if (!charger) {
      throw new AppError('充电桩不存在', 404)
    }

    successResponse(res, charger)
  } catch (error) {
    next(error)
  }
})

router.get('/chargers/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params

    const charger = await prisma.charger.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        currentPower: true,
        lastHeartbeat: true,
        currentOrder: {
          select: {
            id: true,
            chargedKw: true,
            startSoc: true,
            endSoc: true,
            startTime: true,
          },
        },
      },
    })

    if (!charger) {
      throw new AppError('充电桩不存在', 404)
    }

    successResponse(res, charger)
  } catch (error) {
    next(error)
  }
})

router.post('/orders/start', authMiddleware, async (req, res, next) => {
  try {
    const { chargerId, startSoc = 20, targetSoc = 80, powerLimit, greenEnergyPreferred = true } = req.body
    const userId = req.user.id

    if (!chargerId) {
      throw new AppError('请选择充电桩', 400)
    }

    const charger = await prisma.charger.findUnique({
      where: { id: chargerId },
      include: { station: true },
    })

    if (!charger) {
      throw new AppError('充电桩不存在', 404)
    }

    if (charger.status !== 'AVAILABLE') {
      throw new AppError(`充电桩当前状态为${charger.status}，无法启动充电`, 400)
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'CHARGING'] },
      },
    })

    if (existingOrder) {
      throw new AppError('您有正在进行的订单，请先结束', 400)
    }

    const basePrice = 1.5
    const peakMultiplier = 1.2
    const currentHour = new Date().getHours()
    const isPeak = currentHour >= 10 && currentHour <= 12 || currentHour >= 18 && currentHour <= 22
    const pricePerKw = isPeak ? basePrice * peakMultiplier : basePrice

    const orderNo = generateOrderNo()
    const greenEnergyType = greenEnergyPreferred ? 'SOLAR' : null
    const greenEnergyRatio = greenEnergyPreferred ? 0.8 : 0

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          userId,
          chargerId,
          stationId: charger.stationId,
          stationName: charger.station.name,
          status: 'CHARGING',
          startSoc,
          endSoc: targetSoc,
          startPower: charger.maxPower,
          pricePerKw,
          startTime: new Date(),
          greenEnergyType,
          greenEnergyRatio,
          peakKw: powerLimit ? parseFloat(powerLimit) : charger.maxPower,
        },
      })

      await tx.charger.update({
        where: { id: chargerId },
        data: {
          status: 'OCCUPIED',
          currentOrderId: newOrder.id,
          currentPower: powerLimit ? parseFloat(powerLimit) : charger.maxPower,
          lastHeartbeat: new Date(),
        },
      })

      await tx.station.update({
        where: { id: charger.stationId },
        data: {
          availablePiles: { decrement: 1 },
        },
      })

      return newOrder
    })

    successResponse(res, order, '充电启动成功')
  } catch (error) {
    next(error)
  }
})

router.post('/orders/:id/stop', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const order = await prisma.order.findUnique({
      where: { id },
      include: { charger: true },
    })

    if (!order) {
      throw new AppError('订单不存在', 404)
    }

    if (order.userId !== userId) {
      throw new AppError('无权操作此订单', 403)
    }

    if (order.status !== 'CHARGING') {
      throw new AppError('订单未在充电中', 400)
    }

    const chargedKw = Math.max(15 + Math.random() * 30, 5)
    const totalAmount = Number((chargedKw * order.pricePerKw).toFixed(2))
    const endTime = new Date()
    const durationSeconds = Math.floor((endTime - new Date(order.startTime)) / 1000)
    const carbonReduction = calculateCarbonReduction(chargedKw, order.greenEnergyRatio)

    const endSoc = Math.min(order.startSoc + Math.floor(chargedKw * 0.8), 100)

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          chargedKw,
          endSoc,
          totalAmount: parseFloat(totalAmount),
          paidAmount: parseFloat(totalAmount),
          endTime,
          durationSeconds,
          carbonReduction,
        },
      })

      await tx.charger.update({
        where: { id: order.chargerId },
        data: {
          status: 'AVAILABLE',
          currentOrderId: null,
          currentPower: 0,
          totalKw: { increment: chargedKw },
          totalOrders: { increment: 1 },
          lastHeartbeat: new Date(),
        },
      })

      await tx.station.update({
        where: { id: order.stationId },
        data: {
          availablePiles: { increment: 1 },
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          totalChargingKw: { increment: chargedKw },
          totalCost: { increment: parseFloat(totalAmount) },
          carbonReduction: { increment: carbonReduction },
        },
      })

      if (order.charger.isPrivate && order.charger.privatePileId) {
        const platformFee = parseFloat(totalAmount) * 0.1
        const ownerEarning = parseFloat(totalAmount) - platformFee

        await tx.sharingEarning.create({
          data: {
            privatePileId: order.charger.privatePileId,
            userId,
            orderId: id,
            chargedKw,
            totalAmount: parseFloat(totalAmount),
            platformFee,
            ownerEarning,
            settlementDate: new Date(),
          },
        })

        await tx.privatePile.update({
          where: { id: order.charger.privatePileId },
          data: {
            totalEarnings: { increment: ownerEarning },
            totalOrders: { increment: 1 },
          },
        })
      }

      if (order.greenEnergyRatio > 0) {
        const { generateCertificateNo } = require('../utils/response')
        await tx.greenCertificate.create({
          data: {
            certificateNo: generateCertificateNo(),
            userId,
            orderId: id,
            energyType: order.greenEnergyType || 'SOLAR',
            energyAmount: chargedKw * order.greenEnergyRatio,
            carbonReduction,
            gridCompany: '国家电网',
            issuedAt: new Date(),
          },
        })
      }

      return updated
    })

    successResponse(res, updatedOrder, '充电结束成功')
  } catch (error) {
    next(error)
  }
})

router.post('/orders/:id/power', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { power } = req.body
    const userId = req.user.id

    if (!power || power <= 0) {
      throw new AppError('请输入有效的功率值', 400)
    }

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      throw new AppError('订单不存在', 404)
    }

    if (order.userId !== userId) {
      throw new AppError('无权操作此订单', 403)
    }

    if (order.status !== 'CHARGING') {
      throw new AppError('订单未在充电中', 400)
    }

    await prisma.charger.update({
      where: { id: order.chargerId },
      data: {
        currentPower: parseFloat(power),
      },
    })

    await prisma.order.update({
      where: { id },
      data: {
        peakKw: parseFloat(power),
      },
    })

    successResponse(res, { power: parseFloat(power) }, '功率调节成功')
  } catch (error) {
    next(error)
  }
})

router.get('/orders', authMiddleware, async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const userId = req.user.id

    const where = { userId }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          charger: {
            select: {
            id: true,
            name: true,
            type: true,
            maxPower: true,
          },
        },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    paginateResponse(res, orders, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.get('/orders/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        charger: true,
        greenCertificate: true,
        paymentRecord: true,
      },
    })

    if (!order) {
      throw new AppError('订单不存在', 404)
    }

    if (order.userId !== userId) {
      throw new AppError('无权查看此订单', 403)
    }

    successResponse(res, order)
  } catch (error) {
    next(error)
  }
})

router.post('/reservations', authMiddleware, async (req, res, next) => {
  try {
    const { chargerId, scheduledStartTime, scheduledEndTime, powerLimit, depositAmount = 0 } = req.body
    const userId = req.user.id

    if (!chargerId || !scheduledStartTime || !scheduledEndTime) {
      throw new AppError('请填写完整预约信息', 400)
    }

    const charger = await prisma.charger.findUnique({
      where: { id: chargerId },
    })

    if (!charger) {
      throw new AppError('充电桩不存在', 404)
    }

    const start = new Date(scheduledStartTime)
    const end = new Date(scheduledEndTime)

    if (start <= new Date()) {
      throw new AppError('预约开始时间必须晚于当前时间', 400)
    }

    if (end <= start) {
      throw new AppError('预约结束时间必须晚于开始时间', 400)
    }

    const conflictingReservations = await prisma.reservation.count({
      where: {
        chargerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
          scheduledStartTime: { lt: end, gt: start },
        },
          {
          scheduledEndTime: { gt: start, lt: end },
        },
        ],
      },
    })

    if (conflictingReservations > 0) {
      throw new AppError('该时段已有预约，请选择其他时段', 400)
    }

    const reservationNo = generateReservationNo()

    const reservation = await prisma.reservation.create({
      data: {
        reservationNo,
        userId,
        chargerId,
        stationId: charger.stationId,
        status: 'CONFIRMED',
        scheduledStartTime: start,
        scheduledEndTime: end,
        powerLimit: powerLimit ? parseFloat(powerLimit) : null,
        depositAmount: parseFloat(depositAmount),
      },
    })

    successResponse(res, reservation, '预约成功')
  } catch (error) {
    next(error)
  }
})

router.get('/reservations', authMiddleware, async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const userId = req.user.id

    const where = { userId }
    if (status) where.status = status

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          charger: {
            include: { station: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { scheduledStartTime: 'desc' },
      }),
      prisma.reservation.count({ where }),
    ])

    paginateResponse(res, reservations, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.post('/reservations/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      throw new AppError('预约不存在', 404)
    }

    if (reservation.userId !== userId) {
      throw new AppError('无权操作此预约', 403)
    }

    if (reservation.status !== 'PENDING' && reservation.status !== 'CONFIRMED') {
      throw new AppError('该预约无法取消', 400)
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    successResponse(res, null, '预约已取消')
  } catch (error) {
    next(error)
  }
})

router.post('/path-planning', authMiddleware, async (req, res, next) => {
  try {
    const { originLat, originLng, destLat, destLng, currentSoc, batteryCapacity } = req.body

    if (!originLat || !originLng || !destLat || !destLng) {
      throw new AppError('请提供起点和终点坐标', 400)
    }

    const R = 6371
    const dLat = ((parseFloat(destLat) - parseFloat(originLat)) * Math.PI) / 180
    const dLng = ((parseFloat(destLng) - parseFloat(originLng)) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((parseFloat(originLat) * Math.PI) / 180) *
        Math.cos((parseFloat(destLat) * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const totalDistance = R * c

    const consumptionPerKm = 0.15
    const requiredEnergy = totalDistance * consumptionPerKm
    const currentEnergy = (currentSoc || 80) / 100 * (batteryCapacity || 60)
    const needCharge = requiredEnergy > currentEnergy * 0.8

    let chargingStops = []

    if (needCharge) {
      const midLat = (parseFloat(originLat) + parseFloat(destLat)) / 2
      const midLng = (parseFloat(originLng) + parseFloat(destLng)) / 2

      const stations = await prisma.station.findMany({
        where: {
          availablePiles: { gt: 0 },
        },
        include: {
          chargers: {
          where: { status: 'AVAILABLE' },
          take: 3,
        },
        },
        take: 5,
      })

      const currentHour = new Date().getHours()
      const isPeak = currentHour >= 10 && currentHour <= 12 || currentHour >= 18 && currentHour <= 22
      const basePrice = 1.5
      const currentPrice = isPeak ? basePrice * 1.2 : basePrice

      chargingStops = stations.map((station, index) => {
        const dLat2 = ((parseFloat(station.latitude) - midLat) * Math.PI) / 180
        const dLng2 = ((parseFloat(station.longitude) - midLng) * Math.PI) / 180
        const a2 = Math.sin(dLat2 / 2) * Math.sin(dLat2 / 2) + Math.cos((midLat * Math.PI) / 180) * Math.cos((parseFloat(station.latitude) * Math.PI) / 180) * Math.sin(dLng2 / 2) * Math.sin(dLng2 / 2)
        const c2 = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2))
        const distanceToMid = R * c2

        const estimatedWait = station.availablePiles < 2 ? 15 : 5

        return {
          station,
          distanceToRoute: Number(distanceToMid.toFixed(2)),
          estimatedChargeTime: Math.ceil(requiredEnergy * 0.6 / station.chargingPower * 60),
          estimatedCost: Number((requiredEnergy * 0.6 * currentPrice).toFixed(2)),
          estimatedWait,
          score: Number((100 - distanceToMid * 10 - estimatedWait * 0.5 - (isPeak ? 10 : 0)).toFixed(0)),
        }
      }).sort((a, b) => b.score - a.score)
    }

    successResponse(res, {
      totalDistance: Number(totalDistance.toFixed(2)),
      estimatedDriveTime: Math.ceil(totalDistance / 60 * 60),
      requiredEnergy: Number(requiredEnergy.toFixed(2)),
      currentEnergy: Number(currentEnergy.toFixed(2)),
      needCharge,
      chargingStops,
      suggestions: [
        '建议出发前检查轮胎气压',
        '尽量避开高峰时段充电可节省费用',
        '使用绿电充电可获得碳减排凭证',
      ],
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
