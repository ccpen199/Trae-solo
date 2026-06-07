import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'

const PORT = process.env.BACKEND_PORT || 58841

const server = app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Server ready on http://127.0.0.1:${PORT}`)
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
