import Database from 'better-sqlite3'
import dayjs from 'dayjs'
import type { WorkflowTask, AuditRecord } from '../db/index.js'

function toCamelCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj as T
  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
    }
  }
  return result as T
}

function toCamelCaseArray<T = any>(arr: any[]): T[] {
  return arr.map(item => toCamelCase<T>(item))
}

export interface CreateWorkflowTaskRequest {
  businessType: string
  businessId: number
  title: string
  applicantId: number
  totalLevels?: number
}

export interface AuditHistoryItem {
  id: number
  taskId: number
  auditorId: number
  auditorName: string
  level: number
  action: 'approve' | 'reject'
  comment?: string
  createdAt: string
}

export interface GetTodosQuery {
  auditorId: number
  businessType?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface GetMyTasksQuery {
  applicantId?: number
  status?: string
  page?: number
  pageSize?: number
}

export interface TodoListResult {
  list: any[]
  total: number
  page: number
  pageSize: number
}

export interface AuditRequest {
  taskId: number
  auditorId: number
  action: 'approve' | 'reject'
  comment?: string
}

export interface WorkflowConfig {
  businessType: string
  levels: Array<{
    level: number
    role: string
    description: string
  }>
}

const WORKFLOW_CONFIGS: WorkflowConfig[] = [
  {
    businessType: 'permit',
    levels: [
      { level: 1, role: 'auditor', description: '初审-窗口民警' },
      { level: 2, role: 'auditor', description: '复审-中队长' },
      { level: 3, role: 'admin', description: '终审-大队长' },
    ],
  },
  {
    businessType: 'ebike',
    levels: [
      { level: 1, role: 'auditor', description: '初审-登记人员' },
      { level: 2, role: 'admin', description: '复审-审核人员' },
    ],
  },
  {
    businessType: 'violation',
    levels: [
      { level: 1, role: 'auditor', description: '初审-违法处理民警' },
      { level: 2, role: 'auditor', description: '复审-法制员' },
      { level: 3, role: 'admin', description: '终审-领导审批' },
    ],
  },
  {
    businessType: 'accident',
    levels: [
      { level: 1, role: 'auditor', description: '初审-事故民警' },
      { level: 2, role: 'admin', description: '复审-事故科领导' },
    ],
  },
  {
    businessType: 'certificate',
    levels: [
      { level: 1, role: 'auditor', description: '初审-证照窗口' },
      { level: 2, role: 'admin', description: '复审-证照科领导' },
    ],
  },
]

const ROLE_LEVEL_MAP: Record<string, number[]> = {
  auditor: [1, 2],
  admin: [1, 2, 3],
}

export default class WorkflowService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  createTask(req: CreateWorkflowTaskRequest): any {
    const config = WORKFLOW_CONFIGS.find(c => c.businessType === req.businessType)
    const totalLevels = req.totalLevels || config?.levels.length || 3

    const existingTask = this.db.prepare(`
      SELECT id FROM workflow_tasks 
      WHERE business_type = ? AND business_id = ? AND status = 'pending'
    `).get(req.businessType, req.businessId) as { id: number } | undefined

    if (existingTask) {
      throw new Error('该业务已存在待审核的工作流任务')
    }

    const result = this.db.prepare(`
      INSERT INTO workflow_tasks (
        business_type, business_id, title, applicant_id, 
        current_level, total_levels, status, audit_history
      ) VALUES (?, ?, ?, ?, 1, ?, 'pending', '[]')
    `).run(
      req.businessType,
      req.businessId,
      req.title,
      req.applicantId,
      totalLevels,
    )

    const taskId = result.lastInsertRowid as number
    return this.getTaskDetail(taskId)
  }

  getTaskDetail(taskId: number): any {
    const task = this.db.prepare('SELECT * FROM workflow_tasks WHERE id = ?').get(taskId) as any

    if (!task) {
      throw new Error('工作流任务不存在')
    }

    return toCamelCase(task)
  }

