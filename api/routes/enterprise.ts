import { Router, type Request, type Response } from 'express'
import { enterprises, servicePackages, batchOrders, bills, orders, workers } from '../../src/mock/data.js'
import type { Enterprise, BatchOrder, Bill, ServiceType, Order } from '../../src/types/index.js'

const router = Router()

let nextEnterpriseId = 100
let nextBatchOrderId = 100
let nextBillId = 100

const serviceTypeLabelMap: Record<ServiceType, string> = {
  cleaning: '日常保洁',
  babysitting: '育婴师',
  cooking: '上门做饭',
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: enterprises,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const enterprise = enterprises.find(e => e.id === id)

  if (!enterprise) {
    res.status(404).json({
      success: false,
      error: '企业客户不存在',
    })
    return
  }

  const enterpriseBills = bills.filter(b => b.enterprise_id === id)
  const enterpriseBatchOrders = batchOrders.filter(b => b.enterprise_id === id)

  res.status(200).json({
    success: true,
    data: {
      ...enterprise,
      bills: enterpriseBills,
      batch_orders: enterpriseBatchOrders,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, contact, phone } = req.body

  if (!name || !contact || !phone) {
    res.status(400).json({
      success: false,
      error: '企业名称、联系人和电话不能为空',
    })
    return
  }

  const newEnterprise: Enterprise = {
    id: nextEnterpriseId++,
    name,
    contact,
    phone,
    status: 'active',
  }

  enterprises.push(newEnterprise)

  res.status(201).json({
    success: true,
    data: newEnterprise,
  })
})

router.get('/:id/packages', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const enterprise = enterprises.find(e => e.id === id)

  if (!enterprise) {
    res.status(404).json({
      success: false,
      error: '企业客户不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: servicePackages,
  })
})

router.post('/packages', async (req: Request, res: Response): Promise<void> => {
  const { name, service_types, price, original_price, valid_days, description, features } = req.body

  if (!name || !service_types || !price || !valid_days) {
    res.status(400).json({
      success: false,
      error: '缺少必要参数',
    })
    return
  }

  const newPackage = {
    id: servicePackages.length > 0 ? Math.max(...servicePackages.map(p => p.id)) + 1 : 1,
    name,
    service_types: service_types as ServiceType[],
    service_type_labels: (service_types as ServiceType[]).map(t => serviceTypeLabelMap[t] || t),
    price,
    original_price: original_price || price,
    valid_days,
    description: description || '',
    features: features || [],
  }

  servicePackages.push(newPackage)

  res.status(201).json({
    success: true,
    data: newPackage,
  })
})

router.get('/:id/batch-orders', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const enterprise = enterprises.find(e => e.id === id)

  if (!enterprise) {
    res.status(404).json({
      success: false,
      error: '企业客户不存在',
    })
    return
  }

  const enterpriseBatchOrders = batchOrders.filter(b => b.enterprise_id === id)

  res.status(200).json({
    success: true,
    data: enterpriseBatchOrders,
  })
})

router.post('/:id/batch-orders', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const enterprise = enterprises.find(e => e.id === id)

  if (!enterprise) {
    res.status(404).json({
      success: false,
      error: '企业客户不存在',
    })
    return
  }

  const { package_id, total_count } = req.body

  if (!package_id || !total_count) {
    res.status(400).json({
      success: false,
      error: '服务包ID和服务次数不能为空',
    })
    return
  }

  const pkg = servicePackages.find(p => p.id === package_id)
  if (!pkg) {
    res.status(404).json({
      success: false,
      error: '服务包不存在',
    })
    return
  }

  const now = new Date()
  const expire = new Date(now)
  expire.setDate(expire.getDate() + pkg.valid_days)

  const newBatchOrder: BatchOrder = {
    id: nextBatchOrderId++,
    enterprise_id: id,
    package_id,
    package_name: pkg.name,
    total_count,
    used_count: 0,
    total_amount: pkg.price,
    status: 'active',
    created_at: now.toISOString(),
    expire_at: expire.toISOString(),
  }

  batchOrders.push(newBatchOrder)

  res.status(201).json({
    success: true,
    data: newBatchOrder,
  })
})

