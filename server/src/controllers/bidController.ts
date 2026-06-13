import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const createBidSchema = z.object({
  taskId: z.number(),
  price: z.number().positive(),
  deliveryDays: z.number().int().positive(),
  proposal: z.string().min(10),
  portfolioUrls: z.string().optional(),
})

export async function createBid(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const data = createBidSchema.parse(req.body)
    
    const task = await prisma.task.findUnique({ where: { id: data.taskId } })
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }
    
    if (task.status !== 'BIDDING') {
      return res.status(400).json({ error: '任务当前不接受投标' })
    }
    
    if (task.employerId === userId) {
      return res.status(400).json({ error: '不能对自己发布的任务投标' })
    }
    
    const existingBid = await prisma.bid.findUnique({
      where: {
        taskId_providerId: {
          taskId: data.taskId,
          providerId: userId,
        },
      },
    })
    
    if (existingBid) {
      return res.status(400).json({ error: '您已经对该任务投过标了' })
    }
    
    const bid = await prisma.bid.create({
      data: {
        taskId: data.taskId,
        providerId: userId,
        price: data.price,
        deliveryDays: data.deliveryDays,
        proposal: data.proposal,
        portfolioUrls: data.portfolioUrls,
      },
      include: {
        provider: {
          select: { id: true, username: true, avatar: true, rating: true, level: true, skills: true },
        },
      },
    })
    
    res.status(201).json(bid)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error(error)
    res.status(500).json({ error: '投标失败' })
  }
}

export async function getBidsByTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params
    
    const bids = await prisma.bid.findMany({
      where: { taskId: parseInt(taskId) },
      include: {
        provider: {
          select: { id: true, username: true, avatar: true, rating: true, level: true, skills: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    res.json(bids)
  } catch {
    res.status(500).json({ error: '获取投标列表失败' })
  }
}

export async function getMyBids(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { status, page = '1', pageSize = '20' } = req.query
    
    const where: any = { providerId: userId }
    if (status) where.status = status
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        skip,
        take,
        include: {
          task: {
            include: {
              skills: true,
              employer: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bid.count({ where }),
    ])
    
    res.json({
      data: bids,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })
  } catch {
    res.status(500).json({ error: '获取我的投标失败' })
  }
}

export async function withdrawBid(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const bid = await prisma.bid.findUnique({ where: { id: parseInt(id) } })
    
    if (!bid) {
      return res.status(404).json({ error: '投标不存在' })
    }
    
    if (bid.providerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    if (bid.status !== 'PENDING') {
      return res.status(400).json({ error: '当前状态不能撤回' })
    }
    
    const updatedBid = await prisma.bid.update({
      where: { id: parseInt(id) },
      data: { status: 'WITHDRAWN' },
    })
    
    res.json(updatedBid)
  } catch {
    res.status(500).json({ error: '撤回投标失败' })
  }
}
