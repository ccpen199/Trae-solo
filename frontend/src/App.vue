<template>
  <div class="container">
    <header class="header">
      <h1>简易搜索引擎</h1>
      <p>快速索引和搜索您的文件</p>
    </header>

    <div class="card">
      <h3>索引管理</h3>
      
      <div v-if="indexStatus">
        <div v-if="indexStatus.stats" class="index-stats">
          <div class="stat-item">
            <div class="stat-value">{{ indexStatus.stats.filesIndexed }}</div>
            <div class="stat-label">已索引文件</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ indexStatus.stats.filesSkipped }}</div>
            <div class="stat-label">跳过文件</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ indexStatus.watching ? '是' : '否' }}</div>
            <div class="stat-label">自动监听</div>
          </div>
        </div>
        
        <div v-if="indexStatus.stats" class="status status-info">
          索引目录: {{ indexStatus.stats.rootDirectory }}<br>
          索引时间: {{ formatDate(indexStatus.stats.indexedAt) }}<br>
          耗时: {{ indexStatus.stats.duration }}ms
        </div>
      </div>

      <div class="form-group">
        <label>目录路径</label>
        <input 
          type="text" 
          v-model="directoryPath" 
          placeholder="请输入要索引的目录路径，例如: /Users/xxx/Documents"
          @keyup.enter="handleGenerateIndex"
        />
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button 
          class="btn btn-success" 
          @click="handleGenerateIndex"
          :disabled="isGenerating || !directoryPath"
        >
          {{ isGenerating ? '生成中...' : '生成索引' }}
        </button>
        
        <button 
          class="btn btn-secondary" 
          @click="handleClearIndex"
          :disabled="isGenerating"
        >
          清除索引
        </button>

        <button 
          class="btn" 
          @click="handleStartWatching"
          :disabled="isGenerating || indexStatus.watching"
          v-if="indexStatus.indexExists"
        >
          启动监听
        </button>

        <button 
          class="btn btn-danger" 
          @click="handleStopWatching"
          :disabled="isGenerating || !indexStatus.watching"
          v-if="indexStatus.watching"
        >
          停止监听
        </button>

        <button 
          class="btn btn-secondary" 
          @click="handleRefreshStatus"
        >
          刷新状态
        </button>
      </div>

      <div v-if="statusMessage" :class="['status', statusType]">
        {{ statusMessage }}
      </div>
    </div>

    <div class="card">
      <h3>文件搜索</h3>
      
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="输入关键词搜索文件..."
          @keyup.enter="handleSearch"
        />
        <button 
          class="btn" 
          @click="handleSearch"
          :disabled="isSearching || !searchQuery.trim()"
        >
          {{ isSearching ? '搜索中...' : '搜索' }}
        </button>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <select v-model="sortBy" class="form-control" style="padding: 8px;">
          <option value="relevance">按相关性排序</option>
          <option value="name">按名称排序</option>
          <option value="date">按日期排序</option>
          <option value="size">按大小排序</option>
        </select>
      </div>

      <div v-if="searchResults.total > 0" class="results-count">
        找到 {{ searchResults.total }} 个结果
        <span v-if="searchQuery"> (搜索词: "{{ searchQuery }}")</span>
      </div>

      <div v-if="hasSearched && searchResults.results.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p v-if="!indexStatus.indexExists">请先生成索引</p>
        <p v-else>未找到匹配的文件</p>
      </div>

      <div v-if="searchResults.results.length > 0">
        <div 
          v-for="result in searchResults.results" 
          :key="result.id" 
          class="result-item"
          @click="handleOpenFile(result.path)"
        >
          <div class="result-title">{{ result.filename }}</div>
          <div class="result-path">{{ result.path }}</div>
          <div class="result-meta">
            <span>评分: {{ result.score }}</span>
            <span>大小: {{ formatSize(result.size) }}</span>
            <span>修改时间: {{ formatDate(result.modifiedTime) }}</span>
          </div>
          <div 
            v-for="(highlight, idx) in result.highlights" 
            :key="idx"
            class="result-highlight"
            v-html="highlight.snippet"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  getIndexStatus, 
  generateIndex, 
  clearIndex, 
  startWatching, 
  stopWatching,
  search,
  openFile
} from './api';

