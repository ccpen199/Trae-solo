<template>
  <div class="my-bars-page">
    <div class="container">
      <div class="page-header">
        <h1>我的产品吧</h1>
        <router-link to="/bars/create">
          <el-button type="primary">创建产品吧</el-button>
        </router-link>
      </div>
      
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="bars.length === 0" class="page-empty">
        <el-empty description="你还没有加入任何产品吧">
          <router-link to="/bars">
            <el-button type="primary">浏览产品吧</el-button>
          </router-link>
        </el-empty>
      </div>
      
      <div v-else class="bar-list">
        <div
          v-for="bar in bars"
          :key="bar.id"
          class="bar-card"
          @click="goToBar(bar.id)"
        >
          <div class="bar-cover">
            <img :src="bar.cover_image || bar.product_cover || defaultCover" />
          </div>
          <div class="bar-info">
            <div class="bar-title-row">
              <h3>{{ bar.name }}</h3>
              <el-tag :type="statusTagType(bar.status)" size="small">{{ statusText(bar.status) }}</el-tag>
            </div>
            <p class="bar-desc">{{ bar.description || '暂无描述' }}</p>
            <div class="bar-stats">
              <span>成员: {{ bar.member_count || 0 }}</span>
              <span>帖子: {{ bar.post_count || 0 }}</span>
              <span>浏览: {{ bar.view_count || 0 }}</span>
              <span v-if="bar.member_role">角色: {{ roleText(bar.member_role) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(true)
const bars = ref([])

const defaultCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"%3E%3Crect fill="%23f0f2f5" width="200" height="120"/%3E%3C/text%3E%3C/svg%3E'

function statusText(status) {
  const map = {
    draft: '草稿',
    pending: '审核中',
    active: '活跃',
    rejected: '已拒绝',
    closed: '已关闭'
  }
  return map[status] || '未知'
}

function statusTagType(status) {
  const map = {
    draft: 'info',
    pending: 'warning',
    active: 'success',
    rejected: 'danger',
    closed: 'info'
  }
  return map[status] || ''
}

function roleText(role) {
  const map = {
    owner: '吧主',
    moderator: '管理员',
    member: '成员'
  }
  return map[role] || role
}

async function loadBars() {
  loading.value = true
  try {
    const res = await api.get('/product-bars/my')
    if (res.success) {
      bars.value = res.data || []
    }
  } catch (e) {
    console.error('加载我的产品吧失败:', e)
  } finally {
    loading.value = false
  }
}

function goToBar(id) {
  router.push(`/bars/${id}`)
}

onMounted(() => {
  loadBars()
})
</script>

<style scoped>
.my-bars-page {
  padding: 30px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin: 0;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-card {
  display: flex;
  gap: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
}

.bar-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.bar-cover {
  width: 160px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f7fa;
}

.bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-info {
  flex: 1;
  min-width: 0;
}

.bar-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.bar-title-row h3 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.bar-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.bar-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
}
</style>
