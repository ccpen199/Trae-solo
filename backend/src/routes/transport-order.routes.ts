import { Response, Router } from 'express'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { success, error, pagination } from '../utils/response'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword, status, transportType } = req.query

    const where: any = {}

    if (status !== undefined) {
      where.status = Number(status)
    }

    if (transportType !== undefined) {
      where.transportType = Number(transportType)
    }

    if (keyword && typeof keyword === 'string') {
      where.OR = [
        { orderNo: { contains: keyword } },
        { cargoName: { contains: keyword } },
        { shipperName: { contains: keyword } },
        { consigneeName: { contains: keyword } },
        { plateNumber: { contains: keyword } },
      ]
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const [list, total] = await Promise.all([
      prisma.transportOrder.findMany({
        where,
        skip,
        take,
        include: {
          carrier: true,
          plan: true,
          monitorings: {
            take: 1,
            orderBy: [{ monitorTime: 'desc' }],
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.transportOrder.count({ where }),
    ])

    pagination(res, list, total, Number(page), Number(pageSize))
  } catch (err) {
    console.error('Get transport orders error:', err)
    error(res, '获取运输委托列表失败')
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const order = await prisma.transportOrder.findUnique({
      where: { id },
      include: {
        carrier: true,
        plan: true,
        monitorings: {
          orderBy: [{ monitorTime: 'desc' }],
        },
        exceptions: {
          orderBy: [{ createdAt: 'desc' }],
        },
        logs: {
          orderBy: [{ createdAt: 'desc' }],
        },
        sign: true,
        arrivalForecast: true,
        freightCalc: true,
        claims: true,
      },
    })

    if (!order) {
      error(res, '运输委托不存在', 404)
      return
    }

    success(res, order)
  } catch (err) {
    console.error('Get transport order error:', err)
    error(res, '获取运输委托信息失败')
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      planId,
      businessType,
      transportType,
      fromCityCode,
      toCityCode,
      fromNodeId,
      toNodeId,
      shipperName,
      shipperPhone,
      shipperAddress,
      consigneeName,
      consigneePhone,
      consigneeAddress,
      carrierId,
      routeId,
      vehicleId,
      plateNumber,
      driverId,
      driverName,
      driverPhone,
      cargoTypeId,
      cargoName,
      cargoWeight,
      cargoVolume,
      cargoQuantity,
      packaging,
      temperature,
      isDangerous,
      planDeparture,
      planArrival,
      estimatedCost,
    } = req.body

    if (!transportType) {
      error(res, '运输类型不能为空', 400)
      return
    }

    const orderNo = `TO${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.transportOrder.create({
        data: {
          orderNo,
          planId,
          businessType,
          sourceType: 2,
          transportType: Number(transportType),
          status: 0,
          fromCityCode,
          toCityCode,
          fromNodeId,
          toNodeId,
          shipperName,
          shipperPhone,
          shipperAddress,
          consigneeName,
          consigneePhone,
          consigneeAddress,
          carrierId,
          routeId,
          vehicleId,
          plateNumber,
          driverId,
          driverName,
          driverPhone,
          cargoTypeId,
          cargoName,
          cargoWeight: cargoWeight ? parseFloat(cargoWeight) : undefined,
          cargoVolume: cargoVolume ? parseFloat(cargoVolume) : undefined,
          cargoQuantity: cargoQuantity ? parseInt(cargoQuantity) : undefined,
          packaging,
          temperature,
          isDangerous: isDangerous === true || isDangerous === 'true',
          planDeparture: planDeparture ? new Date(planDeparture) : undefined,
          planArrival: planArrival ? new Date(planArrival) : undefined,
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
          creatorId: req.user?.userId || '',
        },
      })

      await tx.orderChangeLog.create({
        data: {
          orderId: newOrder.id,
          changeType: 1,
          operatorId: req.user?.userId || '',
          operatorName: req.user?.username,
        },
      })

      return newOrder
    })

    success(res, { id: order.id, orderNo: order.orderNo }, '创建运输委托成功')
  } catch (err) {
    console.error('Create transport order error:', err)
    error(res, '创建运输委托失败')
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body

    const existing = await prisma.transportOrder.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '运输委托不存在', 404)
      return
    }

    const updateData: any = {}
    for (const key in data) {
      if (key === 'id' || key === 'orderNo' || key === 'creatorId' || key === 'createdAt') continue
      if (data[key] !== undefined) {
        updateData[key] = data[key]
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.transportOrder.update({
        where: { id },
        data: { ...updateData, updatedAt: new Date() },
      })

      await tx.orderChangeLog.create({
        data: {
          orderId: id,
          changeType: 2,
          operatorId: req.user?.userId || '',
          operatorName: req.user?.username,
        },
      })
    })

    success(res, null, '更新运输委托成功')
  } catch (err) {
    console.error('Update transport order error:', err)
    error(res, '更新运输委托失败')
  }
})

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    const existing = await prisma.transportOrder.findUnique({
      where: { id },
    })

    if (!existing) {
      error(res, '运输委托不存在', 404)
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.transportOrder.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      })

      await tx.orderChangeLog.create({
        data: {
          orderId: id,
          changeType: 4,
          oldValue: String(existing.status),
          newValue: String(status),
          operatorId: req.user?.userId || '',
          operatorName: req.user?.username,
        },
      })
    })

    success(res, null, '状态更新成功')
  } catch (err) {
    console.error('Update transport order status error:', err)
    error(res, '状态更新失败')
  }
})

export default router
