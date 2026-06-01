import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/vessel-types', (_req: Request, res: Response): void => {
  res.json({ success: true, data: ['拖网', '围网', '钓具', '刺网', '笼壶', '杂渔具'] })
})

router.get('/sea-areas', (_req: Request, res: Response): void => {
  res.json({ success: true, data: ['东海渔场', '南海渔场', '黄海渔场', '渤海渔场', '北部湾渔场'] })
})

export default router
