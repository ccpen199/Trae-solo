<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="header-bg"></div>
      <div class="user-card">
        <div class="avatar">
          <span>{{ userInfo?.real_name?.charAt(0) || '用' }}</span>
        </div>
        <div class="user-info">
          <div class="user-name">{{ userInfo?.real_name || '游客' }}</div>
          <div class="user-phone">{{ userInfo?.phone || '未绑定手机号' }}</div>
        </div>
        <van-tag type="primary" round v-if="isRealName">已实名</van-tag>
      </div>
    </div>

    <div class="page-content">
      <div class="stats-row card">
        <div class="stat-item" @click="goTo('certs')">
          <div class="stat-number">{{ userInfo?.cert_count || 0 }}</div>
          <div class="stat-label">电子证件</div>
        </div>
        <div class="stat-item" @click="goTo('appointments')">
          <div class="stat-number">{{ userInfo?.appointment_count || 0 }}</div>
          <div class="stat-label">我的预约</div>
        </div>
        <div class="stat-item" @click="goTo('agent')">
          <div class="stat-number">{{ agentCount }}</div>
          <div class="stat-label">亲友代办</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">12</div>
          <div class="stat-label">消息</div>
        </div>
      </div>

      <div class="menu-group card">
        <div class="menu-item" @click="goTo('certs')">
          <span class="menu-icon">📋</span>
          <span class="menu-text">我的证件</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
        <div class="menu-item" @click="goTo('appointments')">
          <span class="menu-icon">📅</span>
          <span class="menu-text">我的预约</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
        <div class="menu-item" @click="goTo('agent')">
          <span class="menu-icon">👨‍👩‍👧</span>
          <span class="menu-text">亲友代办</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
      </div>

      <div class="menu-group card">
        <div class="menu-item">
          <span class="menu-icon">🔔</span>
          <span class="menu-text">消息通知</span>
          <van-tag type="danger" size="mini">3</van-tag>
        </div>
        <div class="menu-item" @click="toggleElder">
          <span class="menu-icon">👴</span>
          <span class="menu-text">长辈模式</span>
          <van-switch v-model="isElderMode" size="20px" />
        </div>
        <div class="menu-item">
          <span class="menu-icon">🔒</span>
          <span class="menu-text">账号安全</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
      </div>

      <div class="menu-group card">
        <div class="menu-item" @click="goToAdmin">
          <span class="menu-icon">⚙️</span>
          <span class="menu-text">后台管理</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
        <div class="menu-item">
          <span class="menu-icon">❓</span>
          <span class="menu-text">帮助中心</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
        <div class="menu-item">
          <span class="menu-icon">ℹ️</span>
          <span class="menu-text">关于我们</span>
          <van-icon name="arrow" color="#ccc" />
        </div>
      </div>

      <div class="version-info">
        渝快办 v1.0.0
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getUserInfo, toggleElderMode as toggleElder } from '../api/users'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const agentCount = ref(0)
const isRealName = ref(true)

const isElderMode = computed({
  get: () => userStore.isElderMode,
  set: (val) => userStore.toggleElderMode(val)
})

async function loadUserInfo() {
  try {
    const data = await getUserInfo(userStore.currentUserId)
    userInfo.value = data
  } catch (e) {
    console.error(e)
  }
}

function goTo(page) {
  const routes = {
    certs: '/identity/certificates',
    appointments: '/outlets/appointment',
    agent: '/elder/agent',
  }
  if (routes[page]) {
    router.push(routes[page])
  }
}

function goToAdmin() {
  router.push('/admin')
}

function toggleElderMode() {
  toggleElder({ userId: userStore.currentUserId, enabled: isElderMode.value })
  showToast(isElderMode.value ? '已开启长辈模式' : '已关闭长辈模式')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.profile-header {
  position: relative;
  padding-top: 30px;
  padding-bottom: 50px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  border-radius: 0 0 30px 30px;
}

.user-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 20px 20px;
  color: #fff;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.user-phone {
  font-size: 14px;
  opacity: 0.9;
}

.page-content {
  margin-top: -30px;
  padding: 0 12px 20px;
  position: relative;
  z-index: 2;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.menu-group {
  padding: 4px 16px;
  margin-bottom: 12px;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .menu-item:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  font-size: 22px;
  margin-right: 14px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.version-info {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #bbb;
}
</style>
