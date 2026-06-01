import { AuditRepository } from '../repositories/AuditRepository.js'
import { desensitizePhone, desensitizeName } from '../middleware/desensitize.js'
import type { DecryptRequest, AuditLog } from '../types/index.js'

const auditRepo = new AuditRepository()

export class SecurityService {
  createDecryptRequest(request: Omit<DecryptRequest, 'id' | 'status' | 'created_at'> & { user_id: number }) {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const req: Omit<DecryptRequest, 'id'> = {
      ...request,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }

    const result = auditRepo.createDecryptRequest(req)

    auditRepo.createAuditLog({
      admin_id: request.user_id,
      action: 'DECRYPT_REQUEST_CREATE',
      target: `${request.target_type}:${request.target_id}`,
      detail: `申请解密原因: ${request.reason}`,
      created_at: new Date().toISOString(),
    })

    return result
  }

  getDecryptRequests(params: { page?: number; pageSize?: number; status?: string } = {}) {
    return auditRepo.getDecryptRequests(params)
  }

  approveDecryptRequest(id: number, adminId: number) {
    const result = auditRepo.updateDecryptRequest(id, {
      status: 'approved',
      admin_id: adminId,
    })

    auditRepo.createAuditLog({
      admin_id: adminId,
      action: 'DECRYPT_REQUEST_APPROVE',
      target: `decrypt_request:${id}`,
      detail: '解密申请已批准',
      created_at: new Date().toISOString(),
    })

    return result
  }

  rejectDecryptRequest(id: number, adminId: number, reason?: string) {
    const result = auditRepo.updateDecryptRequest(id, {
      status: 'rejected',
      admin_id: adminId,
    })

    auditRepo.createAuditLog({
      admin_id: adminId,
      action: 'DECRYPT_REQUEST_REJECT',
      target: `decrypt_request:${id}`,
      detail: `解密申请已拒绝${reason ? ': ' + reason : ''}`,
      created_at: new Date().toISOString(),
    })

    return result
  }

  getDecryptedData(requestId: number) {
    const request = auditRepo.findDecryptRequestById(requestId)
    if (!request || request.status !== 'approved') {
      throw new Error('解密请求未批准或不存在')
    }

    const now = new Date()
    if (request.expires_at && new Date(request.expires_at) < now) {
      throw new Error('解密请求已过期')
    }

    return {
      originalValue: this.getOriginalValue(request.target_type, request.target_id),
      expires_at: request.expires_at,
    }
  }

  private getOriginalValue(targetType: string, targetId: number): any {
    const mockData: Record<string, any> = {
      'order:sender_phone': { phone: '13800138001', name: '张三' },
      'order:receiver_phone': { phone: '13900139001', name: '李四' },
      'express:rider_phone': { phone: '13900139001', name: '骑手小李' },
    }

    const key = `${targetType}:${targetId}`
    return mockData[key] || { phone: '13800138000', name: '测试用户' }
  }

  getAuditLogs(params: { page?: number; pageSize?: number } = {}) {
    return auditRepo.getAuditLogs(params)
  }

  getComplianceStatus() {
    return auditRepo.getComplianceStatus()
  }

  desensitizeData(data: any, fields: string[] = []) {
    if (Array.isArray(data)) {
      return data.map(item => this.desensitizeData(item, fields))
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (fields.length === 0 || fields.includes(key)) {
          if (key.toLowerCase().includes('phone') && typeof value === 'string') {
            result[key] = desensitizePhone(value)
          } else if (key.toLowerCase().includes('name') && typeof value === 'string' && key !== 'goods_type') {
            result[key] = desensitizeName(value)
          } else {
            result[key] = value
          }
        } else {
          result[key] = value
        }
      }
      return result
    }

    return data
  }

  adminLogin(username: string, password: string) {
    return auditRepo.verifyAdminPassword(username, password)
  }
}
