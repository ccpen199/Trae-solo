import { Router, type Request, type Response } from 'express'
import { mockTrafficEvents, mockBusPredictions } from '../data/mock.js'
import type { TrafficEvent, BusPrediction } from '../../shared/types.js'

const router = Router()

router.get('/events', (req: Request, res: Response): void => {
  try {
    const { type, severity } = req.query
    let events: TrafficEvent[] = [...mockTrafficEvents]

    if (type) {
      events = events.filter((e) => e.type === type)
    }
    if (severity) {
      events = events.filter((e) => e.severity === severity)
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    res.json({
      success: true,
      data: events,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取交通事件列表失败',
    })
  }
})

router.get('/bus/predictions', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockBusPredictions as BusPrediction[],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取公交预测列表失败',
    })
  }
})

router.get('/bus/:routeId/stop/:stopId', (req: Request, res: Response): void => {
  try {
    const { routeId, stopId } = req.params
    const prediction = mockBusPredictions.find(
      (p) => p.routeId === routeId,
    )

    if (!prediction) {
      res.json({
        success: true,
        data: {
          routeId,
          routeName: `${routeId}路`,
          stopName: stopId,
          predictions: [],
        } as BusPrediction,
      })
      return
    }

    res.json({
      success: true,
      data: prediction as BusPrediction,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取公交到站预测失败',
    })
  }
})

export default router
