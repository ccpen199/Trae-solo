import app from '../api/app.js'

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 58943)
const HOST = '127.0.0.1'
const RETRY_DELAY_MS = 1000
const MAX_RETRIES = 120

let retries = 0
let server: ReturnType<typeof app.listen> | undefined

const listen = () => {
  server = app.listen(PORT, HOST, () => {
    console.log(`Stable backend ready on http://${HOST}:${PORT}`)
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && retries < MAX_RETRIES) {
      retries += 1
      console.log(`Port ${PORT} is busy, retrying stable backend start (${retries}/${MAX_RETRIES})`)
      server?.close(() => {
        setTimeout(listen, RETRY_DELAY_MS)
      })
      return
    }

    throw error
  })
}

listen()

const shutdown = () => {
  if (!server) {
    process.exit(0)
  }
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
