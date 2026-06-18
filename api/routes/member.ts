import { Router } from 'express'
import { mockMember, mockPointRecords, mockProducts } from '../../shared/data.js'

const router = Router()

router.get('/profile', (_req, res) => {
  res.json(mockMember)
})

router.get('/points', (_req, res) => {
  res.json({ points: mockMember.points, records: mockPointRecords })
})

router.get('/benefits', (_req, res) => {
  res.json(mockMember.crossCityBenefits)
})

router.get('/recommendations', (req, res) => {
  const city = req.query.city as string
  let products = mockProducts
  if (city) {
    products = mockProducts.filter(p => p.city === city)
  }
  res.json(products)
})

export default router
