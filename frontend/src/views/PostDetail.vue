<template>
  <div class="post-detail-page">
    <van-nav-bar title="动态详情" left-arrow @click-left="goBack" />

    <van-loading v-if="loading" class="loading" />
    <div v-else-if="post" class="content">
      <div class="post-header">
        <van-image :src="post.user.avatar || 'https://picsum.photos/100/100'" round class="avatar" />
        <div class="user-info">
          <div class="username">{{ post.user.nickname || post.user.username }}</div>
          <div class="time">{{ formatTime(post.createdAt) }}</div>
        </div>
      </div>

      <div class="post-content">{{ post.content }}</div>

      <div v-if="post.images && post.images.length > 0" class="post-images">
        <van-image
          v-for="(img, idx) in post.images"
          :key="idx"
          :src="img"
          width="100%"
          height="200px"
          fit="cover"
          class="detail-image"
        />
      </div>

      <div v-if="post.location" class="post-location">
        <van-icon name="location-o" /> {{ post.location }}
      </div>

      <div class="post-actions">
        <van-button type="default" size="small" icon="like-o" :class="{ 'is-liked': post.isLiked }" @click="toggleLike">
          {{ post.likeCount || 0 }}
        </van-button>
        <van-button type="default" size="small" icon="comment-o">
          {{ post.commentCount || 0 }}
        </van-button>
        <van-button type="default" size="small" icon="star-o" :class="{ 'is-favorited': post.isFavorited }" @click="toggleFavorite">
          收藏
        </van-button>
      </div>

      <div class="comment-section">
        <h3>评论 ({{ post.comments?.length || 0 }})</h3>
        <div v-if="post.comments && post.comments.length > 0" class="comment-list">
          <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
            <van-image :src="comment.user.avatar || 'https://picsum.photos/50/50'" round class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-user">{{ comment.user.nickname || comment.user.username }}</div>
              <div class="comment-text">{{ comment.content }}</div>
            </div>
          </div>
        </div>
        <van-empty v-else description="暂无评论" />
      </div>
    </div>

    <div class="comment-input">
      <van-field
        v-model="commentText"
        placeholder="发表评论..."
        :border="false"
      />
      <van-button type="primary" size="small" @click="submitComment">发送</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import type { Post } from '@/types'

const router = useRouter()
const route = useRoute()

const post = ref<Post | null>(null)
const loading = ref(true)
const commentText = ref('')

const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const fetchPost = async () => {
  try {
    const res = await request.get(`/posts/${route.params.id}`)
    post.value = res.data
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const toggleLike = async () => {
  if (!post.value) return
  try {
    await request.post(`/posts/${post.value.id}/like`)
    post.value.isLiked = !post.value.isLiked
    post.value.likeCount += post.value.isLiked ? 1 : -1
  } catch {}
}

const toggleFavorite = async () => {
  if (!post.value) return
  try {
    await request.post(`/posts/${post.value.id}/favorite`)
    post.value.isFavorited = !post.value.isFavorited
    showToast(post.value.isFavorited ? '已收藏' : '已取消收藏')
  } catch {}
}

const submitComment = async () => {
  if (!commentText.value.trim() || !post.value) return
  try {
    await request.post(`/posts/${post.value.id}/comment`, {
      content: commentText.value
    })
    commentText.value = ''
    showToast('评论成功')
    fetchPost()
  } catch {}
}

onMounted(() => {
  fetchPost()
})
</script>

<style scoped>
.post-detail-page {
  padding-bottom: 60px;
}

.loading {
  padding: 50px 0;
  text-align: center;
}

.content {
  padding: 15px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  margin-right: 12px;
}

.user-info .username {
  font-size: 16px;
  font-weight: 500;
}

.user-info .time {
  font-size: 12px;
  color: #999;
}

.post-content {
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 15px;
}

.post-images {
  margin-bottom: 15px;
}

.detail-image {
  margin-bottom: 8px;
  border-radius: 8px;
}

.post-location {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
}

.post-actions {
  display: flex;
  gap: 10px;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.post-actions .is-liked {
  color: #ff6b6b;
}

.post-actions .is-favorited {
  color: #ffc107;
}

.comment-section {
  padding-top: 15px;
}

.comment-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  width: 35px;
  height: 35px;
  flex-shrink: 0;
}

.comment-content .comment-user {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.comment-content .comment-text {
  font-size: 14px;
  color: #333;
}

.comment-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-top: 1px solid #eee;
}

.comment-input .van-field {
  flex: 1;
  margin-right: 10px;
}
</style>
