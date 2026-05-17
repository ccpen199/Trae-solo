import { Router } from 'express'
import prisma from '../utils/prisma'
import { authMiddleware, AuthRequest, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const skip = (Number(page) - 1) * Number(pageSize)
    
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { startTime: 'asc' },
        include: {
          registrations: req.user ? { where: { userId: req.user.id } } : false
        }
      }),
      prisma.activity.count({ where })
    ])

    const formattedActivities = activities.map(activity => ({
      ...activity,
      coverImage: activity.coverImage || 'https://picsum.photos/800/400',
      isRegistered: activity.registrations?.length > 0,
      registrations: undefined
    }))

    res.json({
      success: true,
      data: {
        list: formattedActivities,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    console.error('获取活动列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const skip = (Number(page) - 1) * Number(pageSize)

    const [registrations, total] = await Promise.all([
      prisma.activityRegistration.findMany({
        where: { userId: req.user!.id },
        skip,
        take: Number(pageSize),
        orderBy: { registeredAt: 'desc' },
        include: { activity: true }
      }),
      prisma.activityRegistration.count({ where: { userId: req.user!.id } })
    ])

    res.json({
      success: true,
      data: {
        list: registrations.map(r => ({
          ...r.activity,
          registrationId: r.id,
          registrationStatus: r.status,
          registeredAt: r.registeredAt
        })),
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    console.error('获取我的活动错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const activity = await prisma.activity.findUnique({
      where: { id: Number(id) },
      include: {
        registrations: req.user ? { where: { userId: req.user.id } } : false,
        _count: { select: { registrations: true } }
      }
    })

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' })
    }

    res.json({
      success: true,
      data: {
        ...activity,
        coverImage: activity.coverImage || 'https://picsum.photos/800/400',
        isRegistered: activity.registrations?.length > 0,
        registrationCount: activity._count.registrations,
        registrations: undefined,
        _count: undefined
      }
    })
  } catch (error) {
    console.error('获取活动详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/register', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const activity = await prisma.activity.findUnique({
      where: { id: Number(id) }
    })

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' })
    }

    const existingRegistration = await prisma.activityRegistration.findFirst({
      where: { activityId: Number(id), userId }
    })

    if (existingRegistration) {
      return res.status(400).json({ success: false, message: '已经报名过该活动' })
    }

    await prisma.activityRegistration.create({
      data: { activityId: Number(id), userId, status: 'registered' }
    })

    res.json({ success: true, data: { isRegistered: true }, message: '报名成功' })
  } catch (error) {
    console.error('活动报名错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, description, coverImage, location, startTime, endTime, maxParticipants } = req.body

    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: '必填项不能为空' })
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        coverImage,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        status: 'upcoming'
      }
    })

    res.json({ success: true, data: activity, message: '活动创建成功' })
  } catch (error) {
    console.error('创建活动错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
