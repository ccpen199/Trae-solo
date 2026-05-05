<template>
  <div class="my-page">
    <div class="user-header" v-if="userStore.isLoggedIn">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="info">
          <h3 class="nickname">{{ userStore.userInfo?.nickname || '用户' }}</h3>
          <p class="phone">{{ maskedPhone }}</p>
        </div>
      </div>
      <div class="member-card">
        <div class="member-info">
          <span class="level-name">{{ userStore.userInfo?.levelName || '青铜会员' }}</span>
          <span class="growth">{{ userStore.userInfo?.growthPoints || 0 }}成长值</span>
        </div>
        <div class="progress-bar">
          <div class="progress" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">
          <span>距离下一等级还需 {{ growthNeeded }} 成长值</span>
        </div>
      </div>
      <div class="points-row">
        <div class="points-item">
          <span class="number">{{ userStore.userInfo?.points || 0 }}</span>
          <span class="label">积分</span>
        </div>
        <div class="points-item">
          <span class="number">{{ couponCount }}</span>
          <span class="label">优惠券</span>
        </div>
        <div class="points-item">
          <span class="number">{{ cardCount }}</span>
          <span class="label">年卡</span>
        </div>
      </div>
    </div>

    <div class="user-header guest-header" v-else @click="goToLogin">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="info">
          <h3 class="nickname">点击登录</h3>
          <p class="phone">登录后享受更多服务</p>
        </div>
      </div>
    </div>

    <div class="order-section">
      <div class="section-header">
        <h4>我的订单</h4>
        <span class="more" @click="checkLoginAndGo('orders')">全部订单 ></span>
      </div>
      <div class="order-menu">
        <div class="order-item" @click="checkLoginAndGo('orders/pending')">
          <div class="order-icon">
            <el-icon :size="24"><Wallet /></el-icon>
          </div>
          <span>待付款</span>
        </div>
        <div class="order-item" @click="checkLoginAndGo('orders/paid')">
          <div class="order-icon">
            <el-icon :size="24"><Checked /></el-icon>
          </div>
          <span>待安装</span>
        </div>
        <div class="order-item" @click="checkLoginAndGo('orders/service')">
          <div class="order-icon">
            <el-icon :size="24"><Tools /></el-icon>
          </div>
          <span>服务中</span>
        </div>
        <div class="order-item" @click="checkLoginAndGo('appointment')">
          <div class="order-icon">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <span>预约服务</span>
        </div>
      </div>
    </div>

    <div class="tools-section">
      <div class="section-header">
        <h4>常用工具</h4>
      </div>
      <div class="tools-grid">
        <div class="tool-item" @click="checkLoginAndGo('my-cars')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="20"><Car /></el-icon>
          </div>
          <span>我的车辆</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('favorites')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon :size="20"><Star /></el-icon>
          </div>
          <span>我的收藏</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('history')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon :size="20"><Time /></el-icon>
          </div>
          <span>浏览记录</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('sign-in')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <el-icon :size="20"><Coin /></el-icon>
          </div>
          <span>签到赚积分</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('tasks')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon :size="20"><List /></el-icon>
          </div>
          <span>任务中心</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('cards')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            <el-icon :size="20"><Ticket /></el-icon>
          </div>
          <span>年卡中心</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('promotions')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            <el-icon :size="20"><Promotion /></el-icon>
          </div>
          <span>拼团/秒杀</span>
        </div>
        <div class="tool-item" @click="checkLoginAndGo('points-game')">
          <div class="tool-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="20"><Cpu /></el-icon>
          </div>
          <span>积分翻牌</span>
        </div>
      </div>
    </div>

    <div class="service-section">
      <div class="section-header">
        <h4>客户服务</h4>
      </div>
      <div class="service-list">
        <div class="service-item">
          <el-icon :size="18"><ChatDotRound /></el-icon>
          <span>在线客服</span>
          <el-icon :size="12"><ArrowRight /></el-icon>
        </div>
        <div class="service-item">
          <el-icon :size="18"><Phone /></el-icon>
          <span>电话客服</span>
          <el-icon :size="12"><ArrowRight /></el-icon>
        </div>
        <div class="service-item">
          <el-icon :size="18"><HelpFilled /></el-icon>
          <span>帮助中心</span>
          <el-icon :size="12"><ArrowRight /></el-icon>
        </div>
        <div class="service-item" v-if="userStore.isLoggedIn" @click="doLogout">
          <el-icon :size="18"><SwitchButton /></el-icon>
          <span>退出登录</span>
          <el-icon :size="12"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const userStore = useUserStore()

const couponCount = 0
const cardCount = 0

const maskedPhone = computed(() => {
  const phone = userStore.userInfo?.phone
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

const progressPercent = computed(() => {
  const growth = userStore.userInfo?.growthPoints || 0
  const minGrowth = userStore.userInfo?.minGrowth || 0
  const maxGrowth = userStore.userInfo?.maxGrowth || 999
  
  if (maxGrowth === minGrowth) return 0
  const percent = ((growth - minGrowth) / (maxGrowth - minGrowth)) * 100
  return Math.min(100, Math.max(0, percent))
})

const growthNeeded = computed(() => {
  const growth = userStore.userInfo?.growthPoints || 0
  const maxGrowth = userStore.userInfo?.maxGrowth || 999
  return Math.max(0, maxGrowth - growth)
})

const goToLogin = () => {
  router.push('/login')
}

const checkLoginAndGo = (path) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  // router.push(`/${path}`)
}

const doLogout = () => {
  userStore.logout()
}

onMounted(() => {
  userStore.initFromStorage()
})
</script>

<style scoped>
.my-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.user-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 16px 16px;
}

.guest-header {
  padding-bottom: 30px;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}

.info {
  flex: 1;
}

.nickname {
  font-size: 18px;
  color: #fff;
  margin: 0 0 4px;
  font-weight: 600;
}

.phone {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.member-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.member-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.level-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.growth {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress {
  height: 100%;
  background: #fff;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
}

.points-row {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 0;
}

.points-item {
  flex: 1;
  text-align: center;
}

.points-item .number {
  display: block;
  font-size: 18px;
  color: #fff;
  font-weight: 600;
  margin-bottom: 4px;
}

.points-item .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.order-section,
.tools-section,
.service-section {
  background: #fff;
  margin: 12px 16px 0;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  font-size: 15px;
  color: #333;
  margin: 0;
}

.more {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.order-menu {
  display: flex;
}

.order-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.order-icon {
  width: 44px;
  height: 44px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  margin-bottom: 6px;
}

.order-item span {
  font-size: 12px;
  color: #666;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  margin: -8px;
}

.tool-item {
  width: 25%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.tool-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 6px;
}

.tool-item span {
  font-size: 11px;
  color: #666;
  text-align: center;
}

.service-list {
  margin: -8px -16px;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.service-item:last-child {
  border-bottom: none;
}

.service-item:hover {
  background-color: #f9f9f9;
}

.service-item .el-icon:first-child {
  color: #667eea;
  margin-right: 12px;
}

.service-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.service-item .el-icon:last-child {
  color: #ccc;
}
</style>
