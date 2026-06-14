import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { getFileUrl } from '../middleware/upload'

const createMilestoneSchema = z.object({
  milestones: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().positive(),
    percentage: z.number().positive(),
    deadline: z.string().optional(),
  })),
})

export async function createMilestones(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    
    const data = createMilestoneSchema.parse(req.body)
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    
    if (task.employerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    const totalAmount = data.milestones.reduce((sum, m) => sum + m.amount, 0)
    const totalPercentage = data.milestones.reduce((sum, m) => sum + m.percentage, 0)
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({ success: false, error: '里程碑百分比之和必须为100%' })
    }
    
    const createdMilestones = await Promise.all(
      data.milestones.map((m, index) =>
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
    
    res.status(201).json({ success: true, data: createdMilestones })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '创建里程碑失败' })
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
        fileVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            uploader: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    })
    
    res.json({ success: true, data: milestones })
  } catch {
    res.status(500).json({ success: false, error: '获取里程碑失败' })
  }
}

export async function getMilestoneById(req: Request, res: Response) {
  try {
    const { milestoneId } = req.params
    const userId = req.user?.userId
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: {
        task: {
          include: {
            employer: { select: { id: true, username: true } },
            selectedBid: {
              include: {
                provider: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
        approver: { select: { id: true, username: true } },
        fileVersions: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    })
    
    if (!milestone) {
      return res.status(404).json({ success: false, error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId && milestone.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限查看' })
    }
    
    res.json({ success: true, data: milestone })
  } catch {
    res.status(500).json({ success: false, error: '获取里程碑详情失败' })
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
      return res.status(404).json({ success: false, error: '里程碑不存在' })
    }
    
    const task = milestone.task
    if (task.selectedBidId) {
      const bid = await prisma.bid.findUnique({ where: { id: task.selectedBidId } })
      if (!bid || bid.providerId !== userId) {
        return res.status(403).json({ success: false, error: '无权限操作' })
      }
    }
    
    if (milestone.status !== 'PENDING' && milestone.status !== 'REJECTED') {
      return res.status(400).json({ success: false, error: '当前状态不能提交' })
    }
    
    const updated = await prisma.milestone.update({
      where: { id: parseInt(milestoneId) },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        description: description || milestone.description,
      },
    })
    
    if (task.status === 'SELECTED') {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      })
    }
    
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '提交里程碑失败' })
  }
}

export async function approveMilestone(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { milestoneId } = req.params
    const { feedback, rating } = req.body
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { task: { include: { selectedBid: true } } },
    })
    
    if (!milestone) {
      return res.status(404).json({ success: false, error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, error: '当前状态不能验收' })
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
    
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '验收里程碑失败' })
  }
}

export async function rejectMilestone(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { milestoneId } = req.params
    const { feedback } = req.body
    
    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ success: false, error: '请填写驳回原因' })
    }
    
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { task: true },
    })
    
    if (!milestone) {
      return res.status(404).json({ success: false, error: '里程碑不存在' })
    }
    
    if (milestone.task.employerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (milestone.status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, error: '当前状态不能驳回' })
    }
    
    const updated = await prisma.milestone.update({
      where: { id: parseInt(milestoneId) },
      data: {
        status: 'REJECTED',
        feedback,
      },
    })
    
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: '驳回失败' })
  }
}

export async function uploadFileVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { milestoneId, description, isFinal } = req.body
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' })
    }
    
    const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } })
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
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
    
    res.status(201).json({ success: true, data: fileVersion })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '上传文件失败' })
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
    
    res.json({ success: true, data: versions })
  } catch {
    res.status(500).json({ success: false, error: '获取文件版本失败' })
  }
}

export async function addCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { fileVersionId, type, content, positionX, positionY, pageNumber } = req.body
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: '请输入内容' })
    }
    
    const collaboration = await prisma.collaboration.create({
      data: {
        taskId: parseInt(taskId),
        userId: userId!,
        fileVersionId: fileVersionId ? parseInt(fileVersionId) : null,
        type: type || 'comment',
        content: content.trim(),
        positionX: positionX ? parseFloat(positionX) : null,
        positionY: positionY ? parseFloat(positionY) : null,
        pageNumber: pageNumber ? parseInt(pageNumber) : null,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.status(201).json({ success: true, data: collaboration })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '添加标注失败' })
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
    
    res.json({ success: true, data: collaborations })
  } catch {
    res.status(500).json({ success: false, error: '获取标注列表失败' })
  }
}

export async function resolveCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId, collaborationId } = req.params
    const { resolved } = req.body
    
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: parseInt(collaborationId) },
      include: { task: true },
    })
    
    if (!collaboration) {
      return res.status(404).json({ success: false, error: '标注不存在' })
    }
    
    if (collaboration.taskId !== parseInt(taskId)) {
      return res.status(400).json({ success: false, error: '标注不属于此任务' })
    }
    
    const task = collaboration.task
    const isEmployer = task.employerId === userId
    const isSelectedProvider = task.selectedBidId ? (
      await prisma.bid.findUnique({ where: { id: task.selectedBidId } })
    )?.providerId === userId : false
    
    if (!isEmployer && !isSelectedProvider) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    const updated = await prisma.collaboration.update({
      where: { id: parseInt(collaborationId) },
      data: { resolved: !!resolved },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '更新标注状态失败' })
  }
}
