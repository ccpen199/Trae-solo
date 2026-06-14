<template>
  <el-container class="layout-container" style="height: 100vh;">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><OfficeBuilding /></el-icon>
        <span class="logo-text">智慧社区</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#b6c2cc"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>生活服务</span>
        </el-menu-item>
        <el-menu-item index="/access">
          <el-icon><Key /></el-icon>
          <span>门禁认证</span>
        </el-menu-item>
        <el-menu-item index="/access/verify">
          <el-icon><Scan /></el-icon>
          <span>扫码开门</span>
        </el-menu-item>
        <el-menu-item index="/visitors">
          <el-icon><UserFilled /></el-icon>
          <span>访客管理</span>
        </el-menu-item>
        <el-menu-item index="/visitors/create">
          <el-icon><Plus /></el-icon>
          <span>访客授权</span>
        </el-menu-item>
        
        <el-sub-menu index="profile-sub">
          <template #title>
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/profile">我的信息</el-menu-item>
          <el-menu-item index="/profile/rooms">房号绑定</el-menu-item>
          <el-menu-item index="/profile/orders">订单记录</el-menu-item>
          <el-menu-item index="/profile/coupons">优惠券</el-menu-item>
          <el-menu-item index="/profile/announcements">公告通知</el-menu-item>
          <el-menu-item index="/profile/visitors">访客记录</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu v-if="isAdmin" index="admin-sub">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>后台管理</span>
          </template>
          <el-menu-item index="/admin">数据概览</el-menu-item>
          <el-menu-item index="/admin/users">住户审核</el-menu-item>
          <el-menu-item index="/admin/rooms">房号管理</el-menu-item>
          <el-menu-item index="/admin/devices">设备健康</el-menu-item>
          <el-menu-item index="/admin/alerts">告警中心</el-menu-item>
          <el-menu-item index="/admin/events">安全事件</el-menu-item>
          <el-menu-item index="/admin/overstay">滞留处置</el-menu-item>
          <el-menu-item index="/admin/merchants">商户审核</el-menu-item>
          <el-menu-item index="/admin/announcements">公告管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteName !== 'Home'">{{ currentRouteName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="notice-badge">
            <el-button type="primary" link @click="goToAnnouncements">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-button v-else type="primary" link @click="goToAnnouncements">
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #409eff;">
                {{ user?.real_name?.charAt(0) || user?.username?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ user?.real_name || user?.username }}</span>
              <el-tag size="small" :type="roleTagType">{{ roleText }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import { getAnnouncements } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isAdmin = computed(() => ['admin', 'property'].includes(userStore.userRole))
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)

const currentRouteName = computed(() => {
  const nameMap = {
    'Home': '首页',
    'Products': '生活服务',
    'ProductDetail': '商品详情',
    'Access': '门禁认证',
    'AccessVerify': '扫码开门',
    'Visitors': '访客管理',
    'VisitorCreate': '访客授权',
    'Services': '生活服务',
    'MerchantDetail': '商户详情',
    'Profile': '我的信息',
    'ProfileRooms': '房号绑定',
    'ProfileOrders': '订单记录',
    'ProfileCoupons': '优惠券',
    'ProfileAnnouncements': '公告通知',
    'ProfileVisitors': '访客记录',
    'Admin': '数据概览',
    'AdminUsers': '住户审核',
    'AdminRooms': '房号管理',
    'AdminDevices': '设备健康',
    'AdminAlerts': '告警中心',
    'AdminEvents': '安全事件',
    'AdminMerchants': '商户审核',
    'AdminAnnouncements': '公告管理',
    'AdminOverstay': '滞留处置'
  }
  return nameMap[route.name] || ''
})

const roleText = computed(() => {
  const map = {
    'admin': '管理员',
    'property': '物业',
    'resident': '住户',
    'merchant': '商户'
  }
  return map[userStore.userRole] || '住户'
})

const roleTagType = computed(() => {
  const map = {
    'admin': 'danger',
    'property': 'warning',
    'resident': 'success',
    'merchant': 'info'
  }
  return map[userStore.userRole] || 'success'
})

function loadUnreadCount() {
  if (!userStore.userId) return
  getAnnouncements({ user_id: userStore.userId, limit: 100 }).then(res => {
    unreadCount.value = res.data.filter(a => !a.is_read).length
  }).catch(() => {})
}

function goToAnnouncements() {
  router.push('/profile/announcements')
}

function handleCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  }
}

onMounted(() => {
  loadUnreadCount()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #1f3a54;
  gap: 10px;
}

.logo-text {
  color: #fff;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #303133;
}

.notice-badge {
  cursor: pointer;
}

.main-content {
  background-color: #f5f7fa;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title) {
  color: #b6c2cc;
}
</style>
