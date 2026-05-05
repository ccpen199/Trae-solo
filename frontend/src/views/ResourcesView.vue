<template>
  <div class="page-container resources-page">
    <div class="filter-bar">
      <div class="filter-tabs">
        <el-radio-group v-model="resourceType" @change="handleTypeChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="video">精彩视频</el-radio-button>
          <el-radio-button value="document">文档课件</el-radio-button>
          <el-radio-button value="software">常用软件</el-radio-button>
        </el-radio-group>
      </div>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索资源..."
        prefix-icon="Search"
        style="width: 280px"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <div class="section-header">
      <h2>学习资源</h2>
      <span class="total-count">共 {{ total }} 个资源</span>
    </div>

    <el-empty v-if="resources.length === 0 && !loading" description="暂无资源" />

    <div v-else class="resource-grid">
      <el-card
        v-for="resource in resources"
        :key="resource.id"
        shadow="hover"
        class="resource-card"
      >
        <div class="resource-icon">
          <el-icon :size="48" :color="getIconColor(resource.type)">
            <VideoCamera v-if="resource.type === 'video'" />
            <Document v-else-if="resource.type === 'document'" />
            <Box v-else />
          </el-icon>
        </div>
        <div class="resource-content">
          <h3 class="resource-title">{{ resource.title }}</h3>
          <p class="resource-desc">{{ resource.description?.slice(0, 60) }}...</p>
          <div class="resource-meta">
            <span class="resource-type">{{ getTypeLabel(resource.type) }}</span>
            <span class="download-count">
              <el-icon><Download /></el-icon>
              {{ resource.downloadCount }} 次下载
            </span>
          </div>
          <div class="resource-footer">
            <el-tag :type="getAccessTagType(resource.accessLevel)">
              {{ getAccessLabel(resource.accessLevel) }}
            </el-tag>
            <el-button type="primary" link @click="handleDownload(resource)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchResources"
        @current-change="fetchResources"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'

const route = useRoute()
const userStore = useUserStore()

const resources = ref<any[]>([])
const loading = ref(false)
const resourceType = ref('')
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const getIconColor = (type: string) => {
  const colors: Record<string, string> = {
    video: '#409EFF',
    document: '#67C23A',
    software: '#E6A23C'
  }
  return colors[type] || '#909399'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    video: '视频',
    document: '文档',
    software: '软件'
  }
  return labels[type] || '资源'
}

const getAccessLabel = (level: string) => {
  const labels: Record<string, string> = {
    public: '公开',
    login_required: '登录可见',
    vip_only: 'VIP专属',
    teacher_only: '教师专属'
  }
  return labels[level] || '公开'
}

const getAccessTagType = (level: string) => {
  const types: Record<string, string> = {
    public: 'success',
    login_required: 'info',
    vip_only: 'warning',
    teacher_only: 'danger'
  }
  return types[level] || 'info'
}

const fetchResources = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value
    }

    if (resourceType.value) {
      params.type = resourceType.value
    }

    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const response = await api.get('/resources', { params })
    if (response.data.success) {
      const data = response.data.data
      resources.value = data.list || []
      total.value = data.total || 0
    }
  } catch (error) {
    console.error('获取资源列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTypeChange = () => {
  page.value = 1
  fetchResources()
}

const handleSearch = () => {
  page.value = 1
  fetchResources()
}

const handleDownload = async (resource: any) => {
  if (!userStore.isLoggedIn && resource.accessLevel !== 'public') {
    ElMessage.warning('请先登录后下载')
    return
  }

  if (resource.accessLevel === 'teacher_only' && 
      userStore.user?.role !== 'teacher' && 
      userStore.user?.role !== 'admin') {
    ElMessage.warning('该资源仅教师可下载')
    return
  }

  try {
    const response = await api.post(`/resources/${resource.id}/download`)
    if (response.data.success) {
      ElMessage.success('开始下载...')
    }
  } catch (error) {
    console.error('下载失败:', error)
  }
}

onMounted(() => {
  const type = route.query.type as string
  if (type) {
    resourceType.value = type
  }
  fetchResources()
})
</script>

<style lang="scss">
.resources-page {
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      margin: 0;
    }

    .total-count {
      color: #909399;
      font-size: 14px;
    }
  }

  .resource-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }

  .resource-card {
    display: flex;
    gap: 16px;

    .resource-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .resource-content {
      flex: 1;
      display: flex;
      flex-direction: column;

      .resource-title {
        font-size: 16px;
        margin: 0 0 8px;
        color: #303133;
        cursor: pointer;

        &:hover {
          color: #409EFF;
        }
      }

      .resource-desc {
        font-size: 13px;
        color: #909399;
        margin: 0 0 12px;
        line-height: 1.5;
      }

      .resource-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
        font-size: 12px;

        .resource-type {
          color: #409EFF;
          background: #ecf5ff;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .download-count {
          color: #909399;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .resource-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
      }
    }
  }

  .pagination-container {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}
</style>
