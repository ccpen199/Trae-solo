<template>
  <div class="topic-detail-container">
    <el-header class="topic-header">
      <div class="header-inner">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <h1 class="page-title" v-if="topic">主题详情</h1>
      </div>
    </el-header>

    <el-main class="topic-main" v-loading="loading">
      <div v-if="error" class="error-wrap">
        <el-icon :size="48" color="#f56c6c"><Warning /></el-icon>
        <p class="error-text">加载失败</p>
        <el-button type="primary" class="mt-20" @click="fetchTopic">重新加载</el-button>
      </div>

      <template v-else-if="topic">
        <el-card class="topic-card">
          <div class="topic-inner">
            <el-avatar :size="50">
              {{ topic.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="topic-body">
              <div class="topic-meta">
                <span class="topic-author">{{ topic.nickname }}</span>
                <el-tag v-if="topic.is_question" type="warning" size="small">提问</el-tag>
                <span class="topic-time">{{ formatTime(topic.created_at) }}</span>
              </div>
              <h2 class="topic-title">{{ topic.title }}</h2>
              <div class="topic-text">{{ topic.content }}</div>
              <div class="topic-stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  {{ topic.view_count || 0 }} 浏览
                </span>
                <span class="stat-item">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ topic.comment_count || 0 }} 评论
                </span>
                <span class="stat-item">
                  <el-icon><GoodFilled /></el-icon>
                  {{ topic.like_count || 0 }} 点赞
                </span>
              </div>
            </div>
          </div>
        </el-card>

        <h3 class="comments-title">评论 ({{ total }})</h3>

        <div v-if="commentsLoading" class="loading-wrap">
          <el-skeleton :rows="2" animated />
        </div>

        <div v-else-if="comments.length === 0" class="empty-wrap">
          <el-icon :size="48" color="#909399"><ChatDotRound /></el-icon>
          <p class="empty-text">暂无评论，快来抢沙发吧</p>
        </div>

        <div v-else class="comments-list">
          <el-card v-for="comment in comments" :key="comment.id" class="comment-card">
            <div class="comment-inner">
              <el-avatar :size="40">
                {{ comment.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="comment-author">{{ comment.nickname }}</span>
                  <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>
          </el-card>
        </div>

        <div v-if="comments.length > 0" class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="fetchComments"
          />
        </div>

        <el-card class="comment-form-card">
          <h4 class="form-title">发表评论</h4>
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
            maxlength="1000"
            show-word-limit
          />
          <div class="form-actions">
            <el-button type="primary" @click="handleAddComment" :loading="commentSubmitting">
              发表评论
            </el-button>
          </div>
        </el-card>
      </template>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getTopicById } from '@/api/topic'
import { addComment, getComments } from '@/api/topic'
import { ArrowLeft, View, ChatDotRound, GoodFilled, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref(false)
const commentsLoading = ref(false)
const commentSubmitting = ref(false)

const topic = ref(null)
const comments = ref([])
const commentContent = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchTopic = async () => {
  loading.value = true
  error.value = false

  try {
    const res = await getTopicById(route.params.id)
    topic.value = res.data
  } catch (err) {
    console.error('获取主题详情失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  commentsLoading.value = true

  try {
    const res = await getComments({
      topic_id: topic.value.id,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    comments.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('获取评论列表失败:', err)
  } finally {
    commentsLoading.value = false
  }
}

const handleAddComment = async () => {
  if (!userStore.token) {
    router.push('/login')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  commentSubmitting.value = true

  try {
    await addComment({
      topic_id: topic.value.id,
      content: commentContent.value.trim()
    })

    ElMessage.success('评论成功')
    commentContent.value = ''
    currentPage.value = 1
    await fetchComments()
    await fetchTopic()
  } catch (error) {
    console.error('发表评论失败:', error)
  } finally {
    commentSubmitting.value = false
  }
}

const goBack = () => {
  router.back()
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchTopic()
  fetchComments()
})
</script>

<style scoped>
.topic-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.topic-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  height: 64px;
}

.header-inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 0 16px;
}

.topic-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.mt-20 {
  margin-top: 20px;
}

.error-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.error-text {
  color: #606266;
  margin-top: 16px;
}

.topic-card {
  margin-bottom: 24px;
}

.topic-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.topic-body {
  flex: 1;
  min-width: 0;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.topic-author {
  font-weight: 500;
  color: #303133;
}

.topic-time {
  color: #c0c4cc;
  font-size: 13px;
}

.topic-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 12px 0;
}

.topic-text {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.topic-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  color: #909399;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-text {
  color: #606266;
  margin-top: 16px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  padding: 16px;
}

.comment-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.comment-body {
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-author {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  color: #c0c4cc;
  font-size: 12px;
}

.comment-text {
  color: #606266;
  margin: 0;
  line-height: 1.5;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.comment-form-card {
  margin-top: 24px;
}

.form-title {
  font-weight: 600;
  margin: 0 0 16px 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
