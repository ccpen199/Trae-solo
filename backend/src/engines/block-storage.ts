import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_PATH = path.resolve(path.join(__dirname, '../../'), process.env.STORAGE_PATH || './storage');
const MAX_CHUNK_SIZE = parseInt(process.env.MAX_CHUNK_SIZE || '5242880', 10);

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function calculateMD5(data: Buffer): string {
  return createHash('md5').update(data).digest('hex');
}

export interface UploadSession {
  id: string;
  fileId: string | null;
  userId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number;
  chunkSize: number;
  md5Hash: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileChunk {
  id: string;
  fileId: string;
  chunkIndex: number;
  chunkSize: number;
  chunkMd5: string | null;
  storagePath: string;
  isEncrypted: number;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  userId: string;
  parentId: string | null;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number;
  md5Hash: string | null;
  sha256Hash: string | null;
  isFolder: number;
  isEncrypted: number;
  encryptionKeyId: string | null;
  status: string;
  versionCount: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  accessedAt: string | null;
}

export class BlockStorageEngine {
  private storagePath: string;
  private chunkSize: number;

  constructor() {
    this.storagePath = STORAGE_PATH;
    this.chunkSize = MAX_CHUNK_SIZE;
    ensureDirectory(this.storagePath);
    ensureDirectory(path.join(this.storagePath, 'chunks'));
    ensureDirectory(path.join(this.storagePath, 'files'));
    ensureDirectory(path.join(this.storagePath, 'temp'));
  }

  createUploadSession(
    userId: string,
    fileName: string,
    fileSize: number,
    md5Hash?: string
  ): UploadSession {
    const sessionId = uuidv4();
    const totalChunks = Math.ceil(fileSize / this.chunkSize);
    
    const insertStmt = db.prepare(`
      INSERT INTO upload_sessions (
        id, user_id, file_name, file_size, total_chunks, 
        uploaded_chunks, chunk_size, md5_hash, status
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'uploading')
    `);
    
    insertStmt.run(
      sessionId, userId, fileName, fileSize, totalChunks,
      this.chunkSize, md5Hash || null
    );
    
    return this.getUploadSession(sessionId) as UploadSession;
  }

  getUploadSession(sessionId: string): UploadSession | null {
    const stmt = db.prepare('SELECT * FROM upload_sessions WHERE id = ?');
    const result = stmt.get(sessionId);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      fileId: row.file_id as string | null,
      userId: row.user_id as string,
      fileName: row.file_name as string,
      fileSize: row.file_size as number,
      totalChunks: row.total_chunks as number,
      uploadedChunks: row.uploaded_chunks as number,
      chunkSize: row.chunk_size as number,
      md5Hash: row.md5_hash as string | null,
      status: row.status as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  checkDuplicateFile(md5Hash: string, userId: string): FileRecord | null {
    const stmt = db.prepare(`
      SELECT f.* FROM files f 
      WHERE f.md5_hash = ? AND f.status = 'active' AND f.is_folder = 0
      LIMIT 1
    `);
    const result = stmt.get(md5Hash);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      parentId: row.parent_id as string | null,
      fileName: row.file_name as string,
      filePath: row.file_path as string,
      mimeType: row.mime_type as string | null,
      fileSize: row.file_size as number,
      md5Hash: row.md5_hash as string | null,
      sha256Hash: row.sha256_hash as string | null,
      isFolder: row.is_folder as number,
      isEncrypted: row.is_encrypted as number,
      encryptionKeyId: row.encryption_key_id as string | null,
      status: row.status as string,
      versionCount: row.version_count as number,
      currentVersion: row.current_version as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      accessedAt: row.accessed_at as string | null
    };
  }

  uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: Buffer,
    chunkMd5?: string
  ): { success: boolean; isComplete: boolean; uploadedChunks: number; totalChunks: number } {
    const session = this.getUploadSession(sessionId);
    if (!session) {
      throw new Error('上传会话不存在');
    }
    
    if (session.status !== 'uploading') {
      throw new Error(`上传会话状态无效: ${session.status}`);
    }
    
    const calculatedMd5 = calculateMD5(chunkData);
    if (chunkMd5 && chunkMd5 !== calculatedMd5) {
      throw new Error('分片MD5校验失败');
    }
    
    const chunkDir = path.join(this.storagePath, 'chunks', sessionId);
    ensureDirectory(chunkDir);
    
    const chunkPath = path.join(chunkDir, `${chunkIndex}.chunk`);
    fs.writeFileSync(chunkPath, chunkData);
    
    const checkExisting = db.prepare(
      'SELECT id FROM uploaded_chunks WHERE session_id = ? AND chunk_index = ?'
    );
    const existing = checkExisting.get(sessionId, chunkIndex);
    
    if (existing) {
      const updateChunk = db.prepare(`
        UPDATE uploaded_chunks 
        SET chunk_size = ?, chunk_md5 = ?, storage_path = ?, uploaded_at = datetime('now')
        WHERE session_id = ? AND chunk_index = ?
      `);
      updateChunk.run(chunkData.length, calculatedMd5, chunkPath, sessionId, chunkIndex);
    } else {
      const insertChunk = db.prepare(`
        INSERT INTO uploaded_chunks (id, session_id, chunk_index, chunk_size, chunk_md5, storage_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertChunk.run(uuidv4(), sessionId, chunkIndex, chunkData.length, calculatedMd5, chunkPath);
    }
    
    const countStmt = db.prepare(
      'SELECT COUNT(*) as count FROM uploaded_chunks WHERE session_id = ?'
    );
    const countResult = countStmt.get(sessionId) as { count: number };
    const uploadedChunks = countResult.count;
    
    const updateSession = db.prepare(`
      UPDATE upload_sessions 
      SET uploaded_chunks = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateSession.run(uploadedChunks, sessionId);
    
    const isComplete = uploadedChunks >= session.totalChunks;
    
    return {
      success: true,
      isComplete,
      uploadedChunks,
      totalChunks: session.totalChunks
    };
  }

  completeUpload(
    sessionId: string,
    userId: string,
    mimeType?: string,
    parentId?: string
  ): FileRecord {
    const session = this.getUploadSession(sessionId);
    if (!session) {
      throw new Error('上传会话不存在');
    }
    
    const chunksStmt = db.prepare(`
      SELECT * FROM uploaded_chunks 
      WHERE session_id = ? 
      ORDER BY chunk_index ASC
    `);
    const chunks = chunksStmt.all(sessionId) as Array<Record<string, unknown>>;
    
    if (chunks.length !== session.totalChunks) {
      throw new Error(`分片不完整: 已上传 ${chunks.length}/${session.totalChunks}`);
    }
    
    const fileId = uuidv4();
    const userStorageDir = path.join(this.storagePath, 'files', userId);
    ensureDirectory(userStorageDir);
    
    const fileName = session.fileName;
    const fileExtension = path.extname(fileName);
    const baseName = path.basename(fileName, fileExtension);
    const uniqueFileName = `${baseName}_${Date.now()}${fileExtension}`;
    const finalFilePath = path.join(userStorageDir, uniqueFileName);
    
    const writeStream = fs.createWriteStream(finalFilePath);
    
    let totalSize = 0;
    const fileChunks: Array<{
      id: string;
      fileId: string;
      chunkIndex: number;
      chunkSize: number;
      chunkMd5: string;
      storagePath: string;
      isEncrypted: number;
    }> = [];
    
    for (const chunk of chunks) {
      const chunkPath = chunk.storage_path as string;
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      totalSize += chunkData.length;
      
      fileChunks.push({
        id: uuidv4(),
        fileId,
        chunkIndex: chunk.chunk_index as number,
        chunkSize: chunk.chunk_size as number,
        chunkMd5: chunk.chunk_md5 as string,
        storagePath: chunkPath,
        isEncrypted: 0
      });
    }
    
    writeStream.end();
    
    const finalBuffer = fs.readFileSync(finalFilePath);
    const finalMd5 = calculateMD5(finalBuffer);
    const finalSha256 = createHash('sha256').update(finalBuffer).digest('hex');
    
    const insertFile = db.prepare(`
      INSERT INTO files (
        id, user_id, parent_id, file_name, file_path, mime_type,
        file_size, md5_hash, sha256_hash, is_folder, is_encrypted,
        status, version_count, current_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'active', 1, 1)
    `);
    
    insertFile.run(
      fileId,
      userId,
      parentId || null,
      fileName,
      finalFilePath,
      mimeType || 'application/octet-stream',
      totalSize,
      finalMd5,
      finalSha256
    );
    
    const insertChunkStmt = db.prepare(`
      INSERT INTO file_chunks (id, file_id, chunk_index, chunk_size, chunk_md5, storage_path, is_encrypted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const chunk of fileChunks) {
      insertChunkStmt.run(
        chunk.id, chunk.fileId, chunk.chunkIndex, 
        chunk.chunkSize, chunk.chunkMd5, chunk.storagePath, chunk.isEncrypted
      );
    }
    
    const updateSession = db.prepare(`
      UPDATE upload_sessions 
      SET status = 'completed', file_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateSession.run(fileId, sessionId);
    
    this.updateUserStorageUsage(userId);
    
    return this.getFileById(fileId) as FileRecord;
  }

  getFileById(fileId: string): FileRecord | null {
    const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const result = stmt.get(fileId);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      parentId: row.parent_id as string | null,
      fileName: row.file_name as string,
      filePath: row.file_path as string,
      mimeType: row.mime_type as string | null,
      fileSize: row.file_size as number,
      md5Hash: row.md5_hash as string | null,
      sha256Hash: row.sha256_hash as string | null,
      isFolder: row.is_folder as number,
      isEncrypted: row.is_encrypted as number,
      encryptionKeyId: row.encryption_key_id as string | null,
      status: row.status as string,
      versionCount: row.version_count as number,
      currentVersion: row.current_version as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      accessedAt: row.accessed_at as string | null
    };
  }

  getUserFiles(userId: string, parentId?: string): FileRecord[] {
    let stmt;
    if (parentId) {
      stmt = db.prepare(`
        SELECT * FROM files 
        WHERE user_id = ? AND parent_id = ? AND status = 'active'
        ORDER BY is_folder DESC, created_at DESC
      `);
      return (stmt.all(userId, parentId) as Array<Record<string, unknown>>).map(row => ({
        id: row.id as string,
        userId: row.user_id as string,
        parentId: row.parent_id as string | null,
        fileName: row.file_name as string,
        filePath: row.file_path as string,
        mimeType: row.mime_type as string | null,
        fileSize: row.file_size as number,
        md5Hash: row.md5_hash as string | null,
        sha256Hash: row.sha256_hash as string | null,
        isFolder: row.is_folder as number,
        isEncrypted: row.is_encrypted as number,
        encryptionKeyId: row.encryption_key_id as string | null,
        status: row.status as string,
        versionCount: row.version_count as number,
        currentVersion: row.current_version as number,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        accessedAt: row.accessed_at as string | null
      }));
    } else {
      stmt = db.prepare(`
        SELECT * FROM files 
        WHERE user_id = ? AND parent_id IS NULL AND status = 'active'
        ORDER BY is_folder DESC, created_at DESC
      `);
      return (stmt.all(userId) as Array<Record<string, unknown>>).map(row => ({
        id: row.id as string,
        userId: row.user_id as string,
        parentId: row.parent_id as string | null,
        fileName: row.file_name as string,
        filePath: row.file_path as string,
        mimeType: row.mime_type as string | null,
        fileSize: row.file_size as number,
        md5Hash: row.md5_hash as string | null,
        sha256Hash: row.sha256_hash as string | null,
        isFolder: row.is_folder as number,
        isEncrypted: row.is_encrypted as number,
        encryptionKeyId: row.encryption_key_id as string | null,
        status: row.status as string,
        versionCount: row.version_count as number,
        currentVersion: row.current_version as number,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        accessedAt: row.accessed_at as string | null
      }));
    }
  }

  updateUserStorageUsage(userId: string): void {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(file_size), 0) as total_size,
             COUNT(*) as file_count
      FROM files 
      WHERE user_id = ? AND status = 'active' AND is_folder = 0
    `);
    const result = stmt.get(userId) as { total_size: number; file_count: number };
    
    const updateStmt = db.prepare(`
      UPDATE users 
      SET storage_used = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(result.total_size, userId);
    
    const metricsStmt = db.prepare(`
      UPDATE storage_metrics 
      SET storage_used = ?, total_files = ?, recorded_at = datetime('now')
      WHERE user_id = ?
    `);
    metricsStmt.run(result.total_size, result.file_count, userId);
  }

  createFolder(
    userId: string,
    folderName: string,
    parentId?: string
  ): FileRecord {
    const folderId = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO files (
        id, user_id, parent_id, file_name, file_path,
        file_size, is_folder, status, version_count, current_version
      ) VALUES (?, ?, ?, ?, ?, 0, 1, 'active', 1, 1)
    `);
    
    insertStmt.run(
      folderId,
      userId,
      parentId || null,
      folderName,
      `/${folderName}`
    );
    
    return this.getFileById(folderId) as FileRecord;
  }

  deleteFile(fileId: string, userId: string): boolean {
    const file = this.getFileById(fileId);
    if (!file) {
      throw new Error('文件不存在');
    }
    
    if (file.userId !== userId) {
      throw new Error('无权限删除此文件');
    }
    
    const updateStmt = db.prepare(`
      UPDATE files 
      SET status = 'deleted', updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(fileId);
    
    this.updateUserStorageUsage(userId);
    
    return true;
  }

  getUploadedChunkIndices(sessionId: string): number[] {
    const stmt = db.prepare(
      'SELECT chunk_index FROM uploaded_chunks WHERE session_id = ? ORDER BY chunk_index'
    );
    const results = stmt.all(sessionId) as Array<{ chunk_index: number }>;
    return results.map(r => r.chunk_index);
  }
}

export const blockStorageEngine = new BlockStorageEngine();
