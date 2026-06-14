import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const checkOriginalitySchema = z.object({
  taskId: z.number(),
  fileVersionId: z.number().optional(),
  contentType: z.enum(['IMAGE', 'TEXT', 'CODE']),
})

const createComplaintSchema = z.object({
  toUserId: z.number(),
  taskId: z.number().optional(),
  reason: z.string().min(1),
  description: z.string().optional(),
  evidenceUrls: z.string().optional(),
})

const createDisputeSchema = z.object({
  taskId: z.number(),
  reason: z.string().min(1),
  description: z.string().min(1),
  evidenceUrls: z.string().optional(),
})

export async function calculateRiskScore(userId: number, taskId?: number) {
  let score = 0
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 0
  
  if (user.complaintCount > 0) {
    score += user.complaintCount * 10
  }
  
  if (user.totalOrders > 0) {
    const completionRate = user.completedOrders / user.totalOrders
    if (completionRate < 0.5) score += 20
  }
  
  if (taskId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (task) {
      const deadline = new Date(task.deadline)
      const now = new Date()
      const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysLeft < 0) {
        score += 30
      }
    }
  }
  
  return Math.min(100, score)
}

export async function checkFraud(req: Request, res: Response) {
  try {
    const { taskId } = req.params
    
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: { employer: true },
    })
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    
    const riskScore = await calculateRiskScore(task.employerId, parseInt(taskId))
    
    let level = 'LOW'
    if (riskScore >= 70) level = 'HIGH'
    else if (riskScore >= 40) level = 'MEDIUM'
    
    const warnings = []
    
    if (task.employer.complaintCount > 0) {
      warnings.push(`雇主历史投诉 ${task.employer.complaintCount} 次`)
    }
    
    const now = new Date()
    const deadline = new Date(task.deadline)
    if (deadline < now) {
      warnings.push('任务已超期')
    }
    
    if (task.budgetMin < 50) {
      warnings.push('预算偏低，可能存在风险')
    }
    
    await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { riskScore, fraudWarning: riskScore >= 40 },
    })
    
    await prisma.riskReport.create({
      data: {
        userId: task.employerId,
        taskId: parseInt(taskId),
        type: 'FRAUD_SUSPICION',
        level,
        title: '欺诈风险扫描',
        description: `风险评分: ${riskScore}, 风险等级: ${level}`,
        evidence: warnings.join('; '),
      },
    })
    
    res.json({ 
      success: true, 
      data: { 
        riskScore, 
        level, 
        warnings,
        taskId: parseInt(taskId),
      } 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '风控检测失败' })
  }
}

export async function checkOriginality(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const data = checkOriginalitySchema.parse(req.body)
    
    const task = await prisma.task.findUnique({ 
      where: { id: data.taskId },
      include: { selectedBid: true },
    })
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    
    if (task.employerId !== userId && task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    const similarityRate = Math.random() * 30
    
    const isPlagiarism = similarityRate > 60
    
    const check = await prisma.originalityCheck.create({
      data: {
        taskId: data.taskId,
        fileVersionId: data.fileVersionId || null,
        contentType: data.contentType,
        similarityRate: Math.round(similarityRate * 100) / 100,
        isPlagiarism,
        checkedBy: 'AUTO',
        matchedSources: isPlagiarism ? JSON.stringify([{ source: 'example.com', matchRate: 45 }]) : null,
      },
    })
    
    if (isPlagiarism && task.selectedBidId) {
      const bid = await prisma.bid.findUnique({ where: { id: task.selectedBidId } })
      if (bid) {
        await prisma.riskReport.create({
          data: {
            userId: bid.providerId,
            taskId: data.taskId,
            type: 'PLAGIARISM',
            level: 'HIGH',
            title: '作品涉嫌抄袭',
            description: `原创性检测相似度 ${similarityRate.toFixed(2)}%`,
          },
        })
        
        await prisma.user.update({
          where: { id: bid.providerId },
          data: { complaintCount: { increment: 1 } },
        })
      }
    }
    
    res.json({ 
      success: true, 
      data: {
        ...check,
        isPlagiarism,
        similarityRate: Math.round(similarityRate * 100) / 100,
      } 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '原创性检测失败' })
  }
}

