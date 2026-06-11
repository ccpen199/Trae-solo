const express = require('express')
const prisma = require('../lib/prisma')
const { successResponse, paginateResponse, AppError } = require('../utils/response')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

router.get('/user/profile', async (req, res, next) => {
  try {
    const userId = req.user.id

    const [user, orders, recentOrders, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { vehicle: true },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          charger: { include: { station: true } },
          greenCertificate: true,
        },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ])

    const totalOrders = orders.length
    const totalChargingKw = orders.reduce((acc, o) => acc + o.chargedKw, 0)
    const totalCost = orders.reduce((acc, o) => acc + o.totalAmount, 0)
    const totalDuration = orders.reduce((acc, o) => acc + o.durationSeconds, 0)

    const chargingHours = Array(24).fill(0)
    orders.forEach((order) => {
      if (order.startTime) {
        const hour = new Date(order.startTime).getHours()
        chargingHours[hour]++
      }
    })

    let preferredTime = '全天'
    let maxCount = 0
    for (let i = 0; i < 24; i++) {
      if (chargingHours[i] > maxCount) {
        maxCount = chargingHours[i]
        preferredTime = `${i}:00-${i + 2}:00`
      }
    }

    const avgSocStart = orders.length > 0
      ? orders.reduce((acc, o) => acc + o.startSoc, 0) / orders.length
      : 30

    const avgSocEnd = orders.length > 0
      ? orders.reduce((acc, o) => acc + (o.endSoc || 80), 0) / orders.length
      : 80

    const stationCounts = {}
    orders.forEach((order) => {
      stationCounts[order.stationId] = (stationCounts[order.stationId] || 0) + 1
    })

    let preferredStation = null
    let maxStationCount = 0
    for (const [sid, count] of Object.entries(stationCounts)) {
      if (count > maxStationCount) {
        maxStationCount = count
        preferredStation = sid
      }
    }

    const chargingLevel = totalOrders >= 100 ? 'DIAMOND'
      : totalOrders >= 50 ? 'PLATINUM'
      : totalOrders >= 20 ? 'GOLD'
      : totalOrders >= 5 ? 'SILVER'
      : 'BRONZE'

    const riskScore = Math.max(30, 100 - orders.filter(o => o.status === 'CANCELLED').length * 5)

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        totalOrders,
        totalChargingKw,
        avgChargingFreq: Number((totalOrders / 30).toFixed(2)),
        preferredStation,
        preferredTime,
        avgSocStart: Number(avgSocStart.toFixed(1)),
        avgSocEnd: Number(avgSocEnd.toFixed(1)),
        chargingLevel,
        riskScore,
      },
      update: {
        totalOrders,
        totalChargingKw,
        avgChargingFreq: Number((totalOrders / 30).toFixed(2)),
        preferredStation,
        preferredTime,
        avgSocStart: Number(avgSocStart.toFixed(1)),
        avgSocEnd: Number(avgSocEnd.toFixed(1)),
        chargingLevel,
        riskScore,
      },
    })

    const tags = []
    if (totalChargingKw > 500) tags.push('高频用户')
    if (avgSocEnd > 90) tags.push('满充爱好者')
    if (chargingHours[18] + chargingHours[19] + chargingHours[20] > maxCount * 0.5) tags.push('夜充达人')
    if (preferredTime.includes('2') || preferredTime.includes('3')) tags.push('凌晨充电侠')
    if (totalCost > 1000) tags.push('高价值用户')

    successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        balance: user.balance,
        totalChargingKw: user.totalChargingKw,
        totalCost: user.totalCost,
        carbonReduction: user.carbonReduction,
        vehicle: user.vehicle,
      },
      stats: {
        totalOrders,
        totalChargingKw: Number(totalChargingKw.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        avgDurationMinutes: orders.length > 0 ? Number((totalDuration / orders.length / 60).toFixed(1)) : 0,
        avgOrderAmount: orders.length > 0 ? Number((totalCost / orders.length).toFixed(2)) : 0,
      },
      profile: profile || {
        totalOrders,
        totalChargingKw,
        preferredStation,
        preferredTime,
        chargingLevel,
        riskScore,
      },
      tags,
      chargingHours,
      recentOrders,
    })
  } catch (error) {
    next(error)
  }
})

