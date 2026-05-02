import { v4 as uuidv4 } from 'uuid';
import db from '../database/index.js';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  actionCategory: string;
  targetType: string | null;
  targetId: string | null;
  logicalTrace: string | null;
  physicalTrace: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  status: string;
  createdAt: string;
}

export type ActionCategory = 
  | 'file_upload' 
  | 'file_download' 
  | 'file_edit' 
  | 'file_delete'
  | 'file_share' 
  | 'file_restore' 
  | 'file_archive'
  | 'permission_change' 
  | 'version_change'
  | 'user_login' 
  | 'user_logout' 
  | 'admin_action'
  | 'security_event' 
  | 'system_event';

export type TargetType = 'file' | 'folder' | 'user' | 'share_link' | 'permission' | 'version';

export interface AuditLogOptions {
  userId?: string;
  targetType?: TargetType;
  targetId?: string;
  logicalTrace?: string;
  physicalTrace?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  status?: 'success' | 'failed' | 'warning';
}

export class AuditService {
  log(
    action: string,
    actionCategory: ActionCategory,
    options: AuditLogOptions = {}
  ): AuditLog {
    const logId = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, action_category, target_type, target_id,
        logical_trace, physical_trace, ip_address, user_agent,
        details, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      logId,
      options.userId || null,
      action,
      actionCategory,
      options.targetType || null,
      options.targetId || null,
      options.logicalTrace || null,
      options.physicalTrace || null,
      options.ipAddress || null,
      options.userAgent || null,
      options.details ? JSON.stringify(options.details) : null,
      options.status || 'success'
    );
    
