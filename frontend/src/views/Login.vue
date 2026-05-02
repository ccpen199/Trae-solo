<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <el-icon size="40" color="#409EFF"><Monitor /></el-icon>
          <h2>3D产品展示系统</h2>
        </div>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <p>测试账号（密码均为 123456）：</p>
        <div class="tips-list">
          <span class="tip-item"><el-tag type="info">consumer1</el-tag> 消费者</span>
          <span class="tip-item"><el-tag type="primary">designer1</el-tag> 设计师</span>
          <span class="tip-item"><el-tag type="success">operator1</el-tag> 运营</span>
          <span class="tip-item"><el-tag type="warning">sales1</el-tag> 销售</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.login(loginForm.username, loginForm.password)
        ElMessage.success('登录成功')
        router.push('/orders')
      } catch (err) {
        console.error('登录失败:', err)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.login-header h2 {
  margin: 0;
  color: #303133;
}

.login-btn {
  width: 100%;
}

.login-tips {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 13px;
}

.login-tips p {
  margin: 0 0 12px 0;
}

.tips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