router.put('/user/vehicle', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { plateNumber, brand, model, batteryCapacity, currentSoc } = req.body

    if (!plateNumber || !brand || !batteryCapacity) {
      throw new AppError('请填写完整车辆信息', 400)
    }

    const vehicle = await prisma.vehicle.upsert({
      where: { userId },
      create: {
        userId,
        plateNumber,
        brand,
        model: model || '',
        batteryCapacity: parseFloat(batteryCapacity),
        currentSoc: currentSoc || 80,
      },
      update: {
        plateNumber,
        brand,
        model,
        batteryCapacity: parseFloat(batteryCapacity),
        currentSoc,
      },
    })

    successResponse(res, vehicle, '车辆信息更新成功')
  } catch (error) {
    next(error)
  }
})

router.get('/private-piles', async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const userId = req.user.id

    const where = { ownerId: userId }
    if (status) where.status = status

    const [piles, total] = await Promise.all([
      prisma.privatePile.findMany({
        where,
        include: {
          charger: true,
          timeSlots: {
            orderBy: { dayOfWeek: 'asc' },
          },
          earnings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.privatePile.count({ where }),
    ])

    paginateResponse(res, piles, total, parseInt(page), parseInt(pageSize))
  } catch (error) {
    next(error)
  }
})

router.post('/private-piles', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { address, city, chargerType, maxPower, pricePerKw, serviceFee } = req.body

    if (!address || !city || !chargerType || !maxPower) {
      throw new AppError('请填写完整私桩信息', 400)
    }

    const charger = await prisma.charger.create({
      data: {
        stationId: 'private-' + userId,
        name: '私桩-' + address.slice(-10),
        serialNumber: 'PRIVATE-' + Date.now(),
        type: chargerType,
        maxPower: parseFloat(maxPower),
        status: 'OFFLINE',
        isPrivate: true,
      },
    })

    const privatePile = await prisma.privatePile.create({
      data: {
        ownerId: userId,
        chargerId: charger.id,
        address,
        city,
        chargerType,
        maxPower: parseFloat(maxPower),
        pricePerKw: pricePerKw ? parseFloat(pricePerKw) : 1.2,
        serviceFee: serviceFee ? parseFloat(serviceFee) : 0.5,
      },
    })

    const timeSlots = []
    for (let day = 0; day < 7; day++) {
      timeSlots.push({
        privatePileId: privatePile.id,
        dayOfWeek: day,
        startTime: '00:00',
        endTime: '23:59',
        isAvailable: false,
      })
    }
    await prisma.sharingTimeSlot.createMany({ data: timeSlots })

    successResponse(res, { ...privatePile, charger }, '私桩接入成功')
  } catch (error) {
    next(error)
  }
})

router.put('/private-piles/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { status, pricePerKw, serviceFee, address } = req.body

    const pile = await prisma.privatePile.findUnique({ where: { id } })
    if (!pile || pile.ownerId !== userId) {
      throw new AppError('无权操作此私桩', 403)
    }

    const updated = await prisma.privatePile.update({
      where: { id },
      data: {
        status,
        pricePerKw: pricePerKw ? parseFloat(pricePerKw) : undefined,
        serviceFee: serviceFee ? parseFloat(serviceFee) : undefined,
        address,
      },
    })

    if (status) {
      await prisma.charger.update({
        where: { id: pile.chargerId },
        data: { status: status === 'ACTIVE' ? 'AVAILABLE' : 'OFFLINE' },
      })
    }

    successResponse(res, updated, '私桩信息更新成功')
  } catch (error) {
    next(error)
  }
})

router.post('/private-piles/:id/timeslots', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { timeSlots } = req.body

    const pile = await prisma.privatePile.findUnique({ where: { id } })
    if (!pile || pile.ownerId !== userId) {
      throw new AppError('无权操作此私桩', 403)
    }

    if (!Array.isArray(timeSlots)) {
      throw new AppError('时段格式错误', 400)
    }

    await prisma.sharingTimeSlot.deleteMany({ where: { privatePileId: id } })
    await prisma.sharingTimeSlot.createMany({
      data: timeSlots.map((slot) => ({
        privatePileId: id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable !== false,
      })),
    })

    successResponse(res, null, '时段设置成功')
  } catch (error) {
    next(error)
  }
})

router.get('/green-certificates', async (req, res, next) => {
  try {
    const { verified, page = 1, pageSize = 20 } = req.query
    const userId = req.user.id

    const where = { userId }
    if (verified !== undefined) where.verified = verified === 'true'

    const [certificates, total, stats] = await Promise.all([
      prisma.greenCertificate.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              stationName: true,
              chargedKw: true,
              createdAt: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.greenCertificate.count({ where }),
      prisma.greenCertificate.aggregate({
        where: { userId },
        _sum: {
          energyAmount: true,
          carbonReduction: true,
        },
      }),
    ])

    paginateResponse(
      res,
      {
        list: certificates,
        totalEnergy: stats._sum.energyAmount || 0,
        totalCarbonReduction: stats._sum.carbonReduction || 0,
      },
      total,
      parseInt(page),
      parseInt(pageSize)
    )
  } catch (error) {
    next(error)
  }
})

