<template>
  <div class="profile-page">
    <div class="profile-header" v-if="userStore.isLoggedIn">
      <div class="user-info">
        <van-avatar :src="userStore.user?.avatar" size="64" />
        <div class="user-detail">
          <h2 class="user-name">{{ userStore.user?.username }}</h2>
          <p class="user-phone">{{ formatPhone(userStore.user?.phone) }}</p>
        </div>
        <van-icon name="edit" size="20" color="#fff" @click="goToEdit" />
      </div>
      
      <div class="user-stats">
        <div class="stat-item" @click="goToFavorites">
          <span class="stat-number">{{ userStore.user?.favoriteCount || 0 }}</span>
          <span class="stat-label">收藏</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">{{ userStore.user?.followingCount || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">{{ userStore.user?.followerCount || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
      </div>
    </div>
    
    <div class="profile-header login-prompt" v-else @click="goToLogin">
      <div class="user-info">
        <div class="avatar-placeholder">
          <van-icon name="user-o" size="32" color="#999" />
        </div>
        <div class="user-detail">
          <h2 class="user-name">点击登录</h2>
          <p class="user-phone">登录后享受更多服务</p>
        </div>
        <van-icon name="arrow" size="16" color="#fff" />
      </div>
    </div>
    
    <div class="menu-section">
      <van-cell-group inset>
        <van-cell title="我的收藏" is-link @click="checkLoginAndGo('/favorites')">
          <template #icon>
            <van-icon name="star-o" size="20" color="#667eea" />
          </template>
        </van-cell>
        <van-cell title="我的家" is-link @click="checkLoginAndGo('/my-home')">
          <template #icon>
            <van-icon name="home-o" size="20" color="#43e97b" />
          </template>
        </van-cell>
        <van-cell title="我的问答" is-link @click="checkLoginAndGo('/questions')">
          <template #icon>
            <van-icon name="chat-o" size="20" color="#fa709a" />
          </template>
        </van-cell>
        <van-cell title="消息中心" is-link @click="checkLoginAndGo('/messages')">
          <template #icon>
            <van-icon name="bell-o" size="20" color="#fee140" />
          </template>
          <template #right-icon>
            <van-badge :content="3" v-if="userStore.isLoggedIn" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    
    <div class="menu-section">
      <van-cell-group inset>
        <van-cell title="我的预约" is-link @click="checkLoginAndGo('/appointments')">
          <template #icon>
            <van-icon name="calendar-o" size="20" color="#f093fb" />
          </template>
        </van-cell>
        <van-cell title="浏览历史" is-link>
          <template #icon>
            <van-icon name="clock-o" size="20" color="#4facfe" />
          </template>
        </van-cell>
        <van-cell title="我的评价" is-link @click="checkLoginAndGo('/reviews')">
          <template #icon>
            <van-icon name="notes-o" size="20" color="#30cfd0" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    
    <div class="menu-section">
      <van-cell-group inset>
        <van-cell title="意见反馈" is-link>
          <template #icon>
            <van-icon name="comment-o" size="20" color="#667eea" />
          </template>
        </van-cell>
        <van-cell title="帮助中心" is-link>
          <template #icon>
            <van-icon name="question-o" size="20" color="#43e97b" />
          </template>
        </van-cell>
        <van-cell title="关于我们" is-link>
          <template #icon>
            <van-icon name="info-o" size="20" color="#fa709a" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    
    <div class="menu-section" v-if="userStore.isLoggedIn">
      <van-cell-group inset>
        <van-cell title="退出登录" center @click="handleLogout">
          <template #default>
            <span style="color: #ff4d4f; font-size: 15px;">退出登录</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    
    <div class="version-info">
      <p>版本 1.0.0</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showDialog, Dialog } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const goToLogin = () => {
  router.push('/login')
}

const goToEdit = () => {
  // router.push('/profile/edit')
}

const goToFavorites = () => {
  router.push('/favorites')
}

const checkLoginAndGo = (path) => {
  if (!userStore.isLoggedIn) {
    showDialog({
      title: '提示',
      message: '登录后才能进行此操作，是否立即登录？',
      confirmButtonText: '去登录',
      cancelButtonText: '取消'
    }).then(() => {
      router.push({
        path: '/login',
        query: { redirect: path }
      })
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.push(path)
  }
}

const handleLogout = () => {
  showDialog({
    title: '提示',
    message: '确定要退出登录吗？',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    userStore.logout()
    router.push('/home')
  }).catch(() => {
    // 用户取消
  })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 16px 30px;
}

.login-prompt {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-detail {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
}

.user-phone {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.user-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-number {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
}

.menu-section {
  margin-top: 10px;
}

:deep(.van-cell-group--inset) {
  border-radius: 8px;
  margin: 0 16px;
}

:deep(.van-cell) {
  padding: 14px 16px;
}

:deep(.van-cell__title) {
  font-size: 14px;
  color: #333;
}

.version-info {
  text-align: center;
  padding: 30px 0;
  color: #999;
  font-size: 12px;
}
</style>
