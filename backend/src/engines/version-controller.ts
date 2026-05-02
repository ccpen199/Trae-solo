import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/index.js';
import { FileRecord } from './block-storage.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_PATH = path.resolve(path.join(__dirname, '../../'), process.env.STORAGE_PATH || './storage');

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  md5Hash: string | null;
  storagePath: string;
  isEncrypted: number;
  changeDescription: string | null;
  createdBy: string;
  createdAt: string;
  isCurrent: number;
}

export class VersionControllerEngine {
  private storagePath: string;

  constructor() {
    this.storagePath = STORAGE_PATH;
    ensureDirectory(path.join(this.storagePath, 'versions'));
  }

  createVersion(
    fileId: string,
    userId: string,
    newFileData: Buffer,
    changeDescription?: string
  ): FileVersion {
    const fileStmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const fileResult = fileStmt.get(fileId);
    
    if (!fileResult) {
      throw new Error('文件不存在');
    }
    
    const fileRow = fileResult as Record<string, unknown>;
    const currentVersion = fileRow.current_version as number;
    const newVersionNumber = currentVersion + 1;
    
    const versionsDir = path.join(this.storagePath, 'versions', fileId);
    ensureDirectory(versionsDir);
    
    const versionFileName = `v${newVersionNumber}_${Date.now()}${path.extname(fileRow.file_name as string)}`;
    const versionFilePath = path.join(versionsDir, versionFileName);
    
    fs.writeFileSync(versionFilePath, newFileData);
    
    const md5Hash = createHash('md5').update(newFileData).digest('hex');
    
    const updateOldVersions = db.prepare(`
      UPDATE file_versions 
      SET is_current = 0 
      WHERE file_id = ? AND is_current = 1
    `);
    updateOldVersions.run(fileId);
    
    const versionId = uuidv4();
    const insertVersion = db.prepare(`
      INSERT INTO file_versions (
        id, file_id, version_number, file_name, file_size,
        md5_hash, storage_path, is_encrypted, change_description,
        created_by, is_current
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
    `);
    
    insertVersion.run(
      versionId,
      fileId,
      newVersionNumber,
      fileRow.file_name as string,
      newFileData.length,
      md5Hash,
      versionFilePath,
      changeDescription || null,
      userId
    );
    
    const updateFile = db.prepare(`
      UPDATE files 
      SET file_size = ?, md5_hash = ?, version_count = ?, 
          current_version = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    updateFile.run(
      newFileData.length,
      md5Hash,
      newVersionNumber,
      newVersionNumber,
      fileId
    );
    
    const newFilePath = fileRow.file_path as string;
    fs.writeFileSync(newFilePath, newFileData);
    
    return this.getVersionById(versionId) as FileVersion;
  }

  getVersionById(versionId: string): FileVersion | null {
    const stmt = db.prepare('SELECT * FROM file_versions WHERE id = ?');
    const result = stmt.get(versionId);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      fileId: row.file_id as string,
      versionNumber: row.version_number as number,
      fileName: row.file_name as string,
      fileSize: row.file_size as number,
      md5Hash: row.md5_hash as string | null,
      storagePath: row.storage_path as string,
      isEncrypted: row.is_encrypted as number,
      changeDescription: row.change_description as string | null,
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      isCurrent: row.is_current as number
    };
  }

  getFileVersions(fileId: string): FileVersion[] {
    const stmt = db.prepare(`
      SELECT * FROM file_versions 
      WHERE file_id = ? 
      ORDER BY version_number DESC
    `);
    const results = stmt.all(fileId) as Array<Record<string, unknown>>;
    
    return results.map(row => ({
      id: row.id as string,
      fileId: row.file_id as string,
      versionNumber: row.version_number as number,
      fileName: row.file_name as string,
      fileSize: row.file_size as number,
      md5Hash: row.md5_hash as string | null,
      storagePath: row.storage_path as string,
      isEncrypted: row.is_encrypted as number,
      changeDescription: row.change_description as string | null,
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      isCurrent: row.is_current as number
    }));
  }

  rollbackToVersion(
    fileId: string,
    versionId: string,
    userId: string
  ): { file: FileRecord; newVersion: FileVersion } {
    const targetVersion = this.getVersionById(versionId);
    if (!targetVersion) {
      throw new Error('目标版本不存在');
    }
    
    if (targetVersion.fileId !== fileId) {
      throw new Error('版本不属于此文件');
    }
    
    if (!fs.existsSync(targetVersion.storagePath)) {
      throw new Error('版本文件已丢失');
    }
    
    const versionData = fs.readFileSync(targetVersion.storagePath);
    
    const fileStmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const fileResult = fileStmt.get(fileId);
    if (!fileResult) {
      throw new Error('文件不存在');
    }
    
    const fileRow = fileResult as Record<string, unknown>;
    const currentVersionNum = fileRow.current_version as number;
    const newVersionNum = currentVersionNum + 1;
    
    const versionsDir = path.join(this.storagePath, 'versions', fileId);
    ensureDirectory(versionsDir);
    
    const rollbackVersionFileName = `v${newVersionNum}_rollback_${Date.now()}${path.extname(fileRow.file_name as string)}`;
    const rollbackVersionPath = path.join(versionsDir, rollbackVersionFileName);
    
    fs.writeFileSync(rollbackVersionPath, versionData);
    
    const md5Hash = createHash('md5').update(versionData).digest('hex');
    
    const updateOldVersions = db.prepare(`
      UPDATE file_versions 
      SET is_current = 0 
      WHERE file_id = ? AND is_current = 1
    `);
    updateOldVersions.run(fileId);
    
    const newVersionId = uuidv4();
    const insertVersion = db.prepare(`
      INSERT INTO file_versions (
        id, file_id, version_number, file_name, file_size,
        md5_hash, storage_path, is_encrypted, change_description,
        created_by, is_current
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
    `);
    
    insertVersion.run(
      newVersionId,
      fileId,
      newVersionNum,
      fileRow.file_name as string,
      versionData.length,
      md5Hash,
      rollbackVersionPath,
      `回滚至版本 v${targetVersion.versionNumber}`,
      userId
    );
    
    const updateFile = db.prepare(`
      UPDATE files 
      SET file_size = ?, md5_hash = ?, version_count = ?, 
          current_version = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    updateFile.run(
      versionData.length,
      md5Hash,
      newVersionNum,
      newVersionNum,
      fileId
    );
    
    const currentFilePath = fileRow.file_path as string;
    fs.writeFileSync(currentFilePath, versionData);
    
    const updatedFileStmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const updatedFileResult = updatedFileStmt.get(fileId) as Record<string, unknown>;
    
    const updatedFile: FileRecord = {
      id: updatedFileResult.id as string,
      userId: updatedFileResult.user_id as string,
      parentId: updatedFileResult.parent_id as string | null,
      fileName: updatedFileResult.file_name as string,
      filePath: updatedFileResult.file_path as string,
      mimeType: updatedFileResult.mime_type as string | null,
      fileSize: updatedFileResult.file_size as number,
      md5Hash: updatedFileResult.md5_hash as string | null,
      sha256Hash: updatedFileResult.sha256_hash as string | null,
      isFolder: updatedFileResult.is_folder as number,
      isEncrypted: updatedFileResult.is_encrypted as number,
      encryptionKeyId: updatedFileResult.encryption_key_id as string | null,
      status: updatedFileResult.status as string,
      versionCount: updatedFileResult.version_count as number,
      currentVersion: updatedFileResult.current_version as number,
      createdAt: updatedFileResult.created_at as string,
      updatedAt: updatedFileResult.updated_at as string,
      accessedAt: updatedFileResult.accessed_at as string | null
    };
    
    const newVersion = this.getVersionById(newVersionId) as FileVersion;
    
    return {
      file: updatedFile,
      newVersion
    };
  }

  getVersionData(versionId: string): Buffer {
    const version = this.getVersionById(versionId);
    if (!version) {
      throw new Error('版本不存在');
    }
    
    if (!fs.existsSync(version.storagePath)) {
      throw new Error('版本文件已丢失');
    }
    
    return fs.readFileSync(version.storagePath);
  }

  createInitialVersion(
    fileId: string,
    userId: string,
    filePath: string,
    fileSize: number,
    md5Hash: string
  ): FileVersion {
    const versionsDir = path.join(this.storagePath, 'versions', fileId);
    ensureDirectory(versionsDir);
    
    const originalData = fs.readFileSync(filePath);
    
    const versionFileName = `v1_${Date.now()}${path.extname(filePath)}`;
    const versionFilePath = path.join(versionsDir, versionFileName);
    
    fs.writeFileSync(versionFilePath, originalData);
    
    const versionId = uuidv4();
    const fileStmt = db.prepare('SELECT file_name FROM files WHERE id = ?');
    const fileResult = fileStmt.get(fileId) as { file_name: string };
    
    const insertVersion = db.prepare(`
      INSERT INTO file_versions (
        id, file_id, version_number, file_name, file_size,
        md5_hash, storage_path, is_encrypted, change_description,
        created_by, is_current
      ) VALUES (?, ?, 1, ?, ?, ?, ?, 0, '初始版本', ?, 1)
    `);
    
    insertVersion.run(
      versionId,
      fileId,
      fileResult.file_name,
      fileSize,
      md5Hash,
      versionFilePath,
      userId
    );
    
    return this.getVersionById(versionId) as FileVersion;
  }
}

export const versionControllerEngine = new VersionControllerEngine();
