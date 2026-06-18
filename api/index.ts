import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { registerRoutes } from './routes/index'
import './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3011

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5175',
  credentials: true,
}))

app.use(express.json())

registerRoutes(app)

app.listen(PORT, () => {
  console.log(`川渝联盟 API server running on http://localhost:${PORT}`)
})