router.get('/green-certificates/:id/verify', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const certificate = await prisma.greenCertificate.findUnique({ where: { id } })
    if (!certificate || certificate.userId !== userId) {
      throw new AppError('凭证不存在或无权查看', 403)
    }

    const updated = await prisma.greenCertificate.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    })

    successResponse(res, updated, '绿电凭证核验成功')
  } catch (error) {
    next(error)
  }
})

router.get('/analysis/charging-behavior', roleMiddleware('ADMIN', 'PILE_ENTERPRISE', 'GRID_COMPANY'), async (req, res, next) => {
  try {
    const { days = 30 } = req.query

    const [orders, users, stations] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: 'CAR_OWNER' },
        include: { _count: { select: { orders: true } } },
      }),
      prisma.station.findMany({ include: { _count: { select: { chargers: true } } } }),
    ])

    const dailyStats = {}
    const hourlyStats = Array(24).fill(0)

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: 0, kw: 0, revenue: 0 }
      }
      dailyStats[date].orders++
      dailyStats[date].kw += order.chargedKw
      dailyStats[date].revenue += order.totalAmount

      if (order.startTime) {
        const hour = new Date(order.startTime).getHours()
        hourlyStats[hour]++
      }
    })

    const userSegments = [
      { name: '高频用户（>20次/月）', count: users.filter(u => u._count.orders > 20).length },
      { name: '中频用户（5-20次/月）', count: users.filter(u => u._count.orders >= 5 && u._count.orders <= 20).length },
      { name: '低频用户（<5次/月）', count: users.filter(u => u._count.orders < 5).length },
    ]

    const valleyPrediction = hourlyStats.map((count, hour) => ({
      hour,
      actual: count,
      predicted: Math.floor(count * (0.9 + Math.random() * 0.2)),
      isValley: hour >= 0 && hour <= 6,
      isPeak: (hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 22),
    }))

    successResponse(res, {
      dateRange: days,
      totalOrders: orders.length,
      totalChargingKw: orders.reduce((acc, o) => acc + o.chargedKw, 0),
      totalRevenue: orders.reduce((acc, o) => acc + o.totalAmount, 0),
      dailyStats: Object.entries(dailyStats).map(([date, data]) => ({ date, ...data })),
      hourlyStats: valleyPrediction,
      userSegments,
      totalUsers: users.length,
      totalStations: stations.length,
      totalChargers: stations.reduce((acc, s) => acc + s._count.chargers, 0),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/analysis/carbon', roleMiddleware('ADMIN', 'GRID_COMPANY'), async (req, res, next) => {
  try {
    const { days = 30 } = req.query

    const [certificates, orders, gridStats] = await Promise.all([
      prisma.greenCertificate.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.gridStats.findMany({
        take: parseInt(days),
        orderBy: { statsDate: 'desc' },
      }),
    ])

    const energyTypeStats = {
      SOLAR: { amount: 0, count: 0 },
      WIND: { amount: 0, count: 0 },
      HYDRO: { amount: 0, count: 0 },
      NUCLEAR: { amount: 0, count: 0 },
      BIOMASS: { amount: 0, count: 0 },
    }

    certificates.forEach((cert) => {
      if (energyTypeStats[cert.energyType]) {
        energyTypeStats[cert.energyType].amount += cert.energyAmount
        energyTypeStats[cert.energyType].count++
      }
    })

    const totalCarbonReduction = certificates.reduce((acc, c) => acc + c.carbonReduction, 0)
    const totalGreenEnergy = certificates.reduce((acc, c) => acc + c.energyAmount, 0)
    const totalCharging = orders.reduce((acc, o) => acc + o.chargedKw, 0)
    const greenRatio = totalCharging > 0 ? (totalGreenEnergy / totalCharging * 100).toFixed(2) : 0

    const treeEquivalent = Math.floor(totalCarbonReduction / 18)
    const carEquivalent = Number((totalCarbonReduction / 1000 / 2.3).toFixed(2))

    successResponse(res, {
      dateRange: days,
      totalCarbonReduction: Number(totalCarbonReduction.toFixed(2)),
      totalGreenEnergy: Number(totalGreenEnergy.toFixed(2)),
      totalCharging: Number(totalCharging.toFixed(2)),
      greenRatio: parseFloat(greenRatio),
      energyTypeStats,
      environmentalImpact: {
        treeEquivalent,
        carEquivalent,
        coalSaved: Number((totalGreenEnergy * 0.35).toFixed(2)),
        waterSaved: Number((totalGreenEnergy * 2.5).toFixed(2)),
      },
      carbonTrades: [
        { date: '2026-06-01', amount: 5.2, price: 55, total: 286 },
        { date: '2026-06-02', amount: 3.8, price: 56, total: 212.8 },
        { date: '2026-06-03', amount: 6.1, price: 54, total: 329.4 },
      ],
      gridStats,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/government/dashboard', roleMiddleware('ADMIN', 'GRID_COMPANY'), async (req, res, next) => {
  try {
    const { city, province } = req.query

    const stationWhere = {}
    if (province) stationWhere.province = province
    if (city) stationWhere.city = city

    const [stations, chargers, orders, alarms, users] = await Promise.all([
      prisma.station.findMany({
        where: stationWhere,
        include: {
          chargers: true,
          stationStats: { take: 7, orderBy: { statsDate: 'desc' } },
        },
      }),
      prisma.charger.findMany(),
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.alarm.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({ where: { role: 'CAR_OWNER' } }),
    ])

    const totalStations = stations.length
    const totalChargers = chargers.length
    const availableChargers = chargers.filter(c => c.status === 'AVAILABLE').length
    const faultChargers = chargers.filter(c => c.status === 'FAULT').length

    const coverageRate = totalStations > 0 ? Number((totalStations / 50 * 100).toFixed(1)) : 0
    const utilizationRate = totalChargers > 0
      ? Number((orders.length / totalChargers / 24 * 100).toFixed(1))
      : 0
    const complianceRate = totalChargers > 0
      ? Number(((totalChargers - faultChargers) / totalChargers * 100).toFixed(1))
      : 0
    const failureRate = totalChargers > 0
      ? Number((faultChargers / totalChargers * 100).toFixed(2))
      : 0

    const cityStats = {}
    stations.forEach((station) => {
      if (!cityStats[station.city]) {
        cityStats[station.city] = {
          city: station.city,
          stations: 0,
          chargers: 0,
          available: 0,
          totalKw: 0,
          totalOrders: 0,
        }
      }
      cityStats[station.city].stations++
      cityStats[station.city].chargers += station.chargers.length
      cityStats[station.city].available += station.chargers.filter(c => c.status === 'AVAILABLE').length
      cityStats[station.city].totalKw += station.chargers.reduce((acc, c) => acc + c.totalKw, 0)
      cityStats[station.city].totalOrders += station.chargers.reduce((acc, c) => acc + c.totalOrders, 0)
    })

    const monthlyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOrders = orders.filter(o => o.createdAt.toISOString().split('T')[0] === dateStr)
      monthlyTrend.push({
        date: dateStr,
        orders: dayOrders.length,
        chargingKw: dayOrders.reduce((acc, o) => acc + o.chargedKw, 0),
        newUsers: Math.floor(Math.random() * 50),
      })
    }

    successResponse(res, {
      overview: {
        totalStations,
        totalChargers,
        availableChargers,
        faultChargers,
        totalUsers: users,
        totalOrders30d: orders.length,
        totalChargingKw30d: orders.reduce((acc, o) => acc + o.chargedKw, 0),
        coverageRate,
        utilizationRate,
        complianceRate,
        failureRate,
      },
      cityStats: Object.values(cityStats),
      monthlyTrend,
      alarmStats: {
        total: alarms.length,
        unhandled: alarms.filter(a => a.status === 'UNHANDLED').length,
        byLevel: {
          CRITICAL: alarms.filter(a => a.level === 'CRITICAL').length,
          ERROR: alarms.filter(a => a.level === 'ERROR').length,
          WARNING: alarms.filter(a => a.level === 'WARNING').length,
          INFO: alarms.filter(a => a.level === 'INFO').length,
        },
        byType: {
          OFFLINE: alarms.filter(a => a.type === 'OFFLINE').length,
          OVER_TEMPERATURE: alarms.filter(a => a.type === 'OVER_TEMPERATURE').length,
          COMMUNICATION_ERROR: alarms.filter(a => a.type === 'COMMUNICATION_ERROR').length,
          OTHERS: alarms.filter(a => !['OFFLINE', 'OVER_TEMPERATURE', 'COMMUNICATION_ERROR'].includes(a.type)).length,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
