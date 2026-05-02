import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/index.js';

export interface ShareLink {
  id: string;
  fileId: string;
  shareCode: string;
  encryptionKey: string;
  shareType: string;
  passwordHash: string | null;
  expireAt: string | null;
  maxAccessCount: number | null;
  accessCount: number;
  downloadCount: number;
  allowedIps: string | null;
  allowedDomains: string | null;
  accessFenceEnabled: number;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareAccessLog {
  id: string;
  shareLinkId: string;
  fileId: string;
  accessType: string | null;
  accessIp: string | null;
  accessUserAgent: string | null;
  accessLocation: string | null;
  accessStatus: string;
  denyReason: string | null;
  accessedAt: string;
  accessedBy: string | null;
}

export interface ShareLinkCreateOptions {
  fileId: string;
  userId: string;
  shareType?: 'public' | 'private' | 'password';
  password?: string;
  expireInHours?: number;
  maxAccessCount?: number;
  allowedIps?: string[];
  allowedDomains?: string[];
}

export class SharingLinkEngine {
  generateShareCode(): string {
    return randomBytes(8).toString('hex');
  }

  generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
  }

  createShareLink(options: ShareLinkCreateOptions): ShareLink {
    const {
      fileId,
      userId,
      shareType = 'public',
      password,
      expireInHours,
      maxAccessCount,
      allowedIps,
      allowedDomains
    } = options;

    const shareCode = this.generateShareCode();
    const encryptionKey = this.generateEncryptionKey();
    
    let expireAt: string | null = null;
    if (expireInHours) {
      const expireTime = new Date();
      expireTime.setHours(expireTime.getHours() + expireInHours);
      expireAt = expireTime.toISOString();
    }

    let passwordHash: string | null = null;
    if (shareType === 'password' && password) {
      passwordHash = createHash('sha256').update(password).digest('hex');
    }

    const shareLinkId = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO share_links (
        id, file_id, share_code, encryption_key, share_type,
        password_hash, expire_at, max_access_count,
        allowed_ips, allowed_domains, access_fence_enabled,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);

    insertStmt.run(
      shareLinkId,
      fileId,
      shareCode,
      encryptionKey,
      shareType,
      passwordHash,
      expireAt,
      maxAccessCount || null,
      allowedIps ? JSON.stringify(allowedIps) : null,
      allowedDomains ? JSON.stringify(allowedDomains) : null,
      (allowedIps && allowedIps.length > 0) || (allowedDomains && allowedDomains.length > 0) ? 1 : 0,
      userId
    );

    return this.getShareLinkById(shareLinkId) as ShareLink;
  }

  getShareLinkById(shareLinkId: string): ShareLink | null {
    const stmt = db.prepare('SELECT * FROM share_links WHERE id = ?');
    const result = stmt.get(shareLinkId);
    if (!result) return null;
    return this.mapRowToShareLink(result as Record<string, unknown>);
  }

  getShareLinkByCode(shareCode: string): ShareLink | null {
    const stmt = db.prepare('SELECT * FROM share_links WHERE share_code = ?');
    const result = stmt.get(shareCode);
    if (!result) return null;
    return this.mapRowToShareLink(result as Record<string, unknown>);
  }

