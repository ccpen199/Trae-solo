require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const port = process.env.PORT || 9961

if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true })
}

app.use(cors({
  origin: `http://localhost:${process.env.FRONTEND_PORT || 9962}`,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', require('./routes/auth'))
app.use('/api', require('./routes/products'))
app.use('/api', require('./routes/cart'))
app.use('/api', require('./routes/orders'))

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})