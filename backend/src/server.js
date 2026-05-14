const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const express = require('express')
const cors = require('cors')
const db = require('./models/database')
const userRoutes = require('./routes/userRoutes')
const productRoutes = require('./routes/productRoutes')
const cartRoutes = require('./routes/cartRoutes')
const orderRoutes = require('./routes/orderRoutes')
const addressRoutes = require('./routes/addressRoutes')
const adRoutes = require('./routes/adRoutes')

const app = express()
const PORT = process.env.PORT || 9841

app.use(cors({
  origin: `http://localhost:${process.env.FRONTEND_PORT || 9842}`,
  credentials: true
}))
app.use(express.json())

app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/ads', adRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hema Fresh API running' })
})

db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Database initialization failed:', err)
  process.exit(1)
})