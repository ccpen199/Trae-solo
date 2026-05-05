<template>
  <div class="app-container">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <span class="logo-icon">🎪</span>
          <span class="logo-text">营销活动中心</span>
        </router-link>
        
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" exact-active-class="active">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </router-link>
          <router-link to="/wheel" class="nav-item" active-class="active">
            <el-icon><Promotion /></el-icon>
            <span>大转盘</span>
          </router-link>
          <router-link to="/egg" class="nav-item" active-class="active">
            <el-icon><Crop /></el-icon>
            <span>砸金蛋</span>
          </router-link>
          <router-link to="/prizes" class="nav-item" active-class="active">
            <el-icon><Present /></el-icon>
            <span>我的奖品</span>
          </router-link>
        </nav>
        
        <div class="user-info">
          <template v-if="userStore.isLoggedIn">
            <div class="points-display">
              <el-icon><Coin /></el-icon>
              <span class="points-value">{{ userStore.userInfo?.points || 0 }}</span>
              <span class="points-label">积分</span>
            </div>
            <div class="user-dropdown">
              <el-avatar :size="32" class="user-avatar">
                {{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
              <el-dropdown @command="handleCommand">
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <template v-else>
            <el-button type="primary" @click="showLoginDialog = true">
              登录/注册
            </el-button>
          </template>
        </div>
      </div>
    </header>
    
    <!-- 主内容区 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 登录弹窗 -->
    <el-dialog
      v-model="showLoginDialog"
      title="登录 / 注册"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="loginTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="60px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loginLoading">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="60px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="registerForm.username" placeholder="请输入用户名（3-20字符）" />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="registerForm.nickname" placeholder="请输入昵称（选填）" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码（6-20字符）"
              />
            </el-form-item>
            <el-form-item label="确认" prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="login-btn" @click="handleRegister" :loading="registerLoading">
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    
    <!-- 积分不足提示弹窗 -->
    <el-dialog v-model="showPointsDialog" title="积分不足" width="360px">
      <div class="points-dialog-content">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>您的积分不足，请先获取积分</p>
      </div>
      <template #footer>
        <el-button @click="showPointsDialog = false">取消</el-button>
        <el-button type="primary" @click="goToGetPoints">如何获取积分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from './store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const showLoginDialog = ref(false)
const showPointsDialog = ref(false)
const loginTab = ref('login')
const loginLoading = ref(false)
const registerLoading = ref(false)

const loginFormRef = ref(null)
const registerFormRef = ref(null)

const loginForm = ref({
  username: '',
  password: '',
})

const registerForm = ref({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loginLoading.value = true
      try {
        await userStore.login(loginForm.value.username, loginForm.value.password)
        showLoginDialog.value = false
        ElMessage.success('登录成功')
      } catch (err) {
        ElMessage.error(err.message || '登录失败')
      } finally {
        loginLoading.value = false
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        await userStore.register(
          registerForm.value.username,
          registerForm.value.password,
          registerForm.value.nickname
        )
        ElMessage.success('注册成功，已自动登录')
        showLoginDialog.value = false
      } catch (err) {
        ElMessage.error(err.message || '注册失败')
      } finally {
        registerLoading.value = false
      }
    }
  })
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      userStore.logout()
      router.push('/')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
}

const goToGetPoints = () => {
  showPointsDialog.value = false
  ElMessage.info('请完成任务或充值获取积分')
}

// 暴露方法给子组件调用
const openPointsDialog = () => {
  showPointsDialog.value = true
}

const openLoginDialog = () => {
  showLoginDialog.value = true
}

onMounted(() => {
  userStore.checkAuth()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f0f2ff;
  color: #667eea;
}

.nav-item.active {
  background: #667eea;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff7e6;
  padding: 6px 12px;
  border-radius: 20px;
}

.points-value {
  font-weight: bold;
  color: #fa8c16;
  font-size: 16px;
}

.points-label {
  color: #999;
  font-size: 12px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-name {
  color: #333;
  font-size: 14px;
}

.dropdown-icon {
  color: #999;
  font-size: 12px;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 60px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.login-tabs {
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
}

.points-dialog-content {
  text-align: center;
  padding: 20px;
}

.warning-icon {
  font-size: 48px;
  color: #faad14;
  margin-bottom: 16px;
}

.points-dialog-content p {
  color: #666;
  margin: 0;
}
</style>
