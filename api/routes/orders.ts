import { Router, type Request, type Response } from 'express'
import { orders, serviceNodes, compensations, workers } from '../../src/mock/data.js'
import type { Order, OrderStatus, ServiceNode, Compensation, ServiceType, NodeType } from '../../src/types/index.js'

const router = Router()

let nextOrderId = 2000
let nextNodeId = 100
let nextCompensationId = 100

const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待派单',
  assigned: '已派单',
  accepted: '已接单',
  departing: '已出发',
  arrived: '已到达',
  servicing: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  compensated: '已赔付',
}

const nodeLabelMap: Record<NodeType, string> = {
  order_created: '订单创建',
  assigned: '已派单',
  accepted: '已接单',
  departing: '已出发',
  arrived: '已到达',
  servicing: '服务中',
  completed: '已完成',
}

const serviceTypeLabelMap: Record<ServiceType, string> = {
  cleaning: '日常保洁',
  babysitting: '育婴师',
  cooking: '上门做饭',
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { user_id, worker_id, status } = req.query

  let filtered = [...orders]

  if (user_id) {
    filtered = filtered.filter(o => o.user_id === parseInt(user_id as string, 10))
  }
  if (worker_id) {
    filtered = filtered.filter(o => o.worker_id === parseInt(worker_id as string, 10))
  }
  if (status) {
    filtered = filtered.filter(o => o.status === status)
  }

  res.status(200).json({
    success: true,
    data: filtered,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const order = orders.find(o => o.id === id)

  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  const nodes = serviceNodes.filter(n => n.order_id === id)
  const comp = compensations.find(c => c.order_id === id)

  res.status(200).json({
    success: true,
    data: {
      ...order,
      service_nodes: nodes,
      compensation: comp || null,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { user_id, service_type, address, lng, lat, start_time, duration_hours, amount, remark } = req.body

  if (!user_id || !service_type || !address || !start_time || !duration_hours || !amount) {
    res.status(400).json({
      success: false,
      error: '缺少必要参数',
    })
    return
  }

  const newOrder: Order = {
    id: nextOrderId++,
    user_id,
    service_type: service_type as ServiceType,
    service_type_label: serviceTypeLabelMap[service_type as ServiceType] || service_type,
    address,
    lng: lng || 116.476,
    lat: lat || 39.998,
    start_time,
    duration_hours,
    status: 'pending',
    status_label: '待派单',
    amount,
    remark,
    created_at: new Date().toISOString(),
  }

  orders.push(newOrder)

  const node: ServiceNode = {
    id: nextNodeId++,
    order_id: newOrder.id,
    node_type: 'order_created',
    node_label: '订单创建',
    node_time: new Date().toISOString(),
    remark: '用户下单成功',
  }
  serviceNodes.push(node)

  res.status(201).json({
    success: true,
    data: newOrder,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const order = orders.find(o => o.id === id)

  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  const { address, start_time, duration_hours, remark } = req.body

  if (address) order.address = address
  if (start_time) order.start_time = start_time
  if (duration_hours) order.duration_hours = duration_hours
  if (remark !== undefined) order.remark = remark

  res.status(200).json({
    success: true,
    data: order,
  })
})

router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const order = orders.find(o => o.id === id)

  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  const { status, worker_id } = req.body as { status: OrderStatus; worker_id?: number }

  if (!status) {
    res.status(400).json({
      success: false,
      error: '状态不能为空',
    })
    return
  }

  order.status = status
  order.status_label = statusLabelMap[status] || status

  if (worker_id) {
    const worker = workers.find(w => w.id === worker_id)
    order.worker_id = worker_id
    if (worker) {
      order.worker_name = worker.real_name
      order.worker_avatar = worker.avatar
      order.worker_phone = worker.phone
    }
  }

  const nodeType = status as NodeType
  if (nodeLabelMap[nodeType]) {
    const node: ServiceNode = {
      id: nextNodeId++,
      order_id: id,
      node_type: nodeType,
      node_label: nodeLabelMap[nodeType],
      node_time: new Date().toISOString(),
    }
    serviceNodes.push(node)
  }

  res.status(200).json({
    success: true,
    data: order,
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const idx = orders.findIndex(o => o.id === id)

  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  orders.splice(idx, 1)

  res.status(200).json({
    success: true,
    message: '订单已删除',
  })
})

router.get('/:id/nodes', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const nodes = serviceNodes.filter(n => n.order_id === id)

  res.status(200).json({
    success: true,
    data: nodes,
  })
})

router.post('/:id/compensations', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const order = orders.find(o => o.id === id)

  if (!order) {
    res.status(404).json({
      success: false,
      error: '订单不存在',
    })
    return
  }

  const { reason, refund_amount, coupon_amount } = req.body

  if (!reason || refund_amount === undefined) {
    res.status(400).json({
      success: false,
      error: '缺少必要参数',
    })
    return
  }

  const comp: Compensation = {
    id: nextCompensationId++,
    order_id: id,
    reason,
    refund_amount,
    coupon_amount: coupon_amount || 0,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  compensations.push(comp)

  res.status(201).json({
    success: true,
    data: comp,
  })
})

router.get('/:id/compensations', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const comp = compensations.find(c => c.order_id === id)

  res.status(200).json({
    success: true,
    data: comp || null,
  })
})

router.patch('/compensations/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const comp = compensations.find(c => c.id === id)

  if (!comp) {
    res.status(404).json({
      success: false,
      error: '赔付记录不存在',
    })
    return
  }

  const { status } = req.body as { status: 'pending' | 'approved' | 'rejected' }

  if (status) {
    comp.status = status
    if (status === 'approved') {
      const order = orders.find(o => o.id === comp.order_id)
      if (order) {
        order.status = 'compensated'
        order.status_label = '已赔付'
      }
    }
  }

  res.status(200).json({
    success: true,
    data: comp,
  })
})

export default router
