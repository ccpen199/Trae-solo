import express from 'express'
console.log('Starting test server...')
const app = express()
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok' })
})
const server = app.listen(59058, '127.0.0.1', () => {
  console.log('Test server ready on 127.0.0.1:59058')
})
setTimeout(() => {
  console.log('Stopping test server...')
  server.close()
  process.exit(0)
}, 5000)
