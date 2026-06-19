import { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import {
  getAllTasks,
  getTaskById as getTaskByIdDb,
  getUnitsByTaskId,
  addTask,
  updateTask as updateTaskDb,
  addAnnotation,
  getAnnotators,
  generateId,
} from '../data/database'
import type { Task, Annotation, AnnotationData } from '../types'

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const { status, type, search } = req.query
    let tasks = getAllTasks()

    if (status) {
      tasks = tasks.filter(t => t.status === String(status))
    }
    if (type) {
      tasks = tasks.filter(t => t.type === String(type))
    }
    if (search) {
      const searchStr = String(search).toLowerCase()
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchStr) ||
        t.description.toLowerCase().includes(searchStr)
      )
    }

    res.json({
      success: true,
      data: tasks,
      total: tasks.length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getTaskById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const task = getTaskByIdDb(String(id))

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const taskData = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const newTask: Task = {
      id: generateId(),
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      status: 'draft',
      publisherId: userId,
      publisherName: taskData.publisherName || '发布者',
      totalUnits: taskData.totalUnits || 100,
      completedUnits: 0,
      unitPrice: taskData.unitPrice || 0.5,
      rewardPool: (taskData.totalUnits || 100) * (taskData.unitPrice || 0.5),
      requiredSkillLevel: taskData.requiredSkillLevel || 1,
      consistencyThreshold: taskData.consistencyThreshold || 0.8,
      annotationPerUnit: taskData.annotationPerUnit || 2,
      deadline: taskData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      tags: taskData.tags || [],
      qualityConfig: {
        samplingRate: taskData.samplingRate || 0.1,
        minConsistency: taskData.minConsistency || 0.75,
        adversarialEnabled: taskData.adversarialEnabled !== undefined ? taskData.adversarialEnabled : true,
        adversarialRatio: taskData.adversarialRatio || 0.05,
        reviewThreshold: taskData.reviewThreshold || 0.7,
      },
    }

    addTask(newTask)

    res.status(201).json({
      success: true,
      data: newTask,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const updates = req.body

    const task = updateTaskDb(String(id), updates)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    res.json({ success: true, message: 'Task deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getTaskUnits(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const units = getUnitsByTaskId(String(id))

    res.json({
      success: true,
      data: units,
      total: units.length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function submitAnnotation(req: AuthRequest, res: Response) {
  try {
    const { unitId } = req.params
    const { data } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const annotation: Annotation = {
      id: generateId(),
      unitId: String(unitId),
      annotatorId: userId,
      annotatorName: req.body.annotatorName || '标注员',
      data: data as AnnotationData,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }

    addAnnotation(String(unitId), annotation)

    res.json({
      success: true,
      data: annotation,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getRecommendedTasks(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id
    const allTasks = getAllTasks()

    const recommended = allTasks
      .filter(t => t.status === 'published' || t.status === 'in_progress')
      .sort((a, b) => b.unitPrice - a.unitPrice)
      .slice(0, 5)

    res.json({
      success: true,
      data: recommended,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
