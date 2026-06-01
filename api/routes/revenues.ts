import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

const db = getDb()

const stmtList = db.prepare(`
  SELECT r.*, a.name AS asset_name, c.contract_no
  FROM revenues r
  LEFT JOIN assets a ON r.asset_id = a.id
  LEFT JOIN contracts c ON r.contract_id = c.id
  WHERE 1=1
    AND (@type IS NULL OR r.type = @type)
    AND (@year IS NULL OR r.year = @year)
    AND (@asset_id IS NULL OR r.asset_id = @asset_id)
    AND (@contract_id IS NULL OR r.contract_id = @contract_id)
  ORDER BY r.year DESC, r.created_at DESC
`)

const stmtGetById = db.prepare(`
  SELECT r.*, a.name AS asset_name, c.contract_no
  FROM revenues r
  LEFT JOIN assets a ON r.asset_id = a.id
  LEFT JOIN contracts c ON r.contract_id = c.id
  WHERE r.id = ?
`)

const stmtInsert = db.prepare(`
  INSERT INTO revenues (contract_id, asset_id, type, amount, year, period, description)
  VALUES (@contract_id, @asset_id, @type, @amount, @year, @period, @description)
`)

const stmtUpdate = db.prepare(`
  UPDATE revenues
  SET contract_id = @contract_id,
      asset_id = @asset_id,
      type = @type,
      amount = @amount,
      year = @year,
      period = @period,
      description = @description,
      updated_at = datetime('now','localtime')
  WHERE id = @id
`)

const stmtDelete = db.prepare(`DELETE FROM revenues WHERE id = ?`)

const stmtByYear = db.prepare(`
  SELECT year,
         SUM(CASE WHEN type = 'receivable' THEN amount ELSE 0 END) AS total_receivable,
         SUM(CASE WHEN type = 'received' THEN amount ELSE 0 END) AS total_received,
         SUM(CASE WHEN type = 'arrears' THEN amount ELSE 0 END) AS total_arrears,
         SUM(CASE WHEN type = 'reduction' THEN amount ELSE 0 END) AS total_reduction
  FROM revenues
  GROUP BY year
  ORDER BY year DESC
`)

const stmtByType = db.prepare(`
  SELECT type, SUM(amount) AS total_amount
  FROM revenues
  GROUP BY type
  ORDER BY type
`)

router.get('/', (req: Request, res: Response): void => {
  try {
    const { type, year, asset_id, contract_id } = req.query
    const rows = stmtList.all({
      type: (type as string) || null,
      year: year ? Number(year) : null,
      asset_id: asset_id ? Number(asset_id) : null,
      contract_id: contract_id ? Number(contract_id) : null,
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/stats/summary', (_req: Request, res: Response): void => {
  try {
    const byYear = stmtByYear.all()
    const byType = stmtByType.all()
    res.json({ success: true, data: { byYear, byType } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = stmtGetById.get(Number(req.params.id))
    if (!row) {
      res.status(404).json({ success: false, error: 'Revenue not found' })
      return
    }
    res.json({ success: true, data: row })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { contract_id, asset_id, type, amount, year, period, description } = req.body
    const info = stmtInsert.run({
      contract_id,
      asset_id,
      type,
      amount,
      year,
      period: period || '',
      description: description || '',
    })
    const newRevenue = stmtGetById.get(info.lastInsertRowid)
    res.json({ success: true, data: newRevenue })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { contract_id, asset_id, type, amount, year, period, description } = req.body
    const info = stmtUpdate.run({
      id: Number(req.params.id),
      contract_id,
      asset_id,
      type,
      amount,
      year,
      period: period || '',
      description: description || '',
    })
    if (info.changes === 0) {
      res.status(404).json({ success: false, error: 'Revenue not found' })
      return
    }
    const updatedRevenue = stmtGetById.get(Number(req.params.id))
    res.json({ success: true, data: updatedRevenue })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const info = stmtDelete.run(Number(req.params.id))
    if (info.changes === 0) {
      res.status(404).json({ success: false, error: 'Revenue not found' })
      return
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
