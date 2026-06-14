import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runInsert, runUpdate } from '../utils/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { jobId, workerId, employerId, status, page = '1', pageSize = '20' } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = `
    SELECT c.*, w.name as worker_name, w.phone as worker_phone,
           j.project_name, j.trade_name,
           e.company_name as employer_name
    FROM contracts c
    LEFT JOIN workers w ON c.worker_id = w.id
    LEFT JOIN job_requirements j ON c.job_id = j.id
    LEFT JOIN employers e ON c.employer_id = e.id
    WHERE 1=1
  `
  let countSql = 'SELECT COUNT(*) as count FROM contracts WHERE 1=1'
  const params: any[] = []
  const countParams: any[] = []

  if (jobId) {
    sql += ' AND c.job_id = ?'
    countSql += ' AND job_id = ?'
    params.push(jobId)
    countParams.push(jobId)
  }

  if (workerId) {
    sql += ' AND c.worker_id = ?'
    countSql += ' AND worker_id = ?'
    params.push(workerId)
    countParams.push(workerId)
  }

  if (employerId) {
    sql += ' AND c.employer_id = ?'
    countSql += ' AND employer_id = ?'
    params.push(employerId)
    countParams.push(employerId)
  }

  if (status) {
    sql += ' AND c.status = ?'
    countSql += ' AND status = ?'
    params.push(status)
    countParams.push(status)
  }

  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
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
  const contract = runQueryOne(`
    SELECT c.*, w.name as worker_name, w.phone as worker_phone,
           j.project_name, j.trade_name, j.project_address,
           e.company_name as employer_name
    FROM contracts c
    LEFT JOIN workers w ON c.worker_id = w.id
    LEFT JOIN job_requirements j ON c.job_id = j.id
    LEFT JOIN employers e ON c.employer_id = e.id
    WHERE c.id = ?
  `, [parseInt(id)])
  if (!contract) {
    return notFound(res, '合同不存在')
  }
  success(res, contract)
})

router.get('/templates/list', (req: Request, res: Response) => {
  const templates = runQuery('SELECT * FROM contract_templates WHERE is_active = 1 ORDER BY id')
  success(res, templates)
})

router.post('/', (req: Request, res: Response) => {
  const { jobId, workerId, employerId, templateId } = req.body
  if (!jobId || !workerId || !employerId) {
    return badRequest(res, '缺少必要参数')
  }

  const job = runQueryOne('SELECT * FROM job_requirements WHERE id = ?', [jobId])
  const worker = runQueryOne('SELECT name FROM workers WHERE id = ?', [workerId])
  const employer = runQueryOne('SELECT company_name FROM employers WHERE id = ?', [employerId])
  const template = runQueryOne('SELECT * FROM contract_templates WHERE id = ?', [templateId || 1])

  if (!job || !worker || !employer) {
    return badRequest(res, '关联数据不存在')
  }

  const contractNumber = `HT${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  const startDate = new Date(job.start_date || Date.now()).toISOString().split('T')[0]
  const endDate = new Date(job.end_date || Date.now() + 86400000 * 180).toISOString().split('T')[0]
  const dailyWage = job.daily_wage || 300
  const workDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) * 0.8
  const totalAmount = dailyWage * workDays

  let content = template?.content || ''
  content = content.replace(/{employerName}/g, employer.company_name)
  content = content.replace(/{workerName}/g, worker.name)
  content = content.replace(/{jobDescription}/g, job.description || '')
  content = content.replace(/{projectAddress}/g, job.project_address || '')
  content = content.replace(/{startDate}/g, startDate)
  content = content.replace(/{endDate}/g, endDate)
  content = content.replace(/{dailyWage}/g, dailyWage.toString())
  content = content.replace(/{workHours}/g, job.work_hours || '')

  const id = runInsert(
    'INSERT INTO contracts (job_id, worker_id, employer_id, contract_number, start_date, end_date, daily_wage, total_amount, status, template_id, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [jobId, workerId, employerId, contractNumber, startDate, endDate, dailyWage, Math.round(totalAmount), 'draft', templateId || 1, content]
  )

  success(res, { id, contractNumber, status: 'draft' })
})

router.post('/:id/sign/:signerType', (req: Request, res: Response) => {
  const { id, signerType } = req.params
  if (!['worker', 'employer'].includes(signerType)) {
    return badRequest(res, '签署方类型错误')
  }

  const contract = runQueryOne('SELECT * FROM contracts WHERE id = ?', [parseInt(id)])
  if (!contract) {
    return notFound(res, '合同不存在')
  }

  const now = new Date().toISOString()
  let newStatus = contract.status

  if (signerType === 'worker') {
    if (contract.status === 'draft') {
      newStatus = 'signed_by_worker'
    } else if (contract.status === 'signed_by_employer') {
      newStatus = 'fully_signed'
    }
    runUpdate('UPDATE contracts SET worker_signed_at = ?, status = ? WHERE id = ?', [now, newStatus, parseInt(id)])
  } else if (signerType === 'employer') {
    if (contract.status === 'draft') {
      newStatus = 'signed_by_employer'
    } else if (contract.status === 'signed_by_worker') {
      newStatus = 'fully_signed'
    }
    runUpdate('UPDATE contracts SET employer_signed_at = ?, status = ? WHERE id = ?', [now, newStatus, parseInt(id)])
  }

  success(res, { id: parseInt(id), signerType, newStatus, signedAt: now })
})

export default router
