import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { db, initialize } from './models/database.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import waybillRoutes from './routes/waybills.js'
import dispatchRoutes from './routes/dispatch.js'
import monitorRoutes from './routes/monitor.js'
import vehicleRoutes from './routes/vehicles.js'
import driverRoutes from './routes/drivers.js'
import receiptRoutes from './routes/receipts.js'
import freightRoutes from './routes/freights.js'
import statementRoutes from './routes/statements.js'
import reportRoutes from './routes/reports.js'
import customerRoutes from './routes/customer.js'
import driverAppRoutes from './routes/driver.js'
import trackRoutes from './routes/track.js'
import { TrackMonitor } from './engines/trackMonitor.js'
import { FreightCalculator } from './engines/freightCalculator.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/waybills', waybillRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/monitor', monitorRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/receipts', receiptRoutes)
app.use('/api/freights', freightRoutes)
app.use('/api/statements', statementRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/driver', driverAppRoutes)
app.use('/api/tracks', trackRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

initialize()

const trackMonitor = new TrackMonitor(io)
const freightCalculator = new FreightCalculator()

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('driver-location', (data) => {
    trackMonitor.processLocation(data)
  })

  socket.on('subscribe-waybill', (waybillId) => {
    socket.join(`waybill:${waybillId}`)
  })

  socket.on('unsubscribe-waybill', (waybillId) => {
    socket.leave(`waybill:${waybillId}`)
  })
})

const PORT = 7010
httpServer.listen(PORT, () => {
  console.log(`TMS Backend running on http://localhost:${PORT}`)
})
