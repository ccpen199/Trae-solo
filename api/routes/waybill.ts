import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireAnyPermission } from '../middleware/permission.js'
import { encryptAES256, decryptAES256 } from '../utils/encryption.js'
import type {
  ApiResponse,
  PaginatedResponse,
  Waybill,
  WaybillItem,
  WaybillStatus,
} from '../../shared/types.js'

const router = Router()

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function generateTrackingNo(): string {
  return 'SF' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

function generateRegulatoryCode(): string {
  return 'REG' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
}

function buildWaybillQuery(user: Express.Request['user']): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'courier') {
    conditions.push('courier_id = ?')
    params.push(user.userId)
  } else if (user?.role === 'outlet_admin') {
    conditions.push('outlet_id = ?')
    params.push(user.outletId || '')
  } else if (user?.role === 'regional_supervisor') {
    conditions.push('outlet_id IN (SELECT id FROM outlets WHERE region_id = ?)')
    params.push(user.regionId || '')
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  }
}

function decryptWaybill(waybill: Waybill & { outlet_name?: string; courier_name?: string }) {
  return {
    ...waybill,
    senderName: decryptAES256(waybill.sender_name_enc),
    senderPhone: decryptAES256(waybill.sender_phone_enc),
    senderAddress: decryptAES256(waybill.sender_address_enc),
    receiverName: decryptAES256(waybill.receiver_name_enc),
    receiverPhone: decryptAES256(waybill.receiver_phone_enc),
    receiverAddress: decryptAES256(waybill.receiver_address_enc),
    items: JSON.parse(decryptAES256(waybill.items_json_enc)) as WaybillItem[],
  }
}

