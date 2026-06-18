import { Router } from 'express'
import db from '../db'

const router = Router()

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT code, name, memberCount, merchantCount FROM cities ORDER BY memberCount DESC').all()
  res.json(rows)
})

export default router
