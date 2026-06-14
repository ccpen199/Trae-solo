import { Router } from 'express'
import { farmPlots } from '../data/mockData.js'

export const farmRouter = Router()

let plots = [...farmPlots]

farmRouter.get('/', (_req, res) => {
  res.json(plots)
})

farmRouter.get('/:id', (req, res) => {
  const plot = plots.find(p => p.id === req.params.id)
  if (!plot) {
    return res.status(404).json({ error: '农田未找到' })
  }
  res.json(plot)
})

farmRouter.post('/', (req, res) => {
  const newPlot = {
    id: `FP-${String(plots.length + 1).padStart(3, '0')}`,
    ...req.body
  }
  plots.push(newPlot)
  res.status(201).json(newPlot)
})
