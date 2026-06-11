import { createServer, type Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import type {
  Order,
  OrderStatus,
  RiderLocation,
  OrderAlert,
  DashboardMetrics,
  ServerEventMap,
  ClientEventMap,
} from '../../shared/types/index.js'

const ALL_CHANNELS = [
  'order:status',
  'rider:location',
  'order:new',
  'order:alert',
  'dashboard:metrics',
]

interface SocketData {
  subscribedChannels: Set<string>
}

const riderNames = ['张三', '李四', '王五', '赵六', '孙七', '周八']
const customerNames = ['陈先生', '刘女士', '杨先生', '黄女士', '吴先生', '郑女士']
const addressList = [
  '北京市朝阳区建国路88号SOHO现代城',
  '北京市海淀区中关村大街1号',
  '北京市东城区王府井大街138号',
  '北京市西城区金融街7号',
  '上海市浦东新区陆家嘴环路1000号',
  '广州市天河区珠江新城华夏路10号',
]
const itemNames = ['美式咖啡', '拿铁', '三明治', '沙拉', '汉堡', '炸鸡', '奶茶', '蛋糕']
const alertMessages = [
  '骑手可能延迟，请关注',
  '订单地址异常，请确认',
  '订单金额异常，请核查',
  '客户催促配送，请加快',
  '骑手反馈遇到交通拥堵',
]

const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number, decimals: number = 6): number =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

const generateOrderId = (): string => `ORD${Date.now()}${randomInt(100, 999)}`
const generateOrderNo = (): string =>
  `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
    new Date().getDate(),
  ).padStart(2, '0')}${randomInt(100000, 999999)}`

const createMockOrder = (): Order => {
  const items = Array.from({ length: randomInt(1, 4) }, (_, i) => ({
    id: `item-${Date.now()}-${i}`,
    name: randomPick(itemNames),
    quantity: randomInt(1, 3),
    price: randomFloat(15, 88, 2),
  }))
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const orderNo = generateOrderNo()
  const now = new Date().toISOString()
  const estimated = new Date(Date.now() + randomInt(20, 50) * 60 * 1000).toISOString()
  const pickupAddress = randomPick(addressList)
  const deliveryAddress = randomPick(addressList)
  const pickupLat = randomFloat(39.8, 40.1)
  const pickupLng = randomFloat(116.2, 116.6)
  const deliveryLat = randomFloat(39.8, 40.1)
  const deliveryLng = randomFloat(116.2, 116.6)
  const riderId = `rider-${randomInt(100, 999)}`
  const riderName = randomPick(riderNames)
  const customerName = randomPick(customerNames)

  return {
    id: generateOrderId(),
    orderNo,
    order_no: orderNo,
    customerId: `cust-${randomInt(1000, 9999)}`,
    customerName,
    customerPhone: `138${randomInt(10000000, 99999999)}`,
    merchant_id: `merchant-${randomInt(1, 20)}`,
    riderId,
    rider_id: riderId,
    riderName,
    pickupAddress,
    pickup_address: pickupAddress,
    pickupLat,
    pickup_lat: pickupLat,
    pickupLng,
    pickup_lng: pickupLng,
    deliveryAddress,
    delivery_address: deliveryAddress,
    deliveryLat,
    delivery_lat: deliveryLat,
    deliveryLng,
    delivery_lng: deliveryLng,
    goods_type: randomPick(itemNames),
    goods_weight: randomFloat(0.5, 5, 1),
    distance_km: randomFloat(1, 10, 1),
    estimated_price: parseFloat(totalAmount.toFixed(2)),
    status: 'pending',
    items,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    createdAt: now,
    created_at: now,
    updatedAt: now,
    updated_at: now,
    estimatedDeliveryTime: estimated,
    estimated_delivery_time: estimated,
    estimated_delivery_at: estimated,
    is_abnormal: false,
  }
}

const createMockRiderLocation = (): RiderLocation => ({
  riderId: `rider-${randomInt(100, 105)}`,
  lat: randomFloat(39.8, 40.1),
  lng: randomFloat(116.2, 116.6),
  timestamp: new Date().toISOString(),
  heading: randomInt(0, 359),
  speed: randomFloat(0, 45, 1),
})

