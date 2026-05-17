<template>
  <div class="page-container">
    <van-nav-bar title="个人主页" left-arrow @click-left="$router.back()" />

    <div class="page-content home-content" v-loading="loading">
      <div class="error-state" v-if="error">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadData">重试</van-button>
      </div>

      <div v-if="user" class="user-profile">
        <div class="profile-header">
          <van-avatar size="80" />
          <h2 class="username">{{ user.username }}</h2>
          <p class="bio">{{ user.bio || '这个人很懒，什么都没写' }}</p>
          <van-button
            v-if="userStore.isLoggedIn() && user.id !== userStore.user?.id"
            type="primary"
            size="small"
            @click="handleFollow"
          >
            {{ isFollowing ? '已关注' : '关注' }}
          </van-button>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">{{ stats.following_count || 0 }}</div>
            <div class="stat-label">关注</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.follower_count || 0 }}</div>
            <div class="stat-label">粉丝</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.favorite_count || 0 }}</div>
            <div class="stat-label">收藏</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const error = ref(false)
const user = ref(null)
const stats = ref({})
const isFollowing = ref(false)

const loadData = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await userApi.getUserProfile(route.params.id)
    user.value = res.data
    stats.value = res.data
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const handleFollow = async () => {
  try {
    await userApi.followUser(route.params.id)
    isFollowing.value = !isFollowing.value
    showToast(isFollowing.value ? '关注成功' : '已取消关注')
    stats.value.follower_count = (stats.value.follower_count || 0) + (isFollowing.value ? 1 : -1)
  } catch (e) {}
}

onMounted(() => {
  loadData()
})
</script>

<style lang="less" scoped>
.home-content {
  padding-bottom: 60px;
}

.user-profile {
  .profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    background: #fff;

    .username {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 16px 0 8px;
    }

    .bio {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
  }

  .stats-row {
    display: flex;
    background: #fff;
    border-top: 1px solid #f5f5f5;

    .stat-item {
      flex: 1;
      text-align: center;
      padding: 20px 0;

      .stat-value {
        font-size: 22px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #666;
      }
    }
  }
}
</style>
