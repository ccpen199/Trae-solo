require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const questionRoutes = require('./routes/questions')
const answerRoutes = require('./routes/answers')
const searchRoutes = require('./routes/search')

const app = express()
const PORT = process.env.PORT || 47571

app.use(cors({
  origin: ['http://localhost:47572', 'http://127.0.0.1:47572'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/answers', answerRoutes)
app.use('/api/search', searchRoutes)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' })
})

app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`知识问答社区后端服务启动成功`)
  console.log(`服务地址: http://localhost:${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/api/health`)
})

module.exports = app
