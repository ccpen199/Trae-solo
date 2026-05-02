import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { 
  authMiddleware, 
  getRequestInfo,
  AuthenticatedRequest
} from '../middleware/auth.js';
import { versionControllerEngine } from '../engines/version-controller.js';
import { blockStorageEngine } from '../engines/block-storage.js';
import { auditService } from '../services/audit-service.js';

const router = Router();

const upload = multer({ 
  limits: { fileSize: 100 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

router.get('/file/:fileId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const fileId = req.params.fileId;
  const file = blockStorageEngine.getFileById(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权访问此文件' });
    return;
  }
  
  const versions = versionControllerEngine.getFileVersions(fileId);
  
  const formattedVersions = versions.map(v => ({
    ...v,
    formattedSize: formatFileSize(v.fileSize),
    isCurrent: v.isCurrent === 1
  }));
  
  res.json({
    versions: formattedVersions,
    currentVersion: file.currentVersion
  });
});

router.get('/:versionId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const versionId = req.params.versionId;
  const version = versionControllerEngine.getVersionById(versionId);
  
  if (!version) {
    res.status(404).json({ error: '版本不存在' });
    return;
  }
  
  const file = blockStorageEngine.getFileById(version.fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权访问此版本' });
    return;
  }
  
  res.json({
    version: {
      ...version,
      formattedSize: formatFileSize(version.fileSize),
      isCurrent: version.isCurrent === 1
    }
  });
});

router.post('/create', authMiddleware, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { fileId, changeDescription } = req.body;
  const file = req.file;
  
  if (!fileId || !file) {
    res.status(400).json({ error: 'fileId 和文件不能为空' });
    return;
  }
  
  const existingFile = blockStorageEngine.getFileById(fileId);
  
  if (!existingFile) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (existingFile.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权编辑此文件' });
    return;
  }
  
  const newVersion = versionControllerEngine.createVersion(
    fileId,
    req.user.id,
    file.buffer,
    changeDescription
  );
  
  const updatedFile = blockStorageEngine.getFileById(fileId);
  
  const { ip, userAgent } = getRequestInfo(req);
  
  auditService.logFileEdit(
    req.user.id,
    fileId,
    existingFile.fileName,
    newVersion.versionNumber,
    {
      ipAddress: ip,
      userAgent,
      changeDescription
    }
  );
  
  auditService.logVersionChange(
    req.user.id,
    fileId,
    newVersion.id,
    newVersion.versionNumber,
    'create',
    {
      ipAddress: ip,
      userAgent
    }
  );
  
  res.json({
    success: true,
    message: '新版本创建成功',
    version: {
      ...newVersion,
      formattedSize: formatFileSize(newVersion.fileSize)
    },
    file: updatedFile ? {
      ...updatedFile,
      formattedSize: formatFileSize(updatedFile.fileSize)
    } : null
  });
});

router.post('/rollback', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { fileId, versionId } = req.body;
  
  if (!fileId || !versionId) {
    res.status(400).json({ error: 'fileId 和 versionId 不能为空' });
    return;
  }
  
  const file = blockStorageEngine.getFileById(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权编辑此文件' });
    return;
  }
  
  const targetVersion = versionControllerEngine.getVersionById(versionId);
  
  if (!targetVersion || targetVersion.fileId !== fileId) {
    res.status(404).json({ error: '目标版本不存在' });
    return;
  }
  
  const result = versionControllerEngine.rollbackToVersion(
    fileId,
    versionId,
    req.user.id
  );
  
  const { ip, userAgent } = getRequestInfo(req);
  
  auditService.logVersionChange(
    req.user.id,
    fileId,
    result.newVersion.id,
    result.newVersion.versionNumber,
    'rollback',
    {
      ipAddress: ip,
      userAgent,
      fromVersion: targetVersion.versionNumber
    }
  );
  
  res.json({
    success: true,
    message: `已回滚到版本 v${targetVersion.versionNumber}`,
    newVersion: {
      ...result.newVersion,
      formattedSize: formatFileSize(result.newVersion.fileSize)
    },
    file: {
      ...result.file,
      formattedSize: formatFileSize(result.file.fileSize)
    }
  });
});

router.get('/download/:versionId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const versionId = req.params.versionId;
  const version = versionControllerEngine.getVersionById(versionId);
  
  if (!version) {
    res.status(404).json({ error: '版本不存在' });
    return;
  }
  
  const file = blockStorageEngine.getFileById(version.fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权下载此版本' });
    return;
  }
  
  if (!fs.existsSync(version.storagePath)) {
    res.status(404).json({ error: '版本文件已丢失' });
    return;
  }
  
  const data = versionControllerEngine.getVersionData(versionId);
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(version.fileName)}"`);
  res.setHeader('Content-Length', data.length);
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logFileDownload(
    req.user.id,
    version.fileId,
    version.fileName,
    version.fileSize,
    {
      ipAddress: ip,
      userAgent
    }
  );
  
  res.send(data);
});

export default router;
