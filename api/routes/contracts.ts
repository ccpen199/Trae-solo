import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

const LIST_SQL = `
  SELECT c.*, a.name AS asset_name
  FROM contracts c
  LEFT JOIN assets a ON c.asset_id = a.id
`

const BY_ID_SQL = `
  SELECT c.*, a.name AS asset_name
  FROM contracts c
  LEFT JOIN assets a ON c.asset_id = a.id
  WHERE c.id = ?
`

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { type, status, asset_id } = req.query

    const conditions: string[] = []
    const params: unknown[] = []

    if (type) {
      conditions.push('c.type = ?')
      params.push(type)
    }
    if (status) {
      conditions.push('c.status = ?')
      params.push(status)
    }
    if (asset_id) {
      conditions.push('c.asset_id = ?')
      params.push(asset_id)
    }

    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
    const stmt = db.prepare(LIST_SQL + where)
    const contracts = stmt.all(...params)

    res.json({ success: true, data: contracts })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const stmt = db.prepare(BY_ID_SQL)
    const contract = stmt.get(req.params.id)

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' })
      return
    }

    res.json({ success: true, data: contract })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const {
      asset_id, contract_no, type, lessee_name, lessee_contact,
      start_date, end_date, rent_amount, rent_unit,
      payment_cycle, status, remark
    } = req.body

    const stmt = db.prepare(`
      INSERT INTO contracts (asset_id, contract_no, type, lessee_name, lessee_contact, start_date, end_date, rent_amount, rent_unit, payment_cycle, status, remark)
      VALUES (@asset_id, @contract_no, @type, @lessee_name, @lessee_contact, @start_date, @end_date, @rent_amount, @rent_unit, @payment_cycle, @status, @remark)
    `)

    const result = stmt.run({
      asset_id, contract_no, type, lessee_name, lessee_contact,
      start_date, end_date, rent_amount, rent_unit,
      payment_cycle, status, remark
    })

    const newContract = db.prepare(BY_ID_SQL).get(result.lastInsertRowid)

    res.json({ success: true, data: newContract })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const {
      asset_id, contract_no, type, lessee_name, lessee_contact,
      start_date, end_date, rent_amount, rent_unit,
      payment_cycle, status, remark
    } = req.body

    const stmt = db.prepare(`
      UPDATE contracts SET
        asset_id = @asset_id,
        contract_no = @contract_no,
        type = @type,
        lessee_name = @lessee_name,
        lessee_contact = @lessee_contact,
        start_date = @start_date,
        end_date = @end_date,
        rent_amount = @rent_amount,
        rent_unit = @rent_unit,
        payment_cycle = @payment_cycle,
        status = @status,
        remark = @remark,
        updated_at = datetime('now','localtime')
      WHERE id = @id
    `)

    stmt.run({
      asset_id, contract_no, type, lessee_name, lessee_contact,
      start_date, end_date, rent_amount, rent_unit,
      payment_cycle, status, remark,
      id: req.params.id
    })

    const updatedContract = db.prepare(BY_ID_SQL).get(req.params.id)

    res.json({ success: true, data: updatedContract })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM contracts WHERE id = ?')
    stmt.run(req.params.id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
})

export default router
