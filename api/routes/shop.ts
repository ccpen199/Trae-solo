import { Router } from 'express'
import { shops } from '../data/mockData.js'

export const shopRouter = Router()

shopRouter.get('/', (_req, res) => {
  res.json(shops)
})

shopRouter.get('/:id/products', (req, res) => {
  const shop = shops.find(s => s.id === req.params.id)
  if (!shop) {
    return res.status(404).json({ error: '商户未找到' })
  }
  res.json(shop.products)
})

shopRouter.get('/:id', (req, res) => {
  const shop = shops.find(s => s.id === req.params.id)
  if (!shop) {
    return res.status(404).json({ error: '商户未找到' })
  }
  res.json(shop)
})
