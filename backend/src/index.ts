import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDatabase } from './db/index.js'
import { initDefaultUsers } from './routes/auth.js'
import authRouter from './routes/auth.js'
import patientsRouter from './routes/patients.js'
import appointmentsRouter from './routes/appointments.js'
import treatmentPlansRouter from './routes/treatmentPlans.js'
import invoicesRouter from './routes/invoices.js'
import suppliesRouter from './routes/supplies.js'
import remindersRouter from './routes/reminders.js'
import masterRouter from './routes/master.js'

const PORT = process.env.BACKEND_PORT || 58910

const app = express()

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48910}`],
  credentials: true
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/patients', patientsRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/treatment-plans', treatmentPlansRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/supplies', suppliesRouter)
app.use('/api/reminders', remindersRouter)
app.use('/api/master', masterRouter)

initDatabase()
initDefaultUsers()

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`牙科诊所管理系统后端运行在 http://127.0.0.1:${PORT}`)
})
