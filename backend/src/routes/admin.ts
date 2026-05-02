import { Router, Response } from 'express';
import { 
  authMiddleware, 
  adminMiddleware,
  complianceMiddleware,
  getRequestInfo,
  AuthenticatedRequest
} from '../middleware/auth.js';
import { auditService } from '../services/audit-service.js';
import db from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const totalUsersStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const totalUsers = (totalUsersStmt.get() as { count: number }).count;
  
  const totalFilesStmt = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size 
    FROM files WHERE status = 'active' AND is_folder = 0
  `);
  const fileStats = totalFilesStmt.get() as { count: number; total_size: number };
  
  const totalSharesStmt = db.prepare('SELECT COUNT(*) as count FROM share_links');
  const totalShares = (totalSharesStmt.get() as { count: number }).count;
  
  const activeSharesStmt = db.prepare(`
    SELECT COUNT(*) as count FROM share_links 
    WHERE status = 'active' AND (expire_at IS NULL OR expire_at > datetime('now'))
  `);
  const activeShares = (activeSharesStmt.get() as { count: number }).count;
  
  const totalDownloadsStmt = db.prepare('SELECT COUNT(*) as count FROM download_records');
  const totalDownloads = (totalDownloadsStmt.get() as { count: number }).count;
  
  const recentDownloadsStmt = db.prepare(`
    SELECT COUNT(*) as count FROM download_records 
    WHERE started_at >= datetime('now', '-24 hours')
  `);
  const recentDownloads = (recentDownloadsStmt.get() as { count: number }).count;
  
  const storageUsedStmt = db.prepare(`
    SELECT COALESCE(SUM(storage_used), 0) as total 
    FROM users
  `);
  const storageUsed = (storageUsedStmt.get() as { total: number }).total;
  
  const storageQuotaStmt = db.prepare(`
    SELECT COALESCE(SUM(storage_quota), 0) as total 
    FROM users
  `);
  const storageQuota = (storageQuotaStmt.get() as { total: number }).total;
  
  res.json({
    dashboard: {
      users: {
        total: totalUsers
      },
      files: {
        total: fileStats.count,
        totalSize: fileStats.total_size
      },
      shares: {
        total: totalShares,
        active: activeShares
      },
      downloads: {
        total: totalDownloads,
        last24Hours: recentDownloads
      },
      storage: {
        used: storageUsed,
        quota: storageQuota,
        usagePercent: storageQuota > 0 ? Math.round((storageUsed / storageQuota) * 100) : 0
      }
    }
  });
});

router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = (page - 1) * limit;
  
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const total = (countStmt.get() as { count: number }).count;
  
  const usersStmt = db.prepare(`
    SELECT id, username, email, role, status, storage_quota, storage_used,
           created_at, updated_at, last_login_at
    FROM users 
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const users = usersStmt.all(limit, offset) as Array<Record<string, unknown>>;
  
  res.json({
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      storageQuota: u.storage_quota,
      storageUsed: u.storage_used,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastLoginAt: u.last_login_at
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get('/files', (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  
  let countQuery = 'SELECT COUNT(*) as count FROM files WHERE 1=1';
  let filesQuery = `
    SELECT f.*, u.username as owner_name
    FROM files f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE 1=1
  `;
  const params: Array<string | number> = [];
  
  if (status) {
    countQuery += ' AND status = ?';
    filesQuery += ' AND f.status = ?';
    params.push(status);
  }
  
  filesQuery += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
  
  const countStmt = db.prepare(countQuery);
  const total = (countStmt.get(...params) as { count: number }).count;
  
  const filesStmt = db.prepare(filesQuery);
  const files = filesStmt.all(...params, limit, offset) as Array<Record<string, unknown>>;
  
  res.json({
    files: files.map(f => ({
      id: f.id,
      ownerId: f.user_id,
      ownerName: f.owner_name,
      fileName: f.file_name,
      fileSize: f.file_size,
      mimeType: f.mime_type,
      md5Hash: f.md5_hash,
      isFolder: f.is_folder === 1,
      isEncrypted: f.is_encrypted === 1,
      status: f.status,
      versionCount: f.version_count,
      currentVersion: f.current_version,
      createdAt: f.created_at,
      updatedAt: f.updated_at
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get('/download-records', (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = (page - 1) * limit;
  
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM download_records');
  const total = (countStmt.get() as { count: number }).count;
  
  const recordsStmt = db.prepare(`
    SELECT dr.*, f.file_name, u.username as user_name
    FROM download_records dr
    LEFT JOIN files f ON dr.file_id = f.id
    LEFT JOIN users u ON dr.user_id = u.id
    ORDER BY dr.started_at DESC
    LIMIT ? OFFSET ?
  `);
  const records = recordsStmt.all(limit, offset) as Array<Record<string, unknown>>;
  
  res.json({
    records: records.map(r => ({
      id: r.id,
      fileId: r.file_id,
      fileName: r.file_name,
      userId: r.user_id,
      userName: r.user_name,
      shareLinkId: r.share_link_id,
      downloadIp: r.download_ip,
      userAgent: r.user_agent,
      fileSize: r.file_size,
      downloadTimeMs: r.download_time_ms,
      downloadSpeedBps: r.download_speed_bps,
      status: r.status,
      errorMessage: r.error_message,
      startedAt: r.started_at,
      completedAt: r.completed_at
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get('/share-links', (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = (page - 1) * limit;
  
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM share_links');
  const total = (countStmt.get() as { count: number }).count;
  
  const sharesStmt = db.prepare(`
    SELECT sl.*, f.file_name, u.username as creator_name
    FROM share_links sl
    LEFT JOIN files f ON sl.file_id = f.id
    LEFT JOIN users u ON sl.created_by = u.id
    ORDER BY sl.created_at DESC
    LIMIT ? OFFSET ?
  `);
  const shares = sharesStmt.all(limit, offset) as Array<Record<string, unknown>>;
  
  res.json({
    shares: shares.map(s => ({
      id: s.id,
      fileId: s.file_id,
      fileName: s.file_name,
      shareCode: s.share_code,
      shareType: s.share_type,
      creatorId: s.created_by,
      creatorName: s.creator_name,
      expireAt: s.expire_at,
      maxAccessCount: s.max_access_count,
      accessCount: s.access_count,
      downloadCount: s.download_count,
      status: s.status,
      createdAt: s.created_at
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.get('/audit-logs', complianceMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const offset = (page - 1) * limit;
  
  const actionCategory = req.query.actionCategory as string | undefined;
  const targetType = req.query.targetType as string | undefined;
  const userId = req.query.userId as string | undefined;
  
  let countQuery = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
  let logsQuery = `
    SELECT al.*, u.username as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params: Array<string> = [];
  
  if (actionCategory) {
    countQuery += ' AND action_category = ?';
    logsQuery += ' AND al.action_category = ?';
    params.push(actionCategory);
  }
  
  if (targetType) {
    countQuery += ' AND target_type = ?';
    logsQuery += ' AND al.target_type = ?';
    params.push(targetType);
  }
  
  if (userId) {
    countQuery += ' AND user_id = ?';
    logsQuery += ' AND al.user_id = ?';
    params.push(userId);
  }
  
  logsQuery += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  
  const countStmt = db.prepare(countQuery);
  const total = (countStmt.get(...params) as { count: number }).count;
  
  const logsStmt = db.prepare(logsQuery);
  const logs = logsStmt.all(...params, limit, offset) as Array<Record<string, unknown>>;
  
  res.json({
    logs: logs.map(l => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name,
      action: l.action,
      actionCategory: l.action_category,
      targetType: l.target_type,
      targetId: l.target_id,
      logicalTrace: l.logical_trace,
      physicalTrace: l.physical_trace,
      ipAddress: l.ip_address,
      userAgent: l.user_agent,
      details: l.details ? JSON.parse(l.details as string) : null,
      status: l.status,
      createdAt: l.created_at
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

router.post('/files/:fileId/archive', (req: AuthenticatedRequest, res: Response) => {
  const fileId = req.params.fileId;
  
  const fileStmt = db.prepare('SELECT * FROM files WHERE id = ?');
  const file = fileStmt.get(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  const updateStmt = db.prepare(`
    UPDATE files 
    SET status = 'archived', updated_at = datetime('now')
    WHERE id = ?
  `);
  updateStmt.run(fileId);
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logAdminAction(
    req.user?.id || '',
    'archive_file',
    {
      ipAddress: ip,
      userAgent,
      targetType: 'file',
      targetId: fileId
    }
  );
  
  res.json({
    success: true,
    message: '文件已归档'
  });
});

router.post('/files/:fileId/restore', (req: AuthenticatedRequest, res: Response) => {
  const fileId = req.params.fileId;
  
  const fileStmt = db.prepare('SELECT * FROM files WHERE id = ?');
  const file = fileStmt.get(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  const updateStmt = db.prepare(`
    UPDATE files 
    SET status = 'active', updated_at = datetime('now')
    WHERE id = ?
  `);
  updateStmt.run(fileId);
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logAdminAction(
    req.user?.id || '',
    'restore_file',
    {
      ipAddress: ip,
      userAgent,
      targetType: 'file',
      targetId: fileId
    }
  );
  
  res.json({
    success: true,
    message: '文件已恢复'
  });
});

router.post('/users/:userId/update-quota', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.userId;
  const { storageQuota } = req.body;
  
  if (storageQuota === undefined || storageQuota < 0) {
    res.status(400).json({ error: '无效的存储配额' });
    return;
  }
  
  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = userStmt.get(userId);
  
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  
  const updateStmt = db.prepare(`
    UPDATE users 
    SET storage_quota = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  updateStmt.run(storageQuota, userId);
  
  const metricsStmt = db.prepare(`
    UPDATE storage_metrics 
    SET storage_quota = ?, recorded_at = datetime('now')
    WHERE user_id = ?
  `);
  metricsStmt.run(storageQuota, userId);
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logAdminAction(
    req.user?.id || '',
    'update_user_quota',
    {
      ipAddress: ip,
      userAgent,
      targetType: 'user',
      targetId: userId,
      details: { storageQuota }
    }
  );
  
  res.json({
    success: true,
    message: '存储配额已更新'
  });
});

export default router;
