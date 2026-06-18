import type { Express } from 'express'
import memberRouter from './member.js'
import merchantRouter from './merchant.js'
import productsRouter from './products.js'
import dashboardRouter from './dashboard.js'
import citiesRouter from './cities.js'

export function registerRoutes(app: Express) {
  app.use('/api/member', memberRouter)
  app.use('/api/merchant', merchantRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/cities', citiesRouter)
}
