<template>
  <div class="stats-page">
    <h2 class="page-title">数据统计</h2>
    
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #409eff;">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total_users || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #67c23a;">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total_bars || 0 }}</div>
          <div class="stat-label">活跃产品吧</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #e6a23c;">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total_posts || 0 }}</div>
          <div class="stat-label">已发布帖子</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f56c6c;">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending_reviews || 0 }}</div>
          <div class="stat-label">待审核内容</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #909399;">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending_reports || 0 }}</div>
          <div class="stat-label">待处理举报</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #f56c6c;">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending_bars || 0 }}</div>
          <div class="stat-label">待审核产品吧</div>
        </div>
      </el-card>
    </div>
    
    <div class="quick-actions">
      <el-card>
        <template #header>
          <span>快捷操作</span>
        </template>
        <div class="actions">
          <el-button type="primary" @click="$router.push('/operator/reviews')">
            去审核内容
          </el-button>
          <el-button type="warning" @click="$router.push('/operator/reports')">
            去处理举报
          </el-button>
          <el-button @click="$router.push('/operator/blacklist')">
            管理敏感词
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, Collection, Document, Clock, Warning } from '@element-plus/icons-vue'
import api from '@/utils/api'

const stats = ref({})

async function loadStats() {
  try {
    const res = await api.get('/operator/stats')
    if (res.success) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-page {
  min-height: 100%;
}

.page-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.quick-actions .actions {
  display: flex;
  gap: 12px;
}
</style>
