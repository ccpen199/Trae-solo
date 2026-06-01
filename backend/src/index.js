require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../data/app.sqlite')
if (!fs.existsSync(dbPath)) {
  require('./models/init')
}

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 54869

app.use(cors({ origin: `http://127.0.0.1:${parseInt(process.env.FRONTEND_PORT) || 44869}` }))
app.use(bodyParser.json())

const booksRouter = require('./routes/books')
const reviewsRouter = require('./routes/reviews')
const usersRouter = require('./routes/users')
const ordersRouter = require('./routes/orders')
const cartRouter = require('./routes/cart')

app.use('/api/books', booksRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/users', usersRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/cart', cartRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`)
})
