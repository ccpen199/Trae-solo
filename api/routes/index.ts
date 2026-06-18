import type { Express } from 'express'
import memberRouter from './member'
import merchantRouter from './merchant'
import productsRouter from './products'
import dashboardRouter from './dashboard'
import citiesRouter from './cities'

export function registerRoutes(app: Express) {
  app.use('/api/member', memberRouter)
  app.use('/api/merchant', merchantRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/cities', citiesRouter)
}
