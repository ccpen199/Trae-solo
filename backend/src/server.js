require('dotenv').config()
const express = require('express')
const cors = require('cors')
const initDatabase = require('./database/init')

const authRoutes = require('./routes/auth')
const dashboardRoutes = require('./routes/dashboard')
const productRoutes = require('./routes/products')
const contentRoutes = require('./routes/contents')
const customerRoutes = require('./routes/customers')
const orderRoutes = require('./routes/orders')
const supplierRoutes = require('./routes/suppliers')
const purchaseRoutes = require('./routes/purchase')
const inventoryRoutes = require('./routes/inventory')

const app = express()
const PORT = process.env.PORT || 23137

app.use(cors({
  origin: ['http://localhost:33137', 'http://127.0.0.1:33137'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

initDatabase()

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/products', productRoutes)
app.use('/api/contents', contentRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/purchase', purchaseRoutes)
app.use('/api/inventory', inventoryRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      port: PORT
    }
  })
})

app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           自营电商后台管理系统 - 后端服务                     ║
╠════════════════════════════════════════════════════════════╣
║  服务已启动成功!                                              ║
║  本地访问地址: http://localhost:${PORT}                         ║
║  网络访问地址: http://0.0.0.0:${PORT}                           ║
╠════════════════════════════════════════════════════════════╣
║  默认登录账号: admin                                          ║
║  默认登录密码: admin123                                       ║
╚════════════════════════════════════════════════════════════╝
`)
})
