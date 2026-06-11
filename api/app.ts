/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getDb, initDb } from './database.js'
import { seedData } from './seed.js'
import authRoutes from './routes/auth.js'
import deviceRoutes from './routes/devices.js'
import locationRoutes from './routes/locations.js'
import callRoutes from './routes/calls.js'
import alertRoutes from './routes/alerts.js'
import memberRoutes from './routes/members.js'
import privacyRoutes from './routes/privacy.js'
import analyticsRoutes from './routes/analytics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = new URL('.', import.meta.url).pathname

dotenv.config()

initDb()
seedData()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api', locationRoutes)
app.use('/api/calls', callRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/privacy', privacyRoutes)
app.use('/api/analytics', analyticsRoutes)

function parseJson(value: unknown, fallback: unknown) {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function primaryGuardianProfile() {
  const db = getDb()
  const row = db.prepare(`
    SELECT * FROM members
    WHERE role = 'primary_guardian'
    ORDER BY joined_at ASC
    LIMIT 1
  `).get() as Record<string, unknown> | undefined

  if (!row) {
    return {
      id: 'local-guardian',
      name: '本地监护人',
      avatar: '/avatars/local.jpg',
      phone: '13800138000',
      role: 'primary_guardian',
      permissions: ['device:manage', 'member:manage', 'privacy:manage', 'analytics:view'],
      joinedAt: new Date().toISOString(),
      invitedBy: null,
    }
  }

  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    phone: row.phone,
    role: row.role,
    permissions: parseJson(row.permissions, []),
    joinedAt: row.joined_at,
    invitedBy: row.invited_by,
  }
}

function adminStats() {
  const db = getDb()
  const count = (table: string, where = '1=1') => {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${where}`).get() as { count: number }
    return row.count
  }

  return {
    onlineDevices: count('devices', "status = 'online'"),
    sosDevices: count('devices', "status = 'sos'"),
    activeAlerts: count('alerts', "status IN ('pending', 'acknowledged')"),
    totalMembers: count('members'),
    todayCalls: count('call_records', "DATE(timestamp) >= DATE('now', '-1 day')"),
    enabledPrivacyPolicies: count('privacy_policies', 'enabled = 1'),
  }
}

app.get(['/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  res.json({ success: true, data: primaryGuardianProfile() })
})

app.get('/api/admin/stats', (_req: Request, res: Response): void => {
  res.json({ success: true, data: adminStats() })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response): void => {
  const stats = adminStats()
  const db = getDb()
  const recentAlerts = db.prepare(`
    SELECT id, type, severity, status, description, timestamp
    FROM alerts
    ORDER BY timestamp DESC
    LIMIT 5
  `).all()
  const recentDevices = db.prepare(`
    SELECT id, name, type, status, battery_level as batteryLevel, firmware_version as firmwareVersion
    FROM devices
    ORDER BY updated_at DESC
    LIMIT 5
  `).all()

  res.json({
    success: true,
    data: {
      stats,
      cards: [
        { label: '在线设备', value: stats.onlineDevices },
        { label: 'SOS 设备', value: stats.sosDevices },
        { label: '活跃告警', value: stats.activeAlerts },
        { label: '家庭成员', value: stats.totalMembers },
      ],
      recentAlerts,
      recentDevices,
    },
  })
})

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
