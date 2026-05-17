<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const post = ref(null)
const commentContent = ref('')
const submitting = ref(false)

const fetchPost = async () => {
  try {
    loading.value = true
    error.value = ''
    const res = await request.get(`/community/posts/${route.params.id}`)
    post.value = res.data
  } catch (err) {
    console.error('Fetch post error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    await request.post(`/community/posts/${route.params.id}/like`)
    post.value.is_liked = !post.value.is_liked
    post.value.likes_count += post.value.is_liked ? 1 : -1
    ElMessage.success(post.value.is_liked ? '点赞成功' : '取消点赞')
  } catch (err) {
    console.error('Like error:', err)
    ElMessage.error('操作失败')
  }
}

const handleComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  try {
    submitting.value = true
    await request.post(`/community/posts/${route.params.id}/comments`, {
      content: commentContent.value
    })
    ElMessage.success('评论成功')
    commentContent.value = ''
    fetchPost()
  } catch (err) {
    console.error('Comment error:', err)
    ElMessage.error('评论失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPost()
})
</script>

<template>
  <Layout>
    <div class="post-detail-page">
      <div class="container">
        <el-skeleton v-if="loading" :rows="10" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchPost">点击重试</el-button>
          </el-empty>
        </div>

        <template v-else-if="post">
          <div class="post-header">
            <div class="author-info">
              <el-avatar :size="48" :src="post.avatar">
                {{ post.nickname?.charAt(0) || '用' }}
              </el-avatar>
              <div class="author-detail">
                <span class="author-name">{{ post.nickname }}</span>
                <el-tag size="small" type="info">{{ post.category }}</el-tag>
              </div>
            </div>
          </div>

          <h1 class="post-title">{{ post.title }}</h1>
          
          <div class="post-content">
            <p>{{ post.content }}</p>
          </div>

          <div class="post-actions">
            <el-button :type="post.is_liked ? 'primary' : 'default'" @click="handleLike">
              <el-icon><Star :filled="post.is_liked" /></el-icon>
              {{ post.likes_count || 0 }} 点赞
            </el-button>
            <el-button>
              <el-icon><ChatDotRound /></el-icon>
              {{ post.comments_count || 0 }} 评论
            </el-button>
            <el-button>
              <el-icon><View /></el-icon>
              {{ post.views_count || 0 }} 浏览
            </el-button>
          </div>

          <div class="comment-section">
            <h3>发表评论</h3>
            <div class="comment-input">
              <el-input
                v-model="commentContent"
                type="textarea"
                :rows="3"
                placeholder="写下你的评论..."
              />
              <el-button 
                type="primary" 
                :loading="submitting"
                @click="handleComment"
                class="submit-btn"
              >
                发表评论
              </el-button>
            </div>

            <div class="comments-list">
              <h3>全部评论 ({{ post.comments?.length || 0 }})</h3>
              <div v-if="!post.comments?.length" class="empty-comments">
                <el-empty description="暂无评论，快来抢沙发" :image-size="80" />
              </div>
              <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
                <el-avatar :size="36" :src="comment.avatar">
                  {{ comment.nickname?.charAt(0) || '用' }}
                </el-avatar>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.nickname }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.post-detail-page {
  min-height: 80vh;
}

.post-header {
  margin-bottom: 24px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-detail {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.post-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px;
  line-height: 1.4;
}

.post-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;
}

.post-content p {
  color: #303133;
  font-size: 16px;
  line-height: 1.8;
  margin: 0;
}

.post-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.comment-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
}

.comment-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.comment-input {
  margin-bottom: 30px;
}

.submit-btn {
  margin-top: 12px;
}

.comments-list {
  border-top: 1px solid #e4e7ed;
  padding-top: 24px;
}

.empty-comments {
  padding: 30px 0;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-content {
  flex: 1;
}

.comment-header {
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.comment-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.error-state {
  padding: 60px 0;
  text-align: center;
}
</style>
