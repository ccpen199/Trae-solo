/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import hotelRoutes from './routes/hotels.js'
import comparisonRoutes from './routes/comparison.js'
import bookingRoutes from './routes/bookings.js'
import memberRoutes from './routes/members.js'
import itineraryRoutes from './routes/itineraries.js'
import gdprRoutes from './routes/gdpr.js'
import adminHotelRoutes from './routes/admin/hotels.js'
import adminCommissionRoutes from './routes/admin/commissions.js'
import adminTaxRoutes from './routes/admin/taxes.js'
import hotelAdminBookingRoutes from './routes/hotel-admin/bookings.js'
import hotelAdminInventoryRoutes from './routes/hotel-admin/inventory.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/hotels', hotelRoutes)
app.use('/api/comparison', comparisonRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/itineraries', itineraryRoutes)
app.use('/api/gdpr', gdprRoutes)
app.use('/api/admin/hotels', adminHotelRoutes)
app.use('/api/admin/commissions', adminCommissionRoutes)
app.use('/api/admin/taxes', adminTaxRoutes)
app.use('/api/hotel-admin/bookings', hotelAdminBookingRoutes)
app.use('/api/hotel-admin/inventory', hotelAdminInventoryRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
