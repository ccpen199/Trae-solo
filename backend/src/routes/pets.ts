import { Router } from 'express'
import prisma from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    })

    const formattedPets = pets.map(pet => ({
      ...pet,
      avatar: pet.avatar || 'https://picsum.photos/200/200'
    }))

    res.json({ success: true, data: formattedPets })
  } catch (error) {
    console.error('获取宠物列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const pet = await prisma.pet.findUnique({
      where: { id: Number(id), userId: req.user!.id }
    })

    if (!pet) {
      return res.status(404).json({ success: false, message: '宠物不存在' })
    }

    res.json({
      success: true,
      data: {
        ...pet,
        avatar: pet.avatar || 'https://picsum.photos/200/200'
      }
    })
  } catch (error) {
    console.error('获取宠物详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, avatar, gender, age, birthday, breed, healthStatus, licenseNumber } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: '宠物名称不能为空' })
    }

    const pet = await prisma.pet.create({
      data: {
        userId: req.user!.id,
        name,
        avatar,
        gender,
        age: age ? Number(age) : null,
        birthday: birthday ? new Date(birthday) : null,
        breed,
        healthStatus,
        licenseNumber
      }
    })

    res.json({ success: true, data: pet, message: '宠物档案创建成功' })
  } catch (error) {
    console.error('创建宠物档案错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { name, avatar, gender, age, birthday, breed, healthStatus, licenseNumber } = req.body

    const pet = await prisma.pet.update({
      where: { id: Number(id), userId: req.user!.id },
      data: {
        name,
        avatar,
        gender,
        age: age ? Number(age) : null,
        birthday: birthday ? new Date(birthday) : null,
        breed,
        healthStatus,
        licenseNumber
      }
    })

    res.json({ success: true, data: pet, message: '更新成功' })
  } catch (error) {
    console.error('更新宠物档案错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id/health-records', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const records = await prisma.healthRecord.findMany({
      where: { petId: Number(id) },
      orderBy: { date: 'desc' }
    })

    res.json({ success: true, data: records })
  } catch (error) {
    console.error('获取健康记录错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/health-records', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { type, date, notes } = req.body

    if (!type || !date) {
      return res.status(400).json({ success: false, message: '类型和日期不能为空' })
    }

    const record = await prisma.healthRecord.create({
      data: {
        petId: Number(id),
        type,
        date: new Date(date),
        notes
      }
    })

    res.json({ success: true, data: record, message: '添加成功' })
  } catch (error) {
    console.error('添加健康记录错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id/daily-tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { date } = req.query

    const where: any = { petId: Number(id) }
    if (date) {
      where.date = new Date(date as string)
    }

    const tasks = await prisma.dailyTask.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: tasks })
  } catch (error) {
    console.error('获取日常任务错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/daily-tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { type, time, date } = req.body

    if (!type || !date) {
      return res.status(400).json({ success: false, message: '类型和日期不能为空' })
    }

    const task = await prisma.dailyTask.create({
      data: {
        petId: Number(id),
        type,
        time,
        date: new Date(date)
      }
    })

    res.json({ success: true, data: task, message: '添加成功' })
  } catch (error) {
    console.error('添加日常任务错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/daily-tasks/:id/toggle', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const task = await prisma.dailyTask.findUnique({
      where: { id: Number(id) }
    })

    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }

    const updatedTask = await prisma.dailyTask.update({
      where: { id: Number(id) },
      data: { completed: !task.completed }
    })

    res.json({ success: true, data: updatedTask })
  } catch (error) {
    console.error('更新任务状态错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id/growth-diaries', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const diaries = await prisma.growthDiary.findMany({
      where: { petId: Number(id) },
      orderBy: { date: 'desc' }
    })

    const formattedDiaries = diaries.map(diary => ({
      ...diary,
      images: diary.images ? diary.images.split(',') : []
    }))

    res.json({ success: true, data: formattedDiaries })
  } catch (error) {
    console.error('获取成长日记错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/growth-diaries', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { title, content, images, date } = req.body

    if (!title || !content || !date) {
      return res.status(400).json({ success: false, message: '标题、内容和日期不能为空' })
    }

    const diary = await prisma.growthDiary.create({
      data: {
        petId: Number(id),
        title,
        content,
        images: Array.isArray(images) ? images.join(',') : images,
        date: new Date(date)
      }
    })

    res.json({ success: true, data: diary, message: '添加成功' })
  } catch (error) {
    console.error('添加成长日记错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
