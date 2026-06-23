import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/activity', (_req: Request, res: Response): void => {
  const modules = ['news', 'circles', 'shop', 'match', 'events']
  const data = modules.map((module) => ({
    module,
    views: Math.floor(Math.random() * 500) + 100,
    interactions: Math.floor(Math.random() * 200) + 20,
  }))

  res.json({ success: true, data })
})

router.get('/heatmap', (_req: Request, res: Response): void => {
  const counties = [
    '蒙自市', '个旧市', '开远市', '弥勒市',
    '建水县', '石屏县', '泸西县', '元阳县',
    '红河县', '金平县', '绿春县', '屏边县', '河口县',
  ]

  const data = counties.map((county) => ({
    name: county,
    value: Math.floor(Math.random() * 101),
  }))

  res.json({ success: true, data })
})

export default router
