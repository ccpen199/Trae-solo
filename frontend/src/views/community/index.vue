<template>
  <div class="page-container">
    <van-nav-bar title="创作社区">
      <template #right>
        <van-icon name="plus" size="20" @click="goCreate" />
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" class="channel-tabs" sticky>
      <van-tab v-for="channel in channels" :key="channel.id" :title="channel.name" :name="String(channel.id)">
        <div class="posts-list" v-loading="loading">
          <div class="error-state" v-if="error">
            <p>加载失败</p>
            <van-button type="primary" size="small" class="retry-btn" @click="loadPosts">重试</van-button>
          </div>

          <div class="empty-state" v-else-if="!loading && posts.length === 0">
            <div class="empty-icon">📝</div>
            <p>暂无帖子</p>
          </div>

          <div v-else>
            <div
              class="post-item"
              v-for="post in posts"
              :key="post.id"
              @click="goDetail(post.id)"
            >
              <div class="post-header">
                <van-avatar size="36" />
                <div class="post-user">
                  <div class="username">{{ post.username }}</div>
                  <div class="channel-tag">{{ post.channel_name }}</div>
                </div>
              </div>
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-content">{{ post.content.substring(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}</p>
              <div class="post-images" v-if="post.images && post.images.length">
                <img :src="img" v-for="(img, idx) in post.images.slice(0, 3)" :key="idx" />
              </div>
              <div class="post-footer">
                <span class="post-stat">
                  <van-icon name="like-o" size="14" /> {{ post.like_count || 0 }}
                </span>
                <span class="post-stat">
                  <van-icon name="comment-o" size="14" /> {{ post.comment_count || 0 }}
                </span>
                <span class="post-stat">
                  <van-icon name="gift-o" size="14" /> {{ post.reward_count || 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <van-tabbar v-model="activeTabBar" route>
      <van-tabbar-item replace to="/excerpt" icon="bookmark-o">摘录</van-tabbar-item>
      <van-tabbar-item replace to="/community" icon="cluster-o">创作</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { communityApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTabBar = ref('/community')
const activeTab = ref('1')
const channels = ref([])
const posts = ref([])
const loading = ref(false)
const error = ref(false)

const loadChannels = async () => {
  try {
    const res = await communityApi.getChannels()
    channels.value = res.data || []
    if (channels.value.length > 0) {
      activeTab.value = String(channels.value[0].id)
    }
  } catch (e) {}
}

const loadPosts = async () => {
  if (!activeTab.value) return

  loading.value = true
  error.value = false
  try {
    const res = await communityApi.getPosts({ channelId: activeTab.value, limit: 20 })
    posts.value = res.data || []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const goCreate = () => {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }
  router.push('/community/post/create')
}

const goDetail = (id) => {
  router.push(`/community/post/${id}`)
}

watch(activeTab, () => {
  loadPosts()
})

onMounted(() => {
  loadChannels().then(() => {
    if (channels.value.length > 0) {
      loadPosts()
    }
  })
})
</script>

<style lang="less" scoped>
.channel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.posts-list {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 60px;
}

.post-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  .post-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .post-user {
      .username {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .channel-tag {
        font-size: 12px;
        color: #8b5a2b;
      }
    }
  }

  .post-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .post-content {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .post-images {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;

    img {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      background: #f5f5f5;
    }
  }

  .post-footer {
    display: flex;
    gap: 20px;
    color: #999;
    font-size: 12px;

    .post-stat {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
