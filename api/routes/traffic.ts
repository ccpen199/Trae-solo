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
import type {
  TrafficEvent,
  BusPrediction,
  AccidentEvent,
  MetroDelayEvent,
  TrafficOverview,
  NotificationSubscription,
} from '../../shared/types.js'

const router = Router()

const eventStore = new Map<string, TrafficEvent & { read: boolean; subscribed: boolean }>()
const subscriptions: NotificationSubscription[] = []

const initEventStore = () => {
  ;[...mockTrafficEvents, ...mockAccidentEvents, ...mockMetroDelayEvents, ...mockBusAbnormalEvents].forEach((e) => {
    if (!eventStore.has(e.id)) {
      eventStore.set(e.id, {
        ...e,
        read: e.read ?? false,
        subscribed: e.subscribed ?? false,
      })
    }
  })
}

initEventStore()

const getEnrichedEvent = (event: any): any => {
  const stored = eventStore.get(event.id)
  return {
    ...event,
    read: stored?.read ?? event.read ?? false,
    subscribed: stored?.subscribed ?? event.subscribed ?? false,
  }
}

router.get('/overview', (req: Request, res: Response): void => {
  try {
    initEventStore()
    const allEvents = Array.from(eventStore.values())
    const unreadCount = allEvents.filter((e) => !e.read).length
    const subscribedCount = allEvents.filter((e) => e.subscribed).length

    const overview: TrafficOverview = {
      ...mockTrafficOverview,
      unreadCount,
      subscribedCount,
    }

    res.json({
      success: true,
      data: overview,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取交通态势总览失败',
    })
  }
})

router.get('/events', (req: Request, res: Response): void => {
  try {
    const { type, severity } = req.query
    initEventStore()

    let events: TrafficEvent[] = Array.from(eventStore.values())

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

router.post('/events/:id/read', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    initEventStore()

    const event = eventStore.get(id)
    if (!event) {
      res.status(404).json({
        success: false,
        error: '事件不存在',
      })
      return
    }

    eventStore.set(id, { ...event, read: true })

    res.json({
      success: true,
      data: { id, read: true },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '标记已读失败',
    })
  }
})

router.post('/events/:id/subscribe', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    initEventStore()

    const event = eventStore.get(id)
    if (!event) {
      res.status(404).json({
        success: false,
        error: '事件不存在',
      })
      return
    }

    eventStore.set(id, { ...event, subscribed: true })

    const newSubscription: NotificationSubscription = {
      id: `sub-${Date.now()}`,
      eventId: id,
      userId: 'user-001',
      pushChannels: ['app', 'sms'],
      createdAt: new Date().toISOString(),
    }
    subscriptions.push(newSubscription)

    res.json({
      success: true,
      data: { id, subscribed: true, subscription: newSubscription },
      message: '订阅成功，事件更新将通过推送和短信通知您',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '订阅失败',
    })
  }
})

router.post('/events/:id/unsubscribe', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    initEventStore()

    const event = eventStore.get(id)
    if (!event) {
      res.status(404).json({
        success: false,
        error: '事件不存在',
      })
      return
    }

    eventStore.set(id, { ...event, subscribed: false })

    const subIdx = subscriptions.findIndex((s) => s.eventId === id && s.userId === 'user-001')
    if (subIdx >= 0) {
      subscriptions.splice(subIdx, 1)
    }

    res.json({
      success: true,
      data: { id, subscribed: false },
      message: '已取消订阅',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '取消订阅失败',
    })
  }
})

router.get('/accidents', (req: Request, res: Response): void => {
  try {
    const { severity, district, status } = req.query
    let accidents = [...mockAccidentEvents].map(getEnrichedEvent)

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
    let delays = [...mockMetroDelayEvents].map(getEnrichedEvent)

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
    const events = mockBusAbnormalEvents.map(getEnrichedEvent)
    res.json({
      success: true,
      data: events,
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
