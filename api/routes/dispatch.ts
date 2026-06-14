import { Router, type Request, type Response } from 'express'
import { dispatchMapData, dispatchOrders, dispatchWorkers, orders, workers, serviceNodes } from '../../src/mock/data.js'
import type { ServiceNode } from '../../src/types/index.js'

const router = Router()

let nextNodeId = 200

router.get('/map', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: dispatchMapData,
  })
})

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query

  let pending = dispatchOrders

  if (status === 'pending') {
    pending = dispatchOrders.filter(o => {
      const fullOrder = orders.find(fo => fo.id === o.id)
      return fullOrder ? fullOrder.status === 'pending' : true
    })
  }

  res.status(200).json({
    success: true,
    data: pending,
  })
})

router.get('/workers', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query

  let result = [...dispatchWorkers]

  if (status) {
    result = result.filter(w => w.status === status)
  }

  const withDetails = result.map(w => {
    const fullWorker = workers.find(fw => fw.id === w.id)
    return {
      ...w,
      phone: fullWorker?.phone,
      skills: fullWorker?.skills || [],
      age: fullWorker?.age,
      experience_years: fullWorker?.experience_years,
    }
  })

  res.status(200).json({
    success: true,
    data: withDetails,
  })
})

router.post('/assign', async (req: Request, res: Response): Promise<void> => {
  const { order_id, worker_id } = req.body as { order_id: number; worker_id: number }

  if (!order_id || !worker_id) {
    res.status(400).json({
      success: false,
      error: '订单ID和阿姨ID不能为空',
    })
    return
  }

  const order = orders.find(o => o.id === order_id)
  const worker = workers.find(w => w.id === worker_id)

  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  if (!worker) {
    res.status(404).json({
      success: false,
      error: '阿姨不存在',
    })
    return
  }

  order.worker_id = worker_id
  order.status = 'assigned'
  order.status_label = '已派单'
  order.worker_name = worker.real_name
  order.worker_avatar = worker.avatar
  order.worker_phone = worker.phone

  const node: ServiceNode = {
    id: nextNodeId++,
    order_id,
    node_type: 'assigned',
    node_label: '已派单',
    node_time: new Date().toISOString(),
    remark: `系统已派单给${worker.real_name}`,
  }
  serviceNodes.push(node)

  const dispatchWorker = dispatchWorkers.find(w => w.id === worker_id)
  if (dispatchWorker) {
    dispatchWorker.status = 'busy'
  }

  res.status(200).json({
    success: true,
    data: order,
  })
})

router.post('/auto-dispatch', async (req: Request, res: Response): Promise<void> => {
  const { order_id } = req.body as { order_id: number }

  if (!order_id) {
    res.status(400).json({
      success: false,
      error: '订单ID不能为空',
    })
    return
  }

  const order = orders.find(o => o.id === order_id)
  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  const idleWorkers = dispatchWorkers.filter(w => w.status === 'idle')
  if (idleWorkers.length === 0) {
    res.status(400).json({
      success: false,
      error: '暂无空闲阿姨',
    })
    return
  }

  idleWorkers.sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.lng - order.lng, 2) + Math.pow(a.lat - order.lat, 2))
    const distB = Math.sqrt(Math.pow(b.lng - order.lng, 2) + Math.pow(b.lat - order.lat, 2))
    return distA - distB
  })

  const bestWorker = idleWorkers[0]
  const worker = workers.find(w => w.id === bestWorker.id)

  if (!worker) {
    res.status(404).json({
      success: false,
      error: '阿姨不存在',
    })
    return
  }

  order.worker_id = bestWorker.id
  order.status = 'assigned'
  order.status_label = '已派单'
  order.worker_name = worker.real_name
  order.worker_avatar = worker.avatar
  order.worker_phone = worker.phone

  const node: ServiceNode = {
    id: nextNodeId++,
    order_id,
    node_type: 'assigned',
    node_label: '已派单',
    node_time: new Date().toISOString(),
    remark: `智能调度已派单给${worker.real_name}`,
  }
  serviceNodes.push(node)

  ;(bestWorker.status as 'idle' | 'busy') = 'busy'

  res.status(200).json({
    success: true,
    data: {
      order,
      assigned_worker: bestWorker,
    },
  })
})

export default router
