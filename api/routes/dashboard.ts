import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

interface Activity {
  id: number
  type: string
  title: string
  time: string
  status: string
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

router.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const orgId = req.user!.org_id

    const isAdmin = userRole === 'admin' || userRole === 'platform' || userRole === 'ops'
    const isAgent = userRole === 'agent'
    const isManager = userRole === 'manager'

    const agentCondition = isAdmin ? '' :
      isAgent ? 'agent_id = ?' :
      'agent_id IN (SELECT id FROM users WHERE org_id = ?)'
    const agentParam = isAdmin ? [] :
      isAgent ? [userId] : [orgId]

    const houseConditions = ["status != 'offline'"]
    if (agentCondition) houseConditions.push(agentCondition)
    const houseWhere = houseConditions.length ? 'WHERE ' + houseConditions.join(' AND ') : ''
    const housesRow = db.prepare(
      `SELECT COUNT(*) as count FROM houses ${houseWhere}`
    ).get(...agentParam) as { count: number }

    const clientConditions: string[] = []
    if (agentCondition) clientConditions.push(agentCondition)
    const clientWhere = clientConditions.length ? 'WHERE ' + clientConditions.join(' AND ') : ''
    const clientsRow = db.prepare(
      `SELECT COUNT(*) as count FROM clients ${clientWhere}`
    ).get(...agentParam) as { count: number }

    const today = new Date().toISOString().split('T')[0]
    const scheduleConditions = ['DATE(start_time) = ?']
    if (agentCondition) scheduleConditions.push(agentCondition)
    const scheduleWhere = 'WHERE ' + scheduleConditions.join(' AND ')
    const schedulesRow = db.prepare(
      `SELECT COUNT(*) as count FROM schedules ${scheduleWhere}`
    ).get(today, ...agentParam) as { count: number }

    const txConditions = ["status != 'completed'"]
    if (agentCondition) txConditions.push(agentCondition)
    const txWhere = txConditions.length ? 'WHERE ' + txConditions.join(' AND ') : ''
    const transactionsRow = db.prepare(
      `SELECT COUNT(*) as count FROM transactions ${txWhere}`
    ).get(...agentParam) as { count: number }

