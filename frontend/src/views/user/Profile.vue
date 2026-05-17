<template>
  <div class="page-container">
    <van-nav-bar title="个人中心" />

    <div class="page-content profile-content" v-loading="loading">
      <div class="profile-header" v-if="userStore.isLoggedIn() && user">
        <van-avatar size="72" />
        <div class="user-info">
          <h2 class="username">{{ user.username }}</h2>
          <p class="bio">{{ user.bio || '这个人很懒，什么都没写' }}</p>
        </div>
        <van-icon name="edit" size="20" @click="$router.push('/profile/edit')" />
      </div>

      <div class="login-prompt" v-else>
        <p>登录后查看更多内容</p>
        <van-button type="primary" size="small" @click="$router.push('/login')">
          去登录
        </van-button>
      </div>

      <div class="stats-row" v-if="userStore.isLoggedIn()">
        <div class="stat-item" @click="$router.push('/following')">
          <div class="stat-value">{{ stats.following_count || 0 }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item" @click="$router.push('/followers')">
          <div class="stat-value">{{ stats.follower_count || 0 }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item" @click="$router.push('/favorites')">
          <div class="stat-value">{{ stats.favorite_count || 0 }}</div>
          <div class="stat-label">收藏</div>
        </div>
      </div>

      <div class="menu-section">
        <van-cell-group inset>
          <van-cell
            title="我的收藏"
            is-link
            icon="star-o"
            @click="$router.push('/favorites')"
          />
          <van-cell
            title="我的关注"
            is-link
            icon="eye-o"
            @click="$router.push('/following')"
          />
          <van-cell
            title="我的粉丝"
            is-link
            icon="user-o"
            @click="$router.push('/followers')"
          />
          <van-cell
            title="编辑资料"
            is-link
            icon="edit"
            @click="$router.push('/profile/edit')"
          />
        </van-cell-group>
      </div>

      <div class="logout-section" v-if="userStore.isLoggedIn()">
        <van-button block type="default" @click="handleLogout">退出登录</van-button>
      </div>
    </div>

    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item replace to="/excerpt" icon="bookmark-o">摘录</van-tabbar-item>
      <van-tabbar-item replace to="/community" icon="cluster-o">创作</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('/profile')
const loading = ref(false)
const user = ref(null)
const stats = ref({})

const loadProfile = async () => {
  if (!userStore.isLoggedIn()) return

  loading.value = true
  try {
    const res = await userApi.getProfile()
    user.value = res.data
    stats.value = res.data
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  showConfirmDialog({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(() => {
    userStore.logout()
    showToast('已退出登录')
    stats.value = {}
  }).catch(() => {})
}

watch(() => userStore.token, () => {
  loadProfile()
})

onMounted(() => {
  loadProfile()
})
</script>

<style lang="less" scoped>
.profile-content {
  padding-bottom: 60px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  background: #fff;
  margin-bottom: 12px;

  .user-info {
    flex: 1;

    .username {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    .bio {
      font-size: 13px;
      color: #666;
    }
  }
}

.login-prompt {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  margin-bottom: 12px;

  p {
    color: #666;
    margin-bottom: 16px;
  }
}

.stats-row {
  display: flex;
  background: #fff;
  margin-bottom: 12px;

  .stat-item {
    flex: 1;
    text-align: center;
    padding: 16px 0;

    .stat-value {
      font-size: 20px;
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

.menu-section {
  margin-bottom: 20px;
}

.logout-section {
  padding: 0 16px;
}
</style>
