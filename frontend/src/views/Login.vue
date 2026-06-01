<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>🚚 同城货运调度平台</span>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" label-width="80px" @submit.prevent>
            <el-form-item label="手机号">
              <el-input v-model="loginForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password @keyup.enter="handleLogin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="button" @click="handleLogin" style="width: 100%" :loading="loginLoading">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" label-width="80px" @submit.prevent>
            <el-form-item label="手机号">
              <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="registerForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="registerForm.role" placeholder="请选择角色" style="width: 100%">
                <el-option label="货主" value="shipper" />
                <el-option label="司机" value="driver" />
              </el-select>
            </el-form-item>
            <el-form-item label="公司名称">
              <el-input v-model="registerForm.company_name" placeholder="企业用户请填写" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="button" @click="handleRegister" style="width: 100%" :loading="registerLoading">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div class="test-accounts">
        <p>测试账号：</p>
        <p>货主：13800138001 / 123456</p>
        <p>司机：13800138002 / 123456</p>
        <p>管理员：13800138003 / 123456</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api'

const router = useRouter()
const activeTab = ref('login')
const loginLoading = ref(false)
const registerLoading = ref(false)
const loginForm = ref({
  phone: '13800138001',
  password: '123456'
})
const registerForm = ref({
  phone: '',
  password: '',
  name: '',
  role: 'shipper',
  company_name: ''
})

const handleLogin = async () => {
  console.log('[Login] 点击登录按钮')
  if (!loginForm.value.phone || !loginForm.value.password) {
    console.log('[Login] 缺少手机号或密码')
    ElMessage.warning('请输入手机号和密码')
    return
  }
  loginLoading.value = true
  try {
    console.log('[Login] 发送登录请求:', loginForm.value.phone)
    const res = await authAPI.login({
      phone: loginForm.value.phone,
      password: loginForm.value.password
    })
    console.log('[Login] API 返回:', res)
    if (res && res.success && res.data) {
      const userData = res.data
      try {
        localStorage.setItem('user', JSON.stringify(userData))
        console.log('[Login] 已写入 localStorage:', localStorage.getItem('user'))
      } catch (storageErr) {
        console.error('[Login] localStorage 错误:', storageErr)
        ElMessage.error('浏览器存储异常，请检查浏览器隐私设置')
        return
      }
      ElMessage.success('登录成功，正在跳转...')
      try {
        console.log('[Login] 开始跳转到 /dashboard')
        await router.push('/dashboard')
        console.log('[Login] 跳转完成')
      } catch (navErr) {
        console.error('[Login] 导航错误:', navErr)
        ElMessage.error('页面跳转失败，请手动刷新页面')
      }
    } else {
      console.log('[Login] 登录失败，res:', res)
      ElMessage.error((res && res.message) || '登录失败，请检查账号密码')
    }
  } catch (e) {
    console.error('[Login] 捕获异常:', e)
    if (e.response) {
      const status = e.response.status
      if (status === 401) {
        ElMessage.error('账号或密码错误')
      } else if (status === 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error('登录失败：' + (e.response.data?.message || '请求错误'))
      }
    } else if (e.request) {
      ElMessage.error('网络错误，请检查后端服务是否启动')
    } else {
      ElMessage.error('登录异常：' + e.message)
    }
  } finally {
    loginLoading.value = false
  }
}

const handleRegister = async () => {
  if (!registerForm.value.phone || !registerForm.value.password || !registerForm.value.name) {
    ElMessage.warning('请填写完整的注册信息')
    return
  }
  registerLoading.value = true
  try {
    const res = await authAPI.register(registerForm.value)
    if (res && res.success) {
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      loginForm.value.phone = registerForm.value.phone
      loginForm.value.password = ''
    } else {
      ElMessage.error((res && res.message) || '注册失败')
    }
  } catch (e) {
    console.error('Register error:', e)
    ElMessage.error('网络错误，请检查后端服务是否启动')
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
}
.card-header {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}
.test-accounts {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
}
.test-accounts p {
  margin: 4px 0;
}
</style>
