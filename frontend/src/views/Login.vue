<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>冷链物流温控平台</span>
        </div>
      </template>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="test-accounts">
        <div class="test-label">测试账号：</div>
        <div class="account-list">
          <span class="account">货主: shipper / 123456</span>
          <span class="account">承运商: carrier / 123456</span>
          <span class="account">司机: driver / 123456</span>
          <span class="account">质控: quality / 123456</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const loading = ref(false)
const loginFormRef = ref(null)

const handleLogin = async () => {
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const result = await userStore.login(loginForm.value.username, loginForm.value.password)
        if (result.success) {
          ElMessage.success(result.message || '登录成功')
          router.push('/dashboard')
        } else {
          ElMessage.error(result.message || '用户名或密码错误')
        }
      } catch (error) {
        ElMessage.error('登录失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
}

.card-header {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  color: #333;
}

.test-accounts {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
}

.test-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account {
  background-color: #e6f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  color: #409eff;
}
</style>
