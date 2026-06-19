import { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import { getAllTasks, getAnnotators } from '../data/database'

export async function getOverview(req: AuthRequest, res: Response) {
  try {
    const tasks = getAllTasks()
    const annotators = getAnnotators()

    const totalUnits = tasks.reduce((sum, t) => sum + t.totalUnits, 0)
    const completedUnits = tasks.reduce((sum, t) => sum + t.completedUnits, 0)
    const totalReward = tasks.reduce((sum, t) => sum + t.rewardPool, 0)
    const avgAccuracy = 92.3

    const overview = {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status === 'in_progress' || t.status === 'published').length,
      totalUnits,
      completedUnits,
      totalReward,
      avgAccuracy,
      totalAnnotators: annotators.length,
      completionRate: (completedUnits / totalUnits) * 100,
    }

    res.json({
      success: true,
      data: overview,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getProductivityData(req: AuthRequest, res: Response) {
  try {
    const { days = 30 } = req.query
    const daysNum = parseInt(days as string)

    const data = Array.from({ length: daysNum }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (daysNum - 1 - i))
      return {
        date: date.toISOString().split('T')[0],
        completed: Math.floor(Math.random() * 500) + 200,
        accuracy: Math.random() * 10 + 87,
        revenue: Math.floor(Math.random() * 2000) + 500,
        annotators: Math.floor(Math.random() * 50) + 30,
      }
    })

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getAnnotatorAnalytics(req: AuthRequest, res: Response) {
  try {
    const annotators = getAnnotators()

    const radarData = annotators.slice(0, 5).map(a => ({
      id: a.id,
      name: a.name,
      accuracy: a.accuracy,
      speed: Math.floor(Math.random() * 20) + 75,
      consistency: Math.floor(Math.random() * 15) + 80,
      quality: Math.floor(Math.random() * 10) + 88,
      efficiency: Math.floor(Math.random() * 25) + 70,
    }))

    const leaderboard = [...annotators].sort((a, b) => b.accuracy - a.accuracy).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      accuracy: a.accuracy,
      totalTasks: a.totalTasks,
      level: a.level,
      points: a.points,
    }))

    res.json({
      success: true,
      data: {
        radar: radarData,
        leaderboard,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getROIAnalysis(req: AuthRequest, res: Response) {
  try {
    const tasks = getAllTasks()

    const roiData = tasks.map(task => ({
      id: task.id,
      name: task.title,
      cost: task.rewardPool,
      value: task.rewardPool * (1 + Math.random() * 0.5 + 0.3),
      roi: Math.floor(Math.random() * 50) + 30,
      completedUnits: task.completedUnits,
      totalUnits: task.totalUnits,
    }))

    const summary = {
      totalInvestment: tasks.reduce((sum, t) => sum + t.rewardPool, 0),
      totalValue: tasks.reduce((sum, t) => sum + t.rewardPool * 1.6, 0),
      averageROI: 45.2,
      bestTask: '城市街景实例分割项目',
      worstTask: '电商商品图像分割',
    }

    res.json({
      success: true,
      data: {
        tasks: roiData,
        summary,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getQualityAnalytics(req: AuthRequest, res: Response) {
  try {
    const qualityData = {
      averageAccuracy: 92.3,
      consistencyRate: 88.7,
      adversarialDetectionRate: 95.2,
      avgReviewTime: 4.2,
      distribution: {
        excellent: 35,
        good: 40,
        acceptable: 18,
        poor: 7,
      },
      trend: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        accuracy: Math.random() * 5 + 90,
        consistency: Math.random() * 8 + 85,
      })),
    }

    res.json({
      success: true,
      data: qualityData,
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

export async function getForecast(req: AuthRequest, res: Response) {
  try {
    const { days = 14 } = req.query
    const daysNum = parseInt(days as string)

    const actual = Array.from({ length: Math.floor(daysNum * 0.6) }, (_, i) => ({
      day: `第${i + 1}天`,
      actual: Math.floor(300 + Math.sin(i / 3) * 50 + Math.random() * 30),
      forecast: null as number | null,
    }))

    const forecast = Array.from({ length: Math.ceil(daysNum * 0.4) }, (_, i) => ({
      day: `第${actual.length + i + 1}天`,
      actual: null as number | null,
      forecast: Math.floor(350 + i * 5 + Math.random() * 20),
    }))

    const forecastData = [...actual, ...forecast]

    const prediction = {
      nextDayCompletion: 380,
      nextWeekCompletion: 2650,
      nextMonthCompletion: 11200,
      confidence: 85,
    }

    res.json({
      success: true,
      data: {
        chart: forecastData,
        prediction,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}
