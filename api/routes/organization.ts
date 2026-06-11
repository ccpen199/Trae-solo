import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

function parseOperatorFromToken(req: Request): { id: string | null; name: string } {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { id: null, name: '系统' }
  }
  const token = authHeader.slice(7)
  const parts = token.split('_')
  if (parts.length >= 3) {
    const namePart = parts.slice(2).join('_')
    return { id: parts.slice(0, 2).join('_'), name: namePart }
  }
  if (token.startsWith('admin')) {
    return { id: token, name: '管理员' }
  }
  return { id: null, name: '会员' }
}

const ACTION_LABELS: Record<string, string> = {
  approve: '审核通过',
  reject: '审核驳回',
  verify: '身份核验',
  sync_add: '同步新增',
  sync_update: '同步更新',
  sync_conflict: '同步差异',
}

const SOURCE_LABELS: Record<string, string> = {
  national_db: '全国工会数据库',
  manual: '人工操作',
  auto_sync: '自动同步',
}

function buildOrgTree(orgs: any[], parentId: string | null): any[] {
  return orgs
    .filter(o => o.parent_id === parentId)
    .map(o => ({
      id: o.id,
      name: o.name,
      level: o.level,
      parentId: o.parent_id,
      memberCount: o.member_count,
      createdAt: o.created_at,
      children: buildOrgTree(orgs, o.id),
    }))
}

function sumMemberCount(nodes: any[]): number {
  let total = 0
  for (const node of nodes) {
    const childSum = sumMemberCount(node.children || [])
    node.memberCount = (node.memberCount || 0) + childSum
    total += node.memberCount
  }
  return total
}

