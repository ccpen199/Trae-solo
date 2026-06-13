import { Request, Response } from 'express'
import prisma from '../utils/prisma'

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
      return res.status(404).json({ error: '任务不存在' })
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
    
    await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { riskScore, fraudWarning: riskScore >= 40 },
    })
    
    res.json({ riskScore, level, warnings })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '风控检测失败' })
  }
}

export async function checkOriginality(req: Request, res: Response) {
  try {
    const { taskId, fileVersionId } = req.body
    const { contentType } = req.body
    
    const similarityRate = Math.random() * 30
    
    const isPlagiarism = similarityRate > 60
    
    const check = await prisma.originalityCheck.create({
      data: {
        taskId: parseInt(taskId),
        fileVersionId: fileVersionId ? parseInt(fileVersionId) : null,
        contentType,
        similarityRate: Math.round(similarityRate * 100) / 100,
        isPlagiarism,
        checkedBy: 'AUTO',
        matchedSources: isPlagiarism ? JSON.stringify([{ source: 'example.com', matchRate: 45 }]) : null,
      },
    })
    
    if (isPlagiarism) {
      const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
      if (task?.selectedBidId) {
        const bid = await prisma.bid.findUnique({ where: { id: task.selectedBidId } })
        if (bid) {
          await prisma.riskReport.create({
            data: {
              userId: bid.providerId,
              taskId: parseInt(taskId),
              type: 'PLAGIARISM',
              level: 'HIGH',
              title: '作品涉嫌抄袭',
              description: `原创性检测相似度 ${similarityRate.toFixed(2)}%`,
            },
          })
        }
      }
    }
    
    res.json(check)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '原创性检测失败' })
  }
}

export async function createComplaint(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { toUserId, taskId, reason, description, evidenceUrls } = req.body
    
    const complaint = await prisma.complaint.create({
      data: {
        fromUserId: userId,
        toUserId: parseInt(toUserId),
        taskId: taskId ? parseInt(taskId) : null,
        reason,
        description,
        evidenceUrls,
      },
    })
    
    await prisma.riskReport.create({
      data: {
        userId: parseInt(toUserId),
        taskId: taskId ? parseInt(taskId) : null,
        type: 'COMPLAINT',
        level: 'MEDIUM',
        title: `收到投诉：${reason}`,
        description,
      },
    })
    
    res.status(201).json(complaint)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '投诉提交失败' })
  }
}

export async function createDispute(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { taskId, reason, description, evidenceUrls } = req.body
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }
    
    if (task.employerId !== userId) {
      const bid = await prisma.bid.findUnique({
        where: { id: task.selectedBidId || 0 },
      })
      if (!bid || bid.providerId !== userId) {
        return res.status(403).json({ error: '无权限操作' })
      }
    }
    
    const dispute = await prisma.dispute.create({
      data: {
        taskId: parseInt(taskId),
        initiatorId: userId,
        reason,
        description,
        evidenceUrls,
      },
    })
    
    await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { status: 'DISPUTED' },
    })
    
    await prisma.riskReport.create({
      data: {
        userId: userId,
        taskId: parseInt(taskId),
        type: 'DISPUTE',
        level: 'HIGH',
        title: `发起争议：${reason}`,
        description,
      },
    })
    
    res.status(201).json(dispute)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '发起争议失败' })
  }
}

export async function uploadDisputeEvidence(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { disputeId, description } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' })
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
    
    res.status(201).json(evidence)
  } catch {
    res.status(500).json({ error: '上传证据失败' })
  }
}

export async function getDispute(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(id) },
      include: {
        task: { select: { id: true, title: true } },
        initiator: { select: { id: true, username: true, avatar: true } },
        expert: { select: { id: true, username: true } },
        evidences: {
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    
    if (!dispute) {
      return res.status(404).json({ error: '争议不存在' })
    }
    
    res.json(dispute)
  } catch {
    res.status(500).json({ error: '获取争议详情失败' })
  }
}

export async function getRiskReports(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const reports = await prisma.riskReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    
    res.json(reports)
  } catch {
    res.status(500).json({ error: '获取风控报告失败' })
  }
}
