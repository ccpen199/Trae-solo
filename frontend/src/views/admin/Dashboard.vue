<template>
  <div class="dashboard-page">
    <h2 class="page-title">数据概览</h2>
    
    <el-skeleton v-if="loading" animated />
    
    <template v-else-if="error">
      <el-alert :title="error" type="error" show-icon>
        <template #default>
          <el-button type="primary" size="small" @click="fetchStats">重试</el-button>
        </template>
      </el-alert>
    </template>
    
    <template v-else>
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon product-bar">
              <el-icon><Collection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.bars || 0 }}</div>
              <div class="stat-label">产品吧总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon entry">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.entries || 0 }}</div>
              <div class="stat-label">词条总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon user">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.users || 0 }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon owner">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.owners || 0 }}</div>
              <div class="stat-label">吧主数量</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近创建的产品吧</span>
            </template>
            <el-table :data="stats.recentBars || []" v-if="stats.recentBars?.length > 0">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="created_at" label="创建时间">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无数据" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>快速操作</span>
            </template>
            <div class="quick-actions">
              <el-button type="primary" @click="router.push('/admin/bars')">
                <el-icon><Collection /></el-icon>
                产品吧管理
              </el-button>
              <el-button type="success" @click="router.push('/admin/entries')">
                <el-icon><Document /></el-icon>
                词条管理
              </el-button>
              <el-button type="warning" @click="router.push('/admin/owners')">
                <el-icon><User /></el-icon>
                吧主管理
              </el-button>
              <el-button type="info" @click="router.push('/admin/categories')">
                <el-icon><Menu /></el-icon>
                分类管理
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { adminApi } from '@/api/admin'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const stats = ref({})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchStats = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await adminApi.getStats()
    stats.value = res?.data || {}
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.page-title {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.product-bar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.entry { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.user { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.owner { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button {
  justify-content: flex-start;
  padding: 12px 20px;
  height: auto;
}
</style>
