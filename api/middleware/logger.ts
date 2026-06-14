import { type Request, type Response, type NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logFilePath = path.join(__dirname, '../../backend.log')

const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()
  const { method, originalUrl } = req

  res.on('finish', () => {
    const { statusCode } = res
    const responseTime = Date.now() - startTime
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms\n`

    console.log(logMessage.trim())

    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('写入日志文件失败:', err)
      }
    })
  })

  next()
}

export default loggerMiddleware