export async function createComplaint(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const data = createComplaintSchema.parse(req.body)
    
    if (data.toUserId === userId) {
      return res.status(400).json({ success: false, error: '不能投诉自己' })
    }
    
    const toUser = await prisma.user.findUnique({ where: { id: data.toUserId } })
    if (!toUser) {
      return res.status(404).json({ success: false, error: '被投诉用户不存在' })
    }
    
    const complaint = await prisma.complaint.create({
      data: {
        fromUserId: userId,
        toUserId: data.toUserId,
        taskId: data.taskId || null,
        reason: data.reason,
        description: data.description,
        evidenceUrls: data.evidenceUrls,
      },
    })
    
    await prisma.riskReport.create({
      data: {
        userId: data.toUserId,
        taskId: data.taskId || null,
        type: 'COMPLAINT',
        level: 'MEDIUM',
        title: `收到投诉：${data.reason}`,
        description: data.description,
      },
    })
    
    await prisma.user.update({
      where: { id: data.toUserId },
      data: { complaintCount: { increment: 1 } },
    })
    
    res.status(201).json({ success: true, data: complaint })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '投诉提交失败' })
  }
}

export async function createDispute(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const data = createDisputeSchema.parse(req.body)
    
    const task = await prisma.task.findUnique({ 
      where: { id: data.taskId },
      include: { selectedBid: true },
    })
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    
    if (task.employerId !== userId && task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: '该任务状态不能发起争议' })
    }
    
    const existingDispute = await prisma.dispute.findUnique({
      where: { taskId: data.taskId },
    })
    
    if (existingDispute) {
      return res.status(400).json({ success: false, error: '该任务已存在争议' })
    }
    
    const dispute = await prisma.dispute.create({
      data: {
        taskId: data.taskId,
        initiatorId: userId,
        reason: data.reason,
        description: data.description,
        evidenceUrls: data.evidenceUrls,
      },
    })
    
    await prisma.task.update({
      where: { id: data.taskId },
      data: { status: 'DISPUTED' },
    })
    
    await prisma.riskReport.create({
      data: {
        userId: userId,
        taskId: data.taskId,
        type: 'DISPUTE',
        level: 'HIGH',
        title: `发起争议：${data.reason}`,
        description: data.description,
      },
    })
    
    res.status(201).json({ success: true, data: dispute })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '发起争议失败' })
  }
}

export async function uploadDisputeEvidence(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const { disputeId, description } = req.body
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' })
    }
    
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(disputeId) },
      include: { 
        task: { include: { selectedBid: true } },
      },
    })
    
    if (!dispute) {
      return res.status(404).json({ success: false, error: '争议不存在' })
    }
    
    if (dispute.task.employerId !== userId && dispute.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (dispute.status === 'RESOLVED') {
      return res.status(400).json({ success: false, error: '争议已解决，不能再上传证据' })
    }
    
    const evidence = await prisma.disputeEvidence.create({
      data: {
        disputeId: parseInt(disputeId),
        userId,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        description,
      },
    })
    
    res.status(201).json({ success: true, data: evidence })
  } catch {
    res.status(500).json({ success: false, error: '上传证据失败' })
  }
}

export async function getDispute(req: Request, res: Response) {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(id) },
      include: {
        task: { select: { id: true, title: true, employerId: true, selectedBidId: true } },
        initiator: { select: { id: true, username: true, avatar: true } },
        expert: { select: { id: true, username: true } },
        evidences: {
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    
    if (!dispute) {
      return res.status(404).json({ success: false, error: '争议不存在' })
    }
    
    if (userId && dispute.task.employerId !== userId) {
      const bid = await prisma.bid.findUnique({ where: { id: dispute.task.selectedBidId || 0 } })
      if (bid?.providerId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: '无权限查看' })
      }
    }
    
    res.json({ success: true, data: dispute })
  } catch {
    res.status(500).json({ success: false, error: '获取争议详情失败' })
  }
}

export async function getRiskReports(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const { page = '1', pageSize = '20', handled } = req.query
    
    const where: any = { userId }
    if (handled !== undefined) where.handled = handled === 'true'
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [reports, total] = await Promise.all([
      prisma.riskReport.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.riskReport.count({ where }),
    ])
    
    res.json({
      success: true,
      data: {
        items: reports,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    })
  } catch {
    res.status(500).json({ success: false, error: '获取风控报告失败' })
  }
}