export default {
  name: 'App',
  data() {
    return {
      directoryPath: '',
      searchQuery: '',
      sortBy: 'relevance',
      isGenerating: false,
      isSearching: false,
      hasSearched: false,
      statusMessage: '',
      statusType: 'status-info',
      indexStatus: {
        indexExists: false,
        stats: null,
        watching: false,
        watchedDirectory: null,
      },
      searchResults: {
        total: 0,
        results: [],
      },
    };
  },
  mounted() {
    this.handleRefreshStatus();
  },
  methods: {
    async handleRefreshStatus() {
      try {
        const response = await getIndexStatus();
        this.indexStatus = response.data;
        
        if (this.indexStatus.stats && this.indexStatus.stats.rootDirectory) {
          this.directoryPath = this.indexStatus.stats.rootDirectory;
        }
      } catch (error) {
        console.error('获取索引状态失败:', error);
      }
    },

    async handleGenerateIndex() {
      if (!this.directoryPath.trim()) {
        this.setStatus('请输入目录路径', 'status-error');
        return;
      }

      this.isGenerating = true;
      this.setStatus('正在生成索引，请稍候...', 'status-info');

      try {
        const response = await generateIndex(this.directoryPath.trim());
        
        if (response.data.success) {
          this.setStatus(
            `索引生成完成！已索引 ${response.data.indexInfo.filesIndexed} 个文件，耗时 ${response.data.indexInfo.duration}ms`,
            'status-success'
          );
          await this.handleRefreshStatus();
        } else {
          this.setStatus(response.data.error || '生成索引失败', 'status-error');
        }
      } catch (error) {
        const msg = error.response?.data?.error || error.message || '生成索引失败';
        this.setStatus(msg, 'status-error');
      } finally {
        this.isGenerating = false;
      }
    },

    async handleClearIndex() {
      this.isGenerating = true;
      try {
        const response = await clearIndex();
        if (response.data.success) {
          this.setStatus('索引已清除', 'status-success');
          await this.handleRefreshStatus();
          this.searchResults = { total: 0, results: [] };
          this.hasSearched = false;
        }
      } catch (error) {
        this.setStatus('清除索引失败', 'status-error');
      } finally {
        this.isGenerating = false;
      }
    },

    async handleStartWatching() {
      try {
        const response = await startWatching(this.directoryPath || undefined);
        if (response.data.success) {
          this.setStatus(response.data.message, 'status-success');
          await this.handleRefreshStatus();
        }
      } catch (error) {
        this.setStatus(error.response?.data?.error || '启动监听失败', 'status-error');
      }
    },

    async handleStopWatching() {
      try {
        const response = await stopWatching();
        if (response.data.success) {
          this.setStatus(response.data.message, 'status-success');
          await this.handleRefreshStatus();
        }
      } catch (error) {
        this.setStatus('停止监听失败', 'status-error');
      }
    },

    async handleSearch() {
      if (!this.searchQuery.trim()) {
        return;
      }

      if (!this.indexStatus.indexExists) {
        this.setStatus('请先生成索引', 'status-warning');
        return;
      }

      this.isSearching = true;
      this.hasSearched = true;

      try {
        const response = await search(this.searchQuery.trim(), {
          sortBy: this.sortBy,
          limit: 50,
        });

        if (response.data.success) {
          this.searchResults = {
            total: response.data.total,
            results: response.data.results,
          };
          
          if (response.data.results.length === 0) {
            this.setStatus('未找到匹配的文件', 'status-warning');
          } else {
            this.setStatus(`找到 ${response.data.total} 个结果`, 'status-info');
          }
        } else {
          this.setStatus(response.data.error || '搜索失败', 'status-error');
          this.searchResults = { total: 0, results: [] };
        }
      } catch (error) {
        const msg = error.response?.data?.error || error.message || '搜索失败';
        this.setStatus(msg, 'status-error');
        this.searchResults = { total: 0, results: [] };
      } finally {
        this.isSearching = false;
      }
    },

    async handleOpenFile(filePath) {
      try {
        const response = await openFile(filePath);
        if (response.data.success) {
          this.setStatus(`正在打开: ${filePath}`, 'status-info');
        }
      } catch (error) {
        this.setStatus(error.response?.data?.error || '打开文件失败', 'status-error');
      }
    },

    setStatus(message, type) {
      this.statusMessage = message;
      this.statusType = type;
      
      if (type === 'status-success' || type === 'status-info') {
        setTimeout(() => {
          this.statusMessage = '';
        }, 5000);
      }
    },

    formatSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
  watch: {
    sortBy() {
      if (this.searchQuery && this.hasSearched) {
        this.handleSearch();
      }
    },
  },
};
</script>
