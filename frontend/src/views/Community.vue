<template>
  <div class="community-page">
    <van-nav-bar title="社区" fixed>
      <template #left>
        <van-icon name="search" size="20" @click="showSearch = true" />
      </template>
      <template #right>
        <van-icon name="chat-o" size="20" @click="goMessages" />
      </template>
    </van-nav-bar>

    <van-search
      v-model="searchKeyword"
      v-model:show="showSearch"
      placeholder="搜索动态"
      @search="handleSearch"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <van-empty description="暂无动态" />
        </div>
        <div v-else class="post-list">
          <div v-for="post in posts" :key="post.id" class="post-item" @click="goDetail(post.id)">
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
                v-for="(img, idx) in post.images.slice(0, 3)"
                :key="idx"
                :src="img"
                width="31%"
                height="100px"
                fit="cover"
              />
            </div>
            <div v-if="post.location" class="post-location">
              <van-icon name="location-o" size="12" /> {{ post.location }}
            </div>
            <div class="post-actions">
              <van-button type="default" size="small" icon="like-o" :class="{ 'is-liked': post.isLiked }" @click.stop="toggleLike(post)">
                {{ post.likeCount || 0 }}
              </van-button>
              <van-button type="default" size="small" icon="comment-o">
                {{ post.commentCount || 0 }}
              </van-button>
              <van-button type="default" size="small" icon="star-o" :class="{ 'is-favorited': post.isFavorited }" @click.stop="toggleFavorite(post)">
                收藏
              </van-button>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import type { Post } from '@/types'

const router = useRouter()

const posts = ref<Post[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const showSearch = ref(false)
const searchKeyword = ref('')

const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const fetchPosts = async () => {
  try {
    const res = await request.get('/posts', {
      params: {
        page: page.value,
        pageSize: 10,
        search: searchKeyword.value
      }
    })
    if (refreshing.value) {
      posts.value = res.data.list
      refreshing.value = false
    } else {
      posts.value = [...posts.value, ...res.data.list]
    }
    finished.value = posts.value.length >= res.data.total
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const onLoad = () => {
  if (!refreshing.value) {
    page.value++
  }
  fetchPosts()
}

const onRefresh = () => {
  finished.value = false
  page.value = 1
  fetchPosts()
}

const handleSearch = () => {
  refreshing.value = false
  page.value = 1
  posts.value = []
  finished.value = false
  fetchPosts()
}

const goDetail = (id: number) => {
  router.push(`/post/${id}`)
}

const goMessages = () => {
  router.push('/messages')
}

const toggleLike = async (post: Post) => {
  try {
    await request.post(`/posts/${post.id}/like`)
    post.isLiked = !post.isLiked
    post.likeCount += post.isLiked ? 1 : -1
  } catch {}
}

const toggleFavorite = async (post: Post) => {
  try {
    await request.post(`/posts/${post.id}/favorite`)
    post.isFavorited = !post.isFavorited
    showToast(post.isFavorited ? '已收藏' : '已取消收藏')
  } catch {}
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.community-page {
  padding-top: 46px;
  padding-bottom: 50px;
}

.post-list {
  padding: 10px;
}

.post-item {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.user-info .username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.user-info .time {
  font-size: 12px;
  color: #999;
}

.post-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 10px;
}

.post-images {
  display: flex;
  gap: 3px;
  margin-bottom: 10px;
}

.post-location {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.post-actions {
  display: flex;
  gap: 10px;
}

.post-actions .is-liked {
  color: #ff6b6b;
}

.post-actions .is-favorited {
  color: #ffc107;
}

.empty-state {
  padding: 50px 0;
}
</style>
