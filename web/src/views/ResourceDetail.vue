<template>
  <div class="resource-detail-page">
    <div class="container">
      <el-skeleton :loading="loading" animated>
        <template #default>
          <div class="content-layout">
            <div class="main-content">
              <div class="resource-header">
                <h1 class="resource-title">{{ resource.title }}</h1>
                <div class="resource-meta">
                  <div class="author-info" @click="$router.push(`/users/${resource.author?.id}`)">
                    <el-avatar :size="36">
                      <img v-if="resource.author?.avatar" :src="resource.author.avatar" />
                      <el-icon v-else><User /></el-icon>
                    </el-avatar>
                    <div class="author-text">
                      <span class="author-name">{{ resource.author?.nickname || resource.author?.username }}</span>
                      <span class="publish-time">{{ formatTime(resource.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="action-buttons">
                    <el-button
                      :type="resource.isFavorited ? 'primary' : 'default'"
                      :icon="Star"
                      @click="handleFavorite"
                      :disabled="!userStore.isLoggedIn"
                    >
                      {{ resource.isFavorited ? '已收藏' : '收藏' }}
                      <span class="count">{{ resource.favoriteCount }}</span>
                    </el-button>
                    <el-button :icon="Share">分享</el-button>
                  </div>
                </div>
              </div>

              <div class="resource-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ resource.viewCount }}</span>
                  <span class="stat-label">浏览</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ resource.commentCount }}</span>
                  <span class="stat-label">评论</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ resource.downloadCount || 0 }}</span>
                  <span class="stat-label">下载</span>
                </div>
                <div class="stat-item" v-if="resource.category">
                  <el-tag type="info">{{ resource.category.name }}</el-tag>
                </div>
              </div>

              <div class="resource-body" v-if="resource.description">
                <h3 class="section-title">描述</h3>
                <div class="description">
                  {{ resource.description }}
                </div>
              </div>

              <div class="resource-body" v-if="resource.content">
                <h3 class="section-title">内容</h3>
                <div class="content">
                  {{ resource.content }}
                </div>
              </div>

              <div class="comments-section">
                <h3 class="section-title">
                  评论
                  <span class="comment-count">({{ resource.commentCount }})</span>
                </h3>

                <div class="comment-form" v-if="userStore.isLoggedIn">
                  <el-input
                    v-model="commentContent"
                    type="textarea"
                    :rows="3"
                    placeholder="写下你的评论..."
                    maxlength="500"
                    show-word-limit
                  />
                  <div class="comment-actions">
                    <el-button
                      type="primary"
                      :loading="commenting"
                      @click="handleSubmitComment"
                    >
                      发表评论
                    </el-button>
                  </div>
                </div>
                <div v-else class="login-prompt">
                  <p>请先
                    <el-link type="primary" @click="$router.push('/login')">登录</el-link>
                    后发表评论
                  </p>
                </div>

                <div class="comments-list">
                  <div v-for="comment in comments" :key="comment.id" class="comment-item">
                    <el-avatar :size="40" class="comment-avatar">
                      <img v-if="comment.author?.avatar" :src="comment.author.avatar" />
                      <el-icon v-else><User /></el-icon>
                    </el-avatar>
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.author?.nickname || comment.author?.username }}</span>
                        <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                      <div class="comment-actions">
                        <el-button type="text" size="small">
                          <el-icon><ChatDotRound /></el-icon>
                          回复
                        </el-button>
                        <el-button type="text" size="small">
                          <el-icon><Good /></el-icon>
                          {{ comment.likeCount || 0 }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                  <el-empty v-if="!commentsLoading && comments.length === 0" description="暂无评论" />
                </div>
              </div>
            </div>

            <div class="side-bar">
              <div class="side-card">
                <h4 class="side-title">关于作者</h4>
                <div class="author-card" v-if="resource.author">
                  <el-avatar :size="64">
                    <img v-if="resource.author.avatar" :src="resource.author.avatar" />
                    <el-icon v-else size="32"><User /></el-icon>
                  </el-avatar>
                  <div class="author-info-side">
                    <span class="author-name">{{ resource.author.nickname || resource.author.username }}</span>
                    <p class="author-bio">{{ resource.author.bio || '暂无简介' }}</p>
                  </div>
                </div>
              </div>

              <div class="side-card" v-if="resource.tags?.length">
                <h4 class="side-title">标签</h4>
                <div class="tag-list">
                  <el-tag v-for="tag in resource.tags" :key="tag" class="tag-item">
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getResourceById, toggleFavorite, addComment } from '@/api'
import {
  User,
  Star,
  Share,
  ChatDotRound,
  Good
} from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const commenting = ref(false)
const commentsLoading = ref(false)
const resource = ref({})
const comments = ref([])
const commentContent = ref('')

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const fetchResource = async () => {
  loading.value = true
  try {
    const res = await getResourceById(route.params.id)
    resource.value = res.data?.resource || {}
    comments.value = res.data?.comments || []
  } catch (e) {
    console.error('Fetch resource error:', e)
  } finally {
    loading.value = false
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await toggleFavorite(route.params.id)
    resource.value.isFavorited = res.data.isFavorited
    resource.value.favoriteCount = res.data.favoriteCount
    ElMessage.success(resource.value.isFavorited ? '收藏成功' : '取消收藏')
  } catch (e) {
    console.error('Toggle favorite error:', e)
  }
}

const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  commenting.value = true
  try {
    await addComment(route.params.id, { content: commentContent.value })
    ElMessage.success('评论发表成功')
    commentContent.value = ''
    fetchResource()
  } catch (e) {
    console.error('Submit comment error:', e)
  } finally {
    commenting.value = false
  }
}

onMounted(() => {
  fetchResource()
})
</script>

<style scoped>
.resource-detail-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
  background: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
}

.main-content {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
}

.resource-header {
  margin-bottom: 24px;
}

.resource-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
  line-height: 1.4;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.author-text {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.resource-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: #f9fafc;
  border-radius: 8px;
  margin-bottom: 32px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.resource-body {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.description,
.content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}

.comments-section {
  border-top: 1px solid #e4e7ed;
  padding-top: 24px;
}

.comment-count {
  font-size: 14px;
  color: #909399;
  font-weight: 400;
}

.comment-form {
  margin-bottom: 24px;
}

.comment-actions {
  margin-top: 12px;
  text-align: right;
}

.login-prompt {
  padding: 20px;
  background: #f9fafc;
  border-radius: 8px;
  text-align: center;
  color: #606266;
  margin-bottom: 24px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  display: flex;
  gap: 16px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.side-bar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.side-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.side-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.author-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.author-info-side {
  margin-top: 12px;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.author-bio {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
}

@media (max-width: 960px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  
  .side-bar {
    order: -1;
  }
}
</style>
