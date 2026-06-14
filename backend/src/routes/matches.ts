import { Router, Request, Response } from 'express'
import { success, notFound, badRequest } from '../utils/response'
import { runQuery, runQueryOne, runUpdate } from '../utils/db'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { jobId, workerId, employerId, status, page = '1', pageSize = '20' } = req.query
  const p = parseInt(page as string)
  const ps = parseInt(pageSize as string)
  const offset = (p - 1) * ps

  let sql = `
    SELECT m.*, 
           w.name as worker_name, w.phone as worker_phone, w.performance_score,
           j.project_name, j.trade_name, j.daily_wage, j.project_address,
           e.company_name as employer_name
    FROM job_matches m
    LEFT JOIN workers w ON m.worker_id = w.id
    LEFT JOIN job_requirements j ON m.job_id = j.id
    LEFT JOIN employers e ON j.employer_id = e.id
    WHERE 1=1
  `
  let countSql = 'SELECT COUNT(*) as count FROM job_matches WHERE 1=1'
  const params: any[] = []
  const countParams: any[] = []

  if (jobId) {
    sql += ' AND m.job_id = ?'
    countSql += ' AND job_id = ?'
    params.push(jobId)
    countParams.push(jobId)
  }

  if (workerId) {
    sql += ' AND m.worker_id = ?'
    countSql += ' AND worker_id = ?'
    params.push(workerId)
    countParams.push(workerId)
  }

  if (employerId) {
    sql += ' AND j.employer_id = ?'
    countSql += ' AND job_id IN (SELECT id FROM job_requirements WHERE employer_id = ?)'
    params.push(employerId)
    countParams.push(employerId)
  }

  if (status) {
    sql += ' AND m.status = ?'
    countSql += ' AND status = ?'
    params.push(status)
    countParams.push(status)
  }

  sql += ' ORDER BY m.match_score DESC, m.created_at DESC LIMIT ? OFFSET ?'
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

router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  if (!['pending', 'accepted', 'rejected', 'hired'].includes(status)) {
    return badRequest(res, '状态值错误')
  }

  const match = runQueryOne('SELECT * FROM job_matches WHERE id = ?', [parseInt(id)])
  if (!match) {
    return notFound(res, '匹配记录不存在')
  }

  runUpdate('UPDATE job_matches SET status = ? WHERE id = ?', [status, parseInt(id)])

  if (status === 'hired') {
    const hiredCount = runQueryOne('SELECT COUNT(*) as count FROM job_matches WHERE job_id = ? AND status = ?', [match.job_id, 'hired'])
    const job = runQueryOne('SELECT quantity FROM job_requirements WHERE id = ?', [match.job_id])
    if (job && hiredCount && hiredCount.count >= job.quantity) {
      runUpdate('UPDATE job_requirements SET status = ? WHERE id = ?', ['filled', match.job_id])
    }
  }

  success(res, { id: parseInt(id), status })
})

export default router
