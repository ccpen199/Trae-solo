import { Router, type Request, type Response } from 'express'
import type { TrainingRecord, WeeklyReport } from '../../shared/types.js'

const router = Router()

const mockRecords: TrainingRecord[] = [
  {
    id: 'tr1',
    petId: 'pet1',
    userId: 'user1',
    trainingType: '基础服从-坐下',
    date: '2026-06-14',
    duration: 15,
    improvement: 20,
    notes: '今天练习坐下，从完全不会到听到指令能坐下，进步很大！用了牛肉干做奖励效果特别好。',
  },
  {
    id: 'tr2',
    petId: 'pet1',
    userId: 'user1',
    trainingType: '基础服从-握手',
    date: '2026-06-13',
    duration: 20,
    improvement: 15,
    notes: '握手训练第二天，左爪已经比较熟练了，右爪还需要多练习。',
  },
  {
    id: 'tr3',
    petId: 'pet1',
    userId: 'user1',
    trainingType: '基础服从-趴下',
    date: '2026-06-12',
    duration: 18,
    improvement: 10,
    notes: '趴下还是有点抗拒，需要更多耐心。',
  },
  {
    id: 'tr4',
    petId: 'pet1',
    userId: 'user1',
    trainingType: '基础服从-等待',
    date: '2026-06-11',
    duration: 12,
    improvement: 25,
    notes: '等待时间从5秒延长到30秒，表现优秀！',
  },
  {
    id: 'tr5',
    petId: 'pet1',
    userId: 'user1',
    trainingType: '技能训练-捡球',
    date: '2026-06-10',
    duration: 25,
    improvement: 18,
    notes: '捡回来已经没问题了，但是放到手里还需要练习。',
  },
  {
    id: 'tr6',
    petId: 'pet3',
    userId: 'user2',
    trainingType: '基础服从-坐下',
    date: '2026-06-14',
    duration: 10,
    improvement: 5,
    notes: '柴犬比较有主见，需要更多耐心。',
  },
  {
    id: 'tr7',
    petId: 'pet3',
    userId: 'user2',
    trainingType: '行为纠正-不扑人',
    date: '2026-06-13',
    duration: 20,
    improvement: 30,
    notes: '今天客人来的时候明显比上次好很多，只扑了一次！',
  },
]

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  const { petId, userId, limit = 50 } = req.query
  let records = [...mockRecords]
  if (petId) {
    records = records.filter(r => r.petId === petId)
  }
  if (userId) {
    records = records.filter(r => r.userId === userId)
  }
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  records = records.slice(0, Number(limit))
  res.status(200).json({
    success: true,
    data: records,
  })
})

router.post('/records', async (req: Request, res: Response): Promise<void> => {
  const newRecord: TrainingRecord = {
    id: `tr${Date.now()}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split('T')[0],
  }
  mockRecords.unshift(newRecord)
  res.status(201).json({
    success: true,
    data: newRecord,
  })
})

router.get('/weekly-report', async (req: Request, res: Response): Promise<void> => {
  const { petId } = req.query
  let records = mockRecords
  if (petId) {
    records = records.filter(r => r.petId === petId)
  }

  const now = new Date('2026-06-15')
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)

  const weekRecords = records.filter(r => {
    const d = new Date(r.date)
    return d >= weekStart && d <= now
  })

  const totalSessions = weekRecords.length
  const totalDuration = weekRecords.reduce((sum, r) => sum + r.duration, 0)
  const averageImprovement = totalSessions > 0
    ? Math.round(weekRecords.reduce((sum, r) => sum + r.improvement, 0) / totalSessions)
    : 0

  const improvementsMap: Record<string, { total: number; count: number }> = {}
  weekRecords.forEach(r => {
    const category = r.trainingType.split('-')[0]
    if (!improvementsMap[category]) {
      improvementsMap[category] = { total: 0, count: 0 }
    }
    improvementsMap[category].total += r.improvement
    improvementsMap[category].count += 1
  })

  const improvements = Object.entries(improvementsMap).map(([category, data]) => ({
    category,
    score: Math.round(data.total / data.count),
  }))

  const suggestions: string[] = []
  if (averageImprovement < 15) {
    suggestions.push('建议增加训练频率，每周至少4-5次效果更好')
  }
  if (totalDuration < 60) {
    suggestions.push('本周训练时长偏少，建议每次训练保持15-20分钟')
  }
  suggestions.push('可以尝试使用不同种类的零食作为奖励，增加训练兴趣')
  suggestions.push('训练前确保宠物精力充沛，效果会更好')

  const report: WeeklyReport = {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: now.toISOString().split('T')[0],
    totalSessions,
    totalDuration,
    averageImprovement,
    improvements,
    suggestions,
  }

  res.status(200).json({
    success: true,
    data: report,
  })
})

router.get('/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const { petId, userId } = req.query
  let records = mockRecords
  if (petId) {
    records = records.filter(r => r.petId === petId)
  }
  if (userId) {
    records = records.filter(r => r.userId === userId)
  }

  const trainingTypes = [...new Set(records.map(r => r.trainingType.split('-')[0]))]
  const totalImprovement = records.reduce((sum, r) => sum + r.improvement, 0)
  const streakDays = Math.min(records.length, 5)

  res.status(200).json({
    success: true,
    data: {
      totalSessions: records.length,
      totalDuration: records.reduce((sum, r) => sum + r.duration, 0),
      totalImprovement,
      averageImprovement: records.length > 0 ? Math.round(totalImprovement / records.length) : 0,
      trainingTypes,
      streakDays,
    },
  })
})

export default router
