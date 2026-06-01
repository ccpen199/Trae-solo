import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

const db = getDb()

const stmtGetAll = db.prepare('SELECT * FROM assets ORDER BY created_at DESC')
const stmtGetByType = db.prepare('SELECT * FROM assets WHERE type = ? ORDER BY created_at DESC')
const stmtGetByStatus = db.prepare('SELECT * FROM assets WHERE status = ? ORDER BY created_at DESC')
const stmtGetByTypeAndStatus = db.prepare('SELECT * FROM assets WHERE type = ? AND status = ? ORDER BY created_at DESC')
const stmtSearch = db.prepare("SELECT * FROM assets WHERE (name LIKE ? OR location LIKE ?) ORDER BY created_at DESC")
const stmtSearchByType = db.prepare("SELECT * FROM assets WHERE type = ? AND (name LIKE ? OR location LIKE ?) ORDER BY created_at DESC")
const stmtSearchByStatus = db.prepare("SELECT * FROM assets WHERE status = ? AND (name LIKE ? OR location LIKE ?) ORDER BY created_at DESC")
const stmtSearchByTypeAndStatus = db.prepare("SELECT * FROM assets WHERE type = ? AND status = ? AND (name LIKE ? OR location LIKE ?) ORDER BY created_at DESC")
const stmtGetById = db.prepare('SELECT * FROM assets WHERE id = ?')
const stmtInsert = db.prepare(`
  INSERT INTO assets (name, type, location, area, area_unit, ownership, valuation, photo_url, certificate_no, status, remark)
  VALUES (@name, @type, @location, @area, @area_unit, @ownership, @valuation, @photo_url, @certificate_no, @status, @remark)
`)
const stmtUpdate = db.prepare(`
  UPDATE assets SET
    name = @name, type = @type, location = @location, area = @area, area_unit = @area_unit,
    ownership = @ownership, valuation = @valuation, photo_url = @photo_url,
    certificate_no = @certificate_no, status = @status, remark = @remark,
    updated_at = datetime('now','localtime')
  WHERE id = @id
`)
const stmtDelete = db.prepare('DELETE FROM assets WHERE id = ?')

router.get('/', (req: Request, res: Response): void => {
  try {
    const { type, status, keyword } = req.query
    const kw = keyword ? `%${keyword}%` : null

    let rows: any[]

    if (type && status && kw) {
      rows = stmtSearchByTypeAndStatus.all(type, status, kw, kw)
    } else if (type && status) {
      rows = stmtGetByTypeAndStatus.all(type, status)
    } else if (type && kw) {
      rows = stmtSearchByType.all(type, kw, kw)
    } else if (status && kw) {
      rows = stmtSearchByStatus.all(status, kw, kw)
    } else if (type) {
      rows = stmtGetByType.all(type)
    } else if (status) {
      rows = stmtGetByStatus.all(status)
    } else if (kw) {
      rows = stmtSearch.all(kw, kw)
    } else {
      rows = stmtGetAll.all()
    }

    res.json({ success: true, data: rows })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const asset = stmtGetById.get(req.params.id)
    if (!asset) {
      res.status(404).json({ success: false, error: 'Asset not found' })
      return
    }
    res.json({ success: true, data: asset })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      name, type, location, area, area_unit, ownership,
      valuation, photo_url, certificate_no, status, remark
    } = req.body

    const result = stmtInsert.run({
      name, type, location,
      area: area ?? 0,
      area_unit: area_unit ?? '平方米',
      ownership: ownership ?? '',
      valuation: valuation ?? 0,
      photo_url: photo_url ?? '',
      certificate_no: certificate_no ?? '',
      status: status ?? 'normal',
      remark: remark ?? '',
    })

    const newAsset = stmtGetById.get(result.lastInsertRowid)
    res.json({ success: true, data: newAsset })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const {
      name, type, location, area, area_unit, ownership,
      valuation, photo_url, certificate_no, status, remark
    } = req.body

    const result = stmtUpdate.run({
      id: req.params.id,
      name, type, location,
      area: area ?? 0,
      area_unit: area_unit ?? '平方米',
      ownership: ownership ?? '',
      valuation: valuation ?? 0,
      photo_url: photo_url ?? '',
      certificate_no: certificate_no ?? '',
      status: status ?? 'normal',
      remark: remark ?? '',
    })

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Asset not found' })
      return
    }

    const updatedAsset = stmtGetById.get(req.params.id)
    res.json({ success: true, data: updatedAsset })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const result = stmtDelete.run(req.params.id)
    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Asset not found' })
      return
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
