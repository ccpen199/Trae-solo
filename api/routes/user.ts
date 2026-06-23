import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireAnyPermission, requirePermission, isRoleAboveOrEqual } from '../middleware/permission.js'
import { hashPassword } from '../utils/encryption.js'
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserRole,
  UserStatus,
} from '../../shared/types.js'

const router = Router()

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function buildUserQuery(user: Express.Request['user']): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'outlet_admin') {
    conditions.push('outlet_id = ?')
    params.push(user.outletId || '')
  } else if (user?.role === 'regional_supervisor') {
    conditions.push('region_id = ?')
    params.push(user.regionId || '')
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  }
}

router.get(
  '/',
  authMiddleware,
  requireAnyPermission(['user:read:outlet', 'user:read:region', 'user:read:all']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10
      const role = req.query.role as UserRole | undefined
      const status = req.query.status as UserStatus | undefined
      const keyword = req.query.keyword as string | undefined

      const { where, params } = buildUserQuery(req.user)
      const conditions: string[] = []
      const allParams = [...params]

      if (role) {
        conditions.push('u.role = ?')
        allParams.push(role)
      }
      if (status) {
        conditions.push('u.status = ?')
        allParams.push(status)
      }
      if (keyword) {
        conditions.push('(u.username LIKE ? OR u.real_name LIKE ?)')
        allParams.push(`%${keyword}%`, `%${keyword}%`)
      }

      let fullWhere = where
      if (conditions.length > 0) {
        fullWhere = where
          ? where + ' AND ' + conditions.join(' AND ')
          : 'WHERE ' + conditions.join(' AND ')
      }

      const countQuery = `SELECT COUNT(*) as count FROM users u ${fullWhere}`
      const countResult = db.prepare(countQuery).get(...allParams) as { count: number }
      const total = countResult.count

      const offset = (page - 1) * pageSize
      const query = `
        SELECT u.*, o.name as outlet_name
        FROM users u
        LEFT JOIN outlets o ON u.outlet_id = o.id
        ${fullWhere}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `
      const users = db.prepare(query).all(...allParams, pageSize, offset) as Array<
        User & { outlet_name?: string }
      >

      const formattedUsers = users.map((u) => ({
        id: u.id,
        username: u.username,
        realName: u.real_name,
        role: u.role,
        outletId: u.outlet_id,
        outletName: u.outlet_name,
        regionId: u.region_id,
        status: u.status,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      }))

      const response: ApiResponse<PaginatedResponse<typeof formattedUsers[0]>> = {
        success: true,
        data: {
          list: formattedUsers,
          total,
          page,
          pageSize,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[User List Error]', error)
      res.status(500).json({
        success: false,
        error: '查询用户列表失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.post(
  '/',
  authMiddleware,
  requireAnyPermission(['user:create:outlet', 'user:create:outlet_admin', 'user:create:all']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        username,
        password,
        realName,
        role,
        outletId,
        regionId,
      } = req.body as {
        username: string
        password: string
        realName: string
        role: UserRole
        outletId?: string
        regionId?: string
      }

      if (!username || !password || !realName || !role) {
        res.status(400).json({
          success: false,
          error: '缺少必填字段',
        } as ApiResponse)
        return
      }

      if (req.user && !isRoleAboveOrEqual(req.user.role, role)) {
        res.status(403).json({
          success: false,
          error: '无权创建该角色的用户',
        } as ApiResponse)
        return
      }

      const existing = db
        .prepare('SELECT id FROM users WHERE username = ?')
        .get(username) as { id: string } | undefined
      if (existing) {
        res.status(400).json({
          success: false,
          error: '用户名已存在',
        } as ApiResponse)
        return
      }

      if (req.user?.role === 'outlet_admin') {
        if (role !== 'courier') {
          res.status(403).json({
            success: false,
            error: '网点管理员只能创建快递员账号',
          } as ApiResponse)
          return
        }
        if (!outletId || outletId !== req.user.outletId) {
          res.status(403).json({
            success: false,
            error: '只能创建本网点的用户',
          } as ApiResponse)
          return
        }
      }

      if (req.user?.role === 'regional_supervisor') {
        if (!['courier', 'outlet_admin'].includes(role)) {
          res.status(403).json({
            success: false,
            error: '区域监管只能创建快递员或网点管理员账号',
          } as ApiResponse)
          return
        }
        if (!regionId || regionId !== req.user.regionId) {
          res.status(403).json({
            success: false,
            error: '只能创建本区域的用户',
          } as ApiResponse)
          return
        }
      }

      const userId = generateId()
      const now = new Date().toISOString()
      const passwordHash = hashPassword(password)

      db.prepare(
        `INSERT INTO users (
          id, username, password_hash, real_name, role, outlet_id, region_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        userId,
        username,
        passwordHash,
        realName,
        role,
        outletId || null,
        regionId || null,
        'active',
        now,
        now
      )

      if (req.user) {
        db.prepare(
          'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          generateId(),
          req.user.userId,
          'user_create',
          '创建用户',
          JSON.stringify({ userId, username, role }),
          req.ip
        )
      }

      const response: ApiResponse<{ id: string; username: string }> = {
        success: true,
        data: {
          id: userId,
          username,
        },
        message: '用户创建成功',
      }

      res.status(201).json(response)
    } catch (error) {
      console.error('[User Create Error]', error)
      res.status(500).json({
        success: false,
        error: '创建用户失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.put(
  '/:id/permissions',
  authMiddleware,
  requirePermission('user:permissions'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { role, status } = req.body as {
        role?: UserRole
        status?: UserStatus
      }

      if (!role && !status) {
        res.status(400).json({
          success: false,
          error: '请提供要更新的权限或状态',
        } as ApiResponse)
        return
      }

      const existing = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(id) as User | undefined
      if (!existing) {
        res.status(404).json({
          success: false,
          error: '用户不存在',
        } as ApiResponse)
        return
      }

      if (req.user && role && !isRoleAboveOrEqual(req.user.role, role)) {
        res.status(403).json({
          success: false,
          error: '无权将用户设置为该角色',
        } as ApiResponse)
        return
      }

      const now = new Date().toISOString()
      const updates: string[] = []
      const params: unknown[] = []

      if (role) {
        updates.push('role = ?')
        params.push(role)
      }
      if (status) {
        updates.push('status = ?')
        params.push(status)
      }
      updates.push('updated_at = ?')
      params.push(now, id)

      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)

      if (req.user) {
        db.prepare(
          'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          generateId(),
          req.user.userId,
          'user_permissions_update',
          '更新用户权限',
          JSON.stringify({ userId: id, role, status }),
          req.ip
        )
      }

      const response: ApiResponse = {
        success: true,
        message: '用户权限更新成功',
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[User Permissions Update Error]', error)
      res.status(500).json({
        success: false,
        error: '更新用户权限失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

export default router
