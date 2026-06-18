import { Router } from 'express'
import { mockProducts } from '../../shared/data.js'
import type { ProductType } from '../../shared/types.js'

const router = Router()

router.get('/', (req, res) => {
  const type = req.query.type as ProductType | undefined
  const city = req.query.city as string | undefined
  let products = mockProducts
  if (type) {
    products = products.filter(p => p.type === type)
  }
  if (city) {
    products = products.filter(p => p.city === city)
  }
  res.json(products)
})

router.get('/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === req.params.id)
  if (!product) {
    res.status(404).json({ error: 'Product not found' })
    return
  }
  res.json(product)
})

export default router
