<template>
  <div class="article-detail-page">
    <van-nav-bar title="文章详情" left-arrow @click-left="goBack" />
    
    <div class="article-content" v-if="article">
      <div class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <van-avatar :src="article.author_avatar" size="32" />
          <div class="author-info">
            <span class="author-name">{{ article.author_name }}</span>
            <span class="publish-time">{{ formatDate(article.created_at) }}</span>
          </div>
          <van-button 
            type="primary" 
            size="small" 
            round
            v-if="!isAuthor"
          >
            关注
          </van-button>
        </div>
      </div>
      
      <div class="article-cover" v-if="article.cover_image">
        <img :src="article.cover_image" alt="cover" />
      </div>
      
      <div class="article-body">
        <div class="article-html" v-html="formatContent(article.content)"></div>
      </div>
      
      <div class="article-tags" v-if="article.tags?.length">
        <van-tag 
          v-for="tag in article.tags" 
          :key="tag"
          plain
          type="primary"
          round
        >
          #{{ tag }}
        </van-tag>
      </div>
      
      <div class="article-stats">
        <div class="stat-item">
          <van-icon name="eye-o" size="16" color="#999" />
          <span>{{ article.views }} 阅读</span>
        </div>
        <div class="stat-item" @click="toggleLike">
          <van-icon :name="isLiked ? 'like' : 'like-o'" size="16" :color="isLiked ? '#667eea' : '#999'" />
          <span>{{ article.likes }} 点赞</span>
        </div>
        <div class="stat-item">
          <van-icon name="chat-o" size="16" color="#999" />
          <span>{{ article.comment_count }} 评论</span>
        </div>
      </div>
      
      <div class="comments-section">
        <div class="section-header">
          <h3 class="section-title">评论 ({{ commentTotal }})</h3>
        </div>
        
        <div class="comment-input-section">
          <van-field
            v-model="commentText"
            placeholder="说点什么..."
            @click="requireLogin"
          >
            <template #button>
              <van-button 
                type="primary" 
                size="small"
                :disabled="!commentText.trim()"
                @click="submitComment"
              >
                发送
              </van-button>
            </template>
          </van-field>
        </div>
        
        <div class="comment-list">
          <div v-for="item in comments" :key="item.id" class="comment-item">
            <van-avatar :src="item.user_avatar" size="36" />
            <div class="comment-content">
              <div class="comment-header">
                <span class="user-name">{{ item.user_name }}</span>
                <span class="comment-time">{{ formatDate(item.created_at) }}</span>
              </div>
              <p class="comment-text">{{ item.content }}</p>
              <div class="comment-actions">
                <span class="action-item">
                  <van-icon name="like-o" size="14" color="#999" />
                  <span>{{ item.likes || 0 }}</span>
                </span>
                <span class="action-item" @click="replyToComment(item)">
                  <van-icon name="chat-o" size="14" color="#999" />
                  <span>回复</span>
                </span>
              </div>
              
              <div class="reply-list" v-if="item.replies?.length">
                <div v-for="reply in item.replies" :key="reply.id" class="reply-item">
                  <span class="reply-user">{{ reply.user_name }}：</span>
                  <span class="reply-text">{{ reply.content }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <van-empty description="暂无评论" v-if="comments.length === 0" />
      </div>
    </div>
    
    <van-goods-action>
      <van-goods-action-icon 
        :icon="isLiked ? 'like' : 'like-o'" 
        text="点赞" 
        @click="toggleLike"
      />
      <van-goods-action-icon 
        :icon="isFavorited ? 'star' : 'star-o'" 
        text="收藏" 
        @click="toggleFavorite"
      />
      <van-goods-action-icon icon="share-o" text="分享" />
      <van-goods-action-button 
        type="primary" 
        text="写评论" 
        @click="requireLogin"
      />
    </van-goods-action>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getArticleDetail, getComments, addComment } from '@/api/content'
import { toggleFavorite as toggleFavoriteApi } from '@/api/interaction'
import { useUserStore } from '@/store/user'
import { showToast, showDialog, Dialog } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const article = ref(null)
const comments = ref([])
const commentTotal = ref(0)
const commentText = ref('')
const isLiked = ref(false)
const isFavorited = ref(false)
const isAuthor = ref(false)
const page = ref(1)

const loadArticleDetail = async () => {
  try {
    const id = route.params.id
    const res = await getArticleDetail(id)
    if (res.success) {
      article.value = res.data
      commentTotal.value = res.data.comment_count
      isFavorited.value = res.data.is_favorited
    }
  } catch (error) {
    console.error('加载文章详情失败:', error)
  }
}

const loadComments = async () => {
  try {
    const id = route.params.id
    const res = await getComments('article', id, { page: page.value, page_size: 10 })
    if (res.success) {
      comments.value = res.data.list
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/## (.*)/g, '<h2 style="font-size:18px;font-weight:600;margin:20px 0 10px;color:#333;">$1</h2>')
}

const goBack = () => {
  router.back()
}

const toggleLike = () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  isLiked.value = !isLiked.value
  if (isLiked.value) {
    article.value.likes++
  } else {
    article.value.likes = Math.max(0, article.value.likes - 1)
  }
  showToast(isLiked.value ? '点赞成功' : '已取消点赞')
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  
  try {
    const res = await toggleFavoriteApi('article', article.value.id)
    if (res.success) {
      isFavorited.value = res.data.is_favorited
      showToast(isFavorited.value ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
}

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  
  if (!commentText.value.trim()) {
    showToast('请输入评论内容')
    return
  }
  
  try {
    const res = await addComment({
      target_type: 'article',
      target_id: route.params.id,
      content: commentText.value
    })
    if (res.success) {
      showToast('评论成功')
      commentText.value = ''
      commentTotal.value++
      loadComments()
    }
  } catch (error) {
    console.error('评论失败:', error)
  }
}

const replyToComment = (item) => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  commentText.value = `@${item.user_name} `
}

const requireLogin = () => {
  showDialog({
    title: '提示',
    message: '登录后才能进行此操作，是否立即登录？',
    confirmButtonText: '去登录',
    cancelButtonText: '取消'
  }).then(() => {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
  }).catch(() => {
    // 用户取消
  })
}

onMounted(() => {
  loadArticleDetail()
  loadComments()
})
</script>

<style scoped>
.article-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.article-content {
  background: #fff;
}

.article-header {
  padding: 16px;
}

.article-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin: 0 0 16px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #999;
}

.article-cover {
  padding: 0 16px;
}

.article-cover img {
  width: 100%;
  border-radius: 8px;
}

.article-body {
  padding: 16px;
}

.article-html {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
}

.article-tags {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  flex-wrap: wrap;
}

.article-stats {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
  border-bottom: 10px solid #f5f5f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.comments-section {
  background: #fff;
  padding: 16px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.comment-input-section {
  margin-bottom: 20px;
}

:deep(.van-field) {
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 16px;
}

:deep(.van-field__control) {
  font-size: 14px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 0 0 8px;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.reply-list {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.reply-item {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 4px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-user {
  color: #667eea;
  font-weight: 500;
}

:deep(.van-goods-action-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
