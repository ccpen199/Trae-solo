import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { 
  authMiddleware, 
  getRequestInfo,
  AuthenticatedRequest,
  User
} from '../middleware/auth.js';
import { blockStorageEngine, FileRecord } from '../engines/block-storage.js';
import { versionControllerEngine } from '../engines/version-controller.js';
import { auditService } from '../services/audit-service.js';
import db from '../database/index.js';

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

router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const parentId = req.query.parent_id as string | undefined;
  const files = blockStorageEngine.getUserFiles(req.user.id, parentId);
  
  const formattedFiles = files.map(file => ({
    ...file,
    formattedSize: formatFileSize(file.fileSize),
    isFolder: file.isFolder === 1
  }));
  
  res.json({ 
    files: formattedFiles,
    parentId: parentId || null
  });
});

router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const fileId = req.params.id;
  const file = blockStorageEngine.getFileById(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权访问此文件' });
    return;
  }
  
  res.json({ 
    file: {
      ...file,
      formattedSize: formatFileSize(file.fileSize),
      isFolder: file.isFolder === 1
    }
  });
});

router.post('/upload/init', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { fileName, fileSize, md5Hash, mimeType } = req.body;
  
  if (!fileName || fileSize === undefined) {
    res.status(400).json({ error: '文件名和文件大小不能为空' });
    return;
  }
  
  if (md5Hash) {
    const existingFile = blockStorageEngine.checkDuplicateFile(md5Hash, req.user.id);
    if (existingFile) {
      const { ip, userAgent } = getRequestInfo(req);
      auditService.logFileUpload(req.user.id, existingFile.id, existingFile.fileName, existingFile.fileSize, {
        ipAddress: ip,
        userAgent,
        isDuplicate: true
      });
      
      res.json({
        isDuplicate: true,
        message: '检测到重复文件，秒传成功',
        file: {
          ...existingFile,
          formattedSize: formatFileSize(existingFile.fileSize)
        }
      });
      return;
    }
  }
  
  const session = blockStorageEngine.createUploadSession(
    req.user.id,
    fileName,
    fileSize,
    md5Hash
  );
  
  res.json({
    isDuplicate: false,
    sessionId: session.id,
    totalChunks: session.totalChunks,
    chunkSize: session.chunkSize,
    uploadedChunks: session.uploadedChunks
  });
});

