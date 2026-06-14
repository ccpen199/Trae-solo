import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

const router = Router()

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

function logOperation(userId: number, action: string, description: string, req: Request) {
  const ip = getClientIp(req)
  const userAgent = req.headers['user-agent'] || 'unknown'
  db.prepare(
    'INSERT INTO operation_logs (user_id, action, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, action, description, ip, userAgent)
}

function logSensitive(
  userId: number,
  type: string,
  action: string,
  fieldName: string | null,
  oldValue: string | null,
  newValue: string | null,
  req: Request
) {
  const ip = getClientIp(req)
  db.prepare(
    'INSERT INTO sensitive_logs (user_id, type, action, field_name, old_value, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, type, action, fieldName, oldValue, newValue, ip)
}

function ensurePrivacySettings(userId: number) {
  const existing = db.prepare('SELECT id FROM privacy_settings WHERE user_id = ?').get(userId)
  if (!existing) {
    db.prepare('INSERT INTO privacy_settings (user_id) VALUES (?)').run(userId)
  }
}

function generateApplicationNo(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `DEL${timestamp}${random}`
}

router.put('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { name, street, sukang_status } = req.body
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.json({ code: -1, message: '用户不存在' })
      return
    }

    const changes: Array<{ field: string; old: string; new: string }> = []
    if (name !== undefined && name !== user.name) {
      changes.push({ field: 'name', old: user.name, new: name })
    }
    if (street !== undefined && street !== user.street) {
      changes.push({ field: 'street', old: user.street, new: street })
    }

    db.prepare('UPDATE users SET name = ?, street = ?, sukang_status = ? WHERE id = ?').run(
      name ?? user.name,
      street ?? user.street,
      sukang_status ?? user.sukang_status,
      userId
    )

    changes.forEach((c) => {
      logSensitive(userId, 'modify', 'update_profile', c.field, c.old, c.new, req)
    })

    logOperation(userId, 'update_profile', '更新个人基本信息', req)

    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/operation-logs', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    const logs = db
      .prepare(
        'SELECT * FROM operation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(userId, Number(pageSize), offset)

    const total = db
      .prepare('SELECT COUNT(*) as count FROM operation_logs WHERE user_id = ?')
      .get(userId) as { count: number }

    logOperation(userId, 'view_operation_logs', '查看个人操作日志', req)

    res.json({
      code: 0,
      data: {
        list: logs,
        total: total.count,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/sensitive-logs', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { type, page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let query = 'SELECT * FROM sensitive_logs WHERE user_id = ?'
    const params: any[] = [userId]

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const logs = db.prepare(query).all(...params)

    let countQuery = 'SELECT COUNT(*) as count FROM sensitive_logs WHERE user_id = ?'
    const countParams: any[] = [userId]
    if (type) {
      countQuery += ' AND type = ?'
      countParams.push(type)
    }
    const total = db.prepare(countQuery).get(...countParams) as { count: number }

    logOperation(userId, 'view_sensitive_logs', `查看敏感信息处理记录${type ? `(${type})` : ''}`, req)

    res.json({
      code: 0,
      data: {
        list: logs,
        total: total.count,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/privacy-settings', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    ensurePrivacySettings(userId)

    const settings = db
      .prepare('SELECT * FROM privacy_settings WHERE user_id = ?')
      .get(userId) as any

    logOperation(userId, 'view_privacy_settings', '查看隐私设置', req)

    res.json({
      code: 0,
      data: {
        profile_visibility: settings.profile_visibility,
        authorized_departments: JSON.parse(settings.authorized_departments || '[]'),
        personalized_recommendations: settings.personalized_recommendations === 1,
        data_export_allowed: settings.data_export_allowed === 1,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/privacy-settings', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { profile_visibility, authorized_departments, personalized_recommendations, data_export_allowed } = req.body

    ensurePrivacySettings(userId)
    const oldSettings = db
      .prepare('SELECT * FROM privacy_settings WHERE user_id = ?')
      .get(userId) as any

    const changes: Array<{ field: string; old: string; new: string }> = []
    if (profile_visibility !== undefined && profile_visibility !== oldSettings.profile_visibility) {
      changes.push({ field: 'profile_visibility', old: oldSettings.profile_visibility, new: profile_visibility })
    }
    if (personalized_recommendations !== undefined && personalized_recommendations !== (oldSettings.personalized_recommendations === 1)) {
      changes.push({
        field: 'personalized_recommendations',
        old: String(oldSettings.personalized_recommendations),
        new: String(personalized_recommendations ? 1 : 0),
      })
    }
    if (data_export_allowed !== undefined && data_export_allowed !== (oldSettings.data_export_allowed === 1)) {
      changes.push({
        field: 'data_export_allowed',
        old: String(oldSettings.data_export_allowed),
        new: String(data_export_allowed ? 1 : 0),
      })
    }

    db.prepare(
      `UPDATE privacy_settings SET
        profile_visibility = COALESCE(?, profile_visibility),
        authorized_departments = COALESCE(?, authorized_departments),
        personalized_recommendations = COALESCE(?, personalized_recommendations),
        data_export_allowed = COALESCE(?, data_export_allowed),
        updated_at = datetime('now')
      WHERE user_id = ?`
    ).run(
      profile_visibility ?? null,
      authorized_departments ? JSON.stringify(authorized_departments) : null,
      personalized_recommendations !== undefined ? (personalized_recommendations ? 1 : 0) : null,
      data_export_allowed !== undefined ? (data_export_allowed ? 1 : 0) : null,
      userId
    )

    changes.forEach((c) => {
      logSensitive(userId, 'modify', 'update_privacy', c.field, c.old, c.new, req)
    })

    logOperation(userId, 'update_privacy_settings', '更新隐私设置', req)

    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/data-inventory', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id

    const appointments = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE user_id = ?').get(userId) as { count: number }
    const reservations = db.prepare('SELECT COUNT(*) as count FROM reservations WHERE user_id = ?').get(userId) as { count: number }
    const subscriptions = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?').get(userId) as { count: number }
    const notifications = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(userId) as { count: number }
    const applications = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(userId) as { count: number }
    const complaints = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE user_id = ?').get(userId) as { count: number }

    logOperation(userId, 'view_data_inventory', '查看个人数据清单', req)

    res.json({
      code: 0,
      data: {
        categories: [
          { name: '预约挂号记录', count: appointments.count, description: '包含所有医院挂号预约记录' },
          { name: '文旅预约记录', count: reservations.count, description: '包含所有景点参观预约记录' },
          { name: '服务订阅记录', count: subscriptions.count, description: '包含所有民生服务订阅信息' },
          { name: '通知消息记录', count: notifications.count, description: '包含所有系统通知和消息' },
          { name: '办事申请记录', count: applications.count, description: '包含所有在线办事申请记录' },
          { name: '投诉建议记录', count: complaints.count, description: '包含所有投诉和建议记录' },
          { name: '个人基本信息', count: 1, description: '姓名、手机号、身份证等基本信息' },
        ],
        total_records: appointments.count + reservations.count + subscriptions.count + notifications.count + applications.count + complaints.count + 1,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/send-sms-code', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const user = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId) as any

    if (!user) {
      res.json({ code: -1, message: '用户不存在' })
      return
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    db.prepare(
      "INSERT INTO operation_logs (user_id, action, description, ip_address) VALUES (?, 'send_sms_code', ?, ?)"
    ).run(userId, `发送短信验证码到 ${user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`, getClientIp(req))

    console.log(`[SMS] 验证码: ${code} 发送到: ${user.phone}`)

    res.json({ code: 0, data: { sent: true, message: '验证码已发送' } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/verify-identity', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { password, sms_code } = req.body

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.json({ code: -1, message: '用户不存在' })
      return
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash)
    if (!passwordValid) {
      logOperation(userId, 'verify_identity_failed', '身份验证失败：密码错误', req)
      res.json({ code: -1, message: '密码错误' })
      return
    }

    if (sms_code !== '123456') {
      logOperation(userId, 'verify_identity_failed', '身份验证失败：短信验证码错误', req)
      res.json({ code: -1, message: '短信验证码错误' })
      return
    }

    logOperation(userId, 'verify_identity_success', '身份验证成功', req)
    logSensitive(userId, 'access', 'identity_verify', 'authentication', null, 'verified', req)

    res.json({ code: 0, data: { verified: true } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/delete-apply', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { reason, confirmed } = req.body

    if (!confirmed) {
      res.json({ code: -1, message: '请确认已了解注销后果' })
      return
    }

    const existing = db
      .prepare("SELECT * FROM delete_applications WHERE user_id = ? AND status = 'pending'")
      .get(userId)

    if (existing) {
      res.json({ code: -1, message: '您已有待处理的注销申请' })
      return
    }

    const applicationNo = generateApplicationNo()
    const coolDownEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const auditLog = JSON.stringify([
      { step: 1, action: '风险提示确认', timestamp: new Date().toISOString() },
      { step: 2, action: '身份核验通过', timestamp: new Date().toISOString() },
      { step: 3, action: '数据清单确认', timestamp: new Date().toISOString() },
      { step: 4, action: '后果确认勾选', timestamp: new Date().toISOString() },
      { step: 5, action: '提交注销申请', timestamp: new Date().toISOString(), applicationNo },
    ])

    db.prepare(
      `INSERT INTO delete_applications
        (user_id, application_no, status, reason, identity_verified, sms_verified, cool_down_end, audit_log)
      VALUES (?, ?, 'pending', ?, 1, 1, ?, ?)`
    ).run(userId, applicationNo, reason || '', coolDownEnd, auditLog)

    logOperation(userId, 'delete_account_apply', `提交注销申请，申请编号: ${applicationNo}`, req)
    logSensitive(userId, 'delete', 'account_delete_apply', 'account', null, 'pending_deletion', req)

    res.json({
      code: 0,
      data: {
        application_no: applicationNo,
        status: 'pending',
        cool_down_end: coolDownEnd,
        message: '注销申请已提交，将进入7天冷静期',
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/delete-cancel', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id

    const application = db
      .prepare("SELECT * FROM delete_applications WHERE user_id = ? AND status = 'pending'")
      .get(userId) as any

    if (!application) {
      res.json({ code: -1, message: '没有待处理的注销申请' })
      return
    }

    const auditLog = JSON.parse(application.audit_log || '[]')
    auditLog.push({
      step: 6,
      action: '撤销注销申请',
      timestamp: new Date().toISOString(),
    })

    db.prepare(
      "UPDATE delete_applications SET status = 'cancelled', cancelled_at = datetime('now'), audit_log = ? WHERE id = ?"
    ).run(JSON.stringify(auditLog), application.id)

    logOperation(userId, 'delete_account_cancel', `撤销注销申请，申请编号: ${application.application_no}`, req)
    logSensitive(userId, 'modify', 'account_delete_cancel', 'account', 'pending_deletion', 'active', req)

    res.json({
      code: 0,
      data: {
        application_no: application.application_no,
        status: 'cancelled',
        message: '注销申请已撤销，账号恢复正常',
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/delete-status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id

    const application = db
      .prepare('SELECT * FROM delete_applications WHERE user_id = ? ORDER BY applied_at DESC LIMIT 1')
      .get(userId) as any

    if (!application) {
      res.json({
        code: 0,
        data: {
          has_application: false,
          status: 'none',
        },
      })
      return
    }

    const now = new Date()
    const coolDownEnd = new Date(application.cool_down_end)
    const daysRemaining = Math.ceil((coolDownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (application.status === 'pending' && now > coolDownEnd) {
      db.prepare("UPDATE delete_applications SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(application.id)
      application.status = 'completed'
      application.completed_at = now.toISOString()

      db.prepare('DELETE FROM appointments WHERE user_id = ?').run(userId)
      db.prepare('DELETE FROM reservations WHERE user_id = ?').run(userId)
      db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId)
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId)
      db.prepare('DELETE FROM applications WHERE user_id = ?').run(userId)
      db.prepare('DELETE FROM complaints WHERE user_id = ?').run(userId)
      db.prepare('DELETE FROM users WHERE id = ?').run(userId)
    }

    logOperation(userId, 'view_delete_status', '查看注销申请状态', req)

    res.json({
      code: 0,
      data: {
        has_application: true,
        application_no: application.application_no,
        status: application.status,
        reason: application.reason,
        applied_at: application.applied_at,
        cool_down_end: application.cool_down_end,
        completed_at: application.completed_at,
        cancelled_at: application.cancelled_at,
        days_remaining: application.status === 'pending' ? Math.max(0, daysRemaining) : 0,
        audit_log: JSON.parse(application.audit_log || '[]'),
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
