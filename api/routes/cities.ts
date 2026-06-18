import { Router } from 'express'
import { CITIES } from '../../shared/data.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(CITIES)
})

export default router
