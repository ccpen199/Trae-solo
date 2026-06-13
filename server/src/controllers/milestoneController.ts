import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { getFileUrl } from '../middleware/upload'

export async function createMilestones(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { milestones } = req.body
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }
    
    if (task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    const createdMilestones = await Promise.all(
      milestones.map((m: any, index: number) =>
        prisma.milestone.create({
          data: {
            taskId: parseInt(taskId),
            title: m.title,
            description: m.description,
            amount: m.amount,
            percentage: m.percentage,
            orderIndex: index,
            deadline: m.deadline ? new Date(m.deadline) : null,
          },
        })
      )
    )
    
    res.status(201).json(createdMilestones)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '创建里程碑失败' })
  }
}

export async function getMilestones(req: Request, res: Response) {
  try {
    const { taskId } = req.params
    
    const milestones = await prisma.milestone.findMany({
      where: { taskId: parseInt(taskId) },
      orderBy: { orderIndex: 'asc' },
      include: {
        approver: { select: { id: true, username: true } },
      },
    })
    
    res.json(milestones)
  } catch {
    res.status(500).json({ error: '获取里程碑失败' })
  }
}

export async function submitMilestone(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { milestoneId } = req.params
    const { description } = req.body
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { task: true },
    })
    
    if (!milestone) {
      return res.status(404).json({ error: '里程碑不存在' })
    }
    
    const task = milestone.task
    if (task.selectedBidId) {
      const bid = await prisma.bid.findUnique({ where: { id: task.selectedBidId } })
      if (!bid || bid.providerId !== userId) {
        return res.status(403).json({ error: '无权限操作' })
      }
    }
    
    if (milestone.status !== 'PENDING' && milestone.status !== 'REJECTED') {
      return res.status(400).json({ error: '当前状态不能提交' })
    }
    
    const updated = await prisma.milestone.update({
      where: { id: parseInt(milestoneId) },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })
    
    if (task.status === 'SELECTED') {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      })
    }
    
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '提交里程碑失败' })
  }
}

export async function approveMilestone(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { milestoneId } = req.params
    const { feedback, rating } = req.body
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { task: true },
    })
    
    if (!milestone) {
      return res.status(404).json({ error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: '当前状态不能验收' })
    }
    
    const updated = await prisma.milestone.update({
      where: { id: parseInt(milestoneId) },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approverId: userId,
        feedback,
        rating,
      },
    })
    
    await prisma.payment.create({
      data: {
        userId: milestone.task.employerId,
        taskId: milestone.taskId,
        milestoneId: parseInt(milestoneId),
        type: 'MILESTONE_RELEASE',
        amount: milestone.amount,
        status: 'COMPLETED',
        remark: `里程碑「${milestone.title}」验收付款`,
        paidAt: new Date(),
      },
    })
    
    const allMilestones = await prisma.milestone.findMany({
      where: { taskId: milestone.taskId },
    })
    
    const allApproved = allMilestones.every(m => m.status === 'APPROVED' || m.status === 'PAID')
    
    if (allApproved) {
      await prisma.task.update({
        where: { id: milestone.taskId },
        data: { status: 'COMPLETED' },
      })
      
      const task = await prisma.task.findUnique({
        where: { id: milestone.taskId },
        include: { selectedBid: true },
      })
      
      if (task?.selectedBid) {
        await prisma.user.update({
          where: { id: task.selectedBid.providerId },
          data: {
            completedOrders: { increment: 1 },
            experience: { increment: 100 },
          },
        })
      }
    }
    
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '验收里程碑失败' })
  }
}

export async function rejectMilestone(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { milestoneId } = req.params
    const { feedback } = req.body
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { task: true },
    })
    
    if (!milestone) {
      return res.status(404).json({ error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId) {
      return res.status(403).json({ error: '无权限操作' })
    }
    
    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ error: '当前状态不能驳回' })
    }
    
    const updated = await prisma.milestone.update({
      where: { id: parseInt(milestoneId) },
      data: {
        status: 'REJECTED',
        feedback,
      },
    })
    
    res.json(updated)
  } catch {
    res.status(500).json({ error: '驳回失败' })
  }
}

export async function uploadFileVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { milestoneId, description, isFinal } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' })
    }
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }
    
    const versions = await prisma.fileVersion.count({ where: { taskId: parseInt(taskId) } })
    
    const fileVersion = await prisma.fileVersion.create({
      data: {
        taskId: parseInt(taskId),
        milestoneId: milestoneId ? parseInt(milestoneId) : null,
        uploaderId: userId!,
        version: `v${versions + 1}`,
        fileName: req.file.originalname,
        fileUrl: getFileUrl(req.file.filename),
        fileSize: req.file.size,
        description,
        isFinal: isFinal || false,
      },
      include: {
        uploader: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.status(201).json(fileVersion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '上传文件失败' })
  }
}

export async function getFileVersions(req: Request, res: Response) {
  try {
    const { taskId } = req.params
    
    const versions = await prisma.fileVersion.findMany({
      where: { taskId: parseInt(taskId) },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.json(versions)
  } catch {
    res.status(500).json({ error: '获取文件版本失败' })
  }
}

export async function addCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { fileVersionId, type, content, positionX, positionY, pageNumber } = req.body
    
    const collaboration = await prisma.collaboration.create({
      data: {
        taskId: parseInt(taskId),
        userId: userId!,
        fileVersionId: fileVersionId ? parseInt(fileVersionId) : null,
        type,
        content,
        positionX,
        positionY,
        pageNumber,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.status(201).json(collaboration)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '添加标注失败' })
  }
}

export async function getCollaborations(req: Request, res: Response) {
  try {
    const { taskId } = req.params
    
    const collaborations = await prisma.collaboration.findMany({
      where: { taskId: parseInt(taskId) },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.json(collaborations)
  } catch {
    res.status(500).json({ error: '获取标注列表失败' })
  }
}
