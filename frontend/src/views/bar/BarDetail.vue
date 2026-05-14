<template>
  <div class="bar-detail-page">
    <el-skeleton v-if="loading" animated />
    
    <template v-else-if="error">
      <div class="error-page">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <h2>加载失败</h2>
        <p>{{ error }}</p>
        <el-button type="primary" @click="fetchDetail">重试</el-button>
        <el-button @click="router.back()">返回</el-button>
      </div>
    </template>
    
    <template v-else-if="!bar">
      <div class="error-page">
        <el-empty description="产品吧不存在" />
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </div>
    </template>
    
    <template v-else>
      <header class="bar-header">
        <div class="container">
          <div class="bar-back">
            <el-button type="text" @click="router.back()">
              <el-icon><ArrowLeft /></el-icon> 返回
            </el-button>
          </div>
          <div class="bar-header-content">
            <div class="bar-cover">
              <img v-if="bar.cover_image" :src="bar.cover_image" :alt="bar.name" />
              <div v-else class="bar-cover-placeholder">
                <el-icon><Collection /></el-icon>
              </div>
            </div>
            <div class="bar-header-info">
              <h1>{{ bar.name }}</h1>
              <p class="bar-desc">{{ bar.description || '暂无描述' }}</p>
              <div class="bar-meta">
                <span>浏览 {{ bar.view_count || 0 }}</span>
                <span v-if="bar.category_name">分类: {{ bar.category_name }}</span>
                <span v-if="bar.leaf_node_name">叶子节点: {{ bar.leaf_node_name }}</span>
              </div>
            </div>
          </div>
          
          <div class="bar-owners" v-if="owners && owners.length > 0">
            <h4>吧主</h4>
            <div class="owners-list">
              <div v-for="owner in owners" :key="owner.id" class="owner-item">
                <el-avatar :size="36" :src="owner.avatar">
                  {{ owner.nickname?.charAt(0) || owner.username?.charAt(0) }}
                </el-avatar>
                <span>{{ owner.nickname || owner.username }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="main-content">
        <div class="container">
          <div class="content-layout">
            <div class="entries-section">
              <h3>词条列表</h3>
              
              <div v-if="!entries || entries.length === 0" class="empty-section">
                <el-empty description="暂无词条" />
              </div>
              
              <div v-else class="entries-list">
                <div
                  v-for="entry in entries"
                  :key="entry.id"
                  class="entry-item"
                  @click="goToEntry(entry.id)"
                >
                  <div class="entry-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="entry-info">
                    <h4 class="entry-title">{{ entry.title }}</h4>
                    <p class="entry-preview text-ellipsis">
                      {{ entry.content || '查看详细内容' }}
                    </p>
                    <div class="entry-meta">
                      <span>{{ entry.content_count || 0 }} 项内容</span>
                      <span>类型: {{ entry.entry_type === 'text' ? '文字' : entry.entry_type }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { barApi } from '@/api/bar'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const bar = ref(null)
const entries = ref([])
const owners = ref([])

const fetchDetail = async () => {
  const id = route.params.id
  if (!id) {
    error.value = '产品吧ID无效'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await barApi.getDetail(id)
    const data = res?.data || {}
    bar.value = data
    entries.value = data.entries || []
    owners.value = data.owners || []
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const goToEntry = (id) => {
  router.push(`/entry/${id}`)
}

onMounted(() => {
  fetchDetail()
})

watch(
  () => route.params.id,
  () => {
    fetchDetail()
  }
)
</script>

<style scoped>
.bar-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
}

.bar-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0 40px 0;
  color: #fff;
}

.bar-back {
  margin-bottom: 20px;
}

.bar-back :deep(.el-button) {
  color: #fff;
  padding-left: 0;
}

.bar-header-content {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.bar-cover {
  width: 160px;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-cover-placeholder {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.5);
}

.bar-header-info h1 {
  margin: 0 0 12px 0;
  font-size: 28px;
}

.bar-desc {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.bar-meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.bar-owners {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.bar-owners h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
}

.owners-list {
  display: flex;
  gap: 16px;
}

.owner-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.main-content {
  padding: 24px 0;
}

.content-layout {
  display: flex;
  gap: 24px;
}

.entries-section {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.entries-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.empty-section {
  padding: 40px 0;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.entry-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.entry-icon {
  width: 48px;
  height: 48px;
  background: #ecf5ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409eff;
  flex-shrink: 0;
}

.entry-info {
  flex: 1;
  min-width: 0;
}

.entry-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.entry-preview {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #909399;
}

.entry-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
