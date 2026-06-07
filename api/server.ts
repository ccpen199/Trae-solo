import dotenv from 'dotenv'
dotenv.config()
import app from './app.js'
import './db.js'
import { initWSS } from './ws.js'

const PORT = process.env.BACKEND_PORT || 59058

const server = app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Server ready on 127.0.0.1:${PORT}`)
})

const wss = initWSS(server)

export { wss }

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
