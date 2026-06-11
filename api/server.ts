/**
 * local server entry file, for local development
 */
import { createServer } from 'http'
import app from './app.js'
import { initSocketIO, closeSocketIO } from './ws/socket.js'

/**
 * start server with port
 */
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59150)
const HOST = process.env.HOST || '127.0.0.1'

const httpServer = createServer(app)
initSocketIO(httpServer)

const server = httpServer.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`)
  console.log(`WebSocket ready on ws://${HOST}:${PORT}`)
})

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  closeSocketIO()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  closeSocketIO()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
