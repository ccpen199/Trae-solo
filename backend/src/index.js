require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const { initDatabase } = require('./database')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT || '58953')

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || '48953'}`,
  credentials: true
}))
app.use(express.json())

initDatabase()

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const customerRoutes = require('./routes/customers')
const productRoutes = require('./routes/products')
const temperatureZoneRoutes = require('./routes/temperatureZones')
const locationRoutes = require('./routes/locations')
const inboundRoutes = require('./routes/inbound')
const inventoryRoutes = require('./routes/inventory')
const temperatureRoutes = require('./routes/temperature')
const exceptionRoutes = require('./routes/exceptions')
const outboundRoutes = require('./routes/outbound')
const billingRoutes = require('./routes/billing')

app.use('/api/customers', customerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/temperature-zones', temperatureZoneRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/inbound', inboundRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/temperature', temperatureRoutes)
app.use('/api/exceptions', exceptionRoutes)
app.use('/api/outbound', outboundRoutes)
app.use('/api/billing', billingRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`)
})

require('./services/temperatureSimulator')
