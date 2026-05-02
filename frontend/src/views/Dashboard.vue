<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalDocuments || 0 }}</div>
              <div class="stat-label">文档总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.published || 0 }}</div>
              <div class="stat-label">已发布</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingReview || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon red">
              <el-icon size="32"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.myTodoCount || 0 }}</div>
              <div class="stat-label">待办事项</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>最近文档</span>
            <el-button type="primary" link style="float: right" @click="$router.push('/documents')">
              查看全部
            </el-button>
          </template>
          <el-table :data="stats.recentDocuments" style="width: 100%" @row-click="goToDocument">
            <el-table-column prop="main_order_no" label="单号" width="160" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="creator_name" label="创建人" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>流程概览</span>
          </template>
          <el-steps direction="vertical" :active="currentStep">
            <el-step title="创建文档" :description="`${stats.pendingCreation || 0} 个`" />
            <el-step title="分类审核" :description="`${stats.pendingReview || 0} 个`" />
            <el-step title="发布" :description="`${stats.published || 0} 个`" />
            <el-step title="搜索使用" :description="`${stats.pendingUse || 0} 个`" />
            <el-step title="更新迭代" :description="`${stats.pendingUpdate || 0} 个`" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="4">
              <el-button type="primary" size="large" style="width: 100%" @click="$router.push('/documents/create')">
                <el-icon><DocumentAdd /></el-icon>
                创建文档
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button type="success" size="large" style="width: 100%" @click="$router.push('/search')">
                <el-icon><Search /></el-icon>
                搜索文档
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button type="warning" size="large" style="width: 100%" @click="$router.push('/todos')">
                <el-icon><Bell /></el-icon>
                待办事项
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button type="info" size="large" style="width: 100%" @click="$router.push('/documents')">
                <el-icon><FolderOpened /></el-icon>
                文档列表
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { statsApi } from '@/api'

const router = useRouter()
const stats = ref({})
const currentStep = ref(0)

const getStatusType = (status) => {
  const types = {
    pending_creation: 'info',
    pending_review: 'warning',
    published: 'success',
    pending_use: '',
    pending_update: 'warning'
  }
  return types[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    pending_creation: '待创建',
    pending_review: '待审核',
    published: '已发布',
    pending_use: '待使用',
    pending_update: '待更新'
  }
  return labels[status] || status
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const goToDocument = (row) => {
  router.push(`/documents/${row.id}`)
}

const loadStats = async () => {
  try {
    const res = await statsApi.dashboard()
    stats.value = res.data
    if (stats.value.pendingUpdate > 0) currentStep.value = 4
    else if (stats.value.pendingUse > 0) currentStep.value = 3
    else if (stats.value.published > 0) currentStep.value = 2
    else if (stats.value.pendingReview > 0) currentStep.value = 1
    else currentStep.value = 0
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
</style>
