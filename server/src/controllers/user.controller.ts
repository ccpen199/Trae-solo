import { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import {
  getAnnotators as getAnnotatorsDb,
  findUserById,
} from '../data/database'
import type { Skill } from '../types'

export async function getAnnotators(req: AuthRequest, res: Response) {
  try {
    const { level, skill } = req.query
    let annotators = getAnnotatorsDb()

    if (level) {
      const levelNum = parseInt(level as string)
      annotators = annotators.filter(a => a.level >= levelNum)
    }

    if (skill) {
      annotators = annotators.filter(a =>
        a.skills.some(s => s.category === skill || s.name.includes(skill as string))
      )
    }

    res.json({
      success: true,
      data: annotators,
      total: annotators.length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const user = findUserById(String(id))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const updates = req.body
    const user = findUserById(String(id))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    Object.assign(user, updates)

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getUserStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id
    const user = findUserById(userId || '')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const stats = {
      totalTasks: user.totalTasks,
      accuracy: user.accuracy,
      level: user.level,
      points: user.points,
      skillsCount: user.skills.length,
      thisMonthEarnings: 2580,
      completedThisMonth: 156,
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getSkills(req: AuthRequest, res: Response) {
  try {
    const allSkills: Skill[] = [
      { id: 's1', name: '图像分割入门', category: 'image_segmentation', level: 1, accuracy: 95, certified: true },
      { id: 's2', name: '图像分割进阶', category: 'image_segmentation', level: 2, accuracy: 92, certified: true },
      { id: 's3', name: '图像分割专家', category: 'image_segmentation', level: 4, accuracy: 0, certified: false },
      { id: 's4', name: '语音标注基础', category: 'audio_transcription', level: 1, accuracy: 0, certified: false },
      { id: 's5', name: '语音情感识别', category: 'audio_transcription', level: 3, accuracy: 0, certified: false },
      { id: 's6', name: '医疗影像认证', category: 'medical_ct', level: 3, accuracy: 0, certified: false },
      { id: 's7', name: '视频动作识别', category: 'video_action', level: 2, accuracy: 0, certified: false },
    ]

    res.json({
      success: true,
      data: allSkills,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function certifySkill(req: AuthRequest, res: Response) {
  try {
    const { skillId } = req.params
    const userId = req.user?.id

    res.json({
      success: true,
      message: 'Skill certification submitted',
      skillId,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
