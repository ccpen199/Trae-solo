<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>个人中心</h1>
    </div>
    
    <div class="page-content" style="padding: 16px;">
      <div class="card">
        <div class="flex-between" style="margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 18px; margin-bottom: 4px;">{{ userStore.userInfo?.realName || '骑手' }}</h3>
            <span class="status-tag" :class="'tag-' + userStore.userInfo?.status">
              {{ statusText }}
            </span>
          </div>
          <div style="text-align: right;">
            <div class="earnings">¥{{ todayEarnings }}</div>
            <div style="font-size: 12px; color: #999;">今日收益</div>
          </div>
        </div>
        
        <div class="info-row">
          <span class="info-label">手机号</span>
          <span class="info-value">{{ userStore.userInfo?.phone }}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">身份证号</span>
          <span class="info-value">{{ maskIdCard(userStore.userInfo?.idCardNumber) }}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">紧急联系人</span>
          <span class="info-value">
            {{ userStore.userInfo?.emergencyContact }} ({{ userStore.userInfo?.emergencyPhone }})
          </span>
        </div>
        
        <div class="info-row">
          <span class="info-label">人脸识别</span>
          <span class="info-value">
            <span v-if="userStore.userInfo?.faceVerified" style="color: #52c41a;">✅ 已完成</span>
            <span v-else style="color: #ff4d4f;">❌ 未完成</span>
          </span>
        </div>
      </div>
      
      <div class="card" v-if="userStore.userInfo?.rider">
        <h3 style="font-size: 16px; margin-bottom: 16px;">骑手信息</h3>
        
        <div class="info-row">
          <span class="info-label">骑手类型</span>
          <span class="info-value">
            <span v-if="userStore.userInfo.rider.isOffsite && userStore.userInfo.rider.isOnsite">双类型</span>
            <span v-else-if="userStore.userInfo.rider.isOffsite">校外骑手</span>
            <span v-else>校内骑手</span>
          </span>
        </div>
        
        <div class="info-row">
          <span class="info-label">在线状态</span>
          <span class="info-value">
            <span v-if="userStore.userInfo.rider.isOnline" style="color: #52c41a;">✅ 在线</span>
            <span v-else style="color: #999;">离线</span>
          </span>
        </div>
        
        <div class="info-row">
          <span class="info-label">当前订单</span>
          <span class="info-value">{{ userStore.userInfo.rider.currentOrders }} 单</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">最大接单</span>
          <span class="info-value">{{ userStore.userInfo.rider.maxOrders }} 单</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">保险状态</span>
          <span class="info-value">
            <span v-if="userStore.userInfo.rider.hasInsurance" style="color: #52c41a;">✅ 已购买</span>
            <span v-else style="color: #ff4d4f;">❌ 未购买</span>
          </span>
        </div>
        
        <div class="info-row">
          <span class="info-label">保证金</span>
          <span class="info-value">
            <span v-if="userStore.userInfo.rider.hasDeposit" style="color: #52c41a;">✅ 已缴纳 ¥{{ userStore.userInfo.rider.depositAmount }}</span>
            <span v-else style="color: #ff4d4f;">❌ 未缴纳</span>
          </span>
        </div>
      </div>
      
      <div class="card">
        <div class="form-group">
          <button 
            class="btn btn-secondary btn-block"
            @click="$router.push('/rider/settings')"
          >
            ⚙️ 接单设置
          </button>
        </div>
        
        <div class="form-group">
          <button 
            class="btn btn-secondary btn-block"
            @click="$router.push('/rider/schedule')"
          >
            📅 排班管理
          </button>
        </div>
        
        <div class="form-group">
          <button 
            class="btn btn-secondary btn-block"
            @click="refreshProfile"
          >
            🔄 刷新信息
          </button>
        </div>
        
        <div class="form-group">
          <button 
            class="btn btn-danger btn-block"
            @click="logout"
          >
            🚪 退出登录
          </button>
        </div>
      </div>
      
      <div style="height: 20px;"></div>
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/rider')">
        <div class="nav-icon">🏠</div>
        <div class="nav-text">首页</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/orders')">
        <div class="nav-icon">📋</div>
        <div class="nav-text">订单</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/schedule')">
        <div class="nav-icon">📅</div>
        <div class="nav-text">排班</div>
      </div>
      <div class="nav-item active" @click="$router.push('/rider/profile')">
        <div class="nav-icon">👤</div>
        <div class="nav-text">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const todayEarnings = ref(0)
const refreshing = ref(false)

const statusText = computed(() => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statusMap[userStore.userInfo?.status] || '未知'
})

const maskIdCard = (idCard) => {
  if (!idCard) return ''
  if (idCard.length < 8) return idCard
  return idCard.slice(0, 4) + '********' + idCard.slice(-4)
}

const refreshProfile = async () => {
  refreshing.value = true
  try {
    await userStore.fetchProfile()
    alert('信息已刷新')
  } catch (err) {
    alert('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const logout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.clearAuth()
    router.push('/login')
  }
}
</script>
