import { Router, type Request, type Response } from 'express'
import {
  mockTrafficEvents,
  mockAccidentEvents,
  mockMetroDelayEvents,
  mockBusAbnormalEvents,
  mockBusPredictions,
  mockAllBusRoutes,
  mockTrafficOverview,
} from '../data/mock.js'
import type { TrafficEvent, BusPrediction, AccidentEvent, MetroDelayEvent, TrafficOverview } from '../../shared/types.js'

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

router.get('/overview', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockTrafficOverview as TrafficOverview,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取交通态势总览失败',
    })
  }
})

router.get('/accidents', (req: Request, res: Response): void => {
  try {
    const { severity, district, status } = req.query
    let accidents = [...mockAccidentEvents]

    if (severity) {
      accidents = accidents.filter((a) => a.severity === severity)
    }
    if (district) {
      accidents = accidents.filter((a) => a.location.district === district)
    }
    if (status) {
      accidents = accidents.filter((a) => a.status === status)
    }

    accidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    res.json({
      success: true,
      data: accidents as AccidentEvent[],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取事故列表失败',
    })
  }
})

router.get('/metro/delays', (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    let delays = [...mockMetroDelayEvents]

    if (status) {
      delays = delays.filter((d) => d.status === status)
    }

    delays.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    res.json({
      success: true,
      data: delays as MetroDelayEvent[],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取地铁延误列表失败',
    })
  }
})

router.get('/bus/abnormal', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockBusAbnormalEvents,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取公交异常列表失败',
    })
  }
})

router.get('/bus/predictions', (req: Request, res: Response): void => {
  try {
    const { favorite } = req.query
    let predictions = [...mockBusPredictions]

    if (favorite === 'true') {
      predictions = predictions.filter((p) => p.isFavorite)
    }

    res.json({
      success: true,
      data: predictions as BusPrediction[],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取公交预测列表失败',
    })
  }
})

router.get('/bus/routes', (req: Request, res: Response): void => {
  try {
    const { keyword } = req.query
    let routes = [...mockAllBusRoutes]

    if (keyword && typeof keyword === 'string') {
      const kw = keyword.toLowerCase()
      routes = routes.filter(
        (r) => r.routeName.toLowerCase().includes(kw) || r.firstStop.includes(kw) || r.lastStop.includes(kw)
      )
    }

    res.json({
      success: true,
      data: routes,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '搜索公交线路失败',
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
          status: 'normal',
          crowdLevel: 'moderate',
          currentStationIndex: 0,
          totalStations: 10,
          stations: [],
          predictions: [],
          isFavorite: false,
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
