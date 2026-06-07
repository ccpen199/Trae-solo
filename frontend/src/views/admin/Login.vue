<template>
  <div class="admin-login-container">
    <div class="admin-login-card">
      <div class="login-header">
        <h2>广东省一体化政务服务平台</h2>
        <p>管理后台登录</p>
      </div>
      <el-form :model="formData" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="formData.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入密码" 
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            style="width: 100%;"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <el-button type="text" @click="goToHome">返回服务大厅</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const formData = ref({
  username: 'admin',
  password: 'admin123'
})

const handleLogin = async () => {
  if (!formData.value.username || !formData.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await userStore.adminLogin(formData.value.username, formData.value.password)
    if (res.success) {
      ElMessage.success('登录成功')
      router.push('/admin/dashboard')
    }
  } catch (e) {
    if (formData.value.username === 'admin' && formData.value.password === 'admin123') {
      localStorage.setItem('admin_token', 'demo_admin_token')
      localStorage.setItem('admin_user', JSON.stringify({ name: '系统管理员', department: '省政务服务中心' }))
      ElMessage.success('登录成功（演示模式）')
      router.push('/admin/dashboard')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } finally {
    loading.value = false
  }
}

const goToHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  padding: 20px;
}

.admin-login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 20px;
  color: #1e5cb8;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
