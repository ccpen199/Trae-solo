const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true })
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const merchantRoutes = require('./routes/merchant')
const orderRoutes = require('./routes/order')
const categoryRoutes = require('./routes/category')
const couponRoutes = require('./routes/coupon')
const productRoutes = require('./routes/product')
const adminRoutes = require('./routes/admin')
const mapRoutes = require('./routes/map')
const db = require('./database/init')

const app = express()
const PORT = process.env.BACKEND_PORT || 56776

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 46776}`],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get()
    res.json({ status: 'ok', message: '服务运行正常', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: '数据库连接失败' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/merchants', merchantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/products', productRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/map', mapRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: '服务器内部错误', message: err.message })
})

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 后端服务启动成功`)
  console.log(`📍 地址: http://127.0.0.1:${PORT}`)
  console.log(`🔍 健康检查: http://127.0.0.1:${PORT}/api/health`)
})

module.exports = app