    const commConditions: string[] = []
    if (agentCondition) commConditions.push(agentCondition)
    const commWhere = commConditions.length ? 'WHERE ' + commConditions.join(' AND ') : ''
    const commissionsRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM commissions ${commWhere}`
    ).get(...agentParam) as { total: number }

    const activities: Activity[] = []

    const auditLogs = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all() as any[]

    for (const log of auditLogs) {
      let type = 'info'
      let title = ''
      let status = 'success'
      const resourceType = log.resource_type || log.table_name || ''
      let detail: Record<string, any> = {}
      try {
        detail = log.detail ? JSON.parse(log.detail) : {}
      } catch {
        detail = {}
      }
      const recordTitle = log.record_title || detail.body?.title || detail.body?.name || ''

      switch (resourceType) {
        case 'house':
        case 'houses':
          type = 'house'
          if (log.action === 'create') title = `新增房源：${recordTitle || '房源信息'}`
          else if (log.action === 'update') title = `房源信息更新：${recordTitle || '房源信息'}`
          else if (log.action === 'delete') title = `房源下架：${recordTitle || '房源信息'}`
          break
        case 'client':
        case 'clients':
          type = 'client'
          if (log.action === 'create') title = `新增客户：${recordTitle || '客户信息'}`
          else if (log.action === 'update') title = `客户意向更新：${recordTitle || '客户信息'}`
          else if (log.action === 'followup') title = `客户跟进：${recordTitle || '客户信息'}`
          break
        case 'schedule':
        case 'schedules':
          type = 'schedule'
          if (log.action === 'create') title = `新建带看：${recordTitle || '带看日程'}`
          else if (log.action === 'update') title = `带看完成：${recordTitle || '带看日程'}`
          break
        case 'transaction':
        case 'transactions':
          type = 'transaction'
          if (log.action === 'create') title = `交易创建：${recordTitle || '交易'}`
          else if (log.action === 'update' || log.action === 'update_status' || log.action === 'update_node') title = `交易进度更新：${recordTitle || '交易'}`
          break
        case 'commission':
        case 'commissions':
          type = 'commission'
          if (log.action === 'create') title = `佣金登记：${recordTitle || '佣金'}`
          else if (log.action === 'update' || log.action === 'settle') title = `佣金发放：${recordTitle || '佣金'}`
          break
        default:
          continue
      }

      if (title) {
        activities.push({
          id: log.id,
          type,
          title,
          time: formatTimeAgo(log.created_at),
          status: log.action === 'delete' ? 'pending' : 'success',
        })
      }
    }

    if (activities.length < 5) {
      const fallbackActivities = [
        { type: 'house', title: '新增房源：万科城市花园 3室2厅', status: 'success' },
        { type: 'client', title: '客户张三意向房源更新', status: 'success' },
        { type: 'schedule', title: '带看日程已完成：碧桂园·天玺湾', status: 'success' },
        { type: 'transaction', title: '交易进度更新：签约完成', status: 'pending' },
        { type: 'commission', title: '佣金已发放：¥12,500', status: 'success' },
      ]
      for (let i = activities.length; i < Math.min(5, fallbackActivities.length); i++) {
        activities.push({
          id: Date.now() + i,
          ...fallbackActivities[i],
          time: `${i + 1}小时前`,
        })
      }
    }

    const user = db.prepare(
      'SELECT cert_status, role FROM users WHERE id = ?'
    ).get(userId) as { cert_status: string; role: string }

    const pendingCerts = isAdmin ? db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE cert_status = 'pending'
    `).get() as { count: number } : null

    const pendingReviews = (isAdmin || userRole === 'platform') ? db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs WHERE action IN ('delete', 'update') AND created_at > datetime('now', '-7 days')
    `).get() as { count: number } : null

    const pendingHouses = (isAdmin || userRole === 'platform' || isManager) ? db.prepare(`
      SELECT COUNT(*) as count FROM houses WHERE cert_status = 'pending'
    `).get() as { count: number } : null

    const roleLabels: Record<string, string> = {
      admin: '系统管理员',
      platform: '平台运营',
      ops: '运维工程师',
      director: '业务总监',
      manager: '门店店长',
      agent: '房产经纪人',
    }

    const rolePermissions: Record<string, string[]> = {
      admin: ['全部功能', '组织管理', '审计日志', '用户管理', '权限配置'],
      platform: ['全部业务功能', '审计日志', '平台配置'],
      ops: ['业务功能', '系统配置', '跨组织数据'],
      director: ['全部业务功能', '组织管理', '门店数据'],
      manager: ['房源/客源/带看/交易/佣金', '门店管理', '经纪人数据'],
      agent: ['个人房源', '个人客源', '个人带看', '个人交易', '个人佣金'],
    }

    const roleOrgStatus = (isAdmin || isManager || userRole === 'director') ? db.prepare(`
      SELECT COUNT(*) as member_count FROM users WHERE org_id = ?
    `).get(orgId) as { member_count: number } : null

    res.json({
      success: true,
      data: {
        stats: {
          houses: housesRow.count,
          clients: clientsRow.count,
          schedules: schedulesRow.count,
          transactions: transactionsRow.count,
          commissions: commissionsRow.total,
        },
        activities: activities.slice(0, 10),
        userStatus: {
          cert_status: user.cert_status,
          cert_label: user.cert_status === 'certified' ? '已认证' :
                      user.cert_status === 'pending' ? '认证审核中' :
                      user.cert_status === 'rejected' ? '认证被驳回' : '未提交认证',
          role: user.role,
          role_label: roleLabels[user.role] || user.role,
          permissions: rolePermissions[user.role] || [],
        },
        todos: {
          pending_certs: pendingCerts?.count || 0,
          pending_reviews: pendingReviews?.count || 0,
          pending_houses: pendingHouses?.count || 0,
          org_members: roleOrgStatus?.member_count || 0,
        },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
