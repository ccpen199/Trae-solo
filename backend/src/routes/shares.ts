import { Router, Response, Request } from 'express';
import { 
  authMiddleware, 
  getRequestInfo,
  AuthenticatedRequest,
  getUserById
} from '../middleware/auth.js';
import { sharingLinkEngine, ShareLink } from '../engines/sharing-link.js';
import { blockStorageEngine } from '../engines/block-storage.js';
import { auditService } from '../services/audit-service.js';
import db from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = Router();

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const shareLinks = sharingLinkEngine.getUserShareLinks(req.user.id);
  
  const formattedLinks = shareLinks.map(link => ({
    ...link,
    shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:9170'}/share/${link.shareCode}`
  }));
  
  res.json({
    shares: formattedLinks
  });
});

router.post('/create', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { 
    fileId, 
    shareType, 
    password, 
    expireInHours, 
    maxAccessCount,
    allowedIps,
    allowedDomains
  } = req.body;
  
  if (!fileId) {
    res.status(400).json({ error: 'fileId 不能为空' });
    return;
  }
  
  const file = blockStorageEngine.getFileById(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权分享此文件' });
    return;
  }
  
  try {
    const shareLink = sharingLinkEngine.createShareLink({
      fileId,
      userId: req.user.id,
      shareType: shareType || 'public',
      password,
      expireInHours,
      maxAccessCount,
      allowedIps,
      allowedDomains
    });
    
    const { ip, userAgent } = getRequestInfo(req);
    auditService.logFileShare(
      req.user.id,
      fileId,
      shareLink.id,
      shareLink.shareCode,
      {
        ipAddress: ip,
        userAgent,
        shareType: shareLink.shareType,
        expireAt: shareLink.expireAt
      }
    );
    
    res.json({
      success: true,
      share: {
        ...shareLink,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:9170'}/share/${shareLink.shareCode}`
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '创建分享链接失败';
    res.status(400).json({ error: errorMessage });
  }
});

router.get('/:shareLinkId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const shareLinkId = req.params.shareLinkId;
  const shareLink = sharingLinkEngine.getShareLinkById(shareLinkId);
  
  if (!shareLink) {
    res.status(404).json({ error: '分享链接不存在' });
    return;
  }
  
  if (shareLink.createdBy !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权访问此分享链接' });
    return;
  }
  
  const accessLogs = sharingLinkEngine.getShareLinkAccessLogs(shareLinkId);
  
  res.json({
    share: {
      ...shareLink,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:9170'}/share/${shareLink.shareCode}`
    },
    accessLogs
  });
});

router.post('/:shareLinkId/revoke', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const shareLinkId = req.params.shareLinkId;
  const shareLink = sharingLinkEngine.getShareLinkById(shareLinkId);
  
  if (!shareLink) {
    res.status(404).json({ error: '分享链接不存在' });
    return;
  }
  
  if (shareLink.createdBy !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权撤销此分享链接' });
    return;
  }
  
  const result = sharingLinkEngine.revokeShareLink(shareLinkId, req.user.id);
  
  if (!result) {
    res.status(500).json({ error: '撤销分享链接失败' });
    return;
  }
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logAdminAction(
    req.user.id,
    'revoke_share_link',
    {
      ipAddress: ip,
      userAgent,
      targetType: 'share_link',
      targetId: shareLinkId,
      details: { shareCode: shareLink.shareCode }
    }
  );
  
  res.json({
    success: true,
    message: '分享链接已撤销'
  });
});

