<template>
  <div class="home-page">
    <div class="header">
      <div class="header-bg"></div>
      <div class="user-info">
        <div class="avatar">
          <span>{{ userInfo?.real_name?.charAt(0) || '用' }}</span>
        </div>
        <div class="user-detail">
          <div class="greeting">{{ greeting }}，{{ userInfo?.real_name || '游客' }}</div>
          <div class="subtitle">欢迎使用渝快办</div>
        </div>
        <div class="elder-toggle" @click="toggleElder">
          <van-icon name="friends-o" size="20" />
          <span>{{ isElderMode ? '退出长辈版' : '长辈版' }}</span>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div class="quick-codes card">
      <div class="quick-item" @click="goToIdentity">
        <div class="quick-icon code-icon">
          <van-icon name="qr" size="28" />
        </div>
        <div class="quick-text">电子身份码</div>
      </div>
      <div class="quick-item" @click="goToOutlets">
        <div class="quick-icon outlet-icon">
          <van-icon name="location-o" size="28" />
        </div>
        <div class="quick-text">附近网点</div>
      </div>
      <div class="quick-item" @click="goToElder">
        <div class="quick-icon elder-icon">
          <van-icon name="heart-o" size="28" />
        </div>
        <div class="quick-text">长辈服务</div>
      </div>
      <div class="quick-item" @click="goToAgent">
        <div class="quick-icon agent-icon">
          <van-icon name="friends-o" size="28" />
        </div>
        <div class="quick-text">亲友代办</div>
      </div>
    </div>

    <div class="scene-section card">
      <div class="section-title">
        <span>三大服务场景</span>
      </div>
      <div class="scene-card scene-primary" @click="goToIdentity">
        <div class="scene-icon">
          <span>📱</span>
        </div>
        <div class="scene-info">
          <div class="scene-name">码上办</div>
          <div class="scene-desc">12类证件一码通行，离线亮码，动态风险校验</div>
        </div>
        <van-icon name="arrow" />
      </div>
      <div class="scene-card scene-success" @click="goToOutlets">
        <div class="scene-icon">
          <span>📍</span>
        </div>
        <div class="scene-info">
          <div class="scene-name">就近办</div>
          <div class="scene-desc">智能匹配网点，AR实景导航，预约免排队</div>
        </div>
        <van-icon name="arrow" />
      </div>
      <div class="scene-card scene-warning" @click="goToElder">
        <div class="scene-icon">
          <span>❤️</span>
        </div>
        <div class="scene-info">
          <div class="scene-name">暖心办</div>
          <div class="scene-desc">长辈专属版本，语音输入，人工坐席直连</div>
        </div>
        <van-icon name="arrow" />
      </div>
    </div>

    <div class="stats-section card">
      <div class="section-title">
        <span>今日数据</span>
        <span class="more" @click="goToAdmin">后台管理 <van-icon name="arrow" /></span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
        <div class="stat-number">{{ stats.userCount || 0 }}</div>
        <div class="stat-label">注册用户</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.outletCount || 0 }}</div>
        <div class="stat-label">服务网点</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.certCount || 0 }}</div>
        <div class="stat-label">电子证件</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.itemCount || 0 }}</div>
        <div class="stat-label">服务事项</div>
      </div>
    </div>
    </div>

    <div class="notice-section card">
      <div class="section-title">
        <span>服务公告</span>
      </div>
      <div class="notice-list">
        <div class="notice-item">
          <span class="notice-tag">重要</span>
          <span class="notice-text">身份证补办支持全程网办，最快当日可取</span>
        </div>
        <div class="notice-item">
          <span class="notice-tag">新功能</span>
          <span class="notice-text">长辈模式全新上线，操作更简单</span>
        </div>
        <div class="notice-item">
          <span class="notice-tag">提醒</span>
          <span class="notice-text">社保缴费查询功能已升级</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getUserInfo } from '../api/users'
import request from '../api/request'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const stats = ref({})

const isElderMode = computed(() => userStore.isElderMode)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

async function loadUserInfo() {
  try {
    const data = await getUserInfo(userStore.currentUserId)
    userInfo.value = data
    userStore.setUserInfo(data)
  } catch (e) {
    console.error('加载用户信息失败', e)
  }
}

async function loadStats() {
  try {
    const data = await request.get('/health/stats')
    stats.value = data
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

function toggleElder() {
  userStore.toggleElderMode()
  showToast(isElderMode.value ? '已开启长辈模式' : '已关闭长辈模式')
}

function goToIdentity() {
  router.push('/identity')
}

function goToOutlets() {
  router.push('/outlets')
}

function goToElder() {
  router.push('/elder')
}

function goToAgent() {
  router.push('/elder/agent')
}

function goToAdmin() {
  router.push('/admin')
}

onMounted(() => {
  userStore.initElderMode()
  loadUserInfo()
  loadStats()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  position: relative;
  padding-top: 20px;
  padding-bottom: 60px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  border-radius: 0 0 30px 30px;
}

.user-info {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 20px 16px;
  color: #fff;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  margin-right: 14px;
}

.user-detail {
  flex: 1;
}

.greeting {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.elder-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.page-content {
  margin-top: -40px;
  padding: 0 12px;
  position: relative;
  z-index: 2;
}

.quick-codes {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  margin-bottom: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
}

.code-icon {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
}

.outlet-icon {
  background: linear-gradient(135deg, #43a047, #2e7d32);
}

.elder-icon {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.agent-icon {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
}

.quick-text {
  font-size: 13px;
  color: #333;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.section-title .more {
  font-size: 13px;
  color: #999;
  font-weight: normal;
}

.scene-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 10px;
  background: #f8f9fa;
}

.scene-card:last-child {
  margin-bottom: 0;
}

.scene-primary {
  background: rgba(30, 136, 229, 0.1);
}

.scene-success {
  background: rgba(67, 160, 71, 0.1);
}

.scene-warning {
  background: rgba(255, 152, 0, 0.1);
}

.scene-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 14px;
  background: #fff;
}

.scene-info {
  flex: 1;
}

.scene-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.scene-desc {
  font-size: 13px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px 0;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.notice-list {
  .notice-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .notice-item:last-child {
    border-bottom: none;
  }
}

.notice-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 10px;
  background: #e3f2fd;
  color: #1976d2;
  flex-shrink: 0;
}

.notice-text {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.van-card) {
  margin-bottom: 12px;
}
</style>
