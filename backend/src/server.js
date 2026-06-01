require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 58830

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48830}`],
  credentials: true
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const studentsRouter = require('./routes/students')
const resourcesRouter = require('./routes/resources')
const recommendationsRouter = require('./routes/recommendations')
const feedbackRouter = require('./routes/feedback')
const adminRouter = require('./routes/admin')

app.use('/api/students', studentsRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/recommendations', recommendationsRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/admin', adminRouter)

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 后端服务运行在 http://127.0.0.1:${PORT}`)
})
