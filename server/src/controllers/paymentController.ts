import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function createEscrow(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId, amount } = req.body
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    
    if (!task || task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId! } })
    
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: '余额不足' })
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId! },
        data: {
          balance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      })
      
      await tx.task.update({
        where: { id: parseInt(taskId) },
        data: { escrowAmount: { increment: amount } },
      })
      
      await tx.payment.create({
        data: {
          userId: userId!,
          taskId: parseInt(taskId),
          type: 'ESCROW_DEPOSIT',
          amount,
          status: 'COMPLETED',
          remark: '任务资金托管',
          paidAt: new Date(),
        },
      })
    })
    
    res.json({ success: true, message: '资金托管成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '资金托管失败' })
  }
}

export async function releasePayment(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { milestoneId } = req.body
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { task: { include: { selectedBid: true } } },
    })
    
    if (!milestone) {
      return res.status(404).json({ error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    if (milestone.status !== 'APPROVED') {
      return res.status(400).json({ error: '请先验收里程碑' })
    }
    
    const providerId = milestone.task.selectedBid?.providerId
    if (!providerId) {
      return res.status(400).json({ error: '未找到服务商' })
    }
    
    const platformFee = milestone.amount * 0.05
    const providerReceive = milestone.amount - platformFee
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId! },
        data: { frozenBalance: { decrement: milestone.amount } },
      })
      
      await tx.user.update({
        where: { id: providerId },
        data: { balance: { increment: providerReceive } },
      })
      
      await tx.milestone.update({
        where: { id: parseInt(milestoneId) },
        data: { status: 'PAID', paidAt: new Date() },
      })
      
      await tx.task.update({
        where: { id: milestone.taskId },
        data: { escrowAmount: { decrement: milestone.amount } },
      })
      
      await tx.payment.create({
        data: {
          userId: providerId,
          taskId: milestone.taskId,
          milestoneId: parseInt(milestoneId),
          type: 'MILESTONE_RELEASE',
          amount: providerReceive,
          status: 'COMPLETED',
          remark: `里程碑「${milestone.title}」款项释放（平台服务费5%）`,
          paidAt: new Date(),
        },
      })
    })
    
    res.json({ success: true, message: '款项已释放' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '释放款项失败' })
  }
}

export async function getPayments(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { type, page = '1', pageSize = '20' } = req.query
    
    const where: any = { userId }
    if (type) where.type = type
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.payment.count({ where }),
    ])
    
    res.json({
      data: payments,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    })
  } catch {
    res.status(500).json({ error: '获取交易记录失败' })
  }
}

export async function getWallet(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, frozenBalance: true },
    })
    
    res.json(user)
  } catch {
    res.status(500).json({ error: '获取钱包信息失败' })
  }
}
