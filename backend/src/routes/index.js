const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const indexGenerator = require('../utils/indexGenerator');
const indexStore = require('../utils/indexStore');
const searchEngine = require('../utils/searchEngine');
const indexUpdater = require('../utils/indexUpdater');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/index/status', async (req, res) => {
  try {
    const exists = await indexStore.indexExists();
    const stats = await indexStore.getIndexStats();
    const watching = indexUpdater.isWatching();
    const watchedDir = indexUpdater.getWatchedDirectory();

    res.json({
      success: true,
      indexExists: exists,
      stats: stats,
      watching: watching,
      watchedDirectory: watchedDir,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/index/generate', async (req, res) => {
  try {
    const { directory } = req.body;
    console.log('收到生成索引请求，目录:', directory);

    if (!directory) {
      return res.status(400).json({
        success: false,
        error: '请提供目录路径',
      });
    }

    let directoryExists;
    try {
      directoryExists = await fs.pathExists(directory);
    } catch (checkError) {
      console.error('检查目录存在性失败:', checkError);
      return res.status(500).json({
        success: false,
        error: '无法访问目录: ' + checkError.message,
      });
    }

    if (!directoryExists) {
      return res.status(400).json({
        success: false,
        error: `目录不存在: ${directory}`,
      });
    }

    let stats;
    try {
      stats = await fs.stat(directory);
    } catch (statError) {
      console.error('获取目录状态失败:', statError);
      return res.status(500).json({
        success: false,
        error: '无法读取目录信息: ' + statError.message,
      });
    }

    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: `路径不是目录: ${directory}`,
      });
    }

    console.log('开始生成索引...');
    let progressData = null;

    let indexData;
    try {
      indexData = await indexGenerator.generateIndex(directory, (progress) => {
        progressData = progress;
        if (progress.percentage % 10 === 0) {
          console.log(`索引进度: ${progress.percentage}% (${progress.processed}/${progress.total})`);
        }
      });
    } catch (genError) {
      console.error('生成索引过程中出错:', genError);
      return res.status(500).json({
        success: false,
        error: '生成索引失败: ' + genError.message,
      });
    }

    console.log('索引生成完成，正在保存...');

    try {
      await indexStore.saveIndex(indexData);
    } catch (saveError) {
      console.error('保存索引失败:', saveError);
      return res.status(500).json({
        success: false,
        error: '保存索引失败: ' + saveError.message,
      });
    }

    console.log('索引保存成功!');
    console.log(`已索引: ${indexData.filesIndexed} 个文件，跳过: ${indexData.filesSkipped} 个文件`);

    res.json({
      success: true,
      message: '索引生成完成',
      indexInfo: {
        rootDirectory: indexData.rootDirectory,
        indexedAt: indexData.indexedAt,
        duration: indexData.duration,
        totalFilesScanned: indexData.totalFilesScanned,
        filesIndexed: indexData.filesIndexed,
        filesSkipped: indexData.filesSkipped,
      },
    });
  } catch (error) {
    console.error('生成索引失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || '未知错误',
    });
  }
});

router.post('/index/clear', async (req, res) => {
  try {
    await indexStore.clearIndex();
    
    res.json({
      success: true,
      message: '索引已清除',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/index/watch/start', async (req, res) => {
  try {
    const { directory } = req.body;

    if (!directory) {
      const index = await indexStore.getIndex();
      if (index) {
        const result = await indexUpdater.startWatching(index.rootDirectory);
        return res.json(result);
      }
      
      return res.status(400).json({
        success: false,
        error: '请提供目录路径或先生成索引',
      });
    }

    const directoryExists = await fs.pathExists(directory);
    if (!directoryExists) {
      return res.status(400).json({
        success: false,
        error: `目录不存在: ${directory}`,
      });
    }

    const result = await indexUpdater.startWatching(directory);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/index/watch/stop', async (req, res) => {
  try {
    const result = indexUpdater.stopWatching();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query, limit, offset, sortBy } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索词',
      });
    }

    const options = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      sortBy: sortBy || 'relevance',
    };

    const result = await searchEngine.search(query, options);
    res.json(result);
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/file/open', async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '请提供文件路径',
      });
    }

    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        error: `文件不存在: ${filePath}`,
      });
    }

    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({
        success: false,
        error: `路径不是文件: ${filePath}`,
      });
    }

    const { exec } = require('child_process');
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
      command = `open "${filePath}"`;
    } else if (platform === 'win32') {
      command = `start "" "${filePath}"`;
    } else {
      command = `xdg-open "${filePath}"`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('打开文件失败:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
      
      res.json({
        success: true,
        message: `文件已打开: ${filePath}`,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
