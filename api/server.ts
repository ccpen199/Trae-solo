/**
 * local server entry file, for local development
 */
import app from './app'
import cron from 'node-cron'
import { initDatabase } from './db/init'
import { setDatabase } from './db/index'
import { checkInactivity } from './services/alertService'

const PORT = Number(process.env.PORT || 59145)
const HOST = process.env.HOST || '127.0.0.1'

async function startServer() {
  console.log('Initializing database...')
  const db = await initDatabase()
  setDatabase(db)
  console.log('Database initialized successfully')

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server ready on http://${HOST}:${PORT}`)
  })

  const dailyTask = cron.schedule('0 0 0 * * *', () => {
    console.log(`${new Date().toISOString()} - Running daily inactivity check...`)
    try {
      const result = checkInactivity()
      console.log(`Inactivity check completed: ${result.inactiveUsers.length} inactive users, ${result.alertsCreated} alerts created`)
      if (result.errors.length > 0) {
        console.error('Errors during inactivity check:', result.errors)
      }
    } catch (error) {
      console.error('Error during daily inactivity check:', error)
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
  })

  console.log('Scheduled daily inactivity check at midnight (Asia/Shanghai)')

  function gracefulShutdown(signal: string) {
    console.log(`${signal} signal received`)
    console.log('Stopping scheduled tasks...')
    dailyTask.stop()

    console.log('Closing server...')
    server.close(() => {
      console.log('Server closed')

      console.log('Closing database connection...')
      db.close()
      console.log('Database connection closed')

      process.exit(0)
    })

    setTimeout(() => {
      console.error('Forced shutdown after 10 seconds')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
