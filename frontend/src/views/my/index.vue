<template>
  <div class="my-page page-container">
    <div class="user-header card" @click="handleProfileClick">
      <template v-if="userStore.token && userStore.userInfo">
        <img :src="userStore.userInfo.avatar" class="user-avatar" />
        <div class="user-info ml-12">
          <div class="nickname">{{ userStore.userInfo.nickname }}</div>
          <div class="bio text-gray">{{ userStore.userInfo.bio || '编辑个人资料' }}</div>
        </div>
        <van-icon name="arrow" class="arrow" />
      </template>
      <template v-else>
        <div class="guest-info">
          <van-icon name="user-o" size="40" color="#999" />
          <div class="guest-text ml-12">点击登录</div>
        </div>
      </template>
    </div>
    
    <div class="menu-list card">
      <van-cell
        v-for="item in menuItems"
        :key="item.title"
        :title="item.title"
        :icon="item.icon"
        is-link
        @click="handleMenuClick(item)"
      />
    </div>
    
    <div v-if="userStore.token" class="logout-area" style="margin: 16px;">
      <van-button round block type="default" @click="handleLogout">
        退出登录
      </van-button>
    </div>
    
    <TabBar />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { title: '我的动态', icon: 'photo-o', path: '/my/posts' },
  { title: '我的问答', icon: 'question-o', path: '/my/questions' },
  { title: '我的收藏', icon: 'star-o', path: '/my/favorites' },
  { title: '我的宠物', icon: 'gem-o', path: '/my/pets' },
  { title: '领养申请', icon: 'cart-o', path: '/my/adoptions' },
  { title: '浏览历史', icon: 'clock-o', path: '/my/history' },
  { title: '设置', icon: 'setting-o', path: '/my/settings' },
]

const handleProfileClick = () => {
  if (!userStore.token) {
    router.push('/login')
  }
}

const handleMenuClick = (item) => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  showToast(`${item.title}功能开发中`)
}

const handleLogout = () => {
  userStore.logout()
  showToast('已退出登录')
}
</script>

<style scoped>
.my-page {
  padding-bottom: 50px;
}

.user-header {
  margin: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 16px;
  font-weight: 500;
}

.bio {
  font-size: 13px;
  margin-top: 4px;
}

.arrow {
  color: #999;
}

.guest-info {
  display: flex;
  align-items: center;
}

.guest-text {
  font-size: 16px;
  color: #333;
}

.menu-list {
  margin: 8px;
}

.ml-12 {
  margin-left: 12px;
}

.text-gray {
  color: #999;
}
</style>