  private mapRowToShareLink(row: Record<string, unknown>): ShareLink {
    return {
      id: row.id as string,
      fileId: row.file_id as string,
      shareCode: row.share_code as string,
      encryptionKey: row.encryption_key as string,
      shareType: row.share_type as string,
      passwordHash: row.password_hash as string | null,
      expireAt: row.expire_at as string | null,
      maxAccessCount: row.max_access_count as number | null,
      accessCount: row.access_count as number,
      downloadCount: row.download_count as number,
      allowedIps: row.allowed_ips as string | null,
      allowedDomains: row.allowed_domains as string | null,
      accessFenceEnabled: row.access_fence_enabled as number,
      status: row.status as string,
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  validateShareLink(
    shareCode: string,
    options: {
      ip?: string;
      domain?: string;
      password?: string;
      userId?: string;
    } = {}
  ): { 
    valid: boolean; 
    reason?: string; 
    shareLink?: ShareLink 
  } {
    const shareLink = this.getShareLinkByCode(shareCode);
    
    if (!shareLink) {
      return { valid: false, reason: '分享链接不存在' };
    }

    if (shareLink.status !== 'active') {
      return { valid: false, reason: `分享链接状态无效: ${shareLink.status}` };
    }

    if (shareLink.expireAt) {
      const expireTime = new Date(shareLink.expireAt);
      if (new Date() > expireTime) {
        this.updateShareLinkStatus(shareLink.id, 'expired');
        return { valid: false, reason: '分享链接已过期' };
      }
    }

    if (shareLink.maxAccessCount !== null) {
      if (shareLink.accessCount >= shareLink.maxAccessCount) {
        return { valid: false, reason: '分享链接访问次数已达上限' };
      }
    }

    if (shareLink.shareType === 'password' && shareLink.passwordHash) {
      if (!options.password) {
        return { valid: false, reason: '需要密码验证' };
      }
      const passwordHash = createHash('sha256').update(options.password).digest('hex');
      if (passwordHash !== shareLink.passwordHash) {
        return { valid: false, reason: '密码错误' };
      }
    }

    if (shareLink.shareType === 'private' && !options.userId) {
      return { valid: false, reason: '需要登录访问' };
    }

    if (shareLink.accessFenceEnabled) {
      if (shareLink.allowedIps) {
        const allowedIps = JSON.parse(shareLink.allowedIps) as string[];
        if (options.ip && !allowedIps.includes(options.ip) && !allowedIps.includes('0.0.0.0')) {
          return { valid: false, reason: 'IP地址不在允许范围内' };
        }
      }
      
      if (shareLink.allowedDomains) {
        const allowedDomains = JSON.parse(shareLink.allowedDomains) as string[];
        if (options.domain && !allowedDomains.some(d => options.domain?.endsWith(d))) {
          return { valid: false, reason: '域名不在允许范围内' };
        }
      }
    }

    return { valid: true, shareLink };
  }

  recordAccess(
    shareLinkId: string,
    fileId: string,
    options: {
      accessType?: 'view' | 'download' | 'preview';
      ip?: string;
      userAgent?: string;
      userId?: string;
      status?: 'success' | 'denied' | 'failed' | 'expired';
      denyReason?: string;
    } = {}
  ): ShareAccessLog {
    const logId = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO share_access_logs (
        id, share_link_id, file_id, access_type,
        access_ip, access_user_agent, access_status,
        deny_reason, accessed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      logId,
      shareLinkId,
      fileId,
      options.accessType || null,
      options.ip || null,
      options.userAgent || null,
      options.status || 'success',
      options.denyReason || null,
      options.userId || null
    );

    if (options.status === 'success' || !options.status) {
      const updateStmt = db.prepare(`
        UPDATE share_links 
        SET access_count = access_count + 1,
            ${options.accessType === 'download' ? 'download_count = download_count + 1,' : ''}
            updated_at = datetime('now')
        WHERE id = ?
      `);
      updateStmt.run(shareLinkId);
    }

    return this.getAccessLogById(logId) as ShareAccessLog;
  }

  getAccessLogById(logId: string): ShareAccessLog | null {
    const stmt = db.prepare('SELECT * FROM share_access_logs WHERE id = ?');
    const result = stmt.get(logId);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      shareLinkId: row.share_link_id as string,
      fileId: row.file_id as string,
      accessType: row.access_type as string | null,
      accessIp: row.access_ip as string | null,
      accessUserAgent: row.access_user_agent as string | null,
      accessLocation: row.access_location as string | null,
      accessStatus: row.access_status as string,
      denyReason: row.deny_reason as string | null,
      accessedAt: row.accessed_at as string,
      accessedBy: row.accessed_by as string | null
    };
  }

  getShareLinkAccessLogs(shareLinkId: string): ShareAccessLog[] {
    const stmt = db.prepare(`
      SELECT * FROM share_access_logs 
      WHERE share_link_id = ? 
      ORDER BY accessed_at DESC
    `);
    const results = stmt.all(shareLinkId) as Array<Record<string, unknown>>;
    
    return results.map(row => ({
      id: row.id as string,
      shareLinkId: row.share_link_id as string,
      fileId: row.file_id as string,
      accessType: row.access_type as string | null,
      accessIp: row.access_ip as string | null,
      accessUserAgent: row.access_user_agent as string | null,
      accessLocation: row.access_location as string | null,
      accessStatus: row.access_status as string,
      denyReason: row.deny_reason as string | null,
      accessedAt: row.accessed_at as string,
      accessedBy: row.accessed_by as string | null
    }));
  }

  getUserShareLinks(userId: string): ShareLink[] {
    const stmt = db.prepare(`
      SELECT * FROM share_links 
      WHERE created_by = ? 
      ORDER BY created_at DESC
    `);
    const results = stmt.all(userId) as Array<Record<string, unknown>>;
    
    return results.map(row => this.mapRowToShareLink(row));
  }

  updateShareLinkStatus(shareLinkId: string, status: 'active' | 'expired' | 'revoked' | 'disabled'): boolean {
    const stmt = db.prepare(`
      UPDATE share_links 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    const result = stmt.run(status, shareLinkId);
    return result.changes > 0;
  }

  revokeShareLink(shareLinkId: string, userId: string): boolean {
    const shareLink = this.getShareLinkById(shareLinkId);
    if (!shareLink) return false;
    
    if (shareLink.createdBy !== userId) {
      return false;
    }
    
    return this.updateShareLinkStatus(shareLinkId, 'revoked');
  }
}

export const sharingLinkEngine = new SharingLinkEngine();
