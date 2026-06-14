import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { getFileUrl } from '../middleware/upload'

const updateFileVersionSchema = z.object({
  description: z.string().optional(),
  isFinal: z.boolean().optional(),
})

export async function uploadFileVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, error: '未授权' })
    
    const { taskId } = req.params
    const { milestoneId, description, isFinal } = req.body
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' })
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
    
    if (milestoneId) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: parseInt(milestoneId) },
      })
      if (!milestone || milestone.taskId !== parseInt(taskId)) {
        return res.status(404).json({ success: false, error: '里程碑不存在' })
      }
    }
    
    const versions = await prisma.fileVersion.count({ where: { taskId: parseInt(taskId) } })
    
    const fileVersion = await prisma.fileVersion.create({
      data: {
        taskId: parseInt(taskId),
        milestoneId: milestoneId ? parseInt(milestoneId) : null,
        uploaderId: userId,
        version: `v${versions + 1}`,
        fileName: req.file.originalname,
        fileUrl: getFileUrl(req.file.filename),
        fileSize: req.file.size,
        description,
        isFinal: isFinal || false,
      },
      include: {
        uploader: { select: { id: true, username: true, avatar: true } },
        milestone: { select: { id: true, title: true, status: true } },
      },
    })
    
    if (isFinal) {
      await prisma.fileVersion.updateMany({
        where: {
          taskId: parseInt(taskId),
          id: { not: fileVersion.id },
          isFinal: true,
        },
        data: { isFinal: false },
      })
    }
    
    res.status(201).json({ success: true, data: fileVersion })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '上传文件失败' })
  }
}

export async function getFileVersions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { taskId } = req.params
    const { milestoneId, isFinal, page = '1', pageSize = '20' } = req.query
    
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
    if (milestoneId) where.milestoneId = parseInt(milestoneId as string)
    if (isFinal !== undefined) where.isFinal = isFinal === 'true'
    
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)
    
    const [versions, total] = await Promise.all([
      prisma.fileVersion.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { id: true, username: true, avatar: true } },
          milestone: { select: { id: true, title: true, status: true } },
          _count: { select: { originalityChecks: true, collaborations: true } },
        },
      }),
      prisma.fileVersion.count({ where }),
    ])
    
    res.json({
      success: true,
      data: {
        items: versions,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '获取文件版本失败' })
  }
}

export async function getFileVersionById(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const fileVersion = await prisma.fileVersion.findUnique({
      where: { id: parseInt(id) },
      include: {
        uploader: { select: { id: true, username: true, avatar: true } },
        milestone: { select: { id: true, title: true, status: true } },
        task: {
          select: {
            id: true,
            employerId: true,
            selectedBid: { select: { providerId: true } },
          },
        },
        originalityChecks: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        collaborations: {
          where: { resolved: false },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    })
    
    if (!fileVersion) {
      return res.status(404).json({ success: false, error: '文件版本不存在' })
    }
    
    if (userId && fileVersion.task.employerId !== userId && 
        fileVersion.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限查看' })
    }
    
    res.json({ success: true, data: fileVersion })
  } catch {
    res.status(500).json({ success: false, error: '获取文件版本详情失败' })
  }
}

export async function updateFileVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const data = updateFileVersionSchema.parse(req.body)
    
    const fileVersion = await prisma.fileVersion.findUnique({
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
    
    if (!fileVersion) {
      return res.status(404).json({ success: false, error: '文件版本不存在' })
    }
    
    if (fileVersion.uploaderId !== userId) {
      return res.status(403).json({ success: false, error: '无权限修改' })
    }
    
    const updated = await prisma.fileVersion.update({
      where: { id: parseInt(id) },
      data: {
        description: data.description,
        isFinal: data.isFinal,
      },
      include: {
        uploader: { select: { id: true, username: true, avatar: true } },
        milestone: { select: { id: true, title: true, status: true } },
      },
    })
    
    if (data.isFinal) {
      await prisma.fileVersion.updateMany({
        where: {
          taskId: fileVersion.taskId,
          id: { not: parseInt(id) },
          isFinal: true,
        },
        data: { isFinal: false },
      })
    }
    
    res.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error(error)
    res.status(500).json({ success: false, error: '更新文件版本失败' })
  }
}

export async function deleteFileVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const fileVersion = await prisma.fileVersion.findUnique({
      where: { id: parseInt(id) },
    })
    
    if (!fileVersion) {
      return res.status(404).json({ success: false, error: '文件版本不存在' })
    }
    
    if (fileVersion.uploaderId !== userId) {
      return res.status(403).json({ success: false, error: '无权限删除' })
    }
    
    if (fileVersion.isFinal) {
      return res.status(400).json({ success: false, error: '不能删除最终版本文件' })
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.collaboration.deleteMany({
        where: { fileVersionId: parseInt(id) },
      })
      
      await tx.originalityCheck.deleteMany({
        where: { fileVersionId: parseInt(id) },
      })
      
      await tx.fileVersion.delete({
        where: { id: parseInt(id) },
      })
    })
    
    res.json({ success: true, data: { message: '删除成功' } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '删除文件版本失败' })
  }
}

export async function setFinalVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const fileVersion = await prisma.fileVersion.findUnique({
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
    
    if (!fileVersion) {
      return res.status(404).json({ success: false, error: '文件版本不存在' })
    }
    
    if (fileVersion.task.employerId !== userId && 
        fileVersion.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限操作' })
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.fileVersion.updateMany({
        where: {
          taskId: fileVersion.taskId,
          isFinal: true,
        },
        data: { isFinal: false },
      })
      
      await tx.fileVersion.update({
        where: { id: parseInt(id) },
        data: { isFinal: true },
      })
    })
    
    const updated = await prisma.fileVersion.findUnique({
      where: { id: parseInt(id) },
      include: {
        uploader: { select: { id: true, username: true, avatar: true } },
        milestone: { select: { id: true, title: true, status: true } },
      },
    })
    
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: '设置最终版本失败' })
  }
}

export async function downloadFileVersion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    
    const fileVersion = await prisma.fileVersion.findUnique({
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
    
    if (!fileVersion) {
      return res.status(404).json({ success: false, error: '文件版本不存在' })
    }
    
    if (userId && fileVersion.task.employerId !== userId && 
        fileVersion.task.selectedBid?.providerId !== userId) {
      return res.status(403).json({ success: false, error: '无权限下载' })
    }
    
    const fs = require('fs')
    const path = require('path')
    
    const uploadDir = process.env.UPLOAD_DIR || 'uploads'
    const filePath = path.join(process.cwd(), fileVersion.fileUrl)
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, fileVersion.fileName)
    } else {
      res.status(404).json({ success: false, error: '文件不存在' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: '下载文件失败' })
  }
}
