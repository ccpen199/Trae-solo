import { Router } from 'express'
import { supplyDemandItems } from '../data/mockData.js'

export const marketRouter = Router()

let items = [...supplyDemandItems]

marketRouter.get('/', (req, res) => {
  let result = items
  const { category, type, region } = req.query
  if (category) {
    result = result.filter(item => item.category === category)
  }
  if (type) {
    result = result.filter(item => item.type === type)
  }
  if (region) {
    result = result.filter(item => item.region.includes(region as string))
  }
  res.json({
    success: true,
    data: result,
    total: result.length,
  })
})

marketRouter.post('/', (req, res) => {
  const newItem = {
    id: `SD-${String(items.length + 1).padStart(3, '0')}`,
    ...req.body,
    publishDate: new Date().toISOString().split('T')[0],
    matchScore: Math.floor(Math.random() * 40) + 60
  }
  items.push(newItem)
  res.status(201).json({
    success: true,
    data: newItem,
  })
})
