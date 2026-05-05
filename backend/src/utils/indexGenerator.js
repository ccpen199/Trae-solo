const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

class IndexGenerator {
  constructor() {
    this.excludeDirs = new Set(config.excludeDirs);
    this.allowedExtensions = new Set(config.allowedExtensions);
  }

  shouldExcludeDir(dirName) {
    return this.excludeDirs.has(dirName);
  }

  isAllowedExtension(ext) {
    return this.allowedExtensions.has(ext.toLowerCase());
  }

  async scanDirectory(dirPath, progressCallback = null) {
    const files = [];
    const dirQueue = [dirPath];
    let totalFiles = 0;
    let dirsProcessed = 0;

    for (let i = 0; i < dirQueue.length; i++) {
      const currentDir = dirQueue[i];
      
      await new Promise(resolve => setImmediate(resolve));
      
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          try {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
              if (!this.shouldExcludeDir(entry.name)) {
                dirQueue.push(fullPath);
              }
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name);
              if (this.isAllowedExtension(ext)) {
                totalFiles++;
                files.push(fullPath);
              }
            }
          } catch (entryError) {
            console.warn(`处理条目 ${entry.name} 时出错:`, entryError.message);
          }
        }
        
        dirsProcessed++;
      } catch (error) {
        console.error(`无法读取目录 ${currentDir}:`, error.message);
      }
    }

    return { files, totalFiles };
  }

  extractKeywords(content, maxKeywords = 100) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const words = content
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2)
      .slice(0, maxKeywords);

    return [...new Set(words)];
  }

  async readFileContent(filePath, maxSize = config.maxFileSize) {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > maxSize) {
        return null;
      }

      const ext = path.extname(filePath).toLowerCase();
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp', 
           '.mp3', '.mp4', '.avi', '.mov', '.wmv', 
           '.zip', '.rar', '.7z', '.tar', '.gz',
           '.exe', '.dll', '.so', '.dylib',
           '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
        return null;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`无法读取文件 ${filePath}:`, error.message);
      return null;
    }
  }

  async indexFile(filePath) {
    try {
      await new Promise(resolve => setImmediate(resolve));
      
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      const dirname = path.dirname(filePath);

      let content = null;
      try {
        content = await this.readFileContent(filePath);
      } catch (readError) {
        console.warn(`读取文件内容失败 ${filePath}:`, readError.message);
        content = null;
      }
      
      const keywords = this.extractKeywords(content || '');
      keywords.push(...this.extractKeywords(filename));

      let createdTime;
      try {
        createdTime = stats.birthtime.toISOString();
      } catch (e) {
        createdTime = stats.mtime.toISOString();
      }

      let contentPreview = null;
      try {
        contentPreview = content ? content.substring(0, 500) : null;
      } catch (e) {
        contentPreview = null;
      }

      return {
        id: Buffer.from(filePath).toString('base64'),
        filename: filename,
        path: filePath,
        directory: dirname,
        extension: ext,
        size: stats.size,
        modifiedTime: stats.mtime.toISOString(),
        createdTime: createdTime,
        keywords: keywords,
        hasContent: content !== null,
        contentPreview: contentPreview,
      };
    } catch (error) {
      console.error(`索引文件失败 ${filePath}:`, error.message);
      return null;
    }
  }

  async generateIndex(dirPath, progressCallback = null) {
    const startTime = Date.now();
    
    const { files, totalFiles } = await this.scanDirectory(dirPath);
    const indexedFiles = [];
    const skippedFiles = [];
    let processed = 0;

    for (const filePath of files) {
      const index = await this.indexFile(filePath);
      
      if (index) {
        indexedFiles.push(index);
      } else {
        skippedFiles.push(filePath);
      }

      processed++;
      
      if (progressCallback) {
        progressCallback({
          processed,
          total: files.length,
          percentage: Math.round((processed / files.length) * 100),
          currentFile: filePath,
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      rootDirectory: dirPath,
      indexedAt: new Date().toISOString(),
      duration: duration,
      totalFilesScanned: totalFiles,
      filesIndexed: indexedFiles.length,
      filesSkipped: skippedFiles.length,
      files: indexedFiles,
      skippedFiles: skippedFiles,
    };
  }
}

module.exports = new IndexGenerator();