  getTaskByBusinessId(businessType: string, businessId: number): any | null {
    const task = this.db.prepare(`
      SELECT * FROM workflow_tasks 
      WHERE business_type = ? AND business_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(businessType, businessId) as any

    if (!task) return null
    return toCamelCase(task)
  }

  getTodos(query: GetTodosQuery): TodoListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const auditor = this.db.prepare('SELECT role FROM users WHERE id = ?').get(query.auditorId) as { role: string } | undefined
    if (!auditor) {
      throw new Error('审核人不存在')
    }

    const allowedLevels = ROLE_LEVEL_MAP[auditor.role] || [1]

    const conditions: string[] = [
      'status = ?',
      `current_level IN (${allowedLevels.join(',')})`,
    ]
    const params: (string | number)[] = ['pending']

    if (query.businessType) {
      conditions.push('business_type = ?')
      params.push(query.businessType)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM workflow_tasks ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM workflow_tasks ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as any[]

    return {
      list: toCamelCaseArray(list),
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getMyTasks(query: GetMyTasksQuery): TodoListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.applicantId !== undefined) {
      conditions.push('applicant_id = ?')
      params.push(query.applicantId)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM workflow_tasks ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM workflow_tasks ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as any[]

    return {
      list: toCamelCaseArray(list),
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getPendingCount(applicantId?: number, auditorId?: number): number {
    const conditions: string[] = ['status = ?']
    const params: (string | number)[] = ['pending']

    if (applicantId !== undefined) {
      conditions.push('applicant_id = ?')
      params.push(applicantId)
    }

    if (auditorId !== undefined) {
      const auditor = this.db.prepare('SELECT role FROM users WHERE id = ?').get(auditorId) as { role: string } | undefined
      if (auditor) {
        const allowedLevels = ROLE_LEVEL_MAP[auditor.role] || [1]
        conditions.push(`current_level IN (${allowedLevels.join(',')})`)
      }
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM workflow_tasks ${whereClause}
    `).get(...params) as { count: number }

    return result.count || 0
  }

  getMyApplications(applicantId: number, status?: string): any[] {
    const conditions: string[] = ['applicant_id = ?']
    const params: (string | number)[] = [applicantId]

    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const tasks = this.db.prepare(`
      SELECT * FROM workflow_tasks ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `).all(...params) as any[]

    return toCamelCaseArray(tasks)
  }

  audit(req: AuditRequest): any {
    const task = this.getTaskDetail(req.taskId)

    if (task.status !== 'pending') {
      throw new Error('该任务已审核完成')
    }

    const auditor = this.db.prepare('SELECT role, name FROM users WHERE id = ?').get(req.auditorId) as { role: string; name: string } | undefined
    if (!auditor) {
      throw new Error('审核人不存在')
    }

    const allowedLevels = ROLE_LEVEL_MAP[auditor.role] || [1]
    if (!allowedLevels.includes(task.currentLevel)) {
      throw new Error(`您没有权限审核第${task.currentLevel}级审核，您可以审核的级别为：${allowedLevels.join(',')}`)
    }

    const auditResult = this.db.prepare(`
      INSERT INTO audit_records (
        task_id, auditor_id, level, action, comment
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      req.taskId,
      req.auditorId,
      task.currentLevel,
      req.action,
      req.comment || null,
    )

    const auditRecordId = auditResult.lastInsertRowid as number
    const auditRecord: AuditHistoryItem = {
      id: auditRecordId,
      taskId: task.id,
      auditorId: req.auditorId,
      auditorName: auditor.name,
      level: task.currentLevel,
      action: req.action,
      comment: req.comment,
      createdAt: new Date().toISOString(),
    }

    const auditHistory = JSON.parse(task.auditHistory || '[]') as AuditHistoryItem[]
    auditHistory.push(auditRecord)

    if (req.action === 'reject') {
      this.db.prepare(`
        UPDATE workflow_tasks 
        SET status = 'rejected', 
            audit_history = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(auditHistory), req.taskId)

      this.updateBusinessStatus(task.businessType, task.businessId, 'rejected', req.comment)
    } else {
      const nextLevel = task.currentLevel + 1
      if (nextLevel > task.totalLevels) {
        this.db.prepare(`
          UPDATE workflow_tasks 
          SET status = 'approved', 
              audit_history = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(auditHistory), req.taskId)

        this.updateBusinessStatus(task.businessType, task.businessId, 'approved')
      } else {
        this.db.prepare(`
          UPDATE workflow_tasks 
          SET current_level = ?, 
              audit_history = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nextLevel, JSON.stringify(auditHistory), req.taskId)
      }
    }