router.post('/upload/chunk', authMiddleware, upload.single('chunk'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { sessionId, chunkIndex, chunkMd5 } = req.body;
  const chunk = req.file;
  
  if (!sessionId || chunkIndex === undefined || !chunk) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  try {
    const result = blockStorageEngine.uploadChunk(
      sessionId,
      parseInt(chunkIndex, 10),
      chunk.buffer,
      chunkMd5
    );
    
    res.json({
      success: true,
      isComplete: result.isComplete,
      uploadedChunks: result.uploadedChunks,
      totalChunks: result.totalChunks,
      progress: Math.round((result.uploadedChunks / result.totalChunks) * 100)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '上传失败';
    res.status(400).json({ error: errorMessage });
  }
});

router.post('/upload/complete', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { sessionId, mimeType, parentId } = req.body;
  
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId 不能为空' });
    return;
  }
  
  try {
    const file = blockStorageEngine.completeUpload(
      sessionId,
      req.user.id,
      mimeType,
      parentId
    );
    
    versionControllerEngine.createInitialVersion(
      file.id,
      req.user.id,
      file.filePath,
      file.fileSize,
      file.md5Hash || ''
    );
    
    const { ip, userAgent } = getRequestInfo(req);
    auditService.logFileUpload(req.user.id, file.id, file.fileName, file.fileSize, {
      ipAddress: ip,
      userAgent,
      isChunked: true
    });
    
    res.json({
      success: true,
      message: '文件上传完成',
      file: {
        ...file,
        formattedSize: formatFileSize(file.fileSize)
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '完成上传失败';
    res.status(400).json({ error: errorMessage });
  }
});

router.post('/upload/simple', authMiddleware, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const file = req.file;
  const { parentId } = req.body;
  
  if (!file) {
    res.status(400).json({ error: '请选择文件' });
    return;
  }
  
  const md5Hash = createHash('md5').update(file.buffer).digest('hex');
  
  const existingFile = blockStorageEngine.checkDuplicateFile(md5Hash, req.user.id);
  if (existingFile) {
    const { ip, userAgent } = getRequestInfo(req);
    auditService.logFileUpload(req.user.id, existingFile.id, existingFile.fileName, existingFile.fileSize, {
      ipAddress: ip,
      userAgent,
      isDuplicate: true
    });
    
    res.json({
      isDuplicate: true,
      message: '检测到重复文件，秒传成功',
      file: {
        ...existingFile,
        formattedSize: formatFileSize(existingFile.fileSize)
      }
    });
    return;
  }
  
  const storagePath = process.env.STORAGE_PATH || './storage';
  const userStorageDir = path.join(storagePath, 'files', req.user.id);
  
  if (!fs.existsSync(userStorageDir)) {
    fs.mkdirSync(userStorageDir, { recursive: true });
  }
  
  const fileExtension = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, fileExtension);
  const uniqueFileName = `${baseName}_${Date.now()}${fileExtension}`;
  const finalFilePath = path.join(userStorageDir, uniqueFileName);
  
  fs.writeFileSync(finalFilePath, file.buffer);
  
  const fileId = uuidv4();
  const sha256Hash = createHash('sha256').update(file.buffer).digest('hex');
  
  const insertStmt = db.prepare(`
    INSERT INTO files (
      id, user_id, parent_id, file_name, file_path, mime_type,
      file_size, md5_hash, sha256_hash, is_folder, is_encrypted,
      status, version_count, current_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'active', 1, 1)
  `);
  
  insertStmt.run(
    fileId,
    req.user.id,
    parentId || null,
    file.originalname,
    finalFilePath,
    file.mimetype || 'application/octet-stream',
    file.size,
    md5Hash,
    sha256Hash
  );
  
  versionControllerEngine.createInitialVersion(
    fileId,
    req.user.id,
    finalFilePath,
    file.size,
    md5Hash
  );
  
  blockStorageEngine.updateUserStorageUsage(req.user.id);
  
  const newFile = blockStorageEngine.getFileById(fileId) as FileRecord;
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logFileUpload(req.user.id, fileId, file.originalname, file.size, {
    ipAddress: ip,
    userAgent
  });
  
  res.json({
    success: true,
    message: '文件上传成功',
    file: {
      ...newFile,
      formattedSize: formatFileSize(newFile.fileSize)
    }
  });
});

router.post('/folder', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const { folderName, parentId } = req.body;
  
  if (!folderName) {
    res.status(400).json({ error: '文件夹名称不能为空' });
    return;
  }
  
  const folder = blockStorageEngine.createFolder(
    req.user.id,
    folderName,
    parentId
  );
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.log('create_folder', 'file_upload', {
    userId: req.user.id,
    targetType: 'folder',
    targetId: folder.id,
    ipAddress: ip,
    userAgent,
    details: { folderName, parentId }
  });
  
  res.json({
    success: true,
    message: '文件夹创建成功',
    folder: {
      ...folder,
      isFolder: true
    }
  });
});

router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const fileId = req.params.id;
  const file = blockStorageEngine.getFileById(fileId);
  
  if (!file) {
    res.status(404).json({ error: '文件不存在' });
    return;
  }
  
  if (file.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: '无权删除此文件' });
    return;
  }
  
  blockStorageEngine.deleteFile(fileId, req.user.id);
  
  const { ip, userAgent } = getRequestInfo(req);
  auditService.logFileDelete(req.user.id, fileId, file.fileName, {
    ipAddress: ip,
    userAgent
  });
  
  res.json({
    success: true,
    message: '文件已删除'
  });
});

export default router;
