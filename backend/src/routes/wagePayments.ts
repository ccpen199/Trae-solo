import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runInsert, runUpdate } from '../utils/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { contractId, workerId, employerId, status, supervisoryRecorded, page = '1', pageSize = '20' } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = `
    SELECT wp.*, w.name as worker_name, w.phone as worker_phone,
           c.contract_number, c.daily_wage,
           j.project_name, j.trade_name,
           e.company_name as employer_name
    FROM wage_payments wp
    LEFT JOIN workers w ON wp.worker_id = w.id
    LEFT JOIN contracts c ON wp.contract_id = c.id
    LEFT JOIN job_requirements j ON c.job_id = j.id
    LEFT JOIN employers e ON wp.employer_id = e.id
    WHERE 1=1
  `
  let countSql = 'SELECT COUNT(*) as count FROM wage_payments WHERE 1=1'
  const params: any[] = []
  const countParams: any[] = []

  if (contractId) {
    sql += ' AND wp.contract_id = ?'
    countSql += ' AND contract_id = ?'
    params.push(contractId)
    countParams.push(contractId)
  }

  if (workerId) {
    sql += ' AND wp.worker_id = ?'
    countSql += ' AND worker_id = ?'
    params.push(workerId)
    countParams.push(workerId)
  }

  if (employerId) {
    sql += ' AND wp.employer_id = ?'
    countSql += ' AND employer_id = ?'
    params.push(employerId)
    countParams.push(employerId)
  }

  if (status) {
    sql += ' AND wp.status = ?'
    countSql += ' AND status = ?'
    params.push(status)
    countParams.push(status)
  }

  if (supervisoryRecorded !== undefined && supervisoryRecorded !== null && supervisoryRecorded !== '') {
    sql += ' AND wp.supervisory_recorded = ?'
    countSql += ' AND supervisory_recorded = ?'
    const recordedValue = String(supervisoryRecorded)
    const val = recordedValue === 'true' || recordedValue === '1' ? 1 : 0
    params.push(val)
    countParams.push(val)
  }

  sql += ' ORDER BY wp.created_at DESC LIMIT ? OFFSET ?'
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

router.post('/', (req: Request, res: Response) => {
  const { contractId, workerId, employerId, amount, paymentDate, paymentMethod, workDays, status, remark } = req.body
  if (!contractId || !workerId || !employerId || !amount) {
    return badRequest(res, '缺少必要参数')
  }

  const contract = runQueryOne('SELECT * FROM contracts WHERE id = ?', [contractId])
  if (!contract) {
    return badRequest(res, '合同不存在')
  }

  const id = runInsert(
    'INSERT INTO wage_payments (contract_id, worker_id, employer_id, amount, payment_date, payment_method, work_days, status, supervisory_recorded, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [contractId, workerId, employerId, amount, paymentDate || new Date().toISOString().split('T')[0], paymentMethod || 'bank_transfer', workDays || 0, status || 'pending', 1, remark || '']
  )

  success(res, { id, ...req.body })
})

router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  if (!['pending', 'paid', 'overdue', 'disputed'].includes(status)) {
    return badRequest(res, '状态值错误')
  }

  const payment = runQueryOne('SELECT * FROM wage_payments WHERE id = ?', [parseInt(id)])
  if (!payment) {
    return notFound(res, '支付记录不存在')
  }

  runUpdate('UPDATE wage_payments SET status = ?, supervisory_recorded = 1 WHERE id = ?', [status, parseInt(id)])

  success(res, { id: parseInt(id), status })
})

export default router
