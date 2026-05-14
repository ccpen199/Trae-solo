<template>
  <div class="post-detail-page page-container">
    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="!post" class="error">
      <p>帖子不存在</p>
    </div>

    <div v-else class="content">
      <div class="post-header">
        <div class="author-info">
          <img :src="post.avatar || '/default-avatar.png'" class="author-avatar" />
          <div class="author-detail">
            <span class="author-name">{{ post.nickname }}</span>
            <span class="post-time">{{ formatDate(post.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="post-title">{{ post.title }}</div>

      <div class="post-images">
        <img 
          v-for="(img, index) in getImages(post.images)" 
          :key="index" 
          :src="img" 
          alt="" 
          class="post-image"
        />
      </div>

      <div class="post-content">{{ post.content }}</div>

      <div class="post-stats">
        <div class="stat-item" @click="handleLike">
          <Heart class="stat-icon" :class="{ liked: liked }" />
          <span>{{ post.likes }}</span>
        </div>
        <div class="stat-item">
          <Eye class="stat-icon" />
          <span>{{ post.views }}</span>
        </div>
        <div class="stat-item">
          <MessageCircle class="stat-icon" />
          <span>{{ comments.length }}</span>
        </div>
      </div>

      <div class="comments-section">
        <h3>评论 ({{ comments.length }})</h3>
        <div class="comment-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment-item"
          >
            <img :src="comment.avatar || '/default-avatar.png'" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.nickname }}</span>
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="comment-input-section">
        <el-input 
          v-model="commentContent" 
          placeholder="发表评论..." 
          class="comment-input"
          @keyup.enter="submitComment"
        />
        <el-button type="primary" @click="submitComment" class="comment-btn">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Heart, Eye, MessageCircle } from 'lucide-vue-next'
import { postAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const post = ref(null)
const comments = ref([])
const liked = ref(false)
const commentContent = ref('')

onMounted(() => {
  loadPost()
})

async function loadPost() {
  loading.value = true
  try {
    const id = route.params.id
    const data = await postAPI.detail(id)
    post.value = data.post
    comments.value = data.comments || []
  } catch {
    post.value = null
  } finally {
    loading.value = false
  }
}

function getImages(imagesStr) {
  try {
    return JSON.parse(imagesStr) || []
  } catch {
    return []
  }
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return `${minutes}分钟前`
      }
      return `${hours}小时前`
    }
    return `${days}天前`
  } catch {
    return dateStr
  }
}

async function handleLike() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const data = await postAPI.like(post.value.id)
    liked.value = data.liked
    post.value.likes += data.liked ? 1 : -1
  } catch {
    ElMessage.error('操作失败')
  }
}

async function submitComment() {
  if (!commentContent.value.trim()) return
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const data = await postAPI.comment(post.value.id, commentContent.value)
    comments.value.unshift(data)
    commentContent.value = ''
    post.value.comments++
    ElMessage.success('评论成功')
  } catch {
    ElMessage.error('评论失败')
  }
}
</script>

<style scoped>
.content {
  padding-bottom: 100px;
}

.post-header {
  background: white;
  padding: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.author-detail {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-title {
  background: white;
  padding: 0 16px 16px;
  font-size: 18px;
  font-weight: 600;
}

.post-images {
  display: flex;
  flex-wrap: wrap;
}

.post-image {
  width: 50%;
  height: 180px;
  object-fit: cover;
}

.post-content {
  background: white;
  padding: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.post-stats {
  background: white;
  margin: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-around;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: #999;
}

.stat-icon.liked {
  color: #ef4444;
}

.stat-item span {
  font-size: 12px;
  color: #666;
}

.comments-section {
  background: white;
  margin: 12px;
  padding: 16px;
  border-radius: 12px;
}

.comments-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 500;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.comment-input-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px;
  display: flex;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.comment-input {
  flex: 1;
}

.comment-btn {
  width: 80px;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>