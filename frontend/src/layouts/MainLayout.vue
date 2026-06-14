<template>
  <div class="main-layout">
    <header class="header">
      <div class="container header-inner">
        <div class="logo" @click="$router.push('/')">
          <div class="logo-img" aria-hidden="true">
            <span>川</span>
          </div>
          <div class="logo-text">
            <h1>四川政务服务</h1>
            <p>SICHUAN GOVERNMENT SERVICES</p>
          </div>
        </div>
        
        <nav class="nav">
          <router-link to="/" class="nav-item" :class="{ active: $route.name === 'Home' }">首页</router-link>
          <router-link to="/services" class="nav-item" :class="{ active: $route.name === 'ServiceList' }">服务事项</router-link>
          <router-link to="/scenarios" class="nav-item" :class="{ active: $route.name === 'ScenarioList' }">一件事服务</router-link>
          <router-link to="/policies" class="nav-item" :class="{ active: $route.name === 'PolicyList' }">政策解读</router-link>
          <router-link to="/chat" class="nav-item" :class="{ active: $route.name === 'Chat' }">智能问答</router-link>
          <router-link v-if="showAdminEntry" to="/admin" class="nav-item" :class="{ active: $route.path.startsWith('/admin') }">管理后台</router-link>
        </nav>
        
        <div class="user-area">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32">{{ userStore.userInfo?.real_name?.charAt(0) || '用' }}</el-avatar>
                <span class="username">{{ userStore.userInfo?.real_name || '用户' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="applications">
                    <el-icon><Document /></el-icon>我的办件
                  </el-dropdown-item>
                  <el-dropdown-item command="notifications">
                    <el-icon><Bell /></el-icon>消息通知
                    <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="ml-2" />
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                    <el-icon><Setting /></el-icon>管理后台
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/login')">注册</el-button>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>关于我们</h4>
            <p>四川省人民政府办公厅主办</p>
            <p>四川省大数据中心承办</p>
          </div>
          <div class="footer-section">
            <h4>联系方式</h4>
            <p>服务热线：12345</p>
            <p>工作时间：周一至周五 9:00-17:00</p>
          </div>
          <div class="footer-section">
            <h4>相关链接</h4>
            <p>国家政务服务平台</p>
            <p>四川省人民政府网</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2024 四川省人民政府 版权所有 | 蜀ICP备XXXXXXXX号</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { notificationApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()
const unreadCount = ref(0)
const showAdminEntry = computed(() => import.meta.env.DEV || userStore.isAdmin)

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'applications':
      router.push('/profile/applications')
      break
    case 'notifications':
      router.push('/profile/notifications')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        router.push('/')
      } catch (e) {}
      break
  }
}

const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await notificationApi.unreadCount()
    if (res.code === 200) {
      unreadCount.value = res.data.count || 0
    }
  } catch (e) {}
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchUnreadCount()
  }
})
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  height: 70px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  
  .logo-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    margin-right: 12px;
    background: linear-gradient(135deg, #1e88e5 0%, #0d47a1 100%);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.65), 0 4px 12px rgba(30, 136, 229, 0.25);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
  }
  
  .logo-text h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1e88e5;
    margin: 0;
    line-height: 1.2;
  }
  
  .logo-text p {
    font-size: 10px;
    color: #909399;
    margin: 2px 0 0 0;
    letter-spacing: 1px;
  }
}

.nav {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 8px;
  
  .nav-item {
    padding: 8px 20px;
    font-size: 15px;
    color: #606266;
    border-radius: 6px;
    transition: all 0.3s;
    
    &:hover, &.active {
      color: #1e88e5;
      background: #e3f2fd;
    }
    
    &.active {
      font-weight: 600;
    }
  }
}

.user-area {
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    
    .username {
      font-size: 14px;
      color: #606266;
    }
  }
}

.main {
  flex: 1;
}

.footer {
  background: #2c3e50;
  color: #fff;
  padding: 40px 0 20px;
  margin-top: 60px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  
  .footer-section {
    h4 {
      font-size: 16px;
      margin-bottom: 12px;
      color: #fff;
    }
    
    p {
      font-size: 13px;
      color: #bdc3c7;
      margin-bottom: 8px;
    }
  }
}

.footer-bottom {
  border-top: 1px solid #34495e;
  padding-top: 20px;
  text-align: center;
  
  p {
    font-size: 12px;
    color: #95a5a6;
    margin: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
