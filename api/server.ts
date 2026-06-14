import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'
import { createServer } from 'http'
import { initWebSocket, broadcast } from './websocket.js'
import { Simulator } from './services/simulator.js'

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 59133)

const server = createServer(app)

initWebSocket(server)

const simulator = new Simulator((type: string, data: any) => {
  broadcast(type, data)
})

simulator.start()

server.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`)
  console.log(`WebSocket server ready on ws://${HOST}:${PORT}/ws`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  simulator.stop()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  simulator.stop()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

export default app
