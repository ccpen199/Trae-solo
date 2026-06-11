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
import deviceRoutes from './routes/devices.js'
import healthRoutes from './routes/health.js'
import alertRoutes from './routes/alerts.js'
import archiveRoutes from './routes/archives.js'
import { dataPrivacyMiddleware } from './utils/response.js'
import {
  generateVitalRecords,
  generateSleepRecords,
  generateExerciseRecords,
  generateExercisePlan,
  mockDevices,
  mockAlerts,
  mockAlertRules,
  mockHealthArchives,
  mockAppointments,
  mockAuthorizations,
} from '../shared/mockData.js'
import { healthDataService } from './services/healthDataService.js'
import { deviceService } from './services/deviceService.js'
import { alertService } from './services/alertService.js'
import { archiveService, hisService, authorizationService } from './services/archiveService.js'
import db from './db/index.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(dataPrivacyMiddleware)

async function initializeMockData() {
  const DEFAULT_USER_ID = 'user-001'

  try {
    const existingDevices = deviceService.getDevicesByUserId(DEFAULT_USER_ID)
    const devicesNeedRefresh = existingDevices.length === 0 || 
      !existingDevices[0].protocolVersion || 
      !existingDevices[0].supportedFeatures || 
      existingDevices[0].abstractionStatus === 'pending'
    
    if (devicesNeedRefresh) {
      if (existingDevices.length > 0) {
        for (const device of existingDevices) {
          deviceService.unbindDevice(DEFAULT_USER_ID, device.id)
        }
      }
      for (const device of mockDevices) {
        deviceService.bindDevice(DEFAULT_USER_ID, {
          brand: device.brand,
          model: device.model,
          name: device.name,
          deviceId: device.id,
        })
      }
      const refreshedDevices = deviceService.getDevicesByUserId(DEFAULT_USER_ID)
      for (let i = 0; i < refreshedDevices.length && i < mockDevices.length; i++) {
        if (mockDevices[i].lastSyncResult) {
          deviceService.syncDeviceData(DEFAULT_USER_ID, refreshedDevices[i].id)
        }
      }
    }

    const existingVitals = healthDataService.getVitalRecords(DEFAULT_USER_ID, 1)
    if (existingVitals.length === 0) {
      const vitals = generateVitalRecords(30)
      for (const v of vitals) {
        healthDataService.addVitalRecord(DEFAULT_USER_ID, v)
      }

      const sleeps = generateSleepRecords(30)
      for (const s of sleeps) {
        await archiveService.generateArchive(
          DEFAULT_USER_ID,
          s.date,
          s.date,
          ['sleep'],
          'json'
        )
      }

      const exercises = generateExerciseRecords(30)
      for (const e of exercises) {
        healthDataService.calculateHealthScore(DEFAULT_USER_ID)
      }

      const plan = generateExercisePlan()
      healthDataService.createExercisePlan(DEFAULT_USER_ID, plan)
    }

    const existingAlerts = alertService.getAlerts(DEFAULT_USER_ID)
    const hasNewAlertFields = existingAlerts.length > 0 && 
      (existingAlerts[0].acknowledgedBy || existingAlerts[0].status === 'pending_review' || existingAlerts[0].status === 'needs_referral')
    
    if (existingAlerts.length === 0 || !hasNewAlertFields) {
      if (existingAlerts.length > 0) {
        const deleteStmt = db.prepare(`DELETE FROM alerts WHERE user_id = ?`)
        deleteStmt.run(DEFAULT_USER_ID)
      }
      for (const alert of mockAlerts) {
        alertService.createAlert(DEFAULT_USER_ID, alert)
      }
      for (const rule of mockAlertRules) {
        const existingRules = alertService.getAlertRules(DEFAULT_USER_ID)
        if (existingRules.length === 0) {
          alertService.createAlertRule(DEFAULT_USER_ID, rule)
        }
      }
    }

    const existingArchives = archiveService.getArchives(DEFAULT_USER_ID)
    if (existingArchives.length <= 1) {
      for (const archive of mockHealthArchives) {
        await archiveService.generateArchive(
          DEFAULT_USER_ID,
          archive.dateStart,
          archive.dateEnd,
          archive.dataTypes,
          archive.format
        )
      }
    }

    const existingAuths = authorizationService.getAuthorizations(DEFAULT_USER_ID)
    if (existingAuths.length === 0) {
      for (const auth of mockAuthorizations) {
        authorizationService.createAuthorization(DEFAULT_USER_ID, auth)
      }
    }

    const existingAppointments = hisService.getAppointments(DEFAULT_USER_ID)
    if (existingAppointments.length === 0) {
      for (const apt of mockAppointments) {
        hisService.createAppointment(DEFAULT_USER_ID, apt)
      }
    }

    console.log('Mock data initialized successfully')
  } catch (error) {
    console.error('Error initializing mock data:', error)
  }
}

initializeMockData()

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api', healthRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/archives', archiveRoutes)

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
  console.error('API Error:', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
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
