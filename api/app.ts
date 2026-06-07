import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/init.js'
import authRoutes from './routes/auth.js'
import propertiesRoutes from './routes/properties.js'
import ownersRoutes from './routes/owners.js'
import tenantsRoutes from './routes/tenants.js'
import leasesRoutes from './routes/leases.js'
import loansRoutes from './routes/loans.js'
import taxRoutes from './routes/tax.js'
import dashboardRoutes from './routes/dashboard.js'
import reportsRoutes from './routes/reports.js'
import appointmentsRoutes from './routes/appointments.js'
import remindersRoutes from './routes/reminders.js'
import mallRoutes from './routes/mall.js'
import complianceRoutes from './routes/compliance.js'
import syncRoutes from './routes/sync.js'
import i18nRoutes from './routes/i18n.js'
import adminRoutes from './routes/admin.js'
import compatRoutes from './routes/compat.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()
const frontendPort = process.env.FRONTEND_PORT || '49053'

app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertiesRoutes)
app.use('/api/owners', ownersRoutes)
app.use('/api/tenants', tenantsRoutes)
app.use('/api/leases', leasesRoutes)
app.use('/api/loans', loansRoutes)
app.use('/api/tax', taxRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/reminders', remindersRoutes)
app.use('/api/mall', mallRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/i18n', i18nRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', compatRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
