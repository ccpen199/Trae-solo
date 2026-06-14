import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const createEscrowSchema = z.object({
  taskId: z.number(),
  amount: z.number().positive(),
})

const releasePaymentSchema = z.object({
  milestoneId: z.number(),
})

export async function createEscrow(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    
    const data = createEscrowSchema.parse(req.body)
    
    const task = await prisma.task.findUnique({ 
      where: { id: data.taskId },
      include: { selectedBid: true },
    })
    
    if (!task || task.employerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (task.status !== 'SELECTED' && task.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: '任务状态不允许托管' })
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId! } })
    
    if (!user || user.balance < data.amount) {
      return res.status(400).json({ success: false, error: '余额不足' })
    }
    
    const existingEscrow = await prisma.payment.findFirst({
      where: {
        taskId: data.taskId,
        type: 'ESCROW_DEPOSIT',
        status: 'COMPLETED',
      },
    })
    
    if (existingEscrow) {
      return res.status(400).json({ success: false, error: '该任务已进行资金托管' })
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId! },
        data: {
          balance: { decrement: data.amount },
          frozenBalance: { increment: data.amount },
        },
      })
      
      await tx.task.update({
        where: { id: data.taskId },
        data: { 
          escrowAmount: { increment: data.amount },
          totalAmount: data.amount,
        },
      })
      
      await tx.payment.create({
        data: {
          userId: userId!,
          taskId: data.taskId,
          type: 'ESCROW_DEPOSIT',
          amount: data.amount,
          status: 'COMPLETED',
          remark: '任务资金托管',
          paidAt: new Date(),
        },
      })
    })
    
    res.json({ success: true, data: { message: '资金托管成功', amount: data.amount } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '资金托管失败' })
  }
}

export async function releasePayment(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    
    const data = releasePaymentSchema.parse(req.body)
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: data.milestoneId },
      include: { task: { include: { selectedBid: true } } },
    })
    
    if (!milestone) {
      return res.status(404).json({ success: false, error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (milestone.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: '请先验收里程碑' })
    }
    
    if (milestone.status === 'PAID') {
      return res.status(400).json({ success: false, error: '该里程碑已付款' })
    }
    
    const providerId = milestone.task.selectedBid?.providerId
    if (!providerId) {
      return res.status(400).json({ success: false, error: '未找到服务商' })
    }
    
    if (milestone.task.escrowAmount < milestone.amount) {
      return res.status(400).json({ success: false, error: '托管金额不足' })
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
        where: { id: data.milestoneId },
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
          milestoneId: data.milestoneId,
          type: 'MILESTONE_RELEASE',
          amount: providerReceive,
          status: 'COMPLETED',
          remark: `里程碑「${milestone.title}」款项释放（平台服务费5%）`,
          paidAt: new Date(),
        },
      })
      
      await tx.payment.create({
        data: {
          userId: userId!,
          taskId: milestone.taskId,
          milestoneId: data.milestoneId,
          type: 'PLATFORM_FEE',
          amount: platformFee,
          status: 'COMPLETED',
          remark: `里程碑「${milestone.title}」平台服务费`,
          paidAt: new Date(),
        },
      })
    })
    
    res.json({ 
      success: true, 
      data: { 
        message: '款项已释放', 
        amount: milestone.amount,
        platformFee,
        providerReceive,
      } 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '释放款项失败' })
  }
}

export async function getPayments(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
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
          milestone: { select: { id: true, title: true } },
        },
      }),
      prisma.payment.count({ where }),
    ])
    
    res.json({
      success: true,
      data: {
        items: payments,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    })
  } catch {
    res.status(500).json({ success: false, error: '获取交易记录失败' })
  }
}

export async function getWallet(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const [user, recentPayments, income, expense] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true, frozenBalance: true },
      }),
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.payment.aggregate({
        where: { 
          userId, 
          type: { in: ['MILESTONE_RELEASE', 'REFUND'] },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { 
          userId, 
          type: { in: ['ESCROW_DEPOSIT', 'WITHDRAWAL', 'PLATFORM_FEE'] },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
    ])
    
    res.json({
      success: true,
      data: {
        balance: user?.balance || 0,
        frozenBalance: user?.frozenBalance || 0,
        totalIncome: income._sum.amount || 0,
        totalExpense: expense._sum.amount || 0,
        recentTransactions: recentPayments,
      },
    })
  } catch {
    res.status(500).json({ success: false, error: '获取钱包信息失败' })
  }
}
