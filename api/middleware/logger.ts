import { type Request, type Response, type NextFunction } from 'express'

const getDurationInMs = (start: [number, number]): number => {
  const NS_PER_SEC = 1e9
  const NS_TO_MS = 1e6
  const diff = process.hrtime(start)
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}

const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime()
  const { method, originalUrl, ip } = req
  const userAgent = req.get('user-agent') ?? 'unknown'

  const timestamp = new Date().toISOString()

  res.on('finish', () => {
    const duration = getDurationInMs(start)
    const { statusCode } = res
    const contentLength = res.get('content-length') ?? '0'

    const logMessage = `[${timestamp}] ${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration.toFixed(2)}ms - ${ip} - ${userAgent}`

    if (statusCode >= 500) {
      console.error(logMessage)
    } else if (statusCode >= 400) {
      console.warn(logMessage)
    } else {
      console.log(logMessage)
    }
  })

  next()
}

export default logger
