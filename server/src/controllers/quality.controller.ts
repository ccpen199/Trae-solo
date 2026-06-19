import { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import {
  getAllDisputes,
  addDispute,
  resolveDispute as resolveDisputeDb,
  getUnitsByTaskId,
  calculateJaccard,
  generateId,
} from '../data/database'
import type { Dispute } from '../types'

export async function getConsistencyResults(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.query

    const consistencyData = [
      { unitId: 'unit-1', jaccard: 0.92, annotators: ['李思琪', '陈雨萱', '王浩然'], details: [] },
      { unitId: 'unit-2', jaccard: 0.85, annotators: ['李思琪', '陈雨萱', '王浩然'], details: [] },
      { unitId: 'unit-3', jaccard: 0.78, annotators: ['李思琪', '陈雨萱', '王浩然'], details: [] },
      { unitId: 'unit-4', jaccard: 0.95, annotators: ['李思琪', '陈雨萱', '王浩然'], details: [] },
      { unitId: 'unit-5', jaccard: 0.65, annotators: ['李思琪', '陈雨萱', '王浩然'], flagged: true, details: [] },
      { unitId: 'unit-6', jaccard: 0.88, annotators: ['李思琪', '陈雨萱', '王浩然'], details: [] },
    ]

    const stats = {
      averageJaccard: 0.84,
      totalUnits: 50,
      consistentUnits: 42,
      flaggedUnits: 3,
      distribution: {
        excellent: 45,
        good: 35,
        acceptable: 15,
        poor: 5,
      },
    }

    res.json({
      success: true,
      data: consistencyData,
      stats,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getAdversarialStats(req: AuthRequest, res: Response) {
  try {
    const stats = {
      totalInjected: 25,
      detected: 23,
      accuracy: 92,
      flaggedAnnotators: 2,
      byTask: [
        { taskId: 't001', taskName: '城市街景实例分割', injected: 15, accuracy: 93.3 },
        { taskId: 't002', taskName: '语音情感识别', injected: 10, accuracy: 90 },
      ],
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getDisputes(req: AuthRequest, res: Response) {
  try {
    const { status, taskId } = req.query
    let disputes = getAllDisputes()

    if (status) {
      disputes = disputes.filter(d => d.status === status)
    }
    if (taskId) {
      disputes = disputes.filter(d => d.taskId === taskId)
    }

    res.json({
      success: true,
      data: disputes,
      total: disputes.length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function createDispute(req: AuthRequest, res: Response) {
  try {
    const { unitId, taskId, taskName, reason } = req.body
    const userId = req.user?.id

    if (!userId || !unitId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const dispute: Dispute = {
      id: generateId(),
      unitId,
      taskId,
      taskName,
      annotatorId: userId,
      annotatorName: req.body.annotatorName || '标注员',
      reason,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    }

    addDispute(dispute)

    res.status(201).json({
      success: true,
      data: dispute,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function resolveDispute(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { resolution } = req.body
    const resolverId = req.user?.id

    if (!resolverId || !resolution) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const dispute = resolveDisputeDb(String(id), resolution, resolverId)

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' })
    }

    res.json({
      success: true,
      data: dispute,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getSamplingTasks(req: AuthRequest, res: Response) {
  try {
    const samplingTasks = [
      { id: 'sample-1', unitId: 'unit-15', taskId: 't001', taskName: '城市街景项目', priority: 'high' },
      { id: 'sample-2', unitId: 'unit-23', taskId: 't001', taskName: '城市街景项目', priority: 'medium' },
      { id: 'sample-3', unitId: 'unit-8', taskId: 't002', taskName: '语音情感标注', priority: 'low' },
    ]

    res.json({
      success: true,
      data: samplingTasks,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function updateQualityConfig(req: AuthRequest, res: Response) {
  try {
    const { samplingRate, adversarialEnabled, adversarialRatio, minConsistency } = req.body

    res.json({
      success: true,
      data: {
        samplingRate,
        adversarialEnabled,
        adversarialRatio,
        minConsistency,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
