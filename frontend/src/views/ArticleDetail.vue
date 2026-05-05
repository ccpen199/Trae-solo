<template>
  <div class="article-detail-page">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/home')">
          <el-icon :size="28"><ChatDotRound /></el-icon>
          <span>BBS论坛</span>
        </div>
        <div class="header-right">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>
    </el-header>
    
    <el-main class="main">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-card class="article-card" v-loading="loading">
            <div v-if="article" class="article-content">
              <div class="article-header">
                <h1 class="article-title">
                  <el-tag v-if="article.isTop" type="danger" effect="light" size="small">置顶</el-tag>
                  <el-tag v-if="article.isLocked" type="warning" effect="light" size="small">锁定</el-tag>
                  {{ article.title }}
                </h1>
                
                <div class="article-info">
                  <div class="info-left">
                    <el-avatar :size="40" class="author-avatar">
                      {{ article.authorNickname?.charAt(0) || article.authorName?.charAt(0) }}
                    </el-avatar>
                    <div class="author-info">
                      <span class="author-name">{{ article.authorNickname || article.authorName }}</span>
                      <span class="publish-time">
                        <el-icon><Clock /></el-icon>
                        发布于 {{ formatTime(article.createdAt) }}
                      </span>
                    </div>
                  </div>
                  <div class="info-right">
                    <el-tag v-if="article.categoryName" type="info" size="small">
                      {{ article.categoryName }}
                    </el-tag>
                    <el-tag v-if="article.subCategoryName" type="success" size="small">
                      {{ article.subCategoryName }}
                    </el-tag>
                    <span class="view-count">
                      <el-icon><View /></el-icon>
                      {{ article.viewCount }} 浏览
                    </span>
                  </div>
                </div>
                
                <div class="article-actions" v-if="userStore.isLoggedIn && !article.isLocked">
                  <el-button 
                    v-if="canEdit" 
                    type="primary" 
                    size="small"
                    @click="handleEdit"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button 
                    v-if="canDelete" 
                    type="danger" 
                    size="small"
                    @click="handleDelete"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
              
              <el-divider />
              
              <div class="article-body" v-html="article.content">
              </div>
              
              <el-divider v-if="article.updatedAt && article.updatedAt !== article.createdAt" />
              
              <div class="article-footer" v-if="article.updatedAt && article.updatedAt !== article.createdAt">
                <el-text type="info">
                  最后编辑于 {{ formatTime(article.updatedAt) }}
                </el-text>
              </div>
            </div>
            
            <el-empty v-else description="文章不存在或已被删除" />
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="side-card">
            <template #header>
              <div class="side-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>帖子信息</span>
              </div>
            </template>
            <div class="info-list" v-if="article">
              <div class="info-item">
                <span class="info-label">作者</span>
                <span class="info-value">{{ article.authorNickname || article.authorName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">分类</span>
                <span class="info-value">{{ article.categoryName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">子分类</span>
                <span class="info-value">{{ article.subCategoryName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">浏览量</span>
                <span class="info-value">{{ article.viewCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态</span>
                <span class="info-value">
                  <el-tag :type="article.isLocked ? 'warning' : 'success'" size="small">
                    {{ article.isLocked ? '已锁定' : '正常' }}
                  </el-tag>
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getPublicArticle, deleteArticle } from '@/api/article'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const article = ref(null)

const canEdit = computed(() => {
  if (!userStore.isLoggedIn || !article.value) return false
  const isOwner = article.value.userId === userStore.userInfo?.id
  const isAdmin = userStore.userInfo?.roles?.some(r => 
    ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r)
  )
  return isOwner || isAdmin
})

const canDelete = computed(() => {
  if (!userStore.isLoggedIn || !article.value) return false
  const isOwner = article.value.userId === userStore.userInfo?.id
  const isAdmin = userStore.userInfo?.roles?.some(r => 
    ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r)
  )
  return isOwner || isAdmin
})

const loadArticle = async () => {
  const id = route.params.id
  if (!id) {
    router.push('/home')
    return
  }
  
  loading.value = true
  try {
    const res = await getPublicArticle(id)
    article.value = res.data
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleEdit = () => {
  router.push(`/edit/${article.value.id}`)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇帖子吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteArticle(article.value.id)
    ElMessage.success('删除成功')
    router.push('/home')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
.article-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 60px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
  flex: 1;
}

.article-card, .side-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.article-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.5;
}

.article-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-weight: 500;
  color: #303133;
}

.publish-time {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-right {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.view-count {
  font-size: 14px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #e4e7ed;
}

.article-body {
  font-size: 16px;
  line-height: 2;
  color: #303133;
  word-break: break-word;
}

.article-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.article-footer {
  text-align: right;
}

.side-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #303133;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}
</style>
