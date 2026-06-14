import { type Request, type Response, type NextFunction } from 'express'

export const cors = (req: Request, res: Response, next: NextFunction): void => {
  const frontendUrl = process.env.FRONTEND_URL
  const allowedOrigins: string[] = []

  if (frontendUrl) {
    allowedOrigins.push(frontendUrl)
  }

  const frontendPort = parseInt(process.env.FRONTEND_PORT || '49073')
  allowedOrigins.push(`http://127.0.0.1:${frontendPort}`)
  allowedOrigins.push(`http://localhost:${frontendPort}`)

  const requestOrigin = req.headers.origin

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin)
  } else if (!requestOrigin) {
    res.header('Access-Control-Allow-Origin', '*')
  }

  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }

  next()
}

export default cors