    return this.getTaskDetail(req.taskId)
  }

  private updateBusinessStatus(businessType: string, businessId: number, status: string, comment?: string): void {
    let sql = ''
    const params: (string | number)[] = [status, businessId]

    switch (businessType) {
      case 'permit':
        if (status === 'rejected') {
          sql = 'UPDATE permit_applications SET status = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          params.splice(1, 0, comment || '审核不通过')
        } else {
          sql = 'UPDATE permit_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        }
        break
      case 'ebike':
        if (status === 'rejected') {
          sql = 'UPDATE ebike_registrations SET status = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          params.splice(1, 0, comment || '审核不通过')
        } else {
          sql = 'UPDATE ebike_registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        }
        break
      case 'violation':
        if (status === 'rejected') {
          sql = 'UPDATE violation_reports SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          params.splice(1, 0, comment || '审核不通过')
        } else {
          sql = 'UPDATE violation_reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        }
        break
      default:
        return
    }

    this.db.prepare(sql).run(...params)
  }

  getAuditHistory(taskId: number): AuditHistoryItem[] {
    const records = this.db.prepare(`
      SELECT 
        ar.id,
        ar.task_id,
        ar.auditor_id,
        u.name as auditor_name,
        ar.level,
        ar.action,
        ar.comment,
        ar.created_at
      FROM audit_records ar
      LEFT JOIN users u ON ar.auditor_id = u.id
      WHERE ar.task_id = ?
      ORDER BY ar.created_at ASC
    `).all(taskId) as Array<{
      id: number
      task_id: number
      auditor_id: number
      auditor_name: string
      level: number
      action: 'approve' | 'reject'
      comment?: string
      created_at: string
    }>

    return records.map(r => ({
      id: r.id,
      taskId: r.task_id,
      auditorId: r.auditor_id,
      auditorName: r.auditor_name,
      level: r.level,
      action: r.action,
      comment: r.comment,
      createdAt: r.created_at,
    }))
  }

  getWorkflowConfig(businessType: string): WorkflowConfig | undefined {
    return WORKFLOW_CONFIGS.find(c => c.businessType === businessType)
  }

  getAllWorkflowConfigs(): WorkflowConfig[] {
    return WORKFLOW_CONFIGS
  }

  getTaskStats(auditorId?: number, applicantId?: number): {
    total: number
    pending: number
    approved: number
    rejected: number
  } {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (auditorId !== undefined) {
      const auditor = this.db.prepare('SELECT role FROM users WHERE id = ?').get(auditorId) as { role: string } | undefined
      if (auditor) {
        const allowedLevels = ROLE_LEVEL_MAP[auditor.role] || [1]
        conditions.push(`current_level IN (${allowedLevels.join(',')})`)
      }
    }

    if (applicantId !== undefined) {
      conditions.push('applicant_id = ?')
      params.push(applicantId)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM workflow_tasks ${whereClause}
    `).get(...params) as {
      total: number
      pending: number
      approved: number
      rejected: number
    }

    return {
      total: stats.total || 0,
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
    }
  }

  getPendingTasksByLevel(level: number): any[] {
    const tasks = this.db.prepare(`
      SELECT * FROM workflow_tasks 
      WHERE status = 'pending' AND current_level = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(level) as any[]

    return toCamelCaseArray(tasks)
  }

  canAudit(auditorId: number, taskId: number): boolean {
    try {
      const task = this.getTaskDetail(taskId)
      if (task.status !== 'pending') return false

      const auditor = this.db.prepare('SELECT role FROM users WHERE id = ?').get(auditorId) as { role: string } | undefined
      if (!auditor) return false

      const allowedLevels = ROLE_LEVEL_MAP[auditor.role] || [1]
      return allowedLevels.includes(task.currentLevel)
    } catch {
      return false
    }
  }
}
