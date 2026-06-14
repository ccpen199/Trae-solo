import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'

const createCollaborationSchema = z.object({
  taskId: z.number(),
  fileVersionId: z.number().optional(),
  type: z.enum(['comment', 'annotation', 'suggestion']),
  content: z.string().min(1),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  pageNumber: z.number().int().positive().optional(),
})

const updateCollaborationSchema = z.object({
  content: z.string().min(1),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  pageNumber: z.number().int().positive().optional(),
})

export async function createCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const data = createCollaborationSchema.parse(req.body)
    
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
    
    if (data.fileVersionId) {
      const fileVersion = await prisma.fileVersion.findUnique({
        where: { id: data.fileVersionId },
      })
      if (!fileVersion || fileVersion.taskId !== data.taskId) {
        return res.status(404).json({ success: false, error: '文件版本不存在' })
      }
    }
    
    const collaboration = await prisma.collaboration.create({
      data: {
        taskId: data.taskId,
        userId,
        fileVersionId: data.fileVersionId || null,
        type: data.type,
        content: data.content,
        positionX: data.positionX,
        positionY: data.positionY,
        pageNumber: data.pageNumber,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    
    res.status(201).json({ success: true, data: collaboration })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '创建标注失败' })
  }
}

export async function getCollaborations(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { fileVersionId, type, resolved, page = '1', pageSize = '50' } = req.query
    
    const task = await prisma.task.findUnique({ 
      where: { id: parseInt(taskId) },
      include: { selectedBid: true },
    })
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    
    if (userId && task.employerId !== userId && task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限查看' })
    }
    
    const where: any = { taskId: parseInt(taskId) }
    if (fileVersionId) where.fileVersionId = parseInt(fileVersionId as string)
    if (type) where.type = type
    if (resolved !== undefined) where.resolved = resolved === 'true'
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [collaborations, total] = await Promise.all([
      prisma.collaboration.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          fileVersion: { select: { id: true, fileName: true, version: true } },
        },
      }),
      prisma.collaboration.count({ where }),
    ])
    
    const unresolvedCount = await prisma.collaboration.count({
      where: { ...where, resolved: false },
    })
    
    res.json({
      success: true,
      data: {
        items: collaborations,
        total,
        unresolvedCount,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取标注列表失败' })
  }
}

export async function getCollaborationById(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        fileVersion: { select: { id: true, fileName: true, version: true } },
        task: {
          select: {
            id: true,
            employerId: true,
            selectedBid: { select: { providerId: true } },
          },
        },
      },
    })
    
    if (!collaboration) {
      return res.status(404).json({ success: false, error: '标注不存在' })
    }
    
    if (userId && collaboration.task.employerId !== userId && 
        collaboration.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限查看' })
    }
    
    res.json({ success: true, data: collaboration })
  } catch {
    res.status(500).json({ success: false, error: '获取标注详情失败' })
  }
}

export async function updateCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const data = updateCollaborationSchema.parse(req.body)
    
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: parseInt(id) },
    })
    
    if (!collaboration) {
      return res.status(404).json({ success: false, error: '标注不存在' })
    }
    
    if (collaboration.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权限修改' })
    }
    
    if (collaboration.resolved) {
      return res.status(400).json({ success: false, error: '已解决的标注不能修改' })
    }
    
    const updated = await prisma.collaboration.update({
      where: { id: parseInt(id) },
      data: {
        content: data.content,
        positionX: data.positionX,
        positionY: data.positionY,
        pageNumber: data.pageNumber,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        fileVersion: { select: { id: true, fileName: true, version: true } },
      },
    })
    
    res.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '修改标注失败' })
  }
}

export async function deleteCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: parseInt(id) },
    })
    
    if (!collaboration) {
      return res.status(404).json({ success: false, error: '标注不存在' })
    }
    
    if (collaboration.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权限删除' })
    }
    
    await prisma.collaboration.delete({
      where: { id: parseInt(id) },
    })
    
    res.json({ success: true, data: { message: '删除成功' } })
  } catch {
    res.status(500).json({ success: false, error: '删除标注失败' })
  }
}

export async function resolveCollaboration(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { resolution } = req.body
    
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: parseInt(id) },
      include: {
        task: {
          select: {
            id: true,
            employerId: true,
            selectedBid: { select: { providerId: true } },
          },
        },
      },
    })
    
    if (!collaboration) {
      return res.status(404).json({ success: false, error: '标注不存在' })
    }
    
    if (collaboration.task.employerId !== userId && 
        collaboration.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    if (collaboration.resolved) {
      return res.status(400).json({ success: false, error: '该标注已解决' })
    }
    
    const updated = await prisma.collaboration.update({
      where: { id: parseInt(id) },
      data: {
        resolved: true,
        content: resolution 
          ? `${collaboration.content}\n\n【解决说明】${resolution}` 
          : collaboration.content,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        fileVersion: { select: { id: true, fileName: true, version: true } },
      },
    })
    
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: '解决标注失败' })
  }
}

export async function batchResolveCollaborations(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { ids, resolution } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: '请选择要解决的标注' })
    }
    
    const task = await prisma.task.findUnique({ 
      where: { id: parseInt(taskId) },
      include: { selectedBid: true },
    })
    
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    
    if (task.employerId !== userId && task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    const result = await prisma.collaboration.updateMany({
      where: {
        id: { in: ids.map((id: string) => parseInt(id)) },
        taskId: parseInt(taskId),
        resolved: false,
      },
      data: {
        resolved: true,
      },
    })
    
    res.json({ 
      success: true, 
      data: { 
        message: `已解决 ${result.count} 条标注`,
        count: result.count,
      } 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '批量解决标注失败' })
  }
}
