<template>
  <div class="simple-container">
    <el-header style="height: auto; padding: 0;">
      <div class="header-inner">
        <div class="logo">
          <h1><router-link to="/">C2C二手交易平台</router-link></h1>
        </div>
        <div class="header-actions">
          <router-link v-if="userStore.isLoggedIn" to="/publish">
            <el-button type="primary">发布商品</el-button>
          </router-link>
          <template v-if="userStore.isLoggedIn">
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32">{{ userStore.userInfo?.nickname?.charAt(0) }}</el-avatar>
                <span>{{ userStore.userInfo?.nickname }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item><router-link to="/profile">个人中心</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/orders">我的订单</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/chat">消息中心</router-link></el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin || userStore.isCustomerService">
                    <router-link to="/admin">管理后台</router-link>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login"><el-button>登录</el-button></router-link>
            <router-link to="/register"><el-button type="primary">注册</el-button></router-link>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-card>
        <template #header>
          <h2>{{ pageTitle }}</h2>
        </template>
        <el-empty :description="description" />
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageTitle = computed(() => {
  const titles = {
    '/publish': '发布商品',
    '/my-products': '我的商品',
    '/favorites': '我的收藏',
    '/profile': '个人中心',
    '/chat': '消息中心',
    '/disputes': '纠纷管理',
    '/admin': '管理后台'
  }
  return titles[route.path] || '功能开发中'
})

const description = computed(() => {
  return `该功能页面正在开发中，当前页面路由：${route.path}`
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Logout error:', e)
    }
  }
}
</script>

<style scoped>
.simple-container {
  min-height: 100vh;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.logo a {
  color: inherit;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin: 0;
  font-size: 18px;
}
</style>