const createMockOrderAlert = (): OrderAlert => {
  const levels: OrderAlert['level'][] = ['low', 'medium', 'high', 'critical']
  const types: OrderAlert['type'][] = ['delay', 'exception', 'urgent', 'info']
  return {
    id: `alert-${Date.now()}-${randomInt(100, 999)}`,
    orderId: generateOrderId(),
    type: randomPick(types),
    level: randomPick(levels),
    message: randomPick(alertMessages),
    timestamp: new Date().toISOString(),
  }
}

let io: Server | null = null
const timers: NodeJS.Timeout[] = []

const startMockPushers = (ioInstance: Server): void => {
  const statuses: OrderStatus[] = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered']

  timers.push(
    setInterval(() => {
      const status = randomPick(statuses)
      const event: ServerEventMap['order:status'] = {
        orderId: generateOrderId(),
        status,
        timestamp: new Date().toISOString(),
      }
      ioInstance.to('order:status').emit('order:status', event)
    }, 5000),
  )

  timers.push(
    setInterval(() => {
      const location = createMockRiderLocation()
      ioInstance.to('rider:location').emit('rider:location', location)
    }, 2000),
  )

  timers.push(
    setInterval(() => {
      const order = createMockOrder()
      ioInstance.to('order:new').emit('order:new', order)
    }, 10000),
  )

  timers.push(
    setInterval(() => {
      const alert = createMockOrderAlert()
      ioInstance.to('order:alert').emit('order:alert', alert)
    }, 8000),
  )

  timers.push(
    setInterval(() => {
      const totalOrders = randomInt(200, 500)
      const pendingOrders = randomInt(10, 50)
      const inTransitOrders = randomInt(20, 80)
      const deliveredOrders = randomInt(150, 400)
      const cancelledOrders = randomInt(0, 20)
      const activeRiders = randomInt(15, 50)
      const avgDeliveryTime = randomFloat(25, 45, 1)
      const todayRevenue = parseFloat(randomFloat(8000, 30000, 2).toFixed(2))
      const exceptionOrders = randomInt(0, 10)

      const metrics: DashboardMetrics = {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
        cancelledOrders,
        activeRiders,
        avgDeliveryTime,
        todayRevenue,
        total_orders: totalOrders,
        completed_orders: deliveredOrders,
        pending_orders: pendingOrders,
        exception_orders: exceptionOrders,
        total_revenue: todayRevenue,
        active_riders: activeRiders,
        avg_delivery_time: avgDeliveryTime,
      }
      ioInstance.to('dashboard:metrics').emit('dashboard:metrics', metrics)
    }, 3000),
  )

  console.log('[Socket.IO] Mock data pushers started')
}

const stopMockPushers = (): void => {
  timers.forEach((t) => clearInterval(t))
  timers.length = 0
  console.log('[Socket.IO] Mock data pushers stopped')
}

export const initSocketIO = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket: Socket<ClientEventMap, ServerEventMap>) => {
    const socketData: SocketData = {
      subscribedChannels: new Set<string>(),
    }

    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    socket.on('dashboard:subscribe', (channels: string[]) => {
      const validChannels = channels.filter((c) => ALL_CHANNELS.includes(c))
      validChannels.forEach((channel) => {
        if (!socketData.subscribedChannels.has(channel)) {
          socket.join(channel)
          socketData.subscribedChannels.add(channel)
        }
      })
      console.log(
        `[Socket.IO] ${socket.id} subscribed to: ${[...socketData.subscribedChannels].join(', ')}`,
      )
    })

    socket.on('dashboard:unsubscribe', (channels: string[]) => {
      channels.forEach((channel) => {
        if (socketData.subscribedChannels.has(channel)) {
          socket.leave(channel)
          socketData.subscribedChannels.delete(channel)
        }
      })
      console.log(
        `[Socket.IO] ${socket.id} unsubscribed, remaining: ${[...socketData.subscribedChannels].join(', ')}`,
      )
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
      socketData.subscribedChannels.clear()
    })
  })

  startMockPushers(io)

  console.log('[Socket.IO] Server initialized')
  return io
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

export const closeSocketIO = (): void => {
  stopMockPushers()
  if (io) {
    io.close(() => {
      console.log('[Socket.IO] Server closed')
    })
    io = null
  }
}

export { createServer }
