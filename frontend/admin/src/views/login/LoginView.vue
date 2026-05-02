<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive({
  username: '',
  password: '',
})

const loading = ref(false)

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const result = await authStore.login(loginForm.username, loginForm.password)
    if (result.success) {
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(result.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const quickLogin = (role: string) => {
  const accounts: Record<string, { username: string; password: string }> = {
    admin: { username: 'admin', password: 'Admin@123' },
    manager: { username: 'manager', password: 'Manager@123' },
    cashier: { username: 'cashier', password: 'Cashier@123' },
    waiter: { username: 'waiter', password: 'Waiter@123' },
    chef: { username: 'chef', password: 'Chef@123' },
  }

  const account = accounts[role]
  if (account) {
    loginForm.username = account.username
    loginForm.password = account.password
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>餐饮点餐收银系统</h2>
        <p>Restaurant Ordering & POS System</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="formRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="quick-login">
        <p>快速登录：</p>
        <div class="quick-login-buttons">
          <el-button size="small" type="danger" @click="quickLogin('admin')">
            管理员
          </el-button>
          <el-button size="small" type="warning" @click="quickLogin('manager')">
            店长
          </el-button>
          <el-button size="small" type="success" @click="quickLogin('cashier')">
            收银
          </el-button>
          <el-button size="small" type="primary" @click="quickLogin('waiter')">
            服务员
          </el-button>
          <el-button size="small" type="info" @click="quickLogin('chef')">
            厨师
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #303133;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.login-form {
  margin-bottom: 30px;
}

.quick-login {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;

  p {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #909399;
  }
}

.quick-login-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
