<template>
  <div class="post-detail-page">
    <van-nav-bar title="动态详情" left-arrow @click-left="$router.back()" />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="32px">加载中...</van-loading>
    </div>
    
    <div v-else-if="error" class="error-container" @click="fetchDetail">
      <van-empty description="加载失败，点击重试" />
    </div>
    
    <div v-else class="post-content">
      <div class="post-header card">
        <div class="flex">
          <img :src="post.avatar" class="avatar" @click="goUser" />
          <div class="flex-1 ml-8">
            <div class="nickname">{{ post.nickname }}</div>
            <div class="text-gray">{{ post.location || '未知地点' }}</div>
          </div>
        </div>
        <div class="post-text mt-8">
          {{ post.content }}
        </div>
        <img v-if="post.media_url" :src="post.media_url" class="detail-image mt-8" @click="previewImage" />
      </div>
      
      <div class="comments-section">
        <div class="section-title">评论 ({{ post.comment_count || 0 }})</div>
        
        <div v-if="comments.length === 0" class="empty-comments">
          <van-empty description="暂无评论" />
        </div>
        
        <div v-for="comment in comments" :key="comment.id" class="comment-item card">
          <div class="flex">
            <img :src="comment.avatar" class="avatar-small" />
            <div class="flex-1 ml-8">
              <div class="comment-user">{{ comment.nickname }}</div>
              <div class="comment-text">{{ comment.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="comment-input">
      <van-field
        v-model="commentText"
        placeholder="说点什么..."
        :border="false"
      />
      <van-button type="primary" size="small" @click="sendComment" :disabled="!commentText.trim()">
        发送
      </van-button>
    </div>
    
    <van-action-sheet v-model:show="showActions" :actions="actions" @select="handleAction" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showImagePreview } from 'vant'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const postId = route.params.id
const post = ref({})
const comments = ref([])
const loading = ref(true)
const error = ref(false)
const commentText = ref('')
const showActions = ref(false)

const actions = [
  { name: '分享', icon: 'share-o' },
  { name: '举报', icon: 'warning-o' },
  { name: '取消', loading: false },
]

const fetchDetail = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await request.get(`/posts/${postId}`)
    post.value = res.data
    
    const commentRes = await request.get(`/posts/${postId}/comments`)
    comments.value = commentRes.data?.list || []
  } catch (err) {
    error.value = true
    console.error('获取详情失败:', err)
  } finally {
    loading.value = false
  }
}

const goUser = () => {
  router.push(`/users/${post.value.user_id}`)
}

const previewImage = () => {
  showImagePreview([post.value.media_url])
}

const sendComment = async () => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await request.post(`/posts/${postId}/comments`, {
      content: commentText.value
    })
    showToast('评论成功')
    commentText.value = ''
    fetchDetail()
  } catch (error) {
    console.error('评论失败:', error)
  }
}

const handleAction = (action) => {
  if (action.name === '举报') {
    showToast('举报已提交')
  } else if (action.name === '分享') {
    showToast('分享功能开发中')
  }
  showActions.value = false
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.post-detail-page {
  padding-bottom: 60px;
}

.loading-container,
.error-container {
  padding: 60px 20px;
  text-align: center;
}

.post-header {
  margin: 8px;
}

.nickname {
  font-size: 14px;
  font-weight: 500;
}

.post-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.detail-image {
  width: 100%;
  border-radius: 8px;
}

.comments-section {
  margin-top: 12px;
}

.section-title {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.empty-comments {
  padding: 20px;
}

.comment-item {
  margin: 0 8px 8px;
}

.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.comment-user {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.comment-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #eee;
}

.comment-input .van-field {
  flex: 1;
  margin-right: 8px;
}
</style>