router.get('/code/:shareCode', (req: Request, res: Response) => {
  const shareCode = req.params.shareCode;
  const { ip, userAgent } = getRequestInfo(req as AuthenticatedRequest);
  const password = req.query.password as string | undefined;
  
  const validation = sharingLinkEngine.validateShareLink(shareCode, {
    ip,
    password
  });
  
  if (!validation.valid || !validation.shareLink) {
    sharingLinkEngine.recordAccess(
      uuidv4(),
      '',
      {
        ip,
        userAgent,
        accessType: 'view',
        accessStatus: 'denied',
        denyReason: validation.reason
      }
    );
    
    res.status(404).json({ 
      error: validation.reason || '分享链接无效或已过期' 
    });
    return;
  }
  
  const shareLink = validation.shareLink;
  const file = blockStorageEngine.getFileById(shareLink.fileId);
  
  if (!file) {
    sharingLinkEngine.recordAccess(
      shareLink.id,
      shareLink.fileId,
      {
        ip,
        userAgent,
        accessType: 'view',
        accessStatus: 'failed',
        denyReason: '文件不存在'
      }
    );
    
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  const owner = getUserById(shareLink.createdBy);
  
  sharingLinkEngine.recordAccess(
    shareLink.id,
    shareLink.fileId,
    {
      ip,
      userAgent,
      accessType: 'view',
      accessStatus: 'success'
    }
  );
  
  res.json({
    share: {
      id: shareLink.id,
      shareCode: shareLink.shareCode,
      shareType: shareLink.shareType,
      expireAt: shareLink.expireAt,
      accessCount: shareLink.accessCount,
      downloadCount: shareLink.downloadCount,
      status: shareLink.status
    },
    file: {
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      createdAt: file.createdAt
    },
    owner: owner ? {
      username: owner.username
    } : null
  });
});

router.get('/code/:shareCode/download', (req: Request, res: Response) => {
  const shareCode = req.params.shareCode;
  const { ip, userAgent } = getRequestInfo(req as AuthenticatedRequest);
  const password = req.query.password as string | undefined;
  
  const startTime = Date.now();
  
  const validation = sharingLinkEngine.validateShareLink(shareCode, {
    ip,
    password
  });
  
  if (!validation.valid || !validation.shareLink) {
    sharingLinkEngine.recordAccess(
      uuidv4(),
      '',
      {
        ip,
        userAgent,
        accessType: 'download',
        accessStatus: 'denied',
        denyReason: validation.reason
      }
    );
    
    res.status(404).json({ 
      error: validation.reason || '分享链接无效或已过期' 
    });
    return;
  }
  
  const shareLink = validation.shareLink;
  const file = blockStorageEngine.getFileById(shareLink.fileId);
  
  if (!file) {
    sharingLinkEngine.recordAccess(
      shareLink.id,
      shareLink.fileId,
      {
        ip,
        userAgent,
        accessType: 'download',
        accessStatus: 'failed',
        denyReason: '文件不存在'
      }
    );
    
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (!fs.existsSync(file.filePath)) {
    res.status(404).json({ error: '文件已丢失' });
    return;
  }
  
  if (file.fileSize > 100 * 1024 * 1024) {
    const downloadRecordId = uuidv4();
    db.prepare(`
      INSERT INTO download_records (
        id, file_id, share_link_id, download_ip, user_agent,
        file_size, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, 'rate_limited', ?)
    `).run(
      downloadRecordId,
      file.id,
      shareLink.id,
      ip,
      userAgent,
      file.fileSize,
      '大文件下载触发流量预警'
    );
    
    auditService.logSecurityEvent(
      'large_file_download',
      {
        ipAddress: ip,
        userAgent,
        details: {
          fileId: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          shareCode
        },
        severity: 'warning'
      }
    );
  }
  
  const data = fs.readFileSync(file.filePath);
  const downloadTimeMs = Date.now() - startTime;
  
  const downloadSpeedBps = downloadTimeMs > 0 ? (data.length / (downloadTimeMs / 1000)) : 0;
  
  const downloadRecordId = uuidv4();
  db.prepare(`
    INSERT INTO download_records (
      id, file_id, share_link_id, download_ip, user_agent,
      file_size, download_time_ms, download_speed_bps, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `).run(
    downloadRecordId,
    file.id,
    shareLink.id,
    ip,
    userAgent,
    file.fileSize,
    downloadTimeMs,
    downloadSpeedBps
  );
  
  sharingLinkEngine.recordAccess(
    shareLink.id,
    file.id,
    {
      ip,
      userAgent,
      accessType: 'download',
      accessStatus: 'success'
    }
  );
  
  auditService.logFileDownload(
    null,
    file.id,
    file.fileName,
    file.fileSize,
    {
      ipAddress: ip,
      userAgent,
      shareLinkId: shareLink.id,
      downloadTimeMs
    }
  );
  
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
  res.setHeader('Content-Length', data.length);
  
  res.send(data);
});

export default router;
