import app from './app.js'
import './database.js'

const PORT = process.env.BACKEND_PORT || 59062
const HOST = '127.0.0.1'

const server = app.listen(Number(PORT), HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`)
})

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