router.post('/:id/batch-orders/:batchId/consume', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const batchId = parseInt(req.params.batchId, 10)

  const batchOrder = batchOrders.find(b => b.id === batchId && b.enterprise_id === id)

  if (!batchOrder) {
    res.status(404).json({
      success: false,
      error: '批量订单不存在',
    })
    return
  }

  if (batchOrder.status !== 'active') {
    res.status(400).json({
      success: false,
      error: '批量订单不可用',
    })
    return
  }

  if (batchOrder.used_count >= batchOrder.total_count) {
    res.status(400).json({
      success: false,
      error: '服务次数已用完',
    })
    return
  }

  const { address, lng, lat, start_time, duration_hours, worker_id } = req.body

  if (!address || !start_time || !duration_hours) {
    res.status(400).json({
      success: false,
      error: '缺少必要参数',
    })
    return
  }

  const pkg = servicePackages.find(p => p.id === batchOrder.package_id)
  const serviceType = pkg?.service_types[0] || 'cleaning'
  const orderStatus = worker_id ? 'assigned' : 'pending'

  const newOrder: Order = {
    id: 3000 + orders.length,
    user_id: id + 10000,
    worker_id,
    service_type: serviceType,
    service_type_label: serviceTypeLabelMap[serviceType],
    address,
    lng: lng || 116.476,
    lat: lat || 39.998,
    start_time,
    duration_hours,
    status: orderStatus,
    status_label: worker_id ? '已派单' : '待派单',
    amount: 0,
    remark: `企业批量订单（批次号：${batchOrder.id}）`,
    created_at: new Date().toISOString(),
  }

  if (worker_id) {
    const worker = workers.find(w => w.id === worker_id)
    if (worker) {
      newOrder.worker_name = worker.real_name
      newOrder.worker_avatar = worker.avatar
      newOrder.worker_phone = worker.phone
    }
  }

  orders.push(newOrder)

  batchOrder.used_count++
  if (batchOrder.used_count >= batchOrder.total_count) {
    batchOrder.status = 'exhausted'
  }

  res.status(201).json({
    success: true,
    data: {
      order: newOrder,
      batch_order: batchOrder,
    },
  })
})

router.get('/:id/bills', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const enterprise = enterprises.find(e => e.id === id)

  if (!enterprise) {
    res.status(404).json({
      success: false,
      error: '企业客户不存在',
    })
    return
  }

  const enterpriseBills = bills.filter(b => b.enterprise_id === id)

  res.status(200).json({
    success: true,
    data: enterpriseBills,
  })
})

router.get('/:id/bills/:billId', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const billId = parseInt(req.params.billId, 10)

  const bill = bills.find(b => b.id === billId && b.enterprise_id === id)

  if (!bill) {
    res.status(404).json({
      success: false,
      error: '账单不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: bill,
  })
})

router.post('/:id/bills', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const enterprise = enterprises.find(e => e.id === id)

  if (!enterprise) {
    res.status(404).json({
      success: false,
      error: '企业客户不存在',
    })
    return
  }

  const { period, amount, items } = req.body

  if (!period || !amount) {
    res.status(400).json({
      success: false,
      error: '账期和金额不能为空',
    })
    return
  }

  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + 15)

  const newBill: Bill = {
    id: nextBillId++,
    enterprise_id: id,
    period,
    amount,
    status: 'unpaid',
    items: items || [{ description: period + '服务费', amount }],
    issued_at: now.toISOString(),
    due_date: dueDate.toISOString(),
  }

  bills.push(newBill)

  res.status(201).json({
    success: true,
    data: newBill,
  })
})

router.patch('/:id/bills/:billId/pay', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const billId = parseInt(req.params.billId, 10)

  const bill = bills.find(b => b.id === billId && b.enterprise_id === id)

  if (!bill) {
    res.status(404).json({
      success: false,
      error: '账单不存在',
    })
    return
  }

  if (bill.status === 'paid') {
    res.status(400).json({
      success: false,
      error: '账单已支付',
    })
    return
  }

  bill.status = 'paid'

  res.status(200).json({
    success: true,
    data: bill,
  })
})

export default router