router.get(
  '/',
  authMiddleware,
  requireAnyPermission(['waybill:list:self', 'waybill:list:outlet', 'waybill:list:region', 'waybill:list:all']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10
      const status = req.query.status as WaybillStatus | undefined
      const keyword = req.query.keyword as string | undefined

      const { where, params } = buildWaybillQuery(req.user)
      const conditions: string[] = []
      const allParams = [...params]

      if (status) {
        conditions.push('w.status = ?')
        allParams.push(status)
      }

      if (keyword) {
        conditions.push('w.tracking_no LIKE ?')
        allParams.push(`%${keyword}%`)
      }

      const fullWhere =
        where +
        (where && conditions.length > 0 ? ' AND ' : '') +
        (conditions.length > 0 ? 'WHERE '.replace('WHERE', '') + conditions.join(' AND ') : '')

      const countQuery = `SELECT COUNT(*) as count FROM waybills w ${fullWhere ? fullWhere.replace('WHERE ', 'WHERE ') : ''}`
      const countResult = db.prepare(countQuery).get(...allParams) as { count: number }
      const total = countResult.count

      const offset = (page - 1) * pageSize
      const query = `
        SELECT w.*, o.name as outlet_name, u.real_name as courier_name
        FROM waybills w
        LEFT JOIN outlets o ON w.outlet_id = o.id
        LEFT JOIN users u ON w.courier_id = u.id
        ${fullWhere ? fullWhere : ''}
        ORDER BY w.created_at DESC
        LIMIT ? OFFSET ?
      `
      const waybills = db.prepare(query).all(...allParams, pageSize, offset) as Array<
        Waybill & { outlet_name?: string; courier_name?: string }
      >

      const decryptedWaybills = waybills.map((wb) => ({
        id: wb.id,
        trackingNo: wb.tracking_no,
        regulatoryCode: wb.regulatory_code,
        senderName: decryptAES256(wb.sender_name_enc),
        senderPhone: decryptAES256(wb.sender_phone_enc),
        receiverName: decryptAES256(wb.receiver_name_enc),
        receiverPhone: decryptAES256(wb.receiver_phone_enc),
        weight: wb.weight,
        freight: wb.freight,
        status: wb.status,
        outletId: wb.outlet_id,
        outletName: wb.outlet_name,
        courierId: wb.courier_id,
        courierName: wb.courier_name,
        createdAt: wb.created_at,
        syncedAt: wb.synced_at,
      }))

      const response: ApiResponse<PaginatedResponse<typeof decryptedWaybills[0]>> = {
        success: true,
        data: {
          list: decryptedWaybills,
          total,
          page,
          pageSize,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Waybill List Error]', error)
      res.status(500).json({
        success: false,
        error: '查询运单列表失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.post(
  '/',
  authMiddleware,
  requireAnyPermission(['waybill:create']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        senderName,
        senderPhone,
        senderAddress,
        senderRealNameId,
        receiverName,
        receiverPhone,
        receiverAddress,
        items,
        weight,
        volume,
        freight,
      } = req.body as {
        senderName: string
        senderPhone: string
        senderAddress: string
        senderRealNameId?: string
        receiverName: string
        receiverPhone: string
        receiverAddress: string
        items: WaybillItem[]
        weight: number
        volume?: number
        freight: number
      }

      if (!senderName || !senderPhone || !senderAddress || !receiverName || !receiverPhone || !receiverAddress || !items || !weight || !freight) {
        res.status(400).json({
          success: false,
          error: '缺少必填字段',
        } as ApiResponse)
        return
      }

      const waybillId = generateId()
      const trackingNo = generateTrackingNo()
      const regulatoryCode = generateRegulatoryCode()
      const itemsJson = JSON.stringify(items)
      const now = new Date().toISOString()

      db.prepare(
        `INSERT INTO waybills (
          id, tracking_no, regulatory_code,
          sender_name_enc, sender_phone_enc, sender_address_enc, sender_real_name_id,
          receiver_name_enc, receiver_phone_enc, receiver_address_enc,
          items_json_enc, weight, volume, freight,
          status, courier_id, outlet_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        waybillId,
        trackingNo,
        regulatoryCode,
        encryptAES256(senderName),
        encryptAES256(senderPhone),
        encryptAES256(senderAddress),
        senderRealNameId,
        encryptAES256(receiverName),
        encryptAES256(receiverPhone),
        encryptAES256(receiverAddress),
        encryptAES256(itemsJson),
        weight,
        volume || null,
        freight,
        'created',
        req.user?.userId,
        req.user?.outletId,
        now
      )

      if (req.user) {
        db.prepare(
          'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          generateId(),
          req.user.userId,
          'waybill_create',
          '创建运单',
          JSON.stringify({ waybillId, trackingNo }),
          req.ip
        )
      }

      const response: ApiResponse<{ id: string; trackingNo: string; regulatoryCode: string }> = {
        success: true,
        data: {
          id: waybillId,
          trackingNo,
          regulatoryCode,
        },
        message: '运单创建成功',
      }

      res.status(201).json(response)
    } catch (error) {
      console.error('[Waybill Create Error]', error)
      res.status(500).json({
        success: false,
        error: '创建运单失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.get(
  '/:id',
  authMiddleware,
  requireAnyPermission(['waybill:read']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const query = `
        SELECT w.*, o.name as outlet_name, u.real_name as courier_name
        FROM waybills w
        LEFT JOIN outlets o ON w.outlet_id = o.id
        LEFT JOIN users u ON w.courier_id = u.id
        WHERE w.id = ?
      `
      const waybill = db.prepare(query).get(id) as (Waybill & { outlet_name?: string; courier_name?: string }) | undefined

      if (!waybill) {
        res.status(404).json({
          success: false,
          error: '运单不存在',
        } as ApiResponse)
        return
      }

      if (req.user?.role === 'courier' && waybill.courier_id !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: '无权查看该运单',
        } as ApiResponse)
        return
      }

      if (req.user?.role === 'outlet_admin' && waybill.outlet_id !== req.user.outletId) {
        res.status(403).json({
          success: false,
          error: '无权查看该运单',
        } as ApiResponse)
        return
      }

      const decryptedWaybill = {
        id: waybill.id,
        trackingNo: waybill.tracking_no,
        regulatoryCode: waybill.regulatory_code,
        senderName: decryptAES256(waybill.sender_name_enc),
        senderPhone: decryptAES256(waybill.sender_phone_enc),
        senderAddress: decryptAES256(waybill.sender_address_enc),
        senderRealNameId: waybill.sender_real_name_id,
        receiverName: decryptAES256(waybill.receiver_name_enc),
        receiverPhone: decryptAES256(waybill.receiver_phone_enc),
        receiverAddress: decryptAES256(waybill.receiver_address_enc),
        items: JSON.parse(decryptAES256(waybill.items_json_enc)) as WaybillItem[],
        weight: waybill.weight,
        volume: waybill.volume,
        freight: waybill.freight,
        status: waybill.status,
        outletId: waybill.outlet_id,
        outletName: waybill.outlet_name,
        courierId: waybill.courier_id,
        courierName: waybill.courier_name,
        qrCode: waybill.qr_code,
        createdAt: waybill.created_at,
        syncedAt: waybill.synced_at,
      }

      const response: ApiResponse<typeof decryptedWaybill> = {
        success: true,
        data: decryptedWaybill,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Waybill Detail Error]', error)
      res.status(500).json({
        success: false,
        error: '查询运单详情失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.post(
  '/batch-sync',
  authMiddleware,
  requireAnyPermission(['waybill:list:outlet', 'waybill:list:region', 'waybill:list:all']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { waybillIds } = req.body as { waybillIds?: string[] }

      if (!waybillIds || waybillIds.length === 0) {
        res.status(400).json({
          success: false,
          error: '请选择需要同步的运单',
        } as ApiResponse)
        return
      }

      const now = new Date().toISOString()
      const placeholders = waybillIds.map(() => '?').join(',')

      const result = db
        .prepare(
          `UPDATE waybills SET status = 'synced', synced_at = ? WHERE id IN (${placeholders}) AND status != 'synced'`
        )
        .run(now, ...waybillIds)

      if (req.user) {
        db.prepare(
          'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          generateId(),
          req.user.userId,
          'waybill_batch_sync',
          '批量同步运单到监管中心',
          JSON.stringify({ waybillIds, syncedCount: result.changes }),
          req.ip
        )
      }

      const response: ApiResponse<{ syncedCount: number; totalCount: number }> = {
        success: true,
        data: {
          syncedCount: result.changes,
          totalCount: waybillIds.length,
        },
        message: `成功同步 ${result.changes} 个运单到监管中心`,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Waybill Batch Sync Error]', error)
      res.status(500).json({
        success: false,
        error: '批量同步运单失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

export default router
