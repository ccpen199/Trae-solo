import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runInsert, runUpdate } from '../utils/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', keyword, verified } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = 'SELECT * FROM employers WHERE 1=1'
  let countSql = 'SELECT COUNT(*) as count FROM employers WHERE 1=1'
  const params: any[] = []
  const countParams: any[] = []

  if (keyword) {
    sql += ' AND (company_name LIKE ? OR contact_name LIKE ? OR contact_phone LIKE ?)'
    countSql += ' AND (company_name LIKE ? OR contact_name LIKE ? OR contact_phone LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
    countParams.push(kw, kw, kw)
  }

  if (verified !== undefined) {
    sql += ' AND verified = ?'
    countSql += ' AND verified = ?'
    const v = verified === 'true' || verified === '1' ? 1 : 0
    params.push(v)
    countParams.push(v)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(ps, offset)

  const list = runQuery(sql, params)
  const countResult = runQueryOne(countSql, countParams)

  success(res, {
    list,
    total: countResult?.count || 0,
    page: p,
    pageSize: ps
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const employer = runQueryOne('SELECT * FROM employers WHERE id = ?', [parseInt(id)])
  if (!employer) {
    return notFound(res, '雇主不存在')
  }
  success(res, employer)
})

router.get('/:id/jobs', (req: Request, res: Response) => {
  const { id } = req.params
  const jobs = runQuery('SELECT * FROM job_requirements WHERE employer_id = ? ORDER BY created_at DESC', [parseInt(id)])
  success(res, jobs)
})

router.post('/', (req: Request, res: Response) => {
  const { companyName, legalPerson, businessLicense, qualificationLevel, contactName, contactPhone, address } = req.body
  if (!companyName || !contactName || !contactPhone) {
    return badRequest(res, '缺少必要参数')
  }

  const existing = runQueryOne('SELECT id FROM employers WHERE business_license = ?', [businessLicense || ''])
  if (existing && businessLicense) {
    return badRequest(res, '该营业执照号已注册')
  }

  const id = runInsert(
    'INSERT INTO employers (company_name, legal_person, business_license, qualification_level, contact_name, contact_phone, address, credit_rating, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [companyName, legalPerson || '', businessLicense || '', qualificationLevel || '', contactName, contactPhone, address || '', 80, 0]
  )

  success(res, { id, ...req.body })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const existing = runQueryOne('SELECT id FROM employers WHERE id = ?', [parseInt(id)])
  if (!existing) {
    return notFound(res, '雇主不存在')
  }

  const { companyName, legalPerson, businessLicense, qualificationLevel, contactName, contactPhone, address, creditRating, verified } = req.body

  const updates: string[] = []
  const params: any[] = []

  if (companyName !== undefined) { updates.push('company_name = ?'); params.push(companyName) }
  if (legalPerson !== undefined) { updates.push('legal_person = ?'); params.push(legalPerson) }
  if (businessLicense !== undefined) { updates.push('business_license = ?'); params.push(businessLicense) }
  if (qualificationLevel !== undefined) { updates.push('qualification_level = ?'); params.push(qualificationLevel) }
  if (contactName !== undefined) { updates.push('contact_name = ?'); params.push(contactName) }
  if (contactPhone !== undefined) { updates.push('contact_phone = ?'); params.push(contactPhone) }
  if (address !== undefined) { updates.push('address = ?'); params.push(address) }
  if (creditRating !== undefined) { updates.push('credit_rating = ?'); params.push(creditRating) }
  if (verified !== undefined) { updates.push('verified = ?'); params.push(verified ? 1 : 0) }
  params.push(parseInt(id))

  runUpdate(`UPDATE employers SET ${updates.join(', ')} WHERE id = ?`, params)

  const updated = runQueryOne('SELECT * FROM employers WHERE id = ?', [parseInt(id)])
  success(res, updated)
})

export default router
