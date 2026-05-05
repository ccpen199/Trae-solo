const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const indexGenerator = require('./indexGenerator');
const indexStore = require('./indexStore');
const config = require('../config');

class IndexUpdater {
  constructor() {
    this.watcher = null;
    this.watching = false;
    this.currentDirectory = null;
  }

  async startWatching(directory) {
    if (this.watching) {
      this.stopWatching();
    }

    this.currentDirectory = directory;
    
    this.watcher = chokidar.watch(directory, {
      persistent: true,
      ignoreInitial: true,
      ignored: (filePath) => {
        const basename = path.basename(filePath);
        return config.excludeDirs.some(dir => 
          filePath.includes(path.sep + dir + path.sep) || 
          basename === dir
        );
      },
    });

    this.watcher
      .on('add', async (filePath) => {
        console.log('文件已添加:', filePath);
        await this._handleFileChange(filePath, 'add');
      })
      .on('change', async (filePath) => {
        console.log('文件已修改:', filePath);
        await this._handleFileChange(filePath, 'change');
      })
      .on('unlink', async (filePath) => {
        console.log('文件已删除:', filePath);
        await this._handleFileChange(filePath, 'unlink');
      })
      .on('addDir', (dirPath) => {
        console.log('目录已添加:', dirPath);
      })
      .on('unlinkDir', (dirPath) => {
        console.log('目录已删除:', dirPath);
      })
      .on('error', (error) => {
        console.error('文件监控错误:', error);
      });

    this.watching = true;
    console.log('开始监控目录:', directory);
    return { success: true, message: `开始监控目录: ${directory}` };
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.watching = false;
    this.currentDirectory = null;
    console.log('已停止文件监控');
    return { success: true, message: '已停止文件监控' };
  }

  isWatching() {
    return this.watching;
  }

  getWatchedDirectory() {
    return this.currentDirectory;
  }

  async _handleFileChange(filePath, changeType) {
    try {
      const index = await indexStore.getIndex();
      if (!index) {
        return;
      }

      const ext = path.extname(filePath);
      if (!indexGenerator.isAllowedExtension(ext) && changeType !== 'unlink') {
        return;
      }

      if (changeType === 'unlink') {
        const fileId = Buffer.from(filePath).toString('base64');
        index.files = index.files.filter(f => f.id !== fileId);
        index.filesIndexed = index.files.length;
      } else {
        const fileIndex = await indexGenerator.indexFile(filePath);
        if (fileIndex) {
          const existingIndex = index.files.findIndex(f => f.id === fileIndex.id);
          if (existingIndex >= 0) {
            index.files[existingIndex] = fileIndex;
          } else {
            index.files.push(fileIndex);
            index.filesIndexed = index.files.length;
          }
        }
      }

      index.indexedAt = new Date().toISOString();
      await indexStore.saveIndex(index);
      
      console.log(`索引已更新 (${changeType}): ${filePath}`);
    } catch (error) {
      console.error('处理文件变化失败:', error);
    }
  }

  async updatePartial(directory) {
    const index = await indexStore.getIndex();
    if (!index) {
      return { success: false, error: '索引不存在，请先生成全量索引' };
    }

    const { files } = await indexGenerator.scanDirectory(directory);
    
    for (const filePath of files) {
      const fileIndex = await indexGenerator.indexFile(filePath);
      if (fileIndex) {
        const existingIndex = index.files.findIndex(f => f.id === fileIndex.id);
        if (existingIndex >= 0) {
          const existingModified = new Date(index.files[existingIndex].modifiedTime);
          const newModified = new Date(fileIndex.modifiedTime);
          
          if (newModified > existingModified) {
            index.files[existingIndex] = fileIndex;
          }
        } else {
          index.files.push(fileIndex);
          index.filesIndexed = index.files.length;
        }
      }
    }

    index.indexedAt = new Date().toISOString();
    await indexStore.saveIndex(index);

    return {
      success: true,
      message: '部分更新完成',
      indexedAt: index.indexedAt,
      filesIndexed: index.filesIndexed,
    };
  }
}

module.exports = new IndexUpdater();