    return this.getLogById(logId) as AuditLog;
  }

  logFileUpload(
    userId: string,
    fileId: string,
    fileName: string,
    fileSize: number,
    options: {
      ipAddress?: string;
      userAgent?: string;
      isDuplicate?: boolean;
      isChunked?: boolean;
    } = {}
  ): AuditLog {
    return this.log('file_upload', 'file_upload', {
      userId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        fileName,
        fileSize,
        isDuplicate: options.isDuplicate || false,
        isChunked: options.isChunked || false
      },
      logicalTrace: `用户 ${userId} 上传文件 ${fileName}`,
      physicalTrace: `文件ID: ${fileId}`
    });
  }

  logFileDownload(
    userId: string | null,
    fileId: string,
    fileName: string,
    fileSize: number,
    options: {
      ipAddress?: string;
      userAgent?: string;
      shareLinkId?: string;
      downloadTimeMs?: number;
      status?: 'success' | 'failed' | 'rate_limited';
    } = {}
  ): AuditLog {
    const status = options.status === 'rate_limited' ? 'warning' : 
                   options.status === 'failed' ? 'failed' : 'success';
    
    return this.log('file_download', 'file_download', {
      userId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      status,
      details: {
        fileName,
        fileSize,
        shareLinkId: options.shareLinkId,
        downloadTimeMs: options.downloadTimeMs,
        downloadStatus: options.status
      },
      logicalTrace: status === 'success' 
        ? `下载文件 ${fileName} 成功` 
        : `下载文件 ${fileName} 失败: ${options.status}`,
      physicalTrace: `文件ID: ${fileId}, IP: ${options.ipAddress || 'unknown'}`
    });
  }

  logFileEdit(
    userId: string,
    fileId: string,
    fileName: string,
    newVersion: number,
    options: {
      ipAddress?: string;
      userAgent?: string;
      changeDescription?: string;
    } = {}
  ): AuditLog {
    return this.log('file_edit', 'file_edit', {
      userId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        fileName,
        newVersion,
        changeDescription: options.changeDescription
      },
      logicalTrace: `编辑文件 ${fileName}，创建新版本 v${newVersion}`,
      physicalTrace: `文件ID: ${fileId}`
    });
  }

  logFileDelete(
    userId: string,
    fileId: string,
    fileName: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): AuditLog {
    return this.log('file_delete', 'file_delete', {
      userId,
      targetType: 'file',
      targetId: fileId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        fileName
      },
      logicalTrace: `删除文件 ${fileName}`,
      physicalTrace: `文件ID: ${fileId}`
    });
  }

  logFileShare(
    userId: string,
    fileId: string,
    shareLinkId: string,
    shareCode: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      shareType?: string;
      expireAt?: string;
    } = {}
  ): AuditLog {
    return this.log('file_share', 'file_share', {
      userId,
      targetType: 'share_link',
      targetId: shareLinkId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        fileId,
        shareCode,
        shareType: options.shareType,
        expireAt: options.expireAt
      },
      logicalTrace: `创建分享链接 ${shareCode}`,
      physicalTrace: `分享链接ID: ${shareLinkId}, 文件ID: ${fileId}`
    });
  }

  logShareAccess(
    shareLinkId: string,
    fileId: string,
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      accessType?: 'view' | 'download' | 'preview';
      accessStatus: 'success' | 'denied' | 'failed' | 'expired';
      denyReason?: string;
    }
  ): AuditLog {
    const status = options.accessStatus === 'success' ? 'success' : 
                   options.accessStatus === 'failed' ? 'failed' : 'warning';
    
    return this.log('share_access', 'file_share', {
      userId: options.userId,
      targetType: 'share_link',
      targetId: shareLinkId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      status,
      details: {
        fileId,
        accessType: options.accessType,
        accessStatus: options.accessStatus,
        denyReason: options.denyReason
      },
      logicalTrace: options.accessStatus === 'success' 
        ? `分享链接访问成功: ${options.accessType}` 
        : `分享链接访问被拒绝: ${options.denyReason || options.accessStatus}`,
      physicalTrace: `分享链接ID: ${shareLinkId}, IP: ${options.ipAddress || 'unknown'}`
    });
  }

  logVersionChange(
    userId: string,
    fileId: string,
    versionId: string,
    versionNumber: number,
    action: 'create' | 'rollback',
    options: {
      ipAddress?: string;
      userAgent?: string;
      fromVersion?: number;
    } = {}
  ): AuditLog {
    const actionName = action === 'create' ? '创建版本' : '回滚版本';
    
    return this.log(`version_${action}`, 'version_change', {
      userId,
      targetType: 'version',
      targetId: versionId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: {
        fileId,
        versionNumber,
        fromVersion: options.fromVersion
      },
      logicalTrace: `${actionName} v${versionNumber}${options.fromVersion ? ` 从 v${options.fromVersion}` : ''}`,
      physicalTrace: `文件ID: ${fileId}, 版本ID: ${versionId}`
    });
  }

  logUserLogin(
    userId: string,
    username: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
      failReason?: string;
    }
  ): AuditLog {
    return this.log('user_login', 'user_login', {
      userId,
      targetType: 'user',
      targetId: userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      status: options.success ? 'success' : 'failed',
      details: {
        username,
        failReason: options.failReason
      },
      logicalTrace: options.success 
        ? `用户 ${username} 登录成功` 
        : `用户 ${username} 登录失败: ${options.failReason}`,
      physicalTrace: `用户ID: ${userId}, IP: ${options.ipAddress || 'unknown'}`
    });
  }

  logAdminAction(
    adminId: string,
    action: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      targetType?: TargetType;
      targetId?: string;
      details?: Record<string, unknown>;
    } = {}
  ): AuditLog {
    return this.log(action, 'admin_action', {
      userId: adminId,
      targetType: options.targetType,
      targetId: options.targetId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: options.details,
      logicalTrace: `管理员执行操作: ${action}`,
      physicalTrace: `管理员ID: ${adminId}${options.targetId ? `, 目标ID: ${options.targetId}` : ''}`
    });
  }

  logSecurityEvent(
    event: string,
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, unknown>;
      severity?: 'warning' | 'failed';
    } = {}
  ): AuditLog {
    return this.log(event, 'security_event', {
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      status: options.severity || 'warning',
      details: options.details,
      logicalTrace: `安全事件: ${event}`,
      physicalTrace: `IP: ${options.ipAddress || 'unknown'}`
    });
  }

  getLogById(logId: string): AuditLog | null {
    const stmt = db.prepare('SELECT * FROM audit_logs WHERE id = ?');
    const result = stmt.get(logId);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      userId: row.user_id as string | null,
      action: row.action as string,
      actionCategory: row.action_category as string,
      targetType: row.target_type as string | null,
      targetId: row.target_id as string | null,
      logicalTrace: row.logical_trace as string | null,
      physicalTrace: row.physical_trace as string | null,
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null,
      details: row.details as string | null,
      status: row.status as string,
      createdAt: row.created_at as string
    };
  }

  getLogs(options: {
    userId?: string;
    actionCategory?: ActionCategory;
    targetType?: TargetType;
    targetId?: string;
    startTime?: Date;
    endTime?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): AuditLog[] {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: Array<string | number> = [];
    
    if (options.userId) {
      query += ' AND user_id = ?';
      params.push(options.userId);
    }
    
    if (options.actionCategory) {
      query += ' AND action_category = ?';
      params.push(options.actionCategory);
    }
    
    if (options.targetType) {
      query += ' AND target_type = ?';
      params.push(options.targetType);
    }
    
    if (options.targetId) {
      query += ' AND target_id = ?';
      params.push(options.targetId);
    }
    
    if (options.startTime) {
      query += ' AND created_at >= ?';
      params.push(options.startTime.toISOString());
    }
    
    if (options.endTime) {
      query += ' AND created_at <= ?';
      params.push(options.endTime.toISOString());
    }
    
    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params) as Array<Record<string, unknown>>;
    
    return results.map(row => ({
      id: row.id as string,
      userId: row.user_id as string | null,
      action: row.action as string,
      actionCategory: row.action_category as string,
      targetType: row.target_type as string | null,
      targetId: row.target_id as string | null,
      logicalTrace: row.logical_trace as string | null,
      physicalTrace: row.physical_trace as string | null,
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null,
      details: row.details as string | null,
      status: row.status as string,
      createdAt: row.created_at as string
    }));
  }
}

export const auditService = new AuditService();