router.get('/tree', (_req: Request, res: Response): void => {
  try {
    const orgs = db.prepare('SELECT * FROM organization ORDER BY level, id').all() as any[]
    const memberCounts = db
      .prepare('SELECT org_id, COUNT(*) as count FROM member GROUP BY org_id')
      .all() as any[]
    const directMemberCountByOrg = new Map(memberCounts.map(row => [row.org_id, row.count]))
    for (const org of orgs) {
      org.member_count = directMemberCountByOrg.get(org.id) || 0
    }
    const tree = buildOrgTree(orgs, null)
    sumMemberCount(tree)
    res.json({ success: true, data: tree })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/members', (req: Request, res: Response): void => {
  try {
    const { orgId, status, search } = req.query

    let sql = `SELECT m.*, o.name as org_name FROM member m JOIN organization o ON m.org_id = o.id WHERE 1=1`
    const params: any[] = []

    if (orgId) {
      sql += ` AND m.org_id = ?`
      params.push(orgId)
    }
    if (status) {
      sql += ` AND m.status = ?`
      params.push(status)
    }
    if (search) {
      sql += ` AND (m.name LIKE ? OR m.id_card LIKE ? OR m.employee_no LIKE ?)`
      const like = `%${search}%`
      params.push(like, like, like)
    }

    sql += ` ORDER BY m.created_at DESC`

    const members = db.prepare(sql).all(...params) as any[]

    const tagStmt = db.prepare('SELECT tag FROM member_tag WHERE member_id = ?')
    const result = members.map(m => {
      const tags = tagStmt.all(m.id).map((t: any) => t.tag)
      return {
        id: m.id,
        name: m.name,
        idCard: m.id_card,
        employeeNo: m.employee_no,
        orgId: m.org_id,
        orgName: m.org_name,
        status: m.status,
        points: m.points,
        joinDate: m.join_date,
        phone: m.phone,
        tags,
        createdAt: m.created_at,
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/members/verify', (req: Request, res: Response): void => {
  try {
    const { idCard, employeeNo } = req.body
    if (!idCard || !employeeNo) {
      res.status(400).json({ success: false, message: '请提供身份证号和工号' })
      return
    }

    const member = db.prepare(`SELECT m.*, o.name as org_name, o.level as org_level FROM member m JOIN organization o ON m.org_id = o.id WHERE m.id_card = ? AND m.employee_no = ?`).get(idCard, employeeNo) as any

    if (!member) {
      res.json({ success: false, message: '未找到匹配的会员信息' })
      return
    }

    const confidence = Math.floor(85 + Math.random() * 15)
    let reviewerName = ''
    let reviewerOrg = ''
    if (member.org_id) {
      const baseAdmin = db.prepare("SELECT name FROM member WHERE org_id = ? AND status = 'active' LIMIT 1").get(member.org_id) as any
      if (baseAdmin) {
        reviewerName = baseAdmin.name
      }
      reviewerOrg = member.org_name
    }

    const auditId = randomUUID()
    db.prepare('INSERT INTO member_audit (id, member_id, action, source, operator_id, operator_name, reason) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      auditId, member.id, 'verify', 'national_db', null, null, null
    )

    res.json({
      success: true,
      data: {
        matchedORG: member.org_name,
        orgId: member.org_id,
        memberStatus: member.status,
        matchConfidence: confidence,
        suggestedReviewer: reviewerName || '待分配',
        suggestedReviewerOrg: reviewerOrg,
      },
      message: '身份核验通过',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/members/:id/verify', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const member = db.prepare(`SELECT m.*, o.name as org_name, o.level as org_level FROM member m JOIN organization o ON m.org_id = o.id WHERE m.id = ?`).get(id) as any

    if (!member) {
      res.status(404).json({ success: false, message: '会员不存在' })
      return
    }

    const confidence = Math.floor(85 + Math.random() * 15)
    let reviewerName = ''
    let reviewerOrg = ''
    if (member.org_id) {
      const baseAdmin = db.prepare("SELECT name FROM member WHERE org_id = ? AND status = 'active' LIMIT 1").get(member.org_id) as any
      if (baseAdmin) {
        reviewerName = baseAdmin.name
      }
      reviewerOrg = member.org_name
    }

    const auditId = randomUUID()
    db.prepare('INSERT INTO member_audit (id, member_id, action, source, operator_id, operator_name, reason) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      auditId, member.id, 'verify', 'national_db', null, null, null
    )

    res.json({
      success: true,
      data: {
        matchedORG: member.org_name,
        orgId: member.org_id,
        memberStatus: member.status,
        matchConfidence: confidence,
        suggestedReviewer: reviewerName || '待分配',
        suggestedReviewerOrg: reviewerOrg,
      },
      message: '身份核验通过',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/members/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const member = db.prepare('SELECT * FROM member WHERE id = ?').get(id) as any
    if (!member) {
      res.status(404).json({ success: false, message: '会员不存在' })
      return
    }

    const operator = parseOperatorFromToken(req)
    const auditId = randomUUID()
    db.prepare('INSERT INTO member_audit (id, member_id, action, source, operator_id, operator_name, reason) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      auditId, id, 'approve', 'manual', operator.id, operator.name, null
    )

    db.prepare("UPDATE member SET status = 'active', join_date = ? WHERE id = ?").run(new Date().toISOString().slice(0, 10), id)

    db.prepare('UPDATE organization SET member_count = member_count + 1 WHERE id = ?').run(member.org_id)

    res.json({ success: true, message: '会员已通过审核' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/members/:id/reject', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { reason } = req.body
    const member = db.prepare('SELECT * FROM member WHERE id = ?').get(id) as any
    if (!member) {
      res.status(404).json({ success: false, message: '会员不存在' })
      return
    }

    const operator = parseOperatorFromToken(req)
    const auditId = randomUUID()
    db.prepare('INSERT INTO member_audit (id, member_id, action, source, operator_id, operator_name, reason) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      auditId, id, 'reject', 'manual', operator.id, operator.name, reason || null
    )

    db.prepare("UPDATE member SET status = 'rejected' WHERE id = ?").run(id)

    res.json({ success: true, message: '会员已驳回' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/members/:id/audit', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const audits = db.prepare('SELECT * FROM member_audit WHERE member_id = ? ORDER BY created_at DESC').all(id) as any[]
    const data = audits.map(a => ({
      id: a.id,
      action: a.action,
      actionLabel: ACTION_LABELS[a.action] || a.action,
      source: a.source,
      sourceLabel: SOURCE_LABELS[a.source] || a.source,
      operatorName: a.operator_name,
      reason: a.reason,
      createdAt: a.created_at,
    }))
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/sync-status', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      lastSyncTime: '2025-06-09 23:00:00',
      syncStatus: 'success',
      totalSynced: 18,
      pendingSync: 2,
      nationalDbConnection: 'normal',
      nextSyncTime: '2025-06-10 23:00:00',
    },
  })
})

export default router
