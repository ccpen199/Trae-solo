import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDatabase } from './db'
import warehousesRouter from './routes/warehouses'
import customersRouter from './routes/customers'
import inquiriesRouter from './routes/inquiries'
import contractsRouter from './routes/contracts'
import billsRouter from './routes/bills'
import reportsRouter from './routes/reports'

const app = express()
const PORT = Number(process.env.BACKEND_PORT) || 58952

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48952}`,
  credentials: true
}))

app.use(express.json())

initDatabase()

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/warehouses', warehousesRouter)
app.use('/api/customers', customersRouter)
app.use('/api/inquiries', inquiriesRouter)
app.use('/api/contracts', contractsRouter)
app.use('/api/bills', billsRouter)
app.use('/api/reports', reportsRouter)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || '服务器内部错误' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`)
})
