import express from 'express'
import cors from 'cors'
import { createServer } from 'http'

const app = express()
app.use(cors())
app.use(express.json())

const mockData = {
  orders: [
    { id: '1', order_no: 'ORD-20260427-0001', customer_name: '某科技有限公司', pickup_city: '北京市', delivery_city: '上海市', goods_name: '电子元器件', weight: 3.5, volume: 8, status: 'PENDING', created_at: '2026-04-27 10:00:00' },
    { id: '2', order_no: 'ORD-20260427-0002', customer_name: '某商贸公司', pickup_city: '广州市', delivery_city: '上海市', goods_name: '服装鞋帽', weight: 2.0, volume: 15, status: 'PENDING', created_at: '2026-04-27 11:00:00' },
    { id: '3', order_no: 'ORD-20260427-0003', customer_name: '某科技有限公司', pickup_city: '北京市', delivery_city: '深圳市', goods_name: '精密仪器', weight: 1.5, volume: 5, status: 'DISPATCHED', created_at: '2026-04-27 09:00:00' }
  ],
  waybills: [
    { id: 'w1', waybill_no: 'WB-A1B2C3D4', vehicle_no: '京A12345', driver_name: '李师傅', driver_phone: '13800138002', status: 'IN_TRANSIT', actual_distance: 850 },
    { id: 'w2', waybill_no: 'WB-E5F6G7H8', vehicle_no: '京B67890', driver_name: '王师傅', driver_phone: '13800138003', status: 'ASSIGNED', actual_distance: 0 }
  ],
  vehicles: [
    { id: 'v1', vehicle_no: '京A12345', vehicle_type: 'OPEN_TRUCK', max_load: 8, status: 'IN_USE' },
    { id: 'v2', vehicle_no: '京B67890', vehicle_type: 'CLOSED_VAN', max_load: 5, status: 'AVAILABLE' },
    { id: 'v3', vehicle_no: '京C11111', vehicle_type: 'REFRIGERATED', max_load: 6, status: 'AVAILABLE' }
  ],
  drivers: [
    { id: 'd1', driver_no: 'D001', name: '李师傅', phone: '13800138002', status: 'ON_DUTY', vehicle_id: 'v1' },
    { id: 'd2', driver_no: 'D002', name: '王师傅', phone: '13800138003', status: 'AVAILABLE', vehicle_id: 'v2' }
  ],
  stats: {
    inTransitCount: 5,
    completedToday: 12,
    exceptionCount: 1
  }
}

app.get('/api/orders', (req, res) => {
  res.json({ data: mockData.orders, total: mockData.orders.length })
})

app.get('/api/orders/:id', (req, res) => {
  const order = mockData.orders.find(o => o.id === req.params.id)
  order ? res.json({ data: order }) : res.status(404).json({ message: 'Not found' })
})

app.post('/api/orders', (req, res) => {
  const newOrder = { ...req.body, id: Date.now().toString(), created_at: new Date().toISOString() }
  mockData.orders.push(newOrder)
  res.json({ data: newOrder })
})

app.get('/api/waybills', (req, res) => {
  res.json({ data: mockData.waybills, total: mockData.waybills.length })
})

app.get('/api/waybills/:id', (req, res) => {
  const waybill = mockData.waybills.find(w => w.id === req.params.id)
  waybill ? res.json({ data: waybill }) : res.status(404).json({ message: 'Not found' })
})

app.get('/api/vehicles', (req, res) => {
  res.json({ data: mockData.vehicles, total: mockData.vehicles.length })
})

app.get('/api/drivers', (req, res) => {
  res.json({ data: mockData.drivers, total: mockData.drivers.length })
})

app.get('/api/monitor/waybills', (req, res) => {
  res.json({ data: { waybills: mockData.waybills, stats: mockData.stats } })
})

app.post('/api/dispatch/assign', (req, res) => {
  res.json({ data: { success: true, message: '调度成功' } })
})

app.post('/api/auth/login', (req, res) => {
  res.json({
    token: 'mock-token-' + Date.now(),
    user: { id: '1', username: req.body.username, name: '测试用户', role: req.body.role || 'dispatcher' }
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = 13091
const server = createServer(app)
server.listen(PORT, () => {
  console.log(`TMS Mock Server running on http://localhost:${PORT}`)
})
