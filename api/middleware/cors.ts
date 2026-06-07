import cors from 'cors'
import { env } from '../config/env.js'

const allowedOrigins = [
  `http://127.0.0.1:${env.FRONTEND_PORT}`,
  `http://localhost:${env.FRONTEND_PORT}`,
]

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
}

export const corsMiddleware = cors(corsOptions)

export default corsMiddleware
