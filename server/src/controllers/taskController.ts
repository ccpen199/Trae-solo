import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { getFileUrl } from '../middleware/upload'

const createTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  category: z.enum(['DESIGN', 'DEVELOPMENT', 'COPYWRITING', 'MARKETING', 'DECORATION', 'VIDEO', 'CONSULTING', 'OTHER']),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  deadline: z.string(),
  skillIds: z.array(z.number()).optional(),
})

export async function createTask(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const data = createTaskSchema.parse(req.body)
    
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        deadline: new Date(data.deadline),
        employerId: userId,
        status: 'DRAFT',
        skills: data.skillIds ? { connect: data.skillIds.map(id => ({ id })) } : undefined,
      },
      include: {
        skills: true,
        employer: {
          select: { id: true, username: true, avatar: true },
        },
      },
    })
    
    res.status(201).json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error(error)
    res.status(500).json({ error: '创建任务失败' })
  }
}

export async function publishTask(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } })
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }
    
    if (task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    if (task.status !== 'DRAFT') {
      return res.status(400).json({ error: '任务状态不允许发布' })
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'BIDDING',
        publishedAt: new Date(),
      },
      include: {
        skills: true,
        employer: {
          select: { id: true, username: true, avatar: true },
        },
      },
    })
    
    res.json(updatedTask)
  } catch {
    res.status(500).json({ error: '发布任务失败' })
  }
}

export async function getTasks(req: Request, res: Response) {
  try {
    const { 
      category, 
      status, 
      skillId,
      minBudget, 
      maxBudget, 
      page = '1', 
      pageSize = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query
    
    const where: any = {
      status: { not: 'DRAFT' },
    }
    
    if (category) where.category = category
    if (status) where.status = status
    if (minBudget) where.budgetMin = { gte: parseFloat(minBudget as string) }
    if (maxBudget) where.budgetMax = { lte: parseFloat(maxBudget as string) }
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ]
    }
    if (skillId) {
      where.skills = {
        some: { id: parseInt(skillId as string) },
      }
    }
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          skills: true,
          employer: {
            select: { id: true, username: true, avatar: true },
          },
          _count: {
            select: { bids: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ])
    
    res.json({
      data: tasks,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      totalPages: Math.ceil(total / take),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '获取任务列表失败' })
  }
}

export async function getTaskById(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        skills: true,
        attachments: true,
        employer: {
          select: { id: true, username: true, avatar: true, rating: true },
        },
        bids: {
          include: {
            provider: {
              select: { id: true, username: true, avatar: true, rating: true, level: true, skills: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        milestones: {
          orderBy: { orderIndex: 'asc' },
        },
        fileVersions: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    })
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }
    
    const now = new Date()
    const deadline = new Date(task.deadline)
    const timeLeft = Math.max(0, deadline.getTime() - now.getTime())
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))
    
    res.json({
      ...task,
      timeLeft,
      daysLeft,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '获取任务详情失败' })
  }
}

export async function getMyTasks(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { role = 'employer', status, page = '1', pageSize = '20' } = req.query
    
    const where: any = {}
    
    if (role === 'employer') {
      where.employerId = userId
    } else {
      where.bids = {
        some: { providerId: userId },
      }
    }
    
    if (status) where.status = status
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          skills: true,
          _count: { select: { bids: true } },
          employer: { select: { id: true, username: true, avatar: true } },
        },
      }),
      prisma.task.count({ where }),
    ])
    
    res.json({
      data: tasks,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })
  } catch {
    res.status(500).json({ error: '获取我的任务失败' })
  }
}

export async function uploadTaskAttachment(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' })
    }
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } })
    
    if (!task || task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: parseInt(id),
        fileName: req.file.originalname,
        fileUrl: getFileUrl(req.file.filename),
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      },
    })
    
    res.status(201).json(attachment)
  } catch {
    res.status(500).json({ error: '上传附件失败' })
  }
}

export async function selectBid(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId, bidId } = req.params
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    const bid = await prisma.bid.findUnique({ where: { id: parseInt(bidId) } })
    
    if (!task || !bid) {
      return res.status(404).json({ error: '任务或投标不存在' })
    }
    
    if (task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    if (task.status !== 'BIDDING') {
      return res.status(400).json({ error: '当前状态不能选择中标' })
    }
    
    if (bid.taskId !== parseInt(taskId)) {
      return res.status(400).json({ error: '投标不属于此任务' })
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        status: 'SELECTED',
        selectedBidId: parseInt(bidId),
        totalAmount: bid.price,
      },
      include: {
        selectedBid: true,
      },
    })
    
    await prisma.bid.update({
      where: { id: parseInt(bidId) },
      data: { status: 'ACCEPTED' },
    })
    
    await prisma.bid.updateMany({
      where: {
        taskId: parseInt(taskId),
        id: { not: parseInt(bidId) },
      },
      data: { status: 'REJECTED' },
    })
    
    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '选择中标失败' })
  }
}
