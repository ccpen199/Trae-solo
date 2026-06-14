import cors from 'cors'

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:49079',
  credentials: true,
  exposedHeaders: ['Authorization'],
}

const corsMiddleware = cors(corsOptions)

export default corsMiddleware
