const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

class IndexStore {
  constructor() {
    this.storagePath = path.resolve(config.indexStoragePath);
    this.currentIndex = null;
    this._ensureStorageDir();
  }

  _ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.ensureDirSync(dir);
    }
  }

  async saveIndex(indexData) {
    try {
      await fs.writeJson(this.storagePath, indexData, { spaces: 2 });
      this.currentIndex = indexData;
      return true;
    } catch (error) {
      console.error('保存索引失败:', error.message);
      return false;
    }
  }

  async loadIndex() {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return null;
      }
      
      const indexData = await fs.readJson(this.storagePath);
      this.currentIndex = indexData;
      return indexData;
    } catch (error) {
      console.error('加载索引失败:', error.message);
      return null;
    }
  }

  async getIndex() {
    if (!this.currentIndex) {
      await this.loadIndex();
    }
    return this.currentIndex;
  }

  async clearIndex() {
    try {
      if (fs.existsSync(this.storagePath)) {
        await fs.unlink(this.storagePath);
      }
      this.currentIndex = null;
      return true;
    } catch (error) {
      console.error('清除索引失败:', error.message);
      return false;
    }
  }

  async indexExists() {
    return fs.existsSync(this.storagePath);
  }

  async getIndexStats() {
    const index = await this.getIndex();
    if (!index) {
      return null;
    }

    const extensionCounts = {};
    index.files.forEach(file => {
      const ext = file.extension || 'no-extension';
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    });

    return {
      rootDirectory: index.rootDirectory,
      indexedAt: index.indexedAt,
      duration: index.duration,
      totalFilesScanned: index.totalFilesScanned,
      filesIndexed: index.filesIndexed,
      filesSkipped: index.filesSkipped,
      extensionCounts: extensionCounts,
    };
  }
}

module.exports = new IndexStore();
